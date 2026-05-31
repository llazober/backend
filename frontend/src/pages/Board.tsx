import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  IconButton
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Close as CloseIcon, Delete as DeleteIcon, History as HistoryIcon } from '@mui/icons-material';
import KanbanColumn from '../components/KanbanColumn';
import type { Job } from '../components/KanbanCard';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const Board: React.FC = () => {
  const { isSupervisor } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states for Dialog
  const [inspectorId, setInspectorId] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [actualHours, setActualHours] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // 1. Fetching jobs and inspectors
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await client.get('/jobs');
      return response.data;
    },
  });

  const { data: inspectors = [] } = useQuery<any[]>({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const response = await client.get('/inspectors');
      return response.data;
    },
  });

  // Fetch job history when dialog is open
  const { data: history = [], refetch: refetchHistory } = useQuery<any[]>({
    queryKey: ['history', selectedJob?.qcJobId],
    queryFn: async () => {
      if (!selectedJob) return [];
      const response = await client.get(`/jobs/${selectedJob.qcJobId}/history`);
      return response.data;
    },
    enabled: !!selectedJob,
  });

  // 2. Sensors setup for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Solves click vs drag conflict
      },
    })
  );

  // 3. Mutations for job state changes
  const moveMutation = useMutation({
    mutationFn: async ({ id, column }: { id: number; column: string }) => {
      await client.put(`/jobs/${id}/move`, { currentColumn: column });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, inspectorId, estHours }: { id: number; inspectorId: number | null; estHours: number | null }) => {
      await client.put(`/jobs/${id}/assign`, { inspectorId, estimatedHours: estHours });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      refetchHistory();
    },
  });

  const priorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: number; priority: string }) => {
      await client.put(`/jobs/${id}/priority`, { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      refetchHistory();
    },
  });

  const detailsMutation = useMutation({
    mutationFn: async ({ id, notes, actHours }: { id: number; notes: string | null; actHours: number | null }) => {
      await client.put(`/jobs/${id}/details`, { notes, actualHours: actHours });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      refetchHistory();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await client.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      handleCloseDialog();
    },
  });

  // Drag handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const jobIdStr = active.id as string;
    const targetColumn = over.id as string;

    const job = jobs.find((j) => j.qcJobId.toString() === jobIdStr);
    if (!job) return;

    if (job.currentColumn !== targetColumn) {
      moveMutation.mutate({ id: job.qcJobId, column: targetColumn });
    }
  };

  const handleCardClick = (job: Job) => {
    setSelectedJob(job);
    setInspectorId(job.inspectorId ? job.inspectorId.toString() : '');
    setEstimatedHours(job.estimatedHours ? job.estimatedHours.toString() : '');
    setActualHours(job.actualHours ? job.actualHours.toString() : '');
    setPriority(job.priority);
    setNotes(job.notes || '');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedJob(null);
  };

  const handleSaveChanges = async () => {
    if (!selectedJob) return;

    // 1. Save Supervisor-only inputs
    if (isSupervisor) {
      const parsedInspectorId = inspectorId === '' ? null : parseInt(inspectorId);
      const parsedEstHours = estimatedHours === '' ? null : parseFloat(estimatedHours);
      
      await assignMutation.mutateAsync({
        id: selectedJob.qcJobId,
        inspectorId: parsedInspectorId,
        estHours: parsedEstHours,
      });

      if (priority !== selectedJob.priority) {
        await priorityMutation.mutateAsync({
          id: selectedJob.qcJobId,
          priority: priority,
        });
      }
    }

    // 2. Save notes and actual hours (Everyone)
    const parsedActHours = actualHours === '' ? null : parseFloat(actualHours);
    await detailsMutation.mutateAsync({
      id: selectedJob.qcJobId,
      notes: notes === '' ? null : notes,
      actHours: parsedActHours,
    });

    handleCloseDialog();
  };

  const handleDeleteJob = () => {
    if (window.confirm('Are you sure you want to delete this job card?')) {
      if (selectedJob) {
        deleteMutation.mutate(selectedJob.qcJobId);
      }
    }
  };

  const columnsList = ['New Incoming', 'Assigned', 'In Inspection', 'Completed'];

  if (jobsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Board Layout */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', gap: 3, flexGrow: 1, overflowX: 'auto', pb: 2, alignItems: 'flex-start' }}>
          {columnsList.map((colName) => {
            const filteredJobs = jobs.filter((j) => j.currentColumn === colName);
            return (
              <KanbanColumn
                key={colName}
                title={colName}
                jobs={filteredJobs}
                onCardClick={handleCardClick}
              />
            );
          })}
        </Box>
      </DndContext>

      {/* Card Details/Assignment Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
              borderRadius: 3,
            },
          },
        }}
      >
        {selectedJob && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
                Job Details: {selectedJob.epicorJobNum}
              </Typography>
              <IconButton onClick={handleCloseDialog} sx={{ color: '#94a3b8' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent dividers sx={{ pb: 3, borderColor: 'rgba(255, 255, 255, 0.05)' }}>
              {/* Part and Operation details (Read Only from Epicor) */}
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)', mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>PART NUMBER</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#818cf8' }}>{selectedJob.partNum}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>DUE DATE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {new Date(selectedJob.dueDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>PART DESCRIPTION</Typography>
                    <Typography variant="body2" sx={{ color: '#f8fafc' }}>{selectedJob.partDescription}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>QTY REQUIRED</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{Math.round(selectedJob.prodQty)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>QTY COMPLETED</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{Math.round(selectedJob.qtyCompleted)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>WORK CENTER</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedJob.wcCode}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>OPERATION DESC</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedJob.opDesc}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Editable Fields */}
              <Grid container spacing={3}>
                {/* Supervisor Scheduling Controls */}
                {isSupervisor ? (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        fullWidth
                        label="Assign Inspector"
                        value={inspectorId}
                        onChange={(e) => setInspectorId(e.target.value)}
                      >
                        <MenuItem value="">Unassigned</MenuItem>
                        {inspectors.map((ins) => (
                          <MenuItem key={ins.inspectorId} value={ins.inspectorId.toString()}>
                            {ins.firstName} {ins.lastName} ({ins.shift})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        fullWidth
                        label="Est. Hours"
                        type="number"
                        slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField
                        select
                        fullWidth
                        label="Priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <MenuItem value="Critical">Critical</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Normal">Normal</MenuItem>
                        <MenuItem value="Low">Low</MenuItem>
                      </TextField>
                    </Grid>
                  </>
                ) : (
                  // Read-Only view for Inspectors
                  <Grid size={12}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="textSecondary">ASSIGNED INSPECTOR</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedJob.inspectorName || 'Unassigned'}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="textSecondary">ESTIMATED HOURS</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedJob.estimatedHours ?? 'Not Estimated'}h</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="textSecondary">PRIORITY</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedJob.priority}</Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {/* Notes and Progress tracking (For everyone) */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Actual Hours"
                    type="number"
                    slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
                    value={actualHours}
                    onChange={(e) => setActualHours(e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Inspection Notes / Comments"
                    multiline
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Grid>
              </Grid>

              {/* History / Audit Trail Section */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ color: '#6366f1' }} /> Audit Trail History
                </Typography>
                <Divider sx={{ mb: 1.5, borderColor: 'rgba(255, 255, 255, 0.05)' }} />
                
                {history.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">No history logged for this card.</Typography>
                ) : (
                  <List dense sx={{ maxHeight: 150, overflowY: 'auto', pr: 1 }}>
                    {history.map((h) => {
                      let text = '';
                      const date = new Date(h.changeDate).toLocaleString();
                      
                      switch (h.actionType) {
                        case 'Created':
                          text = `Card initialized: ${h.newValue}`;
                          break;
                        case 'Move':
                          text = `Moved from ${h.oldValue} to ${h.newValue}`;
                          break;
                        case 'Complete':
                          text = `Job Completed (formerly ${h.oldValue})`;
                          break;
                        case 'Assign':
                          text = `Reassigned from ${h.oldValue} to ${h.newValue}`;
                          break;
                        case 'Priority':
                          text = `Priority updated from ${h.oldValue} to ${h.newValue}`;
                          break;
                        default:
                          text = `Updated properties: ${h.newValue || ''}`;
                          break;
                      }

                      return (
                        <ListItem key={h.historyId} disablePadding sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ color: '#e2e8f0', fontSize: '0.82rem' }}>
                                <strong>{h.changedBy}</strong>: {text}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.7rem' }}>
                                {date}
                              </Typography>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
              {isSupervisor ? (
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteJob}
                  sx={{
                    borderColor: 'rgba(244, 63, 94, 0.2)',
                    color: '#f43f5e',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 63, 94, 0.05)',
                      borderColor: '#f43f5e',
                    },
                  }}
                >
                  Delete Card
                </Button>
              ) : (
                <div />
              )}
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button onClick={handleCloseDialog} sx={{ color: '#94a3b8' }}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Board;
