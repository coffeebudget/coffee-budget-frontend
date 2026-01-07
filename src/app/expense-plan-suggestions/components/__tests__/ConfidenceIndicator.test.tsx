import { render, screen } from '@testing-library/react';
import { ConfidenceIndicator, ConfidenceBadge } from '../ConfidenceIndicator';

describe('ConfidenceIndicator', () => {
  describe('rendering', () => {
    it('should render with high confidence (green)', () => {
      render(<ConfidenceIndicator confidence={90} />);

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('should render with medium confidence (yellow)', () => {
      render(<ConfidenceIndicator confidence={75} />);

      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should render with low confidence (red)', () => {
      render(<ConfidenceIndicator confidence={50} />);

      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('label visibility', () => {
    it('should show label by default', () => {
      render(<ConfidenceIndicator confidence={85} />);

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('should hide label when showLabel is false', () => {
      render(<ConfidenceIndicator confidence={85} showLabel={false} />);

      expect(screen.queryByText('High Confidence')).not.toBeInTheDocument();
      expect(screen.queryByText('85%')).not.toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('should render small size', () => {
      const { container } = render(<ConfidenceIndicator confidence={80} size="sm" />);

      expect(container.querySelector('.h-1\\.5')).toBeInTheDocument();
    });

    it('should render medium size by default', () => {
      const { container } = render(<ConfidenceIndicator confidence={80} />);

      expect(container.querySelector('.h-2')).toBeInTheDocument();
    });

    it('should render large size', () => {
      const { container } = render(<ConfidenceIndicator confidence={80} size="lg" />);

      expect(container.querySelector('.h-3')).toBeInTheDocument();
    });
  });

  describe('confidence thresholds', () => {
    it('should treat 85 as high confidence', () => {
      render(<ConfidenceIndicator confidence={85} />);
      expect(screen.getByText('High Confidence')).toBeInTheDocument();
    });

    it('should treat 84 as medium confidence', () => {
      render(<ConfidenceIndicator confidence={84} />);
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('should treat 70 as medium confidence', () => {
      render(<ConfidenceIndicator confidence={70} />);
      expect(screen.getByText('Medium Confidence')).toBeInTheDocument();
    });

    it('should treat 69 as low confidence', () => {
      render(<ConfidenceIndicator confidence={69} />);
      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle 0% confidence', () => {
      render(<ConfidenceIndicator confidence={0} />);

      expect(screen.getByText('Low Confidence')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle 100% confidence', () => {
      render(<ConfidenceIndicator confidence={100} />);

      expect(screen.getByText('High Confidence')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should clamp values above 100', () => {
      const { container } = render(<ConfidenceIndicator confidence={150} />);

      // Progress bar width should be clamped to 100%
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should handle negative values', () => {
      const { container } = render(<ConfidenceIndicator confidence={-10} />);

      // Progress bar width should be clamped to 0%
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });
  });

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ConfidenceIndicator confidence={80} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('ConfidenceBadge', () => {
  it('should render confidence percentage', () => {
    render(<ConfidenceBadge confidence={85} />);

    expect(screen.getByText('85% confidence')).toBeInTheDocument();
  });

  it('should apply high confidence styling', () => {
    const { container } = render(<ConfidenceBadge confidence={90} />);

    expect(container.firstChild).toHaveClass('bg-green-100');
    expect(container.firstChild).toHaveClass('text-green-600');
  });

  it('should apply medium confidence styling', () => {
    const { container } = render(<ConfidenceBadge confidence={75} />);

    expect(container.firstChild).toHaveClass('bg-yellow-100');
    expect(container.firstChild).toHaveClass('text-yellow-600');
  });

  it('should apply low confidence styling', () => {
    const { container } = render(<ConfidenceBadge confidence={50} />);

    expect(container.firstChild).toHaveClass('bg-red-100');
    expect(container.firstChild).toHaveClass('text-red-600');
  });

  it('should apply custom className', () => {
    const { container } = render(<ConfidenceBadge confidence={80} className="mt-2" />);

    expect(container.firstChild).toHaveClass('mt-2');
  });
});
