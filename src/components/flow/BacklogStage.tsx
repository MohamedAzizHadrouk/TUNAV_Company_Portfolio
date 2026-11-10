import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDownIcon, ChevronRightIcon, FolderPlusIcon, SearchIcon } from 'lucide-react';
import { useProduct } from '../../hooks/useProduct';
import { findFeature } from '../../utils/capabilities';
import { useBacklog } from '../../hooks/useBacklog';
import { ProductNotFound } from '../products/ProductNotFound';
import { BacklogColumn, type ColumnCheck } from '../backlog/BacklogColumn';
import { StoryList } from '../backlog/StoryList';
import { StoryDrawer } from '../backlog/StoryDrawer';
import { WorkflowSettings } from '../backlog/WorkflowSettings';
import { ActorsPanel } from '../backlog/ActorsPanel';
import { Modal } from '../Modal';
import { flattenStories, isStoryDone, storyProgress, sumPoints } from '../../utils/backlog';
import type { Epic, SubProductBacklog } from '../../types/portfolio';

type Tab = 'backlog' | 'actors' | 'workflow';
const tabs: {id: Tab;label: string;}[] = [
{ id: 'backlog', label: 'Backlog' },
{ id: 'actors', label: 'Actors' },
{ id: 'workflow', label: 'Workflow settings' }];


