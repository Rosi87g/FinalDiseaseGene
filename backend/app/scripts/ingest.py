import os
import sys
import logging
import json
import time
from typing import Dict, List, Set, Any, Tuple
import pandas as pd
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from os.path import abspath, dirname
sys.path.insert(0, dirname(dirname(dirname(abspath(__file__)))))

from app.db.session import SessionLocal, engine
from app.db.models import Disease, Gene, Variant, DiseaseGeneAssociation, Pathway, Association, DrugTarget, Publication
from app.config import settings
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("etl_ingestion.log", mode="w")
    ]
)
logger = logging.getLogger("etl_pipeline")

class IngestionReport:
    def __init__(self):
        self.stats = {
            "diseases": {"total": 0, "success": 0, "failed": 0, "skipped": 0},
            "genes": {"total": 0, "success": 0, "failed": 0, "skipped": 0},
            "variants": {"total": 0, "success": 0, "failed": 0, "skipped": 0},
            "associations": {"total": 0, "success": 0, "failed": 0, "skipped": 0},
            "pathways": {"total": 0, "success": 0, "failed": 0, "skipped": 0},
            "drug_targets": {"total": 0, "success": 0, "failed": 0, "skipped": 0},
            "publications": {"total": 0, "success": 0, "failed": 0, "skipped": 0},
        }
        self.rejected_records: Dict[str, List[Dict[str, Any]]] = {
            "diseases": [],
            "genes": [],
            "variants": [],
            "associations": [],
            "pathways": [],
            "drug_targets": [],
            "publications": [],
        }

    def add_rejected(self, dataset: str, row: Dict[str, Any], reason: str):
        self.stats[dataset]["failed"] += 1
        self.rejected_records[dataset].append({
            "record": row,
            "reason": reason
        })

    def print_summary(self):
        logger.info("========================================")
        logger.info("         ETL INGESTION REPORT           ")
        logger.info("========================================")
        for k, v in self.stats.items():
            logger.info(f"Dataset '{k}':")
            logger.info(f"  - Total processed: {v['total']}")
            logger.info(f"  - Successfully imported/updated: {v['success']}")
            logger.info(f"  - Rejected / Failed: {v['failed']}")
        logger.info("========================================")

    def save_report(self, path: str = "etl_report.json"):
        with open(path, "w") as f:
            json.dump({
                "stats": self.stats,
                "rejections": self.rejected_records
            }, f, indent=2)
        logger.info(f"Detailed data quality report saved to: {path}")

