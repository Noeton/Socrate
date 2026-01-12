import { NextResponse } from 'next/server';
import { getUserProfile, deleteUserProfile } from '@/shared/utils/userProfilesStore';
import { selectPrompt, detectAndUpdateProfile } from '@/shared/utils/promptSelector';

export async function POST(request) {
  try {
    const { message, history, sessionId } = await request.json();

    const userProfile = getUserProfile(sessionId);

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
      "exercice", "pratiquer", "m'entraîner", "essayer", "exo", "entraine"
    ].some(kw => messageLower.includes(kw));
    
    console.log('🔍 [DEBUG] Message:', messageLower);
    console.log('🔍 [DEBUG] isExerciseRequest:', isExerciseRequest);

    // Sélection du prompt adapté
    let systemPrompt = selectPrompt(userProfile, message);

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
        max_tokens: 1024,
        messages: [
          ...history.map(msg => ({
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
    
    // NOUVEAU : Détecter si Socrate propose un exercice
    const responseText = data.content[0].text;
    console.log('🔍 [DEBUG] responseText contient "exercice":', responseText.toLowerCase().includes("exercice"));

    if (isExerciseRequest && responseText.toLowerCase().includes("exercice")) {
      // Extraire intelligemment le contexte de l'exercice
      const exerciseMeta = {
        id: `ex_${Date.now()}`,
        type: "CONTEXTUEL",
        niveau: userProfile.niveau || 'intermediaire',
        context: message,
        description: responseText.substring(0, 500)
      };
      userProfile.setExerciceEnCours(exerciseMeta);
      console.log('📝 [CHAT] Exercice contextuel proposé:', {
        id: exerciseMeta.id,
        niveau: exerciseMeta.niveau,
        preview: message.substring(0, 50)
      });
    }

    // Ajout de l'interaction à l'historique
    userProfile.addToHistory({
      message,
      response: data.content[0].text,
      promptUsed: systemPrompt.substring(0, 50) + '...'
    });

    return NextResponse.json({ 
      response: data.content[0].text,
      profile: userProfile.getProfile()
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