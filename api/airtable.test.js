import { describe, it, expect } from 'vitest';
import { sanitizeFields } from './airtable.js';

describe('sanitizeFields', () => {
  it('returns null for null input', () => {
    expect(sanitizeFields(null)).toBeNull();
  });

  it('returns null for array input', () => {
    expect(sanitizeFields([])).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(sanitizeFields('string')).toBeNull();
  });

  it('keeps only allowed fields', () => {
    const result = sanitizeFields({ Name: 'דני', unknownField: 'hack', __proto__: 'evil' });
    expect(result).toHaveProperty('Name', 'דני');
    expect(result).not.toHaveProperty('unknownField');
    expect(result).not.toHaveProperty('__proto__');
  });

  it('converts Name to string and limits to 2000 chars', () => {
    const long = 'א'.repeat(3000);
    const result = sanitizeFields({ Name: long });
    expect(result.Name).toHaveLength(2000);
  });

  it('accepts valid Status value', () => {
    const result = sanitizeFields({ Status: 'בטיפול' });
    expect(result.Status).toBe('בטיפול');
  });

  it('rejects invalid Status value', () => {
    const result = sanitizeFields({ Status: 'invalid_status' });
    expect(result).not.toHaveProperty('Status');
  });

  it('rejects all three invalid Status values', () => {
    ['admin', 'DROP TABLE', ''].forEach(bad => {
      const result = sanitizeFields({ Status: bad });
      expect(result).not.toHaveProperty('Status');
    });
  });

  it('coerces Quote Sent to boolean true', () => {
    expect(sanitizeFields({ 'Quote Sent': 1 })['Quote Sent']).toBe(true);
    expect(sanitizeFields({ 'Quote Sent': 'yes' })['Quote Sent']).toBe(true);
  });

  it('coerces Quote Sent to boolean false', () => {
    expect(sanitizeFields({ 'Quote Sent': 0 })['Quote Sent']).toBe(false);
    expect(sanitizeFields({ 'Quote Sent': '' })['Quote Sent']).toBe(false);
  });

  it('accepts Attachments as array', () => {
    const attachments = [{ url: 'https://example.com/file.pdf' }];
    const result = sanitizeFields({ Attachments: attachments });
    expect(result.Attachments).toEqual(attachments);
  });

  it('rejects Attachments that is not an array', () => {
    const result = sanitizeFields({ Attachments: 'not-an-array' });
    expect(result).not.toHaveProperty('Attachments');
  });

  it('converts Budget to number', () => {
    expect(sanitizeFields({ Budget: '5000' }).Budget).toBe(5000);
  });

  it('rejects non-numeric Budget', () => {
    expect(sanitizeFields({ Budget: 'abc' })).not.toHaveProperty('Budget');
  });

  it('converts Participants to number', () => {
    expect(sanitizeFields({ Participants: '50' }).Participants).toBe(50);
  });

  it('handles all valid Status values', () => {
    ['פניות חדשות', 'בטיפול', 'סגור'].forEach(status => {
      expect(sanitizeFields({ Status: status }).Status).toBe(status);
    });
  });

  it('returns empty object for empty input object', () => {
    expect(sanitizeFields({})).toEqual({});
  });
});
