import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

/**
 * API Route : Analyse INTELLIGENTE de fichiers Excel avec IA
 * POST /api/analyze-excel
 * 
 * Approche HYBRID :
 * - Niveau DÉBUTANT : Règles prédéfinies (rapide, pas de coût)
 * - Niveau INTERMÉDIAIRE : Hybrid (règles + IA si complexe)
 * - Niveau AVANCÉ : IA complète (analyse approfondie)
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const sessionId = formData.get('sessionId'); // Pour récupérer le profil utilisateur
    const userLevel = formData.get('userLevel') || 'intermediaire'; // Niveau de l'utilisateur
    const userMetier = formData.get('userMetier') || 'général';

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    console.log(`🔍 [ANALYZE-EXCEL] Analyse pour niveau: ${userLevel}, métier: ${userMetier}`);

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Lire le fichier Excel avec exceljs
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Analyser la première feuille
    const worksheet = workbook.worksheets[0];
    const sheetName = worksheet.name;

    // Analyse de base
    const analysis = {
      fileName: file.name,
      sheetName: sheetName,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount,
      hasFormulas: false,
      formulas: [],
      errors: [],
      data: []
    };

    // Parcourir les cellules pour extraire formules et erreurs
    worksheet.eachRow((row, rowNumber) => {
      const rowData = [];
      
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const cellAddress = `${String.fromCharCode(64 + colNumber)}${rowNumber}`;
        
        // Détection des formules
        if (cell.formula) {
          analysis.hasFormulas = true;
          analysis.formulas.push({
            cell: cellAddress,
            formula: cell.formula,
            value: cell.value,
            result: cell.result
          });
        }

        // Détection des erreurs Excel
        let hasError = false;
        let errorValue = null;

        if (cell.value && typeof cell.value === 'object' && cell.value.error) {
          hasError = true;
          errorValue = cell.value.error;
        }
        
        if (cell.result && typeof cell.result === 'object' && cell.result.error) {
          hasError = true;
          errorValue = cell.result.error;
        }

        if (typeof cell.value === 'string' && cell.value.startsWith('#')) {
          hasError = true;
          errorValue = cell.value;
        }

        if (hasError && errorValue) {
          // Extraire le contexte (valeurs des cellules référencées)
          const context = extractErrorContext(worksheet, cell.formula);
          
          analysis.errors.push({
            cell: cellAddress,
            error: errorValue,
            type: getErrorType(errorValue),
            formula: cell.formula || null,
            context: context
          });
        }

        // Extraire les 10 premières lignes de données
        if (rowNumber <= 10) {
          rowData.push({
            value: cell.value,
            result: cell.result,
            type: typeof cell.value,
            hasFormula: !!cell.formula,
            hasError: hasError
          });
        }
      });

      if (rowNumber <= 10) {
        analysis.data.push(rowData);
      }
    });

    console.log(`📊 [ANALYZE-EXCEL] ${analysis.errors.length} erreur(s) détectée(s)`);

    // ✨ ANALYSE INTELLIGENTE selon le niveau
    let report = '';
    
    if (analysis.errors.length === 0) {
      // Pas d'erreurs → Rapport simple
      report = generateSimpleReport(analysis, userLevel);
    } else {
      // Des erreurs détectées → Analyse selon niveau
      
      if (userLevel === 'debutant') {
        // DÉBUTANT : Règles prédéfinies (pas d'IA)
        console.log('🎯 [ANALYZE-EXCEL] Mode DÉBUTANT : Analyse par règles');
        report = await generateBeginnerAnalysis(analysis, userMetier);
        
      } else if (userLevel === 'intermediaire') {
        // INTERMÉDIAIRE : Hybrid (règles + IA si complexe)
        console.log('⚡ [ANALYZE-EXCEL] Mode INTERMÉDIAIRE : Analyse hybrid');
        const isComplex = analysis.errors.some(e => 
          e.formula && (e.formula.length > 50 || e.formula.includes('RECHERCHEV') || e.formula.includes('SI(SI('))
        );
        
        if (isComplex) {
          console.log('🤖 [ANALYZE-EXCEL] Erreurs complexes détectées → Analyse IA');
          report = await generateAIAnalysis(analysis, userLevel, userMetier);
        } else {
          console.log('📋 [ANALYZE-EXCEL] Erreurs simples → Analyse par règles');
          report = await generateIntermediateAnalysis(analysis, userMetier);
        }
        
      } else {
        // AVANCÉ/EXPERT : IA complète obligatoire
        console.log('🔥 [ANALYZE-EXCEL] Mode AVANCÉ : Analyse IA complète');
        report = await generateAIAnalysis(analysis, userLevel, userMetier);
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      report
    });

  } catch (error) {
    console.error('❌ [API] Erreur analyse Excel:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du fichier Excel' },
      { status: 500 }
    );
  }
}

/**
 * Extrait le contexte d'une erreur (valeurs des cellules référencées)
 */
