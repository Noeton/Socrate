'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userProfile, setUserProfile] = useState({ niveau: null, contexteMetier: null });
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Génération du sessionId au chargement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingSessionId = localStorage.getItem('socrate-session-id');
      if (existingSessionId) {
        setSessionId(existingSessionId);
      } else {
        const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('socrate-session-id', newSessionId);
        setSessionId(newSessionId);
      }
    }
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          sessionId: sessionId
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response 
      }]);

      if (data.profile) {
        setUserProfile(data.profile);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Erreur de connexion. Réessaie !' 
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
      
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('socrate-session-id', newSessionId);
      setSessionId(newSessionId);
      
      console.log('🔄 Session réinitialisée');
    } catch (error) {
      console.error('Erreur lors du reset:', error);
    }
  };

  const handleQuickAction = (action) => {
    if (action === 'exercise') {
      setInput('Donne-moi un exercice adapté à mon niveau');
    } else if (action === 'debug') {
      setInput('J\'ai un problème avec une formule Excel');
    }
  };

  const handleDownloadExercise = async () => {
    if (!userProfile.niveau) {
      alert('Dis-moi d\'abord ton niveau ! Discute un peu avec moi 😊');
      return;
    }
  
    try {
      // Utiliser l'exercice en cours si disponible (contextuel)
      const exerciseData = userProfile.exerciceEnCours ? {
        exerciseId: userProfile.exerciceEnCours.id,
        type: userProfile.exerciceEnCours.type,
        niveau: userProfile.niveau,
        contexteMetier: userProfile.contexteMetier || 'général',
        context: userProfile.exerciceEnCours.context,
        description: userProfile.exerciceEnCours.description
      } : {
        // Fallback sur template générique
        niveau: userProfile.niveau,
        contexteMetier: userProfile.contexteMetier || 'général'
      };
      
      console.log('📥 [DOWNLOAD] Téléchargement exercice:', exerciseData);
  
      const response = await fetch('/api/generate-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Exercice_${userProfile.niveau}_${userProfile.contexteMetier}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log('✅ Exercice téléchargé !');
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement de l\'exercice');
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type)) {
      alert('⚠️ Fichier invalide ! Envoie un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setIsUploading(true);
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: `📎 J'ai uploadé le fichier : ${file.name}` 
    }]);

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sessionId', sessionId);
        formData.append('userLevel', userProfile.niveau || 'intermediaire');
        formData.append('userMetier', userProfile.contexteMetier || 'général');
        
        const response = await fetch('/api/analyze-excel', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.report 
      }]);

      console.log('✅ Fichier analysé !', data.analysis);
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Désolé, je n\'ai pas pu analyser ton fichier. Vérifie qu\'il s\'agit bien d\'un fichier Excel valide.' 
      }]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🧠</div>
            <div>
              <h1 className="text-2xl font-bold">SOCRATE - Tuteur Excel IA</h1>
              <p className="text-sm text-blue-100">Architecture Modulaire v2.0</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Profil utilisateur */}
      {(userProfile.niveau || userProfile.contexteMetier) && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="max-w-4xl mx-auto flex items-center gap-4 text-sm">
            <span className="font-semibold text-blue-900">📊 Ton profil :</span>
            {userProfile.niveau && (
              <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full">
                Niveau : <strong>{userProfile.niveau}</strong>
              </span>
            )}
            {userProfile.contexteMetier && (
              <span className="bg-purple-200 text-purple-900 px-3 py-1 rounded-full">
                Métier : <strong>{userProfile.contexteMetier}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <div className="text-6xl mb-4">👋</div>
              <p className="text-lg">Salut ! Je suis Socrate, ton tuteur Excel IA.</p>
              <p className="text-sm mt-2">Commence par me parler de ton niveau et de ton métier !</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 shadow-md border border-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Boutons rapides */}
      <div className="border-t border-gray-200 bg-white p-3">
  <div className="max-w-4xl mx-auto flex gap-2 justify-center flex-wrap">
    <button
      onClick={() => fileInputRef.current?.click()}
      disabled={isUploading}
      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition flex items-center gap-2 font-semibold"
      title="Envoyer ma solution d'exercice"
    >
      📤 {isUploading ? 'Analyse...' : 'Envoyer ma solution'}
    </button>
   
    <button
      onClick={handleDownloadExercise}
      disabled={!userProfile.niveau}
      className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition flex items-center gap-2 font-semibold"
      title={!userProfile.niveau ? 'Parle-moi d\'abord !' : 'Télécharger l\'exercice proposé'}
    >
      📥 Télécharger exercice
    </button>
    <input
      ref={fileInputRef}
      type="file"
      accept=".xlsx,.xls"
      onChange={handleFileInputChange}
      className="hidden"
    />
  </div>
</div>

      {/* Input */}
      <div className="border-t border-gray-300 bg-white p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tape ton message ici..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition font-semibold"
            >
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}