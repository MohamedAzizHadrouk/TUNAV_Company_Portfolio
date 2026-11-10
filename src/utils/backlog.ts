import { defaultPhases } from '../data/scrum';
import type { Backlog, Delivery, Epic, Feature, Sprint, Task, UserStory, WorkflowPhase, WorkflowStatus } from '../types/portfolio';

export interface StoryEntry {
  story: UserStory;
  epic: Epic;
  feature: Feature;
}

export const defaultTaskTypes = ['Conception Task', 'UI/UX Task', 'Development Task'];

export function taskTypes(backlog: Backlog): string[] {
  return Array.from(new Set([...defaultTaskTypes, ...(backlog.taskTypes ?? []).filter((type) => !defaultTaskTypes.includes(type))]));
}

export function composeStoryTitle(actorName: string, want: string, benefit: string): string {
  const article = /^[aeiou]/i.test(actorName.trim()) ? 'an' : 'a';
  const base = `As ${article} ${actorName.trim()}, I want ${want.trim()}`;
  return benefit.trim() ? `${base}, so that ${benefit.trim()}` : base;
}

export function createEmptyBacklog(): Backlog {
  return {
    actors: [],
    phases: defaultPhases.map((p) => ({ ...p, statuses: p.statuses.map((status) => ({ ...status })) })),
    sprints: [],
    epics: [],
    subBacklogs: [],
    taskTypes: [...defaultTaskTypes]
  };
}

export function flattenStories(b: Backlog): StoryEntry[] {
  return b.epics.flatMap((epic) =>
  epic.features.flatMap((feature) => feature.stories.map((story) => ({ story, epic, feature })))
  );
}

export function completeStatus(phase: WorkflowPhase | undefined): WorkflowStatus | undefined {
  return phase?.statuses.find((status) => status.isComplete) ?? phase?.statuses[phase.statuses.length - 1];
}

export function firstOpenStatus(phase: WorkflowPhase | undefined): WorkflowStatus | undefined {
  return phase?.statuses.find((status) => !status.isComplete) ?? phase?.statuses[0];
}

/* ---------- Progress, derived from sprint tasks ----------
 * A story's progress is never set by hand: each task belongs to one workflow phase,
 * a phase is done when it has tasks and all of them are done, and a story is done
 * when every phase is done. */

export type PhaseState = 'not-started' | 'to-do' | 'in-progress' | 'done';

export interface PhaseProgress {
  phase: WorkflowPhase;
  total: number;
  done: number;
  state: PhaseState;
  delivery?: Delivery;
}

export interface StoryProgress {
  phases: PhaseProgress[];
  /** Index of the first phase that is not done (the last phase once everything is done). */
  current: number;
  done: boolean;
  totalTasks: number;
  doneTasks: number;
}

export const phaseStateLabels: Record<PhaseState, string> = {
  'not-started': 'No tasks yet',
  'to-do': 'To do',
  'in-progress': 'In progress',
  done: 'Done'
};

export const phaseStateTones: Record<PhaseState, string> = {
  'not-started': 'bg-slate-100 text-slate-600',
  'to-do': 'bg-amber-50 text-amber-800',
  'in-progress': 'bg-brand-50 text-brand-700',
  done: 'bg-emerald-50 text-emerald-800'
};

/** The phase a task counts towards: its own phase, or the phase named in its assignment type ("UI/UX Task" → UI/UX). */
export function taskPhaseId(b: Backlog, task: Task): string | null {
  if (task.phaseId && b.phases.some((phase) => phase.id === task.phaseId)) return task.phaseId;
  const type = task.assignmentType.toLowerCase();
  return b.phases.find((phase) => phase.name.trim() && type.includes(phase.name.trim().toLowerCase()))?.id ?? null;
}

/** Assignment type used for a new task in a phase. "Conception Task" keeps its analyse → ADR steps. */
export function taskTypeForPhase(b: Backlog, phase: WorkflowPhase): string {
  const key = phase.name.trim().toLowerCase();
  return taskTypes(b).find((type) => key && type.toLowerCase().includes(key)) ?? `${phase.name.trim()} Task`;
}

export function storyTasks(b: Backlog, storyId: string): {task: Task;sprint: Sprint;}[] {
  return b.sprints.flatMap((sprint) => sprint.tasks.filter((task) => task.storyId === storyId).map((task) => ({ task, sprint })));
}

export function phaseState(total: number, done: number): PhaseState {
  if (total === 0) return 'not-started';
  if (done === total) return 'done';
  return done > 0 ? 'in-progress' : 'to-do';
}

export function storyProgress(b: Backlog, s: UserStory): StoryProgress {
  const tasks = storyTasks(b, s.id).map(({ task }) => task);
  const phases = b.phases.map((phase): PhaseProgress => {
    const own = tasks.filter((task) => taskPhaseId(b, task) === phase.id);
    const done = own.filter((task) => task.done).length;
    return { phase, total: own.length, done, state: phaseState(own.length, done), delivery: s.deliveries[phase.id] };
  });
  const firstOpen = phases.findIndex((item) => item.state !== 'done');
  return {
    phases,
    current: firstOpen < 0 ? Math.max(0, phases.length - 1) : firstOpen,
    done: phases.length > 0 && firstOpen < 0,
    totalTasks: tasks.length,
    doneTasks: tasks.filter((task) => task.done).length
  };
}

export function isStoryDone(b: Backlog, s: UserStory): boolean {
  return storyProgress(b, s).done;
}

export function sumPoints(stories: UserStory[]): number {
  return stories.reduce((n, s) => n + (s.points ?? 0), 0);
}

export function mapStories(b: Backlog, fn: (s: UserStory) => UserStory): Backlog {
  return {
    ...b,
    epics: b.epics.map((e) => ({
      ...e,
      features: e.features.map((f) => ({ ...f, stories: f.stories.map(fn) }))
    }))
  };
}

export function normalizeStories(b: Backlog): Backlog {
  return mapStories(b, (s) => {
    const phase = b.phases.find((item) => item.id === s.phaseId) ?? b.phases[0];
    const statusIds = new Set(phase?.statuses.map((status) => status.id) ?? []);
    return {
      ...s,
      phaseId: phase?.id ?? '',
      statusId: statusIds.has(s.statusId) ? s.statusId : phase?.statuses[0]?.id ?? ''
    };
  });
}

export function storyTone(b: Backlog, s: UserStory): string {
  const progress = storyProgress(b, s);
  if (progress.done) return phaseStateTones.done;
  if (progress.totalTasks === 0) return phaseStateTones['not-started'];
  return phaseStateTones[progress.phases[progress.current]?.state ?? 'to-do'];
}

export function storyLabel(b: Backlog, s: UserStory): string {
  const progress = storyProgress(b, s);
  if (progress.done) return 'Delivered';
  if (progress.totalTasks === 0) return 'Not started';
  const current = progress.phases[progress.current];
  return `${current?.phase.name ?? '—'} · ${phaseStateLabels[current?.state ?? 'to-do']}`;
}
