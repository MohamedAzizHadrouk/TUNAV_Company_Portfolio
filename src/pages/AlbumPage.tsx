import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, FolderPlusIcon, ImagePlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { Field } from '../components/Field';
import { AddPhotoModal } from '../components/album/AddPhotoModal';
import { createId } from '../utils/id';
import type { Photo } from '../types/portfolio';

export function AlbumPage() {
  const { albums, setAlbums } = usePortfolio();
  const [activeId, setActiveId] = useState(albums[0]?.id ?? '');
  const [adding, setAdding] = useState(false);
  const [newAlbum, setNewAlbum] = useState(false);
  const [albumName, setAlbumName] = useState('');
  const [viewer, setViewer] = useState<number | null>(null);

  const active = albums.find((a) => a.id === activeId) ?? albums[0];
  const totalPhotos = albums.reduce((n, a) => n + a.photos.length, 0);

  const updatePhotos = (fn: (photos: Photo[]) => Photo[]) =>
  setAlbums((prev) => prev.map((a) => a.id === active?.id ? { ...a, photos: fn(a.photos) } : a));

  const createAlbum = () => {
    if (!albumName.trim()) return;
    const id = createId('a');
    setAlbums((prev) => [...prev, { id, name: albumName.trim(), photos: [] }]);
    setActiveId(id);
    setAlbumName('');
    setNewAlbum(false);
  };

  const deleteAlbum = () => {
    if (!active) return;
    const rest = albums.filter((a) => a.id !== active.id);
    setAlbums(rest);
    setActiveId(rest[0]?.id ?? '');
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Album"
        description={`${albums.length} collections · ${totalPhotos} photos of your team, events and products.`}
        actions={
        <>
            <button className="btn-ghost" onClick={() => setNewAlbum(true)}>
              <FolderPlusIcon className="h-4 w-4" /> New collection
            </button>
            {active &&
          <button className="btn-primary" onClick={() => setAdding(true)}>
                <ImagePlusIcon className="h-4 w-4" /> Add photo
              </button>
          }
          </>
        } />
      

      {!active ?
      <EmptyState
        title="No collections yet"
        description="Create a collection to start organising company photos."
        action={<button className="btn-primary" onClick={() => setNewAlbum(true)}>New collection</button>} /> :


      <>
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-line">
            <div role="tablist" className="-mb-px flex gap-6 overflow-x-auto">
              {albums.map((a) =>
            <button
              key={a.id}
              role="tab"
              aria-selected={a.id === active.id}
              onClick={() => setActiveId(a.id)}
              className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors duration-150 ${
              a.id === active.id ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'}`
              }>
              
                  {a.name} <span className="ml-1 text-xs tabular-nums opacity-70">{a.photos.length}</span>
                </button>
            )}
            </div>
            <button className="mb-2 inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted hover:text-red-600" onClick={deleteAlbum}>
              <Trash2Icon className="h-3.5 w-3.5" /> Delete collection
            </button>
          </div>

          {active.photos.length === 0 ?
        <EmptyState
          title="This collection is empty"
          description="Add photos by URL or upload them from your computer."
          action={<button className="btn-primary" onClick={() => setAdding(true)}><ImagePlusIcon className="h-4 w-4" /> Add photo</button>} /> :


        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {active.photos.map((photo, i) =>
          <li key={photo.id}>
                  <figure className="group relative h-full overflow-hidden rounded-xl bg-canvas">
                    <button className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand" onClick={() => setViewer(i)} aria-label={`Open ${photo.caption || 'photo'}`}>
                      <img src={photo.url} alt={photo.caption} className="aspect-[4/3] w-full object-cover" />
                    </button>
                    <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/70 px-3 py-2 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                      <p className="truncate text-sm font-medium">{photo.caption || 'Untitled'}</p>
                      <p className="text-xs text-white/70">{format(new Date(photo.date), 'MMM d, yyyy')}</p>
                    </figcaption>
                    <button
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-muted opacity-0 transition-opacity duration-150 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                aria-label="Delete photo"
                onClick={() => updatePhotos((ps) => ps.filter((p) => p.id !== photo.id))}>
                
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </figure>
                </li>
          )}
            </ul>
        }
        </>
      }

      <AddPhotoModal
        open={adding}
        albumName={active?.name ?? ''}
        onClose={() => setAdding(false)}
        onAdd={(photo) => {
          updatePhotos((ps) => [...ps, photo]);
          setAdding(false);
        }} />
      

      <Modal
        open={newAlbum}
        title="New collection"
        onClose={() => setNewAlbum(false)}
        footer={
        <>
            <button className="btn-ghost" onClick={() => setNewAlbum(false)}>Cancel</button>
            <button className="btn-primary" onClick={createAlbum} disabled={!albumName.trim()}>Create</button>
          </>
        }>
        
        <Field label="Collection name" htmlFor="album-name">
          <input id="album-name" autoFocus className="field" value={albumName} onChange={(e) => setAlbumName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createAlbum()} placeholder="e.g. Product shoots" />
        </Field>
      </Modal>

      <AnimatePresence>
        {viewer !== null && active?.photos[viewer] &&
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer">
          
            <button className="absolute right-4 top-4 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close" onClick={() => setViewer(null)}>
              <XIcon className="h-5 w-5" />
            </button>
            <button className="absolute left-4 rounded-lg p-2 text-white/80 hover:bg-white/10 disabled:opacity-30" disabled={viewer === 0} aria-label="Previous" onClick={() => setViewer(viewer - 1)}>
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <figure className="max-w-4xl">
              <img src={active.photos[viewer].url} alt={active.photos[viewer].caption} className="max-h-[78vh] rounded-lg object-contain" />
              <figcaption className="mt-3 text-center text-sm text-white">{active.photos[viewer].caption}</figcaption>
            </figure>
            <button className="absolute right-4 rounded-lg p-2 text-white/80 hover:bg-white/10 disabled:opacity-30" disabled={viewer === active.photos.length - 1} aria-label="Next" onClick={() => setViewer(viewer + 1)}>
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
