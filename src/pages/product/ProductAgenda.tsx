import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isValid, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { ArrowLeftIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, Clock3Icon, MapPinIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useProduct } from '../../hooks/useProduct';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useAccess } from '../../contexts/AccessContext';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { Modal } from '../../components/Modal';
import { createId } from '../../utils/id';
import type { CompanyEvent, Product, Sprint } from '../../types/portfolio';

const ceremonies = [
  { type: 'Sprint planning', label: 'Planning', tone: 'border-[#C1D1FF] bg-brand-50 text-brand-700' },
  { type: 'Sprint review', label: 'Review', tone: 'border-[#BBD9C4] bg-[#EDF5EF] text-[#176C32]' },
  { type: 'Sprint retrospective', label: 'Retrospective', tone: 'border-[#E9CBB5] bg-[#F9F1EB] text-[#994708]' }
] as const;
type CeremonyType = (typeof ceremonies)[number]['type'];
type CeremonyDraft = Omit<CompanyEvent, 'id'>;

function isCeremony(type: string): type is CeremonyType {
  return ceremonies.some((item) => item.type === type);
}

function ceremonyFor(type: string) {
  return ceremonies.find((item) => item.type === type) ?? ceremonies[0];
}

function dateLabel(date: string): string {
  const parsed = parseISO(date);
  return isValid(parsed) ? format(parsed, 'MMM d, yyyy') : date;
}

function defaultMonth(sprints: Sprint[]): Date {
  const today = format(new Date(), 'yyyy-MM-dd');
  const next = [...sprints].sort((a, b) => a.startDate.localeCompare(b.startDate)).find((sprint) => sprint.endDate >= today);
  const latest = [...sprints].sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  const date = parseISO(next?.startDate ?? latest?.endDate ?? today);
  return startOfMonth(isValid(date) ? date : new Date());
}

export function ProductAgenda() {
  const { product } = useProduct();
  return product ? <ProductAgendaContent key={product.id} product={product} /> : <ProductNotFound />;
}

