import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';
import type { RawRow } from '../data.ts';

export async function parseDataFile(file: File): Promise<{ rows: RawRow[]; headers: string[] }> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let values: unknown[][];

  if (extension === 'csv') {
    const parsed = Papa.parse<string[]>(await file.text(), { skipEmptyLines: 'greedy' });
    if (parsed.errors.length) throw new Error(parsed.errors[0].message);
    values = parsed.data;
  } else if (extension === 'xlsx') {
    values = (await readXlsxFile(file)) as unknown[][];
  } else {
    throw new Error('Supported formats: .csv and .xlsx. For .xls, save as .xlsx first.');
  }

  if (values.length < 2) throw new Error('File must have a header and at least one data row.');
  const headers = values[0].map((value) => String(value ?? '').trim());
  if (headers.some((header) => !header))
    throw new Error('The header row contains empty column names. Please name your columns.');
  if (new Set(headers).size !== headers.length)
    throw new Error('Duplicate column names found. Rename the columns.');

  const rows = values
    .slice(1)
    .filter((row) => row.some((value) => String(value ?? '').trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  if (!rows.length) throw new Error('No data rows found.');
  return { rows, headers };
}
