# Testing Guide

Comprehensive guide for testing patterns and utilities in the Coffee Budget Frontend application.

## Table of Contents

1. [Test Wrappers](#test-wrappers)
2. [Mock Factories](#mock-factories)
3. [API Mocking](#api-mocking)
4. [Testing Patterns](#testing-patterns)
5. [Best Practices](#best-practices)

## Test Wrappers

### Basic Usage

```tsx
import { renderWithProviders } from '@/test-utils';

test('renders component', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Custom Session

```tsx
import { renderWithProviders, createMockSession } from '@/test-utils';

test('renders for admin user', () => {
  const adminSession = createMockSession({
    user: { ...defaultUser, role: 'admin' }
  });

  renderWithProviders(<MyComponent />, { session: adminSession });
});
```

### Unauthenticated State

```tsx
import { renderWithProviders } from '@/test-utils';

test('redirects when not authenticated', () => {
  renderWithProviders(<MyComponent />, { session: null });
  expect(screen.getByText('Please sign in')).toBeInTheDocument();
});
```

### Custom Query Client

```tsx
import { renderWithProviders, createTestQueryClient } from '@/test-utils';
import { QueryClient } from '@tanstack/react-query';

test('with custom query client', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5000 }
    }
  });

  renderWithProviders(<MyComponent />, { queryClient });
});
```

### Reusable Wrappers

```tsx
import { createWrapper } from '@/test-utils';

describe('MyComponent', () => {
  const Wrapper = createWrapper({
    session: customSession,
    queryClient: customQueryClient,
  });

  test('test 1', () => {
    render(<MyComponent />, { wrapper: Wrapper });
  });

  test('test 2', () => {
    render(<AnotherComponent />, { wrapper: Wrapper });
  });
});
```

## Mock Factories

### Creating Mock Data

```tsx
import {
  createMockTransaction,
  createMockTransactions,
  createMockCategory,
  createMockBankAccount,
} from '@/test-utils';

// Single entity with defaults
const transaction = createMockTransaction();

// Override specific fields
const expensiveTransaction = createMockTransaction({
  amount: 1000,
  description: 'Expensive item',
  type: 'expense',
});

// Multiple entities
const transactions = createMockTransactions(10);

// Multiple with overrides
const recentTransactions = createMockTransactions(5, {
  date: new Date().toISOString(),
});
```

### Available Factories

- `createMockTransaction(overrides?)` - Single transaction
- `createMockTransactions(count, overrides?)` - Multiple transactions
- `createMockCategory(overrides?)` - Single category
- `createMockCategories(count, overrides?)` - Multiple categories
- `createMockBankAccount(overrides?)` - Single bank account
- `createMockBankAccounts(count, overrides?)` - Multiple bank accounts
- `createMockUser(overrides?)` - User entity
- `createMockSession(overrides?)` - Session data
- `createMockTag(overrides?)` - Single tag
- `createMockTags(count, overrides?)` - Multiple tags
- `createMockApiResponse(data, overrides?)` - API success response
- `createMockApiError(message, status?)` - API error response
- `createMockPagination(overrides?)` - Pagination metadata
- `createMockPaginatedResponse(data, overrides?)` - Paginated API response

## API Mocking

### Basic Mocking

```tsx
import { mockApiSuccess, mockApiError, server } from '@/test-utils';

test('fetches transactions successfully', async () => {
  const transactions = createMockTransactions(3);

  // Mock successful API call
  server.use(mockApiSuccess('/transactions', transactions));

  render(<TransactionList />);

  await waitFor(() => {
    expect(screen.getByText(transactions[0].description)).toBeInTheDocument();
  });
});

test('handles API errors', async () => {
  // Mock error response
  server.use(mockApiError('/transactions', 'Failed to fetch', 500));

  render(<TransactionList />);

  await waitFor(() => {
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });
});
```

### Method-Specific Mocking

```tsx
import {
  mockApiPostSuccess,
  mockApiPostError,
  mockApiPutSuccess,
  mockApiDeleteSuccess,
  server,
} from '@/test-utils';

