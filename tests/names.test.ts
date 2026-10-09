import { describe, it, expect } from 'vitest';
import { joinNames } from '../app/lib/names';

describe('joinNames', () => {
  it('separates people with a semicolon, keeping the comma inside a name', () => {
    expect(joinNames(['Doré, Gustave', 'Rackham, Arthur'])).toBe('Doré, Gustave; Rackham, Arthur');
    expect(joinNames(['Homer'])).toBe('Homer');
    expect(joinNames([])).toBe('');
  });
});
