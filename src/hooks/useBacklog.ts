import { useMemo } from 'react';
import { createId, today } from '../utils/id';
import { capabilitiesWithoutEpic, capabilitiesWithoutStory, releaseFeatures } from '../utils/capabilities';
import { composeStoryTitle, mapStories, normalizeStories, taskPhaseId, taskTypeForPhase, taskTypes } from '../utils/backlog';
import type { Actor, Asset, Backlog, Epic, Feature, Product, Sprint, Task, UserStory, WorkflowPhase } from '../types/portfolio';

export type TaskInput = Pick<Task, 'title' | 'description'> & {phaseId: string;};

export interface NewStory {
  actorId: string;
  want: string;
  benefit: string;
}

function storiesInSprint(backlog: Backlog, sprintId: string): Set<string> {
  const ids = new Set<string>();
  for (const epic of backlog.epics) {
    for (const feature of epic.features) {
      for (const story of feature.stories) {
        if (story.sprintId === sprintId) ids.add(story.id);
      }
    }
  }
  return ids;
}

function pruneSprintTasks(backlog: Backlog): Backlog {
  return {
    ...backlog,
    sprints: backlog.sprints.map((sprint) => {
      const allowed = storiesInSprint(backlog, sprint.id);
      return {
        ...sprint,
        tasks: sprint.tasks.filter((task) => allowed.has(task.storyId))
      };
    })
  };
}

