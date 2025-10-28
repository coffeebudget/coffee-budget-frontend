// src/test-utils/fixtures/tags.ts
export const mockTag = {
  id: 1,
  name: 'Test Tag',
  color: '#3b82f6',
  description: 'A test tag',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockTags = Array.from({ length: 5 }, (_, i) => ({
  ...mockTag,
  id: i + 1,
  name: `Tag ${i + 1}`,
  color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][i],
}));
