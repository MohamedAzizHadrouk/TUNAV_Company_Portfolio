import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, CodeIcon, ListChecksIcon, RocketIcon, TimerIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProduct } from '../../hooks/useProduct';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { CapabilitiesStage } from '../../components/flow/CapabilitiesStage';
import { BacklogStage } from '../../components/flow/BacklogStage';
import { SprintsStage } from '../../components/flow/SprintsStage';
import { RealisedStage } from '../../components/flow/RealisedStage';
import { flattenStories, isStoryDone } from '../../utils/backlog';
import { coverage } from '../../utils/capabilities';

type StageId = 'capabilities' | 'backlog' | 'sprints' | 'realised';
const stages: { id: StageId; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'capabilities', label: 'Capabilities', hint: 'What the product must do', icon: ListChecksIcon },
  { id: 'backlog', label: 'Backlog', hint: 'Epics → features → user stories', icon: CodeIcon },
  { id: 'sprints', label: 'Sprints & tasks', hint: 'Plan stories and run tasks', icon: TimerIcon },
  { id: 'realised', label: 'Realised', hint: 'Releases and delivered capabilities', icon: RocketIcon }
];

export function ProductFlow() {
  const { product, update } = useProduct();
  const [params, setParams] = useSearchParams();
  if (!product) return <ProductNotFound />;

  const requested = params.get('stage');
  const stage: StageId = stages.some((item) => item.id === requested) ? requested as StageId : 'capabilities';
  const b = product.backlog;
  const entries = flattenStories(b);
  const features = b.epics.reduce((n, epic) => n + epic.features.length, 0);
  const tasks = b.sprints.flatMap((sprint) => sprint.tasks);
  const releases = b.sprints.filter((sprint) => sprint.increment).length;
  const summary: Record<StageId, [string, string]> = {
    capabilities: [String(product.capabilities.length), `${coverage(product.capabilities)}% implemented`],
    backlog: [String(b.epics.length), `epics · ${features} features · ${entries.length} stories`],
    sprints: [String(b.sprints.length), `sprints · ${tasks.filter((task) => task.done).length}/${tasks.length} tasks done`],
    realised: [String(releases), `releases · ${entries.filter((entry) => isStoryDone(b, entry.story)).length}/${entries.length} stories done`]
  };

  const open = (id: StageId) => setParams({ stage: id });

  return <div className="w-full">
    <Link to={`/products/${product.id}`} aria-label={`Back to ${product.name}`} title={`Back to ${product.name}`} className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-brand/40 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
      <ArrowLeftIcon className="h-4 w-4" aria-hidden />
    </Link>

    <ol className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Flow stages">
      {stages.map((item, index) => {
        const Icon = item.icon;
        const active = stage === item.id;
        return <li key={item.id}>
          <button type="button" onClick={() => open(item.id)} aria-current={active ? 'step' : undefined}
            className={`flex h-full w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${active ? 'border-brand bg-brand-50' : 'border-line bg-white hover:border-brand/40'}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-brand text-white' : 'bg-canvas text-muted'}`}><Icon className="h-4 w-4" aria-hidden /></span>
            <span className="min-w-0">
              <span className={`block text-sm font-semibold ${active ? 'text-brand-700' : 'text-ink'}`}>{index + 1} · {item.label}</span>
              <span className="block text-xs text-muted">{item.hint}</span>
              <span className="mt-1 block text-xs text-ink"><strong className="tabular-nums">{summary[item.id][0]}</strong> <span className="text-muted">{summary[item.id][1]}</span></span>
            </span>
          </button>
        </li>;
      })}
    </ol>

    <div key={stage}>
      {stage === 'capabilities' && <CapabilitiesStage product={product} update={update} />}
      {stage === 'backlog' && <BacklogStage />}
      {stage === 'sprints' && <SprintsStage />}
      {stage === 'realised' && <RealisedStage product={product} update={update} />}
    </div>
  </div>;
}