test('creates transaction', async () => {
  const newTransaction = createMockTransaction();

  server.use(mockApiPostSuccess('/transactions', newTransaction));

  // Test create functionality
});

test('updates transaction', async () => {
  const updated = createMockTransaction({ id: 1, amount: 200 });

  server.use(mockApiPutSuccess('/transactions/1', updated));

  // Test update functionality
});

test('deletes transaction', async () => {
  server.use(mockApiDeleteSuccess('/transactions/1'));

  // Test delete functionality
});
```

### Authentication Mocking

```tsx
import { mockAuthSuccess, mockAuthFailure, mockUnauthorized } from '@/test-utils';

test('successful login', async () => {
  server.use(mockAuthSuccess('custom-token'));
  // Test login flow
});

test('failed login', async () => {
  server.use(mockAuthFailure('Invalid credentials'));
  // Test error handling
});

test('unauthorized access', async () => {
  server.use(mockUnauthorized('/transactions'));
  // Test redirect to login
});
```

### Advanced Mocking

```tsx
import { createCustomHandler, server } from '@/test-utils';
import { http, HttpResponse } from 'msw';

test('complex API behavior', async () => {
  // Custom handler with conditional logic
  const handler = createCustomHandler('get', '/transactions', ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (type === 'expense') {
      return createSuccessResponse(expenseTransactions);
    }
    return createSuccessResponse(allTransactions);
  });

  server.use(handler);
});

test('delayed response for loading states', async () => {
  server.use(
    http.get('/transactions', async () => {
      await delay(1000); // Simulate slow API
      return createSuccessResponse(transactions);
    })
  );

  // Test loading indicators
});

test('network error', async () => {
  server.use(mockNetworkError('/transactions'));
  // Test network error handling
});
```

## Testing Patterns

### Component Testing

```tsx
import { renderWithProviders, createMockTransaction } from '@/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('TransactionCard', () => {
  it('renders transaction details', () => {
    const transaction = createMockTransaction({
      description: 'Coffee',
      amount: 5.50,
    });

    renderWithProviders(<TransactionCard transaction={transaction} />);

    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('$5.50')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', async () => {
    const transaction = createMockTransaction();
    const onDelete = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <TransactionCard transaction={transaction} onDelete={onDelete} />
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith(transaction.id);
  });
});
```

### Hook Testing

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper, mockApiSuccess, server } from '@/test-utils';
import { useTransactions } from '@/hooks/useTransactions';

describe('useTransactions', () => {
  it('fetches transactions', async () => {
    const transactions = createMockTransactions(3);
    server.use(mockApiSuccess('/transactions', transactions));

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(transactions);
  });

  it('handles errors', async () => {
    server.use(mockApiError('/transactions', 'Failed', 500));

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
```

### Form Testing

```tsx
import { renderWithProviders, createMockCategory } from '@/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('TransactionForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(<TransactionForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Description'), 'Coffee');
    await user.type(screen.getByLabelText('Amount'), '5.50');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        description: 'Coffee',
        amount: 5.50,
      });
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TransactionForm onSubmit={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Amount must be positive')).toBeInTheDocument();
  });
});
```

### Testing with React Query

```tsx
import { renderWithProviders, mockApiSuccess, server } from '@/test-utils';
import { screen, waitFor } from '@testing-library/react';

describe('TransactionList', () => {
  it('displays transactions from API', async () => {
    const transactions = createMockTransactions(3);
    server.use(mockApiSuccess('/transactions', transactions));

    renderWithProviders(<TransactionList />);

    // Loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Loaded state
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    transactions.forEach(tx => {
      expect(screen.getByText(tx.description)).toBeInTheDocument();
    });
  });

  it('refetches on mutation', async () => {
    const initial = createMockTransactions(2);
    const updated = createMockTransactions(3);

    server.use(mockApiSuccess('/transactions', initial));

    renderWithProviders(<TransactionList />);

    await waitFor(() => {
      expect(screen.getAllByTestId('transaction-item')).toHaveLength(2);
    });

    // Trigger mutation that invalidates query
    server.use(mockApiSuccess('/transactions', updated));

    // Click refresh or trigger mutation
    await userEvent.click(screen.getByRole('button', { name: /refresh/i }));

    await waitFor(() => {
      expect(screen.getAllByTestId('transaction-item')).toHaveLength(3);
    });
  });
});
```

