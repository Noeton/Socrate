# FEUILLE DE ROUTE SOCRATE - Audit Janvier 2026

## VISION CIBLE

### Route 1 : SOCRATE (Chat `/ask`)
> Tuteur IA parfait : retient les erreurs, génère depuis le contexte élève, adapte la difficulté, génère les bonnes colonnes du bon dataset, génère des checkpoints fonctionnels avec réponses attendues correctes.

### Route 2 : APPRENDRE / COMPÉTENCES (Catalogue ou Parcours)
> Présentation compétence → Exercice depuis template (parmi 76) → Correction → Conversation Socrate (qui sait quelle compétence enseigner et le niveau de l'élève).

---

## ÉTAT ACTUEL : CE QUI MARCHE ✅

| Composant | Status | Notes |
|-----------|--------|-------|
| `SocrateBrain.js` | ✅ | Charge l'état pédagogique depuis Supabase (si configuré) |
| `ExerciseLibrary.js` | ✅ | Charge les 76 exercices templates JSON |
| 76 exercices templates | ✅ | Présents dans `/shared/data/exercises/{niveau}/` |
| `RealDatasetLoader.js` | ✅ | Charge les vrais CSV (superstore, ibm_hr, etc.) |
| `ComputationEngine.js` | ✅ | Calcule les expected_value depuis les données |
| `ExerciseBuilderV2.js` | ✅ | Génère les fichiers Excel |
| `correct-exercise/route.js` | ✅ | Valide les checkpoints |
| `PEDAGOGIE` (58 compétences) | ✅ | Descriptions, syntaxe, exemples, astuces |

---

## PROBLÈMES CRITIQUES 🔴

### P1. LES 76 EXERCICES TEMPLATES NE SONT PAS UTILISÉS

**Situation actuelle :**
```
/api/generate-dynamic → DynamicExerciseGeneratorV2 → Génère TOUT depuis zéro avec Claude
```

**Problème :** Le générateur ignore complètement `ExerciseLibrary` et les 76 exercices pré-créés. Claude génère à chaque fois un nouvel exercice, avec :
- Contextes génériques ("Tu es analyste...")
- Pas de garantie que les checkpoints sont cohérents
- Temps de génération long (appel Claude)
- Pas de contrôle qualité

**Solution :**
```
/api/generate-dynamic →
  1. ExerciseLibrary.getExercisesByCompetence(compId) → Template
  2. RealDatasetLoader.loadForContext() → Nouvelles données
  3. Claude PERSONNALISE (contexte + indices) mais GARDE la structure
  4. ComputationEngine.enrichCheckpoints() → Valeurs attendues
```

---

### P2. PROFIL UTILISATEUR INCOMPLET / NON TRANSMIS

**Situation actuelle :**
- `ChatInterface.jsx` stocke `userProfile` en state
- `userProfilesStore.js` stocke en mémoire (pas persisté correctement)
- Le générateur reçoit juste `{ userId, competence, type }`

**Données manquantes dans le flux :**
| Donnée | Stockée où | Transmise au générateur |
|--------|-----------|------------------------|
| Prénom | ❌ Nulle part | ❌ Non |
| Nom | ❌ Nulle part | ❌ Non |
| Métier détaillé | localStorage (`contexteMetier`) | ⚠️ Parfois |
| Niveau (débutant/intermédiaire/avancé) | localStorage | ⚠️ Parfois |
| Forces/Faiblesses | Supabase (si configuré) | ❌ Non |
| Erreurs récurrentes | Supabase (`user_error_patterns`) | ❌ Non transmis au prompt |
| Historique exercices | Supabase (`exercise_attempts`) | ❌ Non transmis |

**Solution :** Créer un flux d'onboarding + enrichir `generate-dynamic` :
```javascript
// Ce qu'on devrait envoyer à generate-dynamic
{
  userId,
  competence,
  type,
  // NOUVEAU : contexte complet
  userContext: {
    prenom: "Oscar",
    niveau: "intermediaire",
    metier: "finance",
    ecole: "HEC Paris",
    forces: ["logique", "analyse"],
    faiblesses: ["graphiques"],
    erreursRecurrentes: ["oubli_dollar", "plage_incomplete"],
    exercicesReussis: 3  // sur cette compétence
  }
}
```

---

### P3. CHECKPOINTS : RÉPONSES ATTENDUES INCOHÉRENTES

**Problème :** Quand Claude génère un exercice, il génère des checkpoints avec des `expected_value` qui ne correspondent pas aux données réelles.

**Exemple de bug :**
```json
// Claude génère :
{ "cellule": "E37", "expected_value": 15234 }

// Mais les données font :
SOMME(E2:E36) = 18456  // Différent !
```

**Cause :** Claude invente les valeurs au lieu de les calculer.

**Solution existante mais mal utilisée :** `ComputationEngine.enrichCheckpoints()` recalcule les valeurs APRÈS génération. Mais :
- Il n'est pas toujours appelé
- Les plages générées par Claude peuvent être fausses (E2:E36 au lieu de E2:E101)

**Solution complète :**
1. Claude génère UNIQUEMENT `computation.type` et `computation.column`
2. Le CODE calcule `expected_value` via ComputationEngine
3. Validation post-génération : vérifier que les plages sont cohérentes avec `rowCount`

---

### P4. ROUTE CATALOGUE → SOCRATE : CONTEXTE PERDU

**Flux actuel :**
```
/catalogue/SOMME → phase learn → phase practice → phase success → goToSocrateLearn()
```

**Problème :** Quand on arrive sur `/ask` après un exercice :
- `skillContext` est stocké en localStorage mais peu exploité
- Socrate ne sait pas :
  - Quel exercice a été fait
  - Quel score obtenu
  - Quelles erreurs commises
  - Qu'il doit enseigner CETTE compétence spécifiquement

**Solution :**
```javascript
// Avant de naviguer vers /ask
localStorage.setItem('socrate-skill-context', JSON.stringify({
  mode: 'post_exercise',
  competenceId: pedagogie.id,
  competenceName: pedagogie.nom,
  exerciseId: exercise.id,
  score: correctionResult.score,
  errors: correctionResult.errors,
  checkpointsFailed: correctionResult.failed,
  timestamp: Date.now()
}));

// Dans ChatInterface.jsx
useEffect(() => {
  const context = JSON.parse(localStorage.getItem('socrate-skill-context'));
  if (context?.mode === 'post_exercise') {
    // Injecter dans le prompt système
    // "L'élève vient de faire un exercice sur SOMME avec un score de 6/10..."
  }
}, []);
```

---

### P5. PAS D'ONBOARDING UTILISATEUR

**Problème :** Socrate ne connaît pas l'élève. Pas de :
- Page de bienvenue demandant prénom, métier, objectif
- Détection progressive du niveau
- Personnalisation du tuteur

**Solution minimale :**
```
Première visite → Modal onboarding :
  1. "Comment tu t'appelles ?" → prénom
  2. "Tu travailles dans quel domaine ?" → métier (liste)
  3. "Ton niveau Excel ?" → débutant/intermédiaire/avancé
  4. "Ton objectif ?" → libre

→ Stocké en localStorage ET Supabase
→ Injecté dans TOUS les prompts Claude
```

---

## PROBLÈMES MODÉRÉS 🟠

### P6. GÉNÉRATION EXCEL : FICHIER NON FOURNI PAR GENERATE-DYNAMIC

**Problème :** `generate-dynamic` retourne l'exercice mais le fichier Excel nécessite un second appel à `/api/generate-exercise-file`.

**Solution :** `includeExcel: true` existe mais n'est pas toujours utilisé. Standardiser :
```javascript
// Dans ExerciseGenerator.jsx
const response = await fetch('/api/generate-dynamic', {
  body: JSON.stringify({
    competence,
    userId,
    type,
    includeExcel: true  // TOUJOURS
  })
});
// response.excelBase64 contient le fichier
```

---

### P7. TEMPLATES EXERCICES : MAPPING COMPÉTENCE INCOMPLET

**Problème :** Comment savoir quel template utiliser pour quelle compétence ?

**État actuel :**
- Chaque JSON a `competences: ["SOMME", "MOYENNE"]` (noms)
- Chaque JSON a `competence_ids: [3, 4]` (IDs)
- Mais pas de mapping centralisé compétence → exercices recommandés

**Solution :** Créer un index :
```javascript
// competenceExerciseIndex.js
export const COMPETENCE_EXERCISES = {
  3: { // SOMME
    discovery: ['debutant_01_budget_mensuel', 'debutant_26_somme_bases'],
    consolidation: ['intermediaire_12_ca_par_region'],
    advanced: ['avance_09_sommeprod_multicriteres']
  },
  18: { // RECHERCHEV
    discovery: ['intermediaire_15_commandes_recherchev'],
    consolidation: ['intermediaire_30_recherchev_approchee_baremes'],
    advanced: ['avance_07_index_equiv_prix']
  }
  // ...
};
```

---

### P8. CONVERSATION SOCRATE : HISTORIQUE LIMITÉ

**Problème :** L'historique envoyé à Claude (`history: messages`) contient tous les messages de la session, mais :
- Pas de résumé des sessions précédentes
- Pas de "mémoire longue" sur les erreurs de l'élève
- Context window potentiellement saturé

**Solution :**
1. Résumer les anciennes sessions (via Claude)
2. Injecter le résumé dans le prompt système
3. Limiter l'historique de messages à 20-30 derniers

---

### P9. SOCRATE NE GÉNÈRE PAS VRAIMENT D'EXERCICES (DANS LE CHAT)

**Flux actuel du chat :**
```
User: "donne-moi un exercice sur RECHERCHEV"
→ isExerciseRequest = true
→ /api/chat retourne { triggerGenerator: true, competence: {...} }
→ Frontend ouvre ExerciseGenerator (modal)
→ ExerciseGenerator appelle /api/generate-dynamic
```

**Problème :** Le chat et le générateur sont découplés. Socrate (Claude) ne génère PAS l'exercice lui-même, il délègue à `DynamicExerciseGeneratorV2`.

**Impact :** Le contexte de la conversation n'est pas transmis au générateur.

**Solution :** Passer le contexte conversation au générateur :
```javascript
// Dans ChatInterface.jsx
const response = await fetch('/api/generate-dynamic', {
  body: JSON.stringify({
    competence,
    userId,
    type,
    includeExcel: true,
    // NOUVEAU
    conversationContext: {
      recentMessages: messages.slice(-5),
      userProfile: userProfile,
      competenceEnCours: userProfile?.competenceEnCours
    }
  })
});
```

---

## PROBLÈMES MINEURS 🟡

### P10. UX : Feedback de génération
- Le loader pendant la génération est basique
- Pas d'indication du temps restant
- Pas de possibilité d'annuler

### P11. Tests automatisés manquants
- Pas de tests pour `DynamicExerciseGeneratorV2`
- Pas de tests pour le calcul des `expected_value`
- Pas de tests e2e du flux complet

### P12. Logs et monitoring
- Les `console.log` sont partout mais pas structurés
- Pas de tracking des erreurs en production
- Pas de métriques d'usage

---

## FEUILLE DE ROUTE PRIORISÉE

### Phase 1 : Fondations (Sprint 1-2)

| # | Tâche | Effort | Impact |
|---|-------|--------|--------|
| 1.1 | Créer onboarding utilisateur (prénom, métier, niveau) | M | 🔴 Critique |
| 1.2 | Persister le profil en localStorage + Supabase | M | 🔴 Critique |
| 1.3 | Créer index compétence → exercices templates | S | 🔴 Critique |
| 1.4 | Modifier `generate-dynamic` pour utiliser les templates | L | 🔴 Critique |

### Phase 2 : Personnalisation (Sprint 3-4)

| # | Tâche | Effort | Impact |
|---|-------|--------|--------|
| 2.1 | Injecter profil complet dans prompt Claude | M | 🔴 Critique |
| 2.2 | Passer contexte post-exercice à Socrate | M | 🟠 Important |
| 2.3 | Standardiser `includeExcel: true` | S | 🟠 Important |
| 2.4 | Valider checkpoints post-génération (plages correctes) | M | 🔴 Critique |

### Phase 3 : Intelligence (Sprint 5-6)

| # | Tâche | Effort | Impact |
|---|-------|--------|--------|
| 3.1 | Tracker les erreurs récurrentes par compétence | M | 🟠 Important |
| 3.2 | Adapter difficulté basée sur historique | M | 🟠 Important |
| 3.3 | Résumer anciennes sessions pour mémoire longue | M | 🟡 Nice-to-have |
| 3.4 | Passer contexte conversation au générateur | S | 🟠 Important |

### Phase 4 : Polish (Sprint 7+)

| # | Tâche | Effort | Impact |
|---|-------|--------|--------|
| 4.1 | Améliorer UX génération (loader, temps estimé) | S | 🟡 Nice-to-have |
| 4.2 | Tests automatisés génération + correction | L | 🟠 Important |
| 4.3 | Monitoring et alertes en production | M | 🟡 Nice-to-have |

---

## ARCHITECTURE CIBLE

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ENTRÉE UTILISATEUR                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│     ROUTE 1 : CHAT SOCRATE      │  │ ROUTE 2 : CATALOGUE/PARCOURS    │
│           /ask                  │  │  /catalogue/[skill]             │
└─────────────────────────────────┘  └─────────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│  1. Charger Profil Complet      │  │  1. Afficher PEDAGOGIE          │
│     - UserProfileStore          │  │     - Description               │
│     - SocrateBrain.loadState()  │  │     - Syntaxe                   │
│                                 │  │     - Exemples                  │
│  2. Détecter intention          │  │                                 │
│     - Question théorique?       │  │  2. Charger Template            │
│     - Demande exercice?         │  │     - ExerciseLibrary           │
│     - Correction?               │  │     - COMPETENCE_EXERCISES[id]  │
│                                 │  │                                 │
│  3. Si exercice demandé:        │  │  3. Personnaliser               │
│     ┌─────────────────────────┐ │  │     - Claude adapte contexte    │
│     │ A. Template ou scratch? │ │  │     - Garde structure/données   │
│     │ B. Charger Dataset      │ │  │                                 │
│     │ C. Claude personnalise  │ │  │  4. Générer Excel               │
│     │ D. Enrichir checkpoints │ │  │     - ExerciseBuilderV2         │
│     │ E. Générer Excel        │ │  │                                 │
│     └─────────────────────────┘ │  │  5. Correction                  │
│                                 │  │     - correct-exercise          │
│  4. Feedback adaptatif          │  │     - Tracker erreurs           │
│     - Selon niveau              │  │                                 │
│     - Selon erreurs passées     │  │  6. Vers Socrate (avec contexte)│
└─────────────────────────────────┘  └─────────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STOCKAGE ÉTAT PÉDAGOGIQUE                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  localStorage   │  │    Supabase     │  │   Variables mémoire │  │
│  │  - sessionId    │  │  - user_profile │  │  - messages[]       │  │
│  │  - prénom       │  │  - competences  │  │  - currentExercise  │  │
│  │  - progression  │  │  - error_patt.  │  │  - correctionResult │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PROMPT IDÉAL POUR CLAUDE (GÉNÉRATION EXERCICE)

```
Tu es Socrate, un tuteur Excel bienveillant et expert.

## CONTEXTE ÉLÈVE
- Prénom : Oscar
- Niveau : Intermédiaire (score moyen : 72%)
- Métier : Finance / HEC Paris
- Forces : Logique, analyse de données
- Faiblesses : Graphiques, mise en forme conditionnelle
- Erreurs récurrentes : 
  - Oubli du $ dans les références (3x cette semaine)
  - Plages incomplètes (2x)
- Exercices réussis sur SOMME : 4 (prêt pour consolidation avancée)

## TEMPLATE EXERCICE
{JSON du template debutant_01_budget_mensuel.json}

## DATASET DISPONIBLE
Headers : Date, Catégorie, Description, Budget, Dépensé
100 lignes de données réelles (company_financials.csv)

## TA MISSION
1. GARDE la structure du template (checkpoints, objectifs)
2. ADAPTE le contexte pour Oscar (finance, HEC)
3. GÉNÈRE les indices adaptés à son niveau
4. NE MODIFIE PAS les données ni les expected_value (le code s'en charge)

Retourne un JSON avec :
- titre (personnalisé)
- contexte (adapté à Oscar)
- checkpoints (IDENTIQUES au template sauf description/indices)
```

---

## FICHIERS À MODIFIER (RÉSUMÉ)

| Fichier | Modifications |
|---------|---------------|
| `app/api/generate-dynamic/route.js` | Utiliser templates, passer contexte complet |
| `backend/.../DynamicExerciseGeneratorV2.js` | Intégrer ExerciseLibrary |
| `app/components/ChatInterface.jsx` | Passer contexte conversation, gérer post-exercice |
| `app/catalogue/[skill]/page.js` | Stocker contexte exercice avant navigation |
| `shared/utils/userProfilesStore.js` | Ajouter prénom, métier, persister correctement |
| `NEW: shared/data/competenceExerciseIndex.js` | Mapping compétence → templates |
| `NEW: app/components/Onboarding.jsx` | Modal première visite |

---

## QUESTIONS OUVERTES

1. **Supabase obligatoire ?** Actuellement optionnel, mais nécessaire pour persistance long terme.

2. **Génération 100% template vs hybride ?** 
   - Option A : Toujours partir d'un template (+ fiable)
   - Option B : Templates pour catalogue, scratch pour chat libre (+ flexible)

3. **Niveau de personnalisation Claude ?**
   - Option A : Claude adapte juste le contexte narratif
   - Option B : Claude peut modifier les questions (risqué pour checkpoints)

4. **Gestion des 14 compétences `inDevelopment` ?**
   - Pas de templates pour celles-ci
   - Générer from scratch ou bloquer ?

---

*Document généré le 23 janvier 2026*
*Prochaine étape : Valider les priorités avec Oscar et démarrer Phase 1*
