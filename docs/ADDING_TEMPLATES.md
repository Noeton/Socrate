# Guide d'ajout de Templates d'Exercices

Ce guide explique comment ajouter de nouveaux templates d'exercices à Socrate.

## Structure d'un Template

Chaque template est un fichier JSON dans `/shared/data/exercises/{niveau}/`.

### Fichier minimal

```json
{
  "id": "debutant_XX_nom_exercice",
  "titre": "Titre de l'exercice",
  "niveau": "debutant",
  "duree_estimee": "15 min",
  "competences": ["SOMME", "SI"],
  "competence_ids": [3, 9],
  "contexte": {
    "situation": "Description du contexte professionnel...",
    "manager": {
      "nom": "Marie Dupont",
      "poste": "Responsable Finance",
      "demande": "Ce que le manager demande..."
    },
    "enjeux": "Pourquoi c'est important",
    "deadline": "Fin de journée"
  },
  "objectifs": [
    "Objectif 1",
    "Objectif 2"
  ],
  "consignes": [
    "Étape 1: ...",
    "Étape 2: ..."
  ],
  "donnees": {
    "headers": ["Colonne1", "Colonne2", "Colonne3"],
    "rows": [
      ["Valeur1", 100, ""],
      ["Valeur2", 200, ""]
    ]
  },
  "checkpoints": [
    {
      "id": "cp_1",
      "cellule": "C2",
      "type": "formule",
      "description": "Calcul du total",
      "fonction": "SOMME",
      "pattern": ["SOMME", "A2", "B2"],
      "points": 10,
      "indices": [
        "Indice 1 (facile)",
        "Indice 2 (moyen)",
        "=SOMME(A2:B2)"
      ],
      "competence_id": 3
    }
  ]
}
```

## Champs obligatoires

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | ID unique, format: `{niveau}_{numero}_{nom}` |
| `titre` | string | Titre affiché à l'utilisateur |
| `niveau` | string | `debutant`, `intermediaire`, ou `avance` |
| `competence_ids` | number[] | **IMPORTANT** : IDs des compétences couvertes |
| `donnees` | object | Données à injecter dans le fichier Excel |
| `checkpoints` | array | Points de validation |

## Mapping des Compétences (IDs)

### Débutant
| ID | Clé | Nom |
|----|-----|-----|
| 1 | SAISIE_DONNEES | Saisie de données |
| 2 | FORMATAGE_CELLULES | Formatage cellules |
| 3 | SOMME | SOMME |
| 4 | MOYENNE | MOYENNE |
| 5 | MIN_MAX | MIN/MAX |
| 6 | COPIER_COLLER | Copier-coller |
| 7 | TRI_SIMPLE | Tri simple |
| 8 | FILTRES_BASIQUES | Filtres basiques |
| 9 | SI | SI |
| 10 | MFC_SIMPLE | MFC simple |
| 52 | SERIES_AUTOMATIQUES | Séries automatiques |
| 58 | COLLAGE_SPECIAL | Collage spécial |

### Intermédiaire
| ID | Clé | Nom |
|----|-----|-----|
| 11 | NB_SI | NB.SI |
| 12 | NB_SI_ENS | NB.SI.ENS |
| 13 | SOMME_SI | SOMME.SI |
| 14 | SOMME_SI_ENS | SOMME.SI.ENS |
| 15 | REFERENCES_ABSOLUES | Références absolues |
| 16 | SI_IMBRIQUES | SI imbriqués |
| 17 | FONCTIONS_TEXTE | Fonctions texte |
| 18 | RECHERCHEV | RECHERCHEV |
| 19 | CONCATENER | CONCATENER |
| 20 | FONCTIONS_DATE | Fonctions date |
| 21 | GRAPHIQUES_BASIQUES | Graphiques basiques |
| 22 | SIERREUR | SIERREUR |
| 23 | TCD_BASIQUE | TCD basique |
| 24 | INDEX_EQUIV | INDEX/EQUIV |
| 25 | VALIDATION_DONNEES | Validation données |
| 51 | REFERENCES_MIXTES | Références mixtes |
| 53 | RECHERCHEV_APPROCHEE | RECHERCHEV approchée |
| 54 | RECHERCHEH | RECHERCHEH |

