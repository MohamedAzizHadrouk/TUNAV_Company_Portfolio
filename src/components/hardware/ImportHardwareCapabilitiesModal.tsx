import { useState } from 'react';
import { Modal } from '../Modal';
import type { HardwareCapability, HardwareItem } from '../../types/portfolio';

type CapabilityInput = Pick<HardwareCapability, 'title' | 'description'>;

export function ImportHardwareCapabilitiesModal({ target, hardware, onClose, onImport }: { target: HardwareItem; hardware: HardwareItem[]; onClose: () => void; onImport: (items: CapabilityInput[]) => void }) {
  const [source, setSource] = useState<'existing' | 'csv'>('existing');
  const [selected, setSelected] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CapabilityInput[]>([]);
  const [error, setError] = useState('');
  const available = hardware.filter((item) => item.id !== target.id).flatMap((item) => (item.capabilities ?? []).map((capability) => ({ hardware: item, capability })));
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const importItems = source === 'existing' ? available.filter(({ capability }) => selected.includes(capability.id)).map(({ capability }) => ({ title: capability.title, description: capability.description })) : csvRows;

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 1024 * 1024) { setError('Choose a CSV file under 1 MB.'); setCsvRows([]); return; }
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const headers = rows.shift()?.map((cell) => cell.trim().toLowerCase().replace(/^\uFEFF/, '')) ?? [];
      const titleIndex = headers.indexOf('title');
      if (titleIndex < 0) throw new Error('CSV needs a title column.');
      const descriptionIndex = headers.indexOf('description');
      const parsed = rows.filter((row) => row.some((cell) => cell.trim())).map((row, index) => {
        const title = row[titleIndex]?.trim() ?? '';
        if (!title) throw new Error(`Row ${index + 2} needs a title.`);
        return { title, description: row[descriptionIndex]?.trim() ?? '' };
      });
      if (!parsed.length || parsed.length > 100) throw new Error('CSV must contain 1 to 100 capabilities.');
      setCsvRows(parsed); setError('');
    } catch (cause) { setCsvRows([]); setError(cause instanceof Error ? cause.message : 'Could not read the CSV file.'); }
  };

  return <Modal open title={`Import capabilities into ${target.title}`} size="lg" onClose={onClose} footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!importItems.length} onClick={() => onImport(importItems)}>Import {importItems.length || ''} {importItems.length === 1 ? 'capability' : 'capabilities'}</button></>}>
    <div className="space-y-4"><p className="text-sm text-muted">Copy capabilities from another hardware item or import several from a CSV file. Imported capabilities become independent copies.</p><div role="tablist" aria-label="Import source" className="inline-flex rounded-lg bg-canvas p-1"><button type="button" role="tab" aria-selected={source === 'existing'} className={`rounded-md px-3 py-1.5 text-sm ${source === 'existing' ? 'bg-white font-medium text-ink shadow-sm' : 'text-muted'}`} onClick={() => setSource('existing')}>Other hardware</button><button type="button" role="tab" aria-selected={source === 'csv'} className={`rounded-md px-3 py-1.5 text-sm ${source === 'csv' ? 'bg-white font-medium text-ink shadow-sm' : 'text-muted'}`} onClick={() => setSource('csv')}>CSV file</button></div>
      {source === 'existing' ? available.length ? <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-xl border border-line">{available.map(({ hardware: item, capability }) => <li key={`${item.id}-${capability.id}`}><label className="flex cursor-pointer items-start gap-3 p-3 hover:bg-canvas"><input type="checkbox" className="mt-1" checked={selected.includes(capability.id)} onChange={() => toggle(capability.id)} /><span><span className="block text-sm font-medium text-ink">{capability.title}</span><span className="text-xs text-muted">{item.title}</span></span></label></li>)}</ul> : <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No other hardware capabilities yet. Add one manually or use a CSV file.</p> : <div className="space-y-3"><label className="block text-sm font-medium text-ink">Choose CSV file<input className="field mt-1.5" type="file" accept=".csv,text/csv" onChange={(event) => onFile(event.target.files?.[0])} /></label><p className="text-xs text-muted">Columns: <code>title,description</code>.</p>{csvRows.length > 0 && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Ready to import {csvRows.length} {csvRows.length === 1 ? 'capability' : 'capabilities'}.</div>}</div>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  </Modal>;
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (quoted) throw new Error('CSV has an unfinished quoted field.');
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}
