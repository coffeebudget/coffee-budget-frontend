import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/test-wrappers';
import userEvent from '@testing-library/user-event';
import { signIn, signOut } from 'next-auth/react';
import AuthButtons from '../AuthButtons';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  LogOut: () => <span data-testid="logout-icon">LogOut</span>,
  LogIn: () => <span data-testid="login-icon">LogIn</span>,
}));

const mockUseSession = jest.mocked(require('next-auth/react').useSession);
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe('AuthButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to initial state before each test
    mockSignIn.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue(undefined);
  });

  describe('Loading States', () => {
    it('shows loading state during SSR (desktop)', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });

      renderWithProviders(<AuthButtons />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
    });

    it('shows loading state during SSR (mobile)', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });

      renderWithProviders(<AuthButtons isMobile={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('mobile-login-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mobile-logout-button')).not.toBeInTheDocument();
    });

    it('transitions from loading to login button', async () => {
      // Start with loading
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });

      const { rerender } = render(<AuthButtons />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Simulate client hydration - wait for useEffect to run
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).toBeInTheDocument();
      });

      // Update to unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      rerender(<AuthButtons />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated State - Desktop', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('renders login button when not authenticated', async () => {
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const loginButton = screen.getByTestId('login-button');
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveTextContent('Login');
    });

    it('shows login icon', async () => {
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('login-icon')).toBeInTheDocument();
      });
    });

    it('calls signIn with auth0 provider when login clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledWith('auth0');
    });

    it('does not show logout button', async () => {
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Unauthenticated State - Mobile', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('renders mobile login button when not authenticated', async () => {
      renderWithProviders(<AuthButtons isMobile={true} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const loginButton = screen.getByTestId('mobile-login-button');
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveTextContent('Login');
    });

    it('shows login icon on mobile', async () => {
      renderWithProviders(<AuthButtons isMobile={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('login-icon')).toBeInTheDocument();
      });
    });

    it('calls signIn with auth0 provider when mobile login clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthButtons isMobile={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-login-button')).toBeInTheDocument();
      });

      const loginButton = screen.getByTestId('mobile-login-button');
      await user.click(loginButton);

      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledWith('auth0');
    });

    it('does not show mobile logout button', async () => {
      renderWithProviders(<AuthButtons isMobile={true} />);

      await waitFor(() => {
        expect(screen.queryByTestId('mobile-logout-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authenticated State - Desktop', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            image: null,
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('renders logout button when authenticated', async () => {
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const logoutButton = screen.getByTestId('logout-button');
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveTextContent('Logout');
    });

    it('shows logout icon', async () => {
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
      });
    });

    it('calls signOut when logout clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      });

      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('does not show login button', async () => {
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Authenticated State - Mobile', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            image: null,
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('renders mobile logout button when authenticated', async () => {
      renderWithProviders(<AuthButtons isMobile={true} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const logoutButton = screen.getByTestId('mobile-logout-button');
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toHaveTextContent('Logout');
    });

    it('shows logout icon on mobile', async () => {
      renderWithProviders(<AuthButtons isMobile={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
      });
    });

    it('calls signOut when mobile logout clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AuthButtons isMobile={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-logout-button')).toBeInTheDocument();
      });

      const logoutButton = screen.getByTestId('mobile-logout-button');
      await user.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('does not show mobile login button', async () => {
      renderWithProviders(<AuthButtons isMobile={true} />);

      await waitFor(() => {
        expect(screen.queryByTestId('mobile-login-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Session State Transitions', () => {
    it('transitions from unauthenticated to authenticated', async () => {
      // Start unauthenticated
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { rerender } = render(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });

      // Simulate login
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            image: null,
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      });

      rerender(<AuthButtons />);

      await waitFor(() => {
        expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      });
    });

    it('transitions from authenticated to unauthenticated', async () => {
      // Start authenticated
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            image: null,
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      });

      const { rerender } = render(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      });

      // Simulate logout
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      rerender(<AuthButtons />);

      await waitFor(() => {
        expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });
    });
  });

  describe('Error Scenarios', () => {
    it('handles session with null data but authenticated status', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'authenticated',
        update: jest.fn(),
      });

      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        // Should still show login button since data is null
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });
    });

    it('handles session with data but unauthenticated status', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            image: null,
          },
          expires: '2024-12-31',
        },
        status: 'unauthenticated',
        update: jest.fn(),
      });

      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        // Should show login button since status is unauthenticated
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });
    });

    it('handles signIn errors gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      mockSignIn.mockRejectedValueOnce(new Error('Sign in failed'));

      const user = userEvent.setup();
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });

      const loginButton = screen.getByTestId('login-button');

      // Should not throw error
      await expect(user.click(loginButton)).resolves.not.toThrow();

      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });

    it('handles signOut errors gracefully', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            image: null,
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      });

      mockSignOut.mockRejectedValueOnce(new Error('Sign out failed'));

      const user = userEvent.setup();
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      });

      const logoutButton = screen.getByTestId('logout-button');

      // Should not throw error
      await expect(user.click(logoutButton)).resolves.not.toThrow();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Handling', () => {
    it('defaults to desktop mode when isMobile not provided', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
        expect(screen.queryByTestId('mobile-login-button')).not.toBeInTheDocument();
      });
    });

    it('uses mobile mode when isMobile is true', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      renderWithProviders(<AuthButtons isMobile={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-login-button')).toBeInTheDocument();
        expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
      });
    });

    it('uses desktop mode when isMobile is false', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      renderWithProviders(<AuthButtons isMobile={false} />);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
        expect(screen.queryByTestId('mobile-login-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Multiple Clicks', () => {
    it('handles rapid login clicks', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });

      const loginButton = screen.getByTestId('login-button');

      // Click multiple times rapidly
      await user.click(loginButton);
      await user.click(loginButton);
      await user.click(loginButton);

      expect(mockSignIn).toHaveBeenCalledTimes(3);
    });

    it('handles rapid logout clicks', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            image: null,
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<AuthButtons />);

      await waitFor(() => {
        expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      });

      const logoutButton = screen.getByTestId('logout-button');

      // Click multiple times rapidly
      await user.click(logoutButton);
      await user.click(logoutButton);
      await user.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalledTimes(3);
    });
  });
});
