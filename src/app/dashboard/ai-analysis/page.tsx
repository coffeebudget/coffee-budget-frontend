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
  RefreshCw
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
      // Prepare data for AI analysis
      const analysisData = {
        budgetOverview: {
          averageMonthlyIncome: budgetSummary.averageMonthlyIncome,
          averageMonthlyExpenses: budgetSummary.averageMonthlyExpenses,
          averageMonthlyNetFlow: budgetSummary.averageMonthlyNetFlow,
          monthlyBudgetUtilization: budgetSummary.monthlyBudgetUtilization,
          primaryBudgetConfigured: budgetSummary.primaryBudgetConfigured
        },
        categories: categories.map(cat => ({
          name: cat.categoryName,
          budgetLevel: cat.budgetLevel,
          currentMonthSpent: cat.currentMonthSpent,
          monthlyBudget: cat.monthlyBudget,
          averageMonthlySpending: cat.averageMonthlySpending,
          budgetStatus: cat.budgetStatus,
          suggestedSavings: cat.suggestedSavings
        })),
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