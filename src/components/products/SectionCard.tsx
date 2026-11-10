import React from "react";
import { CheckIcon, PencilIcon, type LucideIcon } from "lucide-react";
interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
  className?: string;
}
export function SectionCard({
  title,
  icon: Icon,
  editing,
  onEdit,
  onSave,
  onCancel,
  children,
  className = ''
}: SectionCardProps) {
  return <section aria-label={title} className={`flex flex-col rounded-2xl border bg-white transition-colors duration-150 ${editing ? 'border-brand/50 ring-4 ring-brand/5' : 'border-line'} ${className}`}>
      <header className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="h-4 w-4 text-brand" aria-hidden />
          {title}
        </h2>
        {editing ? <div className="flex items-center gap-1">
            <button className="rounded-md px-2.5 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink" onClick={onCancel}>
              Cancel
            </button>
            <button className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600" onClick={onSave}>
              <CheckIcon className="h-3.5 w-3.5" /> Save
            </button>
          </div> : <button className="icon-btn" aria-label={`Edit ${title}`} onClick={onEdit}>
            <PencilIcon className="h-3.5 w-3.5" />
          </button>}
      </header>
      <div className="flex-1 px-5 pb-5 pt-3">{children}</div>
    </section>;
}
export function EmptyLine({
  children


}: {children: React.ReactNode;}) {
  return <p className="text-sm italic text-slate-400">{children}</p>;
}
