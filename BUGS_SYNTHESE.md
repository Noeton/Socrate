# SYNTHÈSE DES BUGS SOCRATE
*Pour conversation Claude future - À valider avant de coder*

---

## ARCHITECTURE RAPPEL

**2 routes distinctes :**

| Route | Flow | Générateur |
|-------|------|------------|
| **APPRENDRE / CATALOGUE** | Explication compétence → Exercice template → Correction → Socrate | Templates JSON (76 fichiers dans `/shared/data/exercises/`) |
| **SOCRATE (chat `/ask`)** | Discussion libre, génère à la volée | `DynamicExerciseGeneratorV2` (from scratch avec Claude) |

---

## BUG 1 : LE CATALOGUE APPELLE LE MAUVAIS GÉNÉRATEUR

**Fichier :** `/app/catalogue/[skill]/page.js` ligne 54

**Actuel :**
```javascript
const response = await fetch('/api/generate-dynamic', { ... })
```

**Attendu :**
```javascript
const response = await fetch('/api/generate-exercise-file', { ... })
// ou un endpoint qui utilise ExerciseLibrary pour charger un template
```

**Conséquence :** Le catalogue génère des exercices from scratch avec Claude au lieu d'utiliser les 76 templates pré-validés.

**Correction :** Changer l'appel pour utiliser `ExerciseLibrary.getExercisesByCompetence(competenceId)` → sélectionner un template → générer l'Excel.

---

## BUG 2 : PROFIL ONBOARDING NON TRANSMIS AUX APIs

**Onboarding stocke dans `localStorage('socrate-user-data')` :**
```json
{
  "name": "Oscar",
  "context": "finance",  // student | finance | marketing | rh | other
  "level": "intermediate",  // beginner | intermediate | advanced
  "completedAt": 1706012345678
}
```

**Fichiers qui LISENT ce profil (pour affichage seulement) :**
- `WelcomeScreen.jsx`
- `AppHeader.jsx`
- `LearnDashboard.jsx`

**Fichiers qui DEVRAIENT le lire mais ne le font PAS :**
- `/api/chat/route.js` → pour adapter le prompt Socrate
- `/api/generate-dynamic/route.js` → pour personnaliser l'exercice
- `DynamicExerciseGeneratorV2.js` → pour adapter contexte/difficulté

**Conséquence :** Socrate et le générateur ne connaissent pas le prénom, métier, niveau de l'utilisateur.

---

## BUG 3 : CONTEXTE POST-EXERCICE PARTIELLEMENT TRANSMIS À SOCRATE

**Le catalogue stocke avant navigation vers `/ask` :**
```javascript
// /app/catalogue/[skill]/page.js ligne 32-43
const skillContext = {
  mode: 'learn_competence',
  skillKey: skillKey.toUpperCase(),
  skillName: pedagogie?.nom || skillKey,
  competenceId: pedagogie?.id || null,
  fromCatalogue: true,
  timestamp: Date.now()
};
localStorage.setItem('socrate-skill-context', JSON.stringify(skillContext));
```

**ChatInterface.jsx LIT ce contexte (lignes 175, 213) :** ✅

**MAIS il manque dans le contexte :**
- `exerciseId` : quel exercice a été fait
- `score` : résultat de la correction
- `errors` : erreurs commises
- `checkpointsFailed` : quels checkpoints ont échoué

**Conséquence :** Socrate sait quelle compétence enseigner mais pas comment s'est passé l'exercice.

---

## PROBLÈME 4 : CORRECTION DES EXERCICES GÉNÉRÉS PAR SOCRATE (DÉFI MAJEUR)

### Le problème fondamental

Quand Socrate génère un exercice from scratch, il peut demander **n'importe quoi** :
- Une formule SOMME → relativement simple
- Un camembert → comment vérifier ?
- Réorganiser des colonnes → comment vérifier ?
- Créer un TCD → comment vérifier la structure ?
- Appliquer un filtre → comment vérifier quelles lignes sont masquées ?

**La question centrale :** Si Claude génère une question arbitraire, comment le code de correction peut-il savoir quelle est la bonne réponse ?

---

### Architecture actuelle de la correction

**4 types de validation définis dans `CompetenceValidationMap.js` :**

