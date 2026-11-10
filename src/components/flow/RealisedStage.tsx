import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CheckCircle2Icon, CheckIcon, PackageCheckIcon, RocketIcon, TargetIcon } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { AssetView } from '../AssetView';
import { EmptyState } from '../EmptyState';
import { useAccess } from '../../contexts/AccessContext';
import { flattenStories, storyLabel, storyProgress, storyTone, sumPoints } from '../../utils/backlog';
import { activeCapabilities, capabilityReady, coverage, domainNames, resolvedLinks } from '../../utils/capabilities';
import type { Product, Sprint } from '../../types/portfolio';

const sprintNumber = (sprint: Sprint) => sprint.number ?? (Number(sprint.name.match(/^Sprint (\d+)$/i)?.[1]) || 0);
const day = (value: string) => { const date = parseISO(value); return isValid(date) ? format(date, 'MMM d, yyyy') : value; };

function Stat({ icon, label, value, detail }: {icon: ReactNode;label: string;value: string;detail: string;}) {
  return <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4"><div className="rounded-lg bg-brand-50 p-2.5 text-brand-700">{icon}</div><div><p className="text-xs text-muted">{label}</p><p className="text-xl font-semibold tabular-nums text-ink">{value}</p><p className="text-[11px] text-muted">{detail}</p></div></div>;
}

