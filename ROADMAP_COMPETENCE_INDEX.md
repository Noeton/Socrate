# ROADMAP : Index Centralisé Compétences ↔ Templates

## Contexte du Problème

### État actuel
- **76 templates JSON** dans `/shared/data/exercises/{debutant,intermediaire,avance}/`
- **58 compétences** définies dans `/shared/data/pedagogie.js` (PEDAGOGIE)
- **146 noms de compétences différents** utilisés dans les templates (champ `competences[]`)
- **Aucun index centralisé** : le mapping se fait par recherche textuelle floue

### Problèmes concrets
1. `ExerciseLibrary.getExercisesByCompetence(id)` ne trouve pas toujours les bons templates
2. Les templates utilisent des noms de compétences inconsistants ("SOMME", "Somme", "somme", "SUM")
3. Pas de validation à la création de template → erreurs silencieuses
4. Impossible de savoir quelles compétences n'ont pas de template

---

## Architecture Cible

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPETENCE_INDEX.js                          │
│  Source unique de vérité pour le mapping compétences ↔ templates│
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PEDAGOGIE     │  │ ExerciseLibrary │  │  select-template│
│   (58 compét.)  │  │  (76 templates) │  │     API         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Phase 1 : Audit et Normalisation (2-3h)

### 1.1 Script d'audit des templates
**Fichier** : `/scripts/audit-templates.js`

```javascript
// Objectif : Analyser les 76 templates et extraire toutes les variations de noms
// Output : Rapport JSON avec :
//   - Liste de tous les noms de compétences utilisés
//   - Mapping nom → templates qui l'utilisent
//   - Orphelins (templates sans competences_ids)
//   - Compétences sans templates
```

**Commande** : `node scripts/audit-templates.js > audit-report.json`

### 1.2 Script de normalisation
**Fichier** : `/scripts/normalize-templates.js`

```javascript
// Objectif : Mettre à jour les templates pour utiliser des IDs plutôt que des noms
// Actions :
//   1. Ajouter competences_ids[] si manquant
//   2. Normaliser les noms en MAJUSCULES
//   3. Valider que chaque competence_id existe dans PEDAGOGIE
//   4. Générer un rapport des modifications
```

**Commande** : `node scripts/normalize-templates.js --dry-run` puis `--apply`

### 1.3 Livrables Phase 1
- [ ] `audit-report.json` : État actuel documenté
- [ ] 76 templates mis à jour avec `competences_ids[]` valides
- [ ] Rapport de normalisation

---

## Phase 2 : Création de l'Index Centralisé (3-4h)

### 2.1 Structure de l'index
**Fichier** : `/shared/data/competenceIndex.js`

```javascript
/**
 * COMPETENCE INDEX - Source unique de vérité
 * 
 * Structure :
 * - Par compétence : liste des templates associés
 * - Par template : métadonnées enrichies
 * - Aliases : mapping des variations de noms
 */

export const COMPETENCE_INDEX = {
  // Index principal : competenceId → templates
  byCompetence: {
    3: {  // SOMME
      templates: ['budget_mensuel', 'ventes_trimestrielles', 'inventaire_stock'],
      aliases: ['SOMME', 'SUM', 'somme', 'Somme'],
      coverage: 'full',  // full | partial | none
      levels: ['debutant', 'intermediaire']
    },
    18: {  // RECHERCHEV
      templates: ['commandes_clients', 'catalogue_produits'],
      aliases: ['RECHERCHEV', 'VLOOKUP', 'RechercheV'],
      coverage: 'full',
      levels: ['intermediaire', 'avance']
    },
    // ...
  },
  
  // Index inverse : templateId → compétences
  byTemplate: {
    'budget_mensuel': {
      competences: [3, 4, 5],  // SOMME, MOYENNE, MIN/MAX
      niveau: 'debutant',
      metier: 'finance',
      checkpointsCount: 5,
      validationType: 'full_auto'
    },
    // ...
  },
  
  // Aliases pour recherche flexible
  aliases: {
    'SOMME': 3,
    'SUM': 3,
    'somme': 3,
    'MOYENNE': 4,
    'AVERAGE': 4,
    // ...
  },
  
  // Métadonnées
  meta: {
    generatedAt: '2026-01-23',
    templateCount: 76,
    competenceCount: 58,
    coverageStats: {
      full: 35,      // Compétences avec 2+ templates
      partial: 15,   // Compétences avec 1 template
      none: 8        // Compétences sans template
    }
  }
};
```

