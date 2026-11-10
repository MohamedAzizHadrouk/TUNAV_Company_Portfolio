import { defaultStatuses } from '../data/scrum';
import { defaultTaskTypes } from './backlog';
import type { AsIsItem, Asset, Capability, CapabilityLink, Domain, Product, UserStory, WorkflowStatus } from '../types/portfolio';

function slugDomainId(name: string, used: Set<string>): string {
  const base = `dom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'domain'}`;
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  return id;
}

interface EpicRef {
  id: string;
  features: {id: string;}[];
}

function readEpics(product: Record<string, unknown>): EpicRef[] {
  const backlog = product.backlog;
  if (!backlog || typeof backlog !== 'object') return [];
  const epics = (backlog as {epics?: unknown;}).epics;
  if (!Array.isArray(epics)) return [];
  return epics.flatMap((epic) => {
    if (!epic || typeof epic !== 'object') return [];
    const id = (epic as {id?: unknown;}).id;
    if (typeof id !== 'string' || !id) return [];
    const features = Array.isArray((epic as {features?: unknown;}).features) ? (epic as {features: unknown[];}).features : [];
    return [{
      id,
      features: features.flatMap((feature) => {
        if (!feature || typeof feature !== 'object') return [];
        const featureId = (feature as {id?: unknown;}).id;
        return typeof featureId === 'string' && featureId ? [{ id: featureId }] : [];
      })
    }];
  });
}

function epicForFeature(epics: EpicRef[], featureId: string): string | null {
  return epics.find((epic) => epic.features.some((feature) => feature.id === featureId))?.id ?? null;
}

function asLinks(value: unknown, featureId: unknown, epics: EpicRef[]): CapabilityLink[] {
  const rows = Array.isArray(value) ? value : typeof featureId === 'string' && featureId ? [{ featureId, storyIds: [] }] : [];
  return rows.flatMap((link) => {
    if (!link || typeof link !== 'object') return [];
    const rawFeature = (link as {featureId?: unknown;}).featureId;
    const feature = typeof rawFeature === 'string' && rawFeature ? rawFeature : null;
    const storyIds = Array.isArray((link as {storyIds?: unknown;}).storyIds) ?
      (link as {storyIds: unknown[];}).storyIds.filter((id): id is string => typeof id === 'string') :
      [];
    const explicitEpic = (link as {epicId?: unknown;}).epicId;
    if (typeof explicitEpic === 'string' && explicitEpic) {
      const featureRemains = feature ? epicForFeature(epics, feature) : null;
      return [{ epicId: explicitEpic, featureId: feature && featureRemains ? feature : null, storyIds: feature && featureRemains ? storyIds : [] }];
    }
    if (!feature) return [];
    const epicId = epicForFeature(epics, feature);
    if (!epicId) return [];
    return [{ epicId, featureId: feature, storyIds }];
  });
}

function migrateCapability(raw: Record<string, unknown>, domainId: string, epics: EpicRef[]): Capability {
  return {
    id: String(raw.id ?? ''),
    domainId,
    name: typeof raw.name === 'string' ? raw.name : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    status: raw.status === 'implemented' || raw.status === 'partial' || raw.status === 'not-started' || raw.status === 'removed' ? raw.status : 'not-started',
    evidence: raw.evidence && typeof raw.evidence === 'object' ? raw.evidence as Capability['evidence'] : null,
    confidence: raw.confidence === 'high' || raw.confidence === 'medium' || raw.confidence === 'low' ? raw.confidence : 'medium',
    links: asLinks(raw.links, raw.featureId, epics),
    asIsId: typeof raw.asIsId === 'string' && raw.asIsId ? raw.asIsId : null,
    statusNote: typeof raw.statusNote === 'string' ? raw.statusNote : ''
  };
}

function readAsset(value: unknown): Asset | null {
  if (!value || typeof value !== 'object') return null;
  const asset = value as {kind?: unknown;value?: unknown;fileName?: unknown;};
  if (asset.kind !== 'text' && asset.kind !== 'url' && asset.kind !== 'file') return null;
  if (typeof asset.value !== 'string' || !asset.value) return null;
  return { kind: asset.kind, value: asset.value, fileName: typeof asset.fileName === 'string' ? asset.fileName : undefined };
}

function migrateAsIs(value: unknown): AsIsItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const raw = item as Record<string, unknown>;
    if (typeof raw.id !== 'string' || !raw.id || typeof raw.title !== 'string' || !raw.title) return [];
    return [{
      id: raw.id,
      title: raw.title,
      description: typeof raw.description === 'string' ? raw.description : '',
      documents: Array.isArray(raw.documents) ? raw.documents.map(readAsset).filter((asset): asset is Asset => asset !== null) : [],
      addedAt: typeof raw.addedAt === 'string' ? raw.addedAt : ''
    }];
  });
}

