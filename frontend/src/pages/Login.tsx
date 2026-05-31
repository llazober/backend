import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  PersonOutlined as UserIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.post('/auth/login', { username, password });
      login(response.data);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #111827 0%, #070a13 100%)',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          borderRadius: 4,
          p: 2,
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Logo / Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(45deg, #6366f1 30%, #f43f5e 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              QC KANBAN
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
              Incoming Inspection Scheduler
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserIcon sx={{ color: '#6366f1' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#6366f1' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94a3b8' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2.5,
                background: 'linear-gradient(45deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                '&:hover': {
                  background: 'linear-gradient(45deg, #818cf8 0%, #6366f1 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
            </Button>
          </form>

          {/* Demo credentials tip */}
          <Box
            sx={{
              mt: 4,
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
            }}
          >
            <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, display: 'block', mb: 0.5 }}>
              DEMO CREDENTIALS:
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
              • Supervisor: <strong>supervisor</strong> / <strong>password</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
              • Inspector: <strong>inspector</strong> / <strong>password</strong>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