| Type | Description | Compétences |
|------|-------------|-------------|
| `full_auto` | 100% automatique (formules, valeurs) | SOMME, MOYENNE, SI, RECHERCHEV, INDEX+EQUIV... (25 compétences) |
| `semi_auto` | Partiel + screenshot Claude Vision | Graphiques, TCD, MFC, Tri, Filtres... (14 compétences) |
| `manual` | Vérification résultat final uniquement | Power Query, Power Pivot... |
| `tutorial` | Pas de validation, juste tuto | Macros, VBA, Python... |

---

### Ce qui marche : `full_auto` (formules)

**Flux :**
```
1. Claude génère checkpoint avec "computation": { "type": "sum", "column": "CA" }
2. ComputationEngine.enrichCheckpoints() calcule l'expected_value depuis les vraies données
3. CheckpointValidator compare formule utilisateur vs pattern attendu
4. ✅ Fonctionne bien
```

**Fichiers impliqués :**
- `ComputationEngine.js` : calcule sum, average, min, max, countif, sumif, lookup...
- `CheckpointValidator.js` : `validateFormule()`, `validateValeur()`
- `FlexibleFormulaValidator.js` : normalise FR/EN, références absolues/relatives

---

### Ce qui ne marche PAS : `semi_auto` (visuels)

**Compétences concernées (14) :**
- Formatage cellules (2)
- Tri simple (7), Filtres basiques (8)
- MFC simple (10), MFC avancée (32)
- Graphiques basiques (21), Graphiques avancés (31), Graphiques dynamiques (45)
- TCD basique (23), TCD avancé (26)
- Validation données (25)
- Tableaux de bord (40)
- Génération de séries (52)
- Filtres avancés (57)

**Problème 1 : Pas d'upload screenshot dans le frontend**

Le code `VisualValidationService.js` existe et utilise Claude Vision, MAIS :
```javascript
// VisualValidationService.js ligne 10-14
// TODO [LIMITE] : Ce service est fonctionnel mais non intégré au frontend :
//   1. Le frontend doit implémenter l'upload de screenshot (tâche T3.3.6)
//   2. L'API /api/correct-exercise doit accepter les images en base64
```

**Actuellement :** `CheckpointValidator` fait une détection BASIQUE via ExcelJS :
- Graphiques : détecte si `worksheet.drawings.length > 0` (présence, pas le type)
- MFC : détecte si `worksheet.conditionalFormattings.length > 0` (présence, pas les règles)
- TCD : détecte par nom de feuille ("pivot", "tcd")

**Problème 2 : Même avec screenshot, validation limitée**

Claude Vision peut analyser une image et dire :
- "Il y a un camembert" ✅
- "Le titre est 'Ventes par région'" ✅
- "Les catégories sont Nord, Sud, Est, Ouest" ✅

Mais il ne peut PAS :
- Vérifier que les données du graphique correspondent aux données du tableau
- Vérifier l'ordre exact des colonnes après réorganisation
- Vérifier quelles lignes sont filtrées (invisibles dans screenshot)
- Vérifier la structure interne d'un TCD (quels champs en lignes/colonnes/valeurs)

---

### Types de checkpoints NON SUPPORTÉS

**Actions que Claude pourrait demander mais qu'on ne peut pas valider :**

| Action demandée | Checkpoint type | Supporté ? |
|-----------------|-----------------|------------|
| "Déplace la colonne C après E" | `column_order` | ❌ N'existe pas |
| "Trie par CA décroissant" | `sort_order` | ⚠️ Détection présence tri seulement |
| "Filtre les ventes > 1000€" | `filter_active` | ⚠️ Détection présence filtre seulement |
| "Crée un tableau structuré (Ctrl+T)" | `table_exists` | ❌ N'existe pas |
| "Ajoute une colonne calculée" | `column_exists` | ❌ N'existe pas |
| "Fusionne les cellules A1:C1" | `merged_cells` | ❌ N'existe pas |
| "Applique le format monétaire" | `number_format` | ❌ N'existe pas |
| "Crée une liste déroulante" | `data_validation` | ⚠️ Partiel |
| "Nomme cette plage 'Ventes'" | `named_range` | ❌ N'existe pas |

---

### Le problème de la boucle Claude → Claude

Pour les exercices générés from scratch :

```
Claude (générateur) génère :
  - Question : "Crée un camembert de la répartition par catégorie"
  - Checkpoint : { type: "graphique", graph_type: "pie", expected_data: { categories: ["A", "B", "C"] } }

Claude Vision (validateur) analyse le screenshot :
  - Détecte : graph_type = "pie", categories = ["A", "B", "C"]
  - Compare avec expected_data
  - ✅ ou ❌
```