export function migrateProduct(raw: unknown): Product {
  const product = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const used = new Set<string>();
  const domains: Domain[] = [];
  const byName = new Map<string, string>();

  const remember = (domain: Domain) => {
    if (domains.some((item) => item.id === domain.id)) return;
    used.add(domain.id);
    domains.push({ id: domain.id, name: domain.name, description: domain.description ?? '' });
    byName.set(domain.name.trim().toLowerCase(), domain.id);
  };

  if (Array.isArray(product.domains)) {
    for (const item of product.domains) {
      if (!item || typeof item !== 'object') continue;
      const name = typeof (item as { name?: unknown; }).name === 'string' ? (item as { name: string; }).name.trim() : '';
      const id = typeof (item as { id?: unknown; }).id === 'string' ? (item as { id: string; }).id : '';
      if (!name || !id) continue;
      remember({
        id,
        name,
        description: typeof (item as { description?: unknown; }).description === 'string' ? (item as { description: string; }).description : ''
      });
    }
  }

  const legacyNames = Array.isArray(product.capabilityDomains) ?
    product.capabilityDomains.filter((name): name is string => typeof name === 'string' && !!name.trim()) :
    [];
  for (const name of legacyNames) {
    const key = name.trim().toLowerCase();
    if (!byName.has(key)) remember({ id: slugDomainId(name, used), name: name.trim(), description: '' });
  }

  const epics = readEpics(product);
  const capabilities = (Array.isArray(product.capabilities) ? product.capabilities : []).map((item) => {
    const cap = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    let domainId = typeof cap.domainId === 'string' ? cap.domainId : '';
    if (!domainId || !used.has(domainId)) {
      const legacy = typeof cap.domain === 'string' ? cap.domain.trim() : '';
      const key = legacy.toLowerCase();
      if (legacy && byName.has(key)) domainId = byName.get(key) ?? '';
      else
      if (legacy) {
        domainId = slugDomainId(legacy, used);
        remember({ id: domainId, name: legacy, description: '' });
      } else domainId = domains[0]?.id ?? '';
    }
    if (!domainId) {
      domainId = slugDomainId('General', used);
      remember({ id: domainId, name: 'General', description: '' });
    }
    // Keep every extra domain that still exists; the primary one always comes first.
    const extra = Array.isArray(cap.domainIds) ? cap.domainIds.filter((id): id is string => typeof id === 'string' && used.has(id) && id !== domainId) : [];
    return { ...migrateCapability(cap, domainId, epics), domainIds: [domainId, ...Array.from(new Set(extra))] };
  });

  const rest = { ...product };
  delete rest.capabilityDomains;
  return { ...(rest as unknown as Product), domains, asIs: migrateAsIs(product.asIs), capabilities, backlog: migrateBacklog(product.backlog) };
}

function readStatusList(value: unknown): WorkflowStatus[] {
  if (!Array.isArray(value)) return [];
  const rows = value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const id = (item as {id?: unknown;}).id;
    if (typeof id !== 'string' || !id) return [];
    const name = (item as {name?: unknown;}).name;
    return [{ id, name: typeof name === 'string' ? name : '', isComplete: (item as {isComplete?: unknown;}).isComplete === true }];
  });
  if (rows.length && !rows.some((status) => status.isComplete)) rows[rows.length - 1] = { ...rows[rows.length - 1], isComplete: true };
  return rows;
}