function ProductAgendaContent({ product }: { product: Product }) {
  const { events, setEvents } = usePortfolio();
  const { can, canWriteSection, currentAccount } = useAccess();
  const [month, setMonth] = useState(() => defaultMonth(product.backlog.sprints));
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<CompanyEvent | null>(null);
  const [editing, setEditing] = useState<CompanyEvent | null>(null);
  const [removing, setRemoving] = useState<CompanyEvent | null>(null);

  const sprints = [...product.backlog.sprints].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const productEvents = events.filter((event) => event.productId === product.id && isCeremony(event.type));
  const orderedEvents = [...productEvents].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const canEdit = can('portfolio.edit') || canWriteSection(product.id, 'agenda') || (!Array.isArray(currentAccount.assignments) && can('sprints.manage'));
  const save = (draft: CeremonyDraft) => {
    if (editing) setEvents((current) => current.map((event) => event.id === editing.id ? { ...draft, id: editing.id } : event));
    else setEvents((current) => [...current, { ...draft, id: createId('event') }]);
    setMonth(startOfMonth(parseISO(draft.date)));
    setAdding(false);
    setEditing(null);
  };

  return <div className="w-full space-y-5">
    <div className="rounded-2xl border border-line border-l-4 border-l-brand bg-white p-5 sm:p-7">
      <Link to={`/products/${product.id}`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeftIcon className="h-4 w-4" /> {product.name}</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Plan together</p><h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Product agenda</h1><p className="mt-1 text-sm text-muted">Sprints and their planning, reviews and retrospectives for {product.name}.</p></div>
        {canEdit && <button type="button" className="btn-primary" disabled={!sprints.length} onClick={() => setAdding(true)}><PlusIcon className="h-4 w-4" /> Add sprint ceremony</button>}
      </div>
    </div>

    {sprints.length === 0 && <p className="rounded-xl border border-dashed border-line bg-canvas px-4 py-5 text-sm text-muted">No sprints yet. <Link className="font-medium text-brand hover:underline" to={`/products/${product.id}/flow?stage=sprints`}>Create a sprint</Link> to start this agenda.</p>}

    <section aria-label="Sprint calendar" className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div><h2 className="text-base font-semibold text-ink">{format(month, 'MMMM yyyy')}</h2><p className="text-xs text-muted">Sprint dates and ceremonies for this product.</p></div>
        <div className="flex items-center gap-1">
          <button type="button" className="btn-ghost px-3" onClick={() => setMonth(startOfMonth(new Date()))}>Today</button>
          <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeftIcon className="h-4 w-4" /></button>
          <button type="button" className="icon-btn" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}><ChevronRightIcon className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-line bg-white px-4 py-3" aria-label="Agenda legend">
        <span className="rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Sprint</span>
        {ceremonies.map((item) => <span key={item.type} className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${item.tone}`}>{item.label}</span>)}
      </div>
      <div className="overflow-x-auto" role="region" aria-label="Scrollable monthly calendar" tabIndex={0}>
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b border-[#C9D5E6] bg-brand-100 text-center text-xs font-semibold text-ink">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="py-3">{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-px bg-[#C9D5E6]">{days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const active = sprints.filter((sprint) => sprint.startDate <= key && sprint.endDate >= key);
            const onDate = orderedEvents.filter((event) => event.date === key);
            return <div key={key} className={`min-h-28 min-w-0 p-2 ${isSameMonth(day, month) ? 'bg-white' : 'bg-canvas'}`}>
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${key === format(new Date(), 'yyyy-MM-dd') ? 'bg-brand text-white' : isSameMonth(day, month) ? 'text-ink' : 'text-muted'}`}>{format(day, 'd')}</span>
              <div className="mt-1 space-y-1">
                {active.map((sprint) => <Link key={sprint.id} to={`/products/${product.id}/flow?stage=sprints&sprint=${sprint.id}`} title={`${sprint.name}: ${dateLabel(sprint.startDate)} – ${dateLabel(sprint.endDate)}`} className="block truncate rounded-lg border border-brand-100 bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">{sprint.name}</Link>)}
                {onDate.map((event) => { const ceremony = ceremonyFor(event.type); return <button key={event.id} type="button" className={`block w-full truncate rounded-lg border px-2 py-1 text-left text-xs font-semibold hover:brightness-95 ${ceremony.tone}`} title={`${event.title}${event.time ? ` · ${event.time}` : ''}`} onClick={() => setViewing(event)}>{ceremony.label}{event.time && ` · ${event.time}`}</button>; })}
              </div>
            </div>;
          })}</div>
        </div>
      </div>
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section aria-label="Sprints" className="rounded-2xl border border-line bg-white p-4"><h2 className="text-sm font-semibold text-ink">Sprints <span className="font-normal text-muted">· {sprints.length}</span></h2>
        {sprints.length === 0 ? <p className="mt-3 text-sm text-muted">No sprints scheduled.</p> : <ul className="mt-3 space-y-2">{sprints.map((sprint) => <li key={sprint.id}><Link className="flex items-start justify-between gap-2 rounded-lg border border-line px-3 py-2 hover:border-brand/40 hover:bg-brand-50" to={`/products/${product.id}/flow?stage=sprints&sprint=${sprint.id}`}><span><span className="block text-sm font-semibold text-ink">{sprint.name}</span><span className="text-xs text-muted">{dateLabel(sprint.startDate)} – {dateLabel(sprint.endDate)}</span>{sprint.goal && <span className="mt-0.5 block text-xs text-muted">{sprint.goal}</span>}</span><CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden /></Link></li>)}</ul>}
      </section>
      <section aria-label="Sprint ceremonies" className="rounded-2xl border border-line bg-white p-4"><h2 className="text-sm font-semibold text-ink">Sprint ceremonies <span className="font-normal text-muted">· {orderedEvents.length}</span></h2>
        {orderedEvents.length === 0 ? <p className="mt-3 text-sm text-muted">No planning, review or retrospective scheduled yet.</p> : <ul className="mt-3 space-y-2">{orderedEvents.map((event) => { const ceremony = ceremonyFor(event.type); return <li key={event.id}><button type="button" className="flex w-full items-start gap-3 rounded-lg border border-line px-3 py-3 text-left hover:border-brand/40 hover:bg-canvas" onClick={() => setViewing(event)}><span className="min-w-0"><span className={`mb-1 inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold ${ceremony.tone}`}>{ceremony.label}</span><span className="block text-sm font-semibold text-ink">{event.title}</span><span className="text-xs text-muted">{dateLabel(event.date)}{event.time ? ` · ${event.time}` : ''}{event.location ? ` · ${event.location}` : ''}</span></span></button></li>; })}</ul>}
      </section>
    </div>

    {viewing && <Modal open title={viewing.title} onClose={() => setViewing(null)} footer={canEdit && <><button type="button" className="btn-ghost text-red-600" onClick={() => { setRemoving(viewing); setViewing(null); }}><Trash2Icon className="h-4 w-4" /> Delete</button><button type="button" className="btn-primary" onClick={() => { setEditing(viewing); setViewing(null); }}><PencilIcon className="h-4 w-4" /> Edit</button></>}>
      <div className="space-y-2 text-sm text-ink"><p>{viewing.type}</p><p className="flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4 text-muted" />{dateLabel(viewing.date)}</p>{viewing.time && <p className="flex items-center gap-2"><Clock3Icon className="h-4 w-4 text-muted" />{viewing.time}</p>}{viewing.location && <p className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-muted" />{viewing.location}</p>}{viewing.description && <p className="whitespace-pre-line border-t border-line pt-2 text-muted">{viewing.description}</p>}</div>
    </Modal>}
    {(adding || editing) && <CeremonyDialog key={editing?.id ?? 'new'} event={editing} productId={product.id} sprints={sprints} onClose={() => { setAdding(false); setEditing(null); }} onSave={save} />}
    {removing && <Modal open title="Delete sprint ceremony" onClose={() => setRemoving(null)} footer={<><button type="button" className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button><button type="button" className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => { setEvents((current) => current.filter((event) => event.id !== removing.id)); setRemoving(null); }}>Delete</button></>}><p className="text-sm text-muted">Delete <span className="font-medium text-ink">{removing.title}</span>?</p></Modal>}
  </div>;
}

