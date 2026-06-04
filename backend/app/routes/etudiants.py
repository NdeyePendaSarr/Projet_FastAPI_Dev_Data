# ============================================
# routes/etudiants.py
# Routes API pour les étudiants
# ============================================
from fastapi import APIRouter, HTTPException, Query
from app.services import etudiant_service

router = APIRouter()


@router.get("/etudiants")
def liste_etudiants(
    page:      int  = Query(default=1,  ge=1),
    limite:    int  = Query(default=5,  ge=1, le=100),
    recherche: str  = Query(default=None),
    classe:    str  = Query(default=None),
    archive:   bool = Query(default=False)
):
    """
    Retourne une liste paginée d'étudiants.
    Paramètres :
    - page     : numéro de page (défaut 1)
    - limite   : lignes par page (défaut 5)
    - recherche: filtre par nom, prénom, numéro ou code
    - classe   : filtre par classe
    - archive  : afficher les archivés (défaut False)
    """
    etudiants = etudiant_service.lister_etudiants(
        page=page,
        limite=limite,
        recherche=recherche,
        classe=classe,
        archive=archive
    )

    total = etudiant_service.compter_etudiants(
        recherche=recherche,
        classe=classe,
        archive=archive
    )

    return {
        "data": etudiants,
        "pagination": {
            "page":         page,
            "limite":       limite,
            "total":        total,
            "total_pages":  -(-total // limite)  # arrondi supérieur
        }
    }


@router.get("/etudiants/{id_etudiant}")
def detail_etudiant(id_etudiant: int):
    """
    Retourne un étudiant complet avec toutes ses notes.
    """
    etudiant = etudiant_service.get_etudiant_par_id(id_etudiant)

    if etudiant is None:
        raise HTTPException(
            status_code=404,
            detail=f"Étudiant {id_etudiant} introuvable"
        )

    return etudiant
