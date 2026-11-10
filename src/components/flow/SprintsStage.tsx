import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProduct } from '../../hooks/useProduct';
import { useBacklog } from '../../hooks/useBacklog';
import { ProductNotFound } from '../products/ProductNotFound';
import { SprintsPanel } from '../backlog/SprintsPanel';
import { StoryDrawer } from '../backlog/StoryDrawer';
import { flattenStories } from '../../utils/backlog';
import { useAccess } from '../../contexts/AccessContext';

export function SprintsStage() {
  const { product, update } = useProduct();
  const actions = useBacklog(update);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [params] = useSearchParams();
  const { can } = useAccess();

  if (!product) return <ProductNotFound />;

  const entries = flattenStories(product.backlog);
  const openEntry = entries.find((entry) => entry.story.id === storyId) ?? null;

  return (
    <>
      <SprintsPanel
        productId={product.id}
        initialSprintId={params.get('sprint')}
        backlog={product.backlog}
        canManage={can('sprints.manage')}
        onSaveSprint={actions.saveSprint}
        onDeleteSprint={actions.deleteSprint}
        onOpenStory={setStoryId}
        onAddTasks={actions.addTasks}
        onUpdateTask={actions.updateTask}
        onSetTaskDone={actions.setTaskDone}
        onSetConceptionStage={actions.setConceptionStage}
        onSetSprintIncrement={actions.setSprintIncrement}
        onRemoveTask={actions.removeTask}
        onSetStoryDelivery={actions.setStoryDelivery} />
      
      {can('sprints.manage') && <StoryDrawer
        entry={openEntry}
        backlog={product.backlog}
        onUpdate={actions.updateStory}
        onDelete={(id) => {
          actions.deleteStory(id);
          setStoryId(null);
        }}
        onClose={() => setStoryId(null)} />}
      
    </>);

}
