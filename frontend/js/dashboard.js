// ============================================
// dashboard.js
// ============================================

const API = 'http://localhost:8000/api/v1';

Chart.defaults.color          = '#64748b';
Chart.defaults.borderColor    = 'rgba(255,255,255,0.05)';
Chart.defaults.font.family    = "'DM Sans', sans-serif";
Chart.defaults.font.size      = 12;

const PALETTE = [
    '#6366f1','#22d3ee','#10b981','#f59e0b',
    '#f43f5e','#8b5cf6','#06b6d4','#84cc16',
    '#fb923c','#e879f9','#34d399','#fbbf24'
];

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
        console.error('Erreur dashboard', err);
    }
}

function afficherKPI(data) {
    const kpis = [
        {
            label:  'Total général',
            valeur: data.total_general,
            icone:  '👥',
            color:  '#6366f1',
            bg:     'rgba(99,102,241,0.1)'
        },
        {
            label:  'Base de données',
            valeur: data.total_db,
            icone:  '🗄',
            color:  '#22d3ee',
            bg:     'rgba(34,211,238,0.1)'
        },
        {
            label:  'Fichier JSON',
            valeur: data.total_json,
            icone:  '📄',
            color:  '#f59e0b',
            bg:     'rgba(245,158,11,0.1)'
        },
        {
            label:  'Actifs',
            valeur: data.total_actifs,
            icone:  '✓',
            color:  '#10b981',
            bg:     'rgba(16,185,129,0.1)'
        },
        {
            label:  'Archivés',
            valeur: data.total_archives,
            icone:  '📦',
            color:  '#8b5cf6',
            bg:     'rgba(139,92,246,0.1)'
        },
        {
            label:  'Valides',
            valeur: data.total_valides,
            icone:  '✔',
            color:  '#10b981',
            bg:     'rgba(16,185,129,0.1)'
        },
        {
            label:  'Invalides',
            valeur: data.total_invalides,
            icone:  '✗',
            color:  '#ef4444',
            bg:     'rgba(239,68,68,0.1)'
        }
    ];

    document.getElementById('kpi-container').innerHTML =
        kpis.map(k => `
            <div class="kpi-card"
                 style="--accent-color:${k.color};
                        --accent-bg:${k.bg}">
                <div class="kpi-icon">${k.icone}</div>
                <div class="kpi-value"
                     style="color:${k.color}">${k.valeur}</div>
                <div class="kpi-label">${k.label}</div>
            </div>
        `).join('');
}

function chartOpts(extra = {}) {
    return {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1a2235',
                borderColor:     'rgba(255,255,255,0.1)',
                borderWidth:     1,
                titleColor:      '#f1f5f9',
                bodyColor:       '#94a3b8',
                padding:         10,
                cornerRadius:    8
            }
        },
        ...extra
    };
}

function afficherChartClasses(classes) {
    const data = classes.filter(c => c.nb_etudiants > 0);
    new Chart(document.getElementById('chartClasses'), {
        type: 'bar',
        data: {
            labels:   data.map(c => c.libelle_classe),
            datasets: [{
                data:            data.map(c => c.nb_etudiants),
                backgroundColor: data.map((_, i) =>
                    PALETTE[i % PALETTE.length] + '99'
                ),
                borderColor:     data.map((_, i) =>
                    PALETTE[i % PALETTE.length]
                ),
                borderWidth:  1,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: chartOpts({
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#64748b', font: { size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: {
                        color: '#64748b',
                        stepSize: 1,
                        font: { size: 11 }
                    },
                    beginAtZero: true
                }
            }
        })
    });
}

function afficherChartSources(data) {
    new Chart(document.getElementById('chartSources'), {
        type: 'doughnut',
        data: {
            labels: ['PostgreSQL', 'JSON'],
            datasets: [{
                data: [data.total_db, data.total_json],
                backgroundColor: ['#6366f1', '#f59e0b'],
                borderColor:     ['#6366f1', '#f59e0b'],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    display:  true,
                    position: 'bottom',
                    labels: {
                        color:     '#64748b',
                        padding:   16,
                        font:      { size: 12 },
                        usePointStyle: true,
                        pointStyleWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: '#1a2235',
                    borderColor:     'rgba(255,255,255,0.1)',
                    borderWidth:     1,
                    titleColor:      '#f1f5f9',
                    bodyColor:       '#94a3b8',
                    padding:         10,
                    cornerRadius:    8
                }
            }
        }
    });
}

function afficherChartValidite(data) {
    new Chart(document.getElementById('chartValidite'), {
        type: 'pie',
        data: {
            labels: ['Valides', 'Invalides'],
            datasets: [{
                data: [data.total_valides, data.total_invalides],
                backgroundColor: ['#10b981', '#ef4444'],
                borderColor:     ['#10b981', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display:  true,
                    position: 'bottom',
                    labels: {
                        color:   '#64748b',
                        padding: 16,
                        font:    { size: 12 },
                        usePointStyle:    true,
                        pointStyleWidth:  8
                    }
                },
                tooltip: {
                    backgroundColor: '#1a2235',
                    borderColor:     'rgba(255,255,255,0.1)',
                    borderWidth:     1,
                    titleColor:      '#f1f5f9',
                    bodyColor:       '#94a3b8',
                    padding:         10,
                    cornerRadius:    8
                }
            }
        }
    });
}

function afficherChartMoyennes(classes) {
    const data = classes.filter(c => c.moyenne_classe > 0);
    new Chart(document.getElementById('chartMoyennes'), {
        type: 'bar',
        data: {
            labels:   data.map(c => c.libelle_classe),
            datasets: [{
                data:            data.map(c => c.moyenne_classe),
                backgroundColor: data.map(c =>
                    c.moyenne_classe >= 10
                        ? 'rgba(16,185,129,0.6)'
                        : 'rgba(239,68,68,0.6)'
                ),
                borderColor: data.map(c =>
                    c.moyenne_classe >= 10 ? '#10b981' : '#ef4444'
                ),
                borderWidth:   1,
                borderRadius:  6,
                borderSkipped: false
            }]
        },
        options: chartOpts({
            scales: {
                x: {
                    grid:  { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#64748b', font: { size: 11 } }
                },
                y: {
                    grid:  { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#64748b', font: { size: 11 } },
                    beginAtZero: true,
                    max: 20,
                    suggestedMin: 0
                }
            }
        })
    });
}

function afficherChartTop10(top10) {
    new Chart(document.getElementById('chartTop10'), {
        type: 'bar',
        data: {
            labels: top10.map(e =>
                `${e.nom_complet} · ${e.libelle_classe}`
            ),
            datasets: [{
                data:            top10.map(e => e.moyenne_generale),
                backgroundColor: top10.map((_, i) => [
                    '#f59e0b','#94a3b8','#cd7c44',
                    '#6366f1','#6366f1','#6366f1',
                    '#6366f1','#6366f1','#6366f1','#6366f1'
                ][i] + 'cc'),
                borderColor: top10.map((_, i) => [
                    '#f59e0b','#94a3b8','#cd7c44',
                    '#6366f1','#6366f1','#6366f1',
                    '#6366f1','#6366f1','#6366f1','#6366f1'
                ][i]),
                borderWidth:   1,
                borderRadius:  6,
                borderSkipped: false
            }]
        },
        options: chartOpts({
            indexAxis: 'y',
            scales: {
                x: {
                    grid:  { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#64748b', font: { size: 11 } },
                    beginAtZero: true,
                    max: 20
                },
                y: {
                    grid:  { display: false },
                    ticks: { color: '#94a3b8', font: { size: 12 } }
                }
            }
        })
    });
}