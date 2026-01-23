/**
 * SÉLECTEUR DE PROMPT INTELLIGENT - Version 2.0
 * 
 * MISE À JOUR : Injection automatique des compétences disponibles
 */

import BASE_PROMPT from '../prompts/base.js';
import DIAGNOSTIC_PROMPT from '../prompts/diagnostic.js';
import PEDAGOGUE_DEBUTANT from '../prompts/pedagogue/debutant.js';
import PEDAGOGUE_INTERMEDIAIRE from '../prompts/pedagogue/intermediaire.js';
import PEDAGOGUE_AVANCE from '../prompts/pedagogue/avance.js';
import EXERCISEUR_PROMPT from '../prompts/exerciseur.js';
import DEBUGGER_PROMPT from '../prompts/debugger.js';
import { COMPETENCES_INJECTION } from '../prompts/competences-injection.js';

export function selectPrompt(userProfile, userMessage = '', competenceEnCours = null) {
  
  // CAS 0A : DEMANDE DE DEBUG
  const debugKeywords = ['bug', 'marche pas', 'fonctionne pas', 'erreur', 'problème', 'ne marche pas'];
  const excelErrors = ['#NOM?', '#REF!', '#DIV/0!', '#VALEUR!', '#N/A', '#NUL!', '#NOMBRE!'];
  
  const isDebugRequest = debugKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  ) || excelErrors.some(error => userMessage.includes(error));
  
  if (isDebugRequest && userProfile.niveau) {
    console.log('🔧 [PROMPT SELECTOR] → DEBUGGER');
    
    let debugPrompt = DEBUGGER_PROMPT;
    debugPrompt = debugPrompt.replace(/{niveau}/g, userProfile.niveau || 'débutant');
    debugPrompt = debugPrompt.replace(/{contexteMetier}/g, userProfile.contexteMetier || 'général');
    debugPrompt += COMPETENCES_INJECTION; // ← INJECTION
    
    return debugPrompt;
  }
  
  // CAS 0B : DEMANDE D'EXERCICE
  const exerciseKeywords = ['exercice', 'exercise', 'pratique', 'entraîne', 'entraine', 's\'entraîner'];
  
  const isExerciseRequest = exerciseKeywords.some(keyword => 
    userMessage.toLowerCase().includes(keyword)
  );
  
  if (isExerciseRequest && userProfile.niveau) {
    console.log('🎯 [PROMPT SELECTOR] → EXERCISEUR');
    
    let exercisePrompt = EXERCISEUR_PROMPT;
    exercisePrompt = exercisePrompt.replace(/{niveau}/g, userProfile.niveau || 'débutant');
    exercisePrompt = exercisePrompt.replace(/{contexteMetier}/g, userProfile.contexteMetier || 'général');
    // Note: EXERCISEUR_PROMPT contient déjà la liste des compétences
    
    return exercisePrompt;
  }
  
  // CAS 0C : CONTEXTE COMPÉTENCE SANS NIVEAU CONNU
  // → L'utilisateur arrive sur une page de compétence et pose une question
  // → On répond directement au lieu de faire un diagnostic
  if (!userProfile.niveau && competenceEnCours) {
    console.log('🎯 [PROMPT SELECTOR] → PÉDAGOGUE CONTEXTUEL (bypass diagnostic)');
    
    // Utiliser le prompt intermédiaire par défaut (le plus polyvalent)
    let contextualPrompt = PEDAGOGUE_INTERMEDIAIRE;
    contextualPrompt = contextualPrompt.replace(/{contexteMetier}/g, userProfile.contexteMetier || 'contexte général');
    
    // Ajouter le contexte de compétence
    contextualPrompt += `

═══════════════════════════════════════════════════════════════
CONTEXTE : L'utilisateur apprend "${competenceEnCours.nom}"
═══════════════════════════════════════════════════════════════
- Compétence en cours : ${competenceEnCours.nom} (ID: ${competenceEnCours.id})
- L'utilisateur a posé une question ou demandé une explication
- RÉPONDS D'ABORD À SA QUESTION de manière claire et pédagogique
- Tu peux ensuite proposer un exercice ou demander s'il veut approfondir
- NE FAIS PAS de diagnostic (niveau/métier) - tu pourras l'inférer au fil de la conversation
═══════════════════════════════════════════════════════════════`;

    contextualPrompt += COMPETENCES_INJECTION;
    return contextualPrompt;
  }
  
  // CAS 1 : DIAGNOSTIC NÉCESSAIRE
  if (!userProfile.niveau) {
    console.log('🔍 [PROMPT SELECTOR] → DIAGNOSTIC');
    return DIAGNOSTIC_PROMPT + COMPETENCES_INJECTION; // ← INJECTION
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

  console.log(`✅ [PROMPT SELECTOR] → ${promptName}`);

  // Injection du contexte métier
  if (selectedPrompt.includes('{contexteMetier}')) {
    const contexte = userProfile.contexteMetier || 'contexte professionnel général';
    selectedPrompt = selectedPrompt.replace(/{contexteMetier}/g, contexte);
    console.log(`📊 [PROMPT SELECTOR] Contexte métier: ${contexte}`);
  }

  // INJECTION DES COMPÉTENCES DISPONIBLES
  selectedPrompt += COMPETENCES_INJECTION;

  return selectedPrompt;
}