function CeremonyDialog({ event, productId, sprints, onClose, onSave }: {
  event: CompanyEvent | null;
  productId: string;
  sprints: Sprint[];
  onClose: () => void;
  onSave: (draft: CeremonyDraft) => void;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultSprint = sprints.find((sprint) => sprint.endDate >= today) ?? sprints[sprints.length - 1];
  const [sprintId, setSprintId] = useState(event ? event.sprintId ?? '' : defaultSprint?.id ?? '');
  const [type, setType] = useState<CeremonyType>(event?.type && isCeremony(event.type) ? event.type : 'Sprint planning');
  const selectedSprint = sprints.find((sprint) => sprint.id === sprintId);
  const suggestedDate = (sprint: Sprint | undefined, kind: CeremonyType) => kind === 'Sprint planning' ? sprint?.startDate : sprint?.endDate;
  const [date, setDate] = useState(event?.date ?? suggestedDate(selectedSprint, type) ?? today);
  const [time, setTime] = useState(event?.time ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [error, setError] = useState('');

  const save = () => {
    const sprint = sprints.find((item) => item.id === sprintId);
    const parsed = parseISO(date);
    if (!sprint || !isValid(parsed) || format(parsed, 'yyyy-MM-dd') !== date) { setError('Choose a sprint and a valid date.'); return; }
    const label = ceremonyFor(type).label;
    onSave({ title: `${sprint.name} · ${label}`, type, date, time, location: location.trim(), description: description.trim(), productId, sprintId });
  };

  return <Modal open title={event ? 'Edit sprint ceremony' : 'Add sprint ceremony'} onClose={onClose} footer={<><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={save}>{event ? 'Save changes' : 'Add ceremony'}</button></>}>
    <div className="space-y-4">
      <label className="block text-sm font-medium text-ink">Sprint<select className="field mt-1.5" value={sprintId} onChange={(e) => { const next = sprints.find((sprint) => sprint.id === e.target.value); setSprintId(e.target.value); setDate(suggestedDate(next, type) ?? today); setError(''); }}><option value="" disabled>Select sprint</option>{sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name} · {dateLabel(sprint.startDate)} – {dateLabel(sprint.endDate)}</option>)}</select></label>
      <label className="block text-sm font-medium text-ink">Ceremony<select className="field mt-1.5" value={type} onChange={(e) => { const next = e.target.value as CeremonyType; setType(next); setDate(suggestedDate(selectedSprint, next) ?? today); }}>{ceremonies.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}</select></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium text-ink">Date<input type="date" className="field mt-1.5" value={date} onChange={(e) => setDate(e.target.value)} /></label><label className="block text-sm font-medium text-ink">Time <span className="font-normal text-muted">(optional)</span><input type="time" className="field mt-1.5" value={time} onChange={(e) => setTime(e.target.value)} /></label></div>
      <label className="block text-sm font-medium text-ink">Location <span className="font-normal text-muted">(optional)</span><input className="field mt-1.5" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Meeting room or online" /></label>
      <label className="block text-sm font-medium text-ink">Notes <span className="font-normal text-muted">(optional)</span><textarea className="field mt-1.5 min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Agenda or preparation notes" /></label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  </Modal>;
}
