# ============================================
# etudiant_service.py
# Logique métier — requêtes SQL pour les étudiants
# ============================================
from app.database.connection import get_connection


def compter_etudiants(recherche=None, classe=None, archive=False):
    """
    Compte le nombre total d'étudiants selon les filtres.
    Utilisé pour calculer le nombre de pages.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        conditions = ["e.est_archive = %s"]
        valeurs = [archive]

        if recherche:
            conditions.append(
                "(LOWER(e.nom) LIKE %s OR LOWER(e.prenom) LIKE %s "
                "OR LOWER(e.numero) LIKE %s OR LOWER(e.code) LIKE %s)"
            )
            terme = f"%{recherche.lower()}%"
            valeurs.extend([terme, terme, terme, terme])

        if classe:
            conditions.append("c.libelle_classe = %s")
            valeurs.append(classe)

        where = " AND ".join(conditions)

        cursor.execute(f"""
            SELECT COUNT(*)
            FROM etudiant e
            JOIN classe c ON e.id_classe = c.id_classe
            WHERE {where}
        """, valeurs)

        return cursor.fetchone()[0]

    finally:
        cursor.close()
        conn.close()


def lister_etudiants(page=1, limite=5, recherche=None,
                     classe=None, archive=False):
    """
    Retourne une page d'étudiants avec leurs informations.
    Inclut la moyenne générale calculée depuis resultat_matiere.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        offset = (page - 1) * limite

        conditions = ["e.est_archive = %s"]
        valeurs = [archive]

        if recherche:
            conditions.append(
                "(LOWER(e.nom) LIKE %s OR LOWER(e.prenom) LIKE %s "
                "OR LOWER(e.numero) LIKE %s OR LOWER(e.code) LIKE %s)"
            )
            terme = f"%{recherche.lower()}%"
            valeurs.extend([terme, terme, terme, terme])

        if classe:
            conditions.append("c.libelle_classe = %s")
            valeurs.append(classe)

        where = " AND ".join(conditions)

        # Requête principale avec moyenne générale
        cursor.execute(f"""
            SELECT
                e.id_etudiant,
                e.code,
                e.numero,
                e.nom,
                e.prenom,
                e.date_naissance,
                c.libelle_classe,
                e.est_archive,
                e.est_valide,
                e.source,
                e.created_at,
                ROUND(AVG(r.moyenne_matiere)::numeric, 2) AS moyenne_generale
            FROM etudiant e
            JOIN classe c ON e.id_classe = c.id_classe
            LEFT JOIN resultat_matiere r ON r.id_etudiant = e.id_etudiant
            WHERE {where}
            GROUP BY e.id_etudiant, e.code, e.numero, e.nom,
                     e.prenom, e.date_naissance, c.libelle_classe,
                     e.est_archive, e.est_valide, e.source, e.created_at
            ORDER BY e.nom, e.prenom
            LIMIT %s OFFSET %s
        """, valeurs + [limite, offset])

        colonnes = [desc[0] for desc in cursor.description]
        lignes = cursor.fetchall()

        # Convertir en liste de dictionnaires
        etudiants = []
        for ligne in lignes:
            etudiant = dict(zip(colonnes, ligne))
            # Convertir les types non-sérialisables en JSON
            etudiant['date_naissance'] = str(etudiant['date_naissance'])
            etudiant['created_at'] = str(etudiant['created_at'])
            etudiant['moyenne_generale'] = float(
                etudiant['moyenne_generale']
            ) if etudiant['moyenne_generale'] else None
            # Indiquer la source d'affichage
            etudiant['origine'] = 'DB'
            etudiants.append(etudiant)

        return etudiants

    finally:
        cursor.close()
        conn.close()


def get_etudiant_par_id(id_etudiant):
    """
    Retourne un étudiant complet avec toutes ses notes.
    """
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Informations de base
        cursor.execute("""
            SELECT
                e.id_etudiant, e.code, e.numero, e.nom, e.prenom,
                e.date_naissance, c.libelle_classe, e.est_archive,
                e.est_valide, e.source, e.created_at
            FROM etudiant e
            JOIN classe c ON e.id_classe = c.id_classe
            WHERE e.id_etudiant = %s
        """, (id_etudiant,))

        colonnes = [desc[0] for desc in cursor.description]
        ligne = cursor.fetchone()

        if ligne is None:
            return None

        etudiant = dict(zip(colonnes, ligne))
        etudiant['date_naissance'] = str(etudiant['date_naissance'])
        etudiant['created_at'] = str(etudiant['created_at'])
        etudiant['origine'] = 'DB'

        # Récupérer les notes par matière
        cursor.execute("""
            SELECT
                m.libelle_matiere,
                r.note_examen,
                r.moyenne_matiere,
                r.id_resultat
            FROM resultat_matiere r
            JOIN matiere m ON m.id_matiere = r.id_matiere
            WHERE r.id_etudiant = %s
            ORDER BY m.libelle_matiere
        """, (id_etudiant,))

        notes = {}
        for row in cursor.fetchall():
            matiere, examen, moyenne, id_resultat = row

            # Récupérer les devoirs de cette matière
            cursor.execute("""
                SELECT note_devoir FROM devoir
                WHERE id_resultat = %s
                ORDER BY id_devoir
            """, (id_resultat,))

            devoirs = [float(d[0]) for d in cursor.fetchall()]

            notes[matiere] = {
                "devoirs": devoirs,
                "examen": float(examen),
                "moyenne": float(moyenne)
            }

        etudiant['notes'] = notes
        return etudiant

    finally:
        cursor.close()
        conn.close()
