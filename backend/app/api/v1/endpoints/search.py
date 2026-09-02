from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from elasticsearch import Elasticsearch
from app.api import deps
from app.config import settings
from app.db.models import Gene, Disease, Variant, Pathway, Association, DrugTarget, Publication
from typing import List, Optional, Dict, Any

router = APIRouter()

@router.get("/")
def search(
    q: str = Query("", description="Search query string"),
    type: Optional[str] = Query(None, description="Filter by type (gene, disease, variant, pathway, association, drug_target, publication)"),
    db: Session = Depends(deps.get_db)
):
    es = Elasticsearch(settings.ELASTICSEARCH_URL)
    results = []
    
    use_es = False
    try:
        if q.strip():
            if es.ping():
                use_es = True
    except Exception:
        pass
        
    if use_es:
        must_queries = []
        if q:
            must_queries.append({
                "multi_match": {
                    "query": q,
                    "fields": [
                        "symbol^3", "name^2", "title^2",
                        "chromosome", "function", "protein",
                        "icd_code", "mutation_type", "clinical_significance",
                        "description", "drug_name^2", "action", "phase",
                        "abstract", "journal", "gene_id", "disease_id",
                        "evidence_level"
                    ],
                    "fuzziness": "AUTO"
                }
            })
        
        filter_queries = []
        if type:
            filter_queries.append({"term": {"type": type}})
            
        body = {
            "query": {
                "bool": {
                    "must": must_queries,
                    "filter": filter_queries
                }
            },
            "highlight": {
                "pre_tags": ["<mark class='bg-indigo-500/30 text-indigo-300 px-0.5 rounded'>"],
                "post_tags": ["</mark>"],
                "fields": {
                    "symbol":               {},
                    "name":                 {},
                    "title":                {},
                    "function":             {},
                    "protein":              {},
                    "description":          {},
                    "clinical_significance":{},
                    "drug_name":            {},
                    "abstract":             {},
                }
            },
            "size": 50
        }
        
        try:
            res = es.search(index="clinical_data", body=body)
            hits = res["hits"]["hits"]
            for hit in hits:
                source = hit["_source"]
                highlights = hit.get("highlight", {})
                
                item_type = source["type"]
                title = ""
                description = ""

                if item_type == "gene":
                    title = f"{source.get('symbol')} - {source.get('name')}"
                    description = f"Chromosome {source.get('chromosome')} • Function: {source.get('function')} • Protein: {source.get('protein')}"
                elif item_type == "disease":
                    title = source.get("name", "")
                    description = f"Category: {source.get('category')} • ICD Code: {source.get('icd_code')}"
                elif item_type == "variant":
                    title = source.get("name", "")
                    description = f"Mutation: {source.get('mutation_type')} • Clinical Sig: {source.get('clinical_significance')}"
                elif item_type == "pathway":
                    title = source.get("name", "")
                    description = source.get("description") or "No description available."
                elif item_type == "association":
                    title = f"Gene {source.get('gene_id')} ↔ Disease {source.get('disease_id')}"
                    description = f"Confidence: {source.get('confidence_score')} • Evidence: {source.get('evidence_level')}"
                elif item_type == "drug_target":
                    title = source.get("name", "")
                    description = f"Indication: {source.get('indication', 'N/A')} • Gene: {source.get('gene_id')}"
                elif item_type == "publication":
                    title = source.get("title", "")
                    description = f"{source.get('journal')} ({source.get('year')}) • Gene: {source.get('gene_id') or 'N/A'}"
                    
                highlight_list = [val[0] for val in highlights.values()]
                    
                results.append({
                    "id":          source["id"],
                    "type":        item_type,
                    "score":       hit["_score"],
                    "title":       title,
                    "description": description,
                    "highlights":  highlight_list
                })
            return results
        except Exception as e:
            use_es = False
            
    if not use_es:
        term = f"%{q}%"
        all_types = ["gene", "disease", "variant", "pathway", "association", "drug_target", "publication"]
        types_to_search = [type] if type else all_types
        
        if "gene" in types_to_search:
            genes = db.query(Gene).filter(
                (Gene.gene_symbol.ilike(term)) |
                (Gene.gene_name.ilike(term)) |
                (Gene.function.ilike(term)) |
                (Gene.protein.ilike(term))
            ).limit(20).all()
            for g in genes:
                results.append({
                    "id":          g.gene_id,
                    "type":        "gene",
                    "score":       1.0,
                    "title":       f"{g.gene_symbol} - {g.gene_name}",
                    "description": f"Chromosome {g.chromosome} • Function: {g.function} • Protein: {g.protein}",
                    "highlights":  []
                })
                
        if "disease" in types_to_search:
            diseases = db.query(Disease).filter(
                (Disease.disease_name.ilike(term)) |
                (Disease.category.ilike(term)) |
                (Disease.icd_code.ilike(term))
            ).limit(20).all()
            for d in diseases:
                results.append({
                    "id":          d.disease_id,
                    "type":        "disease",
                    "score":       1.0,
                    "title":       d.disease_name,
                    "description": f"Category: {d.category} • ICD Code: {d.icd_code}",
                    "highlights":  []
                })
                
        if "variant" in types_to_search:
            variants = db.query(Variant).filter(
                (Variant.variant_name.ilike(term)) |
                (Variant.mutation_type.ilike(term)) |
                (Variant.clinical_significance.ilike(term))
            ).limit(20).all()
            for v in variants:
                results.append({
                    "id":          v.variant_id,
                    "type":        "variant",
                    "score":       1.0,
                    "title":       v.variant_name,
                    "description": f"Mutation: {v.mutation_type} • Clinical Sig: {v.clinical_significance}",
                    "highlights":  []
                })
                
        if "pathway" in types_to_search:
            pathways = db.query(Pathway).filter(
                (Pathway.pathway_name.ilike(term)) |
                (Pathway.description.ilike(term))
            ).limit(20).all()
            for p in pathways:
                results.append({
                    "id":          p.pathway_id,
                    "type":        "pathway",
                    "score":       1.0,
                    "title":       p.pathway_name,
                    "description": p.description or "No description available.",
                    "highlights":  []
                })

        if "association" in types_to_search:
            associations = db.query(Association).filter(
                (Association.gene_id.ilike(term)) |
                (Association.disease_id.ilike(term)) |
                (Association.evidence_level.ilike(term))
            ).limit(20).all()
            for a in associations:
                results.append({
                    "id":          a.association_id,
                    "type":        "association",
                    "score":       1.0,
                    "title":       f"Gene {a.gene_id} ↔ Disease {a.disease_id}",
                    "description": f"Confidence: {a.confidence_score} • Evidence: {a.evidence_level}",
                    "highlights":  []
                })

        if "drug_target" in types_to_search:
            drug_targets = db.query(DrugTarget).filter(
                (DrugTarget.drug_name.ilike(term)) |
                (DrugTarget.indication.ilike(term)) | # Replace 'action' and 'phase'
                (DrugTarget.gene_id.ilike(term))
            ).limit(20).all()
            for dt in drug_targets:
                results.append({
                    "id":          dt.drug_target_id,
                    "type":        "drug_target",
                    "score":       1.0,
                    "title":       dt.drug_name,
                    "description": f"Indication: {dt.indication or 'N/A'} • Gene: {dt.gene_id}",
                    "highlights":  []
                })

        if "publication" in types_to_search:
            publications = db.query(Publication).filter(
                (Publication.title.ilike(term)) |
                (Publication.abstract.ilike(term)) |
                (Publication.journal.ilike(term)) |
                (Publication.gene_id.ilike(term))
            ).limit(20).all()
            for pub in publications:
                results.append({
                    "id":          pub.publication_id,
                    "type":        "publication",
                    "score":       1.0,
                    "title":       pub.title,
                    "description": f"{pub.journal} ({pub.year}) • Gene: {pub.gene_id or 'N/A'}",
                    "highlights":  []
                })
                
    return results