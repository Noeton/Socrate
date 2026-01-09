import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

/**
 * API Route : Génération d'exercices Excel
 * POST /api/generate-exercise
 * Body: { niveau, contexteMetier, type }
 */
export async function POST(request) {
    try {
      const { niveau, contexteMetier, exerciseId, type, context, description } = await request.json();
      
      console.log(`📥 [GENERATE-EXERCISE] Demande:`, {
        niveau,
        type: type || 'générique',
        hasContext: !!context
      });

    // Créer un nouveau classeur Excel
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Exercice');

// SI exercice contextuel (proposé par Socrate dans la conversation)
if (type === 'CONTEXTUEL' && context) {
  console.log('🤖 [GENERATE-EXERCISE] Génération INTELLIGENTE via IA');
  await generateExerciceIntelligent(worksheet, context, description, niveau, contexteMetier);
}
// SINON fallback sur exercices templates
else if (niveau === 'debutant') {
  console.log('📋 [GENERATE-EXERCISE] Template débutant');
  generateExerciceDebutant(worksheet, contexteMetier);
} else if (niveau === 'intermediaire') {
  console.log('📋 [GENERATE-EXERCISE] Template intermédiaire');
  generateExerciceIntermediaire(worksheet, contexteMetier);
} else if (niveau === 'avance') {
  console.log('📋 [GENERATE-EXERCISE] Template avancé');
  generateExerciceAvance(worksheet, contexteMetier);
} else {
  generateExerciceDebutant(worksheet, contexteMetier);
}
    // Convertir le workbook en buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Retourner le fichier Excel
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Exercice_${niveau}_${contexteMetier}.xlsx"`
      }
    });

  } catch (error) {
    console.error('❌ [API] Erreur génération exercice:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de l\'exercice' },
      { status: 500 }
    );
  }
}

/**
 * EXERCICE DÉBUTANT
 */
