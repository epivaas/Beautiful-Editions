import { describe, it, expect } from 'vitest';
import { compareField, variantChips, variantFacts, SAME_AS_EDITION } from '../app/lib/variantPage';
import type { EditionSubRow } from '../app/lib/editionPage';

function sub(id: number, extra: Partial<EditionSubRow> = {}): EditionSubRow {
  return {
    id,
    impression_label: null,
    sequence_number: null,
    catalogue_number: null,
    isbn: null,
    binding_type: null,
    size_dimensions: null,
    typeface: null,
    slipcase: false,
    dustjacket: false,
    clamshell: false,
    is_limited_edition: true,
    limited_edition_count: null,
    limited_state: null,
    publisher_url: null,
    details: null,
    photos: null,
    ...extra,
  };
}

const edition = {
  binding_type: 'Quarter leather, cloth boards',
  size_dimensions: '6 in x 9 in',
  typeface: 'Caslon',
  pages_description: 'Pp. 388',
  printer: null,
  binder: 'Smith Settle',
  publisher_url: 'https://example.com/edition',
};

describe('compareField', () => {
  it('shows a different value with the edition value under it', () => {
    expect(compareField('Full leather', 'Cloth')).toEqual({ value: 'Full leather', note: 'Edition: Cloth' });
  });

  it('says "Same as edition" for equal values (ignoring case and spaces) and for no own value', () => {
    expect(compareField('caslon ', 'Caslon')).toEqual({ value: 'Caslon', note: SAME_AS_EDITION });
    expect(compareField(null, 'Caslon')).toEqual({ value: 'Caslon', note: SAME_AS_EDITION });
  });

  it('keeps an own value when the edition has none, and drops the field when both are empty', () => {
    expect(compareField('Full leather', null)).toEqual({ value: 'Full leather', note: null });
    expect(compareField(null, '')).toBeNull();
  });
});

describe('variantFacts', () => {
  const facts = variantFacts(
    sub(1, {
      limited_edition_count: 26,
      limited_state: { name: 'Lettered', sort_order: 10 },
      binding_type: 'Full leather',
      typeface: 'Caslon',
      catalogue_number: '3.2',
    }),
    edition
  );
  const byLabel = Object.fromEntries(facts.map((f) => [f.label, f]));

  it('lists copies, kind and the compared fields; empty fields drop out', () => {
    expect(facts.map((f) => f.label)).toEqual([
      'Copies',
      'Kind',
      'Binding',
      'Format',
      'Typeface',
      'Pages',
      'Binder',
      'Catalogue no.',
      "Publisher's page",
    ]);
    expect(byLabel.Copies.value).toBe('Edition of 26');
    expect(byLabel.Binding.note).toBe('Edition: Quarter leather, cloth boards');
    expect(byLabel.Typeface.note).toBe(SAME_AS_EDITION);
  });

  it('shows the fields only an edition has as "Same as edition"', () => {
    expect(byLabel.Pages).toMatchObject({ value: 'Pp. 388', note: SAME_AS_EDITION, mono: true });
    expect(byLabel.Binder.note).toBe(SAME_AS_EDITION);
  });

  it('never takes the catalogue number or ISBN from the edition, but does take the publisher link', () => {
    expect(byLabel['Catalogue no.']).toMatchObject({ value: '3.2', note: null });
    expect(byLabel.ISBN).toBeUndefined();
    expect(byLabel["Publisher's page"]).toMatchObject({ href: 'https://example.com/edition', note: SAME_AS_EDITION });
  });
});

describe('variantChips', () => {
  const subs = [
    sub(3, { limited_state: { name: 'Numbered', sort_order: 20 }, limited_edition_count: 250 }),
    sub(2, { limited_state: { name: 'Lettered', sort_order: 10 }, limited_edition_count: 26 }),
    sub(4, { is_limited_edition: false, impression_label: 'Second printing' }),
    sub(5, { limited_state: { name: 'Named Edition', sort_order: 90 }, impression_label: 'Hyde Edition: black covers' }),
  ];

  it('lists the limited variants by kind with short names, the current one selected', () => {
    expect(variantChips(subs, 3)).toEqual([
      { id: 2, name: 'Lettered', count: 26, href: '/sub-editions/2', selected: false },
      { id: 3, name: 'Numbered', count: 250, href: '/sub-editions/3', selected: true },
      { id: 5, name: 'Hyde', count: undefined, href: '/sub-editions/5', selected: false },
    ]);
  });

  it('shows no chips for a single variant', () => {
    expect(variantChips([subs[0], subs[2]], 3)).toEqual([]);
  });
});
