import { afterEach, describe, expect, test } from 'bun:test';

import { clearAllMocks, mockModule } from '@/tests/mock';

describe('Mock', () => {
  afterEach(() => {
    clearAllMocks();
  });

  test('throws error when mocking a module twice', () => {
    mockModule('./data', () => ({}));
    expect(() => mockModule('./data', () => ({}))).toThrow(
      'Module "./data" is already mocked. Use force=true to overwrite.'
    );
  }, 15000);
});
