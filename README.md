# GeoHeat Studio

A browser-based geospatial data visualization MVP, evolved from an interactive rabies mapping prototype. User-uploaded data stays in the browser; only explicit place searches and map tile requests access external services.

## Getting started

Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Open the localhost address printed by Vite. Run the quality checks with:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

For a production preview, run `npm run preview` after the build.

## Current capabilities

- CSV and XLSX import (first row must contain unique, nonempty column names; first sheet for XLSX).
- Manual mapping of latitude/longitude or place/country columns, plus numeric value, category and date/year.
- Interactive Leaflet map with point markers and a weighted heatmap.
- Category and year filters, heatmap color palettes, radius/blur and map styles.
- Explicit per-place searches using public Nominatim, with human confirmation before a result is mapped. A chosen match applies to identical place and country values in the uploaded dataset.
- CSV export of mapped records, including resolved locations; the app includes a small synthetic demo dataset.
- User-uploaded spreadsheets are processed locally in the browser and are not uploaded to an application server.

## Geocoding constraints

Public OpenStreetMap Nominatim is intended for modest user-triggered interactive searches, not bulk resolution. The UI enforces a minimum 1.1 second gap between search requests per page instance and never geocodes data automatically. Production-scale deployments should use a provider with suitable terms, a backend or cache, rate limiting across users, and appropriate privacy disclosures. Direct browser requests can fail due to provider availability, CORS, or usage restrictions. Exact place names can be ambiguous; the user must select the right match.

## Known MVP limitations

- Coordinate columns must be decimal latitude and longitude in WGS84. Polygon shapefiles, projected CRS, spatial joins and choropleth support are not included.
- CSV headers must be in the first row; only the first Excel sheet is read. XLS (legacy) is not supported. Date detection extracts a four-digit year from ISO-like strings or year columns; locale-specific dates may need preprocessing.
- Heatmaps are visual aids, not statistically valid epidemiological risk or incidence calculations.
- Workspace save/restore, undo history, authentication, PNG map export, offline tiles, streaming large-file handling and automated geocoding are not included.
- Internet access is needed for map tiles and place lookup. Interactive results should be validated on representative real datasets before public launch.

## Technical structure

- `src/data.ts` and `src/data/filters.ts`: field guessing, value parsing, coordinate validation, counts and filters.
- `src/services/`: CSV/XLSX parsing and mapped CSV export.
- `src/hooks/useMappedData.ts`: derived mapped rows, unique filters and unresolved place groups.
- `src/geocode.ts`: explicit, user-triggered Nominatim searches.
- `src/components/MapView.tsx`: Leaflet tiles, markers and heat layers, with cleanup and safe text popups.
- `src/App.tsx`: application state and workspace UI; `src/styles.css` contains the visual design.
- `tests/`: Node-native tests for parsing, coordinate validation, mapping, filters and CSV export.

This is a new derivative project. The originally provided `rabies_heatmap_interactive.html` remains unchanged. Its embedded rabies observations are not included in this generic MVP, avoiding accidental redistribution of study data.
