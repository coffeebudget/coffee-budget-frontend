// Simple mock server that doesn't use MSW
export const server = {
  listen: () => {
    // No-op for Jest tests
  },
  resetHandlers: () => {
    // No-op for Jest tests
  },
  close: () => {
    // No-op for Jest tests
  }
}; 