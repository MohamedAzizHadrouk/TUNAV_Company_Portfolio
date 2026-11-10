import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, Trash2Icon, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { AssetView } from '../AssetView';
import { StoryAttachments } from './StoryAttachments';
import { MultiSelect } from '../MultiSelect';
import { storyPointScale } from '../../data/scrum';
import { flattenStories, isStoryDone, phaseStateLabels, phaseStateTones, storyProgress, storyTasks, taskPhaseId, type StoryEntry } from '../../utils/backlog';
import type { Backlog, UserStory } from '../../types/portfolio';

interface StoryDrawerProps {
  entry: StoryEntry | null;
  backlog: Backlog;
  onUpdate: (id: string, changes: Partial<UserStory>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function StoryDrawer({ entry, backlog, onUpdate, onDelete, onClose }: StoryDrawerProps) {
  useEffect(() => {
    if (!entry) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entry, onClose]);

  return (
    <>
      <AnimatePresence>
        {entry &&
        <div className="fixed inset-0 z-40">
            <motion.div
            className="absolute inset-0 bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose} />
          
            <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="User story"
            className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 48, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
            
              <StoryBody
              key={entry.story.id}
              entry={entry}
              backlog={backlog}
              onUpdate={(changes) => onUpdate(entry.story.id, changes)}
              onDelete={() => onDelete(entry.story.id)}
              onClose={onClose} />

            </motion.aside>
          </div>
        }
      </AnimatePresence>
    </>);

}

interface StoryBodyProps {
  entry: StoryEntry;
  backlog: Backlog;
  onUpdate: (changes: Partial<UserStory>) => void;
  onDelete: () => void;
  onClose: () => void;
}

function StoryBody({ entry, backlog, onUpdate, onDelete, onClose }: StoryBodyProps) {
  const { story, epic, feature } = entry;
  const { id: productId } = useParams();
  const [want, setWant] = useState(story.want);
  const [benefit, setBenefit] = useState(story.benefit);
  const [description, setDescription] = useState(story.description);

  const progress = storyProgress(backlog, story);
  const tasks = storyTasks(backlog, story.id);
  const sprint = backlog.sprints.find((item) => item.id === story.sprintId);
  const finished = progress.done;
  const dependencies = story.dependencyIds ?? [];
  const otherStories = flattenStories(backlog).filter((item) => item.story.id !== story.id);
  const blocked = dependencies.filter((id) => {
    const dependency = otherStories.find((item) => item.story.id === id);
    return dependency && !isStoryDone(backlog, dependency.story);
  });

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <p className="min-w-0 truncate pt-1 text-xs text-muted">
          {epic.title} <span aria-hidden>/</span> {feature.title}
        </p>
        <button className="icon-btn shrink-0" aria-label="Close" onClick={onClose}>
          <XIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {finished &&
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <CheckIcon className="h-3.5 w-3.5" /> Story completed
          </p>
        }
        <h2 className="text-lg font-semibold leading-snug text-ink">{story.title}</h2>

        <div className="mt-4 grid gap-2 rounded-xl bg-canvas p-3 sm:grid-cols-[64px_1fr] sm:items-center">
          <label htmlFor="story-actor" className="text-xs font-medium text-muted">As a</label>
          <select
            id="story-actor"
            className="field"
            value={story.actorId ?? ''}
            onChange={(e) => onUpdate({ actorId: e.target.value || null })}>
            
            {!story.actorId && <option value="">Choose an actor…</option>}
            {backlog.actors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <label htmlFor="story-want" className="text-xs font-medium text-muted">I want</label>
          <input
            id="story-want"
            className="field"
            value={want}
            onChange={(e) => setWant(e.target.value)}
            onBlur={() => want.trim() && want !== story.want && onUpdate({ want: want.trim() })} />
          
          <label htmlFor="story-benefit" className="text-xs font-medium text-muted">so that</label>
          <input
            id="story-benefit"
            className="field"
            placeholder="optional"
            value={benefit}
            onChange={(e) => setBenefit(e.target.value)}
            onBlur={() => benefit !== story.benefit && onUpdate({ benefit: benefit.trim() })} />
          
        </div>

        <textarea
          aria-label="Story description"
          rows={3}
          className="field mt-2"
          placeholder="Description, acceptance criteria, notes…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => description !== story.description && onUpdate({ description })} />
        

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-ink">Story points</p>
          <div className="flex flex-wrap gap-1">
            {storyPointScale.map((n) =>
            <button
              key={n}
              aria-pressed={story.points === n}
              onClick={() => onUpdate({ points: story.points === n ? null : n })}
              className={`h-8 w-8 rounded-md text-xs font-semibold tabular-nums transition-colors duration-150 ${
              story.points === n ? 'bg-ink text-white' : 'border border-line text-muted hover:text-ink'}`
              }>
              
                {n}
              </button>
            )}
          </div>
        </div>

        <section className="mt-4 rounded-xl border border-line" aria-label="Story planning">
          <div className="border-b border-line px-3 py-2.5">
            <h3 className="text-sm font-semibold text-ink">Planning</h3>
            <p className="text-xs text-muted">Set the priority and list what the story depends on.</p>
          </div>
          <div className="space-y-4 p-3">
            <div>
              <p className="text-sm font-medium text-ink" id="story-priority-label">Priority</p>
              <div role="group" aria-labelledby="story-priority-label" className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-canvas p-0.5">
                {([['high', 'High', 'bg-red-500'], ['medium', 'Medium', 'bg-amber-500'], ['low', 'Low', 'bg-slate-400']] as const).map(([value, text, dot]) => {
                  const active = (story.priority ?? 'medium') === value;
                  return <button key={value} type="button" aria-pressed={active} onClick={() => onUpdate({ priority: value })} className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}><span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />{text}</button>;
                })}
              </div>
            </div>

            <MultiSelect
              id="story-dependencies"
              label="Depends on"
              values={dependencies}
              options={otherStories.map(({ story: candidate, feature: candidateFeature }) => ({ value: candidate.id, label: candidate.title, hint: `${candidateFeature.title}${isStoryDone(backlog, candidate) ? ' · done' : ''}` }))}
              onChange={(dependencyIds) => onUpdate({ dependencyIds })}
              placeholder={otherStories.length ? 'Select one or more stories' : 'No other user stories yet'}
              searchPlaceholder="Search user stories"
              emptyText="No story matches" />
            {dependencies.length > 0 && <p className="-mt-2 text-xs text-muted">Plan the stories this one depends on first, in the same sprint or an earlier one.</p>}
            {blocked.length > 0 && <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">Blocked by {blocked.length} unfinished {blocked.length === 1 ? 'story' : 'stories'}.</p>}
          </div>
        </section>

        <div className="mt-4">
          <StoryAttachments attachments={story.attachments} onChange={(attachments) => onUpdate({ attachments })} />
        </div>

        <section className="mt-4 rounded-xl border border-line" aria-label="Progress">
          <div className="flex items-start justify-between gap-3 border-b border-line px-3 py-2.5">
            <div>
              <h3 className="text-sm font-semibold text-ink">Progress</h3>
              <p className="text-xs text-muted">Updated automatically from this story's tasks in Sprints &amp; tasks.</p>
            </div>
            {productId && <Link to={`/products/${productId}/flow?stage=sprints${sprint ? `&sprint=${sprint.id}` : ''}`} className="shrink-0 text-xs font-medium text-brand hover:text-brand-700" onClick={onClose}>{sprint ? `Open ${sprint.name}` : 'Plan in Sprints'}</Link>}
          </div>
          <div className="p-3">
            <p className="mb-3 text-xs text-muted">
              {sprint ? <>Planned in <span className="font-medium text-ink">{sprint.name}</span> · </> : <>Not planned in a sprint yet · </>}
              {progress.doneTasks}/{progress.totalTasks} tasks done
            </p>
            <ol className="relative">
              {progress.phases.map(({ phase, total, done, state, delivery }, i) => {
                const phaseTasks = tasks.filter(({ task }) => taskPhaseId(backlog, task) === phase.id);
                return (
                  <li key={phase.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < progress.phases.length - 1 &&
                    <span className={`absolute left-[11px] top-7 h-[calc(100%-28px)] w-px ${state === 'done' ? 'bg-brand' : 'bg-line'}`} aria-hidden />
                    }
                    <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    state === 'done' ? 'bg-brand text-white' : state === 'in-progress' || state === 'to-do' ? 'border-2 border-brand bg-white text-brand' : 'border border-line bg-white text-muted'}`}>
                      {state === 'done' ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`text-sm font-semibold ${state === 'not-started' ? 'text-muted' : 'text-ink'}`}>{phase.name}</p>
                        <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${phaseStateTones[state]}`}>
                          {phaseStateLabels[state]}{total > 0 ? ` · ${done}/${total}` : ''}
                        </span>
                      </div>
                      {total > 0 &&
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
                          <div className={`h-full rounded-full ${state === 'done' ? 'bg-emerald-500' : 'bg-brand'}`} style={{ width: `${done / total * 100}%` }} />
                        </div>
                      }
                      {phaseTasks.length > 0 &&
                      <ul className="mt-2 flex flex-col gap-0.5">
                          {phaseTasks.map(({ task, sprint: taskSprint }) =>
                        <li key={task.id} className="flex items-center gap-2 text-xs">
                              <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${task.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line'}`} aria-hidden>{task.done && <CheckIcon className="h-2.5 w-2.5" />}</span>
                              <span className={`min-w-0 flex-1 truncate ${task.done ? 'text-muted line-through' : 'text-ink'}`}>{task.title}</span>
                              <span className="shrink-0 text-muted">{taskSprint.name}</span>
                            </li>
                        )}
                        </ul>
                      }
                      {delivery &&
                      <div className="mt-2 rounded-lg bg-canvas px-3 py-2">
                          <p className="mb-1 text-[11px] font-medium text-muted">{phase.deliveryLabel} · delivered {format(new Date(delivery.completedAt), 'MMM d')}</p>
                          <AssetView asset={delivery.asset} />
                        </div>
                      }
                    </div>
                  </li>);
              })}
            </ol>
          </div>
        </section>
      </div>

      <footer className="border-t border-line px-6 py-3">
        <button className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-red-600" onClick={onDelete}>
          <Trash2Icon className="h-4 w-4" /> Delete story
        </button>
      </footer>
    </>);

}