function generateExerciceDebutant(worksheet, metier) {
  // Titre de l'exercice
  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = `📊 EXERCICE DÉBUTANT - ${metier.toUpperCase()}`;
  worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Instructions
  worksheet.mergeCells('A3:E3');
  worksheet.getCell('A3').value = '🎯 OBJECTIF : Créer un tableau de suivi et calculer des totaux';
  worksheet.getCell('A3').font = { bold: true, size: 12 };
  worksheet.getCell('A3').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE7E6E6' }
  };

  // Exercice selon le métier
  const exercices = {
    vente: {
      titre: 'Suivi des ventes hebdomadaires',
      colonnes: ['Jour', 'Produit', 'Quantité', 'Prix Unitaire', 'Total'],
      donnees: [
        ['Lundi', 'Produit A', 5, 100, '=C7*D7'],
        ['Mardi', 'Produit B', 3, 150, '=C8*D8'],
        ['Mercredi', 'Produit A', 8, 100, '=C9*D9'],
        ['Jeudi', 'Produit C', 2, 200, '=C10*D10'],
        ['Vendredi', 'Produit B', 6, 150, '=C11*D11']
      ],
      instructions: [
        '1. Les formules en colonne E sont déjà écrites (Quantité × Prix)',
        '2. En E12, calcule le TOTAL avec =SOMME(E7:E11)',
        '3. En C12, calcule le total des quantités vendues',
        '4. Mets en gras les totaux et ajoute des bordures'
      ]
    },
    comptabilité: {
      titre: 'Tableau de dépenses mensuelles',
      colonnes: ['Catégorie', 'Budget', 'Dépensé', 'Reste', 'Statut'],
      donnees: [
        ['Loyer', 1200, 1200, '=B7-C7', '=SI(D7>=0;"OK";"DÉPASSÉ")'],
        ['Électricité', 150, 132, '=B8-C8', '=SI(D8>=0;"OK";"DÉPASSÉ")'],
        ['Internet', 50, 45, '=B9-C9', '=SI(D9>=0;"OK";"DÉPASSÉ")'],
        ['Fournitures', 300, 345, '=B10-C10', '=SI(D10>=0;"OK";"DÉPASSÉ")'],
        ['Divers', 200, 180, '=B11-C11', '=SI(D11>=0;"OK";"DÉPASSÉ")']
      ],
      instructions: [
        '1. Les formules en colonnes D et E sont déjà écrites',
        '2. En B12, calcule le budget total',
        '3. En C12, calcule le total dépensé',
        '4. En D12, calcule le reste global (Budget - Dépensé)',
        '5. Applique une mise en forme conditionnelle : rouge si "DÉPASSÉ"'
      ]
    },
    rh: {
      titre: 'Calcul des heures de travail',
      colonnes: ['Employé', 'Heures Normales', 'Heures Sup', 'Total Heures', 'Taux Horaire'],
      donnees: [
        ['Alice', 35, 5, '=B7+C7', 15],
        ['Bob', 35, 3, '=B8+C8', 18],
        ['Charlie', 35, 8, '=B9+C9', 15],
        ['Diana', 35, 0, '=B10+C10', 20],
        ['Eve', 35, 4, '=B11+C11', 17]
      ],
      instructions: [
        '1. Les formules en colonne D sont déjà écrites',
        '2. En D12, calcule le total des heures travaillées',
        '3. En C12, calcule le total des heures supplémentaires',
        '4. Crée une colonne F "Salaire" avec =D×E (Total heures × Taux)',
        '5. Calcule le salaire total en F12'
      ]
    }
  };

  // Sélection de l'exercice selon le métier (ou défaut = vente)
  const exercice = exercices[metier] || exercices['vente'];

  // Titre de l'exercice
  worksheet.mergeCells('A5:E5');
  worksheet.getCell('A5').value = exercice.titre;
  worksheet.getCell('A5').font = { bold: true, size: 14 };
  worksheet.getCell('A5').alignment = { horizontal: 'center' };

  // En-têtes de colonnes
  exercice.colonnes.forEach((col, idx) => {
    const cell = worksheet.getCell(6, idx + 1);
    cell.value = col;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
    cell.alignment = { horizontal: 'center' };
  });

  // Données
  exercice.donnees.forEach((row, rowIdx) => {
    row.forEach((value, colIdx) => {
      const cell = worksheet.getCell(7 + rowIdx, colIdx + 1);
      
      // Si c'est une formule (commence par =)
      if (typeof value === 'string' && value.startsWith('=')) {
        cell.value = { formula: value.substring(1) }; // Enlève le = du début
      } else {
        cell.value = value;
      }
    });
  });

  // Ligne TOTAL
  worksheet.getCell('A12').value = 'TOTAL';
  worksheet.getCell('A12').font = { bold: true };
  worksheet.getCell('A12').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC000' }
  };

  // Instructions
  worksheet.mergeCells('A14:E14');
  worksheet.getCell('A14').value = '📝 INSTRUCTIONS :';
  worksheet.getCell('A14').font = { bold: true, size: 12 };

  exercice.instructions.forEach((instruction, idx) => {
    worksheet.mergeCells(`A${15 + idx}:E${15 + idx}`);
    worksheet.getCell(`A${15 + idx}`).value = instruction;
  });

  // Mise en forme globale
  worksheet.columns = [
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 }
  ];

  // Bordures
  for (let row = 6; row <= 12; row++) {
    for (let col = 1; col <= 5; col++) {
      const cell = worksheet.getCell(row, col);
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }
}

/**
 * EXERCICE INTERMÉDIAIRE (à implémenter plus tard)
 */
function generateExerciceIntermediaire(worksheet, metier) {
  worksheet.getCell('A1').value = 'Exercice intermédiaire - En construction';
  worksheet.getCell('A1').font = { bold: true, size: 16 };
}

/**
 * EXERCICE AVANCÉ (à implémenter plus tard)
 */
