"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { fetchBudgetSummary } from '@/utils/api-client';
import { 
  TrendingUp, 
  AlertTriangle, 
  PiggyBank, 
  Target,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

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
  primaryBudgetConfigured: number; // Somma dei monthlyBudget delle categorie primary
  primaryCategoriesData: CategorySpending[];
  secondaryWarnings: CategorySpending[]; // Solo categorie con problemi
  allSecondaryCategories: CategorySpending[]; // Tutte le categorie secondary
  optionalSuggestions: CategorySpending[]; // Top suggestions (backwards compatibility)
  allOptionalCategories: CategorySpending[]; // Tutte le categorie optional
  monthlyBudgetUtilization: number;
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  averageMonthlyNetFlow: number;
}

export default function BudgetManagementCard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBudgetSummary = async () => {
    if (!session?.user?.accessToken) return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchBudgetSummary();
      setBudgetSummary(data);
    } catch (err) {
      console.error('Error fetching budget summary:', err);
      setError('Failed to load budget summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetSummary();
  }, [session]);

  const handleNavigateToBudget = () => {
    router.push('/budget-management');
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-6 rounded-xl shadow-lg border border-emerald-200">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="ml-2 text-emerald-700">Loading budget data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-lg border border-red-200">
        <div className="flex items-center justify-center h-32">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <span className="ml-2 text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!budgetSummary) {
    return null;
  }

  const {
    primaryBudgetConfigured,
    primaryCategoriesData,
    secondaryWarnings,
    allSecondaryCategories,
    optionalSuggestions,
    allOptionalCategories,
    monthlyBudgetUtilization,
    averageMonthlyIncome,
    averageMonthlyExpenses,
    averageMonthlyNetFlow
  } = budgetSummary;

  // 🛡️ Protezioni per valori undefined
  const safePrimaryBudgetConfigured = primaryBudgetConfigured || 0;

  const urgentWarnings = (secondaryWarnings || []).filter(c => c.budgetStatus === 'over').length;
  const totalWarnings = (secondaryWarnings || []).length;

  // 🎯 Calcola i budget totali per livello (solo categorie di spesa, escludendo entrate)
  const calculateBudgetsByLevel = () => {
    // 🔧 FILTRO: Escludi categorie che generano entrate (averageMonthlyNetFlow > 0)
    const filterExpenseCategories = (categories: CategorySpending[]) => 
      categories.filter(cat => (cat.averageMonthlyNetFlow || 0) <= 0);
    
    // Primary: Calcola spesa storica vs budget configurato dall'utente
    const primaryExpenseCategories = filterExpenseCategories(primaryCategoriesData || []);
    
    // Spesa media storica (solo categorie di spesa)
    const primaryAutoCalculated = primaryExpenseCategories.reduce((sum, cat) => {
      return sum + (cat.averageMonthlySpending || 0); // Spesa media storica
    }, 0);
    
    // Budget configurato dall'utente (usa il valore dal backend)
    const primaryBudgetConfiguredLocal = safePrimaryBudgetConfigured;
    
    // Secondary: Calcola sia spesa media che budget configurato
    const secondaryExpenseCategories = filterExpenseCategories(allSecondaryCategories || []);
    const secondaryAutoCalculated = secondaryExpenseCategories.reduce((sum, cat) => {
      return sum + (cat.averageMonthlySpending || 0); // Spesa media storica
    }, 0);
    const secondaryBudgetConfigured = secondaryExpenseCategories.reduce((sum, cat) => {
      // Per le categorie secondary, usa maxThreshold se disponibile, altrimenti monthlyBudget
      const budget = cat.maxThreshold || cat.monthlyBudget || 0;
      return sum + (Number(budget) || 0);
    }, 0);
    
    // Optional: Calcola sia spesa media che budget configurato
    const optionalExpenseCategories = filterExpenseCategories(allOptionalCategories || []);
    const optionalAutoCalculated = optionalExpenseCategories.reduce((sum, cat) => {
      return sum + (cat.averageMonthlySpending || 0); // Spesa media storica
    }, 0);
    const optionalBudgetConfigured = optionalExpenseCategories.reduce((sum, cat) => {
      return sum + (cat.monthlyBudget || 0); // Budget impostato dall'utente
    }, 0);
    
    return {
      // Primary
      primaryAutoCalculated: Number(primaryAutoCalculated) || 0,
      primaryBudgetConfigured: Number(primaryBudgetConfiguredLocal) || 0,
      
      // Secondary
      secondaryAutoCalculated: Number(secondaryAutoCalculated) || 0,
      secondaryBudgetConfigured: Number(secondaryBudgetConfigured) || 0,
      
      // Optional
      optionalAutoCalculated: Number(optionalAutoCalculated) || 0,
      optionalBudgetConfigured: Number(optionalBudgetConfigured) || 0,
      
      // Contatori per le categorie filtrate
      primaryExpenseCount: primaryExpenseCategories.length,
      secondaryExpenseCount: secondaryExpenseCategories.length,
      optionalExpenseCount: optionalExpenseCategories.length
    };
  };

  const { 
    primaryAutoCalculated,
    primaryBudgetConfigured: primaryBudgetConfiguredCalculated,
    secondaryAutoCalculated,
    secondaryBudgetConfigured,
    optionalAutoCalculated,
    optionalBudgetConfigured,
    primaryExpenseCount,
    secondaryExpenseCount,
    optionalExpenseCount
  } = calculateBudgetsByLevel();

  // 🔧 FIX: Calcola utilizzo budget allineato con i 3 box mostrati
  const calculateAlignedBudgetUtilization = () => {
    // Budget totale = ESATTAMENTE quello mostrato nei 3 box
    const totalConfiguredBudget = safePrimaryBudgetConfigured + secondaryBudgetConfigured + optionalBudgetConfigured;
    
    // Spesa totale = spesa reale delle stesse categorie che contribuiscono ai budget
    const filterExpenseCategories = (categories: CategorySpending[]) => 
      categories.filter(cat => (cat.averageMonthlyNetFlow || 0) <= 0);
    
    // Primary: spesa MEDIA (stesso valore mostrato nei box "🤖 Spesa media")
    const primaryExpenseCategories = filterExpenseCategories(primaryCategoriesData || []);
    const primaryCurrentSpent = primaryExpenseCategories.reduce((sum, cat) => {
      return sum + (cat.averageMonthlySpending || 0); // USARE SPESA MEDIA, non corrente
    }, 0);
    
    // Secondary: spesa MEDIA (stesso valore mostrato nei box "🤖 Spesa media")
    const secondaryExpenseCategories = filterExpenseCategories(allSecondaryCategories || []);
    const secondaryCurrentSpent = secondaryExpenseCategories.reduce((sum, cat) => {
      return sum + (cat.averageMonthlySpending || 0); // USARE SPESA MEDIA, non corrente
    }, 0);
    
    // Optional: spesa MEDIA (stesso valore mostrato nei box "🤖 Spesa media")
    const optionalExpenseCategories = filterExpenseCategories(allOptionalCategories || []);
    const optionalCurrentSpent = optionalExpenseCategories.reduce((sum, cat) => {
      return sum + (cat.averageMonthlySpending || 0); // USARE SPESA MEDIA, non corrente
    }, 0);
    
    const totalCurrentSpent = primaryCurrentSpent + secondaryCurrentSpent + optionalCurrentSpent;
    const utilization = totalConfiguredBudget > 0 ? (totalCurrentSpent / totalConfiguredBudget) * 100 : 0;
    
    return {
      utilization: Math.round(utilization * 10) / 10, // 1 decimale
      totalConfiguredBudget,
      totalCurrentSpent,
      primaryCurrentSpent,
      secondaryCurrentSpent,
      optionalCurrentSpent,
      hasAnyBudget: totalConfiguredBudget > 0
    };
  };

  const alignedBudgetCalc = calculateAlignedBudgetUtilization();
  
  // Usa il calcolo allineato con i box mostrati
  const safeMonthlyBudgetUtilization = alignedBudgetCalc.hasAnyBudget ? 
    alignedBudgetCalc.utilization : 
    (Number(monthlyBudgetUtilization) || 0);
    




  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-xl mb-8 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-blue-900">
              Budget Intelligente
            </h3>
            <p className="text-blue-700 text-sm">
              Gestione avanzata del budget
            </p>
          </div>
        </div>
        <button
          onClick={handleNavigateToBudget}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
        >
          Gestisci Budget
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* Financial Overview - Top Row (identico al Budget Management) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Entrata Media Mensile</div>
          <div className="text-2xl font-bold text-green-700">
            €{averageMonthlyIncome.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Ultimi 12 mesi</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border-l-4 border-red-500">
          <div className="text-sm text-gray-600 mb-1">Spesa Media Mensile</div>
          <div className="text-2xl font-bold text-red-700">
            €{averageMonthlyExpenses.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Ultimi 12 mesi</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Flusso Netto Mensile</div>
          <div className={`text-2xl font-bold ${averageMonthlyNetFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            €{averageMonthlyNetFlow.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Entrate - Uscite</div>
        </div>
      </div>

      {/* Strategia Budget Intelligente - 3 Box per Livello */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Primary: Accantonamento Automatico */}
        <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
          <div className="flex items-center mb-3">
            <PiggyBank className="w-6 h-6 text-red-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-700">Accantonamento</div>
              <div className="text-xs text-red-600">Categorie Primarie</div>
            </div>
          </div>
          
          {/* Valore Auto-calcolato */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">🤖 Spesa media:</span>
              <span className="text-lg font-bold text-red-700">€{primaryAutoCalculated.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-500">Da storico transazioni</div>
          </div>
          
          {/* Valore Configurato */}
          <div className="mb-3 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">⚙️ Budget configurato:</span>
              <span className={`text-lg font-bold ${
                safePrimaryBudgetConfigured > 0 ? 'text-blue-700' : 'text-gray-400'
              }`}>
                €{safePrimaryBudgetConfigured.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {safePrimaryBudgetConfigured > 0 ? 'Impostato dall\'utente' : 'Non configurato'}
            </div>
          </div>
          
          <div className="text-xs text-red-600">
            📊 {primaryExpenseCount} categorie essenziali (solo spese)
          </div>
        </div>

        {/* Secondary: Budget Controllabile */}
        <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
          <div className="flex items-center mb-3">
            <Target className="w-6 h-6 text-yellow-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-700">Budget Controllabile</div>
              <div className="text-xs text-yellow-600">Categorie Secondarie</div>
            </div>
          </div>
          
          {/* Valore Auto-calcolato */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">🤖 Spesa media:</span>
              <span className="text-lg font-bold text-yellow-700">€{secondaryAutoCalculated.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-500">Da storico transazioni</div>
          </div>
          
          {/* Valore Configurato */}
          <div className="mb-3 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">⚙️ Budget configurato:</span>
              <span className={`text-lg font-bold ${
                secondaryBudgetConfigured > 0 ? 'text-blue-700' : 'text-gray-400'
              }`}>
                €{secondaryBudgetConfigured.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {secondaryBudgetConfigured > 0 ? 'Limite impostato' : 'Non configurato'}
            </div>
          </div>
          
          <div className="text-xs text-yellow-600">
            {urgentWarnings > 0 ? (
              <>⚠️ {urgentWarnings} categorie oltre budget</>
            ) : (
              <>✅ {secondaryExpenseCount} categorie monitorate (solo spese)</>
            )}
          </div>
        </div>

        {/* Optional: Budget Discrezionale */}
        <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
          <div className="flex items-center mb-3">
            <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
            <div>
              <div className="text-sm font-medium text-gray-700">Budget Discrezionale</div>
              <div className="text-xs text-green-600">Categorie Opzionali</div>
            </div>
          </div>
          
          {/* Valore Auto-calcolato */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">🤖 Spesa media:</span>
              <span className="text-lg font-bold text-green-700">€{optionalAutoCalculated.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-500">Da storico transazioni</div>
          </div>
          
          {/* Valore Configurato */}
          <div className="mb-3 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">⚙️ Budget configurato:</span>
              <span className={`text-lg font-bold ${
                optionalBudgetConfigured > 0 ? 'text-blue-700' : 'text-gray-400'
              }`}>
                €{optionalBudgetConfigured.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {optionalBudgetConfigured > 0 ? 'Limite volontario' : 'Non configurato'}
            </div>
          </div>
          
          <div className="text-xs text-green-600">
            💸 {optionalExpenseCount} categorie opzionali (solo spese)
          </div>
        </div>
      </div>

      {/* Budget Utilization Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">
            Utilizzo Budget vs Spesa Media
            <div className="text-xs text-gray-500">
              €{alignedBudgetCalc.totalCurrentSpent?.toLocaleString()} spesa media / €{alignedBudgetCalc.totalConfiguredBudget?.toLocaleString()} budget
            </div>
          </div>
          <div className={`text-sm font-bold ${
            safeMonthlyBudgetUtilization > 90 ? 'text-red-600' : 
            safeMonthlyBudgetUtilization > 75 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {safeMonthlyBudgetUtilization.toFixed(1)}%
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              safeMonthlyBudgetUtilization > 90 ? 'bg-red-500' : 
              safeMonthlyBudgetUtilization > 75 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(safeMonthlyBudgetUtilization, 100)}%` }}
          ></div>
        </div>
      </div>



      {/* Quick Insights */}
      <div className="space-y-3">
        {urgentWarnings > 0 && (
          <div className="flex items-center p-3 bg-red-100 rounded-lg border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div className="text-sm">
              <span className="font-semibold text-red-800">
                {urgentWarnings} categorie hanno superato il budget!
              </span>
              <p className="text-red-600">Rivedi le tue spese secondarie.</p>
            </div>
          </div>
        )}

        {primaryAutoCalculated > 0 && (
          <div className="flex items-center p-3 bg-emerald-100 rounded-lg border border-emerald-200">
            <PiggyBank className="w-5 h-5 text-emerald-600 mr-3" />
            <div className="text-sm">
              <span className="font-semibold text-emerald-800">
                Accantona €{primaryAutoCalculated.toFixed(2)} questo mese
              </span>
              <p className="text-emerald-600">basato sulla spesa media delle categorie essenziali.</p>
            </div>
          </div>
        )}

        {safeMonthlyBudgetUtilization > 85 && (
          <div className="flex items-center p-3 bg-yellow-100 rounded-lg border border-yellow-200">
            <TrendingUp className="w-5 h-5 text-yellow-600 mr-3" />
            <div className="text-sm">
              <span className="font-semibold text-yellow-800">
                Budget utilizzato al {safeMonthlyBudgetUtilization.toFixed(1)}%
              </span>
              <p className="text-yellow-600">Monitora attentamente le prossime spese.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 