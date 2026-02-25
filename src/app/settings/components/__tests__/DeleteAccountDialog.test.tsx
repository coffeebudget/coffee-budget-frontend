import { render, screen, fireEvent } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import DeleteAccountDialog from '../DeleteAccountDialog';

// Mock methods required for Radix UI components in JSDOM
beforeAll(() => {
  Element.prototype.hasPointerCapture = jest.fn(() => false);
  Element.prototype.setPointerCapture = jest.fn();
  Element.prototype.releasePointerCapture = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

// Mock the API module
jest.mock('@/lib/api/users', () => ({
  deleteAccount: jest.fn(),
}));

describe('DeleteAccountDialog', () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { accessToken: 'test-token' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
    });
  });

  it('should render confirmation input and disabled button', () => {
    render(<DeleteAccountDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByPlaceholderText('Type DELETE to confirm')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete my account/i })).toBeDisabled();
  });

  it('should enable delete button only when DELETE is typed', () => {
    render(<DeleteAccountDialog open={true} onOpenChange={jest.fn()} />);
    const input = screen.getByPlaceholderText('Type DELETE to confirm');
    const deleteBtn = screen.getByRole('button', { name: /delete my account/i });

    fireEvent.change(input, { target: { value: 'DELET' } });
    expect(deleteBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: 'DELETE' } });
    expect(deleteBtn).toBeEnabled();
  });

  it('should list all data types that will be deleted', () => {
    render(<DeleteAccountDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByText('All transactions')).toBeInTheDocument();
    expect(screen.getByText('Expense plans and income plans')).toBeInTheDocument();
    expect(screen.getByText('Bank accounts and credit cards')).toBeInTheDocument();
    expect(screen.getByText('Categories and tags')).toBeInTheDocument();
    expect(screen.getByText('Payment accounts and activities')).toBeInTheDocument();
    expect(screen.getByText('All sync history')).toBeInTheDocument();
  });

  it('should show dialog title and description', () => {
    render(<DeleteAccountDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    expect(
      screen.getByText('This action is permanent and cannot be undone.')
    ).toBeInTheDocument();
  });

  it('should not render content when closed', () => {
    render(<DeleteAccountDialog open={false} onOpenChange={jest.fn()} />);
    expect(screen.queryByPlaceholderText('Type DELETE to confirm')).not.toBeInTheDocument();
  });
});
