import { render, screen, fireEvent } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import SettingsPage from '../page';

// Mock the DeleteAccountDialog to avoid Radix portal complexity in page-level tests
jest.mock('../components/DeleteAccountDialog', () => {
  return function MockDeleteAccountDialog({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) {
    if (!open) return null;
    return <div data-testid="delete-dialog">Delete Account Dialog</div>;
  };
});

describe('SettingsPage', () => {
  it('should show login message when not authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
    render(<SettingsPage />);
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it('should render account info and danger zone when authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { email: 'test@example.com', accessToken: 'mock-token' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
    });
    render(<SettingsPage />);
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    expect(screen.getByText('Delete my account')).toBeInTheDocument();
  });

  it('should open delete dialog when button is clicked', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { email: 'test@example.com', accessToken: 'mock-token' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
    });
    render(<SettingsPage />);
    fireEvent.click(screen.getByText('Delete my account'));
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });
});