## Best Practices

### 1. AAA Pattern (Arrange, Act, Assert)

```tsx
test('creates transaction', async () => {
  // Arrange
  const newTransaction = createMockTransaction();
  server.use(mockApiPostSuccess('/transactions', newTransaction));
  renderWithProviders(<TransactionForm />);

  // Act
  await userEvent.type(screen.getByLabelText('Description'), 'Coffee');
  await userEvent.type(screen.getByLabelText('Amount'), '5.50');
  await userEvent.click(screen.getByRole('button', { name: /create/i }));

  // Assert
  await waitFor(() => {
    expect(screen.getByText('Transaction created')).toBeInTheDocument();
  });
});
```

### 2. Test User Behavior, Not Implementation

```tsx
// ❌ Bad - testing implementation
test('sets state when button clicked', () => {
  const { result } = renderHook(() => useState(false));
  act(() => result.current[1](true));
  expect(result.current[0]).toBe(true);
});

// ✅ Good - testing user behavior
test('shows form when button clicked', async () => {
  renderWithProviders(<MyComponent />);

  await userEvent.click(screen.getByRole('button', { name: /add/i }));

  expect(screen.getByRole('form')).toBeInTheDocument();
});
```

### 3. Use Descriptive Test Names

```tsx
// ❌ Bad
test('works', () => {});

// ✅ Good
test('displays error message when API call fails', () => {});
test('redirects to transactions page after successful creation', () => {});
```

### 4. Clean Up After Tests

```tsx
describe('TransactionList', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
    server.resetHandlers();
  });
});
```

### 5. Use Test IDs Sparingly

```tsx
// ❌ Avoid - harder to refactor
screen.getByTestId('transaction-list-item-1');

// ✅ Prefer - semantic queries
screen.getByRole('listitem');
screen.getByText('Coffee');
screen.getByLabelText('Transaction amount');
```

### 6. Test Edge Cases

```tsx
describe('TransactionForm', () => {
  it('handles empty input');
  it('handles invalid amount');
  it('handles very large amounts');
  it('handles special characters in description');
  it('handles network errors');
  it('handles concurrent submissions');
});
```

### 7. Keep Tests Focused

```tsx
// ❌ Bad - testing multiple things
test('form works', () => {
  // tests validation
  // tests submission
  // tests error handling
  // tests success state
});

// ✅ Good - one test per behavior
test('shows validation error for empty description');
test('submits form with valid data');
test('displays error message on API failure');
test('shows success message on successful submission');
```

## Common Pitfalls

### 1. Not Waiting for Async Operations

```tsx
// ❌ Bad
test('displays data', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Data')).toBeInTheDocument(); // Fails!
});

// ✅ Good
test('displays data', async () => {
  renderWithProviders(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText('Data')).toBeInTheDocument();
  });
});
```

### 2. Testing Library Internals

```tsx
// ❌ Bad
expect(component.state.transactions).toHaveLength(3);

// ✅ Good
expect(screen.getAllByRole('listitem')).toHaveLength(3);
```

### 3. Not Cleaning Up MSW Handlers

```tsx
// ❌ Bad - handlers leak between tests
test('test 1', () => {
  server.use(mockApiSuccess('/transactions', data1));
});

test('test 2', () => {
  // Still uses data1 from test 1!
});

// ✅ Good
afterEach(() => {
  server.resetHandlers();
});
```

## Resources

- [React Testing Library Documentation](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
