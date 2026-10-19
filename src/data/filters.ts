import type { MappedPoint } from '../data.ts';

export function filterPoints(points: MappedPoint[], category: string, year: string): MappedPoint[] {
  return points.filter(
    (point) =>
      (category === 'All' || point.category === category) &&
      (year === 'All' || point.year === year),
  );
}