class DiseaseGeneMapIngester:
    def __init__(self, data_dir: str, db_session: Session):
        self.data_dir = data_dir
        self.db = db_session
        self.report = IngestionReport()
        
        self.valid_gene_ids: Set[str] = set()
        self.valid_disease_ids: Set[str] = set()
        
        self.es = Elasticsearch(settings.ELASTICSEARCH_URL)

    def _load_existing_keys(self):
        logger.info("Loading existing primary keys from database for integrity checks...")
        genes = self.db.query(Gene.gene_id).all()
        diseases = self.db.query(Disease.disease_id).all()
        self.valid_gene_ids = {g[0] for g in genes}
        self.valid_disease_ids = {d[0] for d in diseases}
        logger.info(f"Pre-loaded {len(self.valid_gene_ids)} genes and {len(self.valid_disease_ids)} diseases from DB.")

    def ingest_diseases(self, file_name: str = "diseases_500.csv"):
        file_path = os.path.join(self.data_dir, file_name)
        logger.info(f"Starting ingestion of diseases from: {file_path}")
        if not os.path.exists(file_path):
            logger.error(f"Diseases file not found: {file_path}")
            return
        
        df = pd.read_csv(file_path)
        self.report.stats["diseases"]["total"] = len(df)
        
        records_to_upsert = []
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            disease_id = str(row_dict.get("disease_id", "")).strip()
            name = str(row_dict.get("disease_name", "")).strip()
            category = str(row_dict.get("category", "")).strip()
            icd_code = str(row_dict.get("icd_code", "")).strip()
            
            if not disease_id or not name or not category or not icd_code:
                self.report.add_rejected("diseases", row_dict, "Missing required fields")
                continue
                
            records_to_upsert.append({
                "disease_id": disease_id,
                "disease_name": name,
                "category": category,
                "icd_code": icd_code
            })
            self.valid_disease_ids.add(disease_id)
            
        if records_to_upsert:
            batch_size = 500
            for i in range(0, len(records_to_upsert), batch_size):
                batch = records_to_upsert[i:i+batch_size]
                stmt = insert(Disease).values(batch)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["disease_id"],
                    set_={
                        "disease_name": stmt.excluded.disease_name,
                        "category": stmt.excluded.category,
                        "icd_code": stmt.excluded.icd_code
                    }
                )
                self.db.execute(stmt)
            self.db.commit()
            self.report.stats["diseases"]["success"] = len(records_to_upsert)
            logger.info(f"Diseases batch ingestion completed. Imported/updated {len(records_to_upsert)} records.")

    def ingest_genes(self, file_name: str = "genes_1500.csv"):
        file_path = os.path.join(self.data_dir, file_name)
        logger.info(f"Starting ingestion of genes from: {file_path}")
        if not os.path.exists(file_path):
            logger.error(f"Genes file not found: {file_path}")
            return
            
        df = pd.read_csv(file_path)
        self.report.stats["genes"]["total"] = len(df)
        
        records_to_upsert = []
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            gene_id = str(row_dict.get("gene_id", "")).strip()
            symbol = str(row_dict.get("gene_symbol", "")).strip()
            name = str(row_dict.get("gene_name", "")).strip()
            chromosome = str(row_dict.get("chromosome", "")).strip()
            function = str(row_dict.get("function", "")).strip()
            protein = str(row_dict.get("protein", "")).strip()
            
            if not gene_id or not symbol or not name or not chromosome or not function or not protein:
                self.report.add_rejected("genes", row_dict, "Missing required fields")
                continue
                
            records_to_upsert.append({
                "gene_id": gene_id,
                "gene_symbol": symbol,
                "gene_name": name,
                "chromosome": chromosome,
                "function": function,
                "protein": protein
            })
            self.valid_gene_ids.add(gene_id)
            
        if records_to_upsert:
            batch_size = 500
            for i in range(0, len(records_to_upsert), batch_size):
                batch = records_to_upsert[i:i+batch_size]
                stmt = insert(Gene).values(batch)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["gene_id"],
                    set_={
                        "gene_symbol": stmt.excluded.gene_symbol,
                        "gene_name": stmt.excluded.gene_name,
                        "chromosome": stmt.excluded.chromosome,
                        "function": stmt.excluded.function,
                        "protein": stmt.excluded.protein
                    }
                )
                self.db.execute(stmt)
            self.db.commit()
            self.report.stats["genes"]["success"] = len(records_to_upsert)
            logger.info(f"Genes batch ingestion completed. Imported/updated {len(records_to_upsert)} records.")

    def ingest_variants(self, file_name: str = "variants_2000.csv"):
        file_path = os.path.join(self.data_dir, file_name)
        logger.info(f"Starting ingestion of variants from: {file_path}")
        if not os.path.exists(file_path):
            logger.error(f"Variants file not found: {file_path}")
            return
            
        df = pd.read_csv(file_path)
        self.report.stats["variants"]["total"] = len(df)
        
        records_to_upsert = []
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            variant_id = str(row_dict.get("variant_id", "")).strip()
            gene_id = str(row_dict.get("gene_id", "")).strip()
            name = str(row_dict.get("variant_name", "")).strip()
            mutation_type = str(row_dict.get("mutation_type", "")).strip()
            clinical_significance = str(row_dict.get("clinical_significance", "")).strip()
            
            if not variant_id or not gene_id or not name or not mutation_type or not clinical_significance:
                self.report.add_rejected("variants", row_dict, "Missing required fields")
                continue
                
            if gene_id not in self.valid_gene_ids:
                self.report.add_rejected("variants", row_dict, f"Referential integrity failure: gene_id '{gene_id}' does not exist")
                continue
                
            records_to_upsert.append({
                "variant_id": variant_id,
                "gene_id": gene_id,
                "variant_name": name,
                "mutation_type": mutation_type,
                "clinical_significance": clinical_significance
            })
            
        if records_to_upsert:
            batch_size = 500
            for i in range(0, len(records_to_upsert), batch_size):
                batch = records_to_upsert[i:i+batch_size]
                stmt = insert(Variant).values(batch)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["variant_id"],
                    set_={
                        "gene_id": stmt.excluded.gene_id,
                        "variant_name": stmt.excluded.variant_name,
                        "mutation_type": stmt.excluded.mutation_type,
                        "clinical_significance": stmt.excluded.clinical_significance
                    }
                )
                self.db.execute(stmt)
            self.db.commit()
            self.report.stats["variants"]["success"] = len(records_to_upsert)
            logger.info(f"Variants batch ingestion completed. Imported/updated {len(records_to_upsert)} records.")

    def ingest_associations(self, file_name: str = "associations_10000.csv"):
        file_path = os.path.join(self.data_dir, file_name)
        logger.info(f"Starting ingestion of associations from: {file_path}")
        if not os.path.exists(file_path):
            logger.error(f"Associations file not found: {file_path}")
            return
            
        df = pd.read_csv(file_path)
        self.report.stats["associations"]["total"] = len(df)
        
        records_to_upsert = []
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            assoc_id = str(row_dict.get("association_id", "")).strip()
            gene_id = str(row_dict.get("gene_id", "")).strip()
            disease_id = str(row_dict.get("disease_id", "")).strip()
            score_raw = row_dict.get("confidence_score")
            evidence_level = str(row_dict.get("evidence_level", "")).strip()
            
            if not assoc_id or not gene_id or not disease_id or score_raw is None or not evidence_level:
                self.report.add_rejected("associations", row_dict, "Missing required fields")
                continue
                
            try:
                score = float(score_raw)
                if not (0.0 <= score <= 1.0):
                    raise ValueError("Confidence score must be between 0.0 and 1.0")
            except ValueError as e:
                self.report.add_rejected("associations", row_dict, f"Invalid confidence_score: {e}")
                continue
                
            if gene_id not in self.valid_gene_ids:
                self.report.add_rejected("associations", row_dict, f"Referential integrity failure: gene_id '{gene_id}' does not exist")
                continue
            if disease_id not in self.valid_disease_ids:
                self.report.add_rejected("associations", row_dict, f"Referential integrity failure: disease_id '{disease_id}' does not exist")
                continue
                
            records_to_upsert.append({
                "association_id": assoc_id,
                "gene_id": gene_id,
                "disease_id": disease_id,
                "confidence_score": score,
                "evidence_level": evidence_level
            })
            
        if records_to_upsert:
            batch_size = 500
            for i in range(0, len(records_to_upsert), batch_size):
                batch = records_to_upsert[i:i+batch_size]
                stmt = insert(Association).values(batch)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["association_id"],
                    set_={
                        "gene_id": stmt.excluded.gene_id,
                        "disease_id": stmt.excluded.disease_id,
                        "confidence_score": stmt.excluded.confidence_score,
                        "evidence_level": stmt.excluded.evidence_level
                    }
                )
                self.db.execute(stmt)
            self.db.commit()
            self.report.stats["associations"]["success"] = len(records_to_upsert)
            logger.info(f"Associations batch ingestion completed. Imported/updated {len(records_to_upsert)} records.")

    def ingest_pathways(self, file_name: str = "pathways_300.csv"):
        file_path = os.path.join(self.data_dir, file_name)
        logger.info(f"Starting ingestion of pathways from: {file_path}")
        if not os.path.exists(file_path):
            logger.error(f"Pathways file not found: {file_path}")
            return
            
        df = pd.read_csv(file_path)
        self.report.stats["pathways"]["total"] = len(df)
        
        records_to_upsert = []
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            pathway_id = str(row_dict.get("pathway_id", "")).strip()
            name = str(row_dict.get("pathway_name", "")).strip()
            description = row_dict.get("description", "")
            description = str(description).strip() if pd.notna(description) else None
            
            if not pathway_id or not name:
                self.report.add_rejected("pathways", row_dict, "Missing required fields")
                continue
                
            records_to_upsert.append({
                "pathway_id": pathway_id,
                "pathway_name": name,
                "description": description
            })
            
        if records_to_upsert:
            batch_size = 500
            for i in range(0, len(records_to_upsert), batch_size):
                batch = records_to_upsert[i:i+batch_size]
                stmt = insert(Pathway).values(batch)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["pathway_id"],
                    set_={
                        "pathway_name": stmt.excluded.pathway_name,
                        "description": stmt.excluded.description
                    }
                )
                self.db.execute(stmt)
            self.db.commit()
            self.report.stats["pathways"]["success"] = len(records_to_upsert)
            logger.info(f"Pathways batch ingestion completed. Imported/updated {len(records_to_upsert)} records.")

    # -------------------------------------------------------------------------
    # UPDATED: Drug targets with column renaming for CSV compatibility
    # -------------------------------------------------------------------------
    def ingest_drug_targets(self, file_name: str = "drug_targets_500.csv"):
        file_path = os.path.join(self.data_dir, file_name)
        logger.info(f"Starting ingestion of drug targets from: {file_path}")
        if not os.path.exists(file_path):
            logger.warning(f"Drug targets file not found: {file_path}")
            return

        df = pd.read_csv(file_path)
        
        # Add this renaming step to fix the mismatch between CSV and model
        df = df.rename(columns={
            "drug_id": "drug_target_id",
            "target_gene_id": "gene_id"
        })
       
        self.report.stats["drug_targets"]["total"] = len(df)
        records_to_upsert = []
        
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            # Now use the standardized names after renaming
            drug_target_id = str(row_dict.get("drug_target_id", "")).strip()
            gene_id = str(row_dict.get("gene_id", "")).strip()
            drug_name = str(row_dict.get("drug_name", "")).strip()
            indication = str(row_dict.get("indication", "")).strip()
            
            if not drug_target_id or not gene_id or not drug_name:
                self.report.add_rejected("drug_targets", row_dict, "Missing required fields")
                continue
                
            if gene_id not in self.valid_gene_ids:
                self.report.add_rejected("drug_targets", row_dict, f"Referential integrity failure: gene_id '{gene_id}' does not exist")
                continue
                
            records_to_upsert.append({
                "drug_target_id": drug_target_id,
                "gene_id": gene_id,
                "drug_name": drug_name,
                "indication": indication,
            })
       
        if records_to_upsert:
            batch_size = 500
            for i in range(0, len(records_to_upsert), batch_size):
                batch = records_to_upsert[i:i+batch_size]
                stmt = insert(DrugTarget).values(batch)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["drug_target_id"],
                    set_={
                        "gene_id": stmt.excluded.gene_id,
                        "drug_name": stmt.excluded.drug_name,
                        "indication": stmt.excluded.indication,
                    }
                )
                self.db.execute(stmt)
            self.db.commit()
            self.report.stats["drug_targets"]["success"] = len(records_to_upsert)
            logger.info(f"Drug targets batch ingestion completed. Imported/updated {len(records_to_upsert)} records.")

    def ingest_publications(self, file_name: str = "publications_1000.csv"):
        file_path = os.path.join(self.data_dir, file_name)
        logger.info(f"Starting ingestion of publications from: {file_path}")
        if not os.path.exists(file_path):
            logger.error(f"Publications file not found: {file_path}")
            return

        df = pd.read_csv(file_path)
        self.report.stats["publications"]["total"] = len(df)

        records_to_upsert = []
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            publication_id = str(row_dict.get("publication_id", "")).strip()
            title          = str(row_dict.get("title", "")).strip()
            abstract       = row_dict.get("abstract", "")
            abstract       = str(abstract).strip() if pd.notna(abstract) else None
            journal        = str(row_dict.get("journal", "")).strip()
            year_raw       = row_dict.get("year")
            gene_id        = str(row_dict.get("gene_id", "")).strip() or None

            if not publication_id or not title or not journal:
                self.report.add_rejected("publications", row_dict, "Missing required fields")
                continue

            try:
                year = int(year_raw) if year_raw is not None and pd.notna(year_raw) else None
            except (ValueError, TypeError):
                self.report.add_rejected("publications", row_dict, f"Invalid year value: {year_raw}")
                continue

            if gene_id and gene_id not in self.valid_gene_ids:
                self.report.add_rejected(
                    "publications", row_dict,
                    f"Referential integrity failure: gene_id '{gene_id}' does not exist"
                )
                continue

            records_to_upsert.append({
                "publication_id": publication_id,
                "title":          title,
                "abstract":       abstract,
                "journal":        journal,
                "year":           year,
                "gene_id":        gene_id,
            })

        if records_to_upsert:
            batch_size = 500
            for i in range(0, len(records_to_upsert), batch_size):
                batch = records_to_upsert[i:i+batch_size]
                stmt = insert(Publication).values(batch)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["publication_id"],
                    set_={
                        "title":    stmt.excluded.title,
                        "abstract": stmt.excluded.abstract,
                        "journal":  stmt.excluded.journal,
                        "year":     stmt.excluded.year,
                        "gene_id":  stmt.excluded.gene_id,
                    }
                )
                self.db.execute(stmt)
            self.db.commit()
            self.report.stats["publications"]["success"] = len(records_to_upsert)
            logger.info(f"Publications batch ingestion completed. Imported/updated {len(records_to_upsert)} records.")

    def run_all(self):
        start_time = time.time()
        logger.info("Initializing ETL Pipeline execution...")
        
        self._load_existing_keys()
        
        # Independent entities first, dependents second
        self.ingest_diseases()
        self.ingest_genes()
        self.ingest_pathways()
        self.ingest_variants()
        self.ingest_associations()
        self.ingest_drug_targets()
        self.ingest_publications()
        
        # Elasticsearch indexing
        try:
            if self.es.ping():
                logger.info("Elasticsearch detected. Starting indexing...")
                self.index_to_elasticsearch()
            else:
                logger.warning("Elasticsearch is offline. Skipping indexing (SQL data is still saved).")
        except Exception as e:
            logger.warning(f"Could not connect to Elasticsearch: {e}. Skipping indexing.")
        
        elapsed_time = time.time() - start_time
        logger.info(f"ETL execution completed in {elapsed_time:.2f} seconds.")
        self.report.print_summary()
        self.report.save_report()

    def index_to_elasticsearch(self):
        logger.info("Starting Elasticsearch indexing...")
        try:
            if not self.es.ping():
                logger.error("Elasticsearch ping failed. Indexing skipped.")
                return
        except Exception as e:
            logger.error(f"Elasticsearch connection check failed: {e}. Indexing skipped.")
            return

        index_name = "clinical_data"
        try:
            if self.es.indices.exists(index=index_name):
                self.es.indices.delete(index=index_name)
        except Exception as e:
            logger.warning(f"Could not check/delete existing index: {e}")
        
        mappings = {
            "mappings": {
                "properties": {
                    "id":                   {"type": "keyword"},
                    "type":                 {"type": "keyword"},
                    "symbol":               {"type": "text", "analyzer": "standard", "fields": {"keyword": {"type": "keyword"}}},
                    "name":                 {"type": "text", "analyzer": "standard"},
                    "category":             {"type": "keyword"},
                    "chromosome":           {"type": "keyword"},
                    "function":             {"type": "text"},
                    "protein":              {"type": "text"},
                    "icd_code":             {"type": "keyword"},
                    "mutation_type":        {"type": "keyword"},
                    "clinical_significance":{"type": "keyword"},
                    "description":          {"type": "text"},
                    "gene_id":              {"type": "keyword"},
                    "disease_id":           {"type": "keyword"},
                    "confidence_score":     {"type": "float"},
                    "evidence_level":       {"type": "keyword"},
                    "drug_name":            {"type": "text", "analyzer": "standard"},
                    "indication":           {"type": "text"},
                    "title":                {"type": "text", "analyzer": "standard"},
                    "abstract":             {"type": "text"},
                    "journal":              {"type": "keyword"},
                    "year":                 {"type": "integer"},
                    "suggest":              {"type": "completion"}
                }
            }
        }
        self.es.indices.create(index=index_name, body=mappings)

        actions = []
        
        # Genes
        genes = self.db.query(Gene).all()
        for g in genes:
            actions.append({
                "_index": index_name,
                "_id": f"gene_{g.gene_id}",
                "_source": {
                    "id": g.gene_id,
                    "type": "gene",
                    "symbol": g.gene_symbol,
                    "name": g.gene_name,
                    "chromosome": g.chromosome,
                    "function": g.function,
                    "protein": g.protein,
                    "suggest": [g.gene_symbol, g.gene_name]
                }
            })
            
        # Diseases
        diseases = self.db.query(Disease).all()
        for d in diseases:
            actions.append({
                "_index": index_name,
                "_id": f"disease_{d.disease_id}",
                "_source": {
                    "id": d.disease_id,
                    "type": "disease",
                    "name": d.disease_name,
                    "category": d.category,
                    "icd_code": d.icd_code,
                    "suggest": [d.disease_name, d.icd_code]
                }
            })

        # Variants
        variants = self.db.query(Variant).all()
        for v in variants:
            actions.append({
                "_index": index_name,
                "_id": f"variant_{v.variant_id}",
                "_source": {
                    "id": v.variant_id,
                    "type": "variant",
                    "name": v.variant_name,
                    "mutation_type": v.mutation_type,
                    "clinical_significance": v.clinical_significance,
                    "suggest": [v.variant_name]
                }
            })

        # Pathways
        pathways = self.db.query(Pathway).all()
        for p in pathways:
            actions.append({
                "_index": index_name,
                "_id": f"pathway_{p.pathway_id}",
                "_source": {
                    "id": p.pathway_id,
                    "type": "pathway",
                    "name": p.pathway_name,
                    "description": p.description,
                    "suggest": [p.pathway_name]
                }
            })

        # Associations
        associations = self.db.query(Association).all()
        for a in associations:
            actions.append({
                "_index": index_name,
                "_id": f"assoc_{a.association_id}",
                "_source": {
                    "id": a.association_id,
                    "type": "association",
                    "name": f"Association {a.association_id}",
                    "gene_id": a.gene_id,
                    "disease_id": a.disease_id,
                    "confidence_score": a.confidence_score,
                    "evidence_level": a.evidence_level,
                    "description": f"Gene {a.gene_id} → Disease {a.disease_id} (score: {a.confidence_score}, evidence: {a.evidence_level})",
                    "suggest": [a.gene_id, a.disease_id]
                }
            })

        # Drug targets
        drug_targets = self.db.query(DrugTarget).all()
        for dt in drug_targets:
            actions.append({
                "_index": index_name,
                "_id": f"drug_target_{dt.drug_target_id}",
                "_source": {
                    "id": dt.drug_target_id,
                    "type": "drug_target",
                    "name": dt.drug_name,
                    "gene_id": dt.gene_id,
                    "indication": dt.indication,
                    "description": f"Drug: {dt.drug_name} | Indication: {dt.indication} | Gene: {dt.gene_id}",
                    "suggest": [dt.drug_name, dt.gene_id]
                }
            })

        # Publications
        publications = self.db.query(Publication).all()
        for pub in publications:
            actions.append({
                "_index": index_name,
                "_id": f"pub_{pub.publication_id}",
                "_source": {
                    "id": pub.publication_id,
                    "type": "publication",
                    "name": pub.title,
                    "title": pub.title,
                    "abstract": pub.abstract,
                    "journal": pub.journal,
                    "year": pub.year,
                    "gene_id": pub.gene_id,
                    "description": f"{pub.journal} ({pub.year}) — {pub.abstract or 'No abstract'}",
                    "suggest": [pub.title, pub.journal]
                }
            })

        if actions:
            success, failed = bulk(self.es, actions)
            logger.info(f"Elasticsearch indexing completed: {success} succeeded, {len(failed) if isinstance(failed, list) else failed} failed.")


def main():
    script_dir = dirname(dirname(dirname(abspath(__file__))))
    default_data_dir = os.path.join(script_dir, "data")
    data_directory = os.getenv("ETL_DATA_DIR") or default_data_dir
    logger.info(f"Configured dataset source directory: {data_directory}")
    
    db = SessionLocal()
    try:
        ingester = DiseaseGeneMapIngester(data_dir=data_directory, db_session=db)
        ingester.run_all()
    except Exception as e:
        logger.error(f"ETL script execution encountered an unhandled exception: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()