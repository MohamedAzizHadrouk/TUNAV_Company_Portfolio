import { useState, type FormEvent } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { Modal } from '../Modal';
import { createId } from '../../utils/id';
import type { Backlog, Capability, CapabilityLink, Epic, Feature } from '../../types/portfolio';

export interface CapabilityPlanDraft {
  links: CapabilityLink[];
  createdEpics: Epic[];
  createdFeatures: { epicId: string; feature: Feature }[];
}

export function CapabilityPlanModal({ capability, backlog, onClose, onSubmit }: {
  capability: Capability;
  backlog: Backlog;
  onClose: () => void;
  onSubmit: (draft: CapabilityPlanDraft) => void;
}) {
  const [links, setLinks] = useState<CapabilityLink[]>(() => capability.links.map((link) => ({ ...link, storyIds: [...link.storyIds] })));
  const [createdEpics, setCreatedEpics] = useState<Epic[]>([]);
  const [createdFeatures, setCreatedFeatures] = useState<CapabilityPlanDraft['createdFeatures']>([]);
  const [epicTitle, setEpicTitle] = useState('');
  const [featureTitles, setFeatureTitles] = useState<Record<string, string>>({});
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(() => new Set());
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState('');

  const epics = [
    ...backlog.epics.map((epic) => ({ ...epic, features: [...epic.features, ...createdFeatures.filter((item) => item.epicId === epic.id).map((item) => item.feature)] })),
    ...createdEpics.map((epic) => ({ ...epic, features: createdFeatures.filter((item) => item.epicId === epic.id).map((item) => item.feature) }))
  ];

  const toggleExpanded = (id: string, current: Set<string>, update: (value: Set<string>) => void) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    update(next);
  };

  const toggleEpic = (epicId: string) => setLinks((current) => {
    const selected = current.some((link) => link.epicId === epicId && !link.featureId);
    return selected ? current.filter((link) => !(link.epicId === epicId && !link.featureId)) :
      [...current.filter((link) => link.epicId !== epicId), { epicId, featureId: null, storyIds: [] }];
  });

  const toggleFeature = (epicId: string, featureId: string) => setLinks((current) => {
    const selected = current.some((link) => link.featureId === featureId);
    return selected ? current.filter((link) => link.featureId !== featureId) :
      [...current.filter((link) => !(link.epicId === epicId && !link.featureId)), { epicId, featureId, storyIds: [] }];
  });

  const toggleStory = (epicId: string, featureId: string, storyId: string) => setLinks((current) => {
    const existing = current.find((link) => link.featureId === featureId);
    if (!existing) return [...current.filter((link) => !(link.epicId === epicId && !link.featureId)), { epicId, featureId, storyIds: [storyId] }];
    return current.map((link) => link.featureId === featureId ? {
      ...link,
      storyIds: link.storyIds.includes(storyId) ? link.storyIds.filter((id) => id !== storyId) : [...link.storyIds, storyId]
    } : link);
  });

  const addEpic = (event: FormEvent) => {
    event.preventDefault();
    const title = epicTitle.trim();
    if (!title) { setError('Enter an epic name.'); return; }
    if (epics.some((epic) => epic.title.trim().toLowerCase() === title.toLowerCase())) { setError('An epic with this name already exists.'); return; }
    const epic = { id: createId('e'), title, description: '', features: [] };
    setCreatedEpics((current) => [...current, epic]);
    setLinks((current) => [...current, { epicId: epic.id, featureId: null, storyIds: [] }]);
    setExpandedEpics((current) => new Set([...current, epic.id]));
    setEpicTitle('');
    setError('');
  };

  const addFeature = (event: FormEvent, epic: Epic) => {
    event.preventDefault();
    const title = (featureTitles[epic.id] ?? '').trim();
    if (!title) { setError('Enter a feature name.'); return; }
    if (epic.features.some((feature) => feature.title.trim().toLowerCase() === title.toLowerCase())) { setError(`A feature with this name already exists in ${epic.title}.`); return; }
    const feature = { id: createId('f'), title, description: '', stories: [] };
    setCreatedFeatures((current) => [...current, { epicId: epic.id, feature }]);
    setLinks((current) => [...current.filter((link) => !(link.epicId === epic.id && !link.featureId)), { epicId: epic.id, featureId: feature.id, storyIds: [] }]);
    setFeatureTitles((current) => ({ ...current, [epic.id]: '' }));
    setError('');
  };

  const save = () => {
    const validLinks = links.flatMap((link): CapabilityLink[] => {
      const epic = epics.find((item) => item.id === link.epicId);
      if (!epic) return [];
      if (!link.featureId) return links.some((item) => item.epicId === epic.id && item.featureId) ? [] : [{ epicId: epic.id, featureId: null, storyIds: [] }];
      const feature = epic.features.find((item) => item.id === link.featureId);
      if (!feature) return [];
      return [{ epicId: epic.id, featureId: feature.id, storyIds: [...new Set(link.storyIds.filter((id) => feature.stories.some((story) => story.id === id)))] }];
    });
    onSubmit({ links: validLinks, createdEpics, createdFeatures });
  };

  return <Modal open size="xl" title={`Plan · ${capability.name}`} onClose={onClose} footer={<>
    <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
    <button type="button" className="btn-primary" onClick={save}>Save plan</button>
  </>}>
    <div className="space-y-4">
      <p className="text-sm text-muted">Link this capability to one or more epics. Open an epic to choose features, then open a feature to choose specific user stories. Selecting an entire epic replaces its more specific links.</p>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="space-y-3">
        {epics.map((epic) => {
          const epicOnly = links.some((link) => link.epicId === epic.id && !link.featureId);
          const linkedFeatures = links.filter((link) => link.epicId === epic.id && link.featureId);
          const expanded = expandedEpics.has(epic.id);
          return <section key={epic.id} className="rounded-xl border border-line bg-white">
            <div className="flex flex-wrap items-center gap-2 p-3">
              <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
                <input type="checkbox" className="h-4 w-4 shrink-0 accent-brand" aria-label={`Select entire epic ${epic.title}`} checked={epicOnly} onChange={() => toggleEpic(epic.id)} />
                <span className="truncate">{epic.title}</span>
                {linkedFeatures.length > 0 && <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{linkedFeatures.length} linked</span>}
              </label>
              <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-medium text-brand hover:bg-brand-50" aria-label={`${expanded ? 'Hide' : 'Show'} features in ${epic.title}`} aria-expanded={expanded} onClick={() => toggleExpanded(epic.id, expandedEpics, setExpandedEpics)}>{expanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />} Features</button>
            </div>
            {expanded && <div className="space-y-2 border-t border-line bg-canvas/40 p-3">
              {epic.features.length === 0 && <p className="text-xs text-muted">No features in this epic yet.</p>}
              {epic.features.map((feature) => {
                const link = links.find((item) => item.featureId === feature.id);
                const storiesOpen = expandedFeatures.has(feature.id);
                return <div key={feature.id} className="rounded-lg border border-line bg-white px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-ink">
                      <input type="checkbox" className="h-4 w-4 shrink-0 accent-brand" aria-label={`Select feature ${feature.title} in ${epic.title}`} checked={!!link} onChange={() => toggleFeature(epic.id, feature.id)} />
                      <span className="truncate">{feature.title}</span>
                      {!!link?.storyIds.length && <span className="shrink-0 text-xs text-muted">{link.storyIds.length} stories</span>}
                    </label>
                    {feature.stories.length > 0 && <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-medium text-brand hover:bg-brand-50" aria-label={`${storiesOpen ? 'Hide' : 'Show'} user stories in ${feature.title}`} aria-expanded={storiesOpen} onClick={() => toggleExpanded(feature.id, expandedFeatures, setExpandedFeatures)}>{storiesOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />} User stories</button>}
                  </div>
                  {storiesOpen && <div className="mt-1 space-y-1 border-t border-line pt-2">
                    {feature.stories.map((story) => <label key={story.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-xs text-ink hover:bg-canvas">
                      <input type="checkbox" className="h-4 w-4 shrink-0 accent-brand" checked={!!link?.storyIds.includes(story.id)} onChange={() => toggleStory(epic.id, feature.id, story.id)} />{story.title}
                    </label>)}
                  </div>}
                </div>;
              })}
              <form className="flex gap-2" onSubmit={(event) => addFeature(event, epic)}>
                <input className="field min-w-0 flex-1" aria-label={`New feature in ${epic.title}`} placeholder="New feature name" value={featureTitles[epic.id] ?? ''} onChange={(event) => setFeatureTitles((current) => ({ ...current, [epic.id]: event.target.value }))} />
                <button type="submit" className="btn-ghost shrink-0"><PlusIcon className="h-4 w-4" /> Add feature</button>
              </form>
            </div>}
          </section>;
        })}
        {epics.length === 0 && <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">No epics yet. Add the first epic below.</p>}
      </div>
      <form className="flex flex-wrap gap-2 border-t border-line pt-4" onSubmit={addEpic}>
        <input className="field min-w-0 flex-1" aria-label="New epic name" placeholder="New epic name" value={epicTitle} onChange={(event) => setEpicTitle(event.target.value)} />
        <button type="submit" className="btn-ghost shrink-0"><PlusIcon className="h-4 w-4" /> Add epic</button>
      </form>
    </div>
  </Modal>;
}
