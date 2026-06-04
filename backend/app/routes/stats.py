# ============================================
# routes/stats.py
# Routes dashboard et statistiques
# Sera complété au Jour 7
# ============================================
from fastapi import APIRouter

router = APIRouter()


@router.get("/stats/health")
def stats_health():
    """
    Route temporaire — sera remplacée au Jour 7
    """
    return {"message": "Stats à venir au Jour 7"}
