export type ProductStatus =
'development' |
'introduction' |
'growth' |
'maturity' |
'decline' |
'scalability';

export type Methodology = 'scrum';

export type AssetKind = 'text' | 'url' | 'file';

export interface Asset {
  kind: AssetKind;
  value: string;
  fileName?: string;
}

/* ---------- Scrum backlog ---------- */

export interface WorkflowPhase {
  id: string;
  name: string;
  deliveryLabel: string;
  deliveryType: AssetKind;
  statuses: WorkflowStatus[];
}

export interface WorkflowStatus {
  id: string;
  name: string;
  isComplete: boolean;
}

export interface Sprint {
  id: string;
  number?: number;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
  subBacklogIds: string[];
  tasks: Task[];
  increment?: Asset | null;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  storyId: string;
  /** Workflow phase this task belongs to. Older tasks fall back to matching their assignment type. */
  phaseId?: string;
  assignmentType: string;
  description: string;
  conceptionStage?: 'analyse' | 'adr' | 'done';
  adr?: Asset | null;
}

export interface Delivery {
  asset: Asset;
  completedAt: string;
}

export interface Actor {
  id: string;
  name: string;
  description: string;
}

export interface StoryAttachment {
  id: string;
  label: string;
  asset: Asset;
}

export interface UserStory {
  id: string;
  /** Composed from actor + want + benefit: "As a …, I want …, so that …" */
  title: string;
  actorId: string | null;
  want: string;
  benefit: string;
  description: string;
  attachments: StoryAttachment[];
  points: number | null;
  priority?: 'high' | 'medium' | 'low';
  dependencyIds?: string[];
  sprintId: string | null;
  /** How the sprint was set: picked on the story itself, or through a sub-product backlog. */
  sprintSource?: 'direct' | 'sub-backlog';
  phaseId: string;
  statusId: string;
  deliveries: Record<string, Delivery>;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  stories: UserStory[];
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  features: Feature[];
}

export interface SubProductBacklog {
  id: string;
  name: string;
  storyIds: string[];
}

export interface Backlog {
  actors: Actor[];
  phases: WorkflowPhase[];
  sprints: Sprint[];
  epics: Epic[];
  subBacklogs: SubProductBacklog[];
  taskTypes?: string[];
}

/* ---------- Product sections ---------- */

export interface SalesArgument {
  id: string;
  title: string;
  description: string;
  proof: Asset | null;
}

export interface SalesOffer {
  id: string;
  type?: 'subscription' | 'installation' | 'hardware';
  hardwareId?: string | null;
  plan: string;
  price: string;
  billing: string;
  description: string;
  includes: string[];
}

export interface ProductLink {
  id: string;
  label: string;
  url: string;
  kind: 'live' | 'demo' | 'docs';
}

export interface ProductDesignSystem {
  colors: string[];
  typography: string;
  figmaUrl: string;
  notes: string;
}

export type ShowcaseCategory =
'tutorials' |
'demos' |
'brochures' |
'datasheets' |
'guides' |
'presentations' |
'media';

export interface ShowcaseItem {
  id: string;
  title: string;
  description: string;
  category: ShowcaseCategory;
  asset: Asset;
  addedAt: string;
}

export type CapabilityStatus = 'implemented' | 'partial' | 'not-started' | 'removed';
export type ValidationConfidence = 'high' | 'medium' | 'low';

export interface Domain {
  id: string;
  name: string;
  description: string;
}

/** A capability points at a backlog epic, and optionally at one feature and stories under it. */
export interface CapabilityLink {
  epicId: string;
  featureId: string | null;
  storyIds: string[];
}

export interface Capability {
  id: string;
  /** Primary domain, always the first of domainIds. Kept for older data and code. */
  domainId: string;
  /** Every domain the capability belongs to (one or more). */
  domainIds?: string[];
  name: string;
  description: string;
  notes: string;
  status: CapabilityStatus;
  evidence: Asset | null;
  confidence: ValidationConfidence;
  links: CapabilityLink[];
  /** The As-is entry this capability was imported from, if any. */
  asIsId?: string | null;
  /** Why the status was changed, e.g. why an implemented capability is now partial. */
  statusNote?: string;
}

/** A capability the As-is owner records as already in place. Everything here counts as implemented. */
export interface AsIsItem {
  id: string;
  title: string;
  description: string;
  documents: Asset[];
  addedAt: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  category: string;
  methodology: Methodology;
  updatedAt: string;
  status: ProductStatus;
  backlog: Backlog;
  domains: Domain[];
  asIs: AsIsItem[];
  capabilities: Capability[];
  salesArguments: SalesArgument[];
  salesOffers: SalesOffer[];
  designSystem: ProductDesignSystem;
  links: ProductLink[];
  showcase: ShowcaseItem[];
}

/* ---------- Company ---------- */

export interface Photo {
  id: string;
  url: string;
  caption: string;
  date: string;
}

export interface Album {
  id: string;
  name: string;
  photos: Photo[];
}

export interface BrandColor {
  id: string;
  name: string;
  hex: string;
  role: string;
}

export interface BrandFont {
  id: string;
  name: string;
  usage: string;
}

export interface BrandResource {
  id: string;
  title: string;
  asset: Asset;
}

export interface BrandIdentity {
  companyName: string;
  logoUrl: string;
  mission: string;
  colors: BrandColor[];
  fonts: BrandFont[];
  values: string[];
  voice: string[];
  resources: BrandResource[];
}

export interface HardwareAssignment {
  productId: string;
  /** Legacy sale price, migrated into a Hardware Offer. */
  salePrice?: number | null;
}

export interface HardwareCapability {
  id: string;
  title: string;
  description: string;
  /** Legacy fields, migrated into HardwareDocument. */
  document?: Asset | null;
  visibility?: 'public' | 'private';
}

export interface HardwareDocument {
  id: string;
  title: string;
  asset: Asset;
  visibility: 'public' | 'private';
}

export interface HardwareItem {
  id: string;
  title: string;
  description: string;
  purchasePrice: number;
  /** Empty = owned by the company, not linked to any product */
  assignments: HardwareAssignment[];
  /** Legacy document, migrated into documents. */
  document?: Asset | null;
  capabilities?: HardwareCapability[];
  documents?: HardwareDocument[];
  addedAt: string;
}

export interface CompanyPresentation {
  name: string;
  asset: Asset | null;
}

export interface CompanyFile {
  id: string;
  name: string;
  asset: Asset;
  addedAt: string;
  categoryId: string;
}

export interface FileCategory {
  id: string;
  name: string;
}

export interface CompanyLibrary {
  presentation: CompanyPresentation;
  categories: FileCategory[];
  files: CompanyFile[];
}

export interface CompanyEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  description: string;
  productId?: string | null;
}

export interface ClientContact {
  id: string;
  person: string;
  role: string;
  email: string;
  phone: string;
}

export interface CompanyClient {
  id: string;
  name: string;
  logoUrl: string;
  email: string;
  contact: string;
  description: string;
  productIds: string[];
  contacts: ClientContact[];
}
