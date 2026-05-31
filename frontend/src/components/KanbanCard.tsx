import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  AssignmentInd as AssignIcon,
  Notes as NotesIcon
} from '@mui/icons-material';

export interface Job {
  qcJobId: number;
  epicorJobNum: string;
  assemblySeq: number;
  operationSeq: number;
  currentColumn: string;
  priority: string;
  inspectorId: number | null;
  inspectorName: string;
  estimatedHours: number | null;
  actualHours: number | null;
  notes: string | null;
  createdDate: string;
  modifiedDate: string;
  partNum: string;
  partDescription: string;
  prodQty: number;
  qtyCompleted: number;
  dueDate: string;
  wcCode: string;
  opDesc: string;
}

interface KanbanCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ job, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.qcJobId.toString() });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
  };

  const isCompleted = job.currentColumn === 'Completed';
  
  // Parse and check due date
  const due = new Date(job.dueDate);
  const isOverdue = !isCompleted && due < new Date() && due.toDateString() !== new Date().toDateString();

  // Colors: Critical = Red, High = Orange, Normal = Blue, Low = Gray, Completed = Green
  const getPriorityColor = () => {
    if (isCompleted) return '#10b981'; // Green
    switch (job.priority) {
      case 'Critical': return '#f43f5e'; // Red/Rose
      case 'High': return '#f97316'; // Orange
      case 'Normal': return '#38bdf8'; // Blue
      case 'Low': return '#64748b'; // Gray
      default: return '#38bdf8';
    }
  };

  const priorityColor = getPriorityColor();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(job)}
      sx={{
        mb: 2,
        position: 'relative',
        borderLeft: `4px solid ${priorityColor}`,
        bgcolor: isOverdue ? 'rgba(244, 63, 94, 0.02)' : '#0f172a',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: priorityColor,
          boxShadow: `0 8px 16px rgba(0,0,0,0.4), 0 0 8px ${priorityColor}15`,
        },
      }}
    >
      <CardContent sx={{ p: '16px !important' }}>
        {/* Header: Job Num & Priority */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.95rem' }}>
            {job.epicorJobNum}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {isOverdue && (
              <Tooltip title="Inspection is OVERDUE!">
                <Chip
                  icon={<WarningIcon style={{ color: '#f43f5e', fontSize: '0.85rem' }} />}
                  label="LATE"
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: 'rgba(244, 63, 94, 0.15)',
                    color: '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 0.7 },
                      '50%': { opacity: 1 },
                      '100%': { opacity: 0.7 },
                    },
                  }}
                />
              </Tooltip>
            )}
            <Chip
              label={isCompleted ? 'Completed' : job.priority}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                bgcolor: `${priorityColor}15`,
                color: priorityColor,
                border: `1px solid ${priorityColor}30`,
              }}
            />
          </Box>
        </Box>

        {/* Part Information */}
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#6366f1', mb: 0.5 }}>
          {job.partNum}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#94a3b8',
            fontSize: '0.8rem',
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.4em',
            lineHeight: '1.2rem',
          }}
        >
          {job.partDescription}
        </Typography>

        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.03)' }} />

        {/* Quantities & Due Date */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
              QTY REQ
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
              {Math.round(job.prodQty)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
              QTY COMP
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: job.qtyCompleted >= job.prodQty ? '#10b981' : '#f8fafc' }}>
              {Math.round(job.qtyCompleted)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', fontSize: '0.7rem', fontWeight: 600 }}>
              DUE DATE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: isOverdue ? '#f43f5e' : '#f8fafc' }}>
              {new Date(job.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Typography>
          </Box>
        </Box>

        {/* Inspector & Hours */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AssignIcon sx={{ fontSize: '0.9rem', color: job.inspectorId ? '#6366f1' : '#475569' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: job.inspectorId ? '#f8fafc' : '#475569', fontSize: '0.75rem' }}>
              {job.inspectorId ? job.inspectorName : 'Unassigned'}
            </Typography>
          </Box>
          
          {(job.estimatedHours !== null || job.actualHours !== null) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: '0.9rem', color: '#475569' }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.75rem' }}>
                {job.actualHours ?? 0}h / {job.estimatedHours ?? 0}h
              </Typography>
            </Box>
          )}

          {job.notes && (
            <Tooltip title={job.notes}>
              <NotesIcon sx={{ fontSize: '0.95rem', color: '#94a3b8' }} />
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default KanbanCard;
