import test from 'node:test';
import assert from 'node:assert/strict';
import { guessMapping, mapRows, summarizePoints, parseNumber, asYear } from '../src/data.ts';
test('recognizes geographic aliases', () => {
  const g = guessMapping(['City', 'Latitude', 'lng', 'count', 'year']);
  assert.equal(g.mode, 'coordinates');
  assert.equal(g.place, 'City');
  assert.equal(g.longitude, 'lng');
});
test('rejects invalid geographical coordinates', () => {
  const rows = [
    { lat: 32, lon: 35 },
    { lat: 100, lon: 1 },
    { lat: '', lon: 2 },
  ];
  const map = guessMapping(['lat', 'lon']);
  assert.deepEqual(summarizePoints(mapRows(rows, map)), {
    total: 3,
    ready: 1,
    unresolved: 0,
    invalid: 2,
  });
});
test('place mode does not invent coordinates', () => {
  const m = guessMapping(['city', 'country']);
  const points = mapRows(
    [
      { city: 'Paris', country: 'France' },
      { city: '', country: 'France' },
    ],
    m,
  );
  assert.equal(points[0].status, 'unresolved');
  assert.equal(points[1].status, 'invalid');
});
test('values, date parsing', () => {
  assert.equal(parseNumber('12,5'), 12.5);
  assert.equal(parseNumber('not numeric'), null);
  assert.equal(asYear('2024-06-03'), '2024');
});
