import { NextResponse } from 'next/server';
import ExerciseLibrary from '@/backend/services/exercises/ExerciseLibrary';
import { PEDAGOGIE } from '@/shared/data/pedagogie';
import { 
  resolveCompetenceId, 
  getCompetenceInfo, 
  getCompetenceCoverage 
} from '@/shared/data/competenceIndex';
import logger from '@/lib/logger';

/**
 * API pour sélectionner un exercice template par compétence
 * 
 * PHASE 3: Utilise maintenant COMPETENCE_INDEX pour lookup direct O(1)
 * Remplace les 4 stratégies de recherche floue par un lookup dans l'index
 * 
 * POST /api/select-template
 * Body: { competenceKey: "SOMME", competenceId: 3, userId: "xxx" }
 * Returns: { exercise: {...}, found: true, coverage: 'full'|'partial'|'none' }
 */
export async function POST(request) {
  try {
    const { competenceKey, competenceId, userId } = await request.json();
    
    logger.info('SELECT-TEMPLATE', 'Recherche template', { competenceKey, competenceId });
    
    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 1: Résoudre l'ID de compétence
    // ═══════════════════════════════════════════════════════════════════════
    
    let compId = competenceId;
    let competenceName = null;
    
    // Si on a une clé, essayer de résoudre via l'index
    if (competenceKey && !compId) {
      compId = resolveCompetenceId(competenceKey);
    }
    
    // Fallback sur PEDAGOGIE
    if (!compId) {
      const pedagogie = PEDAGOGIE[competenceKey?.toUpperCase()];
      if (pedagogie) {
        compId = pedagogie.id;
        competenceName = pedagogie.nom;
      }
    }
    
    // Si on a l'ID mais pas le nom, récupérer depuis l'index
    if (compId && !competenceName) {
      const info = getCompetenceInfo(compId);
      competenceName = info?.nom || competenceKey || `Compétence #${compId}`;
    }
    
    if (!compId) {
      logger.warn('SELECT-TEMPLATE', 'Compétence non trouvée', { competenceKey, competenceId });
      return NextResponse.json({ 
        error: 'Compétence non trouvée', 
        found: false 
      }, { status: 404 });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 2: Lookup direct via l'index (O(1))
    // ═══════════════════════════════════════════════════════════════════════
    
    ExerciseLibrary.initialize();
    
    // Utilise getExercisesByCompetence qui fait maintenant un lookup dans l'index
    const exercises = ExerciseLibrary.getExercisesByCompetence(compId);
    const coverage = getCompetenceCoverage(compId);
    
    logger.info('SELECT-TEMPLATE', 'Résultat lookup index', { 
      compId,
      competenceName,
      templatesFound: exercises.length,
      coverage
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 3: Gérer le cas où aucun template n'est trouvé
    // ═══════════════════════════════════════════════════════════════════════
    
    if (exercises.length === 0) {
      // Fallback intelligent basé sur le niveau de la compétence
      const compInfo = getCompetenceInfo(compId);
      const niveau = compInfo?.niveau || 'debutant';
      
      const fallback = ExerciseLibrary.exercises.find(e => e.niveau === niveau) ||
                       ExerciseLibrary.exercises.find(e => e.niveau === 'debutant');
      
      if (fallback) {
        logger.info('SELECT-TEMPLATE', 'Fallback utilisé', { 
          fallbackId: fallback.id,
          reason: `Aucun template pour compétence ${compId}`,
          coverage
        });
        
        return NextResponse.json({
          exercise: fallback,
          found: true,
          fallback: true,
          coverage,
          message: `Cette compétence n'a pas encore d'exercice dédié. Voici un exercice ${niveau} pour pratiquer.`
        });
      }
      
      return NextResponse.json({ 
        error: `Aucun exercice trouvé pour ${competenceName}`, 
        found: false,
        coverage
      }, { status: 404 });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 4: Sélectionner parmi les candidats
    // ═══════════════════════════════════════════════════════════════════════
    
    // Préférer le niveau approprié
    const compInfo = getCompetenceInfo(compId);
    const niveauCible = compInfo?.niveau || 'debutant';
    
    const exercicesMemeNiveau = exercises.filter(e => 
      e.niveau === niveauCible || e._niveau === niveauCible
    );
    
    const candidates = exercicesMemeNiveau.length > 0 ? exercicesMemeNiveau : exercises;
    
    // Sélection aléatoire pour varier l'expérience
    // TODO: Utiliser l'historique utilisateur pour éviter les répétitions
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const selectedExercise = candidates[randomIndex];
    
    logger.info('SELECT-TEMPLATE', 'Template sélectionné', { 
      id: selectedExercise.id,
      titre: selectedExercise.titre,
      niveau: selectedExercise.niveau,
      checkpoints: selectedExercise.checkpoints?.length || 0,
      coverage,
      totalCandidates: candidates.length
    });
    
    // ═══════════════════════════════════════════════════════════════════════
    // ÉTAPE 5: Retourner le résultat enrichi
    // ═══════════════════════════════════════════════════════════════════════
    
    return NextResponse.json({
      exercise: selectedExercise,
      found: true,
      coverage,
      totalCandidates: candidates.length,
      competenceInfo: {
        id: compId,
        nom: competenceName,
        niveau: niveauCible,
        needsScreenshot: compInfo?.needsScreenshot || false
      }
    });
    
  } catch (error) {
    logger.error('SELECT-TEMPLATE', 'Erreur', { error: error.message, stack: error.stack });
    return NextResponse.json({ 
      error: error.message, 
      found: false 
    }, { status: 500 });
  }
}
