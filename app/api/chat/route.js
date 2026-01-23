import { NextResponse } from 'next/server';
import { getUserProfile, deleteUserProfile, saveUserProfile} from '@/shared/utils/userProfilesStore';
import { selectPrompt, detectAndUpdateProfile } from '@/shared/utils/promptSelector';
import AdaptiveEngine from '@/backend/services/socrate/AdaptiveEngine';
import SocrateBrain from '@/backend/services/socrate/SocrateBrain';
import { enrichWithMetier } from '@/shared/prompts/metierEnrichment.js';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import logger from '@/lib/logger';
import { PEDAGOGIE } from '@/shared/data/pedagogie';

/**
 * Détecte si l'utilisateur demande explicitement une compétence
 * @param {string} message - Message de l'utilisateur
 * @returns {Object|null} - Compétence trouvée ou null
 */
function detectRequestedCompetence(message) {
  const messageLower = message.toLowerCase();
  
  // Mapping mots-clés → clé PEDAGOGIE (ordre de priorité : du plus spécifique au plus général)
  const competencePatterns = [
    // Très spécifiques
    { patterns: ['power query', 'powerquery'], key: 'POWER_QUERY' },
    { patterns: ['tableau croisé dynamique', 'tableaux croisés dynamiques', 'tcd'], key: 'TCD' },
    { patterns: ['index equiv', 'index+equiv', 'index et equiv'], key: 'INDEX_EQUIV' },
    { patterns: ['somme.si.ens', 'sommesidens'], key: 'SOMME_SI_ENS' },
    { patterns: ['nb.si.ens', 'nbsiens'], key: 'NB_SI_ENS' },
    { patterns: ['somme.si', 'sommesi', 'somme si'], key: 'SOMME_SI' },
    { patterns: ['nb.si', 'nbsi', 'nb si'], key: 'NB_SI' },
    { patterns: ['mise en forme conditionnelle', 'mfc', 'formatage conditionnel'], key: 'MFC' },
    { patterns: ['recherchex', 'xlookup'], key: 'RECHERCHEX' },
    { patterns: ['recherchev', 'vlookup'], key: 'RECHERCHEV' },
    { patterns: ['rechercheh', 'hlookup'], key: 'RECHERCHEH' },
    { patterns: ['si imbriqué', 'si imbriqués', 'si dans si'], key: 'SI_IMBRIQUE' },
    { patterns: ['sierreur', 'si.erreur', 'iferror'], key: 'SIERREUR' },
    { patterns: ['sommeprod'], key: 'SOMMEPROD' },
    { patterns: ['validation de données', 'validation données', 'liste déroulante'], key: 'VALIDATION_DONNEES' },
    // Moyennement spécifiques  
    { patterns: ['graphique', 'graphiques', 'chart', 'diagramme'], key: 'GRAPHIQUES' },
    { patterns: ['filtre', 'filtrer', 'filtres'], key: 'FILTRES' },
    { patterns: ['trier', 'tri ', 'tri de données'], key: 'TRI' },
    { patterns: ['moyenne'], key: 'MOYENNE' },
    { patterns: ['somme', 'additionner', 'total'], key: 'SOMME' },
    { patterns: ['min', 'max', 'minimum', 'maximum'], key: 'MIN_MAX' },
    { patterns: ['concatener', 'concaténer', 'concat'], key: 'CONCATENER' },
    { patterns: ['gauche', 'droite', 'stxt', 'extraire texte'], key: 'TEXTE' },
    { patterns: ['date', 'datedif', 'jour', 'mois', 'année'], key: 'DATES' },
    // Génériques (en dernier)
    { patterns: ['fonction si', 'formule si', 'condition'], key: 'SI' },
    { patterns: ['formatage', 'format', 'mise en forme'], key: 'FORMATAGE' },
    { patterns: ['référence absolue', 'dollar', '$'], key: 'REFERENCES_ABSOLUES' },
  ];
  
  // Chercher dans l'ordre (le premier match gagne)
  for (const { patterns, key } of competencePatterns) {
    if (patterns.some(p => messageLower.includes(p))) {
      const competence = findCompetenceByName(key);
      if (competence) {
        console.log('🎯 [DETECT] Compétence demandée explicitement:', key);
        return competence;
      }
    }
  }
  
  return null;
}

/**
 * Trouve une compétence complète depuis un nom
 * @param {string} nom - Nom de la compétence (ex: "SOMME", "RECHERCHEV")
 * @returns {Object|null} - { id, nom, key } ou null
 */
