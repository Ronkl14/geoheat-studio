import test from 'node:test';
import assert from 'node:assert/strict';
import { createMappedCsv } from '../src/services/csvExport.ts';
import { parseDataFile } from '../src/services/fileParsing.ts';
import { filterPoints } from '../src/data/filters.ts';

test('CSV export quotes commas and escapes embedded quotes', () => {
  const csv = createMappedCsv([
    {
      id: 1,
      lat: 31.5,
      lng: 34.8,
      place: 'Tel Aviv, "Center"',
      country: 'Israel',
      value: 2,
      category: 'Cases',
      date: '2024',
      year: '2024',
      status: 'ready',
    },
  ]);
  assert.match(csv, /"Tel Aviv, ""Center"""/);
  assert.match(csv, /"31\.5","34\.8"/);
});

test('CSV parsing validates headers and preserves values as strings', async () => {
  const file = new File(['latitude,longitude,value\n31.5,34.8,0012'], 'sample.csv');
  const parsed = await parseDataFile(file);
  assert.deepEqual(parsed.headers, ['latitude', 'longitude', 'value']);
  assert.equal(parsed.rows[0].value, '0012');
});

test('CSV parsing rejects duplicate and empty headers', async () => {
  await assert.rejects(
    parseDataFile(new File(['lat,lat\n1,2'], 'duplicate.csv')),
    /Duplicate column/,
  );
  await assert.rejects(parseDataFile(new File(['lat,\n1,2'], 'empty.csv')), /empty column names/);
});

test('filters combine category and year and support All selections', () => {
  const points = [
    {
      id: 1,
      lat: 1,
      lng: 1,
      place: '',
      country: '',
      value: 1,
      category: 'A',
      date: '',
      year: '2023',
      status: 'ready',
    },
    {
      id: 2,
      lat: 2,
      lng: 2,
      place: '',
      country: '',
      value: 1,
      category: 'B',
      date: '',
      year: '2024',
      status: 'ready',
    },
    {
      id: 3,
      lat: 3,
      lng: 3,
      place: '',
      country: '',
      value: 1,
      category: 'A',
      date: '',
      year: '2024',
      status: 'ready',
    },
  ];
  assert.deepEqual(
    filterPoints(points, 'A', '2024').map((point) => point.id),
    [3],
  );
  assert.equal(filterPoints(points, 'All', 'All').length, 3);
  assert.equal(filterPoints(points, 'B', 'All').length, 1);
});
