import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, CalendarDaysIcon, CheckCircle2Icon, ChevronRightIcon, ClipboardListIcon, PencilIcon, PlusIcon, SearchIcon, TargetIcon, Trash2Icon } from 'lucide-react';
import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { Modal } from '../Modal';
import { AssetInput } from '../AssetInput';
import { AssetView } from '../AssetView';
import { Field } from '../Field';
import { EmptyState } from '../EmptyState';
import { DeliveryModal } from './DeliveryModal';
import { flattenStories, isStoryDone, phaseStateLabels, phaseStateTones, storyLabel, storyProgress, storyTone, taskPhaseId, type PhaseProgress, type StoryEntry } from '../../utils/backlog';
import { today } from '../../utils/id';
import type { TaskInput } from '../../hooks/useBacklog';
import type { Asset, Backlog, Sprint, Task, WorkflowPhase } from '../../types/portfolio';

interface SprintsPanelProps {
  productId: string;
  initialSprintId?: string | null;
  backlog: Backlog;
  canManage: boolean;
  onSaveSprint: (input: Omit<Sprint, 'id'> & {id?: string;}, subBacklogIds: string[]) => void;
  onDeleteSprint: (id: string) => void;
  onOpenStory: (id: string) => void;
  onAddTasks: (sprintId: string, storyId: string, tasks: TaskInput[]) => void;
  onUpdateTask: (sprintId: string, taskId: string, changes: TaskInput) => void;
  onSetTaskDone: (sprintId: string, taskId: string, done: boolean) => void;
  onSetConceptionStage: (sprintId: string, taskId: string, stage: 'analyse' | 'adr' | 'done', adr?: Asset | null) => void;
  onSetSprintIncrement: (sprintId: string, increment: Asset | null) => void;
  onRemoveTask: (sprintId: string, taskId: string) => void;
  onSetStoryDelivery: (storyId: string, phaseId: string, asset: Asset | null) => void;
}

function sprintStatus(sprint: Sprint): 'active' | 'upcoming' | 'past' {
  const now = format(new Date(), 'yyyy-MM-dd');
  if (sprint.startDate > now) return 'upcoming';
  if (sprint.endDate < now) return 'past';
  return 'active';
}

function SummaryCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4"><div className="rounded-lg bg-brand-50 p-2.5 text-brand-700">{icon}</div><div><p className="text-xs text-muted">{label}</p><p className="text-xl font-semibold tabular-nums text-ink">{value}</p><p className="text-[11px] text-muted">{detail}</p></div></div>;
}

