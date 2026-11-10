import { storyProgress } from '../../utils/backlog';
import type { Backlog, UserStory } from '../../types/portfolio';

/** One segment per phase: solid when done, light while its tasks are under way. */
export function PhaseTrack({ backlog, story }: {backlog: Backlog;story: UserStory;}) {
  const progress = storyProgress(backlog, story);
  return (
    <div className="flex gap-0.5" aria-hidden>
      {progress.phases.map(({ phase, state }) =>
      <span key={phase.id} className={`h-1.5 w-5 rounded-full ${state === 'done' ? 'bg-brand' : state === 'in-progress' ? 'bg-brand/40' : 'bg-line'}`} />
      )}
    </div>);

}
