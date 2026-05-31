import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Box, Typography, Paper, Chip } from '@mui/material';
import KanbanCard from './KanbanCard';
import type { Job } from './KanbanCard';

interface KanbanColumnProps {
  title: string;
  jobs: Job[];
  onCardClick: (job: Job) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, jobs, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: title,
  });

  const jobIds = jobs.map((job) => job.qcJobId.toString());

  const getHeaderStyle = () => {
    switch (title) {
      case 'New Incoming': return { color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.2)' };
      case 'Assigned': return { color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.2)' };
      case 'In Inspection': return { color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' };
      case 'Completed': return { color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' };
      default: return { color: '#f8fafc', borderColor: 'rgba(255, 255, 255, 0.05)' };
    }
  };

  const headerStyle = getHeaderStyle();

  return (
    <Box sx={{ flex: 1, minWidth: 260, maxWidth: 360, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Column Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          px: 1,
          borderBottom: `2px solid ${headerStyle.borderColor}`,
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', color: headerStyle.color, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
          {title}
        </Typography>
        <Chip
          label={jobs.length}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.75rem',
            fontWeight: 700,
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            color: '#94a3b8',
          }}
        />
      </Box>

      {/* Cards List (Droppable Area) */}
      <Paper
        ref={setNodeRef}
        sx={{
          flexGrow: 1,
          p: 1.5,
          borderRadius: 2,
          bgcolor: isOver ? 'rgba(99, 102, 241, 0.03)' : 'rgba(15, 23, 42, 0.2)',
          border: isOver ? '1px dashed rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.01)',
          minHeight: '450px',
          maxHeight: 'calc(100vh - 280px)',
          overflowY: 'auto',
          transition: 'all 0.2s ease',
        }}
      >
        <SortableContext items={jobIds} strategy={verticalListSortingStrategy}>
          <Box sx={{ minHeight: '100%' }}>
            {jobs.map((job) => (
              <KanbanCard key={job.qcJobId} job={job} onClick={onCardClick} />
            ))}
          </Box>
        </SortableContext>
      </Paper>
    </Box>
  );
};

export default KanbanColumn;
