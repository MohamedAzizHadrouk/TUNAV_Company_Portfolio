import { useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isValid, parseISO, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, Clock3Icon, ListIcon, MapPinIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAccess } from '../contexts/AccessContext';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { createId } from '../utils/id';
import type { CompanyEvent, Product } from '../types/portfolio';

const eventTypes = ['Sprint planning', 'Daily Scrum', 'Sprint review', 'Sprint retrospective', 'Monthly review', 'Quarterly review', 'Annual review', 'Team building', 'Event'] as const;
const typeColors: Record<string, string> = {
  'Sprint planning': '#7c3aed', 'Daily Scrum': '#0891b2', 'Sprint review': '#059669', 'Sprint retrospective': '#ea580c',
  'Monthly review': '#2563eb', 'Quarterly review': '#4f46e5', 'Annual review': '#be185d', 'Team building': '#ca8a04', Event: '#475569'
};
const productColor = (id: string | null | undefined, products: Product[]) => id ? `hsl(${Math.round(Math.max(0, products.findIndex((product) => product.id === id)) * 137.508) % 360} 72% 43%)` : '#64748b';
const eventColor = (type: string) => typeColors[type] ?? '#475569';
function scrumEvents(products: Product[]): CompanyEvent[] {
  return products.flatMap((product) => product.backlog.sprints.flatMap((sprint) => [
    { id: `${sprint.id}-planning`, title: `${sprint.name} · Planning`, type: 'Sprint planning', date: sprint.startDate, time: '', location: '', description: sprint.goal, productId: product.id },
    { id: `${sprint.id}-review`, title: `${sprint.name} · Review`, type: 'Sprint review', date: sprint.endDate, time: '', location: '', description: sprint.increment ? 'Incrément réalisé disponible dans le sprint.' : '', productId: product.id },
    { id: `${sprint.id}-retro`, title: `${sprint.name} · Rétrospective`, type: 'Sprint retrospective', date: sprint.endDate, time: '', location: '', description: '', productId: product.id }
  ]));
}
type EventDraft = Omit<CompanyEvent, 'id'>;

function displayDate(date: string): string {
  const parsed = parseISO(date);
  return isValid(parsed) ? format(parsed, 'EEEE, MMMM d, yyyy') : date;
}