**Risques :**
1. Claude générateur peut se tromper sur les catégories attendues
2. Claude Vision peut mal lire les labels du graphique
3. Aucune vérification que les DONNÉES du graphique sont correctes (juste les labels)

---

### Ce que Socrate devrait pouvoir faire (idéal)

**Socrate génère :**
```
"Crée un camembert montrant la répartition du CA par région.
 Les régions sont : Nord (45 230€), Sud (38 120€), Est (52 890€), Ouest (41 670€)"
```

**Le système devrait :**
1. Vérifier qu'un graphique camembert existe
2. Vérifier que les 4 régions sont présentes comme catégories
3. Vérifier que les VALEURS correspondent (±5% de tolérance)
4. Vérifier que le total fait bien 177 910€

**Actuellement impossible sans :**
- Screenshot + Claude Vision (pour 1, 2)
- Accès aux données du graphique via ExcelJS (limité pour 3, 4)

---

### Solution : Validation hybride (auto + Claude)

**Principe :** Celui qui pose la question doit savoir vérifier la réponse.
- Si Claude génère un checkpoint → Claude doit pouvoir le valider
- Pas besoin d'automatiser ce qui peut être vérifié par Claude

**Nouveau flux de correction :**

```
┌─────────────────────────────────────────────────────────────────┐
│  EXERCICE GÉNÉRÉ PAR CLAUDE                                     │
│  checkpoint 1: { type: "formule", validation: "auto", ... }     │
│  checkpoint 2: { type: "graphique", validation: "claude", ... } │
│  checkpoint 3: { type: "column_order", validation: "claude" }   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CORRECTION (fichier Excel uploadé)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────────────┐
│  validation: "auto" │               │  validation: "claude"       │
│  ─────────────────  │               │  ───────────────────────    │
│  ComputationEngine  │               │  Appel Claude avec :        │
│  CheckpointValidator│               │  - Exercice original        │
│  FlexibleFormula... │               │  - Données Excel extraites  │
│                     │               │  - Checkpoint à vérifier    │
│  ✅ Rapide, gratuit │               │  - Screenshot si visuel     │
└─────────────────────┘               │                             │
                                      │  ⚠️ Coût tokens, mais       │
                                      │     flexible et précis      │
                                      └─────────────────────────────┘
```

**Structure checkpoint enrichie :**

```json
{
  "id": "cp_3",
  "type": "column_order",
  "description": "Réorganiser les colonnes dans l'ordre : Nom, Prénom, CA, Région",
  "validation": "claude",
  "validation_prompt": "Vérifie que les colonnes sont dans l'ordre : Nom (A), Prénom (B), CA (C), Région (D)",
  "expected": {
    "column_order": ["Nom", "Prénom", "CA", "Région"]
  },
  "points": 20,
  "indices": [...]
}
```

**Pour les checkpoints visuels (graphiques, MFC) :**

```json
{
  "id": "cp_graph",
  "type": "graphique",
  "description": "Créer un camembert de la répartition du CA par région",
  "validation": "claude",
  "validation_prompt": "Vérifie qu'il y a un graphique camembert avec 4 régions (Nord, Sud, Est, Ouest) et que les proportions semblent cohérentes avec les données",
  "requires_screenshot": true,
  "expected": {
    "graph_type": "pie",
    "categories": ["Nord", "Sud", "Est", "Ouest"],
    "approximate_values": [45230, 38120, 52890, 41670]
  },
  "points": 30
}
```

**Avantages :**
- Claude peut valider N'IMPORTE QUOI qu'il a lui-même demandé
- Pas besoin de coder des validateurs pour chaque type
- Le `validation_prompt` est généré en même temps que l'exercice (cohérence garantie)
- Permet des exercices créatifs (réorganisation, mise en forme, dashboards...)

**Inconvénients :**
- Coût en tokens (1 appel Claude par checkpoint "claude")
- Latence supplémentaire
- Dépendance à la qualité du prompt de validation

**Optimisation :**
- Regrouper tous les checkpoints "claude" en un seul appel
- Extraire les données Excel une seule fois, les passer à Claude
- Pour les visuels : screenshot unique analysé pour tous les checkpoints graphiques

---

## PROBLÈME 5 : 76 TEMPLATES, MAPPING COMPÉTENCES FLOU

