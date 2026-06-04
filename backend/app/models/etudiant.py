# ============================================
# models/etudiant.py
# Modèles Pydantic pour la validation des données
# ============================================
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date
import re


class EtudiantCreer(BaseModel):
    """
    Modèle pour la création d'un étudiant.
    Tous les champs sont obligatoires.
    """
    code:           str = Field(..., min_length=6, max_length=6)
    numero:         str = Field(..., min_length=7, max_length=7)
    nom:            str = Field(..., min_length=2)
    prenom:         str = Field(..., min_length=3)
    date_naissance: date
    classe:         str

    @field_validator('code')
    @classmethod
    def valider_code(cls, v):
        """
        Le code doit respecter : 3 lettres majuscules + 3 chiffres
        Exemple : AAD004
        """
        if not re.match(r'^[A-Z]{3}[0-9]{3}$', v):
            raise ValueError(
                'Le code doit contenir 3 lettres majuscules '
                'suivies de 3 chiffres. Exemple : AAD004'
            )
        return v

    @field_validator('numero')
    @classmethod
    def valider_numero(cls, v):
        """
        Le numéro doit contenir uniquement lettres
        majuscules et chiffres, longueur exacte 7.
        Exemple : H5G32YR
        """
        if not re.match(r'^[A-Z0-9]{7}$', v.upper()):
            raise ValueError(
                'Le numéro doit contenir 7 caractères '
                'alphanumériques. Exemple : H5G32YR'
            )
        return v.upper()

    @field_validator('nom')
    @classmethod
    def valider_nom(cls, v):
        if not v[0].isalpha():
            raise ValueError('Le nom doit commencer par une lettre')
        return v

    @field_validator('prenom')
    @classmethod
    def valider_prenom(cls, v):
        if not v[0].isalpha():
            raise ValueError('Le prénom doit commencer par une lettre')
        return v


class EtudiantModifier(BaseModel):
    """
    Modèle pour la modification d'un étudiant.
    Tous les champs sont optionnels — on ne modifie
    que ce qui est envoyé.
    """
    nom:            Optional[str] = Field(default=None, min_length=2)
    prenom:         Optional[str] = Field(default=None, min_length=3)
    date_naissance: Optional[date] = None
    classe:         Optional[str] = None

    # Note : on ne permet pas de modifier code et numero
    # car ce sont des identifiants métier