export function AgendaPage() {
  const { events, setEvents, products } = usePortfolio();
  const { can } = useAccess();
  const canEdit = can('portfolio.edit');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CompanyEvent | null>(null);
  const [removing, setRemoving] = useState<CompanyEvent | null>(null);
  const [viewing, setViewing] = useState<CompanyEvent | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = format(new Date(), 'yyyy-MM-dd');
  const allEvents = [...events, ...scrumEvents(products)];
  const upcoming = allEvents.filter((event) => event.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const past = allEvents.filter((event) => event.date < today).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  const isGenerated = (event: CompanyEvent) => !events.some((item) => item.id === event.id);

  const save = (draft: EventDraft) => {
    if (editing) {
      setEvents((current) => current.map((event) => event.id === editing.id ? { ...draft, id: editing.id } : event));
      setEditing(null);
    } else {
      setEvents((current) => [...current, { ...draft, id: createId('event') }]);
      setAdding(false);
    }
    setMonth(startOfMonth(parseISO(draft.date)));
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Agenda"
        description="Événements de l’entreprise et cérémonies Scrum par produit."
        actions={canEdit && <button type="button" className="btn-primary" onClick={() => setAdding(true)}><PlusIcon className="h-4 w-4" /> Add event</button>}
      />

      <section className="mb-4 rounded-xl border border-line bg-white p-3" aria-label="Agenda color legend">
        <p className="text-xs font-semibold text-ink">Repères de couleur</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">{eventTypes.map((type) => <span key={type} className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm" style={{ backgroundColor: eventColor(type) }} />{type}</span>)}</div>
        <p className="mt-3 text-xs font-semibold text-ink">Produits <span className="font-normal text-muted">· barre latérale de chaque événement</span></p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><span className="h-3 w-1 rounded" style={{ backgroundColor: '#64748b' }} />Entreprise</span>{products.map((product) => <span key={product.id} className="inline-flex items-center gap-1.5"><span className="h-3 w-1 rounded" style={{ backgroundColor: productColor(product.id, products) }} />{product.name}</span>)}</div>
      </section>

      <div className="mb-5 inline-flex rounded-lg border border-line bg-canvas p-1" role="group" aria-label="Agenda view">
        <button type="button" aria-pressed={view === 'calendar'} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'calendar' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`} onClick={() => setView('calendar')}><CalendarDaysIcon className="h-4 w-4" /> Calendar</button>
        <button type="button" aria-pressed={view === 'list'} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${view === 'list' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`} onClick={() => setView('list')}><ListIcon className="h-4 w-4" /> List</button>
      </div>

      {view === 'calendar' ? (
        <CalendarView month={month} today={today} events={allEvents} products={products} onMonthChange={setMonth} onViewEvent={setViewing} />
      ) : allEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-canvas px-6 py-12 text-center">
          <CalendarDaysIcon className="mx-auto h-8 w-8 text-brand" />
          <h2 className="mt-3 text-base font-semibold text-ink">No events yet</h2>
          <p className="mt-1 text-sm text-muted">Add a review, team building activity, or another company event.</p>
          {canEdit && <button type="button" className="btn-ghost mt-4" onClick={() => setAdding(true)}><PlusIcon className="h-4 w-4" /> Add your first event</button>}
        </div>
      ) : (
        <div className="space-y-8">
          <EventGroup title="Upcoming" events={upcoming} products={products} empty="No upcoming events." canEdit={canEdit} onEdit={setEditing} onRemove={setRemoving} isGenerated={isGenerated} />
          <EventGroup title="Past" events={past} products={products} empty="No past events." canEdit={canEdit} onEdit={setEditing} onRemove={setRemoving} isGenerated={isGenerated} />
        </div>
      )}

      <Modal
        open={Boolean(viewing)}
        title={viewing?.title ?? 'Event'}
        onClose={() => setViewing(null)}
        footer={canEdit && viewing && !isGenerated(viewing) && <>
          <button type="button" className="btn-ghost text-red-600" onClick={() => { setRemoving(viewing); setViewing(null); }}><Trash2Icon className="h-4 w-4" /> Delete</button>
          <button type="button" className="btn-primary" onClick={() => { setEditing(viewing); setViewing(null); }}><PencilIcon className="h-4 w-4" /> Edit event</button>
        </>}
      >
        {viewing && <div className="space-y-3 text-sm">
          <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: eventColor(viewing.type) }}>{viewing.type}</span> {viewing.productId && <span className="text-xs text-muted">{products.find((product) => product.id === viewing.productId)?.name}</span>}
          <p className="flex items-center gap-2 text-ink"><CalendarDaysIcon className="h-4 w-4 text-muted" /> {displayDate(viewing.date)}</p>
          {viewing.time && <p className="flex items-center gap-2 text-ink"><Clock3Icon className="h-4 w-4 text-muted" /> {viewing.time}</p>}
          {viewing.location && <p className="flex items-center gap-2 text-ink"><MapPinIcon className="h-4 w-4 text-muted" /> {viewing.location}</p>}
          {viewing.description && <p className="whitespace-pre-line border-t border-line pt-3 text-muted">{viewing.description}</p>}
        </div>}
      </Modal>

      {(adding || editing) && (
        <EventDialog
          key={editing?.id ?? 'new'}
          event={editing}
          products={products}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSave={save}
        />
      )}
      <Modal
        open={Boolean(removing)}
        title="Delete event"
        onClose={() => setRemoving(null)}
        footer={<>
          <button type="button" className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
          <button type="button" className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => {
            if (removing) setEvents((current) => current.filter((event) => event.id !== removing.id));
            setRemoving(null);
          }}>Delete</button>
        </>}
      >
        <p className="text-sm text-muted">Delete <span className="font-medium text-ink">{removing?.title}</span>?</p>
      </Modal>
    </div>
  );
}

