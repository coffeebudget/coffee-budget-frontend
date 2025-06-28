"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { updateCategoryBudget, fetchBudgetSummary, fetchBudgetCategories } from '@/utils/api-client';
import { 
  Target, 
  PiggyBank, 
  AlertTriangle, 
  TrendingUp,
  ArrowLeft,
  Save,
  RefreshCw,
  Euro,
  Settings,
  Eye
} from 'lucide-react';
import CategoryTransactionsModal from '@/components/CategoryTransactionsModal';

interface Category {
  id: number;
  name: string;
  budgetLevel?: 'primary' | 'secondary' | 'optional';
  monthlyBudget?: number;
  yearlyBudget?: number;
  maxThreshold?: number;
  warningThreshold?: number;
}

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

export default function BudgetManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [categoriesWithSpending, setCategoriesWithSpending] = useState<CategorySpending[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionsModal, setTransactionsModal] = useState<{
    isOpen: boolean;
    categoryId: number;
    categoryName: string;
  }>({ isOpen: false, categoryId: 0, categoryName: '' });

  useEffect(() => {
    if (!session?.user?.accessToken) {
      router.push('/');
      return;
    }
    loadData();
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, summaryData] = await Promise.all([
        fetchBudgetCategories(), // Usa il nuovo endpoint che restituisce TUTTE le categorie con dati di spesa
        fetchBudgetSummary()
      ]);
      setCategoriesWithSpending(categoriesData);
      setBudgetSummary(summaryData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryUpdate = async (categoryId: number, updates: Partial<Category>) => {
    try {
      setSaving(categoryId);
      const updatedCategory = await updateCategoryBudget(categoryId, updates);
      
      // 🚀 OPTIMIZED: Update only the specific category locally instead of reloading everything
      setCategoriesWithSpending(prevCategories => 
        prevCategories.map(category => {
          if (category.categoryId === categoryId) {
            // Merge the updated category data with existing spending data
            return {
              ...category,
              budgetLevel: updatedCategory.budgetLevel || category.budgetLevel,
              monthlyBudget: updatedCategory.monthlyBudget,
              maxThreshold: updatedCategory.maxThreshold,
              warningThreshold: updatedCategory.warningThreshold
            };
          }
          return category;
        })
      );

      // Only reload budget summary if we changed budgetLevel (which affects calculations)
      if (updates.budgetLevel !== undefined) {
        console.log('Budget level changed, refreshing summary...');
        const summaryData = await fetchBudgetSummary();
        setBudgetSummary(summaryData);
      }

      console.log('Category updated successfully without full reload');
      // Optional: Add a subtle success feedback
      setTimeout(() => {
        // You could add a toast notification here if needed
      }, 100);
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
    } finally {
      setSaving(null);
    }
  };

  const handleShowTransactions = (categoryId: number, categoryName: string) => {
    setTransactionsModal({
      isOpen: true,
      categoryId,
      categoryName
    });
  };

  const getBudgetLevelColor = (level?: string) => {
    switch (level) {
      case 'primary': return 'bg-red-100 text-red-800 border-red-200';
      case 'secondary': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'optional': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBudgetLevelIcon = (level?: string) => {
    switch (level) {
      case 'primary': return <AlertTriangle className="w-4 h-4" />;
      case 'secondary': return <Target className="w-4 h-4" />;
      case 'optional': return <PiggyBank className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Loading budget management...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
        <div className="w-32"></div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Budget Summary */}
      {budgetSummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-xl mb-8 border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Budget Overview</h2>
          
          {/* Financial Overview - Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-center border-l-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">Entrata Media Mensile</div>
              <div className="text-2xl font-bold text-green-700">
                €{budgetSummary.averageMonthlyIncome.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Ultimi 12 mesi</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border-l-4 border-red-500">
              <div className="text-sm text-gray-600 mb-1">Spesa Media Mensile</div>
              <div className="text-2xl font-bold text-red-700">
                €{budgetSummary.averageMonthlyExpenses.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Ultimi 12 mesi</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">Flusso Netto Mensile</div>
              <div className={`text-2xl font-bold ${budgetSummary.averageMonthlyNetFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                €{budgetSummary.averageMonthlyNetFlow.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Entrate - Uscite</div>
            </div>
          </div>

          {/* Budget Metrics - Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <Euro className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">
                €{budgetSummary.primaryCategoriesData
                  .filter(cat => (cat.averageMonthlyNetFlow || 0) <= 0) // Solo categorie di spesa
                  .reduce((sum, cat) => sum + (cat.averageMonthlySpending || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Accantonamento Mensile</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <Target className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-800">
                {budgetSummary.primaryCategoriesData.length}
              </div>
              <div className="text-sm text-gray-600">Primary Categories</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-800">
                {budgetSummary.secondaryWarnings.length}
              </div>
              <div className="text-sm text-gray-600">Budget Warnings</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">
                {budgetSummary.monthlyBudgetUtilization}%
              </div>
              <div className="text-sm text-gray-600">Budget Utilization</div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Configuration */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configure Category Budgets</h2>
          <p className="text-gray-600 mt-1">Set budget levels and amounts for your expense categories</p>
          <div className="mt-3 flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span>📊 Categorie ordinate per <strong>spesa netta</strong>: le categorie con maggiore uscita netta sono mostrate per prime</span>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6">
            {categoriesWithSpending.map((categorySpending, index) => (
              <CategoryBudgetCard
                key={categorySpending.categoryId}
                categorySpending={categorySpending}
                categoryRank={index + 1}
                onUpdate={handleCategoryUpdate}
                saving={saving === categorySpending.categoryId}
                getBudgetLevelColor={getBudgetLevelColor}
                getBudgetLevelIcon={getBudgetLevelIcon}
                onShowTransactions={handleShowTransactions}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Budget Levels Guide */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Level Guide</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-semibold text-red-800">Primary</span>
            </div>
            <p className="text-sm text-red-700">
              Spese essenziali per cui calcolare automaticamente l'accantonamento mensile. 
              L'<strong>Auto Save</strong> è calcolato automaticamente come spesa media mensile.
              Il <strong>Monthly Budget</strong> (opzionale) permette di personalizzare quanto spendere.
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-semibold text-yellow-800">Secondary</span>
            </div>
            <p className="text-sm text-yellow-700">
              Controllable expenses with maximum thresholds (restaurants, clothing, entertainment)
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <PiggyBank className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Optional</span>
            </div>
            <p className="text-sm text-green-700">
              Discretionary spending with savings suggestions (travel, hobbies, luxury items)
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Modal */}
      <CategoryTransactionsModal
        isOpen={transactionsModal.isOpen}
        onClose={() => setTransactionsModal(prev => ({ ...prev, isOpen: false }))}
        categoryId={transactionsModal.categoryId}
        categoryName={transactionsModal.categoryName}
        months={12}
      />
    </div>
  );
}

interface CategoryBudgetCardProps {
  categorySpending: CategorySpending;
  categoryRank?: number;
  onUpdate: (id: number, updates: Partial<Category>) => void;
  saving: boolean;
  getBudgetLevelColor: (level?: string) => string;
  getBudgetLevelIcon: (level?: string) => React.ReactNode;
  onShowTransactions: (categoryId: number, categoryName: string) => void;
}

function CategoryBudgetCard({ 
  categorySpending,
  categoryRank,
  onUpdate, 
  saving, 
  getBudgetLevelColor, 
  getBudgetLevelIcon,
  onShowTransactions
}: CategoryBudgetCardProps) {
  // Converti CategorySpending in Category per compatibilità con i form
  const category: Category = {
    id: categorySpending.categoryId,
    name: categorySpending.categoryName,
    budgetLevel: categorySpending.budgetLevel,
    monthlyBudget: categorySpending.monthlyBudget ?? undefined,
    maxThreshold: categorySpending.maxThreshold ?? undefined,
    warningThreshold: categorySpending.warningThreshold ?? undefined
  };

  const [localCategory, setLocalCategory] = useState<Category>(category);
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setLocalCategory(category);
    setHasChanges(false);
  }, [categorySpending]);

  const handleChange = (field: keyof Category, value: any) => {
    setLocalCategory(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onUpdate(category.id, localCategory);
      setHasChanges(false);
      setJustSaved(true);
      
      // Reset the "just saved" state after 2 seconds
      setTimeout(() => {
        setJustSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {categoryRank && categorySpending && (
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${
              categorySpending.averageMonthlyNetFlow < -50 ? 'bg-red-500 text-white' :
              categorySpending.averageMonthlyNetFlow < 0 ? 'bg-orange-500 text-white' :
              categorySpending.averageMonthlyNetFlow > 50 ? 'bg-green-500 text-white' :
              'bg-gray-400 text-white'
            }`}>
              {categoryRank}
            </span>
          )}
          <h3 className="text-lg font-semibold text-gray-900 mr-3">{category.name}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBudgetLevelColor(localCategory.budgetLevel)}`}>
            {getBudgetLevelIcon(localCategory.budgetLevel)}
            <span className="ml-1 capitalize">{localCategory.budgetLevel || 'None'}</span>
          </span>
        </div>
        {(hasChanges || justSaved) && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center px-3 py-1 rounded-md transition-all duration-300 ${
              justSaved 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                Saving...
              </>
            ) : justSaved ? (
              <>
                <Save className="w-4 h-4 mr-1" />
                Saved ✓
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save
              </>
            )}
          </button>
        )}
      </div>

      {/* Historical Statistics */}
      {categorySpending && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-blue-900">📊 Statistiche Ultimi 12 Mesi</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onShowTransactions(categorySpending.categoryId, categorySpending.categoryName)}
                className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-3 h-3 mr-1" />
                Show Transactions
              </button>
              {categorySpending.averageMonthlyNetFlow < 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  🔴 Priorità Budget
                </span>
              )}
              {categorySpending.averageMonthlyNetFlow > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🟢 Fonte Entrate
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xs text-blue-600 mb-1">Spesa Media Mensile</div>
              <div className="text-lg font-bold text-red-700">
                €{categorySpending.averageMonthlySpending.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-blue-600 mb-1">Entrata Media Mensile</div>
              <div className="text-lg font-bold text-green-700">
                €{categorySpending.averageMonthlyIncome.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-blue-600 mb-1">Flusso Netto Mensile</div>
              <div className={`text-lg font-bold ${categorySpending.averageMonthlyNetFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                €{categorySpending.averageMonthlyNetFlow.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600">
            💡 <strong>Suggerimento:</strong> {categorySpending.averageMonthlyNetFlow < -10 
              ? `Questa categoria ha un flusso netto negativo significativo di €${Math.abs(categorySpending.averageMonthlyNetFlow).toFixed(2)}/mese. Considera di impostare un Monthly Budget di €${Math.ceil(categorySpending.averageMonthlySpending * 1.1)}.`
              : categorySpending.averageMonthlyNetFlow < 0
              ? `Questa categoria ha un flusso netto negativo minore di €${Math.abs(categorySpending.averageMonthlyNetFlow).toFixed(2)}/mese.`
              : categorySpending.averageMonthlyNetFlow > 10 
              ? `Questa categoria genera un flusso netto positivo di €${categorySpending.averageMonthlyNetFlow.toFixed(2)}/mese. Ottima fonte di entrate!`
              : `Questa categoria ha un flusso netto equilibrato.`}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Budget Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget Level</label>
          <select
            value={localCategory.budgetLevel || ''}
            onChange={(e) => handleChange('budgetLevel', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="optional">Optional</option>
          </select>
        </div>

        {/* Monthly Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget (€)</label>
          <input
            type="number"
            value={localCategory.monthlyBudget || ''}
            onChange={(e) => handleChange('monthlyBudget', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        {/* Auto Save Amount (Primary only) - AUTO CALCULATED */}
        {localCategory.budgetLevel === 'primary' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auto Save Amount (€)
              <span className="text-xs text-blue-600 font-normal ml-2">🤖 Auto-calcolato</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={categorySpending?.averageMonthlySpending?.toFixed(2) || '0.00'}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-blue-800 font-semibold cursor-not-allowed"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-blue-500 text-sm">📊</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              💡 Basato sulla spesa media mensile degli ultimi 12 mesi (€{categorySpending?.averageMonthlySpending?.toFixed(2) || '0.00'})
            </p>
          </div>
        )}

        {/* Max Threshold (Secondary only) */}
        {localCategory.budgetLevel === 'secondary' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Threshold (€)</label>
            <input
              type="number"
              value={localCategory.maxThreshold || ''}
              onChange={(e) => handleChange('maxThreshold', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        )}

        {/* Warning Threshold */}
        {localCategory.budgetLevel && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warning Threshold (%)</label>
            <input
              type="number"
              value={localCategory.warningThreshold || ''}
              onChange={(e) => handleChange('warningThreshold', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="80"
              min="1"
              max="100"
            />
          </div>
        )}
      </div>
    </div>
  );
} 