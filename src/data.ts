export type RawRow = Record<string, unknown>;
export type ColumnMapping = {
  mode: 'coordinates' | 'places';
  latitude: string;
  longitude: string;
  place: string;
  country: string;
  value: string;
  category: string;
  date: string;
};
export type MappedPoint = {
  id: number;
  lat: number | null;
  lng: number | null;
  place: string;
  country: string;
  value: number;
  category: string;
  date: string;
  year: string;
  status: 'ready' | 'unresolved' | 'invalid';
};
const aliases: Record<string, string[]> = {
  latitude: ['latitude', 'lat', 'y'],
  longitude: ['longitude', 'lon', 'lng', 'long', 'x'],
  place: [
    'place',
    'city',
    'location',
    'town',
    'settlement',
    'locality',
    'municipality',
    'place of collection',
  ],
  country: ['country', 'country code', 'nation'],
  value: ['value', 'count', 'cases', 'intensity', 'weight', 'quantity'],
  category: ['category', 'species', 'animal species', 'type', 'group'],
  date: ['date', 'year', 'collection date', 'date of sample collection'],
};
export function guessMapping(headers: string[]): ColumnMapping {
  const get = (field: string) =>
    headers.find((h) => aliases[field].includes(h.trim().toLowerCase())) || '';
  const latitude = get('latitude'),
    longitude = get('longitude');
  return {
    mode: latitude && longitude ? 'coordinates' : 'places',
    latitude,
    longitude,
    place: get('place'),
    country: get('country'),
    value: get('value'),
    category: get('category'),
    date: get('date'),
  };
}
export function parseNumber(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  const s = String(input ?? '').trim();
  if (!s) return null;
  const normalized = s.replace(/\s/g, '').replace(/,/g, '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
export function asYear(input: unknown): string {
  if (input instanceof Date && !Number.isNaN(input.getTime())) return String(input.getFullYear());
  const s = String(input ?? '').trim();
  const y = s.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/);
  return y ? y[1] : '';
}
export function mapRows(rows: RawRow[], mapping: ColumnMapping): MappedPoint[] {
  return rows.map((r, i) => {
    const lat = mapping.mode === 'coordinates' ? parseNumber(r[mapping.latitude]) : null;
    const lng = mapping.mode === 'coordinates' ? parseNumber(r[mapping.longitude]) : null;
    const place = String(mapping.place ? (r[mapping.place] ?? '') : '').trim();
    const country = String(mapping.country ? (r[mapping.country] ?? '') : '').trim();
    const rawValue = mapping.value ? parseNumber(r[mapping.value]) : 1;
    const value = rawValue ?? 0;
    const status =
      mapping.mode === 'coordinates'
        ? lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
          ? 'ready'
          : 'invalid'
        : place
          ? 'unresolved'
          : 'invalid';
    return {
      id: i + 1,
      lat,
      lng,
      place,
      country,
      value,
      category: String(mapping.category ? (r[mapping.category] ?? '') : '').trim() || 'All records',
      date: String(mapping.date ? (r[mapping.date] ?? '') : '').trim(),
      year: asYear(mapping.date ? r[mapping.date] : ''),
      status,
    };
  });
}
export function summarizePoints(points: MappedPoint[]) {
  return {
    total: points.length,
    ready: points.filter((p) => p.status === 'ready').length,
    unresolved: points.filter((p) => p.status === 'unresolved').length,
    invalid: points.filter((p) => p.status === 'invalid').length,
  };
}