function findCompetenceByName(nom) {
  if (!nom) return null;
  
  const nomUpper = nom.toUpperCase().trim();
  
  for (const [key, data] of Object.entries(PEDAGOGIE)) {
    if (data.nom && data.nom.toUpperCase() === nomUpper) {
      return { id: data.id, nom: data.nom, key };
    }
  }
  
  // Fallback: chercher par inclusion
  for (const [key, data] of Object.entries(PEDAGOGIE)) {
    if (data.nom && data.nom.toUpperCase().includes(nomUpper)) {
      return { id: data.id, nom: data.nom, key };
    }
  }
  
  // Fallback: chercher par clé directe
  if (PEDAGOGIE[nomUpper]) {
    const data = PEDAGOGIE[nomUpper];
    return { id: data.id, nom: data.nom, key: nomUpper };
  }
  
  return null;
}

/**
 * CORRECTION BUG 2: Construit le contexte personnalisé depuis le profil onboarding
 * @param {Object} onboardingProfile - { name, context, level, completedAt }
 * @returns {string} Contexte à injecter dans le prompt
 */
function buildOnboardingContext(onboardingProfile) {
  if (!onboardingProfile) {
    return '';
  }
  
  const { name, context, level } = onboardingProfile;
  
  // Mapping des contextes métier vers descriptions
  const contextDescriptions = {
    'student': 'étudiant(e) - utilise Excel pour des projets académiques, rapports et analyses',
    'finance': 'professionnel(le) de la finance - travaille sur des budgets, analyses financières, reporting',
    'marketing': 'professionnel(le) du marketing - travaille sur des données campagnes, KPIs, dashboards',
    'rh': 'professionnel(le) RH - gère des données employés, paie, effectifs',
    'other': 'utilisateur(trice) polyvalent(e) - usage varié d\'Excel'
  };
  
  // Mapping des niveaux vers descriptions
  const levelDescriptions = {
    'beginner': 'DÉBUTANT - découvre Excel, a besoin d\'explications détaillées et de patience',
    'intermediate': 'INTERMÉDIAIRE - connaît les bases, peut gérer RECHERCHEV et TCD basiques',
    'advanced': 'AVANCÉ - maîtrise bien Excel, cherche à aller plus loin (INDEX/EQUIV, Power Query)'
  };
  
  const parts = [];
  
  if (name) {
    parts.push(`PRÉNOM DE L'UTILISATEUR : ${name}`);
    parts.push(`→ Utilise son prénom naturellement dans la conversation (pas à chaque message)`);
  }
  
  if (context && contextDescriptions[context]) {
    parts.push(`CONTEXTE MÉTIER : ${contextDescriptions[context]}`);
    parts.push(`→ Adapte les exemples et exercices à ce contexte professionnel`);
  }
  
  if (level && levelDescriptions[level]) {
    parts.push(`NIVEAU EXCEL : ${levelDescriptions[level]}`);
    parts.push(`→ Adapte la complexité des explications et des exercices`);
  }
  
  if (parts.length === 0) return '';
  
  return `
═══════════════════════════════════════════════════════════════
PROFIL UTILISATEUR (personnalise ta réponse)
═══════════════════════════════════════════════════════════════
${parts.join('\n')}
═══════════════════════════════════════════════════════════════`;
}

/**
 * Enrichit le prompt avec le contexte pédagogique de l'élève
 * (erreurs récurrentes, compétences, performance récente)
 */