function extractErrorContext(worksheet, formula) {
  if (!formula) return {};
  
  const context = {};
  
  // Regex pour capturer les références de cellules (A1, B2, etc.)
  const cellRegex = /\b[A-Z]+\d+\b/g;
  const matches = formula.match(cellRegex);
  
  if (matches) {
    const uniqueRefs = [...new Set(matches)];
    uniqueRefs.forEach(ref => {
      try {
        const cell = worksheet.getCell(ref);
        context[ref] = {
          value: cell.value,
          type: typeof cell.value,
          formula: cell.formula || null
        };
      } catch (e) {
        context[ref] = { value: 'INVALID_REF', type: 'error' };
      }
    });
  }
  
  return context;
}

/**
 * Identifier le type d'erreur Excel
 */
function getErrorType(errorCode) {
  const errorTypes = {
    '#DIV/0!': 'Division par zéro',
    '#N/A': 'Valeur non disponible',
    '#NAME?': 'Nom de fonction non reconnu',
    '#NULL!': 'Intersection de plages vide',
    '#NUM!': 'Valeur numérique invalide',
    '#REF!': 'Référence de cellule invalide',
    '#VALUE!': 'Type de valeur incorrect'
  };

  return errorTypes[errorCode] || 'Erreur inconnue';
}

/**
 * Rapport simple (pas d'erreurs)
 */
function generateSimpleReport(analysis, userLevel) {
  let report = `📊 **Analyse du fichier : ${analysis.fileName}**\n\n`;
  report += `✅ **Aucune erreur détectée - Fichier impeccable !**\n\n`;
  
  if (analysis.hasFormulas) {
    report += `**Formules détectées (${analysis.formulas.length}) :**\n`;
    analysis.formulas.slice(0, 5).forEach(f => {
      report += `- Cellule ${f.cell} : \`${f.formula}\`\n`;
    });
    if (analysis.formulas.length > 5) {
      report += `- ... et ${analysis.formulas.length - 5} autres formules\n`;
    }
    
    if (userLevel === 'avance') {
      report += `\n🏆 **Suggestions d'optimisation :**\n`;
      report += `- Veux-tu que j'analyse les performances de tes formules ?\n`;
      report += `- Je peux te suggérer des formules plus modernes (XLOOKUP, FILTER, etc.)\n`;
    }
  }
  
  return report;
}

/**
 * Analyse DÉBUTANT : Règles prédéfinies simples
 */
