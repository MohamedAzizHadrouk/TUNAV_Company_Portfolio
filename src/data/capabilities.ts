import type { CapabilityStatus, Domain, ValidationConfidence } from '../types/portfolio';

export const capabilityStatuses: {id: CapabilityStatus;label: string;tone: string;dot: string;}[] = [
{ id: 'implemented', label: 'Implemented', tone: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
{ id: 'partial', label: 'Partially Implemented', tone: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
{ id: 'not-started', label: 'Not Implemented', tone: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
{ id: 'removed', label: 'Removed', tone: 'bg-red-50 text-red-700', dot: 'bg-red-500' }];


export const confidenceLevels: {id: ValidationConfidence;label: string;bars: number;tone: string;bar: string;}[] = [
{ id: 'high', label: 'High', bars: 3, tone: 'text-emerald-700', bar: 'bg-emerald-500' },
{ id: 'medium', label: 'Medium', bars: 2, tone: 'text-amber-700', bar: 'bg-amber-500' },
{ id: 'low', label: 'Low', bars: 1, tone: 'text-red-600', bar: 'bg-red-500' }];


export const defaultDomains: Domain[] = [
{ id: 'dom-core', name: 'Core features', description: '' },
{ id: 'dom-integrations', name: 'Integrations', description: '' },
{ id: 'dom-analytics', name: 'Analytics & Reporting', description: '' },
{ id: 'dom-security', name: 'Security & Compliance', description: '' },
{ id: 'dom-admin', name: 'Administration', description: '' }];
