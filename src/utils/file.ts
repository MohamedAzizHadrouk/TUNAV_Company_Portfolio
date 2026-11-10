import type { Asset } from '../types/portfolio';

export const MAX_FILE_BYTES = 2 * 1024 * 1024;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function isImageAsset(a: Asset): boolean {
  return a.value.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(a.value);
}