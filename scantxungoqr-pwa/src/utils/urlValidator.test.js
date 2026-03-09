import { describe, it, expect } from 'vitest';
import { isValidUrl } from './urlValidator';

describe('urlValidator', () => {
  it('should return true for valid HTTP and HTTPS URLs', () => {
    expect(isValidUrl('https://michelmacias-it.workers.dev')).toBe(true);
    expect(isValidUrl('http://www.google.com')).toBe(true);
    expect(isValidUrl('https://sub.domain.example.co.uk/path/to/thing?query=yes')).toBe(true);
  });

  it('should return false for strings that are not URLs', () => {
    expect(isValidUrl('Hola Mundo')).toBe(false);
    expect(isValidUrl('solo_un_string')).toBe(false);
    expect(isValidUrl('1234567890')).toBe(false);
  });

  it('should return false for invalid or unsupported protocol schemes', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
  });

  it('should return false for empty or null inputs', () => {
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl(null)).toBe(false);
    expect(isValidUrl(undefined)).toBe(false);
  });
});
