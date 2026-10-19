import type { MappedPoint } from '../data.ts';

const CSV_HEADERS = [
  'place',
  'country',
  'latitude',
  'longitude',
  'value',
  'category',
  'date',
  'status',
];
const escapeCsv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export function createMappedCsv(points: MappedPoint[]): string {
  return [
    CSV_HEADERS.join(','),
    ...points.map((point) =>
      [
        point.place,
        point.country,
        point.lat ?? '',
        point.lng ?? '',
        point.value,
        point.category,
        point.date,
        point.status,
      ]
        .map(escapeCsv)
        .join(','),
    ),
  ].join('\n');
}

export function downloadMappedCsv(points: MappedPoint[]): void {
  const blob = new Blob([createMappedCsv(points)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'geoheat-mapped-data.csv';
  link.click();
  URL.revokeObjectURL(url);
}
