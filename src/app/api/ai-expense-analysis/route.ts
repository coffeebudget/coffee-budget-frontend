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
            content: 'You are an expert financial advisor. Analyze expense plans and provide practical, personalized advice to optimize financial management. Always respond in English with a professional but friendly tone.',
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
    const priorityLabel = plan.priority === 'essential' ? 'Essential' :
                         plan.priority === 'important' ? 'Important' : 'Discretionary';

    return `- ${plan.name} (${purposeLabel}):
  * Target: €${plan.targetAmount} | Monthly contribution: €${plan.monthlyContribution}
  * Status: ${statusIcon} (${plan.fundingStatus || 'n/a'})
  * Progress: ${plan.progressPercent}%
  * Priority: ${priorityLabel}
  ${plan.nextDueDate ? `* Next due date: ${plan.nextDueDate}` : ''}
  ${plan.amountNeeded ? `* Amount still needed: €${plan.amountNeeded}` : ''}
  ${plan.monthsUntilDue ? `* Months until due: ${plan.monthsUntilDue}` : ''}`;
  }).join('\n\n');

  // Format plans at risk
  const plansAtRiskFormatted = coverageStatus?.plansAtRisk?.length > 0
    ? coverageStatus.plansAtRisk.map((p: any) =>
        `- ${p.name}: €${p.amount}, ${p.daysUntilDue} days until due`
      ).join('\n')
    : 'No plans at risk';

  // Format plans needing attention
  const plansNeedingAttentionFormatted = longTermStatus?.plansNeedingAttention?.length > 0
    ? longTermStatus.plansNeedingAttention.map((p: any) =>
        `- ${p.name}: ${p.status === 'behind' ? '🔴 Behind' : '🟡 Almost ready'}, short €${p.amountNeeded}, ${p.monthsUntilDue} months, shortfall €${p.shortfallPerMonth}/mo`
      ).join('\n')
    : 'No plans need immediate attention';

  return `
Analyze these expense plans and provide optimization advice:

EXPENSE PLANS OVERVIEW:
- Total active plans: ${overview.totalPlans}
- Sinking Funds: ${overview.sinkingFundsCount}
- Spending Budgets: ${overview.spendingBudgetsCount}
- Total monthly contribution: €${overview.totalMonthlyContribution}
- Total target: €${overview.totalTargetAmount}

FUNDING STATUS:
- Fully funded: ${overview.fundedCount}
- Almost ready: ${overview.almostReadyCount}
- On track: ${overview.onTrackCount}
- Behind: ${overview.behindCount}

${depositSummary ? `
MONTHLY DEPOSIT SUMMARY:
- Total monthly deposit: €${depositSummary.totalMonthlyDeposit}
- Fully funded plans: ${depositSummary.fullyFundedCount}
- On track plans: ${depositSummary.onTrackCount}
- Behind schedule plans: ${depositSummary.behindScheduleCount}
` : ''}

${coverageStatus ? `
COVERAGE STATUS (next 30 days):
- Overall status: ${coverageStatus.overallStatus === 'all_covered' ? '✅ All covered' : '⚠️ Possible shortfall'}
${coverageStatus.totalShortfall > 0 ? `- Total shortfall: €${coverageStatus.totalShortfall}` : ''}
- Accounts with shortfall: ${coverageStatus.accountsWithShortfall}

PLANS AT RISK:
${plansAtRiskFormatted}
` : ''}

${longTermStatus ? `
LONG-TERM STATUS:
- Total sinking funds: ${longTermStatus.totalSinkingFunds}
- Total amount needed: €${longTermStatus.totalAmountNeeded}

PLANS NEEDING ATTENTION:
${plansNeedingAttentionFormatted}
` : ''}

PLAN DETAILS:
${plansFormatted}

Please provide:
1. A general analysis of the financial situation based on expense plans
2. Specific advice for plans that need attention (behind or at risk)
3. Suggestions to optimize monthly contributions
4. General recommendations to improve financial management

IMPORTANT: Respond ONLY with valid JSON in the following format:
{
  "analysis": "General analysis of the financial situation (2-3 sentences)",
  "plansNeedingAttention": [
    {
      "planName": "Plan name",
      "issue": "Description of the issue",
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "optimizationTips": [
    {
      "area": "Optimization area",
      "tip": "Specific advice",
      "potentialImpact": "Description of potential impact"
    }
  ],
  "overallRecommendations": [
    "General recommendation 1",
    "General recommendation 2",
    "General recommendation 3"
  ],
  "financialHealthScore": 75
}

Do not use code fences or additional text, only pure JSON.
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
      analysis: parsed.analysis || 'Analysis complete.',
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
      ? `Plan behind by €${p.amountNeeded}, ${p.monthsUntilDue} months until due`
      : `Plan almost ready but needs €${p.amountNeeded} more`,
    suggestions: [
      `Increase monthly contribution by €${p.shortfallPerMonth} to get back on track`,
      'Consider revising the target date if possible',
      'Consider reducing other discretionary plans to free up funds',
    ],
  })) || [];

  return {
    analysis: healthScore >= 70
      ? 'Your expense plans are generally in good shape. Keep monitoring progress and consider small optimizations.'
      : 'Some expense plans need attention. Review monthly contributions and consider reprioritizing.',
    plansNeedingAttention,
    optimizationTips: [
      {
        area: 'Monthly contributions',
        tip: 'Periodically review contributions and adjust them to your actual income',
        potentialImpact: 'Better alignment between savings and goals',
      },
      {
        area: 'Prioritization',
        tip: 'Focus on essential plans first, then discretionary ones',
        potentialImpact: 'Greater financial security on critical expenses',
      },
    ],
    overallRecommendations: [
      'Regularly monitor the status of your plans',
      'Set up automatic contributions when possible',
      'Review seasonal plans ahead of their due dates',
    ],
    financialHealthScore: healthScore,
  };
}