export function BacklogStage() {
  const { product, update } = useProduct();
  const actions = useBacklog(update);
  const [params] = useSearchParams();
  const linkedFeature = product ? findFeature(product.backlog, params.get('feature')) : null;
  const [tab, setTab] = useState<Tab>('backlog');
  const [epicId, setEpicId] = useState<string | null>(linkedFeature?.epic.id ?? null);
  const [featureId, setFeatureId] = useState<string | null>(linkedFeature?.feature.id ?? null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [draftName, setDraftName] = useState('');
  const [barError, setBarError] = useState('');
  const [editing, setEditing] = useState<SubProductBacklog | null>(null);
  const [removing, setRemoving] = useState<SubProductBacklog | null>(null);
  const [subBacklogsOpen, setSubBacklogsOpen] = useState(true);
  const [selecting, setSelecting] = useState(false);

  const q = query.trim().toLowerCase();
  const visibleEpics = useMemo(() => {
    if (!product) return [];
    return product.backlog.epics.filter((epic) =>
    !q ||
    epic.title.toLowerCase().includes(q) ||
    epic.features.some((feature) => feature.title.toLowerCase().includes(q) || feature.stories.some((story) => story.title.toLowerCase().includes(q)))
    );
  }, [product, q]);

  if (!product) return <ProductNotFound />;

  const b = product.backlog;
  const epic = visibleEpics.find((item) => item.id === epicId) ?? visibleEpics[0] ?? null;
  const epicMatches = !!epic && !!q && epic.title.toLowerCase().includes(q);
  const visibleFeatures = (epic?.features ?? []).filter((feature) =>
  !q || epicMatches || feature.title.toLowerCase().includes(q) || feature.stories.some((story) => story.title.toLowerCase().includes(q))
  );
  const feature = visibleFeatures.find((item) => item.id === featureId) ?? visibleFeatures[0] ?? null;
  const featureMatches = !!feature && (!q || epicMatches || feature.title.toLowerCase().includes(q));
  const entries = flattenStories(b);
  const openEntry = entries.find((entry) => entry.story.id === storyId) ?? null;
  const totalPts = sumPoints(entries.map((entry) => entry.story));
  const donePts = sumPoints(entries.filter((entry) => isStoryDone(b, entry.story)).map((entry) => entry.story));
  const pickedSet = new Set(picked);
  const blockedIds = new Set(b.subBacklogs.filter((item) => item.id !== editing?.id).flatMap((item) => item.storyIds));
  const blockedNotes = Object.fromEntries(b.subBacklogs.filter((item) => item.id !== editing?.id).flatMap((item) => item.storyIds.map((id) => [id, item.name])));
  const epicChecks = Object.fromEntries(b.epics.map((item) => [item.id, checkFor(storyIdsInEpic(item), pickedSet, blockedIds)]));
  const featureChecks = Object.fromEntries(b.epics.flatMap((item) => item.features.map((child) => [child.id, checkFor(child.stories.map((story) => story.id), pickedSet, blockedIds)])));

  const toggleIds = (ids: string[]) => {
    const open = ids.filter((id) => !blockedIds.has(id));
    if (open.length === 0) return;
    setPicked((current) => {
      const allOn = open.every((id) => current.includes(id));
      return allOn ? current.filter((id) => !open.includes(id)) : Array.from(new Set([...current, ...open]));
    });
  };

  const clearBar = () => {
    setSelecting(false);
    setEditing(null);
    setPicked([]);
    setDraftName('');
    setBarError('');
  };

  const startEdit = (item: SubProductBacklog) => {
    setSelecting(true);
    setEditing(item);
    setPicked(item.storyIds);
    setDraftName(item.name);
    setBarError('');
  };

  const saveBar = () => {
    const name = draftName.trim();
    if (!name) {
      setBarError('Enter a name.');
      return;
    }
    if (picked.length === 0) {
      setBarError('Select at least one user story.');
      return;
    }
    actions.saveSubBacklog({ id: editing?.id, name, storyIds: picked });
    setNotice(editing ? `Sub-product backlog “${name}” updated.` : `Sub-product backlog “${name}” created.`);
    clearBar();
  };

  return (
    <>
      {notice && <p role="status" className="mb-3 text-sm text-emerald-700">{notice}</p>}

      <div className="mb-3 flex flex-col gap-3 rounded-xl bg-canvas px-3 py-2.5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-[200px]">
          <p className="text-sm text-ink">
            <span className="text-xl font-semibold tabular-nums">{donePts}</span>
            <span className="text-muted"> / {totalPts} story points delivered</span>
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand" style={{ width: `${totalPts ? donePts / totalPts * 100 : 0}%` }} />
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-5 gap-y-1">
          {b.phases.map((phase) =>
          <div key={phase.id}>
              <dt className="text-xs text-muted">In {phase.name}</dt>
              <dd className="text-sm font-semibold tabular-nums text-ink">{entries.filter((entry) => { const progress = storyProgress(b, entry.story); return !progress.done && progress.totalTasks > 0 && progress.phases[progress.current]?.phase.id === phase.id; }).length}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-muted">Completed</dt>
            <dd className="text-sm font-semibold tabular-nums text-emerald-700">{entries.filter((entry) => isStoryDone(b, entry.story)).length}</dd>
          </div>
        </dl>
      </div>

      <div role="tablist" className="mb-3 inline-flex rounded-lg bg-canvas p-0.5">
        {tabs.map((item) =>
        <button
          key={item.id}
          role="tab"
          aria-selected={tab === item.id}
          onClick={() => setTab(item.id)}
          className={`whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-colors duration-150 ${
          tab === item.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`
          }>
          
            {item.label}
          </button>
        )}
      </div>

      {tab === 'backlog' &&
      <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="relative w-full max-w-sm">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input aria-label="Search backlog" className="field pl-8" placeholder="Search epics, features, stories" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            {!selecting && <button type="button" className="btn-ghost" onClick={() => { setSelecting(true); setNotice(''); }} title="Select user stories to group into a sub-product backlog">
              <FolderPlusIcon className="h-4 w-4" aria-hidden /> Create sub-product backlog
            </button>}
          </div>
          {b.subBacklogs.length > 0 &&
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-sm font-semibold text-ink">Sub-product backlogs</h2>
              <span className="text-xs tabular-nums text-muted">{b.subBacklogs.length}</span>
              <button
                type="button"
                className="icon-btn"
                aria-expanded={subBacklogsOpen}
                aria-label={subBacklogsOpen ? 'Hide sub-product backlogs' : 'Show sub-product backlogs'}
                onClick={() => setSubBacklogsOpen((open) => !open)}>
                {subBacklogsOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
              </button>
            </div>
            {subBacklogsOpen &&
          <ul className="flex flex-wrap gap-2">
              {b.subBacklogs.map((item) => {
                const count = item.storyIds.length;
                const active = editing?.id === item.id;
                return (
                  <li key={item.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${active ? 'border-brand bg-brand-50' : 'border-line bg-white'}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-muted">{count} {count === 1 ? 'user story' : 'user stories'}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button className="btn-ghost px-2 py-1 text-xs" onClick={() => startEdit(item)}>Edit</button>
                      <button className="btn-ghost px-2 py-1 text-xs text-red-600" onClick={() => setRemoving(item)}>Delete</button>
                    </div>
                  </li>);
              })}
            </ul>
            }
          </div>
          }
          {selecting &&
          <form
            className="mb-3 rounded-xl border border-brand/40 bg-brand-50/50 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              saveBar();
            }}>
            <p className="flex items-center gap-2 text-sm font-semibold text-ink"><FolderPlusIcon className="h-4 w-4 text-brand" aria-hidden />{editing ? `Edit “${editing.name}”` : 'New sub-product backlog'}</p>
            <p className="mb-2 mt-0.5 text-xs text-muted">Tick user stories below. Tick a feature or an epic to select all of its stories. Stories already in another sub-product backlog are locked.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                aria-label="Sub-product backlog name"
                className="field bg-white sm:max-w-xs"
                placeholder="Name, e.g. MVP release"
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)} />
              <p className="whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-medium text-brand-700">{picked.length} {picked.length === 1 ? 'story' : 'stories'} · {sumPoints(entries.filter((entry) => pickedSet.has(entry.story.id)).map((entry) => entry.story))} pts</p>
              <div className="flex gap-2 sm:ml-auto">
                <button type="button" className="btn-ghost" onClick={clearBar}>Cancel</button>
                <button type="submit" className="btn-primary">{editing ? 'Save changes' : 'Create sub-product backlog'}</button>
              </div>
            </div>
            {barError && <p className="mt-2 text-sm text-red-600" role="alert">{barError}</p>}
          </form>
          }
          <div className="grid items-start gap-3 lg:grid-cols-[220px_220px_1fr]">
            <BacklogColumn
              title="Epics"
              items={visibleEpics.map((item) => ({ id: item.id, title: item.title, description: item.description, meta: `${item.features.length} features` }))}
              selectedId={epic?.id ?? null}
              onSelect={(id) => {
                setEpicId(id);
                setFeatureId(null);
              }}
              onAdd={(title) => {
                setEpicId(actions.addEpic(title));
                setFeatureId(null);
                setNotice('Epic created.');
              }}
              onUpdate={(id, title, description) => actions.updateEpic(id, { title, description })}
              onDelete={actions.deleteEpic}
              addPlaceholder="New epic"
              emptyText="No epics yet."
              checks={selecting ? epicChecks : undefined}
              onToggleCheck={(id) => {
                const item = b.epics.find((epicItem) => epicItem.id === id);
                if (item) toggleIds(storyIdsInEpic(item));
              }} />
            
            <BacklogColumn
              title="Features"
              items={visibleFeatures.map((item) => {
                return { id: item.id, title: item.title, description: item.description, meta: `${item.stories.length} stories · ${sumPoints(item.stories)} pts` };
              })}
              selectedId={feature?.id ?? null}
              onSelect={setFeatureId}
              onAdd={(title) => {
                if (!epic) return;
                setFeatureId(actions.addFeature(epic.id, title));
                setNotice('Feature created.');
              }}
              onUpdate={(id, title, description) => actions.updateFeature(id, { title, description })}
              onDelete={actions.deleteFeature}
              addPlaceholder="New feature"
              emptyText={epic ? 'No features in this epic.' : 'Select an epic first.'}
              disabled={!epic}
              checks={selecting ? featureChecks : undefined}
              onToggleCheck={(id) => {
                const item = b.epics.flatMap((epicItem) => epicItem.features).find((featureItem) => featureItem.id === id);
                if (item) toggleIds(item.stories.map((story) => story.id));
              }} />
            
            <div className="flex min-w-0 flex-col gap-3">
              <StoryList
                feature={feature}
                backlog={b}
                storyQuery={featureMatches ? '' : query}
                selectedStoryIds={selecting ? picked : []}
                blockedNotes={blockedNotes}
                onToggleStory={selecting ? (id) => toggleIds([id]) : undefined}
                onOpen={setStoryId}
                onAdd={(story) => feature && actions.addStory(feature.id, story)}
                onManageActors={() => setTab('actors')} />
              
            </div>
          </div>
          <Modal
            open={removing !== null}
            title="Delete sub-product backlog"
            onClose={() => setRemoving(null)}
            footer={
            <>
                <button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
                <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => {
                  if (!removing) return;
                  actions.deleteSubBacklog(removing.id);
                  if (editing?.id === removing.id) clearBar();
                  setNotice(`Sub-product backlog “${removing.name}” deleted. Its stories stay in the backlog.`);
                  setRemoving(null);
                }}>Delete</button>
              </>
            }>
            <p className="text-sm text-muted">Delete <span className="font-medium text-ink">{removing?.name}</span>? Its user stories stay in the backlog.</p>
          </Modal>
        </>
      }

      {tab === 'actors' &&
      <ActorsPanel backlog={b} onAdd={actions.addActor} onUpdate={actions.updateActor} onDelete={actions.deleteActor} />
      }

      {tab === 'workflow' && <WorkflowSettings backlog={b} onSave={actions.saveWorkflow} />}

      <StoryDrawer
        entry={openEntry}
        backlog={b}
        onUpdate={actions.updateStory}
        onDelete={(id) => {
          actions.deleteStory(id);
          setStoryId(null);
        }}
        onClose={() => setStoryId(null)} />
      
    </>);

}

function storyIdsInEpic(epic: Epic): string[] {
  return epic.features.flatMap((feature) => feature.stories.map((story) => story.id));
}

function checkFor(ids: string[], picked: Set<string>, blocked: Set<string>): ColumnCheck {
  const open = ids.filter((id) => !blocked.has(id));
  if (open.length === 0) return { checked: false, indeterminate: false, disabled: true };
  const count = open.filter((id) => picked.has(id)).length;
  return { checked: count === open.length, indeterminate: count > 0 && count < open.length, disabled: false };
}
