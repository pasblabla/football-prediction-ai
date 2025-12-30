// Affichage des insights d'apprentissage automatique

function displayLearningInsights(learning) {
    // Créer une section dédiée pour les insights d'apprentissage
    const historyTab = document.getElementById('history-tab');
    
    // Vérifier si la section existe déjà
    let insightsSection = document.getElementById('learning-insights');
    if (!insightsSection) {
        insightsSection = document.createElement('div');
        insightsSection.id = 'learning-insights';
        insightsSection.className = 'mb-6';
        
        // Insérer avant le container de l'historique
        const historyContainer = document.querySelector('#history-tab .bg-white');
        historyTab.insertBefore(insightsSection, historyContainer);
    }
    
    // Calculer la progression vers l'objectif
    const currentAccuracy = learning.accuracy;
    const targetAccuracy = 70;
    const progressPercent = Math.min((currentAccuracy / targetAccuracy) * 100, 100);
    const remainingPercent = targetAccuracy - currentAccuracy;
    
    insightsSection.innerHTML = `
        <!-- En-tête Apprentissage IA -->
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-6">
            <div class="flex items-center gap-3 mb-4">
                <div class="text-4xl">🤖</div>
                <div>
                    <h2 class="text-2xl font-bold">Apprentissage Automatique de l'IA</h2>
                    <p class="text-purple-100">L'IA analyse ses erreurs et s'améliore en continu</p>
                </div>
            </div>
            
            <!-- Progression vers l'objectif -->
            <div class="bg-white/10 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-semibold">Précision actuelle: ${currentAccuracy}%</span>
                    <span class="font-semibold">Objectif: ${targetAccuracy}%</span>
                </div>
                <div class="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                    <div class="bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full transition-all duration-1000" 
                         style="width: ${progressPercent}%"></div>
                </div>
                <div class="text-sm mt-2 text-purple-100">
                    ${remainingPercent > 0 ? `Encore +${remainingPercent.toFixed(1)}% pour atteindre l'objectif` : '🎉 Objectif atteint !'}
                </div>
            </div>
        </div>
        
        <!-- Patterns Identifiés -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🔍</span>
                <span>Patterns Identifiés</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-green-700">${learning.patterns.home_wins_rate}%</div>
                    <div class="text-sm text-gray-600">Victoires à domicile</div>
                    <div class="text-xs text-gray-500 mt-1">Avantage domicile confirmé</div>
                </div>
                <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-blue-700">${learning.patterns.away_wins_rate}%</div>
                    <div class="text-sm text-gray-600">Victoires à l'extérieur</div>
                    <div class="text-xs text-gray-500 mt-1">Équipes visiteurs</div>
                </div>
                <div class="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                    <div class="text-2xl font-bold text-gray-700">${learning.patterns.draws_rate}%</div>
                    <div class="text-sm text-gray-600">Matchs nuls</div>
                    <div class="text-xs ${learning.patterns.draws_missed > 10 ? 'text-red-500' : 'text-gray-500'} mt-1">
                        ${learning.patterns.draws_missed} manqués par l'IA
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Ajustements Suggérés -->
        ${learning.adjustments && learning.adjustments.length > 0 ? `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <span>⚙️</span>
                <span>Ajustements Suggérés par l'IA</span>
            </h3>
            <div class="space-y-4">
                ${learning.adjustments.map(adj => `
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <div class="flex items-start gap-3">
                            <div class="text-2xl">💡</div>
                            <div class="flex-1">
                                <div class="font-bold text-gray-800 mb-1">${adj.type.replace(/_/g, ' ').toUpperCase()}</div>
                                <div class="text-sm text-gray-700 mb-2">
                                    <span class="font-semibold">Actuel:</span> ${adj.current_value} 
                                    <span class="mx-2">→</span> 
                                    <span class="font-semibold text-green-600">Suggéré:</span> ${adj.suggested_value}
                                </div>
                                <div class="text-xs text-gray-600 mb-1">
                                    <strong>Raison:</strong> ${adj.reason}
                                </div>
                                <div class="text-xs text-green-700 font-semibold">
                                    <strong>Impact:</strong> ${adj.impact}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Recommandations -->
        ${learning.recommendations && learning.recommendations.length > 0 ? `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📋</span>
                <span>Recommandations pour Améliorer</span>
            </h3>
            <div class="space-y-3">
                ${learning.recommendations.map(rec => `
                    <div class="border-l-4 ${rec.priority === 'Haute' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'} p-4 rounded">
                        <div class="flex items-start gap-3">
                            <div class="text-2xl">${rec.priority === 'Haute' ? '🔴' : '🟠'}</div>
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="px-2 py-1 text-xs font-bold rounded ${rec.priority === 'Haute' ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'}">
                                        ${rec.priority}
                                    </span>
                                    <span class="font-bold text-gray-800">${rec.title}</span>
                                </div>
                                <div class="text-sm text-gray-700 mb-2">${rec.description}</div>
                                <div class="text-xs text-green-700 font-semibold">
                                    ✅ Amélioration estimée: ${rec.expected_improvement}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Erreurs Analysées -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📊</span>
                <span>Analyse des Erreurs</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="text-lg font-bold text-red-700">${learning.patterns.high_scoring_errors}</div>
                    <div class="text-sm text-gray-600">Matchs avec plus de buts que prévu</div>
                    <div class="text-xs text-gray-500 mt-1">L'IA sous-estime les buts</div>
                </div>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="text-lg font-bold text-blue-700">${learning.patterns.low_scoring_errors}</div>
                    <div class="text-sm text-gray-600">Matchs avec moins de buts que prévu</div>
                    <div class="text-xs text-gray-500 mt-1">L'IA surestime les buts</div>
                </div>
            </div>
        </div>
        
        <!-- Dernière mise à jour -->
        <div class="text-center text-sm text-gray-500">
            Dernière analyse: ${new Date(learning.last_updated).toLocaleString('fr-FR')}
        </div>
    `;
}

