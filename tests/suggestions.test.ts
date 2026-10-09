import { describe, it, expect } from 'vitest';
import { checkSuggestion, senderLabel, timeAgo } from '../app/lib/suggestions';

const now = 1_000_000_000_000;
const base = { pagePath: '/edition/78', pageLabel: 'Aucassin', kind: 'correction', body: 'The binding is quarter cloth.', openedAt: now - 10_000 };

describe('checkSuggestion', () => {
  it('accepts a plain suggestion and cleans it', () => {
    const r = checkSuggestion({ ...base, body: '  The binding is quarter cloth.  ', name: '', email: '' }, now);
    expect(r).toEqual({
      ok: true,
      row: {
        page_path: '/edition/78',
        page_label: 'Aucassin',
        field: null,
        kind: 'correction',
        body: 'The binding is quarter cloth.',
        name: null,
        email: null,
        wants_credit: false,
      },
    });
  });

  it('asks for a kind, some text and a page', () => {
    expect(checkSuggestion({ ...base, kind: 'praise' }, now)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(checkSuggestion({ ...base, body: 'ok' }, now)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(checkSuggestion({ ...base, pagePath: 'https://evil.example' }, now)).toMatchObject({ ok: false, reason: 'invalid' });
  });

  it('needs a name and a valid e-mail address for credit', () => {
    expect(checkSuggestion({ ...base, credit: true, email: 'a@b.be' }, now)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(checkSuggestion({ ...base, credit: true, name: 'Jan' }, now)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(checkSuggestion({ ...base, credit: true, name: 'Jan', email: 'not-an-address' }, now)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(checkSuggestion({ ...base, credit: true, name: 'Jan', email: 'jan@example.be' }, now)).toMatchObject({
      ok: true,
      row: { wants_credit: true, name: 'Jan' },
    });
  });

  it('treats the hidden field, a hurried form and too many links as spam', () => {
    expect(checkSuggestion({ ...base, website: 'http://spam' }, now)).toEqual({ ok: false, reason: 'spam' });
    expect(checkSuggestion({ ...base, openedAt: now - 1000 }, now)).toEqual({ ok: false, reason: 'spam' });
    expect(checkSuggestion({ ...base, openedAt: undefined }, now)).toEqual({ ok: false, reason: 'spam' });
    expect(checkSuggestion({ ...base, body: 'See https://a.example and https://b.example' }, now)).toEqual({ ok: false, reason: 'spam' });
  });

  it('allows two links for a photograph: the photo and its source', () => {
    expect(checkSuggestion({ ...base, kind: 'photograph', body: 'Photo https://a.example source https://b.example' }, now)).toMatchObject({ ok: true });
  });
});

describe('timeAgo and senderLabel', () => {
  const t = new Date('2026-10-09T12:00:00Z');
  it('says how long ago', () => {
    expect(timeAgo(new Date('2026-10-09T11:48:00Z'), t)).toBe('12 min ago');
    expect(timeAgo(new Date('2026-10-09T10:00:00Z'), t)).toBe('2 h ago');
    expect(timeAgo(new Date('2026-10-08T09:00:00Z'), t)).toBe('Yesterday');
    expect(timeAgo(new Date('2026-09-01T09:00:00Z'), t)).toBe('1 Sept 2026');
  });

  it('shows the sender, never the e-mail address', () => {
    expect(senderLabel({ name: null, wants_credit: false, email_verified: false })).toBe('Anonymous');
    expect(senderLabel({ name: 'Jan Peeters', wants_credit: true, email_verified: false })).toBe('Jan Peeters (not verified)');
  });
});
