import { defaultPhases } from './scrum';
import type { Product } from '../types/portfolio';

const specFile = { kind: 'file' as const, value: 'data:text/plain;base64,U3BlY2lmaWNhdGlvbg==', fileName: 'specification.txt' };

export const products: Product[] = [
{
  id: 'p-orbit',
  name: 'Orbit Fleet',
  tagline: 'Real-time fleet tracking and analytics platform',
  category: 'IoT Platform',
  domains: [
  { id: 'dom-tracking', name: 'Tracking & Telemetry', description: 'Live vehicle data from the field.' },
  { id: 'dom-route', name: 'Route planning', description: 'How work is sequenced across the fleet.' },
  { id: 'dom-safety', name: 'Safety', description: 'Driver behaviour and coaching.' },
  { id: 'dom-integrations', name: 'Integrations', description: 'Connections to other business systems.' },
  { id: 'dom-analytics', name: 'Analytics & Reporting', description: 'Reports and dashboards.' }],

  asIs: [],
  capabilities: [
  { id: 'cap-1', domainId: 'dom-tracking', name: 'Live GPS position every 2 seconds', description: 'Vehicles report a position every two seconds.', notes: '', status: 'implemented', evidence: { kind: 'url', value: 'https://demo.orbit.example.com' }, confidence: 'high', links: [] },
  { id: 'cap-2', domainId: 'dom-tracking', name: 'Fuel consumption from CAN-bus', description: 'Fuel use is read from the vehicle CAN-bus.', notes: 'Validated on 120 vehicles during the Translog pilot.', status: 'implemented', evidence: { kind: 'text', value: 'Validated on 120 vehicles during the Translog pilot.' }, confidence: 'medium', links: [] },
  { id: 'cap-3', domainId: 'dom-route', name: 'Multi-stop route optimisation', description: 'Beta supports up to 20 stops; the target is 50.', notes: '', status: 'partial', evidence: { kind: 'text', value: 'Beta: up to 20 stops, target 50.' }, confidence: 'medium', links: [{ epicId: 'e-route', featureId: 'f-planner', storyIds: ['us-1', 'us-2', 'us-3'] }] },
  { id: 'cap-4', domainId: 'dom-route', name: 'Traffic-aware ETA notifications', description: 'Customers are not notified when traffic changes an arrival time.', notes: '', status: 'not-started', evidence: null, confidence: 'low', links: [{ epicId: 'e-route', featureId: 'f-eta', storyIds: ['us-4'] }] },
  { id: 'cap-5', domainId: 'dom-safety', name: 'Driver behaviour scoring', description: 'Each driver receives a weekly safety score.', notes: '', status: 'implemented', evidence: { kind: 'url', value: 'https://github.com/company/orbit/pull/412' }, confidence: 'low', links: [] },
  { id: 'cap-6', domainId: 'dom-integrations', name: 'ERP connector (SAP, Odoo)', description: 'Orders and customers are not synced with SAP or Odoo.', notes: '', status: 'not-started', evidence: null, confidence: 'low', links: [] },
  { id: 'cap-7', domainId: 'dom-analytics', name: 'Weekly PDF fleet report', description: 'A fleet summary is emailed every week.', notes: '', status: 'implemented', evidence: null, confidence: 'high', links: [] },
  { id: 'cap-8', domainId: 'dom-analytics', name: 'CO₂ emissions dashboard', description: 'Fleet emissions are not reported.', notes: '', status: 'not-started', evidence: null, confidence: 'low', links: [] }],

  methodology: 'scrum',
  updatedAt: '2026-10-08',
  status: 'growth',
  backlog: {
    actors: [
    { id: 'ac-dispatcher', name: 'Dispatcher', description: 'Plans and monitors daily routes from the control room.' },
    { id: 'ac-driver', name: 'Driver', description: 'Uses the mobile app on the road.' },
    { id: 'ac-manager', name: 'Fleet manager', description: 'Oversees costs, safety and performance.' },
    { id: 'ac-customer', name: 'End customer', description: 'Receives deliveries and notifications.' }],

    phases: defaultPhases,
    subBacklogs: [],
    sprints: [
    { id: 's-12', name: 'Sprint 12', startDate: '2026-10-06', endDate: '2026-10-19', goal: 'Ship the route optimisation beta', subBacklogIds: [], tasks: [] },
    { id: 's-13', name: 'Sprint 13', startDate: '2026-10-20', endDate: '2026-11-02', goal: 'Driver app integration', subBacklogIds: [], tasks: [] }],

    epics: [
    {
      id: 'e-route',
      title: 'Route optimisation',
      description: 'Plan the most efficient routes for every vehicle.',
      features: [
      {
        id: 'f-planner',
        title: 'Multi-stop planner',
        description: '',
        stories: [
        {
          id: 'us-1',
          title: 'As a Dispatcher, I want to add up to 50 stops to a route, so that I can plan a full day in one go',
          actorId: 'ac-dispatcher', want: 'to add up to 50 stops to a route', benefit: 'I can plan a full day in one go',
          description: 'Stops can be entered by address or picked on the map.',
          attachments: [{ id: 'at-1', label: 'Route planning flow', asset: { kind: 'url', value: 'https://figma.com/file/orbit-route-flow' } }],
          points: 5, sprintId: 's-12', phaseId: 'wf-dev', statusId: 'st-progress--wf-dev',
          deliveries: {
            'wf-conception': { asset: specFile, completedAt: '2026-09-22' },
            'wf-uiux': { asset: { kind: 'url', value: 'https://figma.com/proto/orbit-multistop' }, completedAt: '2026-10-01' }
          }
        },
        {
          id: 'us-2',
          title: 'As a Dispatcher, I want to reorder stops by drag and drop',
          actorId: 'ac-dispatcher', want: 'to reorder stops by drag and drop', benefit: '',
          description: '', attachments: [],
          points: 3, sprintId: 's-12', phaseId: 'wf-uiux', statusId: 'st-review--wf-uiux',
          deliveries: { 'wf-conception': { asset: specFile, completedAt: '2026-09-25' } }
        },
        {
          id: 'us-3',
          title: 'As a Driver, I want to see the optimised stop order in the mobile app, so that I never miss a stop',
          actorId: 'ac-driver', want: 'to see the optimised stop order in the mobile app', benefit: 'I never miss a stop',
          description: '', attachments: [],
          points: 8, sprintId: 's-13', phaseId: 'wf-conception', statusId: 'st-todo--wf-conception', deliveries: {}
        }]

      },
      {
        id: 'f-eta',
        title: 'Traffic-aware ETAs',
        description: '',
        stories: [
        {
          id: 'us-4',
          title: 'As an End customer, I want to receive an updated ETA by SMS',
          actorId: 'ac-customer', want: 'to receive an updated ETA by SMS', benefit: '',
          description: '', attachments: [],
          points: 5, sprintId: null, phaseId: 'wf-conception', statusId: 'st-progress--wf-conception', deliveries: {}
        }]

      }]

    },
    {
      id: 'e-safety',
      title: 'Driver safety',
      description: 'Help fleet managers coach safer driving.',
      features: [
      {
        id: 'f-score',
        title: 'Behaviour scoring',
        description: '',
        stories: [
        {
          id: 'us-5',
          title: 'As a Fleet manager, I want to see a weekly safety score per driver, so that I can coach risky drivers',
          actorId: 'ac-manager', want: 'to see a weekly safety score per driver', benefit: 'I can coach risky drivers',
          description: '', attachments: [],
          points: 8, sprintId: 's-12', phaseId: 'wf-dev', statusId: 'st-done--wf-dev',
          deliveries: {
            'wf-conception': { asset: specFile, completedAt: '2026-09-10' },
            'wf-uiux': { asset: { kind: 'url', value: 'https://figma.com/proto/orbit-safety' }, completedAt: '2026-09-18' },
            'wf-dev': { asset: { kind: 'url', value: 'https://github.com/company/orbit/pull/412' }, completedAt: '2026-10-07' }
          }
        }]

      }]

    }]

  },
  salesArguments: [
  { id: 'sa-1', title: 'Cuts fuel costs by up to 18%', description: 'Route optimisation and idle alerts remove wasted kilometres and engine time.', proof: { kind: 'url', value: 'https://orbit.example.com/case-studies/translog' } },
  { id: 'sa-2', title: 'Installs in under 15 minutes per vehicle', description: 'Plug-and-play OBD-II tracker, no technician needed.', proof: { kind: 'text', value: 'Pilot with Translog: 120 vehicles equipped in one day by 3 people.' } },
  { id: 'sa-3', title: 'No long-term contract', description: 'Monthly billing, cancel anytime.', proof: null }],

  salesOffers: [
  { id: 'o-1', plan: 'Starter', price: '9 TND', billing: 'per vehicle / month', description: 'For small fleets getting started.', includes: ['Live tracking', 'Alerts', 'Weekly reports'] },
  { id: 'o-2', plan: 'Business', price: '19 TND', billing: 'per vehicle / month', description: 'For growing logistics teams.', includes: ['Everything in Starter', 'Route optimisation', 'API access'] },
  { id: 'o-3', plan: 'Enterprise', price: 'Custom', billing: 'annual contract', description: 'For fleets over 500 vehicles.', includes: ['Everything in Business', 'Dedicated success manager', 'SLA 99.9%'] }],

  designSystem: {
    colors: ['#0A3DFF', '#0BC5F2', '#0B1220', '#F4F6FB'],
    typography: 'Inter — 14px base, 1.5 line height',
    figmaUrl: 'https://figma.com/file/orbit-fleet',
    notes: 'Map-first layouts, dense data tables, dark mode for control rooms.'
  },
  links: [
  { id: 'l1', label: 'Live product', url: 'https://orbit.example.com', kind: 'live' },
  { id: 'l2', label: 'Interactive demo', url: 'https://demo.orbit.example.com', kind: 'demo' }],

  showcase: [
  { id: 'sc-1', title: 'Getting started in 10 minutes', description: 'Install a tracker and see your first vehicle live.', category: 'tutorials', asset: { kind: 'url', value: 'https://youtube.com/watch?v=orbit-start' }, addedAt: '2026-09-02' },
  { id: 'sc-2', title: 'Live dispatch demo', description: 'Guided walkthrough of the dispatcher console.', category: 'demos', asset: { kind: 'url', value: 'https://demo.orbit.example.com' }, addedAt: '2026-09-14' },
  { id: 'sc-3', title: 'Orbit Fleet brochure 2026', description: 'Two-page overview for prospects.', category: 'brochures', asset: { kind: 'url', value: 'https://orbit.example.com/brochure.pdf' }, addedAt: '2026-08-20' },
  { id: 'sc-4', title: 'Hardware lab shot', description: 'Tracker assembly — for social posts.', category: 'media', asset: { kind: 'url', value: "/99366faa-1044-4690-ae6e-edd5ac544883.jpg" }, addedAt: '2026-06-18' }]

},
{
  id: 'p-pulse',
  name: 'Pulse Desk',
  tagline: 'AI help desk for customer support teams',
  category: 'SaaS',
  domains: [
  { id: 'dom-ticketing', name: 'Ticketing', description: 'How conversations reach the team.' },
  { id: 'dom-ai', name: 'AI assistance', description: 'Automated help for agents.' },
  { id: 'dom-pulse-integrations', name: 'Integrations', description: 'Notifications and external tools.' }],

  asIs: [],
  capabilities: [
  { id: 'cap-p1', domainId: 'dom-ticketing', name: 'Shared inbox with assignment rules', description: 'Incoming tickets land in one inbox and follow assignment rules.', notes: '', status: 'implemented', evidence: null, confidence: 'high', links: [] },
  { id: 'cap-p2', domainId: 'dom-ai', name: 'Automatic ticket classification', description: 'Classification covers common topics but still needs review.', notes: '', status: 'partial', evidence: null, confidence: 'medium', links: [{ epicId: 'e-triage', featureId: 'f-classify', storyIds: ['us-p1'] }] },
  { id: 'cap-p3', domainId: 'dom-pulse-integrations', name: 'Slack notifications', description: 'Agents do not get Slack alerts for new tickets.', notes: '', status: 'not-started', evidence: null, confidence: 'low', links: [] }],

  methodology: 'scrum',
  updatedAt: '2026-09-27',
  status: 'introduction',
  backlog: {
    actors: [
    { id: 'ac-agent', name: 'Support agent', description: 'Answers customer tickets.' },
    { id: 'ac-lead', name: 'Support lead', description: 'Manages the support team.' }],

    phases: defaultPhases,
    subBacklogs: [],
    sprints: [],
    epics: [
    {
      id: 'e-triage', title: 'AI triage', description: '',
      features: [
      {
        id: 'f-classify', title: 'Ticket classification', description: '',
        stories: [
        {
          id: 'us-p1',
          title: 'As a Support agent, I want tickets to arrive pre-tagged by topic',
          actorId: 'ac-agent', want: 'tickets to arrive pre-tagged by topic', benefit: '',
          description: '', attachments: [],
          points: 5, sprintId: null, phaseId: 'wf-uiux', statusId: 'st-progress--wf-uiux',
          deliveries: { 'wf-conception': { asset: specFile, completedAt: '2026-09-15' } }
        }]

      }]

    }]

  },
  salesArguments: [{ id: 'sa-1', title: 'Resolves 40% of tickets automatically', description: 'AI answers repetitive questions instantly.', proof: null }],
  salesOffers: [{ id: 'o-1', plan: 'Team', price: '29 TND', billing: 'per agent / month', description: 'Up to 10 agents.', includes: ['AI triage', 'Auto-replies'] }],
  designSystem: { colors: ['#0A3DFF', '#FFFFFF', '#1F2937'], typography: 'Inter — friendly, generous spacing', figmaUrl: '', notes: 'Conversational UI, soft rounded components.' },
  links: [{ id: 'l1', label: 'Demo video', url: 'https://pulse.example.com/demo', kind: 'demo' }],
  showcase: []
},
{
  id: 'p-nova',
  name: 'Nova Edge Gateway',
  tagline: 'Industrial edge computing gateway',
  category: 'Hardware',
  domains: [
  { id: 'dom-connectivity', name: 'Connectivity', description: '' },
  { id: 'dom-edge', name: 'Edge computing', description: '' },
  { id: 'dom-devices', name: 'Device management', description: '' }],
  asIs: [],
  capabilities: [],
  methodology: 'scrum',
  updatedAt: '2026-08-14',
  status: 'maturity',
  backlog: { actors: [], phases: defaultPhases,
    subBacklogs: [], sprints: [], epics: [] },
  salesArguments: [{ id: 'sa-1', title: 'Deployed in 1,200+ factories', description: 'Proven in harsh industrial environments.', proof: null }],
  salesOffers: [{ id: 'o-1', type: 'hardware', hardwareId: 'h3', plan: 'Unit', price: '690 TND', billing: 'one-time', description: 'Gateway + 1 year cloud management.', includes: ['Hardware', '1 year cloud'] }],
  designSystem: { colors: ['#0B1220', '#0A3DFF'], typography: 'IBM Plex Sans', figmaUrl: '', notes: 'Technical, spec-sheet driven materials.' },
  links: [{ id: 'l1', label: 'Datasheet', url: 'https://nova.example.com/datasheet', kind: 'docs' }],
  showcase: []
}];
