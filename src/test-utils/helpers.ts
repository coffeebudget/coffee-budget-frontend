import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Common testing helpers for consistent test operations

/**
 * Wait for an element to appear in the DOM
 */
export const waitForElement = async (testId: string, timeout = 5000) => {
  return await waitFor(
    () => screen.getByTestId(testId),
    { timeout }
  );
};

/**
 * Wait for an element to disappear from the DOM
 */
export const waitForElementToDisappear = async (testId: string, timeout = 5000) => {
  return await waitFor(
    () => {
      const element = screen.queryByTestId(testId);
      if (element) {
        throw new Error(`Element with testId "${testId}" is still present`);
      }
    },
    { timeout }
  );
};

/**
 * Get an element by test ID with error handling
 */
export const getByTestId = (testId: string) => {
  const element = screen.getByTestId(testId);
  if (!element) {
    throw new Error(`Element with data-testid="${testId}" not found`);
  }
  return element;
};

/**
 * Get multiple elements by test ID
 */
export const getAllByTestId = (testId: string) => {
  return screen.getAllByTestId(testId);
};

/**
 * Find an element within a container
 */
export const getByTestIdWithin = (container: HTMLElement, testId: string) => {
  return within(container).getByTestId(testId);
};

/**
 * Click an element by test ID
 */
export const clickByTestId = async (testId: string) => {
  const element = getByTestId(testId);
  await userEvent.click(element);
  return element;
};

/**
 * Type text into an input by test ID
 */
export const typeByTestId = async (testId: string, text: string) => {
  const element = getByTestId(testId) as HTMLInputElement;
  await userEvent.clear(element);
  await userEvent.type(element, text);
  return element;
};

/**
 * Select an option from a select element by test ID
 */
export const selectByTestId = async (testId: string, optionText: string) => {
  const selectElement = getByTestId(testId) as HTMLSelectElement;
  await userEvent.selectOptions(selectElement, optionText);
  return selectElement;
};

/**
 * Check if an element is visible
 */
export const isVisible = (testId: string) => {
  const element = screen.queryByTestId(testId);
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         element.offsetWidth > 0 &&
         element.offsetHeight > 0;
};

/**
 * Get text content of an element by test ID
 */
export const getTextByTestId = (testId: string) => {
  const element = getByTestId(testId);
  return element.textContent;
};

/**
 * Check if an element has a specific class
 */
export const hasClass = (testId: string, className: string) => {
  const element = getByTestId(testId);
  return element.classList.contains(className);
};

/**
 * Check if an element has a specific attribute
 */
export const hasAttribute = (testId: string, attribute: string, value?: string) => {
  const element = getByTestId(testId);
  const hasAttr = element.hasAttribute(attribute);
  
  if (!hasAttr) return false;
  if (value === undefined) return true;
  
  return element.getAttribute(attribute) === value;
};

/**
 * Wait for text to appear in the DOM
 */
export const waitForText = async (text: string | RegExp, timeout = 5000) => {
  return await waitFor(
    () => screen.getByText(text),
    { timeout }
  );
};

/**
 * Wait for text to disappear from the DOM
 */
export const waitForTextToDisappear = async (text: string | RegExp, timeout = 5000) => {
  return await waitFor(
    () => {
      const element = screen.queryByText(text);
      if (element) {
        throw new Error(`Text "${text}" is still present`);
      }
    },
    { timeout }
  );
};

/**
 * Mock console methods for testing
 */
export const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
};

/**
 * Restore console methods
 */
export const restoreConsole = () => {
  jest.restoreAllMocks();
};

/**
 * Create a mock function with default implementation
 */
export const createMockFunction = <T extends (...args: any[]) => any>(
  implementation?: T
): jest.MockedFunction<T> => {
  return jest.fn(implementation) as unknown as jest.MockedFunction<T>;
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = async (ms = 0) => {
  await new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Create a test user event instance
 */
export const createUserEvent = () => {
  return userEvent.setup();
};

/**
 * Simulate a form submission
 */
export const submitForm = async (formTestId: string) => {
  const form = getByTestId(formTestId);
  const submitButton = within(form).getByRole('button', { name: /submit|save|create|update/i });
  await userEvent.click(submitButton);
  return form;
};

/**
 * Fill a form with data
 */
export const fillForm = async (formData: Record<string, string>) => {
  const user = createUserEvent();
  
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
    await user.clear(field);
    await user.type(field, value);
  }
  
  return user;
};

/**
 * Check if an element is focused
 */
export const isFocused = (testId: string) => {
  const element = getByTestId(testId);
  return document.activeElement === element;
};

/**
 * Focus an element by test ID
 */
export const focusByTestId = async (testId: string) => {
  const element = getByTestId(testId);
  element.focus();
  return element;
};
