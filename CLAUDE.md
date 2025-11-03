# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 frontend for Coffee Budget - a personal finance application with intelligent transaction categorization, bank integration, and budget management.

**Tech Stack:**
- Next.js 15+ with App Router
- React 19.0.0
- TypeScript 5+
- Tailwind CSS 3.4+ with Shadcn UI (Radix UI components)
- NextAuth.js 4.24+ with Auth0
- TanStack Query (React Query) 5.90+
- Testing: Jest, React Testing Library, Cypress, Storybook

## Development Commands

```bash
npm run dev                # Start dev server with Turbopack (port 3000)
npm run build              # Build for production
npm start                  # Start production build
npm test                   # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
npm run test:ci            # Run tests in CI mode
npm run lint               # Lint Next.js code

# E2E Testing
npm run cypress:open       # Open Cypress interactive mode
npm run cypress:run        # Run Cypress headlessly
npm run test:e2e           # Run E2E tests with server

# Storybook
npm run storybook          # Start Storybook on port 6006
npm run build-storybook    # Build Storybook for deployment

# Run single test file
npm test -- src/components/MyComponent.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render correctly"
```

## Architecture Overview

### Next.js 15 App Router Structure

```
src/
├── app/                              # App Router routes
│   ├── layout.tsx                   # Root layout with Providers
│   ├── page.tsx                     # Home page
│   ├── api/                         # API routes
│   │   └── auth/[...nextauth]/     # NextAuth configuration
│   ├── dashboard/                   # Dashboard pages
│   │   ├── page.tsx                # Main dashboard
│   │   └── ai-analysis/            # AI insights page
│   ├── transactions/                # Transaction management
│   ├── categories/                  # Category management
│   ├── tags/                        # Tag management
│   ├── bank-accounts/               # Bank account pages
│   ├── credit-cards/                # Credit card pages
│   ├── recurring-transactions/      # Recurring payments
│   ├── pending-duplicates/          # Duplicate resolution
│   └── budget-management/           # Budget planning
├── components/                       # Reusable components
│   ├── ui/                          # Shadcn UI components
│   ├── common/                      # Common components
│   ├── gocardless/                  # GoCardless components
│   └── *.tsx                        # Feature components
├── hooks/                            # Custom React hooks
├── lib/                              # Utility libraries
├── utils/                            # Helper functions
├── types/                            # TypeScript definitions
├── styles/                           # Global styles
├── test-utils/                       # Testing utilities
├── mocks/                            # MSW mocks
└── middleware.ts                     # Route protection
```

### Server vs Client Components

**Default: Server Components** (Next.js 15)
- Fetch data directly in components
- No client-side JavaScript shipped
- Better performance and SEO

**Client Components:** Use `'use client'` directive when:
- Using React hooks (useState, useEffect, etc.)
- Handling browser events (onClick, onChange, etc.)
- Using React Context
- Using browser-only APIs

```typescript
// ✅ Server Component (default)
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await fetchData(session.user.id);
  return <Dashboard data={data} />;
}

// ✅ Client Component (interactive)
'use client';
export function TransactionForm() {
  const [amount, setAmount] = useState(0);
  return <input value={amount} onChange={e => setAmount(+e.target.value)} />;
}
```

## Authentication Flow

### NextAuth.js Configuration
**Location:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
// Auth0 provider configuration
providers: [
  Auth0Provider({
    clientId: process.env.NEXTAUTH_AUTH0_ID,
    clientSecret: process.env.NEXTAUTH_AUTH0_SECRET,
    issuer: process.env.NEXTAUTH_AUTH0_ISSUER,
  }),
]

// JWT callback - attach user info to token
async jwt({ token, user, account }) {
  if (account && user) {
    token.accessToken = account.access_token;
    token.userId = user.id;
  }
  return token;
}

// Session callback - make user info available in session
async session({ session, token }) {
  session.accessToken = token.accessToken;
  session.user.id = token.userId;
  return session;
}
```

### Protected Routes
**Middleware:** `src/middleware.ts`

```typescript
// Automatically protects routes matching matcher
export const config = {
  matcher: ['/dashboard/:path*', '/transactions/:path*', ...],
};
```

### Using Session in Components

```typescript
// Server Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');
  // Use session.user
}

// Client Component
'use client';
import { useSession } from 'next-auth/react';

export function Component() {
  const { data: session, status } = useSession();
  if (status === 'loading') return <Loading />;
  if (!session) return <SignIn />;
  // Use session.user
}
```

## API Integration

### Backend Communication

Backend API runs on port 3002 (configured via NEXT_PUBLIC_API_URL).

**Pattern for API calls:**

```typescript
// lib/api-client.ts
export async function fetchTransactions(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
```

### React Query (TanStack Query)

**Setup:** Providers configured in `src/app/layout.tsx`

```typescript
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Using queries:**

```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function TransactionList() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => fetchTransactions(session.accessToken),
    enabled: !!session,
  });

  // Mutate data
  const createMutation = useMutation({
    mutationFn: (newTransaction) => createTransaction(session.accessToken, newTransaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <div>{/* Render transactions */}</div>;
}
```

## Component Patterns

### Shadcn UI Components

**Location:** `src/components/ui/`

Shadcn UI components are copied into your project (not imported from package):

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export function TransactionCard({ transaction }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{transaction.description}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">${transaction.amount}</p>
        <Button variant="outline" size="sm">Edit</Button>
      </CardContent>
    </Card>
  );
}
```

### Form Handling

**Best Practice:** Use controlled components with validation

```typescript
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TransactionForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!formData.description) newErrors.description = 'Required';
    if (formData.amount <= 0) newErrors.amount = 'Must be positive';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={formData.amount}
          onChange={e => setFormData(prev => ({ ...prev, amount: +e.target.value }))}
        />
        {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
      </div>

      <Button type="submit">Create Transaction</Button>
    </form>
  );
}
```

### Custom Hooks

**Location:** `src/hooks/`

```typescript
// hooks/useTransactions.ts
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export function useTransactions() {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => fetchTransactions(session.accessToken),
    enabled: !!session,
  });
}

