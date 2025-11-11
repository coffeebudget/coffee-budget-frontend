import { render, screen } from '@testing-library/react';
import { SyncStatusBadge } from './SyncStatusBadge';
import { SyncStatus } from '@/types/sync-history';

describe('SyncStatusBadge', () => {
  it('should render success status badge', () => {
    render(<SyncStatusBadge status={SyncStatus.SUCCESS} />);

    const badge = screen.getByText('Success');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-800');
  });

  it('should render partial status badge', () => {
    render(<SyncStatusBadge status={SyncStatus.PARTIAL} />);

    const badge = screen.getByText('Partial');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-800');
  });

  it('should render failed status badge', () => {
    render(<SyncStatusBadge status={SyncStatus.FAILED} />);

    const badge = screen.getByText('Failed');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-800');
  });
});
