import React, { useState } from 'react';
import { PaperclipIcon, PlusIcon, UsersIcon } from 'lucide-react';
import { PhaseTrack } from './PhaseTrack';
import { composeStoryTitle, storyLabel, storyTone, sumPoints } from '../../utils/backlog';
import type { NewStory } from '../../hooks/useBacklog';
import type { Backlog, Feature } from '../../types/portfolio';

interface StoryListProps {
  feature: Feature | null;
  backlog: Backlog;
  storyQuery?: string;
  selectedStoryIds?: string[];
  blockedNotes?: Record<string, string>;
  onToggleStory?: (id: string) => void;
  onOpen: (id: string) => void;
  onAdd: (story: NewStory) => void;
  onManageActors: () => void;
}

export function StoryList({ feature, backlog, storyQuery = '', selectedStoryIds = [], blockedNotes = {}, onToggleStory, onOpen, onAdd, onManageActors }: StoryListProps) {
  const [actorId, setActorId] = useState('');
  const [want, setWant] = useState('');
  const [benefit, setBenefit] = useState('');

  const actor = backlog.actors.find((a) => a.id === actorId) ?? backlog.actors[0];
  const canAdd = !!actor && !!want.trim();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdd || !actor) return;
    onAdd({ actorId: actor.id, want, benefit });
    setWant('');
    setBenefit('');
  };

  return (
    <section aria-label="User stories" className="flex max-h-[560px] min-h-[280px] flex-col rounded-xl border border-line bg-white">
      <header className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">User stories</h2>
          <p className="truncate text-xs text-muted">{feature ? feature.title : 'Select a feature'}</p>
        </div>
        {feature &&
        <span className="shrink-0 text-xs tabular-nums text-muted">
            {feature.stories.length} stories · {sumPoints(feature.stories)} pts
          </span>
        }
      </header>

      {!feature ?
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted">
          Create an epic, then a feature, to start writing user stories.
        </div> :

      <>
          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {feature.stories.length === 0 &&
          <li className="px-3 py-6 text-center text-sm text-muted">No stories yet. Compose the first one below.</li>
          }
            {feature.stories.filter((story) => !storyQuery.trim() || story.title.toLowerCase().includes(storyQuery.trim().toLowerCase())).map((s) => {
            const sprint = backlog.sprints.find((x) => x.id === s.sprintId);
            const subBacklog = backlog.subBacklogs.find((item) => item.storyIds.includes(s.id));
            const blockedNote = blockedNotes[s.id];
            return (
              <li key={s.id} className="flex items-start">
                  {onToggleStory &&
                <input
                  type="checkbox"
                  aria-label={`Select ${s.title}`}
                  className="mt-3 ml-3 shrink-0"
                  checked={selectedStoryIds.includes(s.id)}
                  disabled={!!blockedNote}
                  onChange={() => onToggleStory(s.id)} />
                }
                  <button
                  onClick={() => onOpen(s.id)}
                  className="flex min-w-0 flex-1 items-start gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-canvas focus:outline-none focus-visible:bg-brand-50">
                  
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{s.title}</p>
                      {blockedNote && <p className="mt-0.5 text-xs text-amber-800">In {blockedNote}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <PhaseTrack backlog={backlog} story={s} />
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${s.priority === 'high' ? 'bg-red-50 text-red-700' : s.priority === 'low' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-800'}`}>{s.priority === 'high' ? 'High' : s.priority === 'low' ? 'Low' : 'Medium'} priority</span>
                        {!!s.dependencyIds?.length && <span className="text-[11px] text-muted">{s.dependencyIds.length} {s.dependencyIds.length > 1 ? 'dependencies' : 'dependency'}</span>}
                        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${storyTone(backlog, s)}`}>
                          {storyLabel(backlog, s)}
                        </span>
                        {sprint && <span aria-label={`Sprint ${sprint.name}`} className="whitespace-nowrap rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium text-ink">
                          {sprint.name}
                        </span>}
                        {subBacklog && <span aria-label={`Sub-product backlog ${subBacklog.name}`} className="whitespace-nowrap rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                          {subBacklog.name}
                        </span>}
                        {s.attachments.length > 0 &&
                      <span className="inline-flex items-center gap-0.5 text-xs text-muted">
                            <PaperclipIcon className="h-3 w-3" aria-hidden /> {s.attachments.length}
                          </span>
                      }
                      </div>
                    </div>
                    <span
                    className={`flex h-7 min-w-[28px] shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums ${
                    s.points ? 'bg-ink text-white' : 'border border-dashed border-line text-muted'}`
                    }
                    aria-label={s.points ? `${s.points} story points` : 'Not estimated'}>
                    
                      {s.points ?? '?'}
                    </span>
                  </button>
                </li>);

          })}
          </ul>

          {backlog.actors.length === 0 ?
        <div className="flex items-center justify-between gap-3 border-t border-line bg-canvas px-3 py-2">
              <p className="text-sm text-muted">Add actors first — every story is written for an actor.</p>
              <button className="btn-ghost shrink-0 px-3 py-1.5" onClick={onManageActors}>
                <UsersIcon className="h-4 w-4" /> Add actors
              </button>
            </div> :

        <form onSubmit={submit} className="border-t border-line bg-canvas p-3">
              <div className="grid gap-2 md:grid-cols-[auto_170px_auto_1fr] md:items-center">
                <span className="text-xs font-medium text-muted">As a</span>
                <select aria-label="Actor" className="field" value={actor?.id ?? ''} onChange={(e) => setActorId(e.target.value)}>
                  {backlog.actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <span className="text-xs font-medium text-muted">I want</span>
                <input aria-label="I want" className="field" placeholder="to add stops to a route" value={want} onChange={(e) => setWant(e.target.value)} />
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-[auto_1fr_auto] md:items-center">
                <span className="text-xs font-medium text-muted">so that</span>
                <input aria-label="So that (optional)" className="field" placeholder="optional — the benefit" value={benefit} onChange={(e) => setBenefit(e.target.value)} />
                <button type="submit" className="btn-primary px-3" disabled={!canAdd}>
                  <PlusIcon className="h-4 w-4" /> Add story
                </button>
              </div>
              {canAdd && actor &&
          <p className="mt-2 truncate text-xs text-muted">
                  Preview: <span className="text-ink">{composeStoryTitle(actor.name, want, benefit)}</span>
                </p>
          }
            </form>
        }
        </>
      }
    </section>);

}
