'use client';

import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import ChatSidebar from './ChatSidebar';
import ExerciseGenerator from './ExerciseGenerator';
import toast from 'react-hot-toast';
import BadgeNotification from './BadgeNotification';
import { Toaster } from 'react-hot-toast';
import { findCompetence, COMPETENCES_EXCEL } from '@/shared/data/competencesExcel';

/**
 * Détecte une compétence mentionnée dans un message
 * @param {string} message - Message en minuscules
 * @returns {Object|null} - Compétence trouvée ou null
 */
function detectCompetenceInMessage(message) {
  // Mots-clés spécifiques pour chaque compétence (priorité haute)
  const keywordMap = {
    'recherchev': 18,
    'vlookup': 18,
    'rechercheh': 19,
    'hlookup': 19,
    'recherchex': 20,
    'xlookup': 20,
    'index': 24,
    'equiv': 24,
    'match': 24,
    'somme.si': 13,
    'sumif': 13,
    'somme.si.ens': 14,
    'sumifs': 14,
    'nb.si': 11,
    'countif': 11,
    'nb.si.ens': 12,
    'countifs': 12,
    'si imbriqué': 16,
    'si imbrique': 16,
    'nested if': 16,
    'sommeprod': 28,
    'sumproduct': 28,
    'tcd': 35,
    'tableau croisé': 35,
    'pivot': 35,
    'graphique': 26,
    'chart': 26,
    'histogramme': 26,
    'camembert': 26,
    'mfc': 25,
    'mise en forme conditionnelle': 25,
    'conditional formatting': 25,
    'sierreur': 17,
    'iferror': 17,
    'concatener': 29,
    'concat': 29,
    'gauche': 30,
    'left': 30,
    'droite': 30,
    'right': 30,
    'stxt': 30,
    'mid': 30,
    'somme': 3,
    'sum': 3,
    'moyenne': 4,
    'average': 4,
    'min': 5,
    'max': 5,
    'si': 9,  // Attention : matcher "si" en dernier (trop générique)
    'if': 9,
  };
  
  // Chercher par mots-clés spécifiques (du plus spécifique au moins spécifique)
  const sortedKeywords = Object.entries(keywordMap).sort((a, b) => b[0].length - a[0].length);
  
  for (const [keyword, competenceId] of sortedKeywords) {
    // Vérifier que le mot-clé est bien présent comme mot entier ou partie significative
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (regex.test(message)) {
      const comp = COMPETENCES_EXCEL.find(c => c.id === competenceId);
      if (comp) {
        return { id: comp.id, nom: comp.nom, key: comp.nom.toLowerCase().replace(/\s+/g, '_') };
      }
    }
  }
  
  // Fallback : chercher avec findCompetence
  for (const comp of COMPETENCES_EXCEL) {
    if (message.includes(comp.nom.toLowerCase())) {
      return { id: comp.id, nom: comp.nom, key: comp.nom.toLowerCase().replace(/\s+/g, '_') };
    }
  }
  
  return null;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userProfile, setUserProfile] = useState({ niveau: null, contexteMetier: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showExerciseActions, setShowExerciseActions] = useState(false); // Boutons télécharger/upload
  const [showExerciseGenerator, setShowExerciseGenerator] = useState(false); // Générateur IA
  const [generatorCompetence, setGeneratorCompetence] = useState(null); // Compétence pour le générateur
  
  const messagesEndRef = useRef(null);

  // Génération sessionId
  useEffect(() => {
    async function initSession() {
      try {
        const stored = localStorage.getItem('socrate-user-id');
        if (stored) {
          setSessionId(stored);
          // Charger les messages sauvegardés
          const savedMessages = localStorage.getItem(`socrate-messages-${stored}`);
          if (savedMessages) {
            setMessages(JSON.parse(savedMessages));
          }
          return;
        }
        
        const response = await fetch('/api/session');
        const data = await response.json();
        if (data.userId) {
          localStorage.setItem('socrate-user-id', data.userId);
          setSessionId(data.userId);
        }
      } catch (error) {
        console.error('Session init failed:', error);
      }
    }
    initSession();
  }, []);


  // Sauvegarder messages en localStorage
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      localStorage.setItem(`socrate-messages-${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);



  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gérer les skills pending depuis le Skill Tree
  useEffect(() => {
    const pendingSkill = localStorage.getItem('socrate-pending-skill');
    if (pendingSkill && sessionId && messages.length === 0) {
      try {
        const skill = JSON.parse(pendingSkill);
        localStorage.removeItem('socrate-pending-skill');
        
        // Envoyer automatiquement un message pour pratiquer cette compétence
        const autoMessage = `Je veux m'entraîner sur "${skill.nom}". Tu peux me proposer un exercice ?`;
        handleSubmit(autoMessage);
      } catch (e) {
        console.error('Erreur parsing pending skill:', e);
        localStorage.removeItem('socrate-pending-skill');
      }
    }
  }, [sessionId, messages.length]);

  // NOUVEAU : Arrivée depuis le catalogue avec boutons Excel activés
  useEffect(() => {
    const showExerciseFlag = localStorage.getItem('socrate-show-exercise-actions');
    const skillContext = localStorage.getItem('socrate-skill-context');
    
    if (showExerciseFlag === 'true' && skillContext && sessionId) {
      // Nettoyer
      localStorage.removeItem('socrate-show-exercise-actions');
      localStorage.removeItem('socrate-skill-context');
      
      try {
        const context = JSON.parse(skillContext);
        
        // Stocker le contexte d'exercice dans le profil
        setUserProfile(prev => ({
          ...prev,
          exerciceEnCours: {
            competence: context.skillName,
            competenceId: context.competenceId
          }
        }));
        
        // Afficher les boutons Excel
        setShowExerciseActions(true);
        
        // Ajouter un message de Socrate
        setMessages([{
          role: 'assistant',
          content: `🎉 Bravo pour la sandbox **${context.skillName}** !\n\nMaintenant, passons à la pratique sur un **vrai fichier Excel**.\n\n📥 Télécharge l'exercice ci-dessous, complète-le dans Excel, puis uploade ton fichier pour que je le corrige !`,
          timestamp: new Date()
        }]);
        
      } catch (e) {
        console.error('Erreur parsing skill context:', e);
      }
    }
  }, [sessionId]);

  // NOUVEAU : Arrivée depuis le catalogue pour apprendre une compétence avec Socrate
  useEffect(() => {
    const awaitingIntro = localStorage.getItem('socrate-awaiting-intro');
    const skillContext = localStorage.getItem('socrate-skill-context');
    
    // Cas : Arrivée depuis catalogue avec contexte compétence (pas de lesson completion)
    if (awaitingIntro === 'true' && skillContext && sessionId && messages.length === 0) {
      // Nettoyer
      localStorage.removeItem('socrate-awaiting-intro');
      localStorage.removeItem('socrate-skill-context');
      
      try {
        const context = JSON.parse(skillContext);
        
        // Vérifier que c'est bien un contexte d'apprentissage (pas juste un skill pending)
        if (context.mode === 'learn_competence') {
          // Stocker le contexte
          setUserProfile(prev => ({
            ...prev,
            competenceEnCours: {
              key: context.skillKey,
              nom: context.skillName,
              id: context.competenceId
            }
          }));
          
          // Message d'accueil de Socrate pour cette compétence
          const introMessage = {
            role: 'assistant',
            content: `📚 **${context.skillName}** — Apprendre avec Socrate\n\nJe suis là pour t'aider à maîtriser cette compétence !\n\nPar quoi veux-tu commencer ?\n\n• **Explique-moi** : Je t'explique le concept avec des exemples\n• **Donne-moi un exercice** : Je génère un fichier Excel personnalisé\n• **J'ai une question** : Pose-moi n'importe quelle question`,
            timestamp: new Date()
          };
          
          setMessages([introMessage]);
        }
      } catch (e) {
        console.error('Erreur parsing skill context:', e);
        localStorage.removeItem('socrate-skill-context');
      }
    }
  }, [sessionId, messages.length]);

  // Socrate parle en premier après une leçon complétée
  useEffect(() => {
    const awaitingIntro = localStorage.getItem('socrate-awaiting-intro');
    const lessonCompletion = localStorage.getItem('socrate-lesson-completion');
    
    if (awaitingIntro && lessonCompletion && sessionId) {
      // Nettoyer
      localStorage.removeItem('socrate-awaiting-intro');
      localStorage.removeItem('socrate-lesson-completion');
      
      // Parser les données
      let completion = null;
      try {
        completion = JSON.parse(lessonCompletion);
      } catch (e) {
        console.error('Erreur parsing lesson completion:', e);
        return;
      }
      
      // Appeler l'API pour obtenir le message initial de Socrate
      fetchSocrateIntro(completion);
    }
  }, [sessionId]);

  // Obtenir le message d'introduction de Socrate basé sur la complétion
  const fetchSocrateIntro = async (completion) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat/intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          lessonCompletion: completion
        })
      });
      
      const data = await response.json();
      
      if (data.response) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        
        // Ajouter sandbox si présent
        if (data.sandbox) {
          assistantMessage.sandbox = data.sandbox;
        }
        
        // Activer les boutons Excel si demandé
        if (data.showExerciseActions) {
          setShowExerciseActions(true);
        }
        
        // Stocker le contexte d'exercice pour le bouton télécharger
        if (data.exerciseContext) {
          setUserProfile(prev => ({
            ...prev,
            exerciceEnCours: {
              competenceId: data.exerciseContext.competenceId,
              competence: data.exerciseContext.competenceName,
              exerciseId: data.exerciseContext.exerciseId
            }
          }));
        }
        
        setMessages([assistantMessage]);
        
        if (data.profile) {
          setUserProfile(prev => ({
            ...prev,
            ...data.profile
          }));
        }
      }
    } catch (error) {
      console.error('Erreur fetch intro:', error);
      // Fallback : message générique
      setMessages([{
        role: 'assistant',
        content: `🎉 Bravo pour avoir terminé **${completion.lessonTitle}** !\n\nTu veux pratiquer avec un exercice ?`,
        timestamp: new Date()
      }]);
      setShowExerciseActions(true); // Proposer quand même les boutons
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage = messageText.trim();
    const lowerMessage = userMessage.toLowerCase();
    
    // Détecter les demandes d'exercice
    const exercisePatterns = [
      'exercice', 'donne-moi', 'génère', 'genere', 'crée', 'cree',
      'pratique', 'entraîne', 'entraine', 'challenge', 'test',
      'm\'entraîner', 'je veux pratiquer', 'un exo'
    ];
    const isExerciseRequest = exercisePatterns.some(p => lowerMessage.includes(p));
    
    // NOUVEAU : Détecter la compétence mentionnée dans le message
    let detectedCompetence = userProfile?.competenceEnCours;
    
    if (isExerciseRequest && !detectedCompetence) {
      // Chercher une compétence dans le message
      detectedCompetence = detectCompetenceInMessage(lowerMessage);
      
      if (detectedCompetence) {
        console.log('🎯 [CHAT] Compétence détectée dans le message:', detectedCompetence.nom);
      }
    }
    
    // Si demande d'exercice avec compétence (en cours OU détectée) → lancer le générateur
    if (isExerciseRequest && detectedCompetence) {
      setInput('');
      setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
      
      // Afficher un message de Socrate
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Je génère un exercice personnalisé sur **${detectedCompetence.nom}** avec des données réelles. Un instant... 🎯`,
        timestamp: new Date()
      }]);
      
      // Ouvrir le générateur avec la compétence
      setGeneratorCompetence(detectedCompetence);
      setShowExerciseGenerator(true);
      return;
    }
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          sessionId: sessionId,
          competenceEnCours: userProfile?.competenceEnCours
        })
      });

      const data = await response.json();
      
      // Construire le message avec les données sandbox si présentes
      const assistantMessage = { 
        role: 'assistant', 
        content: data.response,
        timestamp: new Date()
      };
      
      // Ajouter les données sandbox si présentes
      if (data.sandbox) {
        assistantMessage.sandbox = data.sandbox;
        console.log('🎮 [CHAT] Sandbox reçue:', data.sandbox.titre);
        setShowExerciseActions(false); // Cacher les boutons Excel si sandbox
      }
      
      // Activer les boutons télécharger/upload si demandé par l'API
      if (data.showExerciseActions) {
        console.log('📥 [CHAT] Activation boutons exercice Excel');
        setShowExerciseActions(true);
      }
      
      // Vérifier si l'API suggère de lancer le générateur
      if (data.triggerGenerator && data.competence) {
        setGeneratorCompetence(data.competence);
        setShowExerciseGenerator(true);
      }
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.profile) {
        setUserProfile(data.profile);
      }

      // Mettre à jour le streak
      try {
        await fetch('/api/streak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: sessionId })
        });
      } catch (err) {
        console.log('Streak update failed (non-blocking):', err);
      }

    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Erreur de connexion. Réessaie !',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      setMessages([]);
      setUserProfile({ niveau: null, contexteMetier: null });
      
      // Supprimer messages et recréer session
      localStorage.removeItem(`socrate-messages-${sessionId}`);
      localStorage.removeItem('socrate-user-id');
      
      const response = await fetch('/api/session');
      const data = await response.json();
      if (data.userId) {
        localStorage.setItem('socrate-user-id', data.userId);
        setSessionId(data.userId);
      }
    } catch (error) {
      console.error('Erreur reset:', error);
    }
  };

  // Handler quand le générateur a créé un exercice
  const handleExerciseReady = (exercise) => {
    console.log('🎯 [CHAT] Exercice généré:', exercise.titre);
    
    // Fermer le générateur
    setShowExerciseGenerator(false);
    setGeneratorCompetence(null);
    
    // IMPORTANT : Stocker l'exercice pour la correction
    localStorage.setItem('current-exercise-id', exercise.id);
    localStorage.setItem('current-exercise-data', JSON.stringify(exercise));
    console.log('💾 [CHAT] Exercice stocké:', exercise.id);
    
    // Construire un message riche avec le contexte de l'exercice
    let messageContent = `**${exercise.titre}**\n\n`;
    
    if (typeof exercise.contexte === 'string') {
      messageContent += `${exercise.contexte}\n\n`;
    } else if (exercise.contexte?.situation) {
      messageContent += `${exercise.contexte.situation}\n\n`;
      if (exercise.contexte.manager?.demande) {
        messageContent += `> _"${exercise.contexte.manager.demande}"_\n> — ${exercise.contexte.manager.nom}\n\n`;
      }
    }
    
    // Instructions
    if (exercise.instructions?.length) {
      messageContent += `**Ce que tu dois faire :**\n`;
      exercise.instructions.forEach((instr, i) => {
        messageContent += `${i + 1}. ${instr}\n`;
      });
      messageContent += '\n';
    }
    
    // Stats
    const nbLignes = exercise.donnees?.rows?.length || 0;
    const nbQuestions = exercise.checkpoints?.length || 0;
    messageContent += `📊 _${nbLignes} lignes de données • ${nbQuestions} questions_\n\n`;
    messageContent += `Télécharge le fichier Excel et complète-le. Une fois terminé, uploade-le pour que je le corrige !`;
    
    // Ajouter le message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: messageContent,
      timestamp: new Date(),
      exerciseData: exercise // Pour le téléchargement
    }]);
    
    // Activer les boutons Excel
    setShowExerciseActions(true);
    
    // Stocker l'exercice pour le téléchargement
    setUserProfile(prev => ({
      ...prev,
      currentExercise: exercise
    }));
  };

  // Handler pour annuler le générateur
  const handleGeneratorCancel = () => {
    setShowExerciseGenerator(false);
    setGeneratorCompetence(null);
    
    // Message d'annulation sobre
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Pas de souci ! Dis-moi comment je peux t\'aider autrement.',
      timestamp: new Date()
    }]);
  };

  const handleCorrectionResult = async (result) => {
    const { score, feedback, errors, competencesValidated, success, detailedFeedback, exerciseId } = result;
    
    // Cacher les boutons d'exercice après correction
    setShowExerciseActions(false);
    
    const emoji = success ? '🎉' : '💪';
    const titre = success ? 'Bravo !' : 'Continue comme ça !';
    
    let message = `${emoji} **${titre}**\n\n`;
    message += `**Score : ${score}/10**\n\n`;
    message += `${feedback}\n\n`;
    
    if (competencesValidated && competencesValidated.length > 0) {
      message += `✅ **Compétences validées :** ${competencesValidated.join(', ')}\n\n`;
    }
    
    if (errors && errors.length > 0) {
      message += `⚠️ **Points à améliorer :**\n`;
      errors.slice(0, 3).forEach(err => {
        message += `- ${err.description || err.probleme || 'Erreur détectée'}\n`;
      });
    }
    
    // Ajouter le message de correction
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: message,
      timestamp: new Date(),
      isCorrection: true,
      detailedFeedback: detailedFeedback || null
    }]);
    
    // Afficher les badges
    if (result.newBadges && result.newBadges.length > 0) {
      toast.custom(
        <BadgeNotification badges={result.newBadges} />, 
        { 
          duration: 10000, 
          position: 'top-center',
          style: { maxWidth: '500px' }
        }
      );
    }
    
    // NOUVEAU : Socrate propose la suite automatiquement après un court délai
    setTimeout(async () => {
      await proposeSuiteApresCorrection(score, errors, competencesValidated);
    }, 1500);
  };

  // Propose la suite après une correction
  const proposeSuiteApresCorrection = async (score, errors, competencesValidated) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[SYSTÈME] L'utilisateur vient de terminer un exercice Excel avec un score de ${score}/10. ${
            score >= 8 
              ? 'Il a très bien réussi.' 
              : score >= 5 
                ? `Il a fait quelques erreurs : ${errors?.slice(0,2).map(e => e.description || e.probleme).join(', ')}.`
                : `Il a eu des difficultés : ${errors?.slice(0,3).map(e => e.description || e.probleme).join(', ')}.`
          } Propose-lui la suite de manière naturelle et encourageante.`,
          history: messages,
          sessionId: sessionId,
          isSystemMessage: true // Pour que l'API sache que c'est un message système
        })
      });

      const data = await response.json();
      
      if (data.response) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        
        if (data.sandbox) {
          assistantMessage.sandbox = data.sandbox;
        }
        
        if (data.showExerciseActions) {
          setShowExerciseActions(true);
        }
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Erreur suite correction:', error);
      // Fallback : message simple
      const fallbackMessage = score >= 7 
        ? "Tu veux continuer avec un exercice plus challengeant, ou préfères-tu revoir un autre concept ?"
        : "Tu veux que je t'explique les points où tu as eu des difficultés, ou préfères-tu réessayer un exercice similaire ?";
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallbackMessage,
        timestamp: new Date()
      }]);
      setShowExerciseActions(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler pour la complétion d'un exercice sandbox
  const handleSandboxComplete = async (result) => {
    console.log('🎮 [CHAT] Sandbox complétée:', result);
    
    // ENREGISTRER le résultat en BDD
    try {
      await fetch('/api/sandbox-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionId,
          exerciseId: result.exerciseId || `sandbox_${Date.now()}`,
          competence: result.competence || userProfile?.competenceEnCours?.key,
          competenceId: userProfile?.competenceEnCours?.id,
          success: result.success,
          formula: result.formula,
          expectedFormula: result.expectedFormula,
          hintsUsed: result.hintsUsed || 0,
          attempts: result.attempts || 1
        })
      });
      console.log('💾 [CHAT] Résultat sandbox enregistré');
    } catch (e) {
      console.warn('⚠️ [CHAT] Erreur enregistrement sandbox:', e.message);
    }
    
    if (result.success) {
      // Message de félicitations
      const congratsMessage = `🎉 **Bravo !** Tu as réussi l'exercice sandbox !\n\nFormule utilisée : \`${result.formula}\`\nRésultat : **${result.result}**\n\nTu veux continuer avec un autre exercice ou approfondir cette notion ?`;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: congratsMessage,
        timestamp: new Date()
      }]);
    }
  };

  /**
   * Handler quand un exercice est chargé via le bouton "Pratiquer dans la sandbox"
   */
  const handleExerciseLoaded = (exercise) => {
    console.log('🎮 [CHAT] Exercice chargé:', exercise.id);
    
    // Transformer l'exercice en format sandbox pour l'afficher dans un message
    const sandboxData = {
      titre: exercise.titre,
      data: exercise.donnees?.rows ? 
        [exercise.donnees.headers, ...exercise.donnees.rows] : 
        [],
      editableCells: exercise.checkpoints?.map(cp => cp.cellule) || [],
      instruction: exercise.consignes?.join('\n') || exercise.contexte || '',
      expectedFormula: exercise.checkpoints?.[0]?.fonction || null,
      expectedResult: exercise.checkpoints?.[0]?.resultat_attendu || null,
      tolerance: exercise.checkpoints?.[0]?.tolerance || 0.01,
      hints: exercise.checkpoints?.[0]?.indices || [],
      readOnly: false
    };
    
    // Créer un message avec la sandbox
    const exerciseMessage = {
      role: 'assistant',
      content: `## 📊 ${exercise.titre}\n\n${exercise.contexte || ''}\n\n${exercise.presentation_donnees || ''}\n\n**Consignes :**\n${exercise.consignes?.map((c, i) => `${i+1}. ${c}`).join('\n') || 'Complète l\'exercice ci-dessous.'}`,
      timestamp: new Date(),
      sandbox: sandboxData
    };
    
    setMessages(prev => [...prev, exerciseMessage]);
    
    // Mettre à jour le profil avec l'exercice en cours
    setUserProfile(prev => ({
      ...prev,
      exerciceEnCours: {
        id: exercise.id,
        titre: exercise.titre,
        competences: exercise.competences
      }
    }));
    
    // Cacher les boutons après chargement
    setShowExerciseActions(false);
  };


  return (
    <div className="chat-container">
    <ChatHeader 
        userProfile={userProfile}
        onReset={handleReset}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sessionId={sessionId}
      />

      {/* OVERLAY : Générateur d'exercices dynamique */}
      {showExerciseGenerator && generatorCompetence && (
        <div className="generator-overlay">
          <div className="generator-backdrop" onClick={handleGeneratorCancel} />
          <div className="generator-modal">
            <ExerciseGenerator
              competence={generatorCompetence}
              userId={sessionId}
              metier={userProfile?.contexteMetier || 'ventes'}
              onExerciseReady={handleExerciseReady}
              onCancel={handleGeneratorCancel}
              autoStart={true}
            />
          </div>
        </div>
      )}

      <div className="chat-main">
        {sidebarOpen && (
          <ChatSidebar 
            userProfile={userProfile}
            onClose={() => setSidebarOpen(false)}
            onNewChat={handleReset}
          />
        )}

        <div className="chat-content">
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">💡</div>
                <h2>Bienvenue sur Socrate</h2>
                <p>Ton tuteur Excel IA pour devenir un pro des tableurs</p>
                <div className="quick-starts">
                  <button onClick={() => handleSubmit("Je suis débutant en Excel")}>
                    🎓 Je débute en Excel
                  </button>
                  <button onClick={() => handleSubmit("Donne-moi un exercice adapté")}>
                    🎯 Un exercice maintenant
                  </button>
                  <button onClick={() => handleSubmit("J'ai un problème avec une formule")}>
                    🔧 Aide avec une formule
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <MessageBubble 
                key={idx} 
                message={msg} 
                isLast={idx === messages.length - 1}
                onSandboxComplete={handleSandboxComplete}
              />
            ))}

            {isLoading && (
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <ChatInput 
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={isLoading}
            userProfile={userProfile}
            sessionId={sessionId}
            onCorrectionResult={handleCorrectionResult}
            onExerciseLoaded={handleExerciseLoaded}
            showExerciseActions={showExerciseActions}
          />
        </div>
      </div>

      <style jsx>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #fafafa;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* OVERLAY GÉNÉRATEUR */
        .generator-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .generator-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }

        .generator-modal {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 500px;
          animation: slideUp 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .chat-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .chat-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem 1.5rem;
          scroll-behavior: smooth;
        }

        .messages-container::-webkit-scrollbar {
          width: 8px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
          padding: 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .empty-state h2 {
          font-size: 1.75rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 2rem;
        }

        .quick-starts {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
          max-width: 400px;
        }

        .quick-starts button {
          padding: 0.875rem 1.5rem;
          background: white;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 0.95rem;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-weight: 500;
        }

        .quick-starts button:hover {
          border-color: #3b82f6;
          background: #eff6ff;
          transform: translateY(-1px);
        }

        .typing-indicator {
          display: flex;
          gap: 0.4rem;
          padding: 1rem;
          align-items: center;
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .messages-container {
            padding: 1rem;
          }

          .empty-state h2 {
            font-size: 1.5rem;
          }

          .quick-starts {
            max-width: 100%;
          }
        }
      `}</style>
      <Toaster 
  position="top-center" 
  gutter={16}
  containerStyle={{ top: 80 }}
/>

    </div>
  );
}