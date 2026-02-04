import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysisData = await request.json();

    // Validate required data
    if (!analysisData.plans || analysisData.plans.length === 0) {
      return NextResponse.json(
        { error: 'No expense plans provided' },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Build the AI prompt
    const prompt = buildExpensePlanAnalysisPrompt(analysisData);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sei un consulente finanziario esperto. Analizza i piani di spesa (expense plans) e fornisci consigli pratici e personalizzati per ottimizzare la gestione finanziaria. Rispondi sempre in italiano con un tono professionale ma amichevole.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to analyze expense plans' },
        { status: response.status }
      );
    }

    const aiResponse = await response.json();
    const aiContent = aiResponse.choices[0]?.message?.content || '';

    // Parse AI response
    const result = parseExpensePlanAnalysisResponse(aiContent, analysisData);

    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Expense Analysis API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildExpensePlanAnalysisPrompt(data: any): string {
  const { overview, depositSummary, coverageStatus, longTermStatus, plans } = data;

  // Format plans details
  const plansFormatted = plans.map((plan: any) => {
    const statusIcon = plan.fundingStatus === 'funded' ? '✅' :
                      plan.fundingStatus === 'on_track' ? '🟢' :
                      plan.fundingStatus === 'almost_ready' ? '🟡' : '🔴';

    const purposeLabel = plan.purpose === 'sinking_fund' ? 'Sinking Fund' : 'Spending Budget';
    const priorityLabel = plan.priority === 'essential' ? 'Essenziale' :
                         plan.priority === 'important' ? 'Importante' : 'Discrezionale';

    return `- ${plan.name} (${purposeLabel}):
  * Target: €${plan.targetAmount} | Contributo mensile: €${plan.monthlyContribution}
  * Stato: ${statusIcon} (${plan.fundingStatus || 'n/d'})
  * Progresso: ${plan.progressPercent}%
  * Priorità: ${priorityLabel}
  ${plan.nextDueDate ? `* Prossima scadenza: ${plan.nextDueDate}` : ''}
  ${plan.amountNeeded ? `* Importo ancora necessario: €${plan.amountNeeded}` : ''}
  ${plan.monthsUntilDue ? `* Mesi alla scadenza: ${plan.monthsUntilDue}` : ''}`;
  }).join('\n\n');

  // Format plans at risk
  const plansAtRiskFormatted = coverageStatus?.plansAtRisk?.length > 0
    ? coverageStatus.plansAtRisk.map((p: any) =>
        `- ${p.name}: €${p.amount}, ${p.daysUntilDue} giorni alla scadenza`
      ).join('\n')
    : 'Nessun piano a rischio';

  // Format plans needing attention
  const plansNeedingAttentionFormatted = longTermStatus?.plansNeedingAttention?.length > 0
    ? longTermStatus.plansNeedingAttention.map((p: any) =>
        `- ${p.name}: ${p.status === 'behind' ? '🔴 In ritardo' : '🟡 Quasi pronto'}, mancano €${p.amountNeeded}, ${p.monthsUntilDue} mesi, shortfall €${p.shortfallPerMonth}/mese`
      ).join('\n')
    : 'Nessun piano richiede attenzione immediata';

  return `
Analizza questi piani di spesa (expense plans) e fornisci consigli di ottimizzazione:

PANORAMICA PIANI DI SPESA:
- Totale piani attivi: ${overview.totalPlans}
- Sinking Funds (risparmi periodici): ${overview.sinkingFundsCount}
- Spending Budgets (budget di spesa): ${overview.spendingBudgetsCount}
- Contributo mensile totale: €${overview.totalMonthlyContribution}
- Target totale: €${overview.totalTargetAmount}

STATO DEI FONDI:
- Completamente finanziati: ${overview.fundedCount}
- Quasi pronti: ${overview.almostReadyCount}
- In linea con i tempi: ${overview.onTrackCount}
- In ritardo: ${overview.behindCount}

${depositSummary ? `
RIEPILOGO DEPOSITI MENSILI:
- Deposito mensile totale: €${depositSummary.totalMonthlyDeposit}
- Piani completamente finanziati: ${depositSummary.fullyFundedCount}
- Piani in linea: ${depositSummary.onTrackCount}
- Piani in ritardo: ${depositSummary.behindScheduleCount}
` : ''}

${coverageStatus ? `
STATO COPERTURA (prossimi 30 giorni):
- Stato generale: ${coverageStatus.overallStatus === 'all_covered' ? '✅ Tutto coperto' : '⚠️ Possibile shortfall'}
${coverageStatus.totalShortfall > 0 ? `- Shortfall totale: €${coverageStatus.totalShortfall}` : ''}
- Conti con shortfall: ${coverageStatus.accountsWithShortfall}

PIANI A RISCHIO:
${plansAtRiskFormatted}
` : ''}

${longTermStatus ? `
STATO LUNGO TERMINE:
- Sinking funds totali: ${longTermStatus.totalSinkingFunds}
- Importo totale necessario: €${longTermStatus.totalAmountNeeded}

PIANI CHE RICHIEDONO ATTENZIONE:
${plansNeedingAttentionFormatted}
` : ''}

DETTAGLIO PIANI:
${plansFormatted}

Per favore fornisci:
1. Un'analisi generale dello stato finanziario basata sui piani di spesa
2. Consigli specifici per i piani che richiedono attenzione (in ritardo o a rischio)
3. Suggerimenti per ottimizzare i contributi mensili
4. Raccomandazioni generali per migliorare la gestione finanziaria

IMPORTANTE: Rispondi SOLO con un JSON valido nel seguente formato:
{
  "analysis": "Analisi generale della situazione finanziaria (2-3 frasi)",
  "plansNeedingAttention": [
    {
      "planName": "Nome piano",
      "issue": "Descrizione del problema",
      "suggestions": ["suggerimento1", "suggerimento2"]
    }
  ],
  "optimizationTips": [
    {
      "area": "Area di ottimizzazione",
      "tip": "Consiglio specifico",
      "potentialImpact": "Descrizione dell'impatto potenziale"
    }
  ],
  "overallRecommendations": [
    "Raccomandazione generale 1",
    "Raccomandazione generale 2",
    "Raccomandazione generale 3"
  ],
  "financialHealthScore": 75
}

Non usare code fences o testo aggiuntivo, solo JSON puro.
`;
}

