// ============================================
// app.js — Logique principale du frontend
// ============================================

const API = 'http://localhost:8000/api/v1';

// ── État global de l'application ──
const etat = {
    page:      1,
    limite:    5,
    recherche: '',
    classe:    '',
    source:    'tous',   // 'tous', 'db', 'json'
    archive:   false,
    total:     0,
    totalPages: 0,
    selection: new Set()  // numéros cochés pour import
};

// ── Initialisation au chargement ──
document.addEventListener('DOMContentLoaded', () => {
    chargerClasses();
    chargerDonnees();
    attacherEvenements();
});

// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

async function chargerDonnees() {
    afficherChargement(true);

    try {
        // 1. Charger les données DB
        const params = new URLSearchParams({
            page:   etat.page,
            limite: etat.limite
        });
        if (etat.recherche) params.append('recherche', etat.recherche);
        if (etat.classe)    params.append('classe',    etat.classe);
        if (etat.archive)   params.append('archive',   'true');

        const repDB = await fetch(`${API}/etudiants?${params}`);
        const dataDB = await repDB.json();

        let etudiants  = dataDB.data;
        let total      = dataDB.pagination.total;
        let totalPages = dataDB.pagination.total_pages;

        // 2. Compléter avec JSON si moins de 5 résultats DB
        //    (uniquement si pas de filtre archive et source != 'db')
        if (etudiants.length < etat.limite
            && !etat.archive
            && etat.source !== 'db') {

            const manquants = etat.limite - etudiants.length;
            const repJSON = await fetch(
                `${API}/json/etudiants?page=1&limite=${manquants}`
            );
            const dataJSON = await repJSON.json();

            // Filtrer par recherche côté client si nécessaire
            let jsonFiltres = dataJSON.data;
            if (etat.recherche) {
                const terme = etat.recherche.toLowerCase();
                jsonFiltres = jsonFiltres.filter(e =>
                    e.nom.toLowerCase().includes(terme)    ||
                    e.prenom.toLowerCase().includes(terme) ||
                    e.numero.toLowerCase().includes(terme) ||
                    e.code.toLowerCase().includes(terme)
                );
            }
            if (etat.classe) {
                jsonFiltres = jsonFiltres.filter(
                    e => e.classe === etat.classe
                );
            }

            etudiants  = [...etudiants, ...jsonFiltres];
            total      = total + dataJSON.pagination.total;
            totalPages = Math.ceil(total / etat.limite) || 1;
        }

        // 3. Filtrer par source si demandé
        if (etat.source === 'db') {
            etudiants = etudiants.filter(e => e.origine === 'DB');
        } else if (etat.source === 'json') {
            etudiants = etudiants.filter(e => e.origine === 'JSON');
        }

        // 4. Mettre à jour l'état
        etat.total      = total;
        etat.totalPages = totalPages;

        // 5. Afficher
        afficherTableau(etudiants);
        afficherPagination();
        afficherInfo(total);

    } catch (err) {
        console.error(err);
        afficherErreur('Impossible de charger les données');
    } finally {
        afficherChargement(false);
    }
}

async function chargerClasses() {
    try {
        const rep = await fetch(`${API}/etudiants?limite=200`);
        const data = await rep.json();
        const classes = [
            ...new Set(data.data.map(e => e.libelle_classe))
        ].sort();

        const select = document.getElementById('filtreClasse');
        classes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Erreur chargement classes', err);
    }
}

// ============================================
// AFFICHAGE
// ============================================

