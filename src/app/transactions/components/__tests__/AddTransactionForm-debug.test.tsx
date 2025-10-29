import React from 'react';
import { renderWithProviders } from '../../../../test-utils';

// Simple test to debug the import issue
describe('AddTransactionForm Debug', () => {
  it('should import AddTransactionForm component', async () => {
    // Try to import the component
    let AddTransactionForm;
    try {
      const importedModule = await import('../AddTransactionForm');
      AddTransactionForm = importedModule.default;
      console.log('AddTransactionForm imported successfully:', typeof AddTransactionForm);
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }

    expect(AddTransactionForm).toBeDefined();
    expect(typeof AddTransactionForm).toBe('function');
  });

  it('should render a simple div', () => {
    const { container } = renderWithProviders(<div>Test</div>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render AddTransactionForm with minimal props', async () => {
    const importedModule = await import('../AddTransactionForm');
    const AddTransactionForm = importedModule.default;
    const mockOnAddTransaction = jest.fn();
    
    const { container } = renderWithProviders(
      <AddTransactionForm
        onAddTransaction={mockOnAddTransaction}
        initialData={null}
        categories={[]}
        tags={[]}
        bankAccounts={[]}
        creditCards={[]}
      />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});