function parseExpensePlanAnalysisResponse(response: string, data: any): {
  analysis: string;
  plansNeedingAttention: Array<{
    planName: string;
    issue: string;
    suggestions: string[];
  }>;
  optimizationTips: Array<{
    area: string;
    tip: string;
    potentialImpact: string;
  }>;
  overallRecommendations: string[];
  financialHealthScore: number;
} {
  try {
    let cleanedResponse = response.trim();

    // Remove code fences if present
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanedResponse);

    // Calculate fallback health score if not provided
    const healthScore = parsed.financialHealthScore ?? calculateHealthScore(data);

    return {
      analysis: parsed.analysis || 'Analisi completata.',
      plansNeedingAttention: Array.isArray(parsed.plansNeedingAttention)
        ? parsed.plansNeedingAttention
        : [],
      optimizationTips: Array.isArray(parsed.optimizationTips)
        ? parsed.optimizationTips
        : [],
      overallRecommendations: Array.isArray(parsed.overallRecommendations)
        ? parsed.overallRecommendations
        : [],
      financialHealthScore: healthScore,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);

    // Return fallback analysis
    return getFallbackAnalysis(data);
  }
}

function calculateHealthScore(data: any): number {
  const { overview, depositSummary } = data;
  let score = 100;

  // Deduct for plans behind schedule
  const behindRatio = overview.behindCount / Math.max(1, overview.totalPlans);
  if (behindRatio > 0.5) {
    score -= 30;
  } else if (behindRatio > 0.3) {
    score -= 20;
  } else if (behindRatio > 0.1) {
    score -= 10;
  }

  // Bonus for funded plans
  const fundedRatio = overview.fundedCount / Math.max(1, overview.totalPlans);
  if (fundedRatio > 0.5) {
    score += 10;
  }

  // Deduct for coverage issues
  if (data.coverageStatus?.overallStatus === 'has_shortfall') {
    score -= 15;
  }

  return Math.max(20, Math.min(100, score));
}

function getFallbackAnalysis(data: any): {
  analysis: string;
  plansNeedingAttention: Array<{
    planName: string;
    issue: string;
    suggestions: string[];
  }>;
  optimizationTips: Array<{
    area: string;
    tip: string;
    potentialImpact: string;
  }>;
  overallRecommendations: string[];
  financialHealthScore: number;
} {
  const healthScore = calculateHealthScore(data);
  const { overview, longTermStatus } = data;

  // Build plans needing attention from longTermStatus
  const plansNeedingAttention = longTermStatus?.plansNeedingAttention?.map((p: any) => ({
    planName: p.name,
    issue: p.status === 'behind'
      ? `Piano in ritardo di €${p.amountNeeded}, ${p.monthsUntilDue} mesi alla scadenza`
      : `Piano quasi pronto ma necessita di €${p.amountNeeded} aggiuntivi`,
    suggestions: [
      `Aumenta il contributo mensile di €${p.shortfallPerMonth} per rimetterti in linea`,
      'Considera di rivedere la data obiettivo se possibile',
      'Valuta di ridurre altri piani discrezionali per liberare fondi',
    ],
  })) || [];

  return {
    analysis: healthScore >= 70
      ? 'I tuoi piani di spesa sono generalmente in buone condizioni. Continua a monitorare i progressi e considera piccole ottimizzazioni.'
      : 'Alcuni piani di spesa richiedono attenzione. Rivedi i contributi mensili e considera di riorganizzare le priorità.',
    plansNeedingAttention,
    optimizationTips: [
      {
        area: 'Contributi mensili',
        tip: 'Rivedi periodicamente i contributi e adattali alle tue entrate effettive',
        potentialImpact: 'Migliore allineamento tra risparmi e obiettivi',
      },
      {
        area: 'Prioritizzazione',
        tip: 'Concentrati prima sui piani essenziali, poi su quelli discrezionali',
        potentialImpact: 'Maggiore sicurezza finanziaria sulle spese critiche',
      },
    ],
    overallRecommendations: [
      'Monitora regolarmente lo stato dei tuoi piani',
      'Imposta contributi automatici quando possibile',
      'Rivedi i piani stagionali in anticipo rispetto alle scadenze',
    ],
    financialHealthScore: healthScore,
  };
}
