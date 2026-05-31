import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const Inspectors: React.FC = () => {
  const { isSupervisor } = useAuth();
  const queryClient = useQueryClient();
  const [selectedInspector, setSelectedInspector] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [shift, setShift] = useState('Day');
  const [skillLevel, setSkillLevel] = useState('Level 1');
  const [active, setActive] = useState(true);

  const { data: inspectors = [], isLoading } = useQuery<any[]>({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const response = await client.get('/inspectors');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newIns: any) => {
      await client.post('/inspectors', newIns);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspectors'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await client.put(`/inspectors/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspectors'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await client.delete(`/inspectors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspectors'] });
    },
    onError: (err: any) => {
      setError(err.response?.data || 'Failed to delete inspector');
    },
  });

  const handleOpenAddDialog = () => {
    setSelectedInspector(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setShift('Day');
    setSkillLevel('Level 1');
    setActive(true);
    setError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (ins: any) => {
    setSelectedInspector(ins);
    setFirstName(ins.firstName);
    setLastName(ins.lastName);
    setEmail(ins.email);
    setShift(ins.shift);
    setSkillLevel(ins.skillLevel);
    setActive(ins.active);
    setError(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedInspector(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      setError('Please fill in all required fields.');
      return;
    }

    const payload = { firstName, lastName, email, shift, skillLevel, active };

    if (selectedInspector) {
      updateMutation.mutate({ id: selectedInspector.inspectorId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete inspector ${name}?`)) {
      setError(null);
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
          Inspectors & Workloads
        </Typography>
        {isSupervisor && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
            sx={{
              background: 'linear-gradient(45deg, #6366f1 0%, #4f46e5 100%)',
              borderRadius: 2.5,
              px: 3,
            }}
          >
            Add Inspector
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', bgcolor: '#0f172a' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.01)' }}>
              <TableCell sx={{ fontWeight: 700 }}>Inspector Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Shift</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Skill Level</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Active Jobs</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Est. Hours</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Actual Hours</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Completion Rate</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
              {isSupervisor && <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {inspectors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSupervisor ? 10 : 9} align="center" sx={{ py: 4, color: '#64748b' }}>
                  No inspectors registered in the scheduler.
                </TableCell>
              </TableRow>
            ) : (
              inspectors.map((ins) => (
                <TableRow key={ins.inspectorId} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <PersonIcon sx={{ color: ins.active ? '#6366f1' : '#64748b' }} />
                      {ins.firstName} {ins.lastName}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>{ins.email}</TableCell>
                  <TableCell>{ins.shift}</TableCell>
                  <TableCell>
                    <Chip
                      label={ins.skillLevel}
                      size="small"
                      sx={{
                        bgcolor: ins.skillLevel === 'Level 3' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)',
                        color: ins.skillLevel === 'Level 3' ? '#f59e0b' : '#cbd5e1',
                        border: ins.skillLevel === 'Level 3' ? '1px solid rgba(245, 158, 11, 0.2)' : 'none',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {ins.activeJobsCount}
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#94a3b8' }}>
                    {ins.estimatedHours}h
                  </TableCell>
                  <TableCell align="center" sx={{ color: '#94a3b8' }}>
                    {ins.actualHours}h
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${ins.completionRate}%`}
                      size="small"
                      sx={{
                        bgcolor: ins.completionRate >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                        color: ins.completionRate >= 80 ? '#10b981' : '#cbd5e1',
                        fontWeight: 700,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={ins.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={ins.active ? 'success' : 'default'}
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                    />
                  </TableCell>
                  {isSupervisor && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleOpenEditDialog(ins)} sx={{ color: '#6366f1' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(ins.inspectorId, `${ins.firstName} ${ins.lastName}`)} sx={{ color: '#f43f5e' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Inspector Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
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
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>
            {selectedInspector ? 'Edit Inspector' : 'Add New Inspector'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Box>

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="Shift"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                >
                  <MenuItem value="Day">Day Shift</MenuItem>
                  <MenuItem value="Evening">Evening Shift</MenuItem>
                  <MenuItem value="Night">Night Shift</MenuItem>
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Skill Level"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                >
                  <MenuItem value="Level 1">Level 1 (Basic)</MenuItem>
                  <MenuItem value="Level 2">Level 2 (Intermediate)</MenuItem>
                  <MenuItem value="Level 3">Level 3 (Advanced/Senior)</MenuItem>
                </TextField>
              </Box>

              {selectedInspector && (
                <TextField
                  select
                  fullWidth
                  label="Active Status"
                  value={active ? 'true' : 'false'}
                  onChange={(e) => setActive(e.target.value === 'true')}
                >
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </TextField>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog} sx={{ color: '#94a3b8' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {selectedInspector ? 'Save Changes' : 'Add Inspector'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Inspectors;
