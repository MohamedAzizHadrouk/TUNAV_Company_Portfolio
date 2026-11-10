import { useState } from 'react';
import { FileIcon, UploadIcon, XIcon } from 'lucide-react';
import { MAX_FILE_BYTES, readFileAsDataUrl } from '../utils/file';
import type { Asset, AssetKind } from '../types/portfolio';

const kindLabels: Record<AssetKind, string> = { text: 'Text', url: 'URL', file: 'File import' };

interface AssetInputProps {
  id: string;
  value: Asset | null;
  onChange: (value: Asset | null) => void;
  kinds?: AssetKind[];
  placeholder?: string;
}

export function AssetInput({ id, value, onChange, kinds = ['text', 'url', 'file'], placeholder }: AssetInputProps) {
  const [kind, setKind] = useState<AssetKind>(value && kinds.includes(value.kind) ? value.kind : kinds[0]);
  const [error, setError] = useState('');
  const current = value?.kind === kind ? value : null;

  const onFile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError('File must be under 2 MB.');
      return;
    }
    setError('');
    const dataUrl = await readFileAsDataUrl(file);
    onChange({ kind: 'file', value: dataUrl, fileName: file.name });
  };

  return (
    <div className="flex flex-col gap-2">
      {kinds.length > 1 &&
      <div role="radiogroup" aria-label="Input type" className="inline-flex self-start rounded-lg bg-canvas p-0.5">
          {kinds.map((k) =>
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={kind === k}
          onClick={() => {
            setKind(k);
            setError('');
            if (value?.kind !== k) onChange(null);
          }}
          className={`whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-colors duration-150 ${
          kind === k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`
          }>
          
              {kindLabels[k]}
            </button>
        )}
        </div>
      }

      {kind === 'text' &&
      <textarea
        id={id}
        rows={3}
        className="field"
        placeholder={placeholder ?? 'Write here…'}
        value={current?.value ?? ''}
        onChange={(e) => onChange(e.target.value ? { kind: 'text', value: e.target.value } : null)} />

      }

      {kind === 'url' &&
      <input
        id={id}
        type="url"
        className="field"
        placeholder={placeholder ?? 'https://'}
        value={current?.value ?? ''}
        onChange={(e) => onChange(e.target.value ? { kind: 'url', value: e.target.value } : null)} />

      }

      {kind === 'file' && (
      current ?
      <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
            <FileIcon className="h-4 w-4 shrink-0 text-brand" />
            <span className="min-w-0 flex-1 truncate text-sm text-ink">{current.fileName ?? 'Uploaded file'}</span>
            <button type="button" className="icon-btn h-7 w-7" aria-label="Remove file" onClick={() => onChange(null)}>
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div> :

      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-line bg-canvas px-3 py-3 transition-colors duration-150 hover:border-brand/50">
        
            <UploadIcon className="h-4 w-4 text-brand" />
            <span className="text-sm text-ink">Choose a file</span>
            <span className="text-xs text-muted">max 2 MB</span>
            <input id={id} type="file" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>)
      }

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>);

}