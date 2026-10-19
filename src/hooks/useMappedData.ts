import { useMemo } from 'react';
import { mapRows, type ColumnMapping, type RawRow } from '../data.ts';

export function useMappedData(
  rows: RawRow[],
  mapping: ColumnMapping,
  overrides: Record<string, { lat: number; lng: number; name: string }>,
) {
  const points = useMemo(
    () =>
      mapRows(rows, mapping).map((point) => {
        const key = `${point.place.trim().toLowerCase()}|${point.country.trim().toLowerCase()}`;
        const match = overrides[key];
        return point.status === 'unresolved' && match
          ? { ...point, lat: match.lat, lng: match.lng, status: 'ready' as const }
          : point;
      }),
    [rows, mapping, overrides],
  );
  const categories = useMemo(
    () => Array.from(new Set(points.map((point) => point.category))).sort(),
    [points],
  );
  const years = useMemo(
    () => Array.from(new Set(points.map((point) => point.year).filter(Boolean))).sort(),
    [points],
  );
  const pending = useMemo(
    () =>
      Array.from(
        new Map(
          points
            .filter((point) => point.status === 'unresolved')
            .map((point) => {
              const key = `${point.place.trim().toLowerCase()}|${point.country.trim().toLowerCase()}`;
              return [key, { key, place: point.place, country: point.country }];
            }),
        ).values(),
      ),
    [points],
  );
  return { points, categories, years, pending };
}
