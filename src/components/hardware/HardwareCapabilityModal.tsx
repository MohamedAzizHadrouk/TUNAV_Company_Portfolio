import { useState } from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Modal } from '../Modal';
import { createId } from '../../utils/id';
import type { HardwareCapability } from '../../types/portfolio';

export type CapabilityInput = Pick<HardwareCapability, 'title' | 'description'>;
interface Row extends CapabilityInput { key: string }

export function HardwareCapabilityModal({ initial, onClose, onSave }: { initial?: HardwareCapability; onClose: () => void; onSave: (values: CapabilityInput[]) => void }) {
  const [rows, setRows] = useState<Row[]>([{ key: createId('cap-row'), title: initial?.title ?? '', description: initial?.description ?? '' }]);
  const [error, setError] = useState('');
  const update = (key: string, changes: Partial<Row>) => setRows((current) => current.map((row) => row.key === key ? { ...row, ...changes } : row));
  return <Modal open title={initial ? 'Edit capability' : 'Add capabilities'} size="lg" onClose={onClose} footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => { if (rows.some((row) => !row.title.trim())) { setError('Enter a title for every capability.'); return; } onSave(rows.map(({ title, description }) => ({ title: title.trim(), description: description.trim() }))); }}>{initial ? 'Save capability' : `Add ${rows.length} ${rows.length === 1 ? 'capability' : 'capabilities'}`}</button></>}><div className="space-y-4">{rows.map((row, index) => <section key={row.key} className="rounded-xl border border-line p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-ink">Capability {index + 1}</h3>{!initial && rows.length > 1 && <button type="button" className="icon-btn hover:text-red-600" aria-label={`Remove capability ${index + 1}`} onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}><Trash2Icon className="h-4 w-4" /></button>}</div><label className="block text-xs font-medium text-ink">Title <span className="text-red-600">*</span><input className="field mt-1.5" value={row.title} onChange={(event) => update(row.key, { title: event.target.value })} placeholder="e.g. Live GPS tracking" /></label><label className="mt-3 block text-xs font-medium text-ink">Description<textarea className="field mt-1.5 min-h-20" value={row.description} onChange={(event) => update(row.key, { description: event.target.value })} placeholder="What this hardware can do" /></label></section>)}{!initial && <button type="button" className="btn-ghost" onClick={() => setRows((current) => [...current, { key: createId('cap-row'), title: '', description: '' }])}><PlusIcon className="h-4 w-4" /> Add another capability</button>}{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div></Modal>;
}
