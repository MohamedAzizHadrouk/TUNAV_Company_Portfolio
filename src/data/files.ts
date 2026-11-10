import type { Asset, CompanyFile, CompanyLibrary, FileCategory } from '../types/portfolio';

export const defaultFileCategory: FileCategory = { id: 'fc-general', name: 'General' };

export const emptyCompanyLibrary: CompanyLibrary = {
  presentation: { name: '', asset: null },
  categories: [defaultFileCategory],
  files: []
};

function readAsset(value: unknown): Asset | null {
  if (!value || typeof value !== 'object') return null;
  const asset = value as {kind?: unknown;value?: unknown;fileName?: unknown;};
  if (asset.kind !== 'text' && asset.kind !== 'url' && asset.kind !== 'file') return null;
  if (typeof asset.value !== 'string' || !asset.value) return null;
  return { kind: asset.kind, value: asset.value, fileName: typeof asset.fileName === 'string' ? asset.fileName : undefined };
}

export function normalizeCompanyLibrary(value: unknown): CompanyLibrary {
  if (!value || typeof value !== 'object') return emptyCompanyLibrary;
  const raw = value as {presentation?: unknown;categories?: unknown;files?: unknown;};
  const presentation = raw.presentation && typeof raw.presentation === 'object' ? raw.presentation as {name?: unknown;asset?: unknown;} : {};

  const categories: FileCategory[] = Array.isArray(raw.categories) ? raw.categories.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const category = item as {id?: unknown;name?: unknown;};
    if (typeof category.id !== 'string' || !category.id || typeof category.name !== 'string' || !category.name) return [];
    return [{ id: category.id, name: category.name }];
  }) : [];
  const known = new Set(categories.map((category) => category.id));
  let needsDefault = !Array.isArray(raw.categories);

  const files: CompanyFile[] = Array.isArray(raw.files) ? raw.files.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const file = item as {id?: unknown;name?: unknown;asset?: unknown;addedAt?: unknown;categoryId?: unknown;};
    const asset = readAsset(file.asset);
    if (typeof file.id !== 'string' || !file.id || typeof file.name !== 'string' || !file.name || !asset) return [];
    // Files saved before categories existed (or whose category is gone) land in "General".
    const categoryId = typeof file.categoryId === 'string' && known.has(file.categoryId) ? file.categoryId : defaultFileCategory.id;
    if (categoryId === defaultFileCategory.id && !known.has(defaultFileCategory.id)) needsDefault = true;
    return [{ id: file.id, name: file.name, asset, addedAt: typeof file.addedAt === 'string' ? file.addedAt : '', categoryId }];
  }) : [];

  return {
    presentation: {
      name: typeof presentation.name === 'string' ? presentation.name : '',
      asset: readAsset(presentation.asset)
    },
    categories: needsDefault && !known.has(defaultFileCategory.id) ? [defaultFileCategory, ...categories] : categories,
    files
  };
}
