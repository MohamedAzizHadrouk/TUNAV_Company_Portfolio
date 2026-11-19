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
  const { can, canWriteSection, canWriteCard, currentAccount } = useAccess();

  if (!product) return <ProductNotFound />;

  const entries = flattenStories(product.backlog);
  const openEntry = entries.find((entry) => entry.story.id === storyId) ?? null;
  const full = can('sprints.manage') || canWriteSection(product.id, 'flow');
  const canManageSprint = full || can('sprints.create');
  const canManageIncrement = full || can('increment.manage');
  const canEditSprint = (id: string) => {
    if (currentAccount.roleId === 'admin' || !Array.isArray(currentAccount.assignments)) return canManageSprint;
    const assignment = currentAccount.assignments.find((item) => item.productId === product.id);
    return canWriteCard(product.id, id) || canManageSprint && !assignment?.cards?.[id];
  };
  const canManageStory = (id: string) => currentAccount.roleId !== 'admin' && Array.isArray(currentAccount.assignments) ? canWriteCard(product.id, id) : full || can('backlog.manage');
  const canManagePhase = (_id: string, phaseId: string) => {
    if (full) return true;
    const name = product.backlog.phases.find((phase) => phase.id === phaseId)?.name.toLowerCase() ?? '';
    return name.includes('ui/ux') ? can('tasks.uiux.manage') : name.includes('conception') ? can('tasks.conception.manage') : name.includes('develop') ? can('tasks.development.manage') : false;
  };

  return (
    <>
      <SprintsPanel
        productId={product.id}
        initialSprintId={params.get('sprint')}
        backlog={product.backlog}
        canManage={full || can('tasks.uiux.manage') || can('tasks.conception.manage') || can('tasks.development.manage') || canManageSprint || canManageIncrement || product.backlog.sprints.some((sprint) => canEditSprint(sprint.id)) || entries.some((entry) => canWriteCard(product.id, entry.story.id))}
        canManageSprint={canManageSprint}
        canEditSprint={canEditSprint}
        canManageIncrement={currentAccount.roleId !== 'admin' && Array.isArray(currentAccount.assignments) ? false : canManageIncrement}
        canManageStory={canManageStory}
        canManagePhase={canManagePhase}
        onSaveSprint={actions.saveSprint}
        onDeleteSprint={actions.deleteSprint}
        onOpenStory={setStoryId}
        onAddTasks={actions.addTasks}
        onUpdateTask={actions.updateTask}
        onSetTaskDone={actions.setTaskDone}
        onSetConceptionStage={actions.setConceptionStage}
        onSetSprintIncrement={actions.setSprintIncrement}
        onRemoveTask={actions.removeTask}
        onSetStoryDelivery={actions.setStoryDelivery}
        onSetPhaseSkipped={actions.setPhaseSkipped} />
      
      {openEntry && <StoryDrawer
        entry={openEntry}
        readOnly={!canManageStory(openEntry.story.id)}
        backlog={product.backlog}
        onUpdate={actions.updateStory}
        onDelete={(id) => {
          actions.deleteStory(id);
          setStoryId(null);
        }}
        onClose={() => setStoryId(null)} />}
      
    </>);

}
