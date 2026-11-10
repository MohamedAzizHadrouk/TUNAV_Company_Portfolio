import { ArrowUpRightIcon, DownloadIcon } from 'lucide-react';
import type { Asset } from '../types/portfolio';

export function AssetView({ asset }: {asset: Asset;}) {
  if (asset.kind === 'text') {
    return <p className="whitespace-pre-line text-sm text-ink">{asset.value}</p>;
  }
  if (asset.kind === 'url') {
    return (
      <a
        href={asset.value}
        target="_blank"
        rel="noreferrer"
        className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-700">
        
        <span className="truncate">{asset.value.replace(/^https?:\/\//, '')}</span>
        <ArrowUpRightIcon className="h-3.5 w-3.5 shrink-0" />
      </a>);

  }
  return (
    <a
      href={asset.value}
      download={asset.fileName}
      className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-700">
      
      <DownloadIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{asset.fileName ?? 'Download file'}</span>
    </a>);

}