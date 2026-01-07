'use client';

import { cn } from '@/lib/utils';
import {
  getConfidenceLevel,
  getConfidenceColor,
  getConfidenceBgColor,
} from '@/types/expense-plan-suggestion-types';

interface ConfidenceIndicatorProps {
  confidence: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConfidenceIndicator({
  confidence,
  showLabel = true,
  size = 'md',
  className,
}: ConfidenceIndicatorProps) {
  const level = getConfidenceLevel(confidence);
  const colorClass = getConfidenceColor(confidence);
  const bgColorClass = getConfidenceBgColor(confidence);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getLevelLabel = () => {
    switch (level) {
      case 'high':
        return 'High Confidence';
      case 'medium':
        return 'Medium Confidence';
      case 'low':
        return 'Low Confidence';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div
          className={cn(
            'flex justify-between items-center mb-1',
            textSizeClasses[size]
          )}
        >
          <span className="text-gray-600">{getLevelLabel()}</span>
          <span className={cn('font-semibold', colorClass)}>{confidence}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full', sizeClasses[size])}>
        <div
          className={cn(
            'rounded-full transition-all duration-300',
            sizeClasses[size],
            level === 'high'
              ? 'bg-green-500'
              : level === 'medium'
                ? 'bg-yellow-500'
                : 'bg-red-500'
          )}
          style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
        />
      </div>
    </div>
  );
}

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  const colorClass = getConfidenceColor(confidence);
  const bgColorClass = getConfidenceBgColor(confidence);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        bgColorClass,
        colorClass,
        className
      )}
    >
      {confidence}% confidence
    </span>
  );
}
