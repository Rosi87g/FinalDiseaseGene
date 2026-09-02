# This file defines the SQLAlchemy ORM models for the Disease-Gene Map application, including User, Disease, Gene, Variant, and their relationships.
from sqlalchemy import String, Float, Text, Integer, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime
from typing import List, Optional
from app.db.session import Base

# =====================================================================
# JUNCTION TABLES (MANY-TO-MANY RELATIONSHIPS)
# =====================================================================

class FavoriteGene(Base):
    __tablename__ = "favorite_genes"
    
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    gene_id: Mapped[str] = mapped_column(String(50), ForeignKey("genes.gene_id", ondelete="CASCADE"), primary_key=True)


class FavoriteDisease(Base):
    __tablename__ = "favorite_diseases"
    
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    disease_id: Mapped[str] = mapped_column(String(50), ForeignKey("diseases.disease_id", ondelete="CASCADE"), primary_key=True)


# =====================================================================
# CORE APPLICATION MODELS
# =====================================================================

class User(Base):
    __tablename__ = "users"
    
    user_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True
    )
    
    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    role: Mapped[str] = mapped_column(
        String(50),
        default="Researcher",
        nullable=False
    ) # Roles matrix standard values: Guest, Researcher, Admin
    
    email_verified: Mapped[bool] = mapped_column(
        default=False
    )
    
    verification_code: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    
    # Relationships
    saved_searches: Mapped[List["SavedSearch"]] = relationship(
        "SavedSearch",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    favorite_genes: Mapped[List["Gene"]] = relationship(
        "Gene",
        secondary="favorite_genes",
        back_populates="favorited_by"
    )
    
    favorite_diseases: Mapped[List["Disease"]] = relationship(
        "Disease",
        secondary="favorite_diseases",
        back_populates="favorited_by"
    )


class SavedSearch(Base):
    __tablename__ = "saved_searches"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    query: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="saved_searches")


class Disease(Base):
    __tablename__ = "diseases"
    
    disease_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    disease_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    icd_code: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Relationships
    associations: Mapped[List["DiseaseGeneAssociation"]] = relationship(
        "DiseaseGeneAssociation", back_populates="disease", cascade="all, delete-orphan"
    )
    favorited_by: Mapped[List["User"]] = relationship(
        "User", secondary="favorite_diseases", back_populates="favorite_diseases"
    )

    __table_args__ = (
        Index("idx_diseases_category", "category"),
    )


class Gene(Base):
    __tablename__ = "genes"
    
    gene_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    gene_symbol: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    gene_name: Mapped[str] = mapped_column(String(255), nullable=False)
    chromosome: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    function: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    protein: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Relationships
    associations: Mapped[List["DiseaseGeneAssociation"]] = relationship(
        "DiseaseGeneAssociation", back_populates="gene", cascade="all, delete-orphan"
    )
    variants: Mapped[List["Variant"]] = relationship(
        "Variant", back_populates="gene", cascade="all, delete-orphan"
    )
    favorited_by: Mapped[List["User"]] = relationship(
        "User", secondary="favorite_genes", back_populates="favorite_genes"
    )

    __table_args__ = (
        Index("idx_genes_chromosome", "chromosome"),
        Index("idx_genes_function", "function"),
    )


class Variant(Base):
    __tablename__ = "variants"
    
    variant_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    gene_id: Mapped[str] = mapped_column(String(50), ForeignKey("genes.gene_id", ondelete="CASCADE"), nullable=False, index=True)
    variant_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mutation_type: Mapped[str] = mapped_column(String(100), nullable=False)
    clinical_significance: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    # Relationships
    gene: Mapped["Gene"] = relationship("Gene", back_populates="variants")

    __table_args__ = (
        Index("idx_variants_gene_sig", "gene_id", "clinical_significance"),
    )


class DiseaseGeneAssociation(Base):
    __tablename__ = "disease_gene_associations"
    
    association_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    gene_id: Mapped[str] = mapped_column(String(50), ForeignKey("genes.gene_id", ondelete="CASCADE"), nullable=False, index=True)
    disease_id: Mapped[str] = mapped_column(String(50), ForeignKey("diseases.disease_id", ondelete="CASCADE"), nullable=False, index=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    evidence_level: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Relationships
    gene: Mapped["Gene"] = relationship("Gene", back_populates="associations")
    disease: Mapped["Disease"] = relationship("Disease", back_populates="associations")

    __table_args__ = (
        UniqueConstraint("gene_id", "disease_id", name="uq_gene_disease"),
        Index("idx_assoc_score_level", "confidence_score", "evidence_level"),
    )


class Pathway(Base):
    __tablename__ = "pathways"
    
    pathway_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    pathway_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


# =====================================================================
# ALIAS — lets ingest.py import "Association" without any changes
# =====================================================================

Association = DiseaseGeneAssociation


# =====================================================================
# NEW MODELS — DrugTarget and Publication
# =====================================================================

class DrugTarget(Base):
    __tablename__ = "drug_targets"

    drug_target_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    gene_id: Mapped[str] = mapped_column(String(50), ForeignKey("genes.gene_id", ondelete="CASCADE"), nullable=False, index=True)
    drug_name: Mapped[str] = mapped_column(String(255), nullable=False)
    indication: Mapped[str] = mapped_column(String(255), nullable=True) # Added this



class Publication(Base):
    __tablename__ = "publications"

    publication_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    journal: Mapped[str] = mapped_column(String(255), nullable=False)
    year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gene_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        ForeignKey("genes.gene_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relationships
    gene: Mapped[Optional["Gene"]] = relationship("Gene")

class UserUpload(Base):
    __tablename__ = "user_uploads"

    upload_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    dataset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dataset_type: Mapped[str] = mapped_column(String(50), nullable=False)  # genes/diseases/variants/custom
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user: Mapped["User"] = relationship("User")