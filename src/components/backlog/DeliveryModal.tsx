import { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { AssetInput } from '../AssetInput';
import type { Asset, WorkflowPhase } from '../../types/portfolio';

interface DeliveryModalProps {
  open: boolean;
  phase: WorkflowPhase | null;
  initial: Asset | null;
  onClose: () => void;
  onSubmit: (asset: Asset) => void;
}

const typeHint: Record<WorkflowPhase['deliveryType'], string> = {
  text: 'Describe what was delivered.',
  url: 'Paste the link to the deliverable.',
  file: 'Import the deliverable file.'
};

export function DeliveryModal({ open, phase, initial, onClose, onSubmit }: DeliveryModalProps) {
  const [asset, setAsset] = useState<Asset | null>(initial);

  useEffect(() => {
    if (open) setAsset(initial);
  }, [open, initial]);

  return (
    <Modal
      open={open}
      title={phase ? `Complete ${phase.name} phase` : 'Complete phase'}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!asset?.value.trim()} onClick={() => asset && onSubmit(asset)}>
            Mark as completed
          </button>
        </>
      }>
      
      {phase &&
      <div className="flex flex-col gap-1.5">
          <label htmlFor="delivery-input" className="text-xs font-medium text-ink">
            {phase.deliveryLabel || 'Delivery'} <span className="text-red-600">*</span>
          </label>
          <p className="mb-1 text-xs text-muted">{typeHint[phase.deliveryType]} Required to complete this phase.</p>
          <AssetInput key={phase.id} id="delivery-input" kinds={[phase.deliveryType]} value={asset} onChange={setAsset} />
        </div>
      }
    </Modal>);

}