### 2.2 Script de génération de l'index
**Fichier** : `/scripts/generate-competence-index.js`

```javascript
// Objectif : Générer COMPETENCE_INDEX.js automatiquement
// Sources :
//   - PEDAGOGIE (58 compétences)
//   - Templates JSON (76 fichiers)
//   - VALIDATION_MAP (types de validation)
// 
// Ce script doit être exécuté après chaque ajout de template
```

**Commande** : `node scripts/generate-competence-index.js`

### 2.3 Livrables Phase 2
- [ ] `/shared/data/competenceIndex.js` généré
- [ ] Script de génération automatique
- [ ] Documentation du format

---

## Phase 3 : Intégration dans le Code (2-3h)

### 3.1 Modifier ExerciseLibrary
**Fichier** : `/backend/services/exercises/ExerciseLibrary.js`

```javascript
import { COMPETENCE_INDEX } from '@/shared/data/competenceIndex';

class ExerciseLibrary {
  // AVANT : recherche floue par nom
  // APRÈS : lookup direct par ID
  
  getExercisesByCompetence(competenceId) {
    const indexEntry = COMPETENCE_INDEX.byCompetence[competenceId];
    if (!indexEntry) return [];
    
    return indexEntry.templates
      .map(templateId => this.getExerciseById(templateId))
      .filter(Boolean);
  }
  
  // Nouvelle méthode : recherche par alias
  getCompetenceId(nameOrAlias) {
    return COMPETENCE_INDEX.aliases[nameOrAlias.toUpperCase()] || null;
  }
  
  // Nouvelle méthode : vérifier la couverture
  getCompetenceCoverage(competenceId) {
    return COMPETENCE_INDEX.byCompetence[competenceId]?.coverage || 'none';
  }
}
```

### 3.2 Modifier l'API select-template
**Fichier** : `/app/api/select-template/route.js`

```javascript
import { COMPETENCE_INDEX } from '@/shared/data/competenceIndex';

// AVANT : 4 stratégies de recherche floue
// APRÈS : lookup direct + fallback intelligent

export async function POST(request) {
  const { competenceKey, competenceId } = await request.json();
  
  // 1. Résoudre l'ID de compétence
  const resolvedId = competenceId || COMPETENCE_INDEX.aliases[competenceKey?.toUpperCase()];
  
  // 2. Lookup direct
  const indexEntry = COMPETENCE_INDEX.byCompetence[resolvedId];
  
  if (!indexEntry || indexEntry.templates.length === 0) {
    // Fallback : compétence proche ou exercice générique
    return selectFallbackExercise(resolvedId);
  }
  
  // 3. Sélection intelligente parmi les templates
  const selectedTemplate = selectBestTemplate(indexEntry.templates, userId);
  
  return NextResponse.json({ exercise: selectedTemplate, found: true });
}
```

### 3.3 Modifier le Catalogue
**Fichier** : `/app/catalogue/page.js`

```javascript
import { COMPETENCE_INDEX } from '@/shared/data/competenceIndex';

// Afficher l'état de couverture pour chaque compétence
function CompetenceCard({ competence }) {
  const coverage = COMPETENCE_INDEX.byCompetence[competence.id]?.coverage;
  
  return (
    <div className={coverage === 'none' ? 'opacity-50' : ''}>
      {competence.nom}
      {coverage === 'none' && <span>🚧 Bientôt disponible</span>}
      {coverage === 'partial' && <span>📝 1 exercice</span>}
      {coverage === 'full' && <span>✅ {templates.length} exercices</span>}
    </div>
  );
}
```

### 3.4 Livrables Phase 3
- [ ] ExerciseLibrary modifié
- [ ] API select-template simplifiée
- [ ] Catalogue avec indicateurs de couverture

---

## Phase 4 : Validation et CI/CD (1-2h)

### 4.1 Script de validation
**Fichier** : `/scripts/validate-competence-index.js`

```javascript
// Vérifications :
// 1. Chaque template référencé existe
// 2. Chaque competenceId existe dans PEDAGOGIE
// 3. Pas de templates orphelins
// 4. Aliases sans conflits
// 5. Coverage calculée correctement

// Retourne exit code 0 si OK, 1 si erreurs
```

### 4.2 Hook pre-commit (optionnel)
**Fichier** : `.husky/pre-commit`

