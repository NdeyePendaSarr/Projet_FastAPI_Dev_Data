# ============================================
# routes/import_json.py
# Route pour importer des étudiants JSON → DB
# ============================================
from fastapi import APIRouter
from app.services.json_service import importer_selection

router = APIRouter()


@router.post("/import/json")
def importer_depuis_json(numeros: list[str]):
    """
    Importe une sélection d'étudiants depuis valides.json
    vers PostgreSQL.

    Le client envoie une liste de numéros à importer :
    ["LIHGFR0", "40DKG6T", "44DSW78"]

    Les doublons sont détectés automatiquement.
    """
    resultats = importer_selection(numeros)
    return resultats
