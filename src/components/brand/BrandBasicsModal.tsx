import { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { Field } from '../Field';
import type { BrandIdentity } from '../../types/portfolio';

type Basics = Pick<BrandIdentity, 'companyName' | 'logoUrl' | 'mission'>;

interface BrandBasicsModalProps {
  open: boolean;
  brand: BrandIdentity;
  onClose: () => void;
  onSave: (values: Basics) => void;
}

export function BrandBasicsModal({ open, brand, onClose, onSave }: BrandBasicsModalProps) {
  const [values, setValues] = useState<Basics>({ companyName: brand.companyName, logoUrl: brand.logoUrl, mission: brand.mission });

  useEffect(() => {
    if (open) setValues({ companyName: brand.companyName, logoUrl: brand.logoUrl, mission: brand.mission });
  }, [open, brand]);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValues((v) => ({ ...v, logoUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      open={open}
      title="Edit identity"
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!values.companyName.trim()} onClick={() => onSave({ ...values, companyName: values.companyName.trim() })}>Save</button>
        </>
      }>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <img src={values.logoUrl} alt="Logo preview" className="h-16 w-16 rounded-lg border border-line object-contain p-1" />
          <label className="btn-ghost cursor-pointer">
            Upload new logo
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
        </div>
        <Field label="Company name" htmlFor="b-name">
          <input id="b-name" className="field" value={values.companyName} onChange={(e) => setValues({ ...values, companyName: e.target.value })} />
        </Field>
        <Field label="Mission statement" htmlFor="b-mission">
          <textarea id="b-mission" rows={4} className="field" value={values.mission} onChange={(e) => setValues({ ...values, mission: e.target.value })} />
        </Field>
      </div>
    </Modal>);

}