function afficherTableau(etudiants) {
    const tbody = document.getElementById('tbody');

    if (etudiants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center;
                    padding:40px; color:#64748b;">
                    Aucun étudiant trouvé
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = etudiants.map(e => {
        const estJSON    = e.origine === 'JSON';
        const badgeClass = estJSON ? 'badge-json' : 'badge-db';
        const badgeTexte = estJSON ? 'JSON' : 'DB';

        // Calculer moyenne générale pour les données JSON
        let moyenne = e.moyenne_generale;
        if (moyenne === undefined && e.notes) {
            const moyennes = Object.values(e.notes)
                .map(n => n.moyenne);
            moyenne = moyennes.length
                ? (moyennes.reduce((a,b) => a+b, 0)
                   / moyennes.length).toFixed(2)
                : '-';
        }

        return `
        <tr data-id="${e.id_etudiant || ''}"
            data-numero="${e.numero}"
            data-origine="${e.origine}">
            <td>
                <input type="checkbox"
                    class="cb-selection"
                    data-numero="${e.numero}"
                    ${estJSON ? '' : 'disabled'}
                    ${etat.selection.has(e.numero) ? 'checked' : ''}>
            </td>
            <td>${e.code}</td>
            <td>${e.numero}</td>
            <td>${e.nom}</td>
            <td>${e.prenom}</td>
            <td>${formaterDate(e.date_naissance)}</td>
            <td>${e.libelle_classe || e.classe}</td>
            <td>${moyenne ?? '-'}</td>
            <td><span class="badge ${badgeClass}">${badgeTexte}</span></td>
            <td>
                ${!estJSON ? `
                <button class="btn btn-outline btn-sm"
                    onclick="ouvrirModification(${e.id_etudiant})">
                    ✏️
                </button>
                <button class="btn btn-danger btn-sm"
                    onclick="archiverEtudiant(${e.id_etudiant})">
                    🗄️
                </button>
                ` : `
                <span style="color:#94a3b8; font-size:12px;">
                    Lecture seule
                </span>
                `}
            </td>
        </tr>`;
    }).join('');

    // Attacher les événements checkbox
    document.querySelectorAll('.cb-selection').forEach(cb => {
        cb.addEventListener('change', e => {
            const numero = e.target.dataset.numero;
            if (e.target.checked) {
                etat.selection.add(numero);
            } else {
                etat.selection.delete(numero);
            }
            majBoutonImport();
        });
    });
}

function afficherPagination() {
    const conteneur = document.getElementById('pagination');
    const { page, totalPages } = etat;

    let html = '';

    // Bouton précédent
    html += `<button class="page-btn"
        onclick="changerPage(${page - 1})"
        ${page <= 1 ? 'disabled' : ''}>‹</button>`;

    // Numéros de pages
    const debut = Math.max(1, page - 2);
    const fin   = Math.min(totalPages, page + 2);

    if (debut > 1) {
        html += `<button class="page-btn"
            onclick="changerPage(1)">1</button>`;
        if (debut > 2) {
            html += `<span style="padding:0 4px">…</span>`;
        }
    }

    for (let i = debut; i <= fin; i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}"
            onclick="changerPage(${i})">${i}</button>`;
    }

    if (fin < totalPages) {
        if (fin < totalPages - 1) {
            html += `<span style="padding:0 4px">…</span>`;
        }
        html += `<button class="page-btn"
            onclick="changerPage(${totalPages})">
            ${totalPages}</button>`;
    }

    // Bouton suivant
    html += `<button class="page-btn"
        onclick="changerPage(${page + 1})"
        ${page >= totalPages ? 'disabled' : ''}>›</button>`;

    conteneur.innerHTML = html;
}

function afficherInfo(total) {
    const debut = (etat.page - 1) * etat.limite + 1;
    const fin   = Math.min(etat.page * etat.limite, total);
    document.getElementById('paginationInfo').textContent =
        total > 0
        ? `Affichage ${debut}–${fin} sur ${total} étudiants`
        : 'Aucun résultat';
}

function afficherChargement(actif) {
    document.getElementById('loading').style.display =
        actif ? 'block' : 'none';
    document.getElementById('tableWrapper').style.display =
        actif ? 'none' : 'block';
}

function afficherErreur(msg) {
    document.getElementById('tbody').innerHTML = `
        <tr><td colspan="10" style="text-align:center;
            color:#dc2626; padding:40px;">${msg}</td></tr>`;
}

// ============================================
// INTERACTIONS
// ============================================

function changerPage(page) {
    if (page < 1 || page > etat.totalPages) return;
    etat.page = page;
    chargerDonnees();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function majBoutonImport() {
    const btn = document.getElementById('btnImporter');
    if (!btn) return;
    btn.disabled   = etat.selection.size === 0;
    btn.textContent =
        etat.selection.size > 0
        ? `⬆️ Importer (${etat.selection.size})`
        : '⬆️ Importer sélection';
}

async function importerSelection() {
    if (etat.selection.size === 0) return;

    const numeros = [...etat.selection];
    try {
        const rep = await fetch(`${API}/import/json`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(numeros)
        });
        const resultat = await rep.json();

        afficherToast(
            `${resultat.total_importes} étudiant(s) importé(s)`,
            'success'
        );
        etat.selection.clear();
        majBoutonImport();
        chargerDonnees();

    } catch (err) {
        afficherToast('Erreur lors de l\'import', 'error');
    }
}

async function archiverEtudiant(id) {
    if (!confirm('Archiver cet étudiant ?')) return;

    try {
        const rep = await fetch(
            `${API}/etudiants/${id}/archive`,
            { method: 'POST' }
        );
        if (rep.ok) {
            afficherToast('Étudiant archivé', 'success');
            chargerDonnees();
        } else {
            const err = await rep.json();
            afficherToast(err.detail, 'error');
        }
    } catch (err) {
        afficherToast('Erreur archivage', 'error');
    }
}

// ============================================
// ÉVÉNEMENTS
// ============================================

function attacherEvenements() {
    // Recherche avec délai (évite trop de requêtes)
    let timer;
    document.getElementById('recherche')
        .addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                etat.recherche = e.target.value;
                etat.page = 1;
                chargerDonnees();
            }, 400);
        });

    // Filtre classe
    document.getElementById('filtreClasse')
        .addEventListener('change', e => {
            etat.classe = e.target.value;
            etat.page = 1;
            chargerDonnees();
        });

    // Filtre source
    document.getElementById('filtreSource')
        .addEventListener('change', e => {
            etat.source = e.target.value;
            etat.page = 1;
            chargerDonnees();
        });

    // Nombre de lignes par page
    document.getElementById('limitePage')
        .addEventListener('change', e => {
            etat.limite = parseInt(e.target.value);
            etat.page = 1;
            chargerDonnees();
        });

    // Toggle archives
    document.getElementById('toggleArchive')
        .addEventListener('click', () => {
            etat.archive = !etat.archive;
            etat.page = 1;
            const btn = document.getElementById('toggleArchive');
            btn.textContent = etat.archive
                ? '📋 Actifs'
                : '🗄️ Archives';
            btn.className = etat.archive
                ? 'btn btn-warning'
                : 'btn btn-outline';
            chargerDonnees();
        });
}

// ============================================
// UTILITAIRES
// ============================================

function formaterDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
}

function afficherToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className   = `toast ${type} show`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Exposer les fonctions globales
window.changerPage       = changerPage;
window.importerSelection = importerSelection;
window.archiverEtudiant  = archiverEtudiant;
