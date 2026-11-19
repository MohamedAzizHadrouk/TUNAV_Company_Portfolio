import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="relative mb-6 flex flex-col gap-4 overflow-hidden rounded-2xl border border-line border-l-4 border-l-brand bg-white px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Overview</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>);
}
