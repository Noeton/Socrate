# 📚 Exemples d'utilisation des nouvelles librairies

## 1. Utilisation de `lib/config.js`

### Avant (duplication)
```javascript
// app/api/correct-exercise/route.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// app/api/generate-exercise/route.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
```

### Après (centralisé)
```javascript
// Dans n'importe quelle route
import { getSupabaseAdmin, getAnthropicConfig } from '@/lib/config';

const supabaseAdmin = getSupabaseAdmin();
const anthropicConfig = getAnthropicConfig();

// Utilisation
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'x-api-key': anthropicConfig.apiKey,
    'anthropic-version': anthropicConfig.apiVersion,
  },
  body: JSON.stringify({
    model: anthropicConfig.defaultModel,
    max_tokens: anthropicConfig.defaultMaxTokens,
    // ...
  }),
});
```

---

## 2. Utilisation de `lib/errors.js`

### Avant (erreurs génériques)
```javascript
if (!originalExercise) {
  return NextResponse.json(
    { error: 'Exercice introuvable' },
    { status: 404 }
  );
}
```

### Après (erreurs typées)
```javascript
import { ExerciseNotFoundError, handleApiError } from '@/lib/errors';

try {
  const originalExercise = ExerciseLibrary.getExerciseById(exerciseId);
  
  if (!originalExercise) {
    throw new ExerciseNotFoundError(exerciseId);
  }
  
  // ... reste du code
  
} catch (error) {
  const errorResponse = handleApiError(error, { exerciseId, userId });
  return NextResponse.json(errorResponse, { status: error.statusCode || 500 });
}
```

---

## 3. Utilisation de `lib/logger.js`

### Avant (console.log partout)
```javascript
console.log('📝 [CORRECT] Correction exercice:', exerciseId, 'pour user:', userId);
console.log('✅ [CORRECT] Exercice original chargé:', originalExercise.titre);
console.error('❌ [CORRECT] Erreur:', error);
```

### Après (logger structuré)
```javascript
import { logger } from '@/lib/logger';

logger.info('Correction exercice démarrée', { exerciseId, userId });
logger.info('Exercice original chargé', { 
  exerciseId, 
  titre: originalExercise.titre 
});
logger.error('Erreur lors de la correction', error, { exerciseId, userId });
```

**Avantages** :
- En dev : logs lisibles avec emoji
- En prod : JSON structuré pour parsing automatique
- Filtrage par niveau (DEBUG, INFO, WARN, ERROR)
- Contexte automatique (timestamp, niveau, etc.)

---

## 4. Migration progressive d'une route

### Exemple : `app/api/correct-exercise/route.js`

```javascript
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/config';
import { ExerciseNotFoundError, handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import HybridCorrector from '@/backend/services/correction/HybridCorrector';
// ... autres imports

const supabaseAdmin = getSupabaseAdmin(); // ✅ Centralisé

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const exerciseId = formData.get('exerciseId');
    
    logger.info('Correction exercice démarrée', { exerciseId, userId }); // ✅ Logger
    
    if (!file || !userId || !exerciseId) {
      throw new ValidationError('file/userId/exerciseId', 'Paramètres manquants');
    }
    
    const originalExercise = ExerciseLibrary.getExerciseById(exerciseId);
    
    if (!originalExercise) {
      throw new ExerciseNotFoundError(exerciseId); // ✅ Erreur typée
    }
    
    logger.info('Exercice chargé', { exerciseId, titre: originalExercise.titre });
    
    // ... reste du code
    
    return NextResponse.json({ success: true, ... });
    
  } catch (error) {
    logger.error('Erreur correction exercice', error, { exerciseId, userId });
    const errorResponse = handleApiError(error, { exerciseId, userId }); // ✅ Handler centralisé
    return NextResponse.json(errorResponse, { status: error.statusCode || 500 });
  }
}
```

---

## 5. Parallélisation des opérations

### Avant (séquentiel - lent)
```javascript
await saveToHistory(analysis, exerciseId, userId, 0);
await CompetenceMastery.updateMastery(...);
await SpacedRepetition.scheduleReview(...);
```

### Après (parallèle - rapide)
```javascript
await Promise.all([
  saveToHistory(analysis, exerciseId, userId, 0),
  CompetenceMastery.updateMastery(...),
  SpacedRepetition.scheduleReview(...),
]);
```

**Gain** : Réduction latence ~30-50% si opérations indépendantes

---

## 6. Refactoring signatures de fonctions

### Avant (arguments positionnels)
```javascript
// HybridCorrector.js
static async correct(worksheet, exercise, userFormulas, userValues, workbook) {
  const userId = arguments[5] || 'unknown'; // ❌ Moche
  const exerciseId = arguments[6] || 'unknown';
}

// Utilisation
await HybridCorrector.correct(worksheet, exercise, formulas, null, workbook, userId, exerciseId);
```

### Après (paramètres nommés)
```javascript
// HybridCorrector.js
static async correct({
  worksheet,
  exercise,
  userFormulas,
  workbook,
  userId,
  exerciseId,
}) {
  // Code plus clair
}

// Utilisation
await HybridCorrector.correct({
  worksheet,
  exercise: originalExercise,
  userFormulas,
  workbook,
  userId,
  exerciseId,
});
```

**Avantages** :
- Plus lisible
- Ordre des paramètres sans importance
- Paramètres optionnels faciles
- Meilleure autocomplétion IDE

---

## 🎯 Checklist de migration

Pour chaque route API :

- [ ] Remplacer `createClient` par `getSupabaseAdmin()`
- [ ] Remplacer `console.log` par `logger.info/warn/error`
- [ ] Remplacer erreurs génériques par classes d'erreurs typées
- [ ] Ajouter `handleApiError` dans le catch
- [ ] Paralléliser opérations indépendantes avec `Promise.all`
- [ ] Refactorer signatures avec paramètres nommés (optionnel mais recommandé)

---

*Ces exemples montrent comment migrer progressivement vers une architecture plus robuste.*