async function generateBeginnerAnalysis(analysis, metier) {
  let report = `📊 **Analyse de ton fichier : ${analysis.fileName}**\n\n`;
  report += `⚠️ **J'ai trouvé ${analysis.errors.length} erreur(s) - Pas de panique, on va les corriger ensemble ! 😊**\n\n`;
  
  analysis.errors.forEach((error, index) => {
    report += `**${index + 1}. Cellule ${error.cell}** : ${error.error}\n`;
    report += `   **Ce qui se passe :** ${error.type}\n\n`;
    
    // Analyse simple par type d'erreur
    if (error.error === '#DIV/0!') {
      const divisorInfo = findDivisor(error.formula, error.context);
      report += `   💡 **Pourquoi ?** Tu essaies de diviser${divisorInfo.explanation}.\n`;
      report += `   ✅ **Solution simple :** Remplis la cellule ${divisorInfo.divisor} avec un nombre (pas 0 !)\n\n`;
      
    } else if (error.error === '#NAME?') {
      report += `   💡 **Pourquoi ?** Excel ne reconnaît pas le nom d'une fonction.\n`;
      report += `   ✅ **Solution :** Vérifie l'orthographe (SOMME, pas SOM. MOYENNE, pas MOYENN)\n\n`;
      
    } else if (error.error === '#REF!') {
      report += `   💡 **Pourquoi ?** Ta formule fait référence à une cellule qui n'existe plus.\n`;
      report += `   ✅ **Solution :** As-tu supprimé des lignes ou colonnes ? Il faut recréer la formule.\n\n`;
      
    } else {
      report += `   💡 **Astuce :** Ce type d'erreur arrive souvent quand les données ne sont pas du bon type.\n\n`;
    }
    
    report += `---\n\n`;
  });
  
  report += `**🆘 BESOIN D'AIDE ?**\n`;
  report += `Dis-moi : "Aide-moi à corriger les erreurs" et je te guiderai pas à pas ! 😊\n`;
  
  return report;
}

/**
 * Analyse INTERMÉDIAIRE : Règles avec plus de détails
 */
async function generateIntermediateAnalysis(analysis, metier) {
  let report = `📊 **Analyse professionnelle : ${analysis.fileName}**\n\n`;
  report += `⚠️ **${analysis.errors.length} erreur(s) détectée(s)**\n\n`;
  
  analysis.errors.forEach((error, index) => {
    report += `**${index + 1}. Cellule ${error.cell}** - ${error.error}\n`;
    
    if (error.formula) {
      report += `   **Formule :** \`${error.formula}\`\n`;
    }
    
    // Contexte des cellules
    if (Object.keys(error.context).length > 0) {
      report += `   **Contexte :**\n`;
      Object.entries(error.context).forEach(([ref, data]) => {
        const val = data.value === null || data.value === '' ? '(vide)' : data.value;
        report += `      - ${ref} = ${val}\n`;
      });
    }
    
    report += `\n`;
    
    // Solutions selon le type
    if (error.error === '#DIV/0!') {
      const divisorInfo = findDivisor(error.formula, error.context);
      report += `   📖 **Diagnostic :** Division par zéro (${divisorInfo.divisor} = ${divisorInfo.value})\n\n`;
      report += `   ✅ **Solutions :**\n`;
      report += `   \`\`\`\n   =SIERREUR(${error.formula}; 0)\n   \`\`\`\n`;
      report += `   → Remplace l'erreur par 0 automatiquement\n\n`;
      
    } else if (error.error === '#NAME?') {
      report += `   📖 **Diagnostic :** Nom de fonction non reconnu\n\n`;
      report += `   💡 **Vérifie :** Les fonctions doivent être en FRANÇAIS dans Excel français\n`;
      report += `   Ex: SUM → SOMME, AVERAGE → MOYENNE, IF → SI\n\n`;
    }
    
    report += `---\n\n`;
  });
  
  report += `**💡 BESOIN D'AIDE AVANCÉE ?**\n`;
  report += `Dis-moi "Analyse approfondie" pour une analyse IA complète avec suggestions d'optimisation !\n`;
  
  return report;
}

/**
 * Analyse IA COMPLÈTE : Appel à Claude
 */
