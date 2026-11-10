import { useEffect, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from 'lucide-react';
import { defaultStatuses } from '../../data/scrum';
import { move } from '../../utils/array';
import { createId } from '../../utils/id';
import type { AssetKind, Backlog, WorkflowPhase, WorkflowStatus } from '../../types/portfolio';

const deliveryTypes: {id: AssetKind;label: string;}[] = [
{ id: 'text', label: 'Text field' },
{ id: 'url', label: 'URL field' },
{ id: 'file', label: 'File import' }];


interface WorkflowSettingsProps {
  backlog: Backlog;
  onSave: (phases: WorkflowPhase[]) => void;
}

function freshStatuses(): WorkflowStatus[] {
  return defaultStatuses.map((status) => ({ ...status, id: createId('st') }));
}

export function WorkflowSettings({ backlog, onSave }: WorkflowSettingsProps) {
  const [phases, setPhases] = useState(backlog.phases);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPhases(backlog.phases);
  }, [backlog.phases]);

  const dirty = JSON.stringify(phases) !== JSON.stringify(backlog.phases);
  const valid = phases.length > 0 && phases.every((phase) =>
  phase.name.trim() &&
  phase.statuses.length > 1 &&
  phase.statuses.every((status) => status.name.trim()) &&
  phase.statuses.filter((status) => status.isComplete).length === 1
  );

  const updatePhase = (id: string, changes: Partial<WorkflowPhase>) => setPhases((current) => current.map((phase) => phase.id === id ? { ...phase, ...changes } : phase));

  const save = () => {
    onSave(phases);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Phases" className="rounded-xl border border-line">
        <header className="border-b border-line px-3 py-2.5">
          <h3 className="text-sm font-semibold text-ink">Phases</h3>
          <p className="mt-0.5 text-xs text-muted">Every user story moves through these phases in order. In Sprints &amp; tasks each story gets tasks per phase; a phase is done when all of its tasks are done, and its deliverable can then be attached.</p>
        </header>
        <ul className="flex flex-col gap-3 p-3">
          {phases.map((phase, index) =>
          <li key={phase.id} className="rounded-lg border border-line p-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_130px_84px]">
                <input aria-label={`${phase.name || 'Phase'} name`} className="field" value={phase.name} onChange={(e) => updatePhase(phase.id, { name: e.target.value })} placeholder="Phase name" />
                <input aria-label={`${phase.name || 'Phase'} delivery label`} className="field" value={phase.deliveryLabel} onChange={(e) => updatePhase(phase.id, { deliveryLabel: e.target.value })} placeholder="Delivery label" />
                <select aria-label={`${phase.name || 'Phase'} delivery field`} className="field" value={phase.deliveryType} onChange={(e) => updatePhase(phase.id, { deliveryType: e.target.value as AssetKind })}>
                  {deliveryTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                </select>
                <div className="flex items-center">
                  <button className="icon-btn" aria-label={`Move ${phase.name || 'phase'} up`} disabled={index === 0} onClick={() => setPhases((current) => move(current, index, -1))}><ArrowUpIcon className="h-3.5 w-3.5" /></button>
                  <button className="icon-btn" aria-label={`Move ${phase.name || 'phase'} down`} disabled={index === phases.length - 1} onClick={() => setPhases((current) => move(current, index, 1))}><ArrowDownIcon className="h-3.5 w-3.5" /></button>
                  <button className="icon-btn hover:text-red-600" aria-label={`Remove ${phase.name || 'phase'}`} disabled={phases.length === 1} onClick={() => setPhases((current) => current.filter((item) => item.id !== phase.id))}><XIcon className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </li>
          )}
          <button
            className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand hover:text-brand-700"
            onClick={() => setPhases((current) => [...current, { id: createId('wf'), name: '', deliveryLabel: 'Delivery', deliveryType: 'url', statuses: freshStatuses() }])}>
            <PlusIcon className="h-4 w-4" /> Add phase
          </button>
        </ul>
      </section>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-700">Workflow saved</span>}
        {dirty && !saved && <span className="text-sm text-muted">Unsaved changes</span>}
        <button className="btn-ghost" disabled={!dirty} onClick={() => setPhases(backlog.phases)}>Reset</button>
        <button className="btn-primary" disabled={!dirty || !valid} onClick={save}>Save workflow</button>
      </div>
    </div>);

}
