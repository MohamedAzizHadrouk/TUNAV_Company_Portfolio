import type { WorkflowPhase, WorkflowStatus } from '../types/portfolio';

export const methodologies = [
{
  id: 'scrum' as const,
  label: 'Scrum',
  description: 'Sprints, a backlog of epics → features → user stories, and story points.'
}];


export const defaultStatuses: WorkflowStatus[] = [
{ id: 'st-todo', name: 'To Do', isComplete: false },
{ id: 'st-progress', name: 'In Progress', isComplete: false },
{ id: 'st-review', name: 'In Review', isComplete: false },
{ id: 'st-done', name: 'Completed', isComplete: true }];


export function statusesForPhase(phaseId: string): WorkflowStatus[] {
  return defaultStatuses.map((status) => ({ ...status, id: `${status.id}--${phaseId}` }));
}

export const defaultPhases: WorkflowPhase[] = [
{ id: 'wf-conception', name: 'Conception', deliveryLabel: 'Specification document', deliveryType: 'file', statuses: statusesForPhase('wf-conception') },
{ id: 'wf-uiux', name: 'UI/UX', deliveryLabel: 'Prototype link', deliveryType: 'url', statuses: statusesForPhase('wf-uiux') },
{ id: 'wf-dev', name: 'Development', deliveryLabel: 'Build or pull request link', deliveryType: 'url', statuses: statusesForPhase('wf-dev') }];


export const storyPointScale = [1, 2, 3, 5, 8, 13, 21];