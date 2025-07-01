"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  TrendingUp, 
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
import { fetchBudgetCategories, fetchBudgetSummary } from "@/utils/api-client";
import { showErrorToast, showSuccessToast } from "@/utils/toast-utils";

interface CategorySpending {
  categoryId: number;
  categoryName: string;
  budgetLevel: 'primary' | 'secondary' | 'optional';
  currentMonthSpent: number;
  monthlyBudget: number | null;
  maxThreshold: number | null;
  warningThreshold: number | null;
  averageMonthlySpending: number;
  averageMonthlyIncome: number;
  averageMonthlyNetFlow: number;
  suggestedSavings: number;
  budgetStatus: 'under' | 'warning' | 'over' | 'no_budget';
  warningMessage?: string;
}

interface BudgetSummary {
  primaryBudgetConfigured: number;
  primaryCategoriesData: CategorySpending[];
  secondaryWarnings: CategorySpending[];
  allSecondaryCategories: CategorySpending[];
  optionalSuggestions: CategorySpending[];
  allOptionalCategories: CategorySpending[];
  monthlyBudgetUtilization: number;
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  averageMonthlyNetFlow: number;
}

interface AIAnalysisResult {
  analysis: string;
  overspendingCategories: Array<{
    category: string;
    currentSpent: number;
    budget: number;
    overspendingAmount: number;
    suggestions: string[];
  }>;
  optimizationTips: Array<{
    category: string;
    tip: string;
    potentialSavings: number;
  }>;
  overallRecommendations: string[];
  budgetHealthScore: number;
}