export function SprintsPanel({ productId, initialSprintId, backlog, canManage, onSaveSprint, onDeleteSprint, onOpenStory, onAddTasks, onUpdateTask, onSetTaskDone, onSetConceptionStage, onSetSprintIncrement, onRemoveTask, onSetStoryDelivery }: SprintsPanelProps) {
  const [editing, setEditing] = useState<Sprint | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Sprint | null>(null);
  const [openId, setOpenId] = useState<string | null>(initialSprintId ?? null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');
  const [notice, setNotice] = useState('');
  const entries = flattenStories(backlog);
  const unassigned = entries.filter((entry) => !entry.story.sprintId);
  const needle = query.trim().toLowerCase();
  const visibleSprints = backlog.sprints.filter((sprint) => {
    if (filter !== 'all' && sprintStatus(sprint) !== filter) return false;
    if (!needle) return true;
    if (sprint.name.toLowerCase().includes(needle) || sprint.goal.toLowerCase().includes(needle)) return true;
    return entries.some((entry) => entry.story.sprintId === sprint.id && entry.story.title.toLowerCase().includes(needle));
  });
  const openSprint = backlog.sprints.find((sprint) => sprint.id === openId) ?? null;

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
  };

  const activeCount = backlog.sprints.filter((sprint) => sprintStatus(sprint) === 'active').length;
  const doneTasks = backlog.sprints.reduce((sum, sprint) => sum + sprint.tasks.filter((task) => task.done).length, 0);
  const allTasks = backlog.sprints.reduce((sum, sprint) => sum + sprint.tasks.length, 0);

  return (
    <div className="flex flex-col gap-5">
      {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
      {!openSprint && <>
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard icon={<CalendarDaysIcon className="h-4 w-4" />} label="Total sprints" value={backlog.sprints.length} detail="Across this product" />
          <SummaryCard icon={<TargetIcon className="h-4 w-4" />} label="Active now" value={activeCount} detail="Within their planned dates" />
          <SummaryCard icon={<CheckCircle2Icon className="h-4 w-4" />} label="Tasks done" value={`${doneTasks}/${allTasks}`} detail="Across all sprints" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs"><SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input aria-label="Search sprints" className="field py-2 pl-9" placeholder="Search sprint or story" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          {canManage && <button className="btn-primary py-2" onClick={openCreate}><PlusIcon className="h-4 w-4" /> New sprint</button>}
        </div>
        <div role="group" aria-label="Filter sprints" className="flex flex-wrap gap-2">{(['all', 'active', 'upcoming', 'past'] as const).map((item) => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === item ? 'border-brand bg-brand-50 text-brand-700' : 'border-line bg-white text-muted hover:border-brand/40 hover:text-ink'}`}>{item === 'all' ? `All (${backlog.sprints.length})` : `${item} (${backlog.sprints.filter((sprint) => sprintStatus(sprint) === item).length})`}</button>)}</div>
      </>}
      {!canManage && <p className="rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-muted">You can view sprints. Your role does not allow changes.</p>}

      {openSprint ?
      <SprintBoard
        sprint={openSprint}
        backlog={backlog}
        canManage={canManage}
        entries={entries.filter((entry) => entry.story.sprintId === openSprint.id)}
        onBack={() => setOpenId(null)}
        onOpenStory={onOpenStory}
        onAddTasks={onAddTasks}
        onUpdateTask={onUpdateTask}
        onSetTaskDone={onSetTaskDone}
        onSetConceptionStage={onSetConceptionStage}
        onSetSprintIncrement={onSetSprintIncrement}
        onRemoveTask={onRemoveTask}
        onSetStoryDelivery={onSetStoryDelivery} /> :


      <>
      {backlog.sprints.length === 0 &&
      <EmptyState title="No sprints yet" description="Create a sprint from a sub-product backlog." action={canManage && <button className="btn-primary" onClick={openCreate}><PlusIcon className="h-4 w-4" /> New sprint</button>} />
      }

      {backlog.sprints.length > 0 && visibleSprints.length === 0 && <EmptyState title="No matching sprints" description="Try another search term or status filter." />}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {visibleSprints.map((sprint) => {
          const stories = entries.filter((entry) => entry.story.sprintId === sprint.id);
          const done = sprint.tasks.filter((task) => task.done).length;
          const progress = sprint.tasks.length ? Math.round(done / sprint.tasks.length * 100) : 0;
          const status = sprintStatus(sprint);
          return (
            <article key={sprint.id} className="flex min-h-60 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-2 p-4 pb-0"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${status === 'active' ? 'bg-emerald-50 text-emerald-700' : status === 'upcoming' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-muted'}`}>{status}</span><div className="flex">
                {canManage && <>
                <button className="icon-btn" aria-label={`Edit ${sprint.name}`} onClick={() => { setCreating(false); setEditing(sprint); }}>
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button className="icon-btn hover:text-red-600" aria-label={`Delete ${sprint.name}`} onClick={() => setRemoving(sprint)}>
                  <Trash2Icon className="h-3.5 w-3.5" />
                </button>
                </>}
              </div></div>
              <button type="button" onClick={() => setOpenId(sprint.id)} className="group flex flex-1 flex-col p-4 pt-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
                <h3 className="text-base font-semibold text-ink group-hover:text-brand">{sprint.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><CalendarDaysIcon className="h-3.5 w-3.5" />{format(new Date(sprint.startDate), 'MMM d, yyyy')} – {format(new Date(sprint.endDate), 'MMM d, yyyy')}</p>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted">{sprint.goal || 'No sprint goal added yet.'}</p>
                <div className="mt-auto pt-4"><div className="flex items-center justify-between text-xs"><span className="font-medium text-ink">Task progress</span><span className="font-semibold tabular-nums text-ink">{done}/{sprint.tasks.length}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-3 flex items-center justify-between text-xs text-muted"><span className="flex items-center gap-1"><ClipboardListIcon className="h-3.5 w-3.5" />{stories.filter((entry) => isStoryDone(backlog, entry.story)).length}/{stories.length} {stories.length === 1 ? 'story' : 'stories'} delivered</span>{sprint.increment && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">Released</span>}<span className="flex items-center gap-1 font-medium text-brand">Open board <ChevronRightIcon className="h-3.5 w-3.5" /></span></div></div>
              </button>
            </article>);
        })}
      </div>

      {unassigned.length > 0 &&
      <section aria-label="Not in a sprint" className="rounded-xl border border-dashed border-line">
          <header className="border-b border-line px-3 py-2">
            <h3 className="text-sm font-semibold text-ink">Not in a sprint <span className="font-normal text-muted">· {unassigned.length}</span></h3>
          </header>
          <GroupedStories entries={unassigned} backlog={backlog} onOpen={onOpenStory} readOnly={!canManage} empty="" />
        </section>
      }
      </>
      }

      {canManage && <SprintForm
        productId={productId}
        open={creating || editing !== null}
        sprint={editing}
        backlog={backlog}
        suggestedName={`Sprint ${Math.max(0, ...backlog.sprints.map((item) => item.number ?? (Number(item.name.match(/^Sprint (\d+)$/i)?.[1]) || 0))) + 1}`}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={(input, subBacklogIds) => {
          onSaveSprint(input, subBacklogIds);
          setCreating(false);
          setEditing(null);
          setNotice(input.id ? 'Sprint updated.' : 'Sprint created.');
        }} />}
      

      <Modal
        open={removing !== null}
        title="Delete sprint"
        onClose={() => setRemoving(null)}
        footer={
        <>
            <button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
            <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => {
              if (!removing) return;
              onDeleteSprint(removing.id);
              setRemoving(null);
              setNotice('Sprint deleted. Its stories are no longer assigned.');
            }}>Delete sprint</button>
          </>
        }>
        
        <p className="text-sm text-muted">Delete <span className="font-medium text-ink">{removing?.name}</span>? Its user stories stay in the backlog and become unassigned.</p>
      </Modal>
    </div>);

}

