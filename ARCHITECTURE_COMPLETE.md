# ARCHITECTURE SOCRATE - Document Complet et Honnête

*Référence exhaustive : ce qui marche, ce qui ne marche pas, les fichiers morts*

---

## TABLE DES MATIÈRES

1. [Résumé exécutif](#résumé-exécutif)
2. [Ce qui MARCHE](#ce-qui-marche)
3. [Ce qui NE MARCHE PAS](#ce-qui-ne-marche-pas)
4. [Fichiers MORTS (non utilisés)](#fichiers-morts)
5. [Fichiers REDONDANTS](#fichiers-redondants)
6. [Architecture des flows](#architecture-des-flows)
7. [Fichiers par fichier](#fichiers-par-fichier)
8. [Bugs identifiés](#bugs-identifiés)

---

## RÉSUMÉ EXÉCUTIF

### En une phrase
Socrate est un tuteur Excel avec génération d'exercices dynamiques (Claude) et correction automatisée, mais **seules les formules sont validables automatiquement** (25 compétences sur 58), et **plusieurs fonctionnalités sont codées mais non branchées**.

### Chiffres clés
| Métrique | Valeur |
|----------|--------|
| Templates exercices | 77 JSON (27 débutant, 34 intermédiaire, 16 avancé) |
| Compétences définies | 58 (dans PEDAGOGIE) |
| Compétences validables auto | 25 (`full_auto`) |
| Compétences nécessitant screenshot | 14 (`semi_auto`) |
| Datasets réels | 8 CSV (ventes, RH, finance, marketing, compta) |
| APIs | 12 routes |
| Composants React | 18 |
| Services backend | ~25 fichiers |

---

## CE QUI MARCHE ✅

### 1. Onboarding
- **Fichier:** `/app/onboarding/page.js`
- **Flow:** Collecte prénom, métier, niveau en 5 étapes
- **Stockage:** `localStorage('socrate-user-data')`
- **Status:** ✅ Fonctionnel

### 2. Navigation principale
- **Fichiers:** `/app/page.js`, `WelcomeScreen.jsx`
- **Flow:** Beta → Onboarding → Menu (3 boutons)
- **Status:** ✅ Fonctionnel

### 3. Chat Socrate (conversation)
- **Fichiers:** `/app/ask/page.js`, `ChatInterface.jsx`, `/api/chat/route.js`
- **Flow:** Message → Détection intention → Claude API → Réponse
- **Status:** ✅ Fonctionnel
- **Détail:** Détecte demandes d'exercice, adapte le prompt au niveau

### 4. Génération exercices V2 (Claude)
- **Fichiers:** `/api/generate-dynamic/route.js`, `DynamicExerciseGeneratorV2.js`
- **Flow:** 
  1. Charger dataset réel (CSV)
  2. Calculer stats
  3. Construire prompt
  4. Claude génère exercice + checkpoints
  5. Enrichir checkpoints (expected_value)
  6. Générer Excel
- **Status:** ✅ Fonctionnel
- **Limite:** Claude génère `computation.type` mais pas `validation: "claude"` pour les checkpoints complexes

### 5. Génération Excel depuis templates
- **Fichiers:** `/api/generate-exercise-file/route.js`, `ExerciseLibrary.js`
- **Flow:** Sélectionner template → Générer Excel avec ExcelJS
- **Status:** ✅ Fonctionnel
- **Limite:** 77 templates seulement

### 6. Correction exercices (formules)
- **Fichiers:** `/api/correct-exercise/route.js`, `CheckpointValidator.js`
- **Types validés:**
  - `formule` : normalise (FR/EN, $), vérifie fonction, compare valeur ✅
  - `valeur` : compare avec tolérance ✅
- **Status:** ✅ Fonctionnel pour les 25 compétences `full_auto`

### 7. Calcul expected_value
- **Fichier:** `ComputationEngine.js`
- **Opérations:** sum, average, min, max, count, countif, sumif, lookup, sumproduct
- **Status:** ✅ Fonctionnel

### 8. Datasets réels
- **Dossier:** `/shared/data/real-datasets/`
- **Contenu:**
  - `ventes/`: superstore_sales (9801 lignes), walmart_sales (6435), black_friday (550K), brazilian_ecommerce (99K)
  - `rh/`: ibm_hr_analytics (1471)
  - `finance/`: company_financials (701)
  - `marketing/`: marketing_campaign (2240)
  - `compta/`: accounting_transactions (1001)
- **Status:** ✅ Chargés par RealDatasetLoader

### 9. Streaks & Analytics
- **Fichiers:** `/api/streak/route.js`, `/api/analytics/route.js`
- **Status:** ✅ Fonctionnel (si Supabase configuré)

---

## CE QUI NE MARCHE PAS ❌

### 1. Validation visuelle (graphiques, MFC, TCD)
- **Fichier:** `VisualValidationService.js`
- **Problème:** Service codé mais **non intégré au frontend**
- **Manque:**
  - Upload screenshot dans l'UI
  - Appel depuis `/api/correct-exercise`
- **Impact:** 14 compétences non validables (graphiques, TCD, MFC, tri, filtres)

### 2. Profil onboarding non transmis aux APIs
- **Problème:** `localStorage('socrate-user-data')` existe mais n'est pas lu par :
  - `/api/chat/route.js`
  - `/api/generate-dynamic/route.js`
- **Impact:** Socrate ne connaît pas le prénom/métier/niveau de l'utilisateur

### 3. Catalogue appelle le mauvais générateur
- **Fichier:** `/app/catalogue/[skill]/page.js` ligne 54
- **Problème:** Appelle `/api/generate-dynamic` (V2 from scratch) au lieu de `/api/generate-exercise-file` (templates)
- **Impact:** Templates non utilisés dans le parcours structuré

### 4. Contexte post-exercice incomplet
- **Fichier:** `/app/catalogue/[skill]/page.js`
- **Problème:** `socrate-skill-context` ne contient pas exerciseId, score, errors
- **Impact:** Socrate ne sait pas ce que l'élève vient de faire

### 5. Validation Claude pour checkpoints complexes
- **Problème:** Quand Claude génère un checkpoint type `column_order` ou `graphique`, il n'y a pas de `validation: "claude"` ni de `validation_prompt`
- **Impact:** Ces checkpoints échouent silencieusement ou passent par défaut

### 6. Supabase optionnel mais fonctionnalités dépendantes
- **Services affectés si Supabase absent:**
  - `SocrateBrain.loadLearnerState()` → retourne état vide
  - `SpacedRepetition.scheduleReview()` → ne fait rien
  - `AnalyticsService` → ne sauvegarde rien
- **Impact:** Pas de persistance, pas de parcours adaptatif réel

### 7. Skill Tree partiellement fonctionnel
- **Fichier:** `/app/skill-tree/page.js`, `SkillTree.js`
- **Status:** Affiche l'arbre mais navigation limitée
- **Impact:** Feature visible mais peu utile

---

## FICHIERS MORTS 💀

### Composants non importés
| Fichier | Raison |
|---------|--------|
| `LessonView.jsx` | Jamais importé nulle part |
| `LessonTransition.jsx` | Jamais importé nulle part |

### Services backend non utilisés
| Fichier | Raison |
|---------|--------|
| `HybridCorrector.js` | Non importé (sauf par lui-même) |
| `ValidationChecker.js` | Non importé |
| `FeedbackBuilder.js` | Importé par HybridCorrector (mort aussi) |
| `ProgressiveFeedbackSystem.js` | Non importé |

### Données non importées
| Fichier | Raison |
|---------|--------|
| `checkpointTemplates.js` | Jamais importé |
| `exerciseTemplates.js` | Jamais importé |
| `competencesDisponibles.js` | Jamais importé |
| `erreursParCompetence.js` | Jamais importé |

### Utils non utilisés
| Fichier | Raison |
|---------|--------|
| `formulaEngine.js` | Jamais importé |
| `excelIntelligentAnalyzer.js` | Jamais importé |

---

## FICHIERS REDONDANTS 🔄

### APIs similaires
| Fichier 1 | Fichier 2 | Différence |
|-----------|-----------|------------|
| `/api/generate-dynamic/route.js` | `/api/generate-exercise/route.js` | Le 2ème ajoute SocrateBrain + AdaptiveEngine mais fait la même chose |

### Classes dupliquées
| Classe | Fichier 1 | Fichier 2 |
|--------|-----------|-----------|
| `SpacedRepetition` | `SpacedRepetition.js` | `AttemptTracker.js` (contient une copie) |

### Fichiers de config
| Fichier 1 | Fichier 2 | Différence |
|-----------|-----------|------------|
| `lib/config.js` | `lib/supabase.js` | Deux façons de créer le client Supabase |

---

## ARCHITECTURE DES FLOWS

### Flow 1 : Chat libre (`/ask`)

```
Utilisateur tape message
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ ChatInterface.jsx                                           │
│ ─────────────────                                           │
│ 1. Détecte si demande d'exercice (patterns)                 │
│ 2. Détecte compétence mentionnée (keywords)                 │
│                                                             │
│ SI exercice + compétence → ExerciseGenerator (modal)        │
│ SINON → POST /api/chat                                      │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/chat                                              │
│ ─────────────                                               │
│ 1. getUserProfile(sessionId) ← mémoire/Supabase             │
│ 2. SocrateBrain.loadLearnerState() ← Supabase (si config)   │
│ 3. selectPrompt() → prompt adapté au niveau                 │
│ 4. enrichWithMetier() → contexte métier                     │
│ 5. buildPedagogicalContext() → erreurs, progression         │
│ 6. Si exercice → AdaptiveEngine.selectNextExercise()        │
│ 7. Appel Claude API                                         │
│                                                             │
│ RETOUR: { response, triggerGenerator?, competence? }        │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2 : Génération exercice V2

```
ExerciseGenerator.jsx ou /api/chat
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/generate-dynamic                                  │
│ ──────────────────────────                                  │
│ Body: { competence, userId, type, metier, includeExcel }    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ DynamicExerciseGeneratorV2.generate()                       │
│ ─────────────────────────────────────                       │
│                                                             │
│ 1. findCompetence(param)                                    │
│    → { id, nom, niveau, syntaxe, description }              │
│                                                             │
│ 2. RealDatasetLoader.loadForContext()                       │
│    → { headers, rows, metadata }                            │
│    Sources: superstore_sales.csv, ibm_hr_analytics.csv...   │
│                                                             │
│ 3. ComputationEngine.computeDatasetStats()                  │
│    → { columns, numericColumns, stats }                     │
│                                                             │
│ 4. OptimizedPromptBuilderV2.buildOptimizedPrompt()          │
│    → Prompt avec contexte, stats, templates checkpoints     │
│                                                             │
│ 5. Appel Claude API                                         │
│    → { titre, contexte, etapes, checkpoints }               │
│    ⚠️ checkpoints ont computation.type mais PAS validation  │
│                                                             │
│ 6. ComputationEngine.enrichCheckpoints()                    │
│    → Calcule expected_value depuis vraies données           │
│                                                             │
│ 7. ExerciseBuilderV2.buildExerciseWorkbook()                │
│    → Buffer Excel                                           │
│                                                             │
│ RETOUR: { exercise, excelBuffer, stats }                    │
└─────────────────────────────────────────────────────────────┘
```

### Flow 3 : Correction exercice

```
Upload fichier Excel
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/correct-exercise                                  │
│ ─────────────────────────                                   │
│ FormData: { file, userId, exerciseId, exerciseData }        │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. CHARGER EXERCICE ORIGINAL                                │
│    exerciseData (fourni) OU ExerciseLibrary.getById()       │
│                                                             │
│ 2. EXTRAIRE DONNÉES EXCEL (ExcelJS)                         │
│    userFormulas: { "E50": "=SOMME(E2:E49)" }                │
│    userValues: { "E50": 15234 }                             │
│                                                             │
│ 3. VALIDER CHECKPOINTS                                      │
│    ┌───────────────────────────────────────────────────┐    │
│    │ Pour chaque checkpoint:                           │    │
│    │                                                   │    │
│    │ type: "formule"                                   │    │
│    │ → validateFormule()                               │    │
│    │   • normalizeFormula() FR→EN, remove $            │    │
│    │   • containsFunction() vérifie SOMME/SUM          │    │
│    │   • compare expected_value avec tolérance         │    │
│    │   ✅ MARCHE                                       │    │
│    │                                                   │    │
│    │ type: "valeur"                                    │    │
│    │ → validateValeur()                                │    │
│    │   • compare avec tolérance                        │    │
│    │   ✅ MARCHE                                       │    │
│    │                                                   │    │
│    │ type: "graphique" | "format" | "pivot_table"      │    │
│    │ → validateVisualCheckpoint()                      │    │
│    │   • Détection basique (présence seulement)        │    │
│    │   • needsVisualValidation = true                  │    │
│    │   ❌ VALIDATION PARTIELLE                         │    │
│    └───────────────────────────────────────────────────┘    │
│                                                             │
│ 4. GÉNÉRER FEEDBACK                                         │
│    generateFeedbackReport(results)                          │
│                                                             │
│ RETOUR: { success, score, checkpoints, feedback }           │
└─────────────────────────────────────────────────────────────┘
```

### Flow 4 : Catalogue (`/catalogue/[skill]`)

```
/catalogue/[skill]
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: LEARN                                              │
│ ──────────────                                              │
│ • Charge PEDAGOGIE[skillKey]                                │
│ • Affiche description, syntaxe, exemples                    │
│ • Bouton "Pratiquer"                                        │
└─────────────────────────────────────────────────────────────┘
        │ (clic Pratiquer)
        ▼
┌─────────────────────────────────────────────────────────────┐
│ handleGenerateExercise()                                    │
│ ────────────────────────                                    │
│ ⚠️ BUG: fetch('/api/generate-dynamic')                      │
│    DEVRAIT: fetch('/api/generate-exercise-file')            │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: PRACTICE                                           │
│ ─────────────────                                           │
│ • Affiche exercice                                          │
│ • Télécharger Excel                                         │
│ • Uploader corrigé → /api/correct-exercise                  │
└─────────────────────────────────────────────────────────────┘
        │ (si score >= 7)
        ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: SUCCESS                                            │
│ ────────────────                                            │
│ • Sauvegarde progression localStorage                       │
│ • Bouton "Continuer avec Socrate" → /ask                    │
│   ⚠️ BUG: contexte incomplet (manque score, errors)         │
└─────────────────────────────────────────────────────────────┘
```

---

## FICHIERS PAR FICHIER

### Frontend - Pages (`/app`)

| Fichier | Rôle | Status |
|---------|------|--------|
| `page.js` | Routing initial | ✅ Utilisé |
| `layout.js` | Layout global | ✅ Utilisé |
| `providers.jsx` | Context providers | ✅ Utilisé |
| `beta/page.js` | Accès beta | ✅ Utilisé |
| `onboarding/page.js` | Collecte profil | ✅ Utilisé |
| `login/page.js` | Login (Supabase) | ⚠️ Optionnel |
| `ask/page.js` | Chat Socrate | ✅ Utilisé |
| `learn/page.js` | Dashboard | ✅ Utilisé |
| `catalogue/page.js` | Liste compétences | ✅ Utilisé |
| `catalogue/[skill]/page.js` | Détail + exercice | ✅ Utilisé (avec bugs) |
| `skill-tree/page.js` | Arbre compétences | ⚠️ Peu utilisé |

### Frontend - Composants (`/app/components`)

| Fichier | Rôle | Status |
|---------|------|--------|
| `WelcomeScreen.jsx` | Menu 3 options | ✅ Utilisé |
| `ChatInterface.jsx` | Cœur du chat | ✅ Utilisé |
| `ChatInput.jsx` | Input + upload | ✅ Utilisé |
| `ChatHeader.jsx` | Header chat | ✅ Utilisé |
| `ChatSidebar.jsx` | Historique | ✅ Utilisé |
| `MessageBubble.jsx` | Bulle message | ✅ Utilisé |
| `ExerciseGenerator.jsx` | Modal génération | ✅ Utilisé |
| `LearnDashboard.jsx` | Dashboard parcours | ✅ Utilisé |
| `AppHeader.jsx` | Header global | ✅ Utilisé |
| `ProtectedPage.jsx` | HOC auth | ✅ Utilisé |
| `BadgeNotification.jsx` | Notif badges | ✅ Utilisé |
| `StreakDisplay.jsx` | Affichage streak | ✅ Utilisé |
| `ProgressBar.jsx` | Barre progression | ✅ Utilisé |
| `FeedbackMastermind.jsx` | Feedback détaillé | ✅ Utilisé |
| `SkillTree.js` | Arbre compétences | ⚠️ Peu utilisé |
| `SkillNode.js` | Nœud arbre | ⚠️ Peu utilisé |
| `SkillConnections.jsx` | Liens arbre | ⚠️ Peu utilisé |
| `LessonView.jsx` | Vue leçon | 💀 MORT |
| `LessonTransition.jsx` | Transition | 💀 MORT |

### APIs (`/app/api`)

| Route | Rôle | Status |
|-------|------|--------|
| `/api/session` | Crée session | ✅ Utilisé |
| `/api/chat` | Conversation | ✅ Utilisé |
| `/api/chat/intro` | Intro post-leçon | ✅ Utilisé |
| `/api/generate-dynamic` | V2 from scratch | ✅ Utilisé |
| `/api/generate-exercise-file` | Templates | ✅ Utilisé (devrait l'être plus) |
| `/api/generate-exercise` | V2 + SocrateBrain | 🔄 Redondant |
| `/api/correct-exercise` | Correction | ✅ Utilisé |
| `/api/analyze-excel` | Analyse fichier | ⚠️ Peu utilisé |
| `/api/user-profile` | Profil | ✅ Utilisé |
| `/api/learn-progress` | Progression | ✅ Utilisé |
| `/api/streak` | Streaks | ✅ Utilisé |
| `/api/analytics` | Analytics | ⚠️ Supabase requis |
| `/api/sandbox-result` | Résultats sandbox | ⚠️ Peu utilisé |
| `/api/login` | Auth | ⚠️ Supabase requis |

### Backend Services

| Fichier | Rôle | Status |
|---------|------|--------|
| **exercises/** | | |
| `DynamicExerciseGeneratorV2.js` | Génération V2 | ✅ Utilisé |
| `ExerciseLibrary.js` | Charge templates | ✅ Utilisé |
| `RealDatasetLoader.js` | Charge CSV | ✅ Utilisé |
| `CoherentDataGenerator.js` | Génère données fictives | ✅ Fallback |
| `ComputationEngine.js` | Calcule expected_value | ✅ Utilisé |
| `OptimizedPromptBuilderV2.js` | Construit prompts | ✅ Utilisé |
| `ExerciseBuilderV2.js` | Génère Excel | ✅ Utilisé |
| `CompetenceValidationMap.js` | Types validation | ✅ Utilisé |
| `DatasetLoader.js` | Ancien loader | 💀 MORT |
| **correction/** | | |
| `CheckpointValidator.js` | Valide checkpoints | ✅ Utilisé |
| `FlexibleFormulaValidator.js` | Normalise formules | ✅ Utilisé |
| `VisualValidationService.js` | Valide visuels | ⚠️ Codé mais non branché |
| `ExcelPreAnalyzer.js` | Pré-analyse | ⚠️ Peu utilisé |
| `HybridCorrector.js` | Correction hybride | 💀 MORT |
| `FeedbackBuilder.js` | Construit feedback | 💀 MORT |
| `ProgressiveFeedbackSystem.js` | Feedback progressif | 💀 MORT |
| `ValidationChecker.js` | Utilitaires | 💀 MORT |
| **socrate/** | | |
| `SocrateBrain.js` | État pédagogique | ⚠️ Supabase requis |
| `AdaptiveEngine.js` | Sélection exercice | ✅ Utilisé |
| **learning/** | | |
| `SpacedRepetition.js` | Répétition espacée | ⚠️ Supabase requis |
| `AttemptTracker.js` | Suivi tentatives | 💀 MORT (copie SpacedRep) |
| `CompetenceMastery.js` | Calcul maîtrise | ⚠️ Peu utilisé |
| `PatternDetector.js` | Détecte patterns | ✅ Utilisé |
| **gamification/** | | |
| `BadgeSystem.js` | Badges | ⚠️ Supabase requis |
| **analytics/** | | |
| `AnalyticsService.js` | Analytics | ⚠️ Supabase requis |

### Données (`/shared/data`)

| Fichier | Rôle | Status |
|---------|------|--------|
| `pedagogie.js` | 58 compétences | ✅ Utilisé |
| `competencesExcel.js` | Liste enrichie | ✅ Utilisé |
| `learningPath.js` | Parcours | ✅ Utilisé |
| `erreursFrequentes.js` | Erreurs par compétence | ✅ Utilisé (via pedagogie) |
| `checkpointTemplates.js` | Templates checkpoints | 💀 MORT |
| `exerciseTemplates.js` | Templates exercices | 💀 MORT |
| `competencesDisponibles.js` | Compétences actives | 💀 MORT |
| `erreursParCompetence.js` | Mapping erreurs | 💀 MORT |
| `exercises/` | 77 templates JSON | ✅ Utilisé |
| `real-datasets/` | 8 CSV réels | ✅ Utilisé |

### Utils (`/shared/utils`)

| Fichier | Rôle | Status |
|---------|------|--------|
| `promptSelector.js` | Sélectionne prompt | ✅ Utilisé |
| `userProfile.js` | Gestion profil | ✅ Utilisé |
| `userProfilesStore.js` | Store profils | ✅ Utilisé |
| `competenceDetector.js` | Détecte compétences | ✅ Utilisé |
| `formulaNormalizer.js` | Normalise formules | ✅ Utilisé |
| `excelFunctionMap.js` | Mapping fonctions | ✅ Utilisé |
| `formulaEngine.js` | Moteur formules | 💀 MORT |
| `excelIntelligentAnalyzer.js` | Analyse intelligente | 💀 MORT |

### Prompts (`/shared/prompts`)

| Fichier | Rôle | Status |
|---------|------|--------|
| `base.js` | Prompt de base | ✅ Utilisé |
| `diagnostic.js` | Diagnostic niveau | ✅ Utilisé |
| `exerciseur.js` | Génération exercices | ✅ Utilisé |
| `debugger.js` | Debug formules | ✅ Utilisé |
| `personas.js` | Définition persona | ✅ Utilisé |
| `metierEnrichment.js` | Contexte métier | ✅ Utilisé |
| `competences-injection.js` | Liste compétences | ✅ Utilisé |
| `pedagogue/debutant.js` | Prompt débutant | ✅ Utilisé |
| `pedagogue/intermediaire.js` | Prompt intermédiaire | ✅ Utilisé |
| `pedagogue/avance.js` | Prompt avancé | ✅ Utilisé |

---

## BUGS IDENTIFIÉS

### BUG 1 : Catalogue appelle le mauvais générateur [CRITIQUE]
```
FICHIER: /app/catalogue/[skill]/page.js ligne 54
ACTUEL:  fetch('/api/generate-dynamic')
ATTENDU: fetch('/api/generate-exercise-file')
IMPACT:  Templates non utilisés, génération from scratch à chaque fois
```

### BUG 2 : Profil onboarding non transmis [CRITIQUE]
```
FICHIER: /api/chat/route.js, /api/generate-dynamic/route.js
PROBLÈME: localStorage('socrate-user-data') non lu par les APIs
IMPACT:  Socrate ne connaît pas l'utilisateur
```

### BUG 3 : Contexte post-exercice incomplet [IMPORTANT]
```
FICHIER: /app/catalogue/[skill]/page.js
PROBLÈME: socrate-skill-context manque exerciseId, score, errors
IMPACT:  Socrate ne peut pas personnaliser la suite
```

### BUG 4 : Validation Claude non implémentée [CRITIQUE]
```
PROBLÈME: Checkpoints complexes (graphiques, colonnes) non validables
SOLUTION: Ajouter validation: "claude" + validation_prompt
IMPACT:  14 compétences non validables automatiquement
```

### BUG 5 : Fichiers morts polluent le code
```
FICHIERS: LessonView, LessonTransition, HybridCorrector, etc.
IMPACT:  Confusion, maintenance difficile
```

---

## CONCLUSION

### Ce qui est solide
1. **Génération V2** : Pipeline complet Claude → Excel fonctionnel
2. **Correction formules** : 25 compétences validables automatiquement
3. **UI/UX** : Interface propre et fonctionnelle
4. **Datasets** : 8 CSV réels pour contextes variés

### Ce qui manque
1. **Validation visuelle** : Code existe, non branché
2. **Persistance** : Fonctionne qu'avec Supabase
3. **Profil utilisateur** : Non transmis aux APIs
4. **Templates** : Non utilisés par le catalogue

### Priorités de correction
1. 🔴 Brancher profil onboarding → APIs
2. 🔴 Catalogue utilise templates
3. 🔴 Implémenter validation: "claude" pour checkpoints complexes
4. 🟠 Brancher VisualValidationService
5. 🟠 Nettoyer fichiers morts

---

*Document généré le 23 janvier 2026*
*Analyse basée sur le code source, grep des imports, et lecture des fichiers*
