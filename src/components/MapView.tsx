import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet.heat';
import type { MappedPoint } from '../data';
import { palettes, type PaletteName } from './mapPalettes';
export type { PaletteName } from './mapPalettes';

type HeatLayer = L.Layer & { setOptions: (options: Record<string, unknown>) => void };
type HeatFactory = typeof L & {
  heatLayer: (points: [number, number, number][], options: Record<string, unknown>) => HeatLayer;
};
type Props = {
  points: MappedPoint[];
  heat: boolean;
  markers: boolean;
  palette: PaletteName;
  radius: number;
  blur: number;
  basemap: 'dark' | 'light';
};

export default function MapView({ points, heat, markers, palette, radius, blur, basemap }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tile = useRef<L.TileLayer | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);
  const heatLayer = useRef<HeatLayer | null>(null);
  const hasFitted = useRef(false);

  useEffect(() => {
    if (!root.current || map.current) return;
    map.current = L.map(root.current, { zoomControl: false }).setView([35, 12], 3);
    L.control.zoom({ position: 'bottomright' }).addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
      tile.current = null;
      markersLayer.current = null;
      heatLayer.current = null;
    };
  }, []);

  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap) return;
    tile.current?.remove();
    const layer =
      basemap === 'dark'
        ? 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution =
      basemap === 'dark'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>, tiles by <a href="https://hot.openstreetmap.org/">Humanitarian OpenStreetMap Team</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
    tile.current = L.tileLayer(layer, { attribution, maxZoom: 19 }).addTo(currentMap);
    return () => {
      tile.current?.remove();
    };
  }, [basemap]);

  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap) return;
    markersLayer.current?.remove();
    heatLayer.current?.remove();
    const good = points.filter(
      (point) => point.status === 'ready' && point.lat !== null && point.lng !== null,
    );
    if (heat && good.length) {
      const max = Math.max(1, ...good.map((point) => point.value));
      heatLayer.current = (L as HeatFactory)
        .heatLayer(
          good.map((point) => [point.lat!, point.lng!, Math.max(0, point.value) / max]),
          { radius, blur, maxZoom: 12, gradient: palettes[palette].colors },
        )
        .addTo(currentMap);
    }
    if (markers) {
      const group = L.layerGroup();
      good.forEach((point) => {
        const marker = L.circleMarker([point.lat!, point.lng!], {
          radius: 5,
          weight: 1,
          color: '#d7e6ff',
          fillColor: '#a3d6d2',
          fillOpacity: 0.95,
        });
        const popup = document.createElement('div');
        const heading = document.createElement('strong');
        heading.textContent = point.place || `Record ${point.id}`;
        popup.appendChild(heading);
        (
          [
            ['Value', String(point.value)],
            ['Category', point.category],
            ['Date', point.date],
          ] as const
        )
          .filter(([, value]) => value)
          .forEach(([label, value]) => {
            const line = document.createElement('div');
            line.textContent = `${label}: ${value}`;
            popup.appendChild(line);
          });
        marker.bindPopup(popup).addTo(group);
      });
      group.addTo(currentMap);
      markersLayer.current = group;
    }
  }, [points, heat, markers, palette, radius, blur]);

  useEffect(() => {
    const currentMap = map.current;
    const good = points.filter(
      (point) => point.status === 'ready' && point.lat !== null && point.lng !== null,
    );
    if (!currentMap || !good.length) return;
    const bounds = L.latLngBounds(good.map((point) => [point.lat!, point.lng!]));
    if (bounds.isValid()) {
      currentMap.fitBounds(bounds.pad(0.24), { maxZoom: 11, animate: hasFitted.current });
      hasFitted.current = true;
    }
  }, [points]);

  return <div id="map" ref={root} aria-label="Interactive geospatial map" />;
}
