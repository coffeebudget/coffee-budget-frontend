"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  ArrowLeft,
  Loader2,
  Lightbulb,
  AlertTriangle,
  Target,
  PiggyBank,
  RefreshCw,
  Eye,
  EyeOff,
  MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatCurrency } from "@/utils/format";
import {
  fetchExpensePlansWithStatus,
  fetchMonthlyDepositSummary,
  fetchCoverageSummary,
  fetchLongTermStatus,
} from "@/lib/api/expense-plans";
import {
  ExpensePlanWithStatus,
  MonthlyDepositSummary,
  CoverageSummaryResponse,
  LongTermStatusSummary,
  getFundingStatusLabel,
  getExpensePlanPriorityLabel,
  getExpensePlanPurposeLabel,
} from "@/types/expense-plan-types";

interface AIAnalysisResult {
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
}

interface ExpensePlanData {
  plansWithStatus: ExpensePlanWithStatus[];
  depositSummary: MonthlyDepositSummary | null;
  coverageSummary: CoverageSummaryResponse | null;
  longTermStatus: LongTermStatusSummary | null;
}

export default function AIAnalysisPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.user?.accessToken || "";

  const [planData, setPlanData] = useState<ExpensePlanData>({
    plansWithStatus: [],
    depositSummary: null,
    coverageSummary: null,
    longTermStatus: null,
  });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansWithStatus, depositSummary, coverageSummary, longTermStatus] = await Promise.all([
        fetchExpensePlansWithStatus(token),
        fetchMonthlyDepositSummary(token),
        fetchCoverageSummary(token, 'next_30_days'),
        fetchLongTermStatus(token),
      ]);
      setPlanData({
        plansWithStatus,
        depositSummary,
        coverageSummary,
        longTermStatus,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    if (!token || !planData.depositSummary || planData.plansWithStatus.length === 0) return;

    setAnalyzing(true);
    try {
      const { plansWithStatus, depositSummary, coverageSummary, longTermStatus } = planData;

      // Group plans by purpose
      const sinkingFunds = plansWithStatus.filter(p => p.purpose === 'sinking_fund');
      const spendingBudgets = plansWithStatus.filter(p => p.purpose === 'spending_budget');

      // Calculate totals
      const totalMonthlyContribution = plansWithStatus.reduce((sum, p) => sum + (p.monthlyContribution || 0), 0);
      const totalTargetAmount = plansWithStatus.reduce((sum, p) => sum + p.targetAmount, 0);

      // Count funding status
      const fundedCount = plansWithStatus.filter(p => p.fundingStatus === 'funded').length;
      const onTrackCount = plansWithStatus.filter(p => p.fundingStatus === 'on_track').length;
      const behindCount = plansWithStatus.filter(p => p.fundingStatus === 'behind').length;
      const almostReadyCount = plansWithStatus.filter(p => p.fundingStatus === 'almost_ready').length;

      // Prepare data for AI analysis
      const analysisData = {
        overview: {
          totalPlans: plansWithStatus.length,
          sinkingFundsCount: sinkingFunds.length,
          spendingBudgetsCount: spendingBudgets.length,
          totalMonthlyContribution,
          totalTargetAmount,
          fundedCount,
          onTrackCount,
          almostReadyCount,
          behindCount,
        },
        depositSummary: depositSummary ? {
          totalMonthlyDeposit: depositSummary.totalMonthlyDeposit,
          fullyFundedCount: depositSummary.fullyFundedCount,
          onTrackCount: depositSummary.onTrackCount,
          behindScheduleCount: depositSummary.behindScheduleCount,
        } : null,
        coverageStatus: coverageSummary ? {
          overallStatus: coverageSummary.overallStatus,
          totalShortfall: coverageSummary.totalShortfall,
          accountsWithShortfall: coverageSummary.accountsWithShortfall,
          plansAtRisk: coverageSummary.accounts.flatMap(a => a.plansAtRisk).map(p => ({
            name: p.name,
            amount: p.amount,
            daysUntilDue: p.daysUntilDue,
          })),
        } : null,
        longTermStatus: longTermStatus ? {
          totalSinkingFunds: longTermStatus.totalSinkingFunds,
          totalAmountNeeded: longTermStatus.totalAmountNeeded,
          plansNeedingAttention: longTermStatus.plansNeedingAttention.map(p => ({
            name: p.name,
            status: p.status,
            amountNeeded: p.amountNeeded,
            monthsUntilDue: p.monthsUntilDue,
            shortfallPerMonth: p.shortfallPerMonth,
          })),
        } : null,
        plans: plansWithStatus.map(plan => ({
          name: plan.name,
          purpose: plan.purpose,
          priority: plan.priority,
          planType: plan.planType,
          targetAmount: plan.targetAmount,
          monthlyContribution: plan.monthlyContribution,
          fundingStatus: plan.fundingStatus,
          progressPercent: plan.progressPercent,
          monthsUntilDue: plan.monthsUntilDue,
          amountNeeded: plan.amountNeeded,
          nextDueDate: plan.nextDueDate,
        })),
      };

      const response = await fetch('/api/ai-expense-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(analysisData)
      });

      if (!response.ok) {
        throw new Error('Failed to analyze expense plans');
      }

      const result = await response.json();
      setAnalysisResult(result);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Failed to run AI analysis:', error);
      toast.error('AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // formatCurrency imported at top of file

  const generatePromptPreview = () => {
    const { plansWithStatus, depositSummary, coverageSummary, longTermStatus } = planData;

    if (!depositSummary || plansWithStatus.length === 0) return null;

    const systemPrompt = "You are an expert financial advisor. Analyze expense plans and provide practical, personalized advice to optimize financial management. Always respond in English with a professional but friendly tone.";

    // Group plans by purpose
    const sinkingFunds = plansWithStatus.filter(p => p.purpose === 'sinking_fund');
    const spendingBudgets = plansWithStatus.filter(p => p.purpose === 'spending_budget');

    // Plans needing attention
    const plansBehind = plansWithStatus.filter(p => p.fundingStatus === 'behind');
    const plansAtRisk = coverageSummary?.accounts.flatMap(a => a.plansAtRisk) || [];

    const plansFormatted = plansWithStatus.map(plan => {
      const statusIcon = plan.fundingStatus === 'funded' ? '✅' :
                        plan.fundingStatus === 'on_track' ? '🟢' :
                        plan.fundingStatus === 'almost_ready' ? '🟡' : '🔴';
      return `- ${plan.name} (${getExpensePlanPurposeLabel(plan.purpose)}):
  * Target: €${plan.targetAmount} | Monthly contribution: €${plan.monthlyContribution}
  * Status: ${getFundingStatusLabel(plan.fundingStatus || 'on_track')} ${statusIcon}
  * Progress: ${plan.progressPercent}%
  * Priority: ${getExpensePlanPriorityLabel(plan.priority)}
  ${plan.nextDueDate ? `* Next due date: ${new Date(plan.nextDueDate).toLocaleDateString('en-GB')}` : ''}
  ${plan.amountNeeded ? `* Amount still needed: €${plan.amountNeeded}` : ''}`;
    }).join('\n\n');

    const dataPrompt = `
Analyze these expense plans and provide optimization advice:

EXPENSE PLANS OVERVIEW:
- Total active plans: ${plansWithStatus.length}
- Sinking Funds: ${sinkingFunds.length}
- Spending Budgets: ${spendingBudgets.length}
- Total monthly contribution: €${depositSummary.totalMonthlyDeposit}

FUNDING STATUS:
- Fully funded: ${depositSummary.fullyFundedCount}
- On track: ${depositSummary.onTrackCount}
- Behind: ${depositSummary.behindScheduleCount}

${coverageSummary ? `
ACCOUNT COVERAGE (next 30 days):
- Overall status: ${coverageSummary.overallStatus === 'all_covered' ? '✅ All covered' : '⚠️ Possible shortfall'}
${coverageSummary.totalShortfall > 0 ? `- Total shortfall: €${coverageSummary.totalShortfall}` : ''}
${plansAtRisk.length > 0 ? `- Plans at risk: ${plansAtRisk.map(p => p.name).join(', ')}` : ''}
` : ''}

${longTermStatus ? `
LONG-TERM STATUS:
- Total sinking funds: ${longTermStatus.totalSinkingFunds}
- Total amount needed: €${longTermStatus.totalAmountNeeded}
${longTermStatus.plansNeedingAttention.length > 0 ? `
PLANS NEEDING ATTENTION:
${longTermStatus.plansNeedingAttention.map(p => `- ${p.name}: ${p.status === 'behind' ? '🔴 Behind' : '🟡 Almost ready'}, short €${p.amountNeeded}, ${p.monthsUntilDue} months until due`).join('\n')}
` : ''}
` : ''}

PLAN DETAILS:
${plansFormatted}

${plansBehind.length > 0 ? `
PLANS BEHIND SCHEDULE:
${plansBehind.map(p => `- ${p.name}: ${p.progressPercent}% complete, short €${p.amountNeeded}`).join('\n')}
` : ''}

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

    return { systemPrompt, dataPrompt };
  };

  if (!session) {
    return <div>Please log in to access AI analysis.</div>;
  }

  const { plansWithStatus, depositSummary, coverageSummary, longTermStatus } = planData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
              Expense Plan Analysis
            </h1>
            <p className="text-gray-600 mt-1">
              Personalized advice to optimize your financial plans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Loading data...</span>
        </div>
      ) : (
        <>
          {/* Overview Summary */}
          {depositSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-blue-600" />
                  Expense Plans Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Monthly Contribution</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(depositSummary.totalMonthlyDeposit)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Funded / On Track</p>
                    <p className="text-2xl font-bold text-green-600">
                      {depositSummary.fullyFundedCount + depositSummary.onTrackCount}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Behind</p>
                    <p className="text-2xl font-bold text-red-600">
                      {depositSummary.behindScheduleCount}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Plans</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {depositSummary.planCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Prompt Preview Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  AI Prompt - Preview
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrompt(!showPrompt)}
                  disabled={!depositSummary || plansWithStatus.length === 0}
                >
                  {showPrompt ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide Prompt
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show Prompt
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showPrompt ? (
                (() => {
                  const promptData = generatePromptPreview();
                  return promptData ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2 text-gray-800">System Prompt:</h4>
                        <div className="p-3 bg-white rounded border">
                          <p className="text-sm font-mono text-gray-700">
                            {promptData.systemPrompt}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold mb-2 text-blue-800">Data Prompt (Data Sent to AI):</h4>
                        <div className="p-3 bg-white rounded border max-h-96 overflow-y-auto">
                          <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                            {promptData.dataPrompt}
                          </pre>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold mb-2 text-yellow-800">Privacy Notes:</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Financial data is sent to OpenAI for analysis</li>
                          <li>• Only aggregate expense plan information is shared</li>
                          <li>• No specific transaction details are shared</li>
                          <li>• Data is not permanently stored by the AI service</li>
                        </ul>
                      </div>
                    </div>
                  ) : null;
                })()
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-2">
                    View the prompt that will be sent to AI for your expense plan analysis.
                  </p>
                  <p className="text-sm text-gray-500">
                    This lets you see exactly what data is shared with the AI service.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Expense Plan Analysis
                </CardTitle>
                <Button
                  onClick={runAIAnalysis}
                  disabled={analyzing || !depositSummary || plansWithStatus.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze Plans
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analysisResult ? (
                <div className="space-y-6">
                  {/* Financial Health Score */}
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Financial Health Score</h3>
                    <div className={`text-4xl font-bold mb-2 ${
                      analysisResult.financialHealthScore >= 80 ? 'text-green-600' :
                      analysisResult.financialHealthScore >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {analysisResult.financialHealthScore}/100
                    </div>
                    <p className="text-gray-600">{analysisResult.analysis}</p>
                  </div>

                  {/* Plans Needing Attention */}
                  {analysisResult.plansNeedingAttention.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Plans Needing Attention
                      </h3>
                      <div className="space-y-3">
                        {analysisResult.plansNeedingAttention.map((plan, index) => (
                          <div key={index} className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-red-800">{plan.planName}</h4>
                            </div>
                            <p className="text-sm text-red-700 mb-2">
                              {plan.issue}
                            </p>
                            <ul className="text-sm text-red-600 space-y-1">
                              {plan.suggestions.map((suggestion, idx) => (
                                <li key={idx}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optimization Tips */}
                  {analysisResult.optimizationTips.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold mb-4">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Optimization Tips
                      </h3>
                      <div className="space-y-3">
                        {analysisResult.optimizationTips.map((tip, index) => (
                          <div key={index} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-yellow-800">{tip.area}</h4>
                              <span className="text-green-600 text-sm font-medium">
                                {tip.potentialImpact}
                              </span>
                            </div>
                            <p className="text-sm text-yellow-700">{tip.tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overall Recommendations */}
                  {analysisResult.overallRecommendations.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold mb-4">
                        <Target className="w-5 h-5 text-green-600" />
                        General Recommendations
                      </h3>
                      <div className="space-y-3">
                        {analysisResult.overallRecommendations.map((rec, index) => (
                          <div key={index} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                            <p className="text-sm text-green-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Ready for Analysis</h3>
                  <p className="text-gray-600 mb-4">
                    Click &quot;Analyze Plans&quot; to receive personalized advice on optimizing your expense plans.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plans Summary by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Summary by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Sinking Funds</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {plansWithStatus.filter(p => p.purpose === 'sinking_fund').length}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Spending Budgets</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {plansWithStatus.filter(p => p.purpose === 'spending_budget').length}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Funded</p>
                  <p className="text-2xl font-bold text-green-700">
                    {plansWithStatus.filter(p => p.fundingStatus === 'funded').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Status */}
          {coverageSummary && coverageSummary.overallStatus !== 'no_data' && (
            <Card>
              <CardHeader>
                <CardTitle>Coverage Status (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`p-4 rounded-lg ${
                  coverageSummary.overallStatus === 'all_covered'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {coverageSummary.overallStatus === 'all_covered' ? (
                      <>
                        <span className="text-green-600">✓</span>
                        <span className="font-medium text-green-800">All plans covered</span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-600">⚠</span>
                        <span className="font-medium text-red-800">
                          Shortfall of {formatCurrency(coverageSummary.totalShortfall)}
                        </span>
                      </>
                    )}
                  </div>
                  {coverageSummary.accounts.some(a => a.plansAtRisk.length > 0) && (
                    <div className="mt-2 text-sm text-red-700">
                      Plans at risk: {coverageSummary.accounts.flatMap(a => a.plansAtRisk).map(p => p.name).join(', ')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Long Term Status */}
          {longTermStatus && longTermStatus.plansNeedingAttention.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Plans Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {longTermStatus.plansNeedingAttention.map((plan) => (
                    <div key={plan.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{plan.icon || '📋'} {plan.name}</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {plan.status === 'behind' ? '🔴 Behind' : '🟡 Almost ready'}
                            {' - '}{plan.monthsUntilDue} months until due
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-orange-700">
                            {formatCurrency(plan.amountNeeded)} needed
                          </p>
                          <p className="text-sm text-gray-500">
                            +{formatCurrency(plan.shortfallPerMonth)}/mo
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