function GroupedStories({ entries, backlog, onOpen, readOnly, empty }: {entries: StoryEntry[];backlog: Backlog;onOpen: (id: string) => void;readOnly: boolean;empty: string;}) {
  if (!entries.length) return <p className="px-3 py-4 text-sm text-muted">{empty}</p>;
  const groups = new Map<string, {epicTitle: string;features: Map<string, {featureTitle: string;entries: StoryEntry[];}>;}>();
  for (const entry of entries) {
    const epic = groups.get(entry.epic.id) ?? { epicTitle: entry.epic.title, features: new Map() };
    const feature = epic.features.get(entry.feature.id) ?? { featureTitle: entry.feature.title, entries: [] };
    feature.entries.push(entry);
    epic.features.set(entry.feature.id, feature);
    groups.set(entry.epic.id, epic);
  }
  return (
    <div className="divide-y divide-line">
      {Array.from(groups.entries()).map(([epicId, epic]) =>
      <div key={epicId} className="px-3 py-2">
          <p className="text-xs font-semibold text-ink">{epic.epicTitle}</p>
          {Array.from(epic.features.entries()).map(([featureId, feature]) =>
        <div key={featureId} className="mt-1">
              <p className="text-xs text-muted">{feature.featureTitle}</p>
              <ul>
                {feature.entries.map(({ story }) =>
              <li key={story.id}>
                    <button disabled={readOnly} onClick={() => onOpen(story.id)} className="flex w-full items-center gap-3 py-1.5 text-left hover:text-brand disabled:cursor-default disabled:hover:text-ink">
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{story.title}</span>
                      <span className={`hidden whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline ${storyTone(backlog, story)}`}>{storyLabel(backlog, story)}</span>
                      <span className="w-10 text-right text-xs font-semibold tabular-nums text-ink">{story.points ?? '–'} pts</span>
                    </button>
                  </li>
              )}
              </ul>
            </div>
        )}
        </div>
      )}
    </div>);

}

