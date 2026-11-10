import { useState } from 'react';
import { format } from 'date-fns';
import { FolderPlusIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { AssetInput } from '../components/AssetInput';
import { AssetView } from '../components/AssetView';
import { Modal } from '../components/Modal';
import { Field } from '../components/Field';
import { createId, today } from '../utils/id';
import type { Asset, CompanyFile } from '../types/portfolio';

export function FilesPage() {
  const { library, setLibrary } = usePortfolio();
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<CompanyFile | null>(null);
  const [removing, setRemoving] = useState<CompanyFile | null>(null);
  const [activeId, setActiveId] = useState(library.categories[0]?.id ?? '');
  const [newCategory, setNewCategory] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [removingCategory, setRemovingCategory] = useState(false);
  const active = library.categories.find((category) => category.id === activeId) ?? library.categories[0];
  const activeFiles = active ? library.files.filter((file) => file.categoryId === active.id) : [];

  const createCategory = () => {
    if (!categoryName.trim()) return;
    const id = createId('fc');
    setLibrary((prev) => ({ ...prev, categories: [...prev.categories, { id, name: categoryName.trim() }] }));
    setActiveId(id);
    setCategoryName('');
    setNewCategory(false);
  };

  const deleteCategory = () => {
    if (!active) return;
    const rest = library.categories.filter((category) => category.id !== active.id);
    setLibrary((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category.id !== active.id),
      files: prev.files.filter((file) => file.categoryId !== active.id)
    }));
    setActiveId(rest[0]?.id ?? '');
    setRemovingCategory(false);
  };

  const saveFile = (name: string, asset: Asset | null) => {
    if (renaming) {
      setLibrary((prev) => ({
        ...prev,
        files: prev.files.map((file) => file.id === renaming.id ? { ...file, name } : file)
      }));
      setRenaming(null);
      return;
    }
    if (!asset || !active) return;
    setLibrary((prev) => ({
      ...prev,
      files: [{ id: createId('cf'), name, asset, addedAt: today(), categoryId: active.id }, ...prev.files]
    }));
    setAdding(false);
  };

  const deleteFile = () => {
    if (!removing) return;
    setLibrary((prev) => ({ ...prev, files: prev.files.filter((file) => file.id !== removing.id) }));
    setRemoving(null);
  };

  return (
    <div className="w-full">
      <PageHeader
        title="File"
        description="Files kept for the company, organised by category." />

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Company files</h2>
            <p className="text-xs text-muted">{library.categories.length} {library.categories.length === 1 ? 'category' : 'categories'} · {library.files.length} {library.files.length === 1 ? 'file' : 'files'}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setNewCategory(true)}>
              <FolderPlusIcon className="h-4 w-4" /> New category
            </button>
            {active &&
            <button className="btn-primary" onClick={() => setAdding(true)}>
                <PlusIcon className="h-4 w-4" /> Add file
              </button>
            }
          </div>
        </div>
        {!active ?
        <EmptyState
          title="No categories yet"
          description="Create a category to start organising company files."
          action={<button className="btn-primary" onClick={() => setNewCategory(true)}>New category</button>} /> :

        <>
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-line">
            <div role="tablist" aria-label="File categories" className="-mb-px flex gap-6 overflow-x-auto">
              {library.categories.map((category) =>
              <button
                key={category.id}
                role="tab"
                aria-selected={category.id === active.id}
                onClick={() => setActiveId(category.id)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors duration-150 ${
                category.id === active.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`
                }>
                  {category.name} <span className="ml-1 text-xs tabular-nums opacity-70">{library.files.filter((file) => file.categoryId === category.id).length}</span>
                </button>
              )}
            </div>
            <button className="mb-2 inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted hover:text-red-600" onClick={() => setRemovingCategory(true)}>
              <Trash2Icon className="h-3.5 w-3.5" /> Delete category
            </button>
          </div>

        {activeFiles.length === 0 ?
        <EmptyState
          title="This category is empty"
          description="Add a file or a link. Removing one here leaves products unchanged."
          action={<button className="btn-primary" onClick={() => setAdding(true)}><PlusIcon className="h-4 w-4" /> Add file</button>} /> :

        <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">File</th>
                  <th className="px-3 py-2 font-medium">Added</th>
                  <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {activeFiles.map((file) =>
              <tr key={file.id}>
                    <td className="px-3 py-2 font-medium text-ink">{file.name}</td>
                    <td className="max-w-[240px] px-3 py-2"><AssetView asset={file.asset} /></td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted">{file.addedAt ? format(new Date(`${file.addedAt}T00:00:00`), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button className="icon-btn" aria-label={`Rename ${file.name}`} onClick={() => setRenaming(file)}><PencilIcon className="h-3.5 w-3.5" /></button>
                        <button className="icon-btn hover:text-red-600" aria-label={`Delete ${file.name}`} onClick={() => setRemoving(file)}><Trash2Icon className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
        </>
        }
      </section>

      {(adding || renaming) &&
      <FileDialog
        file={renaming}
        categoryName={active?.name ?? ''}
        onClose={() => { setAdding(false); setRenaming(null); }}
        onSave={saveFile} />
      }

      <Modal
        open={Boolean(removing)}
        title="Delete file"
        onClose={() => setRemoving(null)}
        footer={
        <>
            <button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
            <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={deleteFile}>Delete</button>
          </>
        }>
        <p className="text-sm text-muted">
          Delete {removing?.name}? Products stay as they are.
        </p>
      </Modal>

      <Modal
        open={newCategory}
        title="New category"
        onClose={() => setNewCategory(false)}
        footer={
        <>
            <button className="btn-ghost" onClick={() => setNewCategory(false)}>Cancel</button>
            <button className="btn-primary" onClick={createCategory} disabled={!categoryName.trim()}>Create</button>
          </>
        }>
        <Field label="Category name" htmlFor="file-category-name">
          <input id="file-category-name" autoFocus className="field" value={categoryName} onChange={(e) => setCategoryName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createCategory()} placeholder="e.g. Contracts" />
        </Field>
      </Modal>

      <Modal
        open={removingCategory}
        title="Delete category"
        onClose={() => setRemovingCategory(false)}
        footer={
        <>
            <button className="btn-ghost" onClick={() => setRemovingCategory(false)}>Cancel</button>
            <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={deleteCategory}>Delete</button>
          </>
        }>
        <p className="text-sm text-muted">
          Delete the category {active?.name}{activeFiles.length ? ` and its ${activeFiles.length} ${activeFiles.length === 1 ? 'file' : 'files'}` : ''}? Products stay as they are.
        </p>
      </Modal>
    </div>
  );
}

function FileDialog({
  file,
  categoryName,
  onClose,
  onSave
}: {
  file: CompanyFile | null;
  categoryName: string;
  onClose: () => void;
  onSave: (name: string, asset: Asset | null) => void;
}) {
  const [name, setName] = useState(file?.name ?? '');
  const [asset, setAsset] = useState<Asset | null>(file?.asset ?? null);
  const [error, setError] = useState('');

  const save = () => {
    if (!name.trim() || (!file && !asset)) {
      setError(file ? 'Add a name.' : 'Add a name and a file or link.');
      return;
    }
    onSave(name.trim(), asset);
  };

  return (
    <Modal
      open
      title={file ? 'Rename file' : `Add file to ${categoryName}`}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>{file ? 'Save' : 'Add'}</button>
        </>
      }>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Name</span>
          <input aria-label="File name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="File name" />
        </label>
        {!file &&
        <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">File or link</span>
            <AssetInput id="company-file-asset" value={asset} onChange={setAsset} kinds={['url', 'file']} />
          </div>
        }
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
