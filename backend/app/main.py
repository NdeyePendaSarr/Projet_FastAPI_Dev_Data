# ============================================
# main.py
# Point d'entrée de l'application FastAPI
# ============================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import etudiants, stats
from app.routes import etudiants, stats, import_json
# Création de l'application FastAPI
app = FastAPI(
    title="DEV DATA P8 - API",
    description="API de gestion des étudiants",
    version="1.0.0"
)

# Configuration CORS
# Permet au frontend (HTML/JS) d'appeler l'API
# même s'ils ne sont pas sur le même port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrement des routes
app.include_router(etudiants.router, prefix="/api/v1")
app.include_router(stats.router,     prefix="/api/v1")
app.include_router(import_json.router, prefix="/api/v1")

@app.get("/api/v1/health")
def health_check():
    """
    Route de vérification — confirme que le serveur
    et la base de données sont opérationnels.
    """
    try:
        from app.database.connection import get_connection
        conn = get_connection()
        conn.close()
        return {
            "status": "ok",
            "message": "Serveur et base de données opérationnels"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