async function generateAIAnalysis(analysis, userLevel, userMetier) {
  console.log('🤖 [AI-ANALYSIS] Appel à Claude pour analyse experte...');
  
  try {
    // Préparer le contexte pour Claude
    const errorsContext = analysis.errors.map(e => ({
      cell: e.cell,
      error: e.error,
      errorType: e.type,
      formula: e.formula,
      context: e.context
    }));
    
    // Prompt système adapté au niveau
    const systemPrompt = `Tu es un EXPERT EXCEL avec 20+ ans d'expérience.

Analyse ces erreurs Excel pour un utilisateur de niveau ${userLevel} travaillant en ${userMetier}.

CONTEXTE FICHIER :
- Nom : ${analysis.fileName}
- Formules : ${analysis.formulas.length}
- Erreurs : ${analysis.errors.length}

${userLevel === 'debutant' ? `
TON TON (DÉBUTANT) :
- Langage ultra-simple, pas de jargon
- Analogies du quotidien
- Rassure systématiquement
- Décompose en micro-étapes
` : userLevel === 'intermediaire' ? `
TON TON (INTERMÉDIAIRE) :
- Vocabulaire technique OK mais expliqué
- Focus optimisation et bonnes pratiques
- Encourage l'autonomie
- Compare avec les bases qu'il connaît
` : `
TON TON (AVANCÉ/EXPERT) :
- Langage expert assumé
- Parle performance, scalabilité, architecture
- Challenge intellectuel
- Compare avec d'autres outils (Power Query, DAX, SQL)
`}

Pour chaque erreur, fournis :
1. Diagnostic précis avec valeurs exactes
2. Cause racine (pas juste le symptôme)
3. 2-3 solutions (du simple au pro)
4. Formules corrigées EXACTES
5. Conseil pro pour éviter ça à l'avenir

Adapte au contexte métier ${userMetier} quand pertinent.`;

    // Message avec les erreurs
    const userMessage = `Analyse ces ${analysis.errors.length} erreurs Excel :\n\n${JSON.stringify(errorsContext, null, 2)}`;
    
    // Appel à Claude
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
          content: userMessage
        }],
        system: systemPrompt
      })
    });

    const data = await response.json();
    
    if (data.content && data.content[0]) {
      const aiAnalysis = data.content[0].text;
      
      console.log('✅ [AI-ANALYSIS] Analyse IA reçue');
      
      // Construire le rapport final
      let report = `📊 **Analyse experte IA : ${analysis.fileName}**\n\n`;
      report += `⚠️ **${analysis.errors.length} erreur(s) analysée(s) par IA**\n\n`;
      report += `---\n\n`;
      report += aiAnalysis;
      report += `\n\n---\n\n`;
      report += `**🆘 BESOIN D'AIDE POUR APPLIQUER CES CORRECTIONS ?**\n`;
      report += `Dis-moi "Guide-moi pour corriger" et je te guiderai pas à pas ! 😊\n`;
      
      return report;
    } else {
      console.error('❌ [AI-ANALYSIS] Réponse IA invalide:', data);
      // Fallback sur analyse intermédiaire
      return await generateIntermediateAnalysis(analysis, userMetier);
    }
    
  } catch (error) {
    console.error('❌ [AI-ANALYSIS] Erreur appel Claude:', error);
    // Fallback sur analyse intermédiaire
    return await generateIntermediateAnalysis(analysis, userMetier);
  }
}

/**
 * Utilitaire : Trouver le diviseur dans une formule de division
 */
function findDivisor(formula, context) {
  if (!formula) return { divisor: '?', value: '?', explanation: ' par une valeur inconnue' };
  
  const divMatch = formula.match(/([A-Z]+\d+)\s*\/\s*([A-Z]+\d+)/i);
  
  if (divMatch && context[divMatch[2]]) {
    const divisor = divMatch[2];
    const divisorValue = context[divisor].value;
    const displayValue = divisorValue === null || divisorValue === '' ? 'vide' : divisorValue;
    
    return {
      divisor: divisor,
      value: displayValue,
      explanation: ` par ${displayValue} (cellule ${divisor})`
    };
  }
  
  return { divisor: '?', value: '?', explanation: ' par zéro' };
}