**État actuel :**
- 76 fichiers JSON dans `/shared/data/exercises/{debutant,intermediaire,avance}/`
- Chaque JSON a `competences: ["SOMME", "MOYENNE"]` (noms variables)
- 146 noms de compétences différents (variantes : "SI", "SI_imbriques", "SI imbriqués"...)
- 58 compétences dans `PEDAGOGIE`

**Pas de mapping centralisé :** Quel template utiliser pour quelle compétence ?

**À faire :** Créer un index `competenceId → [template_ids]` pour sélection intelligente.

---

## ACTIONS À CODER (PRIORITÉ)

### P1. Corriger le catalogue (BUG 1) — CRITIQUE
```
/app/catalogue/[skill]/page.js
- Remplacer l'appel à /api/generate-dynamic
- Utiliser ExerciseLibrary pour charger un template par compétence
- Générer l'Excel depuis le template
```

### P2. Transmettre le profil onboarding (BUG 2) — CRITIQUE
```
1. ChatInterface.jsx : lire localStorage('socrate-user-data')
2. Envoyer à /api/chat dans le body
3. /api/chat : injecter dans le prompt système
4. Idem pour /api/generate-dynamic si besoin
```

### P3. Enrichir le contexte post-exercice (BUG 3) — IMPORTANT
```
/app/catalogue/[skill]/page.js (après correction) :
- Ajouter exerciseId, score, errors au skillContext
- Socrate peut adapter son aide
```

### P4. Implémenter validation hybride auto + Claude (PROBLÈME 4) — CRITIQUE
```
1. Modifier DynamicExerciseGeneratorV2.js :
   - Chaque checkpoint généré a un champ "validation": "auto" | "claude"
   - Si checkpoint complexe (graphique, ordre, format) → validation: "claude"
   - Générer aussi "validation_prompt" pour les checkpoints Claude

2. Modifier /api/correct-exercise/route.js :
   - Séparer checkpoints auto vs claude
   - Auto → CheckpointValidator (existant)
   - Claude → nouvel appel avec exercice + données Excel + checkpoint

3. Créer ClaudeValidationService.js :
   - Reçoit : exercice original, données extraites, checkpoints à valider
   - Construit prompt de validation
   - Retourne { passed: bool, feedback: string } par checkpoint

4. (Optionnel) Upload screenshot pour checkpoints visuels :
   - Frontend : bouton "Ajouter capture d'écran"
   - Envoyer en base64 avec le fichier Excel
   - Passer à Claude Vision pour validation graphiques/MFC
```

### P5. Créer index compétence → templates (PROBLÈME 5) — IMPORTANT
```
/shared/data/competenceTemplateIndex.js
- Mapper chaque competenceId aux templates appropriés
- Nettoyer les variantes de noms (146 → 58)
```

### P6. Ajouter les fichiers clés manquants
```
Créer /backend/services/correction/ClaudeValidationService.js :
- validateWithClaude(exercise, extractedData, checkpoints, screenshot?)
- Prompt template pour validation
- Gestion erreurs et fallback
```

---

## FICHIERS CLÉS

| Fichier | Rôle |
|---------|------|
| `/app/catalogue/[skill]/page.js` | Page compétence catalogue (BUG 1) |
| `/app/onboarding/page.js` | Collecte prénom, métier, niveau |
| `/app/components/ChatInterface.jsx` | Interface chat Socrate |
| `/app/api/chat/route.js` | API conversation Socrate |
| `/app/api/generate-dynamic/route.js` | API génération V2 |
| `/app/api/generate-exercise-file/route.js` | API génération depuis templates |
| `/app/api/correct-exercise/route.js` | API correction exercices |
| `/backend/services/exercises/ExerciseLibrary.js` | Charge les 76 templates |
| `/backend/services/exercises/DynamicExerciseGeneratorV2.js` | Génération from scratch |
| `/backend/services/exercises/CompetenceValidationMap.js` | Définit full_auto vs semi_auto |
| `/backend/services/exercises/ComputationEngine.js` | Calcule expected_value |
| `/backend/services/correction/CheckpointValidator.js` | Valide formules/valeurs (auto) |
| `/backend/services/correction/VisualValidationService.js` | Valide visuels avec Claude Vision |
| `/backend/services/correction/ClaudeValidationService.js` | **À CRÉER** - Validation hybride Claude |
| `/shared/data/exercises/` | 76 templates JSON |
| `/shared/data/pedagogie.js` | 58 compétences définies |

---

*Dernière mise à jour : 23 janvier 2026*
