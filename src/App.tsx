import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { Globe2, Layers3, Download, MapPin, AlertCircle, Search, Database } from 'lucide-react';
import { guessMapping, summarizePoints, type RawRow, type ColumnMapping } from './data';
import { isSearchRateLimitReady, searchPlace, type GeocodeResult } from './geocode';
import MapView from './components/MapView';
import WorkspaceSidebar from './components/WorkspaceSidebar';
import type { PaletteName } from './components/mapPalettes';
import { useMappedData } from './hooks/useMappedData';
import { filterPoints } from './data/filters';
import { parseDataFile } from './services/fileParsing';
import { downloadMappedCsv } from './services/csvExport';
import demoText from './demo.csv?raw';

const demo = Papa.parse<RawRow>(demoText, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: false,
}).data;
export default function App() {
  const [rows, setRows] = useState<RawRow[]>(demo);
  const [fileName, setFileName] = useState('Global research demo.csv');
  const [columns, setColumns] = useState<string[]>(Object.keys(demo[0]));
  const [mapping, setMapping] = useState<ColumnMapping>(guessMapping(Object.keys(demo[0])));
  const [selectedTab, setSelectedTab] = useState<'data' | 'mapping' | 'locations' | 'layers'>(
    'data',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overrides, setOverrides] = useState<
    Record<string, { lat: number; lng: number; name: string }>
  >({});
  const [queryKey, setQueryKey] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [heat, setHeat] = useState(true);
  const [markers, setMarkers] = useState(true);
  const [palette, setPalette] = useState<PaletteName>('plasma');
  const [radius, setRadius] = useState(24);
  const [blur, setBlur] = useState(20);
  const [basemap, setBasemap] = useState<'dark' | 'light'>('dark');
  const [category, setCategory] = useState('All');
  const [year, setYear] = useState('All');
  const [dragging, setDragging] = useState(false);
  const { points: mapped, categories, years, pending } = useMappedData(rows, mapping, overrides);
  const filtered = useMemo(() => filterPoints(mapped, category, year), [mapped, category, year]);
  const stats = summarizePoints(mapped);
  async function openFile(file?: File) {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const { rows: importedRows, headers } = await parseDataFile(file);
      setRows(importedRows);
      setColumns(headers);
      setMapping(guessMapping(headers));
      setFileName(file.name);
      setOverrides({});
      setCategory('All');
      setYear('All');
      setQueryKey('');
      setResults([]);
      setSelectedTab('mapping');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read the file');
    } finally {
      setLoading(false);
    }
  }
  function reset() {
    setRows(demo);
    setColumns(Object.keys(demo[0]));
    setMapping(guessMapping(Object.keys(demo[0])));
    setFileName('Global research demo.csv');
    setOverrides({});
    setError('');
    setCategory('All');
    setYear('All');
    setSelectedTab('data');
  }
  async function locate() {
    const target = pending.find((p) => p.key === queryKey);
    if (!target) return;
    if (!isSearchRateLimitReady()) {
      setSearchError('Please wait at least one second between searches.');
      return;
    }
    setSearching(true);
    setSearchError('');
    setResults([]);
    try {
      setResults(await searchPlace(target.place, target.country));
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }
  const exportCsv = () => downloadMappedCsv(filtered);
  const validMapping =
    mapping.mode === 'coordinates'
      ? Boolean(mapping.latitude && mapping.longitude)
      : Boolean(mapping.place);
  const sidebarProps = {
    selectedTab,
    setSelectedTab,
    loading,
    dragging,
    setDragging,
    openFile,
    error,
    rows,
    fileName,
    columns,
    reset,
    mapping,
    setMapping,
    setOverrides,
    stats,
    validMapping,
    pending,
    queryKey,
    setQueryKey,
    results,
    setResults,
    setSearchError,
    locate,
    searching,
    searchError,
    heat,
    setHeat,
    markers,
    setMarkers,
    palette,
    setPalette,
    radius,
    setRadius,
    blur,
    setBlur,
    basemap,
    setBasemap,
  };
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">
            <Globe2 size={22} />
          </span>
          <span>
            GeoHeat <b>Studio</b>
            <small>GEOSPATIAL WORKSPACE</small>
          </span>
        </div>
        <span className="version">MVP 0.1 · Client-side data processing</span>
        <button className="top-export" onClick={exportCsv}>
          <Download size={15} /> Export mapped CSV
        </button>
      </header>
      <div className="workspace">
        <WorkspaceSidebar {...sidebarProps} />
        <main className="main">
          <div className="main-top">
            <div>
              <span className="eyebrow">INTERACTIVE MAP VIEW</span>
              <h2>Geospatial overview</h2>
            </div>
            <div className="header-controls">
              <label>
                Category
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>All</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Year
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option>All</option>
                  {years.map((y) => (
                    <option key={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="map-shell">
            <MapView
              points={filtered}
              heat={heat}
              markers={markers}
              palette={palette}
              radius={radius}
              blur={blur}
              basemap={basemap}
            />
            <div className="map-caption">
              <Layers3 size={15} /> {heat ? 'HEATMAP' : 'MAP'} {markers ? '+ POINTS' : ''}{' '}
              <span>•</span> {filtered.filter((p) => p.status === 'ready').length} mapped rows
            </div>
            {filtered.filter((p) => p.status === 'ready').length === 0 && (
              <div className="map-empty">
                No mapped locations yet. Configure your columns or resolve places from the sidebar.
              </div>
            )}
          </div>
          <div className="bottom">
            <div className="stat-card">
              <span>
                <Database size={15} /> TOTAL RECORDS
              </span>
              <strong>{mapped.length.toLocaleString()}</strong>
              <small>Imported dataset</small>
            </div>
            <div className="stat-card">
              <span>
                <MapPin size={15} /> MAPPED RECORDS
              </span>
              <strong>{stats.ready.toLocaleString()}</strong>
              <small>Have valid coordinates</small>
            </div>
            <div className="stat-card">
              <span>
                <Search size={15} /> UNRESOLVED
              </span>
              <strong>{stats.unresolved.toLocaleString()}</strong>
              <small>Require place matching</small>
            </div>
            <div className="stat-card">
              <span>
                <AlertCircle size={15} /> INVALID
              </span>
              <strong>{stats.invalid.toLocaleString()}</strong>
              <small>Excluded from map</small>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
