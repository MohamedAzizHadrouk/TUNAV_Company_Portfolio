import { isStoryDone } from './backlog';
import type { Backlog, Capability, CapabilityLink, Domain, Epic, Feature, UserStory } from '../types/portfolio';

/** As-Is register: capabilities that exist today (fully or partly). */
export function isAsIs(c: Capability): boolean {
  return c.status !== 'not-started';
}

/** Gap: anything not fully implemented. */
export function isGap(c: Capability): boolean {
  return c.status !== 'implemented';
}

/** Capabilities still in scope: removed ones are rejected and don't count. */
export function activeCapabilities(caps: Capability[]): Capability[] {
  return caps.filter((c) => c.status !== 'removed');
}

/** Weighted coverage over in-scope capabilities: implemented = 1, partial = 0.5. */
export function coverage(caps: Capability[]): number {
  const active = activeCapabilities(caps);
  if (!active.length) return 0;
  const score = active.reduce((n, c) => n + (c.status === 'implemented' ? 1 : c.status === 'partial' ? 0.5 : 0), 0);
  return Math.round(score / active.length * 100);
}

export function findFeature(b: Backlog, featureId: string | null): {epic: Epic;feature: Feature;} | null {
  if (!featureId) return null;
  for (const epic of b.epics) {
    const feature = epic.features.find((f) => f.id === featureId);
    if (feature) return { epic, feature };
  }
  return null;
}

export interface ResolvedLink {
  epic: Epic;
  feature: Feature | null;
  stories: UserStory[];
}

export function findEpic(b: Backlog, epicId: string | null): Epic | null {
  if (!epicId) return null;
  return b.epics.find((epic) => epic.id === epicId) ?? null;
}

/** Links whose epic still exists. A missing feature is kept as an epic-only plan. */
export function resolvedLinks(b: Backlog, cap: Capability): ResolvedLink[] {
  const links: ResolvedLink[] = [];
  for (const link of cap.links) {
    const located = link.featureId ? findFeature(b, link.featureId) : null;
    const epic = findEpic(b, link.epicId) ?? located?.epic ?? null;
    if (!epic) continue;
    const feature = link.featureId ? epic.features.find((item) => item.id === link.featureId) ?? null : null;
    links.push({
      epic,
      feature,
      stories: feature ? feature.stories.filter((story) => link.storyIds.includes(story.id)) : []
    });
  }
  return links;
}

/** Planned when at least one linked epic still exists. Implementation status is separate. */
export function isPlanned(b: Backlog, cap: Capability): boolean {
  return resolvedLinks(b, cap).length > 0;
}

export function featureProgress(b: Backlog, feature: Feature) {
  const done = feature.stories.filter((s) => isStoryDone(b, s)).length;
  return { total: feature.stories.length, done, ready: feature.stories.length > 0 && done === feature.stories.length };
}

/** Ready only when every link has a feature whose stories are all done. An epic-only plan is not ready. */
export function capabilityReady(b: Backlog, cap: Capability): boolean {
  const links = resolvedLinks(b, cap);
  return links.length > 0 && links.every((link) => link.feature !== null && featureProgress(b, link.feature).ready);
}

export function domainName(domains: Domain[], domainId: string): string {
  return domains.find((d) => d.id === domainId)?.name ?? 'Unknown domain';
}

/** All domains of a capability; older capabilities only have their single domainId. */
export function capabilityDomainIds(c: Capability): string[] {
  if (c.domainIds?.length) return c.domainIds;
  return c.domainId ? [c.domainId] : [];
}

export function inDomain(c: Capability, domainId: string): boolean {
  return capabilityDomainIds(c).includes(domainId);
}

export function domainNames(domains: Domain[], c: Capability): string[] {
  return capabilityDomainIds(c).map((id) => domainName(domains, id));
}

/** The domain fields to store for a list of domain ids: the first one stays the primary domainId. */
export function withDomains(ids: string[]): Pick<Capability, 'domainId' | 'domainIds'> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  return { domainId: unique[0] ?? '', domainIds: unique };
}

export function domainNameTaken(domains: Domain[], name: string, exceptId?: string): boolean {
  const key = name.trim().toLowerCase();
  return domains.some((d) => d.id !== exceptId && d.name.trim().toLowerCase() === key);
}

export function groupByDomain(caps: Capability[], domains: Domain[]): {domain: Domain;items: Capability[];}[] {
  const known = new Set(domains.map((d) => d.id));
  const extras = caps.flatMap(capabilityDomainIds).filter((id) => id && !known.has(id));
  const ids = [...domains.map((d) => d.id), ...Array.from(new Set(extras))];
  return ids.
  map((id) => ({
    domain: domains.find((d) => d.id === id) ?? { id, name: 'Unknown domain', description: '' },
    items: caps.filter((c) => inDomain(c, id))
  })).
  filter((g) => g.items.length > 0);
}

export function upsertCapabilityLink(cap: Capability, epicId: string, featureId: string | null, storyIds: string[]): Capability {
  const nextLink: CapabilityLink = { epicId, featureId, storyIds: featureId ? Array.from(new Set(storyIds)) : [] };
  const links = cap.links.filter((link) => {
    if (featureId && link.featureId === featureId) return false;
    if (!featureId && link.epicId === epicId && !link.featureId) return false;
    if (featureId && link.epicId === epicId && !link.featureId) return false;
    return true;
  });
  return { ...cap, links: [...links, nextLink] };
}

export function removeCapabilityLink(cap: Capability, featureId: string): Capability {
  return { ...cap, links: cap.links.filter((link) => link.featureId !== featureId) };
}

export function replaceCapabilityLink(cap: Capability, previous: {epicId: string;featureId: string | null;} | null, epicId: string, featureId: string | null, storyIds: string[]): Capability {
  const cleared = previous ?
  { ...cap, links: cap.links.filter((link) => !(link.epicId === previous.epicId && link.featureId === previous.featureId)) } :
  cap;
  return upsertCapabilityLink(cleared, epicId, featureId, storyIds);
}

/** Dropping a feature keeps the epic plan and clears its stories. */
export function releaseFeatures(caps: Capability[], featureIds: Set<string>): Capability[] {
  return caps.map((cap) => {
    const links: CapabilityLink[] = [];
    for (const link of cap.links) {
      if (link.featureId && featureIds.has(link.featureId)) {
        if (links.some((item) => item.epicId === link.epicId && !item.featureId)) continue;
        links.push({ epicId: link.epicId, featureId: null, storyIds: [] });
        continue;
      }
      links.push(link);
    }
    return { ...cap, links };
  });
}

export function capabilitiesWithoutEpic(caps: Capability[], epicId: string, featureIds: Set<string>): Capability[] {
  return caps.map((cap) => ({
    ...cap,
    links: cap.links.filter((link) => link.epicId !== epicId && !(link.featureId && featureIds.has(link.featureId)))
  }));
}

export function capabilitiesWithoutStory(caps: Capability[], storyId: string): Capability[] {
  return caps.map((cap) => ({
    ...cap,
    links: cap.links.map((link) => ({ ...link, storyIds: link.storyIds.filter((id) => id !== storyId) }))
  }));
}