function generateExerciceAvance(worksheet, metier) {
    worksheet.getCell('A1').value = 'Exercice avancé - En construction';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
  }
  
  /**
   * GÉNÉRATION INTELLIGENTE D'EXERCICE VIA IA
   * Claude génère la structure exacte de l'exercice selon le contexte
   */
  async function generateExerciceIntelligent(worksheet, context, description, niveau, metier) {
    try {
      console.log('🤖 [AI-EXERCISE] Appel Claude pour générer exercice...');
      
      // Appel à Claude pour obtenir la structure de l'exercice
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `Génère la structure d'un exercice Excel pour cette demande :
  
  DEMANDE UTILISATEUR : "${context}"
  
  CONTEXTE :
  - Niveau : ${niveau}
  - Métier : ${metier}
  ${description ? `- Description exercice : ${description}` : ''}
  
  GÉNÈRE un exercice Excel au format JSON avec cette structure EXACTE :
  {
    "titre": "Titre court de l'exercice",
    "objectif": "Ce que l'utilisateur va apprendre",
    "colonnes": ["Colonne1", "Colonne2", ...],
    "donnees": [
      ["valeur1", "valeur2", ...],
      ...
    ],
    "formules": [
      {"cellule": "D2", "formule": "=B2*C2", "explication": "Calcule le total"},
      ...
    ],
    "instructions": [
      "Instruction 1",
      "Instruction 2",
      ...
    ]
  }
  
  IMPORTANT :
  - Adapte au niveau ${niveau}
  - Contexte métier ${metier}
  - ${niveau === 'debutant' ? 'Exercice SIMPLE avec formules basiques' : niveau === 'intermediaire' ? 'Formules avancées (RECHERCHEV, SI imbriqués)' : 'Exercice expert (TCD, Power Query concepts, formules complexes)'}
  - 5-10 lignes de données
  - 3-5 formules à compléter
  - Instructions claires et progressives
  
  Réponds UNIQUEMENT avec le JSON, rien d'autre.`
          }],
          system: `Tu es un expert en pédagogie Excel. Tu génères des exercices pratiques adaptés au niveau de l'apprenant.`
        })
      });
  
      const data = await response.json();
      const aiResponse = data.content[0].text;
      
      // Parser la réponse JSON
      let exerciceStructure;
      try {
        // Nettoyer la réponse (enlever markdown si présent)
        const jsonText = aiResponse.replace(/```json|```/g, '').trim();
        exerciceStructure = JSON.parse(jsonText);
        console.log('✅ [AI-EXERCISE] Structure générée:', exerciceStructure.titre);
      } catch (parseError) {
        console.error('❌ [AI-EXERCISE] Erreur parsing JSON:', parseError);
        // Fallback sur exercice basique
        generateExerciceFallback(worksheet, context, niveau);
        return;
      }
      
      // Construire l'exercice Excel à partir de la structure IA
      buildExerciceFromStructure(worksheet, exerciceStructure, niveau);
      
    } catch (error) {
      console.error('❌ [AI-EXERCISE] Erreur:', error);
      generateExerciceFallback(worksheet, context, niveau);
    }
  }
  
  /**
   * Construire l'exercice Excel depuis la structure IA
   */
  function buildExerciceFromStructure(worksheet, structure, niveau) {
    // Titre
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = `📊 ${structure.titre.toUpperCase()}`;
    worksheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;
    
    // Objectif
    worksheet.mergeCells('A3:E3');
    worksheet.getCell('A3').value = `🎯 OBJECTIF : ${structure.objectif}`;
    worksheet.getCell('A3').font = { bold: true, size: 12 };
    worksheet.getCell('A3').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
    
    // En-têtes de colonnes
    const startRow = 6;
    structure.colonnes.forEach((col, idx) => {
      const cell = worksheet.getCell(startRow, idx + 1);
      cell.value = col;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' }
      };
      cell.alignment = { horizontal: 'center' };
    });
    
    // Données
    structure.donnees.forEach((row, rowIdx) => {
      row.forEach((value, colIdx) => {
        worksheet.getCell(startRow + 1 + rowIdx, colIdx + 1).value = value;
      });
    });
    
    // Formules (si fournies)
    if (structure.formules && structure.formules.length > 0) {
      structure.formules.forEach(f => {
        const cell = worksheet.getCell(f.cellule);
        cell.value = { formula: f.formule };
        // Ajouter un commentaire avec l'explication
        if (f.explication) {
          cell.note = f.explication;
        }
      });
    }
    
    // Instructions
    const instructionStartRow = startRow + structure.donnees.length + 3;
    worksheet.mergeCells(`A${instructionStartRow}:E${instructionStartRow}`);
    worksheet.getCell(`A${instructionStartRow}`).value = '📝 INSTRUCTIONS :';
    worksheet.getCell(`A${instructionStartRow}`).font = { bold: true, size: 12 };
    
    structure.instructions.forEach((instruction, idx) => {
      worksheet.mergeCells(`A${instructionStartRow + 1 + idx}:E${instructionStartRow + 1 + idx}`);
      worksheet.getCell(`A${instructionStartRow + 1 + idx}`).value = instruction;
    });
    
    // Mise en forme
    worksheet.columns = structure.colonnes.map(() => ({ width: 15 }));
  }
  
  /**
   * Exercice fallback simple en cas d'erreur IA
   */
  function generateExerciceFallback(worksheet, context, niveau) {
    worksheet.getCell('A1').value = 'Exercice Excel';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    
    worksheet.getCell('A3').value = `Contexte : ${context}`;
    worksheet.getCell('A5').value = 'Exercice en cours de génération. Réessaie dans quelques instants.';
  }