function migrateBacklog(value: unknown): Product['backlog'] {
  const backlog = (value && typeof value === 'object' ? value : {}) as Record<string, unknown> & Product['backlog'];
  const global = readStatusList(backlog.statuses);
  const source = global.length ? global : defaultStatuses.map((status) => ({ ...status }));
  const phases = (Array.isArray(backlog.phases) ? backlog.phases : []).flatMap((phase) => {
    if (!phase || typeof phase !== 'object') return [];
    const item = phase as {id?: unknown;statuses?: unknown;name?: string;deliveryLabel?: string;deliveryType?: 'text' | 'url' | 'file';};
    const phaseId = typeof item.id === 'string' && item.id ? item.id : 'phase';
    const own = readStatusList(item.statuses);
    return [{
      ...item,
      id: phaseId,
      name: item.name ?? '',
      deliveryLabel: item.deliveryLabel ?? 'Delivery',
      deliveryType: item.deliveryType === 'text' || item.deliveryType === 'url' || item.deliveryType === 'file' ? item.deliveryType : 'url',
      statuses: own.length ? own : source.map((status) => ({ ...status, id: `${status.id}--${phaseId}` }))
    }];
  });
  const lifted: {sprintId: string;id: string;title: string;done: boolean;storyId: string;}[] = [];
  const epics = Array.isArray(backlog.epics) ? backlog.epics.map((epic) => {
    if (!epic || typeof epic !== 'object') return epic;
    return {
      ...epic,
      features: (Array.isArray(epic.features) ? epic.features : []).map((feature) => {
        if (!feature || typeof feature !== 'object') return feature;
        return {
          ...feature,
          stories: (Array.isArray(feature.stories) ? feature.stories : []).map((story) => {
            if (!story || typeof story !== 'object') return story;
            const current = story as UserStory & {tasks?: unknown;};
            const phaseId = typeof current.phaseId === 'string' ? current.phaseId : phases[0]?.id ?? '';
            const phase = phases.find((item) => item.id === phaseId) ?? phases[0];
            const statusId = typeof current.statusId === 'string' ? current.statusId : '';
            const ids = new Set(phase?.statuses.map((status) => status.id) ?? []);
            const remapped = `${statusId}--${phase?.id ?? ''}`;
            const rawTasks = Array.isArray(current.tasks) ? current.tasks.flatMap((task) => {
              if (!task || typeof task !== 'object') return [];
              const taskId = (task as {id?: unknown;}).id;
              if (typeof taskId !== 'string' || !taskId) return [];
              const title = (task as {title?: unknown;}).title;
              return [{ id: taskId, title: typeof title === 'string' ? title : '', done: (task as {done?: unknown;}).done === true }];
            }) : [];
            const storySprintId = typeof current.sprintId === 'string' ? current.sprintId : '';
            if (storySprintId) {
              for (const task of rawTasks) lifted.push({ sprintId: storySprintId, ...task, storyId: typeof current.id === 'string' ? current.id : '' });
            }
            const { tasks: _removed, ...rest } = current;
            return {
              ...rest,
              phaseId: phase?.id ?? phaseId,
              statusId: ids.has(statusId) ? statusId : ids.has(remapped) ? remapped : phase?.statuses[0]?.id ?? ''
            };
          })
        };
      })
    };
  }) : [];
  const subBacklogs = Array.isArray(backlog.subBacklogs) ? backlog.subBacklogs.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const id = (item as {id?: unknown;}).id;
    const name = (item as {name?: unknown;}).name;
    if (typeof id !== 'string' || !id || typeof name !== 'string') return [];
    const storyIds = Array.isArray((item as {storyIds?: unknown;}).storyIds) ?
    (item as {storyIds: unknown[];}).storyIds.filter((storyId): storyId is string => typeof storyId === 'string') :
    [];
    return [{ id, name, storyIds }];
  }) : [];
  const sprints = (Array.isArray(backlog.sprints) ? backlog.sprints : []).map((sprint) => {
    if (!sprint || typeof sprint !== 'object') return sprint;
    const sprintId = typeof (sprint as {id?: unknown;}).id === 'string' ? (sprint as {id: string;}).id : '';
    const ids = Array.isArray((sprint as {subBacklogIds?: unknown;}).subBacklogIds) ?
    (sprint as {subBacklogIds: unknown[];}).subBacklogIds.filter((id): id is string => typeof id === 'string') :
    [];
    const own = Array.isArray((sprint as {tasks?: unknown;}).tasks) ?
    (sprint as {tasks: unknown[];}).tasks.flatMap((task) => {
      if (!task || typeof task !== 'object') return [];
      const taskId = (task as {id?: unknown;}).id;
      if (typeof taskId !== 'string' || !taskId) return [];
      const title = (task as {title?: unknown;}).title;
      const singleStoryId = (task as {storyId?: unknown;}).storyId;
      const storyIds = typeof singleStoryId === 'string' && singleStoryId ? [singleStoryId] : Array.isArray((task as {storyIds?: unknown;}).storyIds) ?
      (task as {storyIds: unknown[];}).storyIds.filter((storyId): storyId is string => typeof storyId === 'string') :
      [];
      const assignmentType = (task as {assignmentType?: unknown;}).assignmentType;
      const description = (task as {description?: unknown;}).description;
      return Array.from(new Set(storyIds)).map((storyId, index) => ({ id: index ? `${taskId}-${index + 1}` : taskId, title: typeof title === 'string' ? title : '', done: (task as {done?: unknown;}).done === true, storyId, assignmentType: typeof assignmentType === 'string' && assignmentType.trim() ? assignmentType : defaultTaskTypes[1], description: typeof description === 'string' ? description : '' }));
    }) :
    [];
    const seen = new Set(own.map((task) => task.id));
    const fromStories = lifted.flatMap((task) => {
      if (task.sprintId !== sprintId || !task.storyId || seen.has(task.id)) return [];
      seen.add(task.id);
      return [{ id: task.id, title: task.title, done: task.done, storyId: task.storyId, assignmentType: defaultTaskTypes[1], description: '' }];
    });
    return { ...sprint, subBacklogIds: ids, tasks: [...own, ...fromStories] };
  });
  const next = { ...backlog } as Record<string, unknown>;
  delete next.statuses;
  return {
    ...(next as unknown as Product['backlog']),
    phases,
    epics,
    actors: Array.isArray(backlog.actors) ? backlog.actors : [],
    sprints,
    subBacklogs,
    taskTypes: Array.from(new Set([...defaultTaskTypes, ...(Array.isArray(backlog.taskTypes) ? backlog.taskTypes.filter((item): item is string => typeof item === 'string' && !!item.trim()) : []), ...sprints.flatMap((sprint) => sprint.tasks.map((task) => task.assignmentType))]))
  };
}

export function migrateProducts(raw: unknown): Product[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(migrateProduct);
}
