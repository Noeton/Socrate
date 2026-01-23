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

export function selectPrompt(userProfile, userMessage = '') {
  
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

  // DÉTECTION DU NIVEAU
  const keywordsDebutant = [
    'débutant', 'debutant', 'jamais utilisé', 'jamais ouvert',
    'première fois', 'je ne connais pas', 'je débute',
    'je commence', 'novice', 'aucune expérience'
  ];

  const keywordsIntermediaire = [
    'intermédiaire', 'quelques formules', 'je connais somme',
    'je connais moyenne', 'bases', 'j\'utilise régulièrement',
    'niveau moyen', 'pas expert', 'à l\'aise' 
  ];

  const keywordsAvance = [
    'avancé', 'avance', 'expert', 'recherchev', 'tcd',
    'tableau croisé', 'vba', 'macro', 'power query',
    'power pivot', 'je maîtrise'
  ];

  if (keywordsDebutant.some(keyword => messageLower.includes(keyword))) {
    if (userProfile.niveau !== 'debutant') {
      userProfile.setNiveau('debutant');
      console.log('🔍 [PROFILE DETECTOR] Niveau: DÉBUTANT');
      updated = true;
    }
  }
  else if (keywordsIntermediaire.some(keyword => messageLower.includes(keyword))) {
    if (userProfile.niveau !== 'intermediaire') {
      userProfile.setNiveau('intermediaire');
      console.log('🔍 [PROFILE DETECTOR] Niveau: INTERMÉDIAIRE');
      updated = true;
    }
  }
  else if (keywordsAvance.some(keyword => messageLower.includes(keyword))) {
    if (userProfile.niveau !== 'avance') {
      userProfile.setNiveau('avance');
      console.log('🔍 [PROFILE DETECTOR] Niveau: AVANCÉ');
      updated = true;
    }
  }

  // DÉTECTION DU MÉTIER
  const metiers = {
    'finance': ['analyste financier', 'm&a', 'private equity', 'controleur de gestion', 'controleur', 'auditeur', 'trader'],
    'comptabilité': ['comptable', 'compta', 'comptabilité'],
    'vente': ['vente', 'commercial', 'business', 'sales'],
    'rh': ['rh', 'ressources humaines', 'recrutement', 'paie'],
    'logistique': ['logistique', 'supply chain', 'stock', 'approvisionnement'],
    'marketing': ['marketing', 'communication', 'publicité', 'digital', 'growth'],
    'data': ['data', 'analyse', 'statistiques', 'reporting']
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
