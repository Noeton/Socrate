import { NextResponse } from 'next/server';
import DynamicExerciseGenerator from '@/backend/services/exercises/DynamicExerciseGeneratorV2';
import logger from '@/lib/logger';

/**
 * API ROUTE : Génération dynamique d'exercices avec Claude
 * 
 * POST /api/generate-dynamic
 * 
 * Body:
 * - userId: string (optionnel)
 * - competence: string | number (nom ou ID de la compétence)
 * - competenceId: number (alternatif à competence)
 * - skillKey: string (alternatif - clé depuis pedagogie.js)
 * - type: 'discovery' | 'consolidation' | 'remediation' | 'autonomy'
 * - metier: string (optionnel - contexte métier)
 * - includeExcel: boolean (optionnel - générer le fichier Excel)
 * 
 * Returns:
 * - exercise: Object (structure complète de l'exercice)
 * - excelBase64?: string (fichier Excel encodé si includeExcel=true)
 * - stats: Object (métriques de génération)
 * - generationTime: number (temps en ms)
 */

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { 
      userId, 
      competence, 
      competenceId,
      skillKey,
      type = 'consolidation',
      metier,
      includeExcel = false
    } = body;
    
    // Déterminer la compétence à utiliser
    const competenceParam = competence || competenceId || skillKey;
    
    if (!competenceParam) {
      return NextResponse.json(
        { error: 'Paramètre competence, competenceId ou skillKey requis' },
        { status: 400 }
      );
    }
    
    logger.info('GENERATE-DYNAMIC', 'Début génération', {
      userId: userId?.substring(0, 8),
      competence: competenceParam,
      type,
      metier
    });
    
    // Appeler le générateur V2
    const result = await DynamicExerciseGenerator.generate({
      competence: competenceParam,
      userId,
      exerciseType: type,
      options: { metier }
    });
    
    const { exercise, excelBuffer, stats } = result;
    
    // Préparer la réponse
    const response = {
      success: true,
      exercise: {
        id: exercise.id || `dyn_${Date.now()}`,
        titre: exercise.titre,
        contexte: exercise.contexte,
        competence: exercise.competence,
        niveau: exercise.niveau,
        checkpoints: exercise.checkpoints,
        indices: exercise.indices || exercise.hints,
        donnees: exercise.donnees,
        // Métadonnées enrichies
        generated: true,
        generatedAt: exercise.generated_at,
        datasetSource: exercise.dataset_source,
        progressionLevel: exercise.progression_level,
        metier: exercise.metier
      },
      stats: {
        ...stats,
        generationTime: Date.now() - startTime
      }
    };
    
    // Ajouter le fichier Excel si demandé
    if (includeExcel && excelBuffer) {
      response.excelBase64 = excelBuffer.toString('base64');
      response.excelFilename = `exercice_${exercise.competence || 'socrate'}_${Date.now()}.xlsx`;
    }
    
    logger.info('GENERATE-DYNAMIC', 'Exercice généré', {
      titre: exercise.titre,
      checkpoints: exercise.checkpoints?.length,
      time: Date.now() - startTime
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('GENERATE-DYNAMIC', 'Erreur génération', { 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erreur lors de la génération',
        fallbackAvailable: true
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-dynamic
 * Retourne les informations sur le générateur (pour debug/status)
 */
export async function GET() {
  return NextResponse.json({
    name: 'DynamicExerciseGeneratorV2',
    version: '2.0',
    status: 'ready',
    capabilities: [
      'Génération avec Claude',
      'Datasets réels par métier',
      'Progression intra-compétence',
      'Calcul automatique des expected_value',
      'Export Excel'
    ],
    supportedTypes: ['discovery', 'consolidation', 'remediation', 'autonomy'],
    supportedMetiers: ['ventes', 'finance', 'rh', 'marketing', 'operations']
  });
}
