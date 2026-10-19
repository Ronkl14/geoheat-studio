export type GeocodeResult = { display_name: string; lat: string; lon: string; type?: string };
// Nominatim public service is interactive/manual-only. Do not perform bulk or automatic calls.
export async function searchPlace(
  place: string,
  country: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const query = [place, country].filter(Boolean).join(', ');
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.searchParams.set('q', query);
  u.searchParams.set('format', 'jsonv2');
  u.searchParams.set('limit', '5');
  u.searchParams.set('addressdetails', '0');
  const res = await fetch(u.toString(), { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Place search failed (HTTP ${res.status}). Please try later.`);
  const json: unknown = await res.json();
  if (!Array.isArray(json)) throw new Error('Unexpected geocoding response');
  return json.filter(
    (r): r is GeocodeResult =>
      r &&
      typeof r === 'object' &&
      typeof r.display_name === 'string' &&
      typeof r.lat === 'string' &&
      typeof r.lon === 'string',
  );
}
