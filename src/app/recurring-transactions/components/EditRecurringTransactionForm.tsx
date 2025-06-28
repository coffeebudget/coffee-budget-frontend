'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adjustPattern, fetchCategories, fetchTags } from '@/utils/api';
import { fetchBankAccounts, fetchCreditCards } from '@/utils/api-client';
import { RecurringTransaction } from '@/utils/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from "@/components/ui/switch";
import TagSelector from '@/components/TagSelector';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";


type Props = {
  recurringTransaction: RecurringTransaction;
  token: string;
};

export default function EditRecurringTransactionForm({ recurringTransaction, token }: Props) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: recurringTransaction.name || '',
    description: recurringTransaction.description || '',
    amount: Number(recurringTransaction.amount) || 0,
    frequencyType: recurringTransaction.frequencyType || 'monthly',
    frequencyEveryN: recurringTransaction.frequencyEveryN || 1,
    startDate: recurringTransaction.startDate?.slice(0, 10) || '',
    endDate: recurringTransaction.endDate?.slice(0, 10) || '',
    type: recurringTransaction.type || 'expense',
    status: recurringTransaction.status || 'SCHEDULED',
    occurrences: recurringTransaction.occurrences || undefined,
    categoryId: recurringTransaction.category?.id || undefined,
    tagIds: recurringTransaction.tags?.map(tag => tag.id) || [],
    bankAccountId: recurringTransaction.bankAccount?.id || undefined,
    creditCardId: recurringTransaction.creditCard?.id || undefined,
    applyToPast: recurringTransaction.applyToPast || false,
    userConfirmed: recurringTransaction.userConfirmed || false,
    source: recurringTransaction.source || 'PATTERN_DETECTOR',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [cat, tg, ba, cc] = await Promise.all([
          fetchCategories(token),
          fetchTags(token),
          fetchBankAccounts(),
          fetchCreditCards(),
        ]);
        setCategories(cat);
        setTags(tg);
        setBankAccounts(ba);
        setCreditCards(cc);
      } catch (err) {
        console.error('Failed to load dropdown options', err);
      }
    }
    loadOptions();
  }, [token]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adjustPattern(token, Number(recurringTransaction.id), formData);
      router.push('/recurring-transactions/review-patterns');
    } catch (err) {
      console.error(err);
      setError('Failed to update recurring transaction');
    } finally {
      setLoading(false);
    }
  };

  // Convert categories to SearchableSelectOption format
  const categoryOptions: SearchableSelectOption[] = categories.map(cat => ({
    id: cat.id,
    label: cat.name,
    keywords: cat.keywords || [],
  }));

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Edit Recurring Transaction</CardTitle>
          <CardDescription>Make changes and save your recurring pattern.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Place all your form fields here (name, amount, etc.) */}


      {/* Name Field */}
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
      </div>


      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>


      {/* Amount Field */}
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={(e) => handleChange('amount', parseFloat(e.target.value))}
          step="0.01"
          required
        />
      </div>


      {/* Frequency Section */}
      <div className="space-y-2">
        <Label>Frequency</Label>
        <div className="flex gap-4">
          <Select
            value={formData.frequencyType}
            onValueChange={(val) =>
              setFormData((prev) => ({ ...prev, frequencyType: val as 'daily' | 'weekly' | 'monthly' | 'yearly' }))
            }
          >
            <SelectTrigger className="w-1/2">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            name="frequencyEveryN"
            value={formData.frequencyEveryN}
            onChange={(e) => handleChange('frequencyEveryN', parseInt(e.target.value))}
            min={1}
            className="w-1/2"
          />
        </div>
      </div>

      {/* Continue with rest of form here... */}

      <div>
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          value={formData.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="occurrences">Occurrences</Label>
        <Input
          id="occurrences"
          name="occurrences"
          type="number"
          value={formData.occurrences ?? ''}
          onChange={(e) => handleChange('occurrences', parseInt(e.target.value))}
        />
      </div>




      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(val) => setFormData(prev => ({ ...prev, status: val as typeof formData.status }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={(val) => setFormData(prev => ({ ...prev, type: val as 'income' | 'expense' }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>


        <div className="space-y-2">
          <SearchableSelect
            options={categoryOptions}
            value={formData.categoryId || null}
            onChange={(value) => setFormData(prev => ({ 
              ...prev, 
              categoryId: value ? (typeof value === 'string' ? parseInt(value) : value) : undefined
            }))}
            placeholder="Select category"
            label="Category"
            searchPlaceholder="Search categories..."
            emptyMessage="No categories found"
            allowClear={true}
          />
        </div>


        <div className="space-y-2">
          <Label htmlFor="bankAccountId">Bank Account</Label>
          <Select
            value={formData.bankAccountId?.toString() || ''}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                bankAccountId: val === 'none' ? undefined : Number(val),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bank account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {bankAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id.toString()}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        <div className="space-y-2">
          <Label htmlFor="creditCardId">Credit Card</Label>
          <Select
            value={formData.creditCardId?.toString() || ''}
            onValueChange={(val) =>
              setFormData((prev) => ({
                ...prev,
                bankAccountId: val === 'none' ? undefined : Number(val),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select credit card" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {creditCards.map((cc) => (
                <SelectItem key={cc.id} value={cc.id.toString()}>
                  {cc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        <div className="md:col-span-2">
          <Label>Tags</Label>
          <TagSelector tags={tags} selectedTags={formData.tagIds} onChange={(newSelected) => handleChange('tagIds', newSelected)} />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="applyToPast">Apply to past</Label>
          <Switch
            id="applyToPast"
            checked={formData.applyToPast}
            onCheckedChange={(val) =>
              setFormData((prev) => ({ ...prev, applyToPast: val }))
            }
          />
        </div>


        <div className="flex items-center justify-between">
          <Label htmlFor="userConfirmed">User Confirmed</Label>
          <Switch
            id="userConfirmed"
            checked={formData.userConfirmed}
            onCheckedChange={(val) =>
              setFormData((prev) => ({ ...prev, userConfirmed: val }))
            }
          />
        </div>



      {error && <p className="text-red-500 text-sm">{error}</p>}

          </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>

  );
}
