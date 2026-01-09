/**
 * SÉLECTEUR DE PROMPT INTELLIGENT - Version Next.js
 * Compatible ES6 modules
 */

// Import dynamique des prompts (Next.js compatible)
import BASE_PROMPT from '../prompts/base.js';
import DIAGNOSTIC_PROMPT from '../prompts/diagnostic.js';
import PEDAGOGUE_DEBUTANT from '../prompts/pedagogue/debutant.js';
import PEDAGOGUE_INTERMEDIAIRE from '../prompts/pedagogue/intermediaire.js';
import PEDAGOGUE_AVANCE from '../prompts/pedagogue/avance.js';
import EXERCISEUR_PROMPT from '../prompts/exerciseur.js';
import DEBUGGER_PROMPT from '../prompts/debugger.js';

export function selectPrompt(userProfile, userMessage = '') {
  
  // CAS 0A : DEMANDE DE DEBUG (détection par mots-clés + erreurs Excel)
  const debugKeywords = ['bug', 'marche pas', 'fonctionne pas', 'erreur', 'problème', 'ne marche pas'];
  const excelErrors = ['#NOM?', '#REF!', '#DIV/0!', '#VALEUR!', '#N/A', '#NUL!', '#NOMBRE!'];
  
  const isDebugRequest = debugKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  ) || excelErrors.some(error => userMessage.includes(error));
  
  if (isDebugRequest && userProfile.niveau) {
    console.log('🔧 [PROMPT SELECTOR] → DEBUGGER (demande de debug détectée)');
    
    // Injection du niveau et métier dans le prompt debugger
    let debugPrompt = DEBUGGER_PROMPT;
    debugPrompt = debugPrompt.replace(/{niveau}/g, userProfile.niveau || 'débutant');
    debugPrompt = debugPrompt.replace(/{contexteMetier}/g, userProfile.contexteMetier || 'général');
    
    return debugPrompt;
  }
  
  // CAS 0B : DEMANDE D'EXERCICE (détection par mots-clés)
  const exerciseKeywords = ['exercice', 'exercise', 'pratique', 'entraîne', 'entraine', 's\'entraîner'];
  
  const isExerciseRequest = exerciseKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );
  
  if (isExerciseRequest && userProfile.niveau) {
    console.log('🎯 [PROMPT SELECTOR] → EXERCISEUR (demande d\'exercice détectée)');
    
    // Injection du niveau et métier dans le prompt exerciseur
    let exercisePrompt = EXERCISEUR_PROMPT;
    exercisePrompt = exercisePrompt.replace(/{niveau}/g, userProfile.niveau || 'débutant');
    exercisePrompt = exercisePrompt.replace(/{contexteMetier}/g, userProfile.contexteMetier || 'général');
    
    return exercisePrompt;
  }
  
  // CAS 1 : DIAGNOSTIC NÉCESSAIRE
  if (!userProfile.niveau) {
    console.log('🔍 [PROMPT SELECTOR] → DIAGNOSTIC (niveau non défini)');
    return DIAGNOSTIC_PROMPT;
  }

  // CAS 2 : ENSEIGNEMENT ADAPTÉ AU NIVEAU
  let selectedPrompt;
  let promptName;

  switch (userProfile.niveau) {
    case 'debutant':
      selectedPrompt = PEDAGOGUE_DEBUTANT;
      promptName = 'PÉDAGOGUE DÉBUTANT';
      break;
    
    case 'intermediaire':
      selectedPrompt = PEDAGOGUE_INTERMEDIAIRE;
      promptName = 'PÉDAGOGUE INTERMÉDIAIRE';
      break;
    
    case 'avance':
      selectedPrompt = PEDAGOGUE_AVANCE;
      promptName = 'PÉDAGOGUE AVANCÉ';
      break;
    
    default:
      console.warn(`⚠️  [PROMPT SELECTOR] Niveau inconnu: "${userProfile.niveau}"`);
      selectedPrompt = BASE_PROMPT;
      promptName = 'BASE (fallback)';
  }

  console.log(`✅ [PROMPT SELECTOR] → ${promptName} (niveau: ${userProfile.niveau})`);

  // CAS 3 : INJECTION DU CONTEXTE MÉTIER
  if (selectedPrompt.includes('{contexteMetier}')) {
    const contexte = userProfile.contexteMetier || 'contexte professionnel général';
    selectedPrompt = selectedPrompt.replace(/{contexteMetier}/g, contexte);
    console.log(`📊 [PROMPT SELECTOR] Contexte métier injecté: ${contexte}`);
  }

  return selectedPrompt;
}

export function detectAndUpdateProfile(userMessage, userProfile) {
  let updated = false;
  const messageLower = userMessage.toLowerCase();

  // DÉTECTION DU NIVEAU
  const keywordsDebutant = [
    'débutant', 'debutant', 'jamais utilisé', 'jamais ouvert',
    'première fois', 'je ne connais pas', 'je débute',
    'je commence', 'novice', 'aucune expérience'
  ];

  const keywordsIntermediaire = [
    'intermédiaire', 'quelques formules', 'je connais somme',
    'je connais moyenne', 'bases', 'j\'utilise régulièrement',
    'niveau moyen', 'pas expert', 'formules simples'
  ];

  const keywordsAvance = [
    'avancé', 'avance', 'expert', 'recherchev', 'tcd',
    'tableau croisé', 'vba', 'macro', 'power query',
    'power pivot', 'je maîtrise'
  ];

  if (keywordsDebutant.some(keyword => messageLower.includes(keyword))) {
    if (userProfile.niveau !== 'debutant') {
      userProfile.setNiveau('debutant');
      console.log('🔍 [PROFILE DETECTOR] Niveau détecté: DÉBUTANT');
      updated = true;
    }
  }
  else if (keywordsIntermediaire.some(keyword => messageLower.includes(keyword))) {
    if (userProfile.niveau !== 'intermediaire') {
      userProfile.setNiveau('intermediaire');
      console.log('🔍 [PROFILE DETECTOR] Niveau détecté: INTERMÉDIAIRE');
      updated = true;
    }
  }
  else if (keywordsAvance.some(keyword => messageLower.includes(keyword))) {
    if (userProfile.niveau !== 'avance') {
      userProfile.setNiveau('avance');
      console.log('🔍 [PROFILE DETECTOR] Niveau détecté: AVANCÉ');
      updated = true;
    }
  }

  // DÉTECTION DU MÉTIER
  const metiers = {
    'comptabilité': ['compta', 'comptabilité', 'comptable', 'finance', 'financier'],
    'vente': ['vente', 'commercial', 'business', 'sales'],
    'rh': ['rh', 'ressources humaines', 'recrutement', 'paie'],
    'logistique': ['logistique', 'supply chain', 'stock', 'approvisionnement'],
    'marketing': ['marketing', 'communication', 'publicité', 'digital'],
    'data': ['data', 'analyse', 'statistiques', 'reporting']
  };

  for (const [metier, keywords] of Object.entries(metiers)) {
    if (keywords.some(keyword => messageLower.includes(keyword))) {
      if (userProfile.contexteMetier !== metier) {
        userProfile.setContexteMetier(metier);
        console.log(`🔍 [PROFILE DETECTOR] Métier détecté: ${metier.toUpperCase()}`);
        updated = true;
      }
      break;
    }
  }

  return updated;
}

export default { selectPrompt, detectAndUpdateProfile };