function buildPedagogicalContext(learnerState) {
  if (!learnerState || !learnerState.userId) {
    return '';
  }
  
  const parts = [];
  
  // Points de friction (erreurs récurrentes)
  if (learnerState.frictionPoints && learnerState.frictionPoints.length > 0) {
    const errorsDesc = learnerState.frictionPoints
      .slice(0, 3)
      .map(f => `- ${f.type} (${f.count}x)`)
      .join('\n');
    parts.push(`ERREURS RÉCURRENTES DE CET ÉLÈVE :\n${errorsDesc}`);
  }
  
  // Compétences en cours
  const inProgress = Object.entries(learnerState.competences || {})
    .filter(([_, d]) => d.maitrise > 0 && d.maitrise < 80 && !d.validated)
    .sort((a, b) => b[1].maitrise - a[1].maitrise)
    .slice(0, 3);
  
  if (inProgress.length > 0) {
    const compDesc = inProgress
      .map(([id, d]) => `- Compétence #${id}: ${d.maitrise}% maîtrisé`)
      .join('\n');
    parts.push(`COMPÉTENCES EN COURS :\n${compDesc}`);
  }
  
  // Performance récente
  if (learnerState.recentPerformance) {
    const { avgScore, trend, hintsUsed } = learnerState.recentPerformance;
    let perfDesc = `Score moyen récent: ${avgScore}%`;
    if (trend === 'up') perfDesc += ' (↗ en progression)';
    else if (trend === 'down') perfDesc += ' (↘ en difficulté)';
    if (hintsUsed > 5) perfDesc += ` - Utilise beaucoup les indices (${hintsUsed})`;
    parts.push(`PERFORMANCE RÉCENTE : ${perfDesc}`);
  }
  
  // Métriques
  if (learnerState.metrics) {
    const { hintsDependency, validationRate } = learnerState.metrics;
    if (hintsDependency > 0.5) {
      parts.push(`⚠️ Cet élève dépend beaucoup des indices (${Math.round(hintsDependency*100)}% des exercices). Encourage l'autonomie.`);
    }
    if (validationRate > 0.7) {
      parts.push(`✨ Bon taux de validation (${Math.round(validationRate*100)}%). Peut être challengé davantage.`);
    }
  }
  
  if (parts.length === 0) return '';
  
  return `
═══════════════════════════════════════════════════════════════
CONTEXTE PÉDAGOGIQUE DE CET ÉLÈVE (utilise ces infos subtilement)
═══════════════════════════════════════════════════════════════
${parts.join('\n\n')}
═══════════════════════════════════════════════════════════════`;
}

/**
 * Gère le message de suite après une correction d'exercice
 */
async function handlePostCorrectionMessage(message, history, userProfile, sessionId) {
  // Extraire le score du message système
  const scoreMatch = message.match(/score de (\d+)\/10/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
  
  const isSuccess = score >= 7;
  
  try {
    // Enrichir le prompt avec le contexte de correction
    let systemPrompt = selectPrompt(userProfile, message);
    systemPrompt = enrichWithMetier(systemPrompt, userProfile.contexteMetier);
    
    // Ajouter contexte de correction
    systemPrompt += `

═══════════════════════════════════════════════════════════════
CONTEXTE : L'utilisateur vient de terminer un exercice Excel
═══════════════════════════════════════════════════════════════
Score obtenu : ${score}/10
${isSuccess ? '✅ RÉUSSITE - Félicite-le et propose la suite' : '⚠️ DIFFICULTÉS - Encourage-le et propose de l\'aide'}

IMPORTANT :
- Sois naturel et encourageant
- Propose soit un nouvel exercice, soit des explications
- NE RÉPÈTE PAS le score, l'utilisateur le connaît déjà
- Propose les boutons télécharger/upload pour le prochain exercice
═══════════════════════════════════════════════════════════════`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          ...history.filter(msg => msg.content).slice(-6).map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: 'user', content: message }
        ],
        system: systemPrompt
      })
    });

    const data = await response.json();
    
    if (!data.content || !data.content[0]) {
      throw new Error('Réponse Claude invalide');
    }
    
    // Sauvegarder l'interaction
    userProfile.addToHistory({
      message: '[Suite correction]',
      response: data.content[0].text,
      score
    });
    await saveUserProfile(sessionId, userProfile);
    
    return NextResponse.json({
      response: data.content[0].text,
      showExerciseActions: true,
      profile: userProfile.getProfile()
    });
    
  } catch (error) {
    logger.error('CHAT', 'Erreur post-correction', { error: error.message });
    
    // Fallback
    const fallbackResponse = isSuccess
      ? "Super travail ! Tu veux continuer avec un exercice plus avancé, ou explorer une autre compétence ?"
      : "Pas de souci, c'est en pratiquant qu'on progresse. Tu préfères que je t'explique les points difficiles, ou tu veux réessayer avec un exercice similaire ?";
    
    return NextResponse.json({
      response: fallbackResponse,
      showExerciseActions: true,
      profile: userProfile.getProfile()
    });
  }
}