### Avancé
| ID | Clé | Nom |
|----|-----|-----|
| 26 | TCD_AVANCE | TCD avancé |
| 27 | TABLEAUX_STRUCTURES | Tableaux structurés |
| 28 | SOMMEPROD | SOMMEPROD |
| 29 | FORMULES_MATRICIELLES | Formules matricielles |
| 30 | INDIRECT | INDIRECT |
| 31 | GRAPHIQUES_AVANCES | Graphiques avancés |
| 32 | MFC_AVANCEE | MFC avancée |
| 38 | RECHERCHEX | RECHERCHEX |
| 39 | FORMULES_DYNAMIQUES | Formules dynamiques |
| 40 | TABLEAUX_BORD | Tableaux de bord |

## Types de Checkpoints

### `formule` - Validation de formules
```json
{
  "type": "formule",
  "cellule": "B10",
  "fonction": "SOMME",
  "pattern": ["SOMME", "B2", "B9"],
  "points": 10
}
```

### `valeur` - Validation de valeurs
```json
{
  "type": "valeur",
  "cellule": "C5",
  "expected_value": 1250,
  "tolerance": 0.01,
  "points": 5
}
```

### `format` - Validation de format (nécessite screenshot)
```json
{
  "type": "format",
  "cellule": "A1:D10",
  "description": "En-têtes en gras avec fond bleu",
  "validation_type": "visual",
  "requires_screenshot": true,
  "points": 10
}
```

### `graphique` - Validation de graphiques (nécessite screenshot)
```json
{
  "type": "graphique",
  "description": "Histogramme des ventes par mois",
  "validation_type": "visual",
  "requires_screenshot": true,
  "expected": {
    "chart_type": "column",
    "has_title": true,
    "has_legend": true
  },
  "points": 15
}
```

## Processus d'ajout

### 1. Créer le fichier JSON

```bash
# Créer le fichier dans le bon dossier
touch shared/data/exercises/debutant/debutant_28_nouveau_template.json
```

### 2. Valider le template

```bash
# Vérifier la syntaxe JSON
node -e "JSON.parse(require('fs').readFileSync('shared/data/exercises/debutant/debutant_28_nouveau_template.json'))"

# Exécuter la validation complète
node scripts/validate-competence-index.js --verbose
```

### 3. Régénérer l'index

```bash
# Régénérer l'index centralisé
node scripts/generate-competence-index.js
```

### 4. Valider l'index

```bash
# Valider que tout est correct
node scripts/validate-competence-index.js
```

### 5. Tester

```bash
# Lancer l'application et tester le template
npm run dev
```

## Checklist avant commit

- [ ] Le fichier JSON est valide (pas d'erreurs de syntaxe)
- [ ] `id` est unique et suit le format `{niveau}_{numero}_{nom}`
- [ ] `competence_ids` contient des IDs valides
- [ ] Au moins 3 checkpoints sont définis
- [ ] Chaque checkpoint a des `indices` (3 niveaux)
- [ ] Les `points` totalisent 100 (recommandé)
- [ ] Le contexte est réaliste et professionnel
- [ ] L'index a été régénéré
- [ ] La validation passe sans erreurs

## Scripts utiles

```bash
# Audit complet des templates
node scripts/audit-templates.js

# Générer l'index
node scripts/generate-competence-index.js

# Valider l'index
node scripts/validate-competence-index.js

# Valider avec détails
node scripts/validate-competence-index.js --verbose

# Valider et réparer automatiquement
node scripts/validate-competence-index.js --fix
```

## Compétences sans templates (prioritaires)

Ces compétences n'ont actuellement aucun template dédié :

| ID | Compétence | Priorité |
|----|------------|----------|
| 33 | Macros | P2 |
| 34 | VBA basique | P2 |
| 36 | Power Query Transform | P1 |
| 37 | Power Query Merge | P1 |
| 40 | Tableaux de bord | P0 |
| 55 | Fonctions BD | P2 |
| 57 | Filtres avancés | P1 |

## Bonnes pratiques

1. **Contexte réaliste** : Toujours ancrer l'exercice dans un contexte professionnel crédible
2. **Progression des indices** : Du plus vague au plus précis (solution complète en dernier)
3. **Points équilibrés** : Les checkpoints difficiles valent plus de points
4. **Données variées** : Utiliser des données réalistes et suffisamment nombreuses
5. **Tester la correction** : Vérifier que le système de correction valide correctement l'exercice