export function detectAndUpdateProfile(userMessage, userProfile) {
  let updated = false;
  const messageLower = userMessage.toLowerCase();

  // DÉTECTION DU NIVEAU EXPLICITE
  const keywordsDebutant = [
    'débutant', 'debutant', 'jamais utilisé', 'jamais ouvert',
    'première fois', 'je ne connais pas', 'je débute',
    'je commence', 'novice', 'aucune expérience', 'je ne sais pas'
  ];

  const keywordsIntermediaire = [
    'intermédiaire', 'quelques formules', 'je connais somme',
    'je connais moyenne', 'bases', 'j\'utilise régulièrement',
    'niveau moyen', 'pas expert', 'à l\'aise', 'je me débrouille',
    'je délègue', 'tous les jours', 'régulièrement'
  ];

  const keywordsAvance = [
    'avancé', 'avance', 'expert', 'recherchev', 'tcd',
    'tableau croisé', 'vba', 'macro', 'power query',
    'power pivot', 'je maîtrise', 'je connais bien'
  ];

  // NOUVEAUTÉ : Postes qui impliquent un niveau minimum
  const postesAvances = [
    'ceo', 'cfo', 'coo', 'cto', 'directeur', 'directrice', 
    'daf', 'dg', 'président', 'fondateur', 'founder',
    'partner', 'associé', 'consultant senior', 'manager',
    'head of', 'chief', 'vp', 'vice president'
  ];
  
  const postesIntermediaires = [
    'analyste', 'analyst', 'commercial', 'chef de projet',
    'responsable', 'coordinateur', 'chargé', 'assistant',
    'contrôleur', 'comptable', 'auditeur', 'consultant'
  ];

  // Détection niveau explicite (prioritaire)
  if (keywordsDebutant.some(keyword => messageLower.includes(keyword))) {
    if (userProfile.niveau !== 'debutant') {
      userProfile.setNiveau('debutant');
      console.log('🔍 [PROFILE DETECTOR] Niveau explicite: DÉBUTANT');
      updated = true;
    }
  }
  else if (keywordsAvance.some(keyword => messageLower.includes(keyword))) {
    if (userProfile.niveau !== 'avance') {
      userProfile.setNiveau('avance');
      console.log('🔍 [PROFILE DETECTOR] Niveau explicite: AVANCÉ');
      updated = true;
    }
  }
  else if (keywordsIntermediaire.some(keyword => messageLower.includes(keyword))) {
    if (userProfile.niveau !== 'intermediaire') {
      userProfile.setNiveau('intermediaire');
      console.log('🔍 [PROFILE DETECTOR] Niveau explicite: INTERMÉDIAIRE');
      updated = true;
    }
  }
  // NOUVEAUTÉ : Inférence depuis le poste (si pas de niveau explicite)
  else if (!userProfile.niveau) {
    if (postesAvances.some(poste => messageLower.includes(poste))) {
      userProfile.setNiveau('avance');
      console.log('🔍 [PROFILE DETECTOR] Niveau inféré du poste: AVANCÉ');
      updated = true;
    }
    else if (postesIntermediaires.some(poste => messageLower.includes(poste))) {
      userProfile.setNiveau('intermediaire');
      console.log('🔍 [PROFILE DETECTOR] Niveau inféré du poste: INTERMÉDIAIRE');
      updated = true;
    }
  }

  // DÉTECTION DU MÉTIER
  const metiers = {
    'finance': ['analyste financier', 'm&a', 'private equity', 'controleur de gestion', 'controleur', 'auditeur', 'trader', 'daf', 'cfo', 'finance'],
    'comptabilité': ['comptable', 'compta', 'comptabilité'],
    'vente': ['vente', 'commercial', 'business', 'sales', 'account manager'],
    'rh': ['rh', 'ressources humaines', 'recrutement', 'paie', 'drh'],
    'logistique': ['logistique', 'supply chain', 'stock', 'approvisionnement'],
    'marketing': ['marketing', 'communication', 'publicité', 'digital', 'growth'],
    'data': ['data', 'analyse', 'statistiques', 'reporting', 'bi', 'business intelligence'],
    'direction': ['ceo', 'coo', 'cfo', 'directeur', 'dg', 'président', 'fondateur', 'founder', 'gérant']
  };

  for (const [metier, keywords] of Object.entries(metiers)) {
    if (keywords.some(keyword => messageLower.includes(keyword))) {
      if (userProfile.contexteMetier !== metier) {
        userProfile.setContexteMetier(metier);
        console.log(`🔍 [PROFILE DETECTOR] Métier: ${metier.toUpperCase()}`);
        updated = true;
      }
      break;
    }
  }

  return updated;
}

export default { selectPrompt, detectAndUpdateProfile };