function SprintBoard({ sprint, backlog, canManage, entries, onBack, onOpenStory, onAddTasks, onUpdateTask, onSetTaskDone, onSetConceptionStage, onSetSprintIncrement, onRemoveTask, onSetStoryDelivery }: {
  sprint: Sprint;
  backlog: Backlog;
  canManage: boolean;
  entries: StoryEntry[];
  onBack: () => void;
  onOpenStory: (id: string) => void;
  onAddTasks: (sprintId: string, storyId: string, tasks: TaskInput[]) => void;
  onUpdateTask: (sprintId: string, taskId: string, changes: TaskInput) => void;
  onSetTaskDone: (sprintId: string, taskId: string, done: boolean) => void;
  onSetConceptionStage: (sprintId: string, taskId: string, stage: 'analyse' | 'adr' | 'done', adr?: Asset | null) => void;
  onSetSprintIncrement: (sprintId: string, increment: Asset | null) => void;
  onRemoveTask: (sprintId: string, taskId: string) => void;
  onSetStoryDelivery: (storyId: string, phaseId: string, asset: Asset | null) => void;
}) {
  const [view, setView] = useState<'stories' | 'kanban'>('stories');
  const [dragging, setDragging] = useState<string | null>(null);
  const [incrementDraft, setIncrementDraft] = useState<Asset | null>(sprint.increment ?? null);
  const [incrementError, setIncrementError] = useState('');
  const [progressTaskId, setProgressTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deliveryFor, setDeliveryFor] = useState<{storyId: string;phase: WorkflowPhase;} | null>(null);
  const groups = storyGroups(sprint, backlog, entries);
  const progressTask = sprint.tasks.find((task) => task.id === progressTaskId) ?? null;
  const editingTask = sprint.tasks.find((task) => task.id === editingTaskId) ?? null;
  const delivered = entries.filter((entry) => isStoryDone(backlog, entry.story)).length;
  const doneTasks = sprint.tasks.filter((task) => task.done).length;
  const allDone = sprint.tasks.length > 0 && doneTasks === sprint.tasks.length;
  const storyTitle = (id: string) => entries.find((item) => item.story.id === id)?.story.title ?? 'User story';
  const phaseName = (task: Task) => backlog.phases.find((phase) => phase.id === taskPhaseId(backlog, task))?.name ?? task.assignmentType;

  const taskActions = {
    canManage,
    onToggle: (task: Task, done: boolean) => onSetTaskDone(sprint.id, task.id, done),
    onSteps: (task: Task) => setProgressTaskId(task.id),
    onEdit: (task: Task) => setEditingTaskId(task.id),
    onRemove: (task: Task) => onRemoveTask(sprint.id, task.id)
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-700" onClick={onBack}><ArrowLeftIcon className="h-4 w-4" /> Back to sprints</button>
          <h2 className="mt-1 text-lg font-semibold text-ink">{sprint.name}</h2>
          <p className="text-xs text-muted">{format(new Date(sprint.startDate), 'MMM d')} – {format(new Date(sprint.endDate), 'MMM d, yyyy')}</p>
          {sprint.goal && <p className="mt-1 max-w-2xl text-sm text-muted">{sprint.goal}</p>}
        </div>
        <div role="tablist" aria-label="Board view" className="inline-flex self-start rounded-lg bg-canvas p-0.5 sm:self-auto">
          {(['stories', 'kanban'] as const).map((item) =>
          <button key={item} type="button" role="tab" aria-selected={view === item} onClick={() => setView(item)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${view === item ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>
              {item === 'stories' ? 'By story' : 'Kanban'}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={<ClipboardListIcon className="h-4 w-4" />} label="Stories delivered" value={`${delivered}/${entries.length}`} detail="Every phase done" />
        <SummaryCard icon={<CheckCircle2Icon className="h-4 w-4" />} label="Tasks done" value={`${doneTasks}/${sprint.tasks.length}`} detail="In this sprint" />
        <SummaryCard icon={<TargetIcon className="h-4 w-4" />} label="Story points" value={entries.reduce((sum, entry) => sum + (entry.story.points ?? 0), 0)} detail="Estimated scope" />
      </div>

      {entries.length === 0 &&
      <p className="rounded-xl border border-dashed border-line bg-canvas px-4 py-6 text-sm text-muted">No user story in this sprint yet. Plan stories through a sub-product backlog when you edit the sprint.</p>
      }

      {view === 'stories' ?
      <div className="flex flex-col gap-4">
          {groups.map((group) =>
        <section key={group.id} aria-label={group.name} className="flex flex-col gap-3">
              {groups.length > 1 && <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{group.name}</h3>}
              {group.stories.map((entry) =>
          <StoryTaskCard
            key={entry.story.id}
            entry={entry}
            sprint={sprint}
            backlog={backlog}
            actions={taskActions}
            onOpenStory={onOpenStory}
            onAddTask={(phaseId, title) => onAddTasks(sprint.id, entry.story.id, [{ title, description: '', phaseId }])}
            onDelivery={(phase) => setDeliveryFor({ storyId: entry.story.id, phase })} />
          )}
            </section>
        )}
        </div> :

      <div className="grid gap-3 md:grid-cols-2">
          {[{ done: false, title: 'To do' }, { done: true, title: 'Done' }].map((column) =>
        <section
          key={column.title}
          aria-label={column.title}
          className="min-h-40 rounded-xl border border-line bg-canvas p-2"
          onDragOver={(event) => { if (canManage) event.preventDefault(); }}
          onDrop={() => {
            if (canManage && dragging) onSetTaskDone(sprint.id, dragging, column.done);
            setDragging(null);
          }}>
              <h3 className="px-1 py-1 text-xs font-semibold text-ink">{column.title} <span className="font-normal text-muted">· {sprint.tasks.filter((task) => task.done === column.done).length}</span></h3>
              <ul className="mt-1 flex flex-col gap-2">
                {sprint.tasks.filter((task) => task.done === column.done).map((task) =>
            <li
              key={task.id}
              draggable={canManage && task.assignmentType !== 'Conception Task'}
              onDragStart={() => setDragging(task.id)}
              className="rounded-lg border border-line bg-white p-2">
                    <p className="text-sm font-medium text-ink">{task.title}</p>
                    <span className="mt-1 inline-block rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">{phaseName(task)}</span>
                    <p className="mt-1 truncate text-xs text-muted">{storyTitle(task.storyId)}</p>
                    {task.assignmentType === 'Conception Task' && <p className="mt-1 text-xs text-amber-800">{conceptionLabel(task)}</p>}
                    {canManage && (task.assignmentType === 'Conception Task' ?
              <button className="mt-2 text-xs font-medium text-brand" onClick={() => setProgressTaskId(task.id)}>Manage steps</button> :
              <button type="button" className="mt-2 text-xs font-medium text-brand" onClick={() => onSetTaskDone(sprint.id, task.id, !column.done)}>{column.done ? 'Move to To do' : 'Move to Done'}</button>)}
                  </li>
            )}
              </ul>
            </section>
        )}
        </div>
      }

      <section className="rounded-xl border border-line bg-white p-4" aria-label="Sprint increment">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">Sprint increment</h3>
            <p className="mt-1 text-xs text-muted">The delivered version, or proof of it. You can validate it once every task of the sprint is done; it then appears as a release in Realised.</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${sprint.increment ? 'bg-emerald-50 text-emerald-700' : allDone ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-700'}`}>
            {sprint.increment ? 'Released' : allDone ? 'Ready to validate' : `${doneTasks}/${sprint.tasks.length} tasks done`}
          </span>
        </div>
        {sprint.increment && <div className="mt-3"><AssetView asset={sprint.increment} /></div>}
        {canManage && <div className="mt-3 space-y-2"><AssetInput id={`increment-${sprint.id}`} value={incrementDraft} onChange={setIncrementDraft} placeholder="Release notes or a link to the delivered version" />
          <button className="btn-primary" type="button" disabled={!allDone} onClick={() => {
            if (!allDone) { setIncrementError('Finish every task before validating the increment.'); return; }
            if (!incrementDraft?.value.trim()) { setIncrementError('Add a description, a link or a document.'); return; }
            onSetSprintIncrement(sprint.id, incrementDraft); setIncrementError('');
          }}>{sprint.increment ? 'Update increment' : 'Validate increment'}</button>{incrementError && <p role="alert" className="text-xs text-red-600">{incrementError}</p>}</div>}
      </section>

      {progressTask && <ConceptionModal key={progressTask.id} task={progressTask} onClose={() => setProgressTaskId(null)} onSave={(stage, adr) => { onSetConceptionStage(sprint.id, progressTask.id, stage, adr); setProgressTaskId(null); }} />}
      {editingTask && <TaskDetailsModal key={editingTask.id} task={editingTask} phases={backlog.phases} phaseId={taskPhaseId(backlog, editingTask) ?? ''} onClose={() => setEditingTaskId(null)} onSave={(changes) => { onUpdateTask(sprint.id, editingTask.id, changes); setEditingTaskId(null); }} />}
      <DeliveryModal
        open={deliveryFor !== null}
        phase={deliveryFor?.phase ?? null}
        initial={deliveryFor ? entries.find((item) => item.story.id === deliveryFor.storyId)?.story.deliveries[deliveryFor.phase.id]?.asset ?? null : null}
        onClose={() => setDeliveryFor(null)}
        onSubmit={(asset) => { if (deliveryFor) onSetStoryDelivery(deliveryFor.storyId, deliveryFor.phase.id, asset); setDeliveryFor(null); }} />
    </div>);
}

function conceptionLabel(task: Task) {
  return task.conceptionStage === 'done' ? 'ADR validated' : task.conceptionStage === 'adr' ? 'ADR to validate' : 'Analysis';
}

interface TaskActions {
  canManage: boolean;
  onToggle: (task: Task, done: boolean) => void;
  onSteps: (task: Task) => void;
  onEdit: (task: Task) => void;
  onRemove: (task: Task) => void;
}

/** One user story in the sprint: its tasks laid out by workflow phase. */
function StoryTaskCard({ entry, sprint, backlog, actions, onOpenStory, onAddTask, onDelivery }: {
  entry: StoryEntry;
  sprint: Sprint;
  backlog: Backlog;
  actions: TaskActions;
  onOpenStory: (id: string) => void;
  onAddTask: (phaseId: string, title: string) => void;
  onDelivery: (phase: WorkflowPhase) => void;
}) {
  const { story, epic, feature } = entry;
  const progress = storyProgress(backlog, story);
  const sprintTasks = sprint.tasks.filter((task) => task.storyId === story.id);
  const unphased = sprintTasks.filter((task) => !taskPhaseId(backlog, task));

  return (
    <article className="rounded-2xl border border-line bg-white">
      <header className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-muted">{epic.title} › {feature.title}</p>
          <button type="button" disabled={!actions.canManage} onClick={() => onOpenStory(story.id)} className="text-left text-sm font-semibold text-ink hover:text-brand disabled:cursor-default disabled:hover:text-ink">{story.title}</button>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${story.priority === 'high' ? 'bg-red-50 text-red-700' : story.priority === 'low' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-800'}`}>{story.priority === 'high' ? 'High' : story.priority === 'low' ? 'Low' : 'Medium'}</span>
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold tabular-nums text-ink">{story.points ?? '–'} pts</span>
          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${storyTone(backlog, story)}`}>{storyLabel(backlog, story)}</span>
        </div>
      </header>
      <div className="grid gap-px bg-line md:grid-cols-[repeat(var(--phase-count),minmax(0,1fr))]" style={{ '--phase-count': Math.max(1, progress.phases.length) } as React.CSSProperties}>
        {progress.phases.map((item) =>
        <PhaseColumn
          key={item.phase.id}
          progress={item}
          tasks={sprintTasks.filter((task) => taskPhaseId(backlog, task) === item.phase.id)}
          elsewhere={item.total - sprintTasks.filter((task) => taskPhaseId(backlog, task) === item.phase.id).length}
          actions={actions}
          onAdd={(title) => onAddTask(item.phase.id, title)}
          onDelivery={() => onDelivery(item.phase)} />
        )}
      </div>
      {unphased.length > 0 &&
      <div className="border-t border-line px-4 py-2">
          <p className="mb-1 text-[11px] font-medium text-muted">Tasks without a phase · edit them to pick one</p>
          <ul className="flex flex-col gap-1">{unphased.map((task) => <TaskRow key={task.id} task={task} actions={actions} />)}</ul>
        </div>
      }
    </article>);
}

function PhaseColumn({ progress, tasks, elsewhere, actions, onAdd, onDelivery }: {
  progress: PhaseProgress;
  tasks: Task[];
  elsewhere: number;
  actions: TaskActions;
  onAdd: (title: string) => void;
  onDelivery: () => void;
}) {
  const { phase, total, done, state, delivery } = progress;
  const [title, setTitle] = useState('');
  const add = () => {
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle('');
  };

  return (
    <div className="flex min-w-0 flex-col gap-2 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink">{phase.name}</p>
        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${phaseStateTones[state]}`}>{phaseStateLabels[state]}{total > 0 ? ` · ${done}/${total}` : ''}</span>
      </div>
      {total > 0 &&
      <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className={`h-full rounded-full ${state === 'done' ? 'bg-emerald-500' : 'bg-brand'}`} style={{ width: `${done / total * 100}%` }} />
        </div>
      }
      {tasks.length > 0 && <ul className="flex flex-col gap-1">{tasks.map((task) => <TaskRow key={task.id} task={task} actions={actions} />)}</ul>}
      {elsewhere > 0 && <p className="text-[11px] text-muted">+ {elsewhere} {elsewhere === 1 ? 'task' : 'tasks'} in other sprints</p>}
      {actions.canManage &&
      <form className="flex gap-1" onSubmit={(event) => { event.preventDefault(); add(); }}>
          <input aria-label={`New ${phase.name} task`} className="field min-w-0 py-1 text-xs" placeholder={`Add a ${phase.name} task`} value={title} onChange={(event) => setTitle(event.target.value)} />
          <button type="submit" className="icon-btn shrink-0" aria-label={`Add ${phase.name} task`} disabled={!title.trim()}><PlusIcon className="h-4 w-4" /></button>
        </form>
      }
      {state === 'done' && (delivery ?
      <div className="rounded-lg bg-emerald-50/60 px-2 py-1.5">
          <p className="text-[11px] font-medium text-emerald-800">{phase.deliveryLabel}</p>
          <AssetView asset={delivery.asset} />
          {actions.canManage && <button type="button" className="mt-0.5 block text-[11px] font-medium text-muted hover:text-brand" onClick={onDelivery}>Change</button>}
        </div> :
      actions.canManage && <button type="button" className="inline-flex items-center gap-1 self-start text-xs font-medium text-brand hover:text-brand-700" onClick={onDelivery}><PlusIcon className="h-3.5 w-3.5" /> Add {phase.deliveryLabel.toLowerCase()}</button>)}
    </div>);
}

function TaskRow({ task, actions }: {task: Task;actions: TaskActions;}) {
  const conception = task.assignmentType === 'Conception Task';
  return (
    <li className="group flex items-start gap-2 rounded-md px-1 py-0.5 hover:bg-canvas">
      <input
        type="checkbox"
        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-brand"
        aria-label={`Mark ${task.title} done`}
        title={conception && !task.done ? 'Conception tasks finish when their ADR is validated' : undefined}
        disabled={!actions.canManage || conception && !task.done}
        checked={task.done}
        onChange={(event) => actions.onToggle(task, event.target.checked)} />
      <div className="min-w-0 flex-1">
        <p className={`text-xs ${task.done ? 'text-muted line-through' : 'text-ink'}`}>{task.title}</p>
        {conception && <button type="button" disabled={!actions.canManage} className="text-[11px] font-medium text-amber-800 hover:underline disabled:no-underline" onClick={() => actions.onSteps(task)}>{conceptionLabel(task)}</button>}
      </div>
      {actions.canManage &&
      <div className="flex shrink-0 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button type="button" className="icon-btn h-6 w-6" aria-label={`Edit ${task.title}`} onClick={() => actions.onEdit(task)}><PencilIcon className="h-3 w-3" /></button>
          <button type="button" className="icon-btn h-6 w-6 hover:text-red-600" aria-label={`Remove ${task.title}`} onClick={() => actions.onRemove(task)}><Trash2Icon className="h-3 w-3" /></button>
        </div>
      }
    </li>);
}

function storyGroups(sprint: Sprint, backlog: Backlog, entries: StoryEntry[]) {
  const used = new Set<string>();
  const groups = sprint.subBacklogIds.flatMap((id) => {
    const sub = backlog.subBacklogs.find((item) => item.id === id);
    if (!sub) return [];
    const stories = entries.filter((entry) => sub.storyIds.includes(entry.story.id));
    stories.forEach((entry) => used.add(entry.story.id));
    return [{ id: sub.id, name: sub.name, stories }];
  });
  const rest = entries.filter((entry) => !used.has(entry.story.id));
  if (rest.length) groups.push({ id: 'sprint-stories', name: groups.length ? 'Other stories' : 'User stories', stories: rest });
  return groups;
}

function ConceptionModal({ task, onClose, onSave }: { task: Task; onClose: () => void; onSave: (stage: 'analyse' | 'adr' | 'done', adr: Asset | null) => void }) {
  const [adr, setAdr] = useState<Asset | null>(task.adr ?? null);
  const [error, setError] = useState('');
  const stage = task.conceptionStage ?? 'analyse';
  return <Modal open title={`Conception · ${task.title}`} onClose={onClose} footer={<button className="btn-ghost" onClick={onClose}>Close</button>}>
    <ol className="space-y-4 text-sm">
      <li className="rounded-lg border border-line p-3"><strong>1 · Analysis</strong><p className="mt-1 text-xs text-muted">Analyse the need and the possible options.</p>{stage === 'analyse' && <button className="btn-primary mt-2" onClick={() => onSave('adr', null)}>Analysis done</button>}</li>
      <li className="rounded-lg border border-line p-3"><strong>2 · ADR</strong><p className="mt-1 text-xs text-muted">Record the architecture decision as a description or a file.</p><div className="mt-2"><AssetInput id={`adr-${task.id}`} value={adr} onChange={setAdr} kinds={['text', 'file']} /></div>{stage !== 'analyse' && <button className="btn-primary mt-2" onClick={() => { if (!adr?.value.trim()) { setError('An ADR description or document is required.'); return; } onSave('done', adr); }}>Validate ADR and finish</button>}</li>
      <li className="rounded-lg border border-line p-3"><strong>3 · Done</strong><p className="mt-1 text-xs text-muted">The task is done once its ADR is validated.</p>{stage === 'done' && task.adr && <div className="mt-2"><AssetView asset={task.adr} /></div>}</li>
    </ol>{error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
  </Modal>;
}

/** The task keeps the phase column it was added in; only an older task without a phase asks for one. */
function TaskDetailsModal({ task, phases, phaseId: currentPhaseId, onClose, onSave }: { task: Task; phases: WorkflowPhase[]; phaseId: string; onClose: () => void; onSave: (changes: TaskInput) => void }) {
  const [title, setTitle] = useState(task.title);
  const [phaseId, setPhaseId] = useState(currentPhaseId || phases[0]?.id || '');
  const [description, setDescription] = useState(task.description);
  const [error, setError] = useState('');
  return <Modal open title="Edit task" onClose={onClose} footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => { if (!title.trim()) { setError('Enter a task title.'); return; } if (!phaseId) { setError('Choose a phase.'); return; } onSave({ title, phaseId, description }); }}>Save task</button></>}><div className="space-y-4"><label className="block text-sm font-medium text-ink">Title<input className="field mt-1.5" value={title} onChange={(event) => setTitle(event.target.value)} /></label>{!currentPhaseId && <label className="block text-sm font-medium text-ink">Phase<select className="field mt-1.5" value={phaseId} onChange={(event) => setPhaseId(event.target.value)}>{phases.map((phase) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select></label>}<label className="block text-sm font-medium text-ink">Description (optional)<textarea className="field mt-1.5 min-h-28" value={description} onChange={(event) => setDescription(event.target.value)} /></label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div></Modal>;
}

export function SprintForm({ productId, open, sprint, backlog, suggestedName, onClose, onSubmit }: {
  open: boolean;
  productId: string;
  sprint: Sprint | null;
  backlog: Backlog;
  suggestedName: string;
  onClose: () => void;
  onSubmit: (input: Omit<Sprint, 'id'> & {id?: string;}, subBacklogIds: string[]) => void;
}) {
  const [startDate, setStartDate] = useState(today());
  const [duration, setDuration] = useState('2');
  const [durationUnit, setDurationUnit] = useState<'days' | 'weeks'>('weeks');
  const [goal, setGoal] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setStartDate(sprint?.startDate ?? today());
    const savedDays = sprint ? differenceInCalendarDays(parseISO(sprint.endDate), parseISO(sprint.startDate)) + 1 : 14;
    const days = Number.isFinite(savedDays) && savedDays > 0 ? savedDays : 14;
    setDurationUnit(days % 7 === 0 ? 'weeks' : 'days');
    setDuration(String(days % 7 === 0 ? days / 7 : days));
    setGoal(sprint?.goal ?? '');
    setSelected(sprint?.subBacklogIds ?? []);
    setError('');
  }, [open, sprint, suggestedName]);

  const amount = Number(duration);
  const durationDays = amount * (durationUnit === 'weeks' ? 7 : 1);
  const start = startDate ? parseISO(startDate) : null;
  const finish = start && isValid(start) && Number.isSafeInteger(durationDays) && durationDays > 0
    ? addDays(start, durationDays - 1)
    : null;
  const endDate = finish && isValid(finish) ? format(finish, 'yyyy-MM-dd') : '';

  const save = () => {
    if (!startDate || !start || !isValid(start)) {
      setError('Choose a valid start date.');
      return;
    }
    if (!duration.trim() || !Number.isSafeInteger(amount) || amount < 1 || !endDate) {
      setError('Enter a duration of at least 1 whole day or week.');
      return;
    }
    onSubmit({ id: sprint?.id, name: sprint?.name ?? suggestedName, startDate, endDate, goal: goal.trim(), subBacklogIds: selected, tasks: sprint?.tasks ?? [] }, selected);
  };

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <Modal
      open={open}
      size="lg"
      title={sprint ? 'Edit sprint' : 'New sprint'}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>{sprint ? 'Save sprint' : 'Create sprint'}</button>
        </>
      }>
      
      <div className="flex flex-col gap-3">
        <p className="flex flex-wrap items-center gap-x-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">{sprint?.name ?? suggestedName} <span className="font-normal text-brand-700/80">· number assigned automatically</span></p>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Start date" htmlFor="sp-start">
            <input id="sp-start" type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Duration" htmlFor="sp-duration">
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
              <input id="sp-duration" type="number" inputMode="numeric" min="1" step="1" className="field min-w-0" value={duration} onChange={(e) => setDuration(e.target.value)} />
              <select aria-label="Duration unit" className="field min-w-0" value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as 'days' | 'weeks')}>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
              </select>
            </div>
          </Field>
        </div>
        <p className="rounded-lg border border-line bg-slate-50 px-3 py-2 text-sm text-muted" aria-live="polite">
          {endDate ? <>Sprint ends on <span className="font-semibold text-ink">{format(parseISO(endDate), 'EEE, MMM d, yyyy')}</span> <span className="text-xs">(start day included)</span></> : 'Enter a start date and duration to see when the sprint ends.'}
        </p>
        <Field label="Description" htmlFor="sp-goal">
          <textarea id="sp-goal" className="field min-h-[80px] resize-y" placeholder="What is the goal of this sprint?" value={goal} onChange={(e) => setGoal(e.target.value)} />
        </Field>
        <div>
          <p className="text-sm font-medium text-ink">Sub-product backlogs</p>
          <p className="mb-2 text-xs text-muted">Stories from the selected sub-backlogs are added when their dependencies are planned in this sprint or an earlier one.</p>
          {backlog.subBacklogs.length === 0 ?
          <p className="rounded-lg border border-dashed border-line px-3 py-4 text-sm text-muted">
              No sub-product backlogs yet. <Link to={`/products/${productId}/flow?stage=backlog`} className="font-medium text-brand hover:text-brand-700" onClick={onClose}>Create one on the backlog page</Link>.
            </p> :

          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
              {backlog.subBacklogs.map((item) =>
            <li key={item.id}>
                  <label className="flex items-start gap-2 text-sm text-ink">
                    <input type="checkbox" className="mt-0.5" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
                    <span>
                      {item.name}
                      <span className="mt-0.5 block text-xs text-muted">{item.storyIds.length} {item.storyIds.length === 1 ? 'user story' : 'user stories'}</span>
                    </span>
                  </label>
                </li>
            )}
            </ul>
          }
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>);

}
