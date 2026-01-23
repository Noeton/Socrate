import { NextResponse } from 'next/server';
import { getUserProfile, saveUserProfile } from '@/shared/utils/userProfilesStore';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimit';
import logger from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * POST /api/chat/intro
 * Génère le message d'introduction de Socrate après une leçon complétée
 */
export async function POST(request) {
  try {
    const { sessionId, lessonCompletion, onboardingProfile } = await request.json();
    
    // Rate limiting
    const rateLimit = await checkRateLimit(sessionId || 'anonymous', '/api/chat/intro');
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit);
    }
    
    if (!lessonCompletion) {
      return NextResponse.json({ error: 'lessonCompletion manquant' }, { status: 400 });
    }
    
    logger.info('CHAT_INTRO', 'Génération intro Socrate', {
      lessonId: lessonCompletion.lessonId,
      success: lessonCompletion.success,
      score: lessonCompletion.score,
      fromCatalogue: lessonCompletion.fromCatalogue || false,
      hintsUsed: lessonCompletion.hintsUsed,
      errorsCount: lessonCompletion.errors?.length || 0
    });
    
    const userProfile = await getUserProfile(sessionId);
    
    // Analyser la performance
    const performance = analyzePerformance(lessonCompletion);
    
    // Déterminer le prochain exercice adapté
    const nextExercise = selectNextExercise(lessonCompletion, performance, userProfile);
    
    // Générer le message d'intro avec Claude
    const introMessage = await generateIntroMessage(lessonCompletion, performance, nextExercise, userProfile, onboardingProfile);
    
    // Sauvegarder le contexte dans le profil
    userProfile.lastLesson = lessonCompletion;
    userProfile.lastPerformance = performance;
    await saveUserProfile(sessionId, userProfile);
    
    // Préparer la réponse - toujours avec boutons Excel
    const response = {
      response: introMessage,
      profile: userProfile.getProfile(),
      showExerciseActions: true,
      exerciseContext: nextExercise.exerciseContext
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('CHAT_INTRO', 'Erreur', { error: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Analyse la performance de l'utilisateur sur la leçon ou l'exercice
 * CORRECTION BUG 3: Prendre en compte le score pour les exercices du catalogue
 */
function analyzePerformance(completion) {
  const { success, hintsUsed, totalHints, score, fromCatalogue, errors, checkpointsFailed } = completion;
  
  let level = 'good'; // 'excellent', 'good', 'struggling'
  let feedback = [];
  
  // CORRECTION BUG 3: Logique différente pour exercices du catalogue (avec score)
  if (fromCatalogue && score !== undefined) {
    // Exercice du catalogue : on se base sur le score
    if (score >= 9) {
      level = 'excellent';
      feedback.push(`Score excellent de ${score}/10`);
    } else if (score >= 7) {
      level = 'good';
      feedback.push(`Bon score de ${score}/10`);
    } else if (score >= 5) {
      level = 'struggling';
      feedback.push(`Score de ${score}/10 - quelques difficultés`);
    } else {
      level = 'struggling';
      feedback.push(`Score de ${score}/10 - besoin de renforcement`);
    }
    
    // Ajouter des détails sur les erreurs
    if (errors && errors.length > 0) {
      feedback.push(`${errors.length} erreur(s) détectée(s)`);
    }
    if (checkpointsFailed && checkpointsFailed.length > 0) {
      feedback.push(`${checkpointsFailed.length} point(s) à retravailler`);
    }
  } else {
    // Leçon interactive : on se base sur les indices utilisés
    if (!success) {
      level = 'struggling';
      feedback.push('La leçon n\'a pas été complétée avec succès');
    } else if (hintsUsed === 0) {
      level = 'excellent';
      feedback.push('Aucun indice utilisé - excellente maîtrise !');
    } else if (hintsUsed <= 1) {
      level = 'good';
      feedback.push('Très bien avec peu d\'aide');
    } else if (hintsUsed >= (totalHints || 3) - 1) {
      level = 'struggling';
      feedback.push('Beaucoup d\'indices utilisés - besoin de renforcement');
    }
  }
  
  return {
    level,
    feedback,
    hintsUsed,
    totalHints,
    score,
    successRate: success ? 1 : 0
  };
}

/**
 * Sélectionne le prochain exercice adapté au niveau
 */
function selectNextExercise(completion, performance, userProfile) {
  const { competenceId, exerciseId, competenceName } = completion;
  
  // Tous les exercices sont maintenant des fichiers Excel
  let difficulty = 'normal';
  let reason = 'Mise en pratique standard';
  
  if (performance.level === 'struggling') {
    difficulty = 'easier';
    reason = 'Pratique guidée sur fichier Excel';
  } else if (performance.level === 'excellent') {
    difficulty = 'harder';
    reason = 'Challenge avancé';
  }
  
  return {
    showExerciseActions: true,
    exerciseContext: { competenceId, exerciseId, competenceName },
    difficulty,
    reason
  };
}

/**
 * Génère le message d'introduction personnalisé avec Claude
 */
async function generateIntroMessage(completion, performance, nextExercise, userProfile, onboardingProfile) {
  const { lessonTitle, competenceName, hintsUsed, totalHints, success } = completion;
  
  // CORRECTION BUG 2: Utiliser le prénom de l'utilisateur
  const userName = onboardingProfile?.name || '';
  const userContext = onboardingProfile?.context || '';
  const userLevel = onboardingProfile?.level || 'intermediate';
  
  // Mapping des contextes métier
  const contextDescriptions = {
    'student': 'étudiant(e)',
    'finance': 'professionnel(le) de la finance',
    'marketing': 'professionnel(le) du marketing',
    'rh': 'professionnel(le) RH',
    'other': ''
  };
  
  const contextDesc = contextDescriptions[userContext] || '';
  
  const systemPrompt = `Tu es Socrate, un tuteur Excel bienveillant et encourageant.
Tu viens d'analyser la performance d'un élève sur ${completion.fromCatalogue ? 'un exercice Excel' : 'une leçon'}.

${userName ? `IMPORTANT: L'élève s'appelle ${userName}. Utilise son prénom naturellement dans ta réponse (1 fois max).` : ''}
${contextDesc ? `Contexte: C'est un(e) ${contextDesc}.` : ''}

Ton rôle :
1. Féliciter l'élève de manière PERSONNALISÉE (pas de formule générique)
2. Donner un feedback constructif sur sa performance
3. ${completion.fromCatalogue && !success ? 'L\'aider à comprendre ses erreurs et proposer de réessayer ou d\'approfondir' : 'Introduire le prochain exercice de manière engageante'}

Style :
- Ton chaleureux mais pas mielleux
- Concis (3-4 phrases max pour le feedback)
- Utilise des emojis avec parcimonie (1-2 max)
- Tutoie l'élève

IMPORTANT : Tu proposes TOUJOURS un exercice Excel à la fin. L'utilisateur verra des boutons pour télécharger l'exercice et l'uploader pour correction.`;

  // CORRECTION BUG 3: Construire un prompt enrichi avec les erreurs détaillées
  let errorsSection = '';
  if (completion.errors && completion.errors.length > 0) {
    const errorsList = completion.errors
      .slice(0, 3)
      .map(e => `- ${e.description || e.probleme || 'Erreur détectée'}`)
      .join('\n');
    errorsSection = `\n\nErreurs principales détectées :\n${errorsList}`;
  }
  
  let checkpointsSection = '';
  if (completion.checkpointsFailed && completion.checkpointsFailed.length > 0) {
    const cpList = completion.checkpointsFailed
      .slice(0, 3)
      .map(cp => `- ${cp.description || cp.feedback || 'Checkpoint non validé'}`)
      .join('\n');
    checkpointsSection = `\n\nPoints à retravailler :\n${cpList}`;
  }

  const userPrompt = `L'élève vient de terminer ${completion.fromCatalogue ? 'l\'exercice' : 'la leçon'} "${lessonTitle}" sur ${competenceName}.

Performance :
- Réussite : ${success ? 'Oui' : 'Non'}
- Score : ${completion.score !== undefined ? `${completion.score}/10` : 'N/A'}
${!completion.fromCatalogue ? `- Indices utilisés : ${hintsUsed}/${totalHints || '?'}` : ''}
- Niveau détecté : ${performance.level}
${completion.masteryLevel ? `- Maîtrise : ${completion.masteryLevel}%` : ''}
${errorsSection}${checkpointsSection}

Prochain exercice suggéré :
- Difficulté : ${nextExercise.difficulty}
- Raison : ${nextExercise.reason}
- Type : Fichier Excel à télécharger

Génère un message d'introduction pour cet élève. Le message doit :
1. Commencer par un feedback sur sa performance ${completion.score !== undefined ? `(score de ${completion.score}/10)` : ''}
2. ${errorsSection || checkpointsSection ? 'Mentionner brièvement 1 ou 2 points à améliorer (sans les lister tous)' : 'Féliciter pour la réussite'}
3. Proposer la suite : ${success ? 'un nouvel exercice pour progresser' : 'de réessayer ou d\'avoir des explications'}

Ne mentionne PAS les détails techniques (checkpoints, masteryLevel, etc.). Sois naturel et encourageant !`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    });
    
    return response.content[0].text;
    
  } catch (error) {
    logger.error('CHAT_INTRO', 'Erreur Claude', { error: error.message });
    
    // Fallback manuel - CORRECTION BUG 2 & 3: utiliser le prénom et adapter au contexte
    const greeting = userName ? `${userName}, ` : '';
    const score = completion.score;
    const isCatalogue = completion.fromCatalogue;
    
    // Fallbacks adaptés - SANS "ci-dessous" ni "télécharge"
    if (isCatalogue && score !== undefined) {
      // Exercice du catalogue avec score
      if (score >= 8) {
        return `🎯 ${greeting}Excellent travail sur **${competenceName}** ! Score de ${score}/10.

Tu maîtrises bien cette compétence. On continue avec un exercice plus avancé ?`;
      } else if (score >= 5) {
        return `👍 ${greeting}Bien joué sur **${competenceName}** ! Score de ${score}/10.

Tu as compris l'essentiel. Veux-tu que je t'explique les points qui t'ont posé problème, ou préfères-tu retenter ?`;
      } else {
        return `💪 ${greeting}Score de ${score}/10 sur **${competenceName}**.

Pas de souci, cette compétence demande de la pratique ! Je peux t'expliquer les concepts ou te proposer un exercice plus guidé.`;
      }
    } else {
      // Leçon interactive
      if (performance.level === 'excellent') {
        return `🎯 ${greeting}Impressionnant ! Tu as maîtrisé **${competenceName}** sans difficulté.

Je te prépare un exercice Excel pour consolider tout ça.`;
      } else if (performance.level === 'struggling') {
        return `👍 ${greeting}Bien joué d'avoir terminé la leçon sur **${competenceName}** !

Je sens que certains points méritent d'être approfondis. Je te prépare un exercice pratique adapté.`;
      } else {
        return `✨ ${greeting}Bravo pour **${lessonTitle}** !

Tu as bien compris le principe. Je te prépare un exercice pour passer à la pratique.`;
      }
    }
  }
}