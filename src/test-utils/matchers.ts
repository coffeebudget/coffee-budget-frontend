import { expect } from '@jest/globals';

// Custom matchers for better testing assertions
export const customMatchers = {
  toBeInTheDocument: (received: any) => {
    const pass = received && received.ownerDocument && received.ownerDocument.body.contains(received);
    return {
      pass,
      message: () => pass
        ? `Expected element not to be in the document`
        : `Expected element to be in the document`,
    };
  },

  toHaveTextContent: (received: any, expected: string | RegExp) => {
    const textContent = received?.textContent || '';
    const pass = typeof expected === 'string' 
      ? textContent.includes(expected)
      : expected.test(textContent);
    
    return {
      pass,
      message: () => pass
        ? `Expected element not to have text content "${expected}"`
        : `Expected element to have text content "${expected}", but got "${textContent}"`,
    };
  },

  toHaveClass: (received: any, expected: string) => {
    const classList = received?.classList || [];
    const pass = classList.contains(expected);
    
    return {
      pass,
      message: () => pass
        ? `Expected element not to have class "${expected}"`
        : `Expected element to have class "${expected}"`,
    };
  },

  toBeVisible: (received: any) => {
    if (!received) {
      return {
        pass: false,
        message: () => `Expected element to be visible, but it was null or undefined`,
      };
    }

    const style = window.getComputedStyle(received);
    const pass = style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 style.opacity !== '0' &&
                 received.offsetWidth > 0 &&
                 received.offsetHeight > 0;
    
    return {
      pass,
      message: () => pass
        ? `Expected element not to be visible`
        : `Expected element to be visible`,
    };
  },

  toHaveAttribute: (received: any, attribute: string, value?: string) => {
    if (!received) {
      return {
        pass: false,
        message: () => `Expected element to have attribute "${attribute}", but it was null or undefined`,
      };
    }

    const hasAttribute = received.hasAttribute(attribute);
    if (!hasAttribute) {
      return {
        pass: false,
        message: () => `Expected element to have attribute "${attribute}"`,
      };
    }

    if (value !== undefined) {
      const actualValue = received.getAttribute(attribute);
      const pass = actualValue === value;
      return {
        pass,
        message: () => pass
          ? `Expected element not to have attribute "${attribute}" with value "${value}"`
          : `Expected element to have attribute "${attribute}" with value "${value}", but got "${actualValue}"`,
      };
    }

    return {
      pass: true,
      message: () => `Expected element not to have attribute "${attribute}"`,
    };
  },

  toHaveDataTestId: (received: any, testId: string) => {
    return customMatchers.toHaveAttribute(received, 'data-testid', testId);
  },
};

// Extend Jest expect with custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(expected: string | RegExp): R;
      toHaveClass(expected: string): R;
      toBeVisible(): R;
      toHaveAttribute(attribute: string, value?: string): R;
      toHaveDataTestId(testId: string): R;
    }
  }
}

// Helper function to setup custom matchers
export const setupCustomMatchers = () => {
  expect.extend(customMatchers);
};