```bash
# Régénérer l'index si templates modifiés
if git diff --cached --name-only | grep -q "shared/data/exercises/"; then
  node scripts/generate-competence-index.js
  node scripts/validate-competence-index.js
  git add shared/data/competenceIndex.js
fi
```

### 4.3 Livrables Phase 4
- [ ] Script de validation
- [ ] Intégration CI (GitHub Actions ou hook local)
- [ ] Documentation pour ajout de nouveaux templates

---

## Phase 5 : Combler les Lacunes (ongoing)

### 5.1 Identifier les compétences sans template
Après l'audit, certaines compétences n'auront pas de templates. Prioriser :

| Priorité | Compétence | Raison |
|----------|------------|--------|
| P0 | SI (id: 9) | Fondamentale, très demandée |
| P0 | RECHERCHEV (id: 18) | Incontournable en entreprise |
| P1 | TCD (id: 23) | Visuel, mais essentiel |
| P1 | INDEX/EQUIV (id: 24) | Alternative moderne à RECHERCHEV |
| P2 | Graphiques (id: 21) | Nécessite validation visuelle |

### 5.2 Template de création d'exercice
**Fichier** : `/templates/exercise-template.json`

```json
{
  "$schema": "./exercise-schema.json",
  "id": "UNIQUE_ID",
  "titre": "Titre de l'exercice",
  "competences": ["NOM_COMPETENCE"],
  "competences_ids": [ID],
  "niveau": "debutant|intermediaire|avance",
  "metier": "finance|marketing|rh|operations|general",
  "contexte": {
    "situation": "Description du contexte métier",
    "objectif": "Ce que l'utilisateur doit accomplir"
  },
  "donnees": {
    "headers": ["Col1", "Col2"],
    "rows": []
  },
  "checkpoints": [
    {
      "id": "cp1",
      "type": "formule|valeur|graphique|format",
      "cellule": "B2",
      "description": "Description du checkpoint",
      "expected_formula": "=SOMME(A1:A10)",
      "expected_value": 100,
      "points": 20,
      "indices": ["Indice 1", "Indice 2"]
    }
  ]
}
```

### 5.3 Livrables Phase 5
- [ ] Liste priorisée des templates à créer
- [ ] Template JSON avec schema de validation
- [ ] 5-10 nouveaux templates pour compétences critiques

---

## Résumé des Fichiers à Créer/Modifier

### Nouveaux fichiers
| Fichier | Description |
|---------|-------------|
| `/scripts/audit-templates.js` | Analyse l'état actuel |
| `/scripts/normalize-templates.js` | Normalise les templates |
| `/scripts/generate-competence-index.js` | Génère l'index |
| `/scripts/validate-competence-index.js` | Valide l'index |
| `/shared/data/competenceIndex.js` | Index centralisé (généré) |
| `/templates/exercise-template.json` | Template pour nouveaux exercices |
| `/templates/exercise-schema.json` | Schema JSON pour validation |

### Fichiers à modifier
| Fichier | Modification |
|---------|--------------|
| `/backend/services/exercises/ExerciseLibrary.js` | Utiliser l'index |
| `/app/api/select-template/route.js` | Simplifier avec l'index |
| `/app/catalogue/page.js` | Afficher couverture |
| 76 templates JSON | Ajouter `competences_ids[]` |

---

## Estimation Totale

| Phase | Durée | Priorité |
|-------|-------|----------|
| Phase 1 : Audit et Normalisation | 2-3h | P0 |
| Phase 2 : Index Centralisé | 3-4h | P0 |
| Phase 3 : Intégration | 2-3h | P0 |
| Phase 4 : Validation CI | 1-2h | P1 |
| Phase 5 : Nouveaux templates | Ongoing | P1 |
| **Total initial** | **8-12h** | |

---

## Critères de Succès

1. ✅ `ExerciseLibrary.getExercisesByCompetence(id)` retourne toujours les bons templates
2. ✅ Temps de lookup < 10ms (vs recherche textuelle actuelle ~50ms)
3. ✅ 100% des templates ont `competences_ids[]` valides
4. ✅ Rapport de couverture visible dans le catalogue
5. ✅ Script de validation bloque les PR avec templates invalides
6. ✅ Documentation claire pour créer de nouveaux templates

---

## Prochaine Action Recommandée

Commencer par **Phase 1.1** : créer le script d'audit pour avoir une vision claire de l'état actuel avant toute modification.

```bash
node scripts/audit-templates.js > reports/template-audit-$(date +%Y%m%d).json
```
