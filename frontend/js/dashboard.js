// ============================================
// dashboard.js — Logique du tableau de bord
// ============================================

const API = 'http://localhost:8000/api/v1';

// Palette de couleurs cohérente
const COULEURS = [
    '#2563eb', '#16a34a', '#dc2626', '#d97706',
    '#7c3aed', '#0891b2', '#be185d', '#65a30d',
    '#c2410c', '#1d4ed8', '#15803d', '#b91c1c',
    '#b45309', '#6d28d9', '#0e7490', '#9d174d'
];

// ── Initialisation ──
document.addEventListener('DOMContentLoaded', () => {
    chargerTout();
});

async function chargerTout() {
    try {
        const [globales, classes, top10] = await Promise.all([
            fetch(`${API}/stats/globales`).then(r => r.json()),
            fetch(`${API}/stats/classes`).then(r => r.json()),
            fetch(`${API}/stats/top-moyennes`).then(r => r.json())
        ]);

        afficherKPI(globales);
        afficherChartClasses(classes);
        afficherChartSources(globales);
        afficherChartValidite(globales);
        afficherChartMoyennes(classes);
        afficherChartTop10(top10);

    } catch (err) {
        console.error('Erreur chargement dashboard', err);
        document.getElementById('kpi-container').innerHTML =
            `<p style="color:#dc2626">
                Erreur de chargement des données
            </p>`;
    }
}

// ============================================
// KPI
// ============================================

function afficherKPI(data) {
    const kpis = [
        {
            label:  'Total général',
            valeur: data.total_general,
            couleur: '#2563eb',
            icone:  '👥'
        },
        {
            label:  'En base (DB)',
            valeur: data.total_db,
            couleur: '#16a34a',
            icone:  '🗄️'
        },
        {
            label:  'Fichier JSON',
            valeur: data.total_json,
            couleur: '#d97706',
            icone:  '📄'
        },
        {
            label:  'Actifs',
            valeur: data.total_actifs,
            couleur: '#0891b2',
            icone:  '✅'
        },
        {
            label:  'Archivés',
            valeur: data.total_archives,
            couleur: '#7c3aed',
            icone:  '📦'
        },
        {
            label:  'Valides',
            valeur: data.total_valides,
            couleur: '#15803d',
            icone:  '✔️'
        },
        {
            label:  'Invalides',
            valeur: data.total_invalides,
            couleur: '#dc2626',
            icone:  '❌'
        }
    ];

    document.getElementById('kpi-container').innerHTML =
        kpis.map(k => `
            <div class="card" style="text-align:center;
                 border-top:4px solid ${k.couleur};
                 padding:20px 12px;">
                <div style="font-size:28px; margin-bottom:6px;">
                    ${k.icone}
                </div>
                <div style="font-size:32px; font-weight:700;
                            color:${k.couleur};">
                    ${k.valeur}
                </div>
                <div style="font-size:12px; color:#64748b;
                            margin-top:4px; font-weight:500;">
                    ${k.label}
                </div>
            </div>
        `).join('');
}

// ============================================
// GRAPHIQUES
// ============================================

function afficherChartClasses(classes) {
    // Filtrer les classes qui ont des étudiants
    const avecEtudiants = classes.filter(c => c.nb_etudiants > 0);

    new Chart(
        document.getElementById('chartClasses'), {
        type: 'bar',
        data: {
            labels:   avecEtudiants.map(c => c.libelle_classe),
            datasets: [{
                label:           'Nombre d\'étudiants',
                data:            avecEtudiants.map(c => c.nb_etudiants),
                backgroundColor: COULEURS,
                borderRadius:    6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function afficherChartSources(data) {
    new Chart(
        document.getElementById('chartSources'), {
        type: 'doughnut',
        data: {
            labels: ['PostgreSQL (DB)', 'Fichier JSON'],
            datasets: [{
                data: [data.total_db, data.total_json],
                backgroundColor: ['#2563eb', '#d97706'],
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20 }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const total = data.total_general;
                            const pct = total > 0
                                ? ((ctx.raw / total) * 100).toFixed(1)
                                : 0;
                            return ` ${ctx.raw} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function afficherChartValidite(data) {
    new Chart(
        document.getElementById('chartValidite'), {
        type: 'pie',
        data: {
            labels: ['Valides', 'Invalides'],
            datasets: [{
                data: [data.total_valides, data.total_invalides],
                backgroundColor: ['#16a34a', '#dc2626'],
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 20 }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const total = data.total_valides
                                        + data.total_invalides;
                            const pct = total > 0
                                ? ((ctx.raw / total) * 100).toFixed(1)
                                : 0;
                            return ` ${ctx.raw} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function afficherChartMoyennes(classes) {
    const avecMoyenne = classes.filter(c => c.moyenne_classe > 0);

    new Chart(
        document.getElementById('chartMoyennes'), {
        type: 'bar',
        data: {
            labels:   avecMoyenne.map(c => c.libelle_classe),
            datasets: [{
                label:           'Moyenne générale',
                data:            avecMoyenne.map(c => c.moyenne_classe),
                backgroundColor: avecMoyenne.map(c =>
                    c.moyenne_classe >= 10 ? '#16a34a' : '#dc2626'
                ),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 20,
                    ticks: { stepSize: 2 }
                }
            }
        }
    });
}

function afficherChartTop10(top10) {
    new Chart(
        document.getElementById('chartTop10'), {
        type: 'bar',
        data: {
            labels: top10.map(e =>
                `${e.nom_complet} (${e.libelle_classe})`
            ),
            datasets: [{
                label:           'Moyenne générale',
                data:            top10.map(e => e.moyenne_generale),
                backgroundColor: top10.map((_, i) =>
                    i === 0 ? '#d97706' :
                    i === 1 ? '#94a3b8' :
                    i === 2 ? '#c2410c' :
                    '#2563eb'
                ),
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',  // Barres horizontales
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx =>
                            ` Moyenne : ${ctx.raw}/20`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 20,
                    ticks: { stepSize: 2 }
                }
            }
        }
    });
}