export function RealisedStage({ product, update }: { product: Product; update: (fn: (p: Product) => Product) => void }) {
  const { can } = useAccess();
  const canEdit = can('portfolio.edit');
  const backlog = product.backlog;
  const flow = `/products/${product.id}/flow`;
  const entries = flattenStories(backlog).map((entry) => ({ ...entry, progress: storyProgress(backlog, entry.story) }));
  const delivered = entries.filter((entry) => entry.progress.done);
  const sprints = [...backlog.sprints].sort((a, b) => sprintNumber(b) - sprintNumber(a));
  const released = sprints.filter((sprint) => sprint.increment);
  const awaiting = sprints.filter((sprint) => !sprint.increment).reverse();
  const inScope = activeCapabilities(product.capabilities);
  const ready = inScope.filter((capability) => capability.status !== 'implemented' && capabilityReady(backlog, capability));
  const implemented = inScope.filter((capability) => capability.status === 'implemented');

  const markImplemented = (id: string) => update((current) => ({
    ...current,
    capabilities: current.capabilities.map((capability) => capability.id === id && capabilityReady(current.backlog, capability) ? { ...capability, status: 'implemented', statusNote: '' } : capability)
  }));

  return <div className="flex flex-col gap-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={<RocketIcon className="h-4 w-4" />} label="Releases" value={String(released.length)} detail={`${awaiting.length} sprint${awaiting.length === 1 ? '' : 's'} awaiting release`} />
      <Stat icon={<CheckCircle2Icon className="h-4 w-4" />} label="Stories delivered" value={`${delivered.length}/${entries.length}`} detail="Every phase's tasks done" />
      <Stat icon={<TargetIcon className="h-4 w-4" />} label="Points delivered" value={`${sumPoints(delivered.map((entry) => entry.story))}/${sumPoints(entries.map((entry) => entry.story))}`} detail="Story points" />
      <Stat icon={<PackageCheckIcon className="h-4 w-4" />} label="Capabilities implemented" value={`${implemented.length}/${inScope.length}`} detail={`${coverage(product.capabilities)}% coverage`} />
    </div>

    {backlog.phases.length > 0 && entries.length > 0 && <section aria-label="Delivery by phase" className="rounded-2xl border border-line bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">Delivery by phase</h2>
      <p className="mb-3 text-xs text-muted">How many user stories have finished each phase. A phase is finished when all of its tasks are done.</p>
      <ol className="grid gap-3 md:grid-cols-[repeat(var(--phase-count),minmax(0,1fr))]" style={{ '--phase-count': backlog.phases.length } as React.CSSProperties}>
        {backlog.phases.map((phase, index) => {
          const rows = entries.map((entry) => entry.progress.phases[index]);
          const finished = rows.filter((row) => row?.state === 'done').length;
          const underway = rows.filter((row) => row?.state === 'in-progress' || row?.state === 'to-do').length;
          const tasksDone = rows.reduce((sum, row) => sum + (row?.done ?? 0), 0);
          const tasksTotal = rows.reduce((sum, row) => sum + (row?.total ?? 0), 0);
          const deliverables = rows.filter((row) => row?.delivery).length;
          return <li key={phase.id} className="rounded-xl bg-canvas p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] tabular-nums text-muted">{index + 1}</span>{phase.name}</p>
            <p className="mt-2 text-sm text-ink"><span className="text-xl font-semibold tabular-nums">{finished}</span><span className="text-muted"> / {entries.length} stories finished</span></p>
            <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
              <div className="bg-emerald-500" style={{ width: `${finished / entries.length * 100}%` }} />
              <div className="bg-brand/40" style={{ width: `${underway / entries.length * 100}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-muted">{underway} under way · {tasksDone}/{tasksTotal} tasks done · {deliverables} {phase.deliveryLabel.toLowerCase()}{deliverables === 1 ? '' : 's'}</p>
          </li>;
        })}
      </ol>
    </section>}

    {ready.length > 0 && <section aria-label="Ready to mark implemented" className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
      <h2 className="text-sm font-semibold text-ink">Ready to mark implemented</h2>
      <p className="mb-3 text-xs text-muted">Every linked feature is fully delivered. Confirm to update the capability register.</p>
      <ul className="space-y-2">{ready.map((capability) => <li key={capability.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5">
        <div className="min-w-0"><p className="text-sm font-medium text-ink">{capability.name}</p><p className="text-xs text-muted">{domainNames(product.domains, capability).join(", ")} · {resolvedLinks(backlog, capability).map((link) => link.feature?.title ?? link.epic.title).join(', ')}</p></div>
        {canEdit ? <button className="btn-primary" onClick={() => markImplemented(capability.id)}>Mark implemented</button> : <span className="text-xs text-muted">Needs edit access</span>}
      </li>)}</ul>
    </section>}

    <section aria-label="Releases">
      <h2 className="mb-2 text-sm font-semibold text-ink">Releases</h2>
      {released.length === 0 ? <EmptyState title="No release yet" description="Finish every task of a sprint, then validate its increment in Sprints & tasks. It will appear here." /> :
        <div className="grid gap-4 lg:grid-cols-2">{released.map((sprint) => {
          const stories = entries.filter((entry) => entry.story.sprintId === sprint.id);
          return <article key={sprint.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2"><div><span className="text-[11px] font-semibold text-emerald-700">RELEASE</span><h3 className="text-base font-semibold text-ink">{sprint.name}</h3><p className="text-xs text-muted">{day(sprint.startDate)} – {day(sprint.endDate)} · {sprint.tasks.filter((task) => task.done).length}/{sprint.tasks.length} tasks done</p></div><Link className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline" to={`${flow}?stage=sprints&sprint=${sprint.id}`}>Open sprint <ArrowRightIcon className="h-3 w-3" /></Link></div>
            {sprint.goal && <p className="mt-2 text-sm text-muted">{sprint.goal}</p>}
            {sprint.increment && <div className="mt-3 rounded-lg bg-canvas px-3 py-2"><p className="mb-1 text-[11px] font-medium text-muted">Increment</p><AssetView asset={sprint.increment} /></div>}
            {stories.length > 0 && <ul className="mt-3 space-y-1.5 border-t border-line pt-3">{stories.map(({ story, epic, feature, progress }) => <li key={story.id} className="flex items-start gap-2 text-xs">
              <span className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${progress.done ? 'bg-emerald-500 text-white' : 'border border-line'}`} aria-hidden>{progress.done && <CheckIcon className="h-2.5 w-2.5" />}</span>
              <span className="min-w-0"><span className="text-muted">{epic.title} → {feature.title}</span><span className="block text-ink">{story.title}</span></span>
            </li>)}</ul>}
          </article>;
        })}</div>}
    </section>

    {awaiting.length > 0 && <section aria-label="Awaiting release">
      <h2 className="mb-2 text-sm font-semibold text-ink">Awaiting release</h2>
      <ul className="space-y-2">{awaiting.map((sprint) => {
        const total = sprint.tasks.length; const done = sprint.tasks.filter((task) => task.done).length;
        const state = total === 0 ? 'No tasks yet' : done === total ? 'Ready to validate' : 'In progress';
        return <li key={sprint.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 py-2.5">
          <div className="min-w-[180px] flex-1"><p className="text-sm font-medium text-ink">{sprint.name}</p><p className="text-xs text-muted">{day(sprint.startDate)} – {day(sprint.endDate)} · {done}/{total} tasks</p>
            <div className="mt-1.5 h-1 max-w-xs overflow-hidden rounded-full bg-line" aria-hidden><div className="h-full rounded-full bg-brand" style={{ width: `${total ? done / total * 100 : 0}%` }} /></div></div>
          <div className="flex items-center gap-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${state === 'Ready to validate' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{state}</span><Link className="text-xs font-semibold text-brand hover:underline" to={`${flow}?stage=sprints&sprint=${sprint.id}`}>{state === 'Ready to validate' ? 'Validate release' : 'Open sprint'}</Link></div>
        </li>;
      })}</ul>
    </section>}

    <section aria-label="Delivered stories">
      <h2 className="mb-2 text-sm font-semibold text-ink">Delivered stories <span className="font-normal text-muted">· {delivered.length}</span></h2>
      {delivered.length === 0 ? <p className="rounded-xl border border-dashed border-line px-4 py-6 text-sm text-muted">No story has finished every phase yet. Stories in progress: {entries.filter((entry) => entry.progress.totalTasks > 0).length}.</p> :
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs text-muted"><tr><th className="px-3 py-2 font-medium">User story</th>{backlog.phases.map((phase) => <th key={phase.id} className="px-3 py-2 font-medium">{phase.deliveryLabel}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{delivered.map(({ story, epic, feature, progress }) => {
              const sprint = backlog.sprints.find((item) => item.id === story.sprintId);
              return <tr key={story.id} className="align-top">
                <td className="max-w-[320px] px-3 py-2.5"><p className="text-[11px] text-muted">{epic.title} → {feature.title}</p><p className="font-medium text-ink">{story.title}</p><p className="mt-0.5 text-[11px] text-muted">{story.points ?? '–'} pts{sprint ? ` · ${sprint.name}` : ''}</p></td>
                {progress.phases.map((row) => <td key={row.phase.id} className="max-w-[200px] px-3 py-2.5">{row.delivery ? <AssetView asset={row.delivery.asset} /> : <span className="text-xs text-muted">Not attached</span>}</td>)}
              </tr>;
            })}</tbody>
          </table>
        </div>}
    </section>

    {entries.some((entry) => !entry.progress.done && entry.progress.totalTasks > 0) && <section aria-label="In progress">
      <h2 className="mb-2 text-sm font-semibold text-ink">In progress</h2>
      <ul className="flex flex-wrap gap-2">{entries.filter((entry) => !entry.progress.done && entry.progress.totalTasks > 0).map(({ story }) => <li key={story.id} className="flex max-w-full items-center gap-2 rounded-full border border-line bg-white py-1 pl-3 pr-1 text-xs">
        <span className="truncate text-ink">{story.want || story.title}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${storyTone(backlog, story)}`}>{storyLabel(backlog, story)}</span>
      </li>)}</ul>
    </section>}

    {implemented.length > 0 && <section aria-label="Delivered capabilities">
      <h2 className="mb-2 text-sm font-semibold text-ink">Implemented capabilities <span className="font-normal text-muted">· {implemented.length}</span></h2>
      <ul className="grid gap-2 md:grid-cols-2">{implemented.map((capability) => <li key={capability.id} className="rounded-xl border border-line bg-white px-3 py-2.5"><p className="text-sm font-medium text-ink">{capability.name}</p><p className="text-xs text-muted">{domainNames(product.domains, capability).join(", ")}{capability.asIsId ? ' · from As-is' : ''}</p>{resolvedLinks(backlog, capability).map((link) => <p key={`${link.epic.id}-${link.feature?.id ?? ''}`} className="mt-1 text-[11px] text-muted">{link.epic.title}{link.feature ? ` → ${link.feature.title}` : ''}</p>)}</li>)}</ul>
    </section>}
  </div>;
}