export default function AIAnalysisPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.user?.accessToken || "";

  const [categories, setCategories] = useState<CategorySpending[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [period, setPeriod] = useState("30"); // days
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, summaryData] = await Promise.all([
        fetchBudgetCategories(),
        fetchBudgetSummary()
      ]);
      setCategories(categoriesData);
      setBudgetSummary(summaryData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showErrorToast('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    if (!token || !budgetSummary || categories.length === 0) return;
    
    setAnalyzing(true);
    try {
      // Use the same correct logic as BudgetManagementCard
      const filterExpenseCategories = (cats: typeof categories) => 
        cats.filter(cat => (cat.averageMonthlyNetFlow || 0) <= 0);

      // Calculate budget and spending by level (same logic as BudgetManagementCard)
      const primaryCategories = filterExpenseCategories(categories.filter(cat => cat.budgetLevel === 'primary'));
      const secondaryCategories = filterExpenseCategories(categories.filter(cat => cat.budgetLevel === 'secondary'));
      const optionalCategories = filterExpenseCategories(categories.filter(cat => cat.budgetLevel === 'optional'));

      const primaryBudgetConfigured = primaryCategories.reduce((sum, cat) => sum + (cat.monthlyBudget || 0), 0);
      const secondaryBudgetConfigured = secondaryCategories.reduce((sum, cat) => sum + (cat.maxThreshold || cat.monthlyBudget || 0), 0);
      const optionalBudgetConfigured = optionalCategories.reduce((sum, cat) => sum + (cat.monthlyBudget || 0), 0);
      
      const totalConfiguredBudget = primaryBudgetConfigured + secondaryBudgetConfigured + optionalBudgetConfigured;

      // Use AVERAGE spending, not current month (aligned with BudgetManagementCard)
      const primaryCurrentSpent = primaryCategories.reduce((sum, cat) => sum + (cat.averageMonthlySpending || 0), 0);
      const secondaryCurrentSpent = secondaryCategories.reduce((sum, cat) => sum + (cat.averageMonthlySpending || 0), 0);
      const optionalCurrentSpent = optionalCategories.reduce((sum, cat) => sum + (cat.averageMonthlySpending || 0), 0);
      
      const totalCurrentSpent = primaryCurrentSpent + secondaryCurrentSpent + optionalCurrentSpent;
      const correctBudgetUtilization = totalConfiguredBudget > 0 ? (totalCurrentSpent / totalConfiguredBudget * 100) : 0;

      // Calculate time-based data
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysRemaining = lastDay.getDate() - now.getDate();
      const daysInMonth = lastDay.getDate();
      const daysElapsed = daysInMonth - daysRemaining;

              // Prepare enriched data for AI analysis
        const analysisData = {
          budgetOverview: {
            averageMonthlyIncome: budgetSummary.averageMonthlyIncome,
            averageMonthlyExpenses: budgetSummary.averageMonthlyExpenses,
            averageMonthlyNetFlow: budgetSummary.averageMonthlyNetFlow,
            monthlyBudgetUtilization: correctBudgetUtilization, // Use corrected value
            totalConfiguredBudget: totalConfiguredBudget,
            totalCurrentSpent: totalCurrentSpent,
            primaryBudgetConfigured: primaryBudgetConfigured,
            secondaryBudgetConfigured: secondaryBudgetConfigured,
            optionalBudgetConfigured: optionalBudgetConfigured,
            primaryCurrentSpent: primaryCurrentSpent,
            secondaryCurrentSpent: secondaryCurrentSpent,
            optionalCurrentSpent: optionalCurrentSpent,
            daysRemaining: daysRemaining,
            daysInMonth: daysInMonth
          },
        categories: categories
          .filter(cat => cat.monthlyBudget || cat.maxThreshold) // Solo categorie con budget
          .filter(cat => (cat.averageMonthlyNetFlow || 0) <= 0) // Solo categorie di spesa
          .map(cat => {
            const budgetAmount = cat.monthlyBudget || cat.maxThreshold || 0;
            const percentage = budgetAmount > 0 ? (cat.currentMonthSpent / budgetAmount) * 100 : 0;
            
            // Proiezione spesa
            const dailySpend = cat.currentMonthSpent / Math.max(1, daysElapsed);
            const projectedSpend = dailySpend * daysInMonth;
            const projectedPercentage = (projectedSpend / budgetAmount) * 100;
            
            // Rolling 12M
            const monthlyNetSpending = Math.abs(cat.averageMonthlyNetFlow || 0);
            const rolling12MSpent = monthlyNetSpending * 12;
            
            let rolling12MBudget = 0;
            if (cat.budgetLevel === 'primary') {
              rolling12MBudget = (cat.monthlyBudget || monthlyNetSpending) * 12;
            } else if (cat.budgetLevel === 'secondary') {
              rolling12MBudget = (cat.maxThreshold || cat.monthlyBudget || monthlyNetSpending * 1.2) * 12;
            } else if (cat.budgetLevel === 'optional') {
              rolling12MBudget = (cat.monthlyBudget || monthlyNetSpending * 1.5) * 12;
            }
            
            const rolling12MPercentage = rolling12MBudget > 0 ? (rolling12MSpent / rolling12MBudget) * 100 : 0;
            
            return {
              name: cat.categoryName,
              budgetLevel: cat.budgetLevel,
              currentMonthSpent: cat.currentMonthSpent,
              monthlyBudget: budgetAmount,
              percentage: Math.round(percentage * 10) / 10,
              budgetStatus: cat.budgetStatus,
              remaining: budgetAmount - cat.currentMonthSpent,
              projectedSpend: Math.round(projectedSpend * 100) / 100,
              projectedPercentage: Math.round(projectedPercentage * 10) / 10,
              rolling12MSpent: Math.round(rolling12MSpent),
              rolling12MBudget: Math.round(rolling12MBudget),
              rolling12MPercentage: Math.round(rolling12MPercentage * 10) / 10,
              averageMonthlySpending: Math.round(monthlyNetSpending),
              suggestedSavings: cat.suggestedSavings
            };
          })
          .sort((a, b) => b.percentage - a.percentage), // Ordina per criticità
        period: parseInt(period)
      };

      const response = await fetch('/api/ai-budget-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(analysisData)
      });

      if (!response.ok) {
        throw new Error('Failed to analyze budget');
      }

      const result = await response.json();
      setAnalysisResult(result);
      showSuccessToast('Analisi completata!');
    } catch (error) {
      console.error('Failed to run AI analysis:', error);
      showErrorToast('Errore nell\'analisi AI');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const generatePromptPreview = () => {
    if (!budgetSummary || categories.length === 0) return null;

    const systemPrompt = "Sei un consulente finanziario esperto. Analizza i dati di budget e fornisci consigli pratici e personalizzati per ottimizzare le spese. Rispondi sempre in italiano con un tono professionale ma amichevole.";

    // Use the same correct logic as BudgetManagementCard
    const filterExpenseCategories = (cats: typeof categories) => 
      cats.filter(cat => (cat.averageMonthlyNetFlow || 0) <= 0);

    // Calculate budget and spending by level (same logic as BudgetManagementCard)
    const primaryCategories = filterExpenseCategories(categories.filter(cat => cat.budgetLevel === 'primary'));
    const secondaryCategories = filterExpenseCategories(categories.filter(cat => cat.budgetLevel === 'secondary'));
    const optionalCategories = filterExpenseCategories(categories.filter(cat => cat.budgetLevel === 'optional'));

    const primaryBudgetConfigured = primaryCategories.reduce((sum, cat) => sum + (cat.monthlyBudget || 0), 0);
    const secondaryBudgetConfigured = secondaryCategories.reduce((sum, cat) => sum + (cat.maxThreshold || cat.monthlyBudget || 0), 0);
    const optionalBudgetConfigured = optionalCategories.reduce((sum, cat) => sum + (cat.monthlyBudget || 0), 0);
    
    const totalConfiguredBudget = primaryBudgetConfigured + secondaryBudgetConfigured + optionalBudgetConfigured;

    // Use AVERAGE spending, not current month (aligned with BudgetManagementCard)
    const primaryCurrentSpent = primaryCategories.reduce((sum, cat) => sum + (cat.averageMonthlySpending || 0), 0);
    const secondaryCurrentSpent = secondaryCategories.reduce((sum, cat) => sum + (cat.averageMonthlySpending || 0), 0);
    const optionalCurrentSpent = optionalCategories.reduce((sum, cat) => sum + (cat.averageMonthlySpending || 0), 0);
    
    const totalCurrentSpent = primaryCurrentSpent + secondaryCurrentSpent + optionalCurrentSpent;
    const correctBudgetUtilization = totalConfiguredBudget > 0 ? (totalCurrentSpent / totalConfiguredBudget * 100) : 0;

    // Calcolo dei dati dettagliati per ogni categoria (same logic as BudgetProgressRings)
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = lastDay.getDate() - now.getDate();
    const daysInMonth = lastDay.getDate();
    const daysElapsed = daysInMonth - daysRemaining;

    const enrichedCategoriesData = categories
      .filter(cat => cat.monthlyBudget || cat.maxThreshold) // Solo categorie con budget
      .filter(cat => (cat.averageMonthlyNetFlow || 0) <= 0) // Solo categorie di spesa
      .map(cat => {
        const budgetAmount = cat.monthlyBudget || cat.maxThreshold || 0;
        const percentage = budgetAmount > 0 ? (cat.currentMonthSpent / budgetAmount) * 100 : 0;
        
        // Proiezione spesa
        const dailySpend = cat.currentMonthSpent / Math.max(1, daysElapsed);
        const projectedSpend = dailySpend * daysInMonth;
        const projectedPercentage = (projectedSpend / budgetAmount) * 100;
        
        // Rolling 12M
        const monthlyNetSpending = Math.abs(cat.averageMonthlyNetFlow || 0);
        const rolling12MSpent = monthlyNetSpending * 12;
        
        let rolling12MBudget = 0;
        if (cat.budgetLevel === 'primary') {
          rolling12MBudget = (cat.monthlyBudget || monthlyNetSpending) * 12;
        } else if (cat.budgetLevel === 'secondary') {
          rolling12MBudget = (cat.maxThreshold || cat.monthlyBudget || monthlyNetSpending * 1.2) * 12;
        } else if (cat.budgetLevel === 'optional') {
          rolling12MBudget = (cat.monthlyBudget || monthlyNetSpending * 1.5) * 12;
        }
        
        const rolling12MPercentage = rolling12MBudget > 0 ? (rolling12MSpent / rolling12MBudget) * 100 : 0;
        
        return {
          name: cat.categoryName,
          level: cat.budgetLevel,
          currentSpent: cat.currentMonthSpent,
          budget: budgetAmount,
          percentage: Math.round(percentage * 10) / 10,
          status: cat.budgetStatus,
          remaining: budgetAmount - cat.currentMonthSpent,
          projectedSpend: Math.round(projectedSpend * 100) / 100,
          projectedPercentage: Math.round(projectedPercentage * 10) / 10,
          rolling12MSpent: Math.round(rolling12MSpent),
          rolling12MBudget: Math.round(rolling12MBudget),
          rolling12MPercentage: Math.round(rolling12MPercentage * 10) / 10,
          avgMonthlySpending: Math.round(monthlyNetSpending),
          daysRemaining
        };
      })
      .sort((a, b) => b.percentage - a.percentage); // Ordina per criticità

    const categoriesDataFormatted = enrichedCategoriesData.map(cat => {
      const statusIcon = cat.status === 'over' ? '🔴' : cat.status === 'warning' ? '🟡' : '🟢';
      return `- ${cat.name} (${cat.level}):
  * Mese corrente: €${cat.currentSpent} / €${cat.budget} (${cat.percentage}%) ${statusIcon}
  * Rimanente: €${cat.remaining}
  * Proiezione fine mese: €${cat.projectedSpend} (${cat.projectedPercentage}%)
  * Rolling 12M: €${cat.rolling12MSpent} / €${cat.rolling12MBudget} (${cat.rolling12MPercentage}%)
  * Media mensile: €${cat.avgMonthlySpending}`;
    }).join('\n\n');

    const dataPrompt = `
Analizza questo budget personale e fornisci consigli di ottimizzazione:

PANORAMICA FINANZIARIA:
- Entrata media mensile: €${budgetSummary.averageMonthlyIncome}
- Spesa media mensile: €${budgetSummary.averageMonthlyExpenses}
- Flusso netto mensile: €${budgetSummary.averageMonthlyNetFlow}
- Utilizzo budget corretto: ${Math.round(correctBudgetUtilization * 10) / 10}%
- Budget totale configurato: €${totalConfiguredBudget}
- Spesa media su categorie con budget: €${Math.round(totalCurrentSpent)}
- Giorni rimanenti nel mese: ${daysRemaining}

BREAKDOWN PER LIVELLO:
- Primary (€${primaryBudgetConfigured} budget): €${Math.round(primaryCurrentSpent)} spesa media
- Secondary (€${secondaryBudgetConfigured} budget): €${Math.round(secondaryCurrentSpent)} spesa media  
- Optional (€${optionalBudgetConfigured} budget): €${Math.round(optionalCurrentSpent)} spesa media

DETTAGLIO CATEGORIE CON BUDGET (ordinate per criticità):
${categoriesDataFormatted}

STATISTICHE RAPIDE:
- Categorie in sforamento: ${enrichedCategoriesData.filter(c => c.status === 'over').length}
- Categorie in warning: ${enrichedCategoriesData.filter(c => c.status === 'warning').length}
- Categorie sotto budget: ${enrichedCategoriesData.filter(c => c.status === 'under').length}

ANALISI ROLLING 12M:
- Budget 12M totale: €${enrichedCategoriesData.reduce((sum, c) => sum + c.rolling12MBudget, 0)}
- Spesa 12M proiettata: €${enrichedCategoriesData.reduce((sum, c) => sum + c.rolling12MSpent, 0)}

Per favore fornisci:
1. Un'analisi generale della situazione finanziaria considerando sia il mese corrente che la proiezione 12M
2. Consigli specifici per le categorie più critiche (in sforamento o con proiezioni negative)
3. Suggerimenti di ottimizzazione per categorie con potenziali risparmi
4. Raccomandazioni generali per migliorare la gestione del budget a breve e lungo termine

IMPORTANTE: Rispondi SOLO con un JSON valido nel seguente formato:
{
  "analysis": "Analisi generale della situazione finanziaria (2-3 frasi che considerino sia il mese corrente che la proiezione annuale)",
  "overspendingCategories": [
    {
      "category": "Nome categoria",
      "suggestions": ["suggerimento1", "suggerimento2"]
    }
  ],
  "optimizationTips": [
    {
      "category": "Nome categoria",
      "tip": "Consiglio specifico con dettagli sui potenziali risparmi",
      "potentialSavings": 50
    }
  ],
  "overallRecommendations": [
    "Raccomandazione generale 1",
    "Raccomandazione generale 2",
    "Raccomandazione generale 3"
  ]
}

Non usare code fences o testo aggiuntivo, solo JSON puro.
`;

    return { systemPrompt, dataPrompt };
  };

  if (!session) {
    return <div>Please log in to access AI analysis.</div>;
  }

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
            Indietro
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
              Analisi Budget Intelligente
            </h1>
            <p className="text-gray-600 mt-1">
              Consigli personalizzati per ottimizzare le tue spese
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
          <span className="ml-3 text-lg">Caricamento dati...</span>
        </div>
      ) : (
        <>
          {/* Budget Overview Summary */}
          {budgetSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-blue-600" />
                  Panoramica Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Entrata Media</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(budgetSummary.averageMonthlyIncome)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Spesa Media</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(budgetSummary.averageMonthlyExpenses)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Flusso Netto</p>
                    <p className={`text-2xl font-bold ${budgetSummary.averageMonthlyNetFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budgetSummary.averageMonthlyNetFlow)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Utilizzo Budget</p>
                    <p className={`text-2xl font-bold ${
                      budgetSummary.monthlyBudgetUtilization > 90 ? 'text-red-600' : 
                      budgetSummary.monthlyBudgetUtilization > 75 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {budgetSummary.monthlyBudgetUtilization}%
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
                  Prompt AI - Anteprima
                </CardTitle>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrompt(!showPrompt)}
                  disabled={!budgetSummary || categories.length === 0}
                >
                  {showPrompt ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Nascondi Prompt
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Mostra Prompt
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
                        <h4 className="font-semibold mb-2 text-gray-800">System Prompt (Istruzione del Sistema):</h4>
                        <div className="p-3 bg-white rounded border">
                          <p className="text-sm font-mono text-gray-700">
                            {promptData.systemPrompt}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold mb-2 text-blue-800">Data Prompt (Dati Inviati all'AI):</h4>
                        <div className="p-3 bg-white rounded border max-h-96 overflow-y-auto">
                          <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                            {promptData.dataPrompt}
                          </pre>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold mb-2 text-yellow-800">Note sulla Privacy:</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• I dati finanziari vengono inviati al servizio OpenAI per l'analisi</li>
                          <li>• Vengono condivise solo informazioni aggregate (categorie e importi)</li>
                          <li>• Non vengono condivisi dettagli specifici delle transazioni</li>
                          <li>• I dati non vengono memorizzati permanentemente dal servizio AI</li>
                        </ul>
                      </div>
                    </div>
                  ) : null;
                })()
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-2">
                    Visualizza il prompt che verrà inviato all'AI per l'analisi del tuo budget.
                  </p>
                  <p className="text-sm text-gray-500">
                    Questo ti permette di vedere esattamente quali dati vengono condivisi con il servizio AI.
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
                  Analisi AI delle Spese
                </CardTitle>
                <Button 
                  onClick={runAIAnalysis}
                  disabled={analyzing || !budgetSummary || categories.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Analizzando...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analizza Budget
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analysisResult ? (
                <div className="space-y-6">
                  {/* Budget Health Score */}
                  <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Punteggio Salute Budget</h3>
                    <div className={`text-4xl font-bold mb-2 ${
                      analysisResult.budgetHealthScore >= 80 ? 'text-green-600' :
                      analysisResult.budgetHealthScore >= 60 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {analysisResult.budgetHealthScore}/100
                    </div>
                    <p className="text-gray-600">{analysisResult.analysis}</p>
                  </div>

                  {/* Overspending Categories */}
                  {analysisResult.overspendingCategories.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Categorie con Spese Eccessive
                      </h3>
                      <div className="space-y-3">
                        {analysisResult.overspendingCategories.map((cat, index) => (
                          <div key={index} className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-red-800">{cat.category}</h4>
                              <span className="text-red-600 font-bold">
                                +{formatCurrency(cat.overspendingAmount)}
                              </span>
                            </div>
                            <p className="text-sm text-red-700 mb-2">
                              Speso: {formatCurrency(cat.currentSpent)} / Budget: {formatCurrency(cat.budget)}
                            </p>
                            <ul className="text-sm text-red-600 space-y-1">
                              {cat.suggestions.map((suggestion, idx) => (
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
                        Consigli di Ottimizzazione
                      </h3>
                      <div className="space-y-3">
                        {analysisResult.optimizationTips.map((tip, index) => (
                          <div key={index} className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-yellow-800">{tip.category}</h4>
                              <span className="text-green-600 font-bold">
                                Risparmio: {formatCurrency(tip.potentialSavings)}
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
                        Raccomandazioni Generali
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
                  <h3 className="text-lg font-medium mb-2">Pronto per l'Analisi</h3>
                  <p className="text-gray-600 mb-4">
                    Clicca "Analizza Budget" per ricevere consigli personalizzati sull'ottimizzazione delle tue spese.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Riepilogo Categorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">Categorie Primarie</p>
                  <p className="text-2xl font-bold text-red-700">
                    {categories.filter(c => c.budgetLevel === 'primary').length}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-600">Categorie Secondarie</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {categories.filter(c => c.budgetLevel === 'secondary').length}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Categorie Opzionali</p>
                  <p className="text-2xl font-bold text-green-700">
                    {categories.filter(c => c.budgetLevel === 'optional').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 