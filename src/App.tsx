import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  UploadCloud,
  Globe2,
  Layers3,
  Download,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  ArrowRight,
  Database,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { guessMapping, summarizePoints, type RawRow, type ColumnMapping } from './data';
import { searchPlace, type GeocodeResult } from './geocode';
import MapView from './components/MapView';
import { palettes, type PaletteName } from './components/mapPalettes';
import { useMappedData } from './hooks/useMappedData';
import { filterPoints } from './data/filters';
import { parseDataFile } from './services/fileParsing';
import { downloadMappedCsv } from './services/csvExport';
import demoText from './demo.csv?raw';

const COLUMNS: { key: keyof Omit<ColumnMapping, 'mode'>; title: string; hint: string }[] = [
  { key: 'latitude', title: 'Latitude', hint: 'Required in coordinate mode' },
  { key: 'longitude', title: 'Longitude', hint: 'Required in coordinate mode' },
  { key: 'place', title: 'Place / locality', hint: 'Required in place mode' },
  { key: 'country', title: 'Country / region', hint: 'Improves name matching' },
  { key: 'value', title: 'Numeric value', hint: 'Defaults to 1 per row' },
  { key: 'category', title: 'Category', hint: 'Optional filter' },
  { key: 'date', title: 'Date / year', hint: 'Optional filter' },
];
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
  const [lastSearch, setLastSearch] = useState(0);
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
    const now = Date.now();
    if (now - lastSearch < 1100) {
      setSearchError('Please wait at least one second between searches.');
      return;
    }
    setLastSearch(now);
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
        <aside className="sidebar">
          <div className="sidebar-head">
            <div className="kicker">YOUR WORKSPACE</div>
            <h1>Data to map.</h1>
            <p>Upload a spreadsheet, configure locations, and explore your data geographically.</p>
          </div>
          <div className="tabs" role="tablist">
            {(['data', 'mapping', 'locations', 'layers'] as const).map((t, i) => (
              <button
                key={t}
                className={selectedTab === t ? 'tab active' : 'tab'}
                onClick={() => setSelectedTab(t)}
              >
                <span>0{i + 1}</span>
                {t === 'data'
                  ? 'Data'
                  : t === 'mapping'
                    ? 'Columns'
                    : t === 'locations'
                      ? 'Locations'
                      : 'Layers'}
              </button>
            ))}
          </div>
          <div className="side-content">
            {selectedTab === 'data' && (
              <>
                <h2>Import dataset</h2>
                <div
                  className={`drop ${dragging ? 'drag' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    openFile(e.dataTransfer.files[0]);
                  }}
                >
                  <UploadCloud size={25} />
                  <strong>{loading ? 'Reading spreadsheet…' : 'Drag CSV or XLSX here'}</strong>
                  <span>Or choose a file from your device</span>
                  <label className="file-btn">
                    Browse files
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      onChange={(e) => {
                        openFile(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                {error && (
                  <div className="error">
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}
                <div className="dataset">
                  <FileSpreadsheet size={18} />
                  <div>
                    <strong>{fileName}</strong>
                    <span>
                      {rows.length.toLocaleString()} records · {columns.length} columns
                    </span>
                  </div>
                  <button title="Reset to demo" onClick={reset}>
                    <RotateCcw size={15} />
                  </button>
                </div>
                <p className="note">
                  <ShieldCheck size={14} /> Uploaded spreadsheets are parsed locally in your
                  browser. Place searches send only the selected place name to OpenStreetMap's
                  search service.
                </p>
                <button className="primary full" onClick={() => setSelectedTab('mapping')}>
                  Configure columns <ArrowRight size={16} />
                </button>
                <h2 className="small-heading">Preview</h2>
                <div className="data-preview">
                  <table>
                    <thead>
                      <tr>
                        {columns.slice(0, 3).map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 4).map((r, i) => (
                        <tr key={i}>
                          {columns.slice(0, 3).map((h) => (
                            <td key={h}>{String(r[h] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {selectedTab === 'mapping' && (
              <>
                <h2>Column mapping</h2>
                <p className="helper">
                  Match your spreadsheet's fields to map concepts. No fixed schema required.
                </p>
                <div className="segmented">
                  <button
                    className={mapping.mode === 'coordinates' ? 'on' : ''}
                    onClick={() => setMapping((m) => ({ ...m, mode: 'coordinates' }))}
                  >
                    Coordinates
                  </button>
                  <button
                    className={mapping.mode === 'places' ? 'on' : ''}
                    onClick={() => setMapping((m) => ({ ...m, mode: 'places' }))}
                  >
                    Place names
                  </button>
                </div>
                {COLUMNS.filter((c) =>
                  mapping.mode === 'coordinates'
                    ? !['country'].includes(c.key)
                    : !['latitude', 'longitude'].includes(c.key),
                ).map((c) => (
                  <label className="field" key={c.key}>
                    <span>
                      {c.title}
                      <small>{c.hint}</small>
                    </span>
                    <select
                      value={mapping[c.key]}
                      onChange={(e) => {
                        setMapping((m) => ({ ...m, [c.key]: e.target.value }));
                        setOverrides({});
                      }}
                    >
                      <option value="">Not mapped</option>
                      {columns.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <div className="summaryline">
                  <span className={validMapping ? 'valid' : 'invalid'}>
                    {validMapping ? 'Mapping ready' : 'Select required fields'}
                  </span>
                  <span>
                    {stats.ready} mapped / {stats.unresolved} pending / {stats.invalid} invalid
                  </span>
                </div>
                {mapping.mode === 'places' && (
                  <button className="primary full" onClick={() => setSelectedTab('locations')}>
                    Resolve place names <ArrowRight size={16} />
                  </button>
                )}
              </>
            )}
            {selectedTab === 'locations' && (
              <>
                <h2>Location resolution</h2>
                <p className="helper">
                  For place-name datasets, review one location at a time. Nothing is assigned
                  automatically.
                </p>
                <div className="metrics-mini">
                  <span>
                    <b>{stats.ready}</b> mapped
                  </span>
                  <span>
                    <b>{pending.length}</b> unique unresolved
                  </span>
                  <span>
                    <b>{stats.invalid}</b> invalid rows
                  </span>
                </div>
                {mapping.mode === 'coordinates' ? (
                  <div className="tip">
                    Coordinate mode is active. Invalid rows must be corrected in the spreadsheet.
                  </div>
                ) : pending.length === 0 ? (
                  <div className="success">
                    <CheckCircle2 size={18} /> All named places resolved, or no valid places found.
                  </div>
                ) : (
                  <>
                    <label className="field">
                      Unresolved place
                      <select
                        value={queryKey}
                        onChange={(e) => {
                          setQueryKey(e.target.value);
                          setResults([]);
                          setSearchError('');
                        }}
                      >
                        <option value="">Select a place...</option>
                        {pending.map((p) => (
                          <option value={p.key} key={p.key}>
                            {p.place}
                            {p.country ? `, ${p.country}` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="primary full"
                      onClick={locate}
                      disabled={!queryKey || searching}
                    >
                      <Search size={15} />
                      {searching ? 'Searching…' : 'Search matching locations'}
                    </button>
                    {searchError && <div className="error">{searchError}</div>}
                    {queryKey && results.length === 0 && !searching && !searchError && (
                      <p className="helper">
                        Choose Search to retrieve up to five possible matches.
                      </p>
                    )}
                    {results.map((r, i) => (
                      <button
                        className="location-result"
                        key={i}
                        onClick={() => {
                          const lat = Number(r.lat),
                            lng = Number(r.lon);
                          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                          setOverrides((prev) => ({
                            ...prev,
                            [queryKey]: { lat, lng, name: r.display_name },
                          }));
                          setQueryKey('');
                          setResults([]);
                        }}
                      >
                        <MapPin size={16} />
                        <span>
                          {r.display_name}
                          <small>
                            {Number(r.lat).toFixed(4)}, {Number(r.lon).toFixed(4)}
                          </small>
                        </span>
                        <CheckCircle2 size={15} />
                      </button>
                    ))}
                  </>
                )}
                <p className="note">
                  Search powered by{' '}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenStreetMap / Nominatim
                  </a>
                  . Please use manual lookups sparingly (at most one request per second). For large
                  datasets, use your own geocoding provider or a licensed batch API.
                </p>
              </>
            )}
            {selectedTab === 'layers' && (
              <>
                <h2>Visualization</h2>
                <label className="toggle-line">
                  Heat intensity layer
                  <input
                    type="checkbox"
                    checked={heat}
                    onChange={(e) => setHeat(e.target.checked)}
                  />
                </label>
                <label className="toggle-line">
                  Point markers
                  <input
                    type="checkbox"
                    checked={markers}
                    onChange={(e) => setMarkers(e.target.checked)}
                  />
                </label>
                <label className="field">
                  Color palette
                  <select
                    value={palette}
                    onChange={(e) => setPalette(e.target.value as PaletteName)}
                  >
                    {Object.keys(palettes).map((p) => (
                      <option key={p} value={p}>
                        {palettes[p as PaletteName].label}
                      </option>
                    ))}
                  </select>
                </label>
                <div
                  className="gradient"
                  style={{
                    background: `linear-gradient(to right,${Object.values(palettes[palette].colors).join(',')})`,
                  }}
                />
                <label className="slider">
                  Radius <b>{radius}px</b>
                  <input
                    type="range"
                    min="5"
                    max="65"
                    value={radius}
                    onChange={(e) => setRadius(+e.target.value)}
                  />
                </label>
                <label className="slider">
                  Blur <b>{blur}px</b>
                  <input
                    type="range"
                    min="5"
                    max="55"
                    value={blur}
                    onChange={(e) => setBlur(+e.target.value)}
                  />
                </label>
                <label className="field">
                  Base map
                  <select
                    value={basemap}
                    onChange={(e) => setBasemap(e.target.value as 'dark' | 'light')}
                  >
                    <option value="dark">Humanitarian</option>
                    <option value="light">Standard</option>
                  </select>
                </label>
                <div className="tip">
                  Heatmap uses per-row numeric values as relative weights. It is a visualization,
                  not a statistical estimate of risk or population-adjusted incidence.
                </div>
              </>
            )}
          </div>
          <div className="side-footer">
            <span className="status-dot" />
            All processing stays in your browser except explicit place searches and map tile
            requests.
          </div>
        </aside>
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
