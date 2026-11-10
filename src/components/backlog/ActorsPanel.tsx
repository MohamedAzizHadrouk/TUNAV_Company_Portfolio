import React, { useState } from 'react';
import { PlusIcon, Trash2Icon, UserIcon } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { flattenStories } from '../../utils/backlog';
import type { Actor, Backlog } from '../../types/portfolio';

interface ActorsPanelProps {
  backlog: Backlog;
  onAdd: (actor: Omit<Actor, 'id'>) => void;
  onUpdate: (id: string, changes: Partial<Actor>) => void;
  onDelete: (id: string) => void;
}

export function ActorsPanel({ backlog, onAdd, onUpdate, onDelete }: ActorsPanelProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const stories = flattenStories(backlog);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), description: description.trim() });
    setName('');
    setDescription('');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <section aria-label="Actors">
        {backlog.actors.length === 0 ?
        <EmptyState title="No actors yet" description="Actors are the people or systems your user stories are written for — e.g. Dispatcher, Driver, Admin." /> :

        <ul className="divide-y divide-line rounded-2xl border border-line">
            {backlog.actors.map((a) => {
            const count = stories.filter((s) => s.story.actorId === a.id).length;
            return (
              <li key={a.id} className="flex items-start gap-3 px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand">
                    <UserIcon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <input
                    aria-label="Actor name"
                    defaultValue={a.name}
                    onBlur={(e) => e.target.value.trim() && e.target.value !== a.name && onUpdate(a.id, { name: e.target.value.trim() })}
                    className="w-full rounded-md border border-transparent px-1 py-0.5 text-sm font-semibold text-ink hover:border-line focus:border-brand focus:outline-none" />
                  
                    <input
                    aria-label="Actor description"
                    defaultValue={a.description}
                    placeholder="Add a description"
                    onBlur={(e) => e.target.value !== a.description && onUpdate(a.id, { description: e.target.value })}
                    className="mt-0.5 w-full rounded-md border border-transparent px-1 py-0.5 text-sm text-muted placeholder:text-slate-400 hover:border-line focus:border-brand focus:outline-none" />
                  
                  </div>
                  <span className="shrink-0 pt-1 text-xs tabular-nums text-muted">{count} {count === 1 ? 'story' : 'stories'}</span>
                  <button className="icon-btn shrink-0 hover:text-red-600" aria-label={`Delete ${a.name}`} onClick={() => onDelete(a.id)}>
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </li>);

          })}
          </ul>
        }
      </section>

      <form onSubmit={submit} className="flex flex-col gap-3 self-start rounded-xl bg-canvas p-3" aria-label="New actor">
        <h3 className="text-sm font-semibold text-ink">New actor</h3>
        <input aria-label="Actor name" className="field" placeholder="Name, e.g. Dispatcher" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea aria-label="Actor description" rows={2} className="field" placeholder="Who they are and what they need" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button type="submit" className="btn-primary self-start" disabled={!name.trim()}>
          <PlusIcon className="h-4 w-4" /> Add actor
        </button>
      </form>
    </div>);

}