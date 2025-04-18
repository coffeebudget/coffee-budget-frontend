import '@testing-library/jest-dom';

// Extend the expect interface
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveBeenCalledWith(...args: any[]): R;
    }
  }
} 