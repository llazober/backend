import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  CircularProgress,
  Avatar,
  Chip,
  Paper,
  Tooltip,
  Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  AssignmentInd as AssignIcon,
  Schedule as ScheduleIcon,
  Engineering as InspectIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import {
  DndContext,
  useSensors,
  useSensor,
  PointerSensor,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import client from '../api/client';
import type { Job } from '../components/KanbanCard';

interface Inspector {
  inspectorId: number;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  shift: string;
  skillLevel: string;
}

// Droppable area wrapper for workload columns
const DroppableColumn: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: isOver ? 'rgba(99, 102, 241, 0.05)' : 'rgba(15, 23, 42, 0.4)',
        border: isOver ? '1px dashed rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.02)',
        height: '100%',
        minHeight: 180,
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </Box>
  );
};

const Workloads: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('All');
  const queryClient = useQueryClient();

  // Sensors configuration for dnd-kit (prevents click events from acting as drags)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await client.get('/jobs');
      return response.data;
    },
  });

  // Fetch inspectors
  const { data: inspectors = [], isLoading: inspectorsLoading } = useQuery<Inspector[]>({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const response = await client.get('/inspectors');
      return response.data;
    },
  });

  // Mutations
  const assignMutation = useMutation({
    mutationFn: async ({ id, inspectorId, estHours }: { id: number; inspectorId: number | null; estHours: number | null }) => {
      await client.put(`/jobs/${id}/assign`, { inspectorId, estimatedHours: estHours });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, column }: { id: number; column: string }) => {
      await client.put(`/jobs/${id}/move`, { currentColumn: column });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const jobIdStr = active.id as string;
    const targetDroppableId = over.id as string;

    const job = jobs.find((j) => j.qcJobId.toString() === jobIdStr);
    if (!job) return;

    const match = targetDroppableId.match(/^col_(\d+)_([A-Za-z\s]+)$/);
    if (!match) return;

    const targetInspectorId = parseInt(match[1]);
    const targetColumn = match[2];

    const inspectorChanged = job.inspectorId !== targetInspectorId;
    const columnChanged = job.currentColumn !== targetColumn;

    if (inspectorChanged || columnChanged) {
      try {
        if (inspectorChanged) {
          // Reassign inspector
          await assignMutation.mutateAsync({
            id: job.qcJobId,
            inspectorId: targetInspectorId,
            estHours: job.estimatedHours
          });
        }
        if (columnChanged) {
          // Move column
          await moveMutation.mutateAsync({
            id: job.qcJobId,
            column: targetColumn
          });
        }
      } catch (err) {
        console.error('Failed to update job via drag-and-drop', err);
      }
    }
  };

  if (jobsLoading || inspectorsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  // Filter inspectors based on search query & shift
  const filteredInspectors = inspectors.filter((ins) => {
    const fullName = `${ins.firstName} ${ins.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      ins.shift.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ins.skillLevel.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesShift = shiftFilter === 'All' || ins.shift === shiftFilter;
    return matchesSearch && matchesShift && ins.active;
  });

  // Helper to get priority details
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Critical': return { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)' };
      case 'High': return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.3)' };
      case 'Normal': return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' };
      case 'Low': return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', border: '1px solid rgba(100, 116, 139, 0.3)' };
      default: return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' };
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Box sx={{ flexGrow: 1, pb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', mb: 1 }}>
            Inspector Workload Matrix
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Live overview of all active inspectors and their assigned or active quality control inspections. Drag cards to reassign inspectors or change status.
          </Typography>
        </Box>

        {/* Filter Bar */}
        <Card sx={{ mb: 4, border: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: '#0f172a' }}>
          <CardContent sx={{ py: '16px !important', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, minWidth: 260 }}>
              <SearchIcon sx={{ color: '#64748b' }} />
              <TextField
                fullWidth
                size="small"
                placeholder="Search inspectors by name, shift, or skill level..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
              <FilterIcon sx={{ color: '#64748b' }} />
              <TextField
                select
                fullWidth
                size="small"
                label="Filter by Shift"
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
              >
                <MenuItem value="All">All Shifts</MenuItem>
                <MenuItem value="Day Shift">Day Shift</MenuItem>
                <MenuItem value="Night Shift">Night Shift</MenuItem>
              </TextField>
            </Box>
          </CardContent>
        </Card>

        {/* Inspectors Grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {filteredInspectors.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', bgcolor: 'transparent' }}>
              <Typography variant="body1" color="textSecondary">
                No active inspectors match your search filters.
              </Typography>
            </Paper>
          ) : (
            filteredInspectors.map((inspector) => {
              // Find jobs assigned to this inspector
              const inspectorJobs = jobs.filter((j) => j.inspectorId === inspector.inspectorId);
              const assignedJobs = inspectorJobs.filter((j) => j.currentColumn === 'Assigned');
              const inInspectionJobs = inspectorJobs.filter((j) => j.currentColumn === 'In Inspection');
              
              // Calculate metrics
              const totalEstHours = inspectorJobs.reduce((sum, j) => sum + (j.estimatedHours || 0), 0);
              const totalActHours = inspectorJobs.reduce((sum, j) => sum + (j.actualHours || 0), 0);

              return (
                <Card
                  key={inspector.inspectorId}
                  sx={{
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    bgcolor: '#0f172a',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'rgba(99, 102, 241, 0.2)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    },
                  }}
                >
                  <CardContent sx={{ p: '24px !important' }}>
                    <Grid container spacing={3}>
                      {/* Left: Inspector Info */}
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: '#6366f1',
                              fontWeight: 800,
                              fontFamily: 'Outfit',
                              width: 50,
                              height: 50,
                              fontSize: '1.2rem',
                            }}
                          >
                            {inspector.firstName[0]}{inspector.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                              {inspector.firstName} {inspector.lastName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                              {inspector.email}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                          <Chip label={inspector.shift} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                          <Chip label={inspector.skillLevel} size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                        </Box>

                        <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                        <Grid container spacing={2}>
                          <Grid size={4}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block' }}>JOBS</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>{inspectorJobs.length}</Typography>
                          </Grid>
                          <Grid size={4}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block' }}>EST. HRS</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#818cf8' }}>{totalEstHours.toFixed(1)}h</Typography>
                          </Grid>
                          <Grid size={4}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, display: 'block' }}>ACT. HRS</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>{totalActHours.toFixed(1)}h</Typography>
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Middle: Assigned Column */}
                      <Grid size={{ xs: 12, md: 4.5 }}>
                        <DroppableColumn id={`col_${inspector.inspectorId}_Assigned`}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AssignIcon sx={{ fontSize: '1rem' }} /> Assigned ({assignedJobs.length})
                            </Typography>
                            <Chip label={`${assignedJobs.reduce((sum, j) => sum + (j.estimatedHours || 0), 0).toFixed(1)}h`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {assignedJobs.length === 0 ? (
                              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 3 }}>
                                No assigned jobs
                              </Typography>
                            ) : (
                              assignedJobs.map((job) => (
                                <JobMiniCard key={job.qcJobId} job={job} priorityStyle={getPriorityStyle(job.priority)} />
                              ))
                            )}
                          </Box>
                        </DroppableColumn>
                      </Grid>

                      {/* Right: In Inspection Column */}
                      <Grid size={{ xs: 12, md: 4.5 }}>
                        <DroppableColumn id={`col_${inspector.inspectorId}_In Inspection`}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 1 }}>
                              <InspectIcon sx={{ fontSize: '1rem' }} /> In Inspection ({inInspectionJobs.length})
                            </Typography>
                            <Chip label={`${inInspectionJobs.reduce((sum, j) => sum + (j.estimatedHours || 0), 0).toFixed(1)}h`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {inInspectionJobs.length === 0 ? (
                              <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 3 }}>
                                No active inspections
                              </Typography>
                            ) : (
                              inInspectionJobs.map((job) => (
                                <JobMiniCard key={job.qcJobId} job={job} priorityStyle={getPriorityStyle(job.priority)} />
                              ))
                            )}
                          </Box>
                        </DroppableColumn>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>
      </Box>
    </DndContext>
  );
};

// Component for a compact job card inside inspector row columns
const JobMiniCard: React.FC<{ job: Job; priorityStyle: any }> = ({ job, priorityStyle }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.qcJobId.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    cursor: 'grab',
  };

  const due = new Date(job.dueDate);
  const isOverdue = due < new Date() && due.toDateString() !== new Date().toDateString();

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: '#070a13',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        borderLeft: `3px solid ${priorityStyle.color}`,
        position: 'relative',
        transition: 'all 0.15s ease',
        '&:hover': {
          transform: 'translateX(3px)',
          borderColor: 'rgba(255,255,255,0.06)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.85rem' }}>
          {job.epicorJobNum}
        </Typography>
        <Chip
          label={job.priority}
          size="small"
          sx={{
            height: 16,
            fontSize: '0.55rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            bgcolor: priorityStyle.bg,
            color: priorityStyle.color,
            border: priorityStyle.border,
          }}
        />
      </Box>

      <Typography variant="caption" sx={{ fontWeight: 700, color: '#6366f1', display: 'block', mb: 0.2 }}>
        {job.partNum}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: '#94a3b8',
          fontSize: '0.72rem',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1rem',
          mb: 1
        }}
      >
        {job.partDescription}
      </Typography>

      <Divider sx={{ my: 0.8, borderColor: 'rgba(255,255,255,0.03)' }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ScheduleIcon sx={{ fontSize: '0.75rem', color: '#64748b' }} />
          <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.7rem' }}>
            {job.estimatedHours ? `${job.estimatedHours.toFixed(1)}h` : 'No est.'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isOverdue && (
            <Tooltip title="Inspection is OVERDUE!">
              <WarningIcon sx={{ fontSize: '0.75rem', color: '#f43f5e' }} />
            </Tooltip>
          )}
          <Typography variant="caption" sx={{ color: isOverdue ? '#f43f5e' : '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
            Due {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Workloads;
