const API_BASE_URL = '/api';
let allMatches = [];
let allLeagues = [];
let currentView = 'top10';
let currentLeague = null;
let currentDateFilter = 'all';

// Chargement initial
async function loadData() {
    try {
        const [matchesRes, leaguesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/football/matches?status=SCHEDULED&hybrid=true`),
            fetch(`${API_BASE_URL}/football/leagues`)
        ]);

        if (!matchesRes.ok || !leaguesRes.ok) {
            throw new Error(`Erreur HTTP: ${matchesRes.status} / ${leaguesRes.status}`);
        }

        allMatches = await matchesRes.json();
        allLeagues = await leaguesRes.json();

        console.log(`Chargé: ${allMatches.length} matchs, ${allLeagues.length} ligues`);

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');

        createLeagueButtons();
        showView('top10');
        loadChatSuggestions();
    } catch (error) {
        console.error('Erreur:', error);
        showError(error.message);
    }
}

function createLeagueButtons() {
    const container = document.getElementById('league-buttons');
    
    // Bouton Top 10
    const top10Btn = document.createElement('button');
    top10Btn.className = 'league-nav-btn active';
    top10Btn.textContent = '🏆 Top 10';
    top10Btn.onclick = () => showView('top10', top10Btn);
    container.appendChild(top10Btn);
    
    // Boutons des ligues
    allLeagues.forEach(league => {
        const btn = document.createElement('button');
        btn.className = 'league-nav-btn';
        btn.textContent = league.name;
        btn.onclick = () => showLeague(league.id, btn);
        container.appendChild(btn);
    });
}

function switchMainTab(tabName, button) {
    // Désactiver tous les onglets
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    button.classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Charger les données si nécessaire
    if (tabName === 'history') {
        loadHistory();
    }
}

function showView(view, element) {
    currentView = view;
    
    document.querySelectorAll('.league-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }

    if (view === 'top10') {
        document.getElementById('date-filters').classList.add('hidden');
        displayTop10();
    }
}

function showLeague(leagueId, element) {
    currentView = 'league';
    currentLeague = leagueId;
    
    document.querySelectorAll('.league-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }

    document.getElementById('date-filters').classList.remove('hidden');
    displayLeagueMatches(leagueId);
}

function filterByDate(filter, element) {
    currentDateFilter = filter;
    
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }

    if (currentView === 'league' && currentLeague) {
        displayLeagueMatches(currentLeague);
    }
}

async function displayTop10() {
    const container = document.getElementById('matches-container');
    
    container.innerHTML = `
        <div class="section-title">
            <span class="text-3xl">🏆</span>
            <span>Top 10 Matchs les Plus Fiables</span>
            <span class="ml-auto text-sm opacity-90">Système Hybride (IA + ML)</span>
        </div>
        <div class="text-center py-8">
            <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p class="mt-4 text-gray-600">Chargement des prédictions hybrides...</p>
        </div>
    `;
    
    try {
        // Charger les prédictions hybrides depuis l'API avec un timeout de 60 secondes
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const response = await fetch(`${API_BASE_URL}/football/top10-hybrid`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        container.innerHTML = `
            <div class="section-title">
                <span class="text-3xl">🏆</span>
                <span>Top 10 Matchs les Plus Fiables</span>
                <span class="ml-auto text-sm opacity-90">Système Hybride (IA + ML)</span>
            </div>
        `;
        
        data.predictions.forEach((item, index) => {
            // Transformer le format de l'API Top 10 en format match standard
            const match = {
                ...item.match,
                hybrid_prediction: item.prediction,
                probable_scorers: item.prediction.probable_scorers
            };
            const card = createMatchCard(match, index + 1);
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement du Top 10 hybride:', error);
        container.innerHTML = `
            <div class="section-title">
                <span class="text-3xl">🏆</span>
                <span>Top 10 Matchs les Plus Fiables</span>
            </div>
            <div class="text-center py-8 text-red-600">
                <p>⚠️ Erreur lors du chargement des prédictions</p>
                <p class="text-sm mt-2">${error.message}</p>
            </div>
        `;
    }
}

function displayLeagueMatches(leagueId) {
    const container = document.getElementById('matches-container');
    const league = allLeagues.find(l => l.id === leagueId);
    
    if (!league) return;

    let matches = allMatches.filter(m => m.league.id === leagueId);

    // Appliquer le filtre de date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (currentDateFilter === 'today') {
        matches = matches.filter(m => {
            const matchDate = new Date(m.date);
            const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
            return matchDay.getTime() === today.getTime();
        });
    } else if (currentDateFilter === 'tomorrow') {
        matches = matches.filter(m => {
            const matchDate = new Date(m.date);
            const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
            return matchDay.getTime() === tomorrow.getTime();
        });
    }

    matches.sort((a, b) => new Date(a.date) - new Date(b.date));

    container.innerHTML = `
        <div class="section-title">
            <span class="text-3xl">${league.country === 'Europe' ? '🏆' : '⚽'}</span>
            <span>${league.name}</span>
            <span class="ml-auto text-sm opacity-90">${matches.length} match${matches.length > 1 ? 's' : ''}</span>
        </div>
    `;

    if (matches.length === 0) {
        container.innerHTML += '<div class="text-center py-12 text-gray-500 text-lg">Aucun match trouvé pour cette période</div>';
        return;
    }

    matches.forEach((match, index) => {
        const card = createMatchCard(match, index + 1);
        container.appendChild(card);
    });
}

function createMatchCard(match, number) {
    // Si une prédiction hybride est disponible, utiliser createHybridMatchCard
    if (match.hybrid_prediction) {
        return createHybridMatchCard({
            match: {
                id: match.id,
                home_team: typeof match.home_team === 'string' ? match.home_team : match.home_team.name,
                away_team: typeof match.away_team === 'string' ? match.away_team : match.away_team.name,
                date: match.date,
                league: typeof match.league === 'string' ? match.league : match.league.name,
                venue: match.venue
            },
            prediction: match.hybrid_prediction
        }, number);
    }
    
    // Sinon, utiliser l'ancien système
    const div = document.createElement('div');
    div.className = 'match-card p-4';

    const date = new Date(match.date);
    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const pred = match.predictions || {};
    
    const prob1 = Math.round((pred.prob_home_win || 0.33) * 100);
    const probX = Math.round((pred.prob_draw || 0.33) * 100);
    const prob2 = Math.round((pred.prob_away_win || 0.33) * 100);
    
    let pronoChoice = 'X';
    let maxProb = probX;
    
    if (prob1 > maxProb) {
        pronoChoice = '1';
        maxProb = prob1;
    }
    if (prob2 > maxProb) {
        pronoChoice = '2';
        maxProb = prob2;
    }

    div.innerHTML = `
        <div class="match-number">${number}</div>
        <div class="mb-3 flex items-center justify-between">
            <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                ${match.league.name}
            </span>
            <span class="text-sm text-gray-600">${dateStr} - ${timeStr}</span>
        </div>
        <div class="flex items-center justify-between mb-4">
            <div class="flex-1 text-center">
                <div class="text-xl font-bold text-gray-800">${match.home_team.name}</div>
            </div>
            <div class="px-4">
                <div class="prono-badge">
                    <div class="prono-choice">${pronoChoice}</div>
                    <div class="prono-prob">${maxProb}%</div>
                </div>
            </div>
            <div class="flex-1 text-center">
                <div class="text-xl font-bold text-gray-800">${match.away_team.name}</div>
            </div>
        </div>
        <div class="grid grid-cols-3 gap-3 mb-3">
            <div class="proba-box ${prob1 === maxProb ? 'winner' : ''}">
                <div class="proba-label">Victoire 1</div>
                <div class="proba-value">${prob1}%</div>
            </div>
            <div class="proba-box ${probX === maxProb ? 'winner' : ''}">
                <div class="proba-label">Match Nul</div>
                <div class="proba-value">${probX}%</div>
            </div>
            <div class="proba-box ${prob2 === maxProb ? 'winner' : ''}">
                <div class="proba-label">Victoire 2</div>
                <div class="proba-value">${prob2}%</div>
            </div>
        </div>
        ${match.ai_comment ? `
        <div class="mb-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded border border-purple-200">
            <div class="font-semibold text-purple-700 mb-2">🤖 Avis de l'IA:</div>
            <div class="text-sm text-gray-700 italic">${match.ai_comment}</div>
        </div>` : ''}
        <!-- Score et buts TRÈS VISIBLES -->
        <div class="mb-4 text-center">
            <div class="inline-block px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-400 rounded-xl shadow-lg">
                <div class="text-xs text-purple-600 font-semibold mb-1">SCORE PRÉDIT</div>
                <div class="text-3xl font-black text-purple-900 mb-1">${pred.predicted_score_home || 1}-${pred.predicted_score_away || 1}</div>
                <div class="text-sm font-bold text-pink-700">⚽ ${match.expected_goals ? match.expected_goals.toFixed(1) : '2.5'} buts attendus</div>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3 text-sm">
            <div class="text-center p-2 bg-gray-50 rounded">
                <div class="font-semibold text-gray-700">BTTS</div>
                <div class="text-lg font-bold ${(pred.prob_both_teams_score || 0.5) > 0.5 ? 'text-green-600' : 'text-gray-600'}">${Math.round((pred.prob_both_teams_score || 0.5) * 100)}%</div>
            </div>
            <div class="text-center p-2 bg-gray-50 rounded">
                <div class="font-semibold text-gray-700">Fiabilité</div>
                <div class="text-lg font-bold text-indigo-600">${pred.reliability_score || 0}/10</div>
            </div>
        </div>
        <div class="mb-3 p-3 bg-blue-50 rounded">
            <div class="font-semibold text-gray-700 mb-2">🎯 Probabilités de buts:</div>
            <div class="grid grid-cols-5 gap-2 text-xs">
                <div class="text-center p-2 bg-white rounded">
                    <div class="font-semibold">+0.5</div>
                    <div class="text-lg font-bold ${(match.prob_over_05 || 0.8) > 0.7 ? 'text-green-600' : 'text-gray-600'}">${Math.round((match.prob_over_05 || 0.8) * 100)}%</div>
                </div>
                <div class="text-center p-2 bg-white rounded">
                    <div class="font-semibold">+1.5</div>
                    <div class="text-lg font-bold ${(match.prob_over_15 || 0.65) > 0.6 ? 'text-green-600' : 'text-gray-600'}">${Math.round((match.prob_over_15 || 0.65) * 100)}%</div>
                </div>
                <div class="text-center p-2 bg-white rounded">
                    <div class="font-semibold">+2.5</div>
                    <div class="text-lg font-bold ${(pred.prob_over_2_5 || 0.5) > 0.5 ? 'text-green-600' : 'text-gray-600'}">${Math.round((pred.prob_over_2_5 || 0.5) * 100)}%</div>
                </div>
                <div class="text-center p-2 bg-white rounded">
                    <div class="font-semibold">+3.5</div>
                    <div class="text-lg font-bold ${(match.prob_over_35 || 0.3) > 0.4 ? 'text-green-600' : 'text-gray-600'}">${Math.round((match.prob_over_35 || 0.3) * 100)}%</div>
                </div>
                <div class="text-center p-2 bg-white rounded">
                    <div class="font-semibold">+4.5</div>
                    <div class="text-lg font-bold ${(match.prob_over_45 || 0.15) > 0.3 ? 'text-green-600' : 'text-gray-600'}">${Math.round((match.prob_over_45 || 0.15) * 100)}%</div>
                </div>
            </div>
        </div>
        ${match.probable_scorers ? `
        <div class="mb-3 p-3 bg-yellow-50 rounded border border-yellow-200">
            <div class="font-semibold text-gray-700 mb-2">⚽ Buteurs probables:</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <div class="font-semibold text-gray-600 mb-1">${match.home_team.name}:</div>
                    ${(() => {
                        try {
                            const scorers = typeof match.probable_scorers === 'string' ? JSON.parse(match.probable_scorers) : match.probable_scorers;
                            return scorers.home.map(s => `<div class="mb-1 px-2 py-1 bg-white rounded">${s.name} <span class="text-green-600 font-bold">${s.probability}%</span></div>`).join('');
                        } catch(e) { return ''; }
                    })()}
                </div>
                <div>
                    <div class="font-semibold text-gray-600 mb-1">${match.away_team.name}:</div>
                    ${(() => {
                        try {
                            const scorers = typeof match.probable_scorers === 'string' ? JSON.parse(match.probable_scorers) : match.probable_scorers;
                            return scorers.away.map(s => `<div class="mb-1 px-2 py-1 bg-white rounded">${s.name} <span class="text-green-600 font-bold">${s.probability}%</span></div>`).join('');
                        } catch(e) { return ''; }
                    })()}
                </div>
            </div>
        </div>` : ''}
        ${pred.absences && pred.absences.length > 0 ? `
        <div class="mb-3 p-3 bg-red-50 rounded border border-red-200">
            <div class="font-semibold text-gray-700 mb-2">🚑 Joueurs absents:</div>
            <div class="text-sm">${pred.absences.slice(0, 3).map(a => `<span class="inline-block mr-2 mb-1 px-2 py-1 bg-white rounded">${a.name} (${a.reason})</span>`).join('')}</div>
        </div>` : ''}
        ${pred.referee ? `
        <div class="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
            <div class="font-semibold text-gray-700 mb-2">👨‍⚖️ Arbitre: ${pred.referee.name}</div>
            <div class="text-xs text-gray-600">Moy. cartons jaunes: ${pred.referee.avg_yellow || 'N/A'} | Moy. cartons rouges: ${pred.referee.avg_red || 'N/A'}</div>
        </div>` : ''}
        <div class="text-center">
            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Fiabilité: ${pred.reliability_score || 0}/10 - ${pred.confidence || 'Moyenne'}
            </span>
        </div>
    `;

    return div;
}

// HISTORIQUE
async function loadHistory() {
    try {
        const [historyRes, statsRes, learningRes] = await Promise.all([
            fetch(`${API_BASE_URL}/football/history/matches/finished?per_page=20`),
            fetch(`${API_BASE_URL}/football/history/stats`),
            fetch(`${API_BASE_URL}/football/history/learning`)
        ]);

        const historyData = await historyRes.json();
        const statsData = await statsRes.json();
        const learningData = await learningRes.json();

        displayStats(statsData);
        displayLearningInsights(learningData);
        displayHistory(historyData.matches);
    } catch (error) {
        console.error('Erreur chargement historique:', error);
        document.getElementById('history-container').innerHTML = 
            '<div class="text-center py-8 text-red-500">Erreur de chargement de l\'historique</div>';
    }
}

function displayStats(stats) {
    const container = document.getElementById('stats-cards');
    
    const accuracyClass = stats.overall_accuracy >= 60 ? 'high' : 
                         stats.overall_accuracy >= 40 ? 'medium' : 'low';
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="text-3xl mb-2">🎯</div>
            <div class="text-2xl font-bold text-gray-800">${stats.overall_accuracy}%</div>
            <div class="text-sm text-gray-600">Précision Globale</div>
            <div class="mt-2">
                <span class="accuracy-badge ${accuracyClass}">${stats.correct_predictions}/${stats.matches_with_predictions}</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="text-3xl mb-2">📊</div>
            <div class="text-2xl font-bold text-gray-800">${stats.total_matches}</div>
            <div class="text-sm text-gray-600">Matchs Analysés</div>
            <div class="text-xs text-gray-500 mt-2">(${stats.period_days} derniers jours)</div>
        </div>
        <div class="stat-card">
            <div class="text-3xl mb-2">⭐</div>
            <div class="text-sm text-gray-600 mb-2">Par Confiance</div>
            <div class="text-xs space-y-1">
                <div>Élevée: ${Math.round(stats.accuracy_by_confidence['Élevée'].accuracy)}%</div>
                <div>Moyenne: ${Math.round(stats.accuracy_by_confidence['Moyenne'].accuracy)}%</div>
                <div>Faible: ${Math.round(stats.accuracy_by_confidence['Faible'].accuracy)}%</div>
            </div>
        </div>
    `;
}

function displayHistory(matches) {
    const container = document.getElementById('history-container');
    
    if (!matches || matches.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">Aucun match dans l\'historique</div>';
        return;
    }
    
    container.innerHTML = '';
    
    matches.forEach(match => {
        // Utiliser prediction_analysis ou prediction selon ce qui est disponible
        const analysis = match.prediction_analysis || match.prediction;
        const hasPrediction = analysis !== null && analysis !== undefined;
        
        const div = document.createElement('div');
        
        // Déterminer le résultat réel
        let actualResult = 'DRAW';
        if (match.home_score > match.away_score) actualResult = 'HOME';
        else if (match.away_score > match.home_score) actualResult = 'AWAY';
        
        // Vérifier si la prédiction est correcte
        let isCorrect = false;
        let predictedWinner = 'Non prédit';
        let confidence = '-';
        let reliabilityScore = '-';
        
        if (hasPrediction) {
            const predWinner = analysis.predicted_winner || analysis.predictedWinner;
            isCorrect = predWinner === actualResult || analysis.is_correct;
            
            if (predWinner === 'HOME' || predWinner === 'home') {
                predictedWinner = match.home_team?.name || 'Domicile';
            } else if (predWinner === 'AWAY' || predWinner === 'away') {
                predictedWinner = match.away_team?.name || 'Extérieur';
            } else if (predWinner === 'DRAW' || predWinner === 'draw') {
                predictedWinner = 'Match Nul';
            }
            
            confidence = analysis.confidence || '-';
            reliabilityScore = analysis.reliability_score || analysis.reliabilityScore || '-';
        }
        
        div.className = `match-card p-4 ${hasPrediction ? (isCorrect ? 'correct' : 'incorrect') : 'no-prediction'}`;
        
        const date = new Date(match.date);
        const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        
        const resultIcon = hasPrediction ? (isCorrect ? '✅' : '❌') : '❓';
        const resultText = hasPrediction ? (isCorrect ? 'Prédiction Correcte' : 'Prédiction Incorrecte') : 'Pas de prédiction';
        const resultClass = hasPrediction ? (isCorrect ? 'text-green-600' : 'text-red-600') : 'text-gray-500';
        
        // Résultat réel en texte
        let actualResultText = 'Match Nul';
        if (actualResult === 'HOME') actualResultText = match.home_team?.name || 'Domicile';
        else if (actualResult === 'AWAY') actualResultText = match.away_team?.name || 'Extérieur';
        
        div.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    ${match.league?.name || 'Ligue inconnue'}
                </span>
                <span class="text-sm text-gray-600">${dateStr}</span>
            </div>
            <div class="flex items-center justify-between mb-3">
                <div class="flex-1">
                    <div class="text-lg font-bold">${match.home_team?.name || 'Domicile'}</div>
                </div>
                <div class="px-4 text-center">
                    <div class="text-2xl font-bold">${match.home_score} - ${match.away_score}</div>
                </div>
                <div class="flex-1 text-right">
                    <div class="text-lg font-bold">${match.away_team?.name || 'Extérieur'}</div>
                </div>
            </div>
            <div class="bg-white rounded-lg p-3">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-sm text-gray-600">Résultat réel</div>
                        <div class="font-semibold text-blue-600">${actualResultText}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-sm text-gray-600">Prédiction IA</div>
                        <div class="font-semibold">${predictedWinner}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl">${resultIcon}</div>
                        <div class="text-sm font-semibold ${resultClass}">${resultText}</div>
                    </div>
                </div>
                ${hasPrediction ? `
                <div class="mt-2 text-xs text-gray-500">
                    Confiance: ${confidence} | Fiabilité: ${reliabilityScore}/10
                </div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(div);
    });
}

// CHAT IA INTELLIGENT
const defaultSuggestions = [
    '🏆 Meilleurs paris du jour',
    '⚽ Matchs aujourd\'hui',
    '📊 Précision de l\'IA',
    '🎯 Top BTTS',
    '📈 Over 2.5 recommandés',
    '❓ Comment ça marche?'
];

async function loadChatSuggestions() {
    const container = document.getElementById('chat-suggestions');
    if (!container) return;
    
    container.innerHTML = ''; // Vider le conteneur
    
    try {
        const response = await fetch(`${API_BASE_URL}/ai/suggestions`);
        const data = await response.json();
        
        const suggestions = data.suggestions && data.suggestions.length > 0 
            ? data.suggestions 
            : defaultSuggestions;
        
        suggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 rounded-full text-sm hover:from-blue-200 hover:to-indigo-200 transition font-medium shadow-sm';
            btn.textContent = suggestion;
            btn.onclick = () => {
                document.getElementById('chat-input').value = suggestion;
                sendMessage();
            };
            container.appendChild(btn);
        });
    } catch (error) {
        console.error('Erreur chargement suggestions:', error);
        // Utiliser les suggestions par défaut en cas d'erreur
        defaultSuggestions.forEach(suggestion => {
            const btn = document.createElement('button');
            btn.className = 'px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 rounded-full text-sm hover:from-blue-200 hover:to-indigo-200 transition font-medium shadow-sm';
            btn.textContent = suggestion;
            btn.onclick = () => {
                document.getElementById('chat-input').value = suggestion;
                sendMessage();
            };
            container.appendChild(btn);
        });
    }
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Afficher le message de l'utilisateur
    addChatMessage(message, 'user');
    input.value = '';
    
    // Afficher un indicateur de chargement animé
    const loadingId = addChatMessage('<span class="animate-pulse">🤖 Analyse en cours...</span>', 'ai');
    
    try {
        // Collecter le contexte des matchs actuels
        const context = {
            current_view: currentView,
            current_league: currentLeague,
            matches_count: allMatches.length
        };
        
        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message,
                context
            })
        });
        
        const data = await response.json();
        
        // Remplacer le message de chargement par la réponse
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        
        if (data.success && data.response) {
            // Formater la réponse avec du Markdown basique
            const formattedResponse = formatChatResponse(data.response);
            addChatMessage(formattedResponse, 'ai');
        } else {
            addChatMessage(data.response || 'Je n\'ai pas compris votre question. Pouvez-vous reformuler?', 'ai');
        }
        
    } catch (error) {
        console.error('Erreur chat:', error);
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.remove();
        addChatMessage('⚠️ Désolé, une erreur s\'est produite. Veuillez réessayer.', 'ai');
    }
}

// Formater la réponse du chat avec du Markdown basique
function formatChatResponse(text) {
    if (!text) return '';
    
    // Convertir le Markdown basique en HTML
    let formatted = text
        // Titres
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Listes
        .replace(/^- (.+)$/gm, '• $1')
        .replace(/^\d+\. (.+)$/gm, '$&')
        // Emojis et symboles déjà présents
        // Retours à la ligne
        .replace(/\n\n/g, '</p><p class="mt-2">')
        .replace(/\n/g, '<br>');
    
    return `<p>${formatted}</p>`;
}

function addChatMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    const messageId = 'msg-' + Date.now();
    
    const div = document.createElement('div');
    div.id = messageId;
    div.className = `chat-message ${sender}`;
    div.innerHTML = `
        <div class="chat-bubble ${sender}">
            ${text.replace(/\n/g, '<br>')}
        </div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    
    return messageId;
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `
        <div class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center border-2 border-red-500">
            <div class="text-red-500 mb-4">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Erreur de chargement</h2>
            <p class="text-gray-600 mb-6">${message}</p>
            <button onclick="location.reload()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
                Réessayer
            </button>
        </div>
    `;
    errorDiv.classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
}

// Charger les données au démarrage
loadData();

