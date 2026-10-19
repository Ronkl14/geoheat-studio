import type { Dispatch, SetStateAction } from 'react';
import {
  UploadCloud,
  ArrowRight,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Search,
  MapPin,
} from 'lucide-react';
import type { ColumnMapping, RawRow } from '../data';
import type { GeocodeResult } from '../geocode';
import { palettes, type PaletteName } from './mapPalettes';

type Tab = 'data' | 'mapping' | 'locations' | 'layers';
type PendingPlace = { key: string; place: string; country: string };
type Stats = { total: number; ready: number; unresolved: number; invalid: number };
type Overrides = Record<string, { lat: number; lng: number; name: string }>;
type Props = {
  selectedTab: Tab;
  setSelectedTab: Dispatch<SetStateAction<Tab>>;
  loading: boolean;
  dragging: boolean;
  setDragging: Dispatch<SetStateAction<boolean>>;
  openFile: (file?: File) => Promise<void>;
  error: string;
  rows: RawRow[];
  fileName: string;
  columns: string[];
  reset: () => void;
  mapping: ColumnMapping;
  setMapping: Dispatch<SetStateAction<ColumnMapping>>;
  setOverrides: Dispatch<SetStateAction<Overrides>>;
  stats: Stats;
  validMapping: boolean;
  pending: PendingPlace[];
  queryKey: string;
  setQueryKey: Dispatch<SetStateAction<string>>;
  results: GeocodeResult[];
  setResults: Dispatch<SetStateAction<GeocodeResult[]>>;
  setSearchError: Dispatch<SetStateAction<string>>;
  locate: () => Promise<void>;
  searching: boolean;
  searchError: string;
  heat: boolean;
  setHeat: Dispatch<SetStateAction<boolean>>;
  markers: boolean;
  setMarkers: Dispatch<SetStateAction<boolean>>;
  palette: PaletteName;
  setPalette: Dispatch<SetStateAction<PaletteName>>;
  radius: number;
  setRadius: Dispatch<SetStateAction<number>>;
  blur: number;
  setBlur: Dispatch<SetStateAction<number>>;
  basemap: 'dark' | 'light';
  setBasemap: Dispatch<SetStateAction<'dark' | 'light'>>;
};
const COLUMNS: { key: keyof Omit<ColumnMapping, 'mode'>; title: string; hint: string }[] = [
  { key: 'latitude', title: 'Latitude', hint: 'Required in coordinate mode' },
  { key: 'longitude', title: 'Longitude', hint: 'Required in coordinate mode' },
  { key: 'place', title: 'Place / locality', hint: 'Required in place mode' },
  { key: 'country', title: 'Country / region', hint: 'Improves name matching' },
  { key: 'value', title: 'Numeric value', hint: 'Defaults to 1 per row' },
  { key: 'category', title: 'Category', hint: 'Optional filter' },
  { key: 'date', title: 'Date / year', hint: 'Optional filter' },
];
export default function WorkspaceSidebar(props: Props) {
  const {
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
  } = props;
  return (
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
              <ShieldCheck size={14} /> Uploaded spreadsheets are parsed locally in your browser.
              Place searches send only the selected place name to OpenStreetMap's search service.
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
                <button className="primary full" onClick={locate} disabled={!queryKey || searching}>
                  <Search size={15} />
                  {searching ? 'Searching…' : 'Search matching locations'}
                </button>
                {searchError && <div className="error">{searchError}</div>}
                {queryKey && results.length === 0 && !searching && !searchError && (
                  <p className="helper">Choose Search to retrieve up to five possible matches.</p>
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
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
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
              <input type="checkbox" checked={heat} onChange={(e) => setHeat(e.target.checked)} />
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
              <select value={palette} onChange={(e) => setPalette(e.target.value as PaletteName)}>
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
              Heatmap uses per-row numeric values as relative weights. It is a visualization, not a
              statistical estimate of risk or population-adjusted incidence.
            </div>
          </>
        )}
      </div>
      <div className="side-footer">
        <span className="status-dot" />
        All processing stays in your browser except explicit place searches and map tile requests.
      </div>
    </aside>
  );
}
