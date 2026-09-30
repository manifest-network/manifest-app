import { describe, expect, test } from 'bun:test';

import { mockDenomMeta1, mockOneUnitDenomMeta } from '@/tests/data';
import { formatAmount, formatLargeNumber, getDisplayExponent, getDisplayUnit } from '@/utils';

describe('formatLargeNumber', () => {
  test('should work', () => {
    expect(formatLargeNumber(1234)).toBe('1,234');
    expect(formatLargeNumber(12345678)).toBe('12.35M');

    // Small
    expect(formatLargeNumber(0.001)).toBe('0.001');
    expect(formatLargeNumber(0.00001)).toBe('0.00001');
    expect(formatLargeNumber(0.0000123456789)).toBe('0.000012');
    expect(formatLargeNumber(0.000000123456789)).toBe('0');

    // And large
    expect(formatLargeNumber(1e15)).toBe('1Q');
    expect(formatLargeNumber(1e18)).toBe('1QT');
    expect(formatLargeNumber(1e19)).toBe('10QT');
    expect(formatLargeNumber(1e20)).toBe('100QT');
    expect(formatLargeNumber(1.2345678e20)).toBe('123.46QT');
    expect(formatLargeNumber(1e24)).toBe('1e24');
    expect(formatLargeNumber(1e60)).toBe('1e60');
    expect(formatLargeNumber(1.23456789e24)).toBe('1.234568e24');
  });
});

const units = (...pairs: [string, number][]) =>
  pairs.map(([denom, exponent]) => ({ denom, exponent, aliases: [] }));

describe('getDisplayUnit', () => {
  test('uses the unit named by display', () => {
    expect(getDisplayUnit({ display: 'mfx', denom_units: units(['umfx', 0], ['mfx', 6]) })).toEqual(
      { denom: 'mfx', exponent: 6 }
    );
    // The display unit need not be the last one.
    expect(
      getDisplayUnit({ display: 'mtok', denom_units: units(['utok', 0], ['mtok', 3], ['tok', 6]) })
    ).toEqual({ denom: 'mtok', exponent: 3 });
  });

  test('gives one-unit metadata (the tokenfactory default) exponent 0', () => {
    expect(getDisplayUnit(mockOneUnitDenomMeta)).toEqual({
      denom: mockOneUnitDenomMeta.base,
      exponent: 0,
    });
    expect(getDisplayExponent({ ...mockOneUnitDenomMeta, display: '' })).toBe(0);
  });

  test('keeps an exponent of 0 on the display unit', () => {
    expect(
      getDisplayExponent({ display: 'utok', denom_units: units(['utok', 0], ['tok', 6]) })
    ).toBe(0);
  });

  test('falls back to the largest exponent when display names no unit', () => {
    // mockDenomMeta1.display is 'Token 1'; its units are utoken1 (0) and token1 (6).
    expect(getDisplayUnit(mockDenomMeta1)).toEqual({ denom: 'token1', exponent: 6 });
  });

  test('assumes 6 without metadata or units', () => {
    expect(getDisplayUnit(undefined)).toEqual({ exponent: 6 });
    expect(getDisplayUnit(null)).toEqual({ exponent: 6 });
    expect(getDisplayExponent({ display: 'tok', denom_units: [] })).toBe(6);
  });
});

describe('formatAmount', () => {
  test('shifts by the display exponent of the matching metadata', () => {
    const metadata = [mockDenomMeta1, mockOneUnitDenomMeta];
    expect(formatAmount('1500000', mockDenomMeta1.base, metadata)).toBe(1.5);
    // One-unit metadata: amounts are already in display units.
    expect(formatAmount('5000000', mockOneUnitDenomMeta.base, metadata)).toBe(5000000);
    // No metadata for the denom: assume 6.
    expect(formatAmount('1500000', 'uunknown', metadata)).toBe(1.5);
  });
});
