import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { GenericCard } from '../shared/cards/GenericCard';
import { CardAction, GenericCardProps } from '../shared/cards/types';

type ExerciseCardProps = Omit<GenericCardProps, 'variant' | 'icon'> & {
  onStart?: () => void;
  onAddToPlan?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ExerciseCard({ onStart, onAddToPlan, onEdit, onDelete, actions = [], ...rest }: ExerciseCardProps) {
  const gymActions: CardAction[] = [
    { id: 'start', label: 'Start', icon: <PlayArrowIcon />, variant: 'contained' as const, color: 'primary' as const, onClick: onStart },
    { id: 'schedule', label: 'Add to Plan', icon: <ScheduleIcon />, variant: 'outlined' as const, onClick: onAddToPlan },
    { id: 'edit', label: 'Edit', icon: <EditIcon />, variant: 'text' as const, onClick: onEdit },
    { id: 'delete', label: 'Delete', icon: <DeleteIcon />, variant: 'icon' as const, color: 'error' as const, onClick: onDelete },
  ].filter(a => !!a.onClick);

  return (
    <GenericCard
      {...rest}
      variant="exercise"
      icon={<FitnessCenterIcon />}
      actions={[...gymActions, ...actions]}
    />
  );
}
