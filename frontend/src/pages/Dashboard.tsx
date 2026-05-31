import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  TextField,
  Button,
  IconButton,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Assignment as InboxIcon,
  AssignmentTurnedIn as DoneIcon,
  AssignmentInd as AssignedIcon,
  Engineering as InspectingIcon,
  Warning as LateIcon,
  ToggleOn as WcIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { isSupervisor } = useAuth();
  const queryClient = useQueryClient();

  const [newWcCode, setNewWcCode] = useState('');
  const [newWcDesc, setNewWcDesc] = useState('');

  const { data: metrics, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ['metrics'],
    queryFn: async () => {
      const response = await client.get('/dashboard/metrics');
      return response.data;
    },
  });

  const { data: inspectors = [], isLoading: inspectorsLoading } = useQuery<any[]>({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const response = await client.get('/inspectors');
      return response.data;
    },
  });

  const { data: workCenters = [], isLoading: wcLoading } = useQuery<any[]>({
    queryKey: ['workCenters'],
    queryFn: async () => {
      const response = await client.get('/workcenters');
      return response.data;
    },
  });

  const toggleWcMutation = useMutation({
    mutationFn: async ({ id, desc, active }: { id: number; desc: string; active: boolean }) => {
      await client.put(`/workcenters/${id}`, { description: desc, active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workCenters'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const addWcMutation = useMutation({
    mutationFn: async (wc: any) => {
      await client.post('/workcenters', wc);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workCenters'] });
      setNewWcCode('');
      setNewWcDesc('');
    },
  });

  const deleteWcMutation = useMutation({
    mutationFn: async (id: number) => {
      await client.delete(`/workcenters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workCenters'] });
    },
  });

  const handleToggleWc = (wc: any) => {
    toggleWcMutation.mutate({
      id: wc.workCenterId,
      desc: wc.description,
      active: !wc.active
    });
  };

  const handleAddWc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWcCode || !newWcDesc) return;
    addWcMutation.mutate({
      workCenterCode: newWcCode,
      description: newWcDesc
    });
  };

  const handleDeleteWc = (id: number) => {
    if (window.confirm('Delete this monitored work center?')) {
      deleteWcMutation.mutate(id);
    }
  };

  if (metricsLoading || inspectorsLoading || wcLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  const kpis = [
    { title: 'Total Backlog', value: metrics?.totalIncomingJobs || 0, icon: <InboxIcon sx={{ fontSize: 32, color: '#38bdf8' }} />, bg: 'rgba(56, 189, 248, 0.05)', border: '#38bdf8' },
    { title: 'Waiting Assignment', value: metrics?.jobsWaitingAssignment || 0, icon: <AssignedIcon sx={{ fontSize: 32, color: '#818cf8' }} />, bg: 'rgba(129, 140, 248, 0.05)', border: '#818cf8' },
    { title: 'In Inspection', value: metrics?.jobsInInspection || 0, icon: <InspectingIcon sx={{ fontSize: 32, color: '#f59e0b' }} />, bg: 'rgba(245, 158, 11, 0.05)', border: '#f59e0b' },
    { title: 'Completed Today', value: metrics?.jobsCompletedToday || 0, icon: <DoneIcon sx={{ fontSize: 32, color: '#10b981' }} />, bg: 'rgba(16, 185, 129, 0.05)', border: '#10b981' },
    { title: 'Late Inspections', value: metrics?.lateJobs || 0, icon: <LateIcon sx={{ fontSize: 32, color: '#f43f5e' }} />, bg: 'rgba(244, 63, 94, 0.05)', border: '#f43f5e', countPulse: true },
  ];

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', mb: 4 }}>
        Production Metrics Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={idx}>
            <Card
              sx={{
                bgcolor: kpi.bg,
                border: '1px solid rgba(255, 255, 255, 0.03)',
                borderTop: `4px solid ${kpi.border}`,
                minHeight: 120,
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <CardContent sx={{ p: '20px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem' }}>
                    {kpi.title}
                  </Typography>
                  {kpi.icon}
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontFamily: 'Outfit',
                    color: '#f8fafc',
                    animation: kpi.countPulse && kpi.value > 0 ? 'pulse-red 2s infinite' : 'none',
                    '@keyframes pulse-red': {
                      '0%': { color: '#f8fafc' },
                      '50%': { color: '#f43f5e' },
                      '100%': { color: '#f8fafc' },
                    },
                  }}
                >
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%', border: '1px solid rgba(255,255,255,0.05)', bgcolor: '#0f172a' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 3 }}>
                Inspector Workload Distribution
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {inspectors.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">No active inspectors to show workload for.</Typography>
                ) : (
                  inspectors.map((ins) => {
                    const totalHours = ins.estimatedHours || 0;
                    const actHours = ins.actualHours || 0;
                    const progress = totalHours > 0 ? Math.min((actHours / totalHours) * 100, 100) : 0;
                    
                    return (
                      <Box key={ins.inspectorId}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {ins.firstName} {ins.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {ins.shift} • {ins.skillLevel}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {ins.activeJobsCount} Active Jobs ({actHours}h / {totalHours}h)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          color={progress > 90 ? 'error' : progress > 60 ? 'warning' : 'primary'}
                          sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.03)' }}
                        />
                      </Box>
                    );
                  })
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%', border: '1px solid rgba(255,255,255,0.05)', bgcolor: '#0f172a' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WcIcon sx={{ color: '#6366f1' }} /> Monitored QC Work Centers
              </Typography>

              {isSupervisor && (
                <Box component="form" onSubmit={handleAddWc} sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                  <TextField
                    size="small"
                    label="WC Code"
                    required
                    value={newWcCode}
                    onChange={(e) => setNewWcCode(e.target.value)}
                    sx={{ width: 100 }}
                  />
                  <TextField
                    size="small"
                    label="Description"
                    required
                    value={newWcDesc}
                    onChange={(e) => setNewWcDesc(e.target.value)}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button type="submit" variant="contained" startIcon={<AddIcon />}>
                    Add
                  </Button>
                </Box>
              )}

              <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.03)', bgcolor: 'rgba(15, 23, 42, 0.2)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Active</TableCell>
                      {isSupervisor && <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workCenters.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 2, color: '#64748b' }}>
                          No work centers.
                        </TableCell>
                      </TableRow>
                    ) : (
                      workCenters.map((wc) => (
                        <TableRow key={wc.workCenterId}>
                          <TableCell sx={{ fontWeight: 700, color: '#818cf8' }}>{wc.workCenterCode}</TableCell>
                          <TableCell sx={{ color: '#e2e8f0' }}>{wc.description}</TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={wc.active}
                              disabled={!isSupervisor}
                              onChange={() => handleToggleWc(wc)}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          {isSupervisor && (
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => handleDeleteWc(wc.workCenterId)} sx={{ color: '#f43f5e' }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