// Usage in component
const { data: transactions, isLoading, error } = useTransactions();
```

## Styling with Tailwind CSS

### Tailwind Patterns

**Consistent Spacing & Typography:**

```typescript
<div className="container mx-auto p-4 max-w-4xl">
  <h1 className="text-3xl font-bold text-gray-900 mb-6">
    Page Title
  </h1>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Grid items */}
  </div>
</div>
```

**Responsive Design (Mobile-First):**

```typescript
<div className="
  w-full           /* Mobile: full width */
  md:w-1/2         /* Tablet: half width */
  lg:w-1/3         /* Desktop: third width */
  p-4              /* Padding */
  md:p-6           /* Larger padding on tablet+ */
">
  {/* Content */}
</div>
```

**Component Variants with CVA:**

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-12 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

## Test-Driven Development (TDD)

**MANDATORY: Write tests BEFORE implementation.**

### TDD Workflow

1. **RED**: Write failing test that defines component behavior
2. **GREEN**: Write minimal code to make test pass
3. **REFACTOR**: Improve code while keeping tests green
4. **Repeat**: Continue with next behavior

### Component Testing with React Testing Library

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionForm } from './TransactionForm';

describe('TransactionForm', () => {
  it('should render form fields', () => {
    render(<TransactionForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
  });

  it('should show validation error for empty description', async () => {
    const onSubmit = jest.fn();
    render(<TransactionForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText('Required')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with form data when valid', async () => {
    const onSubmit = jest.fn();
    render(<TransactionForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Coffee' },
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '5.50' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        description: 'Coffee',
        amount: 5.50,
      });
    });
  });
});
```

### Testing with React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { TransactionList } from './TransactionList';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('TransactionList', () => {
  it('should display transactions when loaded', async () => {
    // Mock API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, description: 'Coffee', amount: 5.50 },
        ]),
      })
    );

    render(<TransactionList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument();
      expect(screen.getByText('$5.50')).toBeInTheDocument();
    });
  });
});
```

### E2E Testing with Cypress

**Location:** `cypress/e2e/`

```typescript
// cypress/e2e/transactions.cy.ts
describe('Transaction Management', () => {
  beforeEach(() => {
    cy.login(); // Custom command for Auth0 login
    cy.visit('/transactions');
  });

  it('should create a new transaction', () => {
    cy.getByTestId('create-transaction-btn').click();

    cy.getByLabelText('Description').type('Coffee');
    cy.getByLabelText('Amount').type('5.50');
    cy.getByRole('button', { name: /create/i }).click();

    cy.contains('Transaction created successfully').should('be.visible');
    cy.contains('Coffee').should('be.visible');
  });

  it('should filter transactions by category', () => {
    cy.getByTestId('category-filter').select('Food & Drink');

    cy.get('[data-testid="transaction-item"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="transaction-item"]').each(($el) => {
      cy.wrap($el).should('contain', 'Food & Drink');
    });
  });
});
```

## TypeScript Patterns

### Type Definitions

**Location:** `src/types/`

```typescript
// types/transaction.ts
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  categoryId?: number;
  category?: Category;
  bankAccountId?: number;
  bankAccount?: BankAccount;
  tags?: Tag[];
}

export interface CreateTransactionDto {
  description: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  categoryId?: number;
  bankAccountId?: number;
}
```

### Component Props

```typescript
interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  className?: string;
}

export function TransactionCard({
  transaction,
  onEdit,
  onDelete,
  className,
}: TransactionCardProps) {
  // Implementation
}
```

## Environment Variables

Required in `.env.local`:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Auth0
NEXTAUTH_AUTH0_ID=your-auth0-client-id
NEXTAUTH_AUTH0_SECRET=your-auth0-client-secret
NEXTAUTH_AUTH0_ISSUER=https://your-tenant.auth0.com

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3002
```

## Common Patterns

### Page with Data Fetching (Server Component)

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  // Fetch data on server
  const transactions = await fetchTransactions(session.accessToken);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <TransactionList transactions={transactions} />
    </div>
  );
}
```

### Interactive Component (Client Component)

```typescript
'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function CreateTransactionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsOpen(false);
    },
  });

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Create Transaction
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onSubmit={createMutation.mutate} />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## Important Files

- `src/app/layout.tsx` - Root layout with providers
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/middleware.ts` - Route protection
- `tailwind.config.ts` - Tailwind configuration
- `next.config.js` - Next.js configuration
- `.cursorrules` - Development guidelines

## Documentation

Refer to `../docs/` directory:
- `development/` - Development standards
- `features/` - Feature documentation
- `integrations/` - Integration guides

## Storybook

Storybook configured for component development:

```typescript
// components/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Click me',
  },
};
```

Run: `npm run storybook`
