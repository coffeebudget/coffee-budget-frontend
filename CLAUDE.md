# CLAUDE.md - Coffee Budget Frontend

Next.js 15 frontend for Coffee Budget - personal finance with intelligent categorization.

> **Full Documentation**: `../docs/` (architecture, deployment, features)
> **Quick References**: `../docs/claude-context/FRONTEND-PATTERNS.md`

## Quick Start

```bash
npm run dev            # Dev server with Turbopack (port 3000)
npm test               # Run unit tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run cypress:open   # E2E tests
npm run storybook      # Component docs (port 6006)
npm run lint           # Lint code
```

## Tech Stack

- **Next.js 15** with App Router
- **React 19** with Server Components
- **Shadcn UI** (Radix + Tailwind)
- **React Query** (TanStack Query)
- **NextAuth.js** with Auth0

## Component Types

```typescript
// Server Component (default) - fetches data on server
export default async function Page() {
  const session = await getServerSession(authOptions);
  const data = await fetchData(session.accessToken);
  return <Component data={data} />;
}

// Client Component - interactive UI
'use client';
export function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

## Data Fetching

```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['transactions'],
  queryFn: () => fetchTransactions(session.accessToken),
  enabled: !!session,
});

const mutation = useMutation({
  mutationFn: createTransaction,
  onSuccess: () => queryClient.invalidateQueries(['transactions']),
});
```

## Shadcn UI

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
```

## Key Routes

| Route | Purpose |
|-------|---------|
| `/dashboard` | Main dashboard |
| `/transactions` | Transaction management |
| `/categories` | Category management |
| `/expense-plans` | Expense plan management |
| `/expense-plan-suggestions` | AI suggestions review |
| `/bank-accounts` | Bank account management |

## Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

it('should render and interact', async () => {
  render(<Component />);
  expect(screen.getByText('Title')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(screen.getByText('Result')).toBeVisible());
});
```

## Authentication

```typescript
// Server Component
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const session = await getServerSession(authOptions);
if (!session) redirect('/auth/signin');

// Client Component
'use client';
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
```

## Key Files

| Purpose | Location |
|---------|----------|
| Auth config | `src/app/api/auth/[...nextauth]/route.ts` |
| Middleware | `src/middleware.ts` |
| UI components | `src/components/ui/` |
| Types | `src/types/` |
