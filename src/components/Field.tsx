import React from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}

export function Field({ label, htmlFor, children, hint }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>);

}