export function useBacklog(update: (fn: (p: Product) => Product) => void) {
  return useMemo(() => {
    const set = (fn: (b: Backlog) => Backlog) => update((p) => ({ ...p, backlog: fn(p.backlog) }));

    const applySubBacklogMembership = (input: Backlog): Backlog => {
      // A user story belongs to at most one sub-product backlog: the first one listed wins.
      const claimed = new Set<string>();
      const b: Backlog = { ...input, subBacklogs: input.subBacklogs.map((item) => {
        const storyIds = Array.from(new Set(item.storyIds)).filter((id) => !claimed.has(id));
        storyIds.forEach((id) => claimed.add(id));
        return { ...item, storyIds };
      }) };
      const sprintForStory = new Map<string, string>();
      for (const sprint of b.sprints) {
        if (sprint.subBacklogIds.length === 0) continue;
        const ids = b.subBacklogs.filter((item) => sprint.subBacklogIds.includes(item.id)).flatMap((item) => item.storyIds);
        for (const storyId of ids) sprintForStory.set(storyId, sprint.id);
      }
      const managed = new Set(b.sprints.filter((sprint) => sprint.subBacklogIds.length > 0).map((sprint) => sprint.id));
      return pruneSprintTasks(mapStories(b, (story) => {
        const sprintId = sprintForStory.get(story.id);
        if (sprintId) return { ...story, sprintId, sprintSource: 'sub-backlog' as const };
        return story.sprintId && managed.has(story.sprintId) && story.sprintSource !== 'direct' ? { ...story, sprintId: null, sprintSource: undefined } : story;
      }));
    };

    const mapFeatures = (b: Backlog, fn: (f: Feature) => Feature): Backlog => ({
      ...b,
      epics: b.epics.map((e) => ({ ...e, features: e.features.map(fn) }))
    });

    return {
      addEpic(title: string): string {
        const id = createId('e');
        set((b) => ({ ...b, epics: [...b.epics, { id, title, description: '', features: [] }] }));
        return id;
      },
      updateEpic(id: string, changes: Partial<Epic>) {
        set((b) => ({ ...b, epics: b.epics.map((e) => e.id === id ? { ...e, ...changes } : e) }));
      },
      deleteEpic(id: string) {
        update((p) => {
          const featureIds = new Set(p.backlog.epics.find((epic) => epic.id === id)?.features.map((feature) => feature.id) ?? []);
          return {
            ...p,
            capabilities: capabilitiesWithoutEpic(p.capabilities, id, featureIds),
            backlog: { ...p.backlog, epics: p.backlog.epics.filter((epic) => epic.id !== id) }
          };
        });
      },
      addFeature(epicId: string, title: string, description = ''): string {
        const id = createId('f');
        set((b) => ({
          ...b,
          epics: b.epics.map((e) =>
          e.id === epicId ? { ...e, features: [...e.features, { id, title, description, stories: [] }] } : e
          )
        }));
        return id;
      },
      updateFeature(id: string, changes: Partial<Pick<Feature, 'title' | 'description'>>) {
        set((b) => mapFeatures(b, (f) => f.id === id ? { ...f, ...changes } : f));
      },
      deleteFeature(featureId: string) {
        update((p) => ({
          ...p,
          capabilities: releaseFeatures(p.capabilities, new Set([featureId])),
          backlog: {
            ...p.backlog,
            epics: p.backlog.epics.map((epic) => ({ ...epic, features: epic.features.filter((feature) => feature.id !== featureId) }))
          }
        }));
      },
      addStory(featureId: string, input: NewStory): string {
        const id = createId('us');
        set((b) => {
          const actor = b.actors.find((a) => a.id === input.actorId);
          const story: UserStory = {
            id,
            title: composeStoryTitle(actor?.name ?? 'user', input.want, input.benefit),
            actorId: input.actorId,
            want: input.want.trim(),
            benefit: input.benefit.trim(),
            description: '',
            attachments: [],
            points: null,
            priority: 'medium',
            dependencyIds: [],
            sprintId: null,
            phaseId: b.phases[0]?.id ?? '',
            statusId: b.phases[0]?.statuses[0]?.id ?? '',
            deliveries: {},
          };
          return mapFeatures(b, (f) => f.id === featureId ? { ...f, stories: [...f.stories, story] } : f);
        });
        return id;
      },
      updateStory(storyId: string, changes: Partial<UserStory>) {
        set((b) =>
        pruneSprintTasks(mapStories(b, (s) => {
          if (s.id !== storyId) return s;
          const next = { ...s, ...changes };
          if (changes.dependencyIds) {
            const all = new Map(b.epics.flatMap((epic) => epic.features.flatMap((feature) => feature.stories)).map((story) => [story.id, story]));
            const reaches = (from: string, target: string, visited = new Set<string>()): boolean => {
              if (from === target) return true;
              if (visited.has(from)) return false;
              visited.add(from);
              return (all.get(from)?.dependencyIds ?? []).some((id) => reaches(id, target, visited));
            };
            next.dependencyIds = changes.dependencyIds.filter((id) => id !== storyId && all.has(id) && !reaches(id, storyId));
          }
          if (next.sprintId) {
            const index = b.sprints.findIndex((sprint) => sprint.id === next.sprintId);
            const all = b.epics.flatMap((epic) => epic.features.flatMap((feature) => feature.stories));
            if (index < 0 || (next.dependencyIds ?? []).some((id) => {
              const dependency = all.find((story) => story.id === id);
              return !dependency?.sprintId || b.sprints.findIndex((sprint) => sprint.id === dependency.sprintId) > index;
            })) next.sprintId = changes.dependencyIds ? null : s.sprintId;
          }
          if (next.sprintId !== s.sprintId) next.sprintSource = next.sprintId ? 'direct' : undefined;
          if ('actorId' in changes || 'want' in changes || 'benefit' in changes) {
            const actor = b.actors.find((a) => a.id === next.actorId);
            next.title = composeStoryTitle(actor?.name ?? 'user', next.want, next.benefit);
          }
          return next;
        }))
        );
      },
      deleteStory(storyId: string) {
        update((p) => ({
          ...p,
          capabilities: capabilitiesWithoutStory(p.capabilities, storyId),
          backlog: pruneSprintTasks(mapStories(mapFeatures({
            ...p.backlog,
            subBacklogs: p.backlog.subBacklogs.map((item) => ({ ...item, storyIds: item.storyIds.filter((id) => id !== storyId) }))
          }, (f) => ({ ...f, stories: f.stories.filter((s) => s.id !== storyId) })), (story) => ({ ...story, dependencyIds: (story.dependencyIds ?? []).filter((id) => id !== storyId) })))
        }));
      },
      addActor(actor: Omit<Actor, 'id'>) {
        set((b) => ({ ...b, actors: [...b.actors, { ...actor, id: createId('ac') }] }));
      },
      updateActor(id: string, changes: Partial<Actor>) {
        set((b) => {
          const actors = b.actors.map((a) => a.id === id ? { ...a, ...changes } : a);
          const renamed = { ...b, actors };
          if (!changes.name) return renamed;
          return mapStories(renamed, (s) =>
          s.actorId === id ? { ...s, title: composeStoryTitle(changes.name ?? '', s.want, s.benefit) } : s
          );
        });
      },
      deleteActor(id: string) {
        set((b) => mapStories({ ...b, actors: b.actors.filter((a) => a.id !== id) }, (s) => s.actorId === id ? { ...s, actorId: null } : s));
      },
      saveSubBacklog(input: {id?: string;name: string;storyIds: string[];}): string {
        const id = input.id ?? createId('sb');
        set((b) => {
          const taken = new Set(b.subBacklogs.filter((item) => item.id !== id).flatMap((item) => item.storyIds));
          const storyIds = Array.from(new Set(input.storyIds)).filter((storyId) => !taken.has(storyId));
          const next = input.id ?
            b.subBacklogs.map((item) => item.id === id ? { ...item, name: input.name, storyIds } : item) :
            [...b.subBacklogs, { id, name: input.name, storyIds }];
          return applySubBacklogMembership({ ...b, subBacklogs: next });
        });
        return id;
      },
      setStorySubBacklog(storyId: string, subBacklogId: string | null) {
        set((b) => applySubBacklogMembership({
          ...b,
          subBacklogs: b.subBacklogs.map((item) => {
            const rest = item.storyIds.filter((id) => id !== storyId);
            return item.id === subBacklogId ? { ...item, storyIds: [...rest, storyId] } : { ...item, storyIds: rest };
          })
        }));
      },
      deleteSubBacklog(id: string) {
        set((b) => applySubBacklogMembership({
          ...b,
          subBacklogs: b.subBacklogs.filter((item) => item.id !== id),
          sprints: b.sprints.map((sprint) => ({ ...sprint, subBacklogIds: sprint.subBacklogIds.filter((item) => item !== id) }))
        }));
      },
      addTasks(sprintId: string, storyId: string, inputs: TaskInput[]) {
        set((b) => {
          const allowed = storiesInSprint(b, sprintId);
          if (!allowed.has(storyId)) return b;
          const tasks: Task[] = inputs.flatMap((input) => {
            const phase = b.phases.find((item) => item.id === input.phaseId);
            if (!input.title.trim() || !phase) return [];
            const assignmentType = taskTypeForPhase(b, phase);
            return [{ id: createId('tk'), title: input.title.trim(), phaseId: phase.id, assignmentType, description: input.description.trim(), done: false, storyId, conceptionStage: assignmentType === 'Conception Task' ? 'analyse' as const : undefined, adr: null }];
          });
          if (!tasks.length) return b;
          return { ...b, sprints: b.sprints.map((sprint) => sprint.id === sprintId ? { ...sprint, increment: null, tasks: [...sprint.tasks, ...tasks] } : sprint) };
        });
      },
      addTaskType(name: string) {
        const next = name.trim();
        if (!next) return;
        set((b) => ({ ...b, taskTypes: taskTypes(b).some((type) => type.toLowerCase() === next.toLowerCase()) ? taskTypes(b) : [...taskTypes(b), next] }));
      },
      updateTask(sprintId: string, taskId: string, changes: TaskInput) {
        set((b) => {
          const phase = b.phases.find((item) => item.id === changes.phaseId);
          if (!changes.title.trim() || !phase) return b;
          return { ...b, sprints: b.sprints.map((sprint) => sprint.id === sprintId ? { ...sprint, increment: null, tasks: sprint.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const assignmentType = taskPhaseId(b, task) === phase.id ? task.assignmentType : taskTypeForPhase(b, phase);
            const conception = assignmentType === 'Conception Task';
            return { ...task, title: changes.title.trim(), phaseId: phase.id, assignmentType, description: changes.description.trim(), done: conception && task.assignmentType !== 'Conception Task' ? false : task.done, conceptionStage: conception ? task.conceptionStage ?? 'analyse' : undefined };
          }) } : sprint) };
        });
      },
      /** The deliverable of one phase of a story (spec, prototype, build…), shown in Realised. */
      setStoryDelivery(storyId: string, phaseId: string, asset: Asset | null) {
        set((b) => mapStories(b, (story) => {
          if (story.id !== storyId) return story;
          const deliveries = { ...story.deliveries };
          if (asset) deliveries[phaseId] = { asset, completedAt: today() };else delete deliveries[phaseId];
          return { ...story, deliveries };
        }));
      },
      setTaskDone(sprintId: string, taskId: string, done: boolean) {
        set((b) => ({
          ...b,
          sprints: b.sprints.map((sprint) => sprint.id === sprintId ? { ...sprint, increment: null, tasks: sprint.tasks.map((task) => task.id === taskId && (task.assignmentType !== 'Conception Task' || !done || task.conceptionStage === 'done') ? { ...task, done } : task) } : sprint)
        }));
      },
      setConceptionStage(sprintId: string, taskId: string, stage: 'analyse' | 'adr' | 'done', adr?: Task['adr']) {
        set((b) => ({ ...b, sprints: b.sprints.map((sprint) => sprint.id === sprintId ? { ...sprint, increment: null, tasks: sprint.tasks.map((task) => {
          if (task.id !== taskId || task.assignmentType !== 'Conception Task') return task;
          const evidence = adr === undefined ? task.adr : adr;
          if (stage === 'done' && !evidence?.value.trim()) return task;
          return { ...task, conceptionStage: stage, adr: evidence, done: stage === 'done' };
        }) } : sprint) }));
      },
      setSprintIncrement(sprintId: string, increment: Sprint['increment']) {
        set((b) => ({ ...b, sprints: b.sprints.map((sprint) => sprint.id === sprintId ? { ...sprint, increment } : sprint) }));
      },
      removeTask(sprintId: string, taskId: string) {
        set((b) => ({
          ...b,
          sprints: b.sprints.map((sprint) => sprint.id === sprintId ? { ...sprint, increment: null, tasks: sprint.tasks.filter((task) => task.id !== taskId) } : sprint)
        }));
      },
      saveSprint(input: Omit<Sprint, 'id'> & {id?: string;}, subBacklogIds: string[]): string {
        const id = input.id ?? createId('s');
        update((p) => {
          const previous = p.backlog.sprints.find((item) => item.id === id);
          const chosen = subBacklogIds.filter((item) => p.backlog.subBacklogs.some((backlog) => backlog.id === item));
          const number = previous?.number ?? (Math.max(0, ...p.backlog.sprints.map((item) => item.number ?? (Number(item.name.match(/^Sprint (\d+)$/i)?.[1]) || 0))) + 1);
          const sprint: Sprint = { id, number, name: `Sprint ${number}`, startDate: input.startDate, endDate: input.endDate, goal: input.goal, subBacklogIds: chosen, tasks: previous?.tasks ?? [], increment: previous?.increment ?? null };
          const sprints = input.id ?
            p.backlog.sprints.map((item) => item.id === id ? sprint : item) :
            [...p.backlog.sprints, sprint];
          const keepAssigned = chosen.length === 0 && (!previous || previous.subBacklogIds.length === 0);
          if (keepAssigned) return { ...p, backlog: pruneSprintTasks({ ...p.backlog, sprints }) };
          const selected = new Set(p.backlog.subBacklogs.filter((item) => chosen.includes(item.id)).flatMap((item) => item.storyIds));
          const allStories = p.backlog.epics.flatMap((epic) => epic.features.flatMap((feature) => feature.stories));
          const targetIndex = sprints.findIndex((item) => item.id === id);
          return {
            ...p,
            backlog: pruneSprintTasks(mapStories({ ...p.backlog, sprints }, (story) => {
              if (!selected.has(story.id)) return story.sprintId === id && story.sprintSource !== 'direct' ? { ...story, sprintId: null, sprintSource: undefined } : story;
              const ready = (story.dependencyIds ?? []).every((dependencyId) => {
                if (selected.has(dependencyId)) return true;
                const dependency = allStories.find((item) => item.id === dependencyId);
                return !!dependency?.sprintId && sprints.findIndex((item) => item.id === dependency.sprintId) <= targetIndex;
              });
              if (!ready) return { ...story, sprintId: null };
              return { ...story, sprintId: id, sprintSource: 'sub-backlog' as const };
            }))
          };
        });
        return id;
      },
      deleteSprint(id: string) {
        set((b) =>
        mapStories({ ...b, sprints: b.sprints.filter((s) => s.id !== id) }, (s) => s.sprintId === id ? { ...s, sprintId: null } : s)
        );
      },
      saveWorkflow(phases: WorkflowPhase[]) {
        set((b) => normalizeStories({ ...b, phases }));
      }
    };
  }, [update]);
}
