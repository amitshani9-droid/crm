import { describe, it, expect } from 'vitest';
import { sanitizePhone, isValidIsraeliPhone } from './airtable.js';

describe('sanitizePhone', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizePhone('')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(sanitizePhone(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizePhone(undefined)).toBe('');
  });

  it('returns number as-is when already valid local format', () => {
    expect(sanitizePhone('0541234567')).toBe('0541234567');
  });

  it('strips non-digit characters', () => {
    expect(sanitizePhone('054-123-4567')).toBe('0541234567');
  });

  it('strips spaces', () => {
    expect(sanitizePhone('054 123 4567')).toBe('0541234567');
  });

  it('converts 972 prefix to leading 0', () => {
    expect(sanitizePhone('972541234567')).toBe('0541234567');
  });

  it('converts +972 prefix to leading 0', () => {
    expect(sanitizePhone('+972541234567')).toBe('0541234567');
  });

  it('adds leading 0 to number starting with 5', () => {
    expect(sanitizePhone('541234567')).toBe('0541234567');
  });

  it('strips decimal point from numeric input (e.g. from Excel)', () => {
    expect(sanitizePhone('541234567.0')).toBe('0541234567');
  });
});

describe('isValidIsraeliPhone', () => {
  it('returns false for empty string', () => {
    expect(isValidIsraeliPhone('')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidIsraeliPhone(null)).toBe(false);
  });

  it('returns true for valid mobile number (05X)', () => {
    expect(isValidIsraeliPhone('0541234567')).toBe(true);
  });

  it('returns true for valid mobile with dashes', () => {
    expect(isValidIsraeliPhone('054-123-4567')).toBe(true);
  });

  it('returns true for valid landline (02)', () => {
    expect(isValidIsraeliPhone('021234567')).toBe(true);
  });

  it('returns true for valid landline (03)', () => {
    expect(isValidIsraeliPhone('031234567')).toBe(true);
  });

  it('returns true for valid landline (08)', () => {
    expect(isValidIsraeliPhone('081234567')).toBe(true);
  });

  it('returns false for number that is too short', () => {
    expect(isValidIsraeliPhone('054123456')).toBe(false);
  });

  it('returns false for number that is too long', () => {
    expect(isValidIsraeliPhone('05412345678')).toBe(false);
  });

  it('returns false for invalid prefix (06)', () => {
    expect(isValidIsraeliPhone('061234567')).toBe(false);
  });

  it('returns false for invalid prefix (07)', () => {
    expect(isValidIsraeliPhone('071234567')).toBe(false);
  });

  it('returns true for 972 international format', () => {
    expect(isValidIsraeliPhone('972541234567')).toBe(true);
  });
});