function CalendarView({ month, today, events, products, onMonthChange, onViewEvent }: {
  month: Date;
  today: string;
  events: CompanyEvent[];
  products: Product[];
  onMonthChange: (month: Date) => void;
  onViewEvent: (event: CompanyEvent) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  });
  const byDate = new Map<string, CompanyEvent[]>();
  for (const event of events) {
    const onDate = byDate.get(event.date) ?? [];
    onDate.push(event);
    byDate.set(event.date, onDate);
  }
  for (const onDate of byDate.values()) onDate.sort((a, b) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title));

  return (
    <section aria-label={`${format(month, 'MMMM yyyy')} calendar`} className="rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-base font-semibold text-ink">{format(month, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-1">
          <button type="button" className="btn-ghost mr-1" onClick={() => onMonthChange(startOfMonth(new Date()))}>Today</button>
          <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => onMonthChange(subMonths(month, 1))}><ChevronLeftIcon className="h-4 w-4" /></button>
          <button type="button" className="icon-btn" aria-label="Next month" onClick={() => onMonthChange(addMonths(month, 1))}><ChevronRightIcon className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b border-line bg-canvas text-center text-xs font-medium text-muted">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="py-2">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-px bg-line">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const currentMonth = isSameMonth(day, month);
              return <div key={key} className={`min-h-28 min-w-0 p-2 ${currentMonth ? 'bg-white' : 'bg-canvas'}`}>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${key === today ? 'bg-brand text-white' : currentMonth ? 'text-ink' : 'text-muted'}`}>{format(day, 'd')}</span>
                <div className="mt-1 space-y-1">
                  {(byDate.get(key) ?? []).map((event) => <button key={event.id} type="button" className="block w-full truncate rounded-md border-l-4 px-2 py-1 text-left text-xs font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" style={{ backgroundColor: eventColor(event.type), borderLeftColor: productColor(event.productId, products) }} title={`${products.find((product) => product.id === event.productId)?.name ?? 'Entreprise'} · ${event.type} · ${event.title}${event.time ? ` · ${event.time}` : ''}`} aria-label={`${event.title}, ${displayDate(event.date)}${event.time ? ` at ${event.time}` : ''}`} onClick={() => onViewEvent(event)}>{event.time && <span className="mr-1 font-normal">{event.time}</span>}{event.title}</button>)}
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function EventGroup({ title, events, products, empty, canEdit, onEdit, onRemove, isGenerated }: {
  title: string;
  events: CompanyEvent[];
  products: Product[];
  empty: string;
  canEdit: boolean;
  onEdit: (event: CompanyEvent) => void;
  onRemove: (event: CompanyEvent) => void;
  isGenerated: (event: CompanyEvent) => boolean;
}) {
  return (
    <section aria-label={`${title} events`}>
      <h2 className="mb-3 text-sm font-semibold text-ink">{title} <span className="font-normal text-muted">· {events.length}</span></h2>
      {events.length === 0 ? <p className="rounded-xl border border-dashed border-line px-4 py-5 text-sm text-muted">{empty}</p> : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-2xl border border-line border-l-4 bg-white p-4 sm:p-5" style={{ borderLeftColor: productColor(event.productId, products) }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: eventColor(event.type) }}>{event.type}</span> <span className="text-xs text-muted">{products.find((product) => product.id === event.productId)?.name ?? 'Entreprise'}</span>
                  <h3 className="mt-2 text-base font-semibold text-ink">{event.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5"><CalendarDaysIcon className="h-4 w-4" /> {displayDate(event.date)}</span>
                    {event.time && <span className="inline-flex items-center gap-1.5"><Clock3Icon className="h-4 w-4" /> {event.time}</span>}
                    {event.location && <span className="inline-flex items-center gap-1.5"><MapPinIcon className="h-4 w-4" /> {event.location}</span>}
                  </div>
                  {event.description && <p className="mt-3 whitespace-pre-line text-sm text-muted">{event.description}</p>}
                </div>
                {canEdit && !isGenerated(event) && <div className="flex shrink-0 gap-1">
                  <button type="button" className="icon-btn" aria-label={`Edit ${event.title}`} onClick={() => onEdit(event)}><PencilIcon className="h-4 w-4" /></button>
                  <button type="button" className="icon-btn hover:text-red-600" aria-label={`Delete ${event.title}`} onClick={() => onRemove(event)}><Trash2Icon className="h-4 w-4" /></button>
                </div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EventDialog({ event, products, onClose, onSave }: {
  event: CompanyEvent | null;
  products: Product[];
  onClose: () => void;
  onSave: (draft: EventDraft) => void;
}) {
  const knownType = event && eventTypes.some((type) => type === event.type);
  const [title, setTitle] = useState(event?.title ?? '');
  const [type, setType] = useState(event ? (knownType ? event.type : 'Other') : eventTypes[0]);
  const [otherType, setOtherType] = useState(event && !knownType ? event.type : '');
  const [date, setDate] = useState(event?.date ?? format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(event?.time ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [productId, setProductId] = useState(event?.productId ?? '');
  const [error, setError] = useState('');

  const save = () => {
    const finalType = (type === 'Other' ? otherType : type).trim();
    const parsedDate = parseISO(date);
    if (!title.trim() || !finalType || !date || !isValid(parsedDate) || format(parsedDate, 'yyyy-MM-dd') !== date) {
      setError('Enter a title, event type, and valid date.');
      return;
    }
    onSave({ title: title.trim(), type: finalType, date, time, location: location.trim(), description: description.trim(), productId: productId || null });
  };

  return (
    <Modal
      open
      title={event ? 'Edit event' : 'Add event'}
      onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={save}>{event ? 'Save event' : 'Add event'}</button>
      </>}
    >
      <div className="space-y-4">
        <label className="block text-sm font-medium text-ink">Title
          <input className="field mt-1.5" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. October company review" />
        </label>
        <label className="block text-sm font-medium text-ink">Type
          <select className="field mt-1.5" value={type} onChange={(e) => setType(e.target.value)}>
            {eventTypes.map((option) => <option key={option} value={option}>{option}</option>)}
            <option value="Other">Other</option>
          </select>
        </label>
        {type === 'Other' && <label className="block text-sm font-medium text-ink">Other event type
          <input className="field mt-1.5" value={otherType} onChange={(e) => setOtherType(e.target.value)} placeholder="e.g. Customer workshop" />
        </label>}
        <label className="block text-sm font-medium text-ink">Produit
          <select className="field mt-1.5" value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Entreprise</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">Date
            <input type="date" className="field mt-1.5" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-ink">Time <span className="font-normal text-muted">(optional)</span>
            <input type="time" className="field mt-1.5" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <label className="block text-sm font-medium text-ink">Location <span className="font-normal text-muted">(optional)</span>
          <input className="field mt-1.5" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Meeting room or online" />
        </label>
        <label className="block text-sm font-medium text-ink">Description <span className="font-normal text-muted">(optional)</span>
          <textarea className="field mt-1.5 min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Agenda or notes" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