export async function POST(request) {
  try {
    const { message, history, sessionId, isSystemMessage, onboardingProfile, competenceEnCours } = await request.json();
    
    // Rate limiting
    const rateLimit = await checkRateLimit(sessionId || 'anonymous', '/api/chat');
    if (!rateLimit.allowed) {
      logger.warn('CHAT', 'Rate limit atteint', { sessionId });
      return rateLimitExceededResponse(rateLimit);
    }

    const userProfile = await getUserProfile(sessionId);

    // Gestion des messages système (après correction)
    if (isSystemMessage && message.startsWith('[SYSTÈME]')) {
      logger.info('CHAT', 'Message système - suite correction');
      return await handlePostCorrectionMessage(message, history, userProfile, sessionId);
    }

    // Détection et mise à jour du profil basé sur le message
    const profileUpdated = detectAndUpdateProfile(message, userProfile);
    
    if (profileUpdated) {
      console.log('📊 [API] Profil mis à jour:', userProfile.getProfile());
    }
    
    // Message en minuscules pour détection
    const messageLower = message.toLowerCase();
    
    // Détection du mode (théorique vs pratique)
    const isTheoreticalQuestion = [
      "c'est quoi", "qu'est-ce", "comment ça marche", 
      "explique", "différence entre"
    ].some(kw => messageLower.includes(kw));
    
    if (isTheoreticalQuestion) {
      userProfile.incrementQuestionTheorique();
    }
    
    // Détection demande d'exercice
    const isExerciseRequest = [
      "exercice", "pratiquer", "m'entraîner", "essayer", "exo", "entraine", "entraîne", "prêt à pratiquer"
    ].some(kw => messageLower.includes(kw));
    
    console.log('🔍 [DEBUG] Message:', messageLower);
    console.log('🔍 [DEBUG] isExerciseRequest:', isExerciseRequest);

    // Construction du prompt système
    let systemPrompt = selectPrompt(userProfile, message, competenceEnCours);
    systemPrompt = enrichWithMetier(systemPrompt, userProfile.contexteMetier);

    // CORRECTION BUG 2: Ajouter le contexte onboarding (nom, métier, niveau)
    if (onboardingProfile) {
      const onboardingContext = buildOnboardingContext(onboardingProfile);
      if (onboardingContext) {
        systemPrompt += onboardingContext;
        console.log('👤 [CHAT] Contexte onboarding ajouté:', onboardingProfile.name, onboardingProfile.context, onboardingProfile.level);
      }
    }

    // Charger le contexte pédagogique complet
    let learnerState = null;
    try {
      learnerState = await SocrateBrain.loadLearnerState(sessionId);
      const pedagogicalContext = buildPedagogicalContext(learnerState);
      if (pedagogicalContext) {
        systemPrompt += pedagogicalContext;
        console.log('🧠 [CHAT] Contexte pédagogique ajouté');
      }
    } catch (e) {
      console.warn('⚠️ [CHAT] Contexte pédagogique non disponible:', e.message);
    }

    const { vitesseComprehension, modePrefere } = userProfile.comportement || { 
      vitesseComprehension: "normale", 
      modePrefere: "learning" 
    };

    if (vitesseComprehension === "rapide") {
      systemPrompt += `\n\nCOMPORTEMENT ADAPTATIF : Cet utilisateur comprend vite. Sois CONCIS et DIRECT. Pas de sur-explication.`;
    } else if (vitesseComprehension === "lente") {
      systemPrompt += `\n\nCOMPORTEMENT ADAPTATIF : Cet utilisateur a besoin de temps. DÉCOMPOSE en micro-étapes. RASSURE systématiquement.`;
    }

    if (modePrefere === "work") {
      systemPrompt += `\nMode WORK activé : Réponses ultra-rapides, juste la solution, pas de blabla.`;
    }
    
    // Variables pour le retour (déclarées ici pour être accessibles après)
    let exerciseSelection = null;
    let recommendedCompetence = null;
    
    // PRIORITÉ 1 : Compétence explicitement demandée par l'utilisateur MAINTENANT
    const explicitCompetence = detectRequestedCompetence(message);
    if (explicitCompetence) {
      recommendedCompetence = explicitCompetence;
      console.log('🎯 [CHAT] Compétence EXPLICITE détectée:', explicitCompetence.nom);
      
      // Stocker dans le profil pour mémoire
      userProfile.competenceExplicite = explicitCompetence;
      await saveUserProfile(sessionId, userProfile);
    }
    
    // PRIORITÉ 2 : Compétence stockée dans le profil (demandée précédemment)
    if (!recommendedCompetence && userProfile.competenceExplicite) {
      recommendedCompetence = userProfile.competenceExplicite;
      console.log('🎯 [CHAT] Compétence depuis MÉMOIRE profil:', recommendedCompetence.nom);
    }
    
    // PRIORITÉ 3 : Chercher dans l'historique récent de la conversation
    if (!recommendedCompetence && history && history.length > 0) {
      // Parcourir les 5 derniers messages (utilisateur + assistant)
      const recentMessages = history.slice(-10);
      for (const msg of recentMessages) {
        if (msg.content) {
          const historyCompetence = detectRequestedCompetence(msg.content);
          if (historyCompetence) {
            recommendedCompetence = historyCompetence;
            console.log('🎯 [CHAT] Compétence depuis HISTORIQUE:', historyCompetence.nom);
            break;
          }
        }
      }
    }
    
    // Si demande d'exercice, ajouter contexte pour Claude ET préparer le générateur
    if (isExerciseRequest) {
      // PRIORITÉ 4 : Si toujours pas de compétence, utiliser l'AdaptiveEngine
      if (!recommendedCompetence) {
        // Obtenir les recommandations de l'AdaptiveEngine
        exerciseSelection = await AdaptiveEngine.selectNextExercise(userProfile);
        
        // Trouver la première compétence recommandée avec ses infos complètes
        if (exerciseSelection.competencesToWork?.length > 0) {
          recommendedCompetence = findCompetenceByName(exerciseSelection.competencesToWork[0]);
          console.log('🎯 [CHAT] Compétence recommandée par AdaptiveEngine:', recommendedCompetence);
        }
      }
      
      // PRIORITÉ 5 : Fallback intelligent si toujours pas de compétence
      if (!recommendedCompetence) {
        const userLevel = userProfile?.niveau || 'debutant';
        // Intermédiaire/avancé → SOMME.SI, Débutant → SI (plus formateur que SOMME)
        const fallbackComp = userLevel === 'debutant' ? 'SI' : 'SOMME_SI';
        recommendedCompetence = findCompetenceByName(fallbackComp);
        console.log('🎯 [CHAT] Fallback compétence niveau', userLevel, '→', fallbackComp);
      }
      
      systemPrompt += `

═══════════════════════════════════════════════════════════════
DEMANDE D'EXERCICE DÉTECTÉE
═══════════════════════════════════════════════════════════════
L'utilisateur veut pratiquer. Voici les recommandations :
- Type d'exercice suggéré : ${exerciseSelection?.exerciseType || 'standard'}
- Compétence principale : ${recommendedCompetence?.nom || 'au choix'}
- Topics : ${exerciseSelection?.topics?.join(', ') || 'au choix'}

IMPORTANT :
- Dis quelque chose de COURT et ENGAGEANT (1-2 phrases max)
- Le générateur d'exercice va s'afficher automatiquement
- NE décris PAS l'exercice en détail, le générateur s'en charge
- NE DIS JAMAIS "ci-dessous" ou "télécharge ci-dessous"
═══════════════════════════════════════════════════════════════`;
    }

    // Appel à l'API Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512, // Réduit de 1024 pour forcer la concision
        messages: [
          ...history.filter(msg => msg.content).map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          {
            role: 'user',
            content: message
          }
        ],
        system: systemPrompt
      })
    });

    const data = await response.json();
    
    // Vérifier si la réponse API est valide
    if (!data.content || !data.content[0]) {
      console.error('❌ [API] Réponse Claude invalide:', data);
      return NextResponse.json(
        { error: data.error?.message || 'Erreur API Claude' },
        { status: 500 }
      );
    }
    
    const responseText = data.content[0].text;
    const responseLower = responseText.toLowerCase();

    // Détecter si la réponse propose un exercice à télécharger
    const responseProposesExercise = [
      "télécharge", "telecharge", "fichier excel", "📥", "télécharger", 
      "exercice excel", "fichier ci-dessous", "complète-le", "complète le"
    ].some(kw => responseLower.includes(kw));
    
    // Activer les boutons si demande utilisateur OU réponse propose un exercice
    const shouldShowExerciseActions = isExerciseRequest || responseProposesExercise;
    
    if (responseProposesExercise && !isExerciseRequest) {
      console.log('📥 [CHAT] Réponse propose un exercice, activation boutons');
    }

    // Si la réponse propose un exercice mais qu'on n'a pas de compétence, essayer de la détecter
    if (shouldShowExerciseActions && !recommendedCompetence) {
      // Mapping mots-clés → compétence
      const competenceKeywords = {
        'tcd': 'TCD', 'tableau croisé': 'TCD', 'tableaux croisés': 'TCD', 'pivot': 'TCD',
        'recherchev': 'RECHERCHEV', 'vlookup': 'RECHERCHEV',
        'recherchex': 'XLOOKUP', 'xlookup': 'XLOOKUP',
        'somme.si': 'SOMME_SI', 'somme si': 'SOMME_SI', 'sommesi': 'SOMME_SI',
        'nb.si': 'NB_SI', 'nbsi': 'NB_SI', 'nb si': 'NB_SI',
        'index': 'INDEX_EQUIV', 'equiv': 'INDEX_EQUIV',
        'graphique': 'GRAPHIQUES', 'graphiques': 'GRAPHIQUES', 'chart': 'GRAPHIQUES',
        'si(': 'SI', 'condition': 'SI', 'conditionnel': 'SI',
        'moyenne': 'MOYENNE', 'average': 'MOYENNE',
        'filtre': 'FILTRES', 'filtrer': 'FILTRES',
        'tri': 'TRI', 'trier': 'TRI', 'sort': 'TRI',
        'format': 'FORMATAGE', 'mise en forme': 'MFC',
        'power query': 'POWER_QUERY', 'powerquery': 'POWER_QUERY'
      };
      
      for (const [keyword, compKey] of Object.entries(competenceKeywords)) {
        if (responseLower.includes(keyword)) {
          recommendedCompetence = findCompetenceByName(compKey);
          if (recommendedCompetence) {
            console.log('🎯 [CHAT] Compétence détectée dans réponse:', compKey);
            break;
          }
        }
      }
      
      // Fallback intelligent basé sur le contexte
      if (!recommendedCompetence) {
        const userLevel = userProfile?.niveau || 'debutant';
        const context = responseLower + ' ' + messageLower;
        
        // Contexte analyse/business → TCD
        if (['analy', 'données', 'ventes', 'performance', 'rapport', 'dashboard', 'kpi', 'reporting'].some(kw => context.includes(kw))) {
          recommendedCompetence = findCompetenceByName('TCD');
          console.log('🎯 [CHAT] Fallback contexte analyse → TCD');
        }
        // Contexte recherche/base de données → RECHERCHEV
        else if (['cherch', 'trouver', 'retrouver', 'base', 'liste', 'client', 'produit', 'référence'].some(kw => context.includes(kw))) {
          recommendedCompetence = findCompetenceByName('RECHERCHEV');
          console.log('🎯 [CHAT] Fallback contexte recherche → RECHERCHEV');
        }
        // Niveau intermédiaire/avancé sans contexte → SOMME.SI (plus utile)
        else if (userLevel !== 'debutant') {
          recommendedCompetence = findCompetenceByName('SOMME_SI');
          console.log('🎯 [CHAT] Fallback niveau', userLevel, '→ SOMME_SI');
        }
        // Débutant → SI (plus formateur que SOMME)
        else {
          recommendedCompetence = findCompetenceByName('SI');
          console.log('🎯 [CHAT] Fallback débutant → SI');
        }
      }
    }

    // Ajout de l'interaction à l'historique
    userProfile.addToHistory({
      message,
      response: responseText,
      promptUsed: systemPrompt.substring(0, 50) + '...'
    });
    await saveUserProfile(sessionId, userProfile);

    // GARANTIE : Si on doit montrer les boutons exercice, on DOIT avoir une compétence
    if (shouldShowExerciseActions && !recommendedCompetence) {
      // Fallback ultime - ne devrait jamais arriver avec les nouvelles priorités
      recommendedCompetence = findCompetenceByName('SI');
      console.log('⚠️ [CHAT] Fallback ultime → SI');
    }

    // Log pour debug
    console.log('📤 [CHAT] Réponse:', {
      showExerciseActions: shouldShowExerciseActions,
      triggerGenerator: shouldShowExerciseActions && recommendedCompetence !== null,
      competence: recommendedCompetence?.nom || null
    });

    // Retourner la réponse
    return NextResponse.json({ 
      response: responseText,
      profile: userProfile.getProfile(),
      showExerciseActions: shouldShowExerciseActions,
      // Déclencher le générateur si on montre les boutons ET qu'on a une compétence
      triggerGenerator: shouldShowExerciseActions && recommendedCompetence !== null,
      competence: recommendedCompetence
    });
    
  } catch (error) {
    console.error('❌ [API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Route pour reset le profil utilisateur
export async function DELETE(request) {
  try {
    const { sessionId } = await request.json();
    
    deleteUserProfile(sessionId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [API] Erreur lors du reset:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}