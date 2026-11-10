import { useEffect, useState } from 'react';
import { UploadIcon } from 'lucide-react';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { createId, today } from '../../utils/id';
import type { Photo } from '../../types/portfolio';

interface AddPhotoModalProps {
  open: boolean;
  albumName: string;
  onClose: () => void;
  onAdd: (photo: Photo) => void;
}

export function AddPhotoModal({ open, albumName, onClose, onAdd }: AddPhotoModalProps) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(today());

  useEffect(() => {
    if (open) {
      setUrl('');
      setCaption('');
      setDate(today());
    }
  }, [open]);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(file);
    if (!caption) setCaption(file.name.replace(/\.[^.]+$/, ''));
  };

  return (
    <Modal
      open={open}
      title={`Add photo to ${albumName}`}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!url} onClick={() => onAdd({ id: createId('ph'), url, caption: caption.trim(), date })}>
            Add photo
          </button>
        </>
      }>
      
      <div className="flex flex-col gap-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-line bg-canvas py-8 text-center transition-colors duration-150 hover:border-brand/50">
          {url ?
          <img src={url} alt="Preview" className="max-h-48 rounded-lg object-contain" /> :

          <>
              <UploadIcon className="h-5 w-5 text-brand" />
              <span className="text-sm font-medium text-ink">Upload an image</span>
              <span className="text-xs text-muted">PNG or JPG from your computer</span>
            </>
          }
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <Field label="Or paste an image URL" htmlFor="photo-url">
          <input id="photo-url" className="field" placeholder="https://" value={url.startsWith('data:') ? '' : url} onChange={(e) => setUrl(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <Field label="Caption" htmlFor="photo-caption">
            <input id="photo-caption" className="field" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>
          <Field label="Date" htmlFor="photo-date">
            <input id="photo-date" type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>);

}