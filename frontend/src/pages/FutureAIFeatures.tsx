import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Chip,
  Grid,
  Divider,
  Paper,
  Avatar,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Scale as BalancerIcon,
  PriorityHigh as PriorityIcon,
  ReportProblem as BottleneckIcon,
  AccessTime as DurationIcon,
  Forum as CopilotIcon,
  ArrowForward as ArrowIcon,
  PlayArrow as RunIcon,
  Refresh as ResetIcon
} from '@mui/icons-material';

const FutureAIFeatures: React.FC = () => {
  // AI Copilot state
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);
  const [isCopilotTyping, setIsCopilotTyping] = useState(false);

  // AI Duration Predictor state
  const [predPart, setPredPart] = useState('PART-8890');
  const [predCustomer, setPredCustomer] = useState('Epicor Corp');
  const [predComplexity, setPredComplexity] = useState('Medium');
  const [predictionResult, setPredictionResult] = useState<string | null>(null);

  // Workload Balancer recommendations state
  const [showBalancerRecom, setShowBalancerRecom] = useState(false);

  // Health / Bottleneck status state
  const [showBottleneckAnalysis, setShowBottleneckAnalysis] = useState(false);

  const copilotPrompts = [
    { text: 'Show me all late incoming inspections.', reply: `**AI Copilot Analysis:**\n\nI found **1** late inspection:\n- **JOB1002** (Part: PART-8890, Qty: 50) was due **May 30** and is currently in **New Incoming** (Unassigned).\n\n*Actionable Suggestion: Reallocate JOB1002 immediately to Jane Smith (Day Shift) who has a 2.0h capacity window open.*` },
    { text: 'Which inspector is overloaded?', reply: `**AI Copilot Analysis:**\n\n**John Doe** is currently operating above threshold:\n- Total active jobs: **1** (Estimated Hours: **2.5h**)\n- Actual Hours spent: **2.0h**\n- Shift remaining: **1.5h**\n\n*Actionable Suggestion: Reassign any new incoming normal priority cards to Jane Smith or assign them to the next shift.*` },
    { text: 'What jobs are due this week?', reply: `**AI Copilot Analysis:**\n\n**3** inspection cards are due this week:\n- **JOB1005** (Part: PART-3344, Due: **Jun 1**)\n- **JOB1001** (Part: PART-7789, Due: **Jun 2**)\n- **JOB1004** (Part: PART-5544, Due: **Jun 3**)` },
    { text: 'Which customer has the most pending inspections?', reply: `**AI Copilot Analysis:**\n\n**Caterpillar Inc.** currently has the largest pending queue:\n- **3 jobs** waiting in 'New Incoming'.\n- Total parts count: **1,250 units**.\n- Estimated inspection backlog: **6.2 hours**.` }
  ];

  const handleCopilotPromptClick = (prompt: string, reply: string) => {
    setCopilotQuery(prompt);
    setIsCopilotTyping(true);
    setCopilotResponse(null);
    setTimeout(() => {
      setIsCopilotTyping(false);
      setCopilotResponse(reply);
    }, 850);
  };

  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;

    setIsCopilotTyping(true);
    setCopilotResponse(null);
    setTimeout(() => {
      setIsCopilotTyping(false);
      setCopilotResponse(
        `**AI Copilot Response:**\n\nI processed your query: *"${copilotQuery}"*.\n\nBased on current scheduler metrics and Epicor ERP records, I have verified that all active inspector schedules are synchronized and no anomalies were detected outside normal tolerances. Let me know if you would like me to compile a specific report on that!`
      );
    }, 1100);
  };

  const calculatePrediction = () => {
    let baseHours = 1.5;
    if (predPart === 'PART-8890') baseHours = 3.2;
    if (predPart === 'PART-7789') baseHours = 2.5;
    if (predComplexity === 'High') baseHours *= 1.5;
    if (predComplexity === 'Low') baseHours *= 0.7;

    setPredictionResult(
      `AI Predicted Duration: **${baseHours.toFixed(1)} hours** (Confidence level: 94%)`
    );
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header Banner */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          flexWrap: 'wrap'
        }}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            bgcolor: '#a855f7',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
          }}
        >
          <AIIcon sx={{ fontSize: '2rem', color: '#fff' }} />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: '#f8fafc' }}>
            Future AI Intelligence Suite
          </Typography>
          <Typography variant="body1" sx={{ color: '#a78bfa', mt: 0.5 }}>
            A sneak peek at the intelligent scheduling features and Copilot integrations coming to the Incoming Inspection department.
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={4}>
        {/* Left Side: Feature Mockups */}
        <Grid size={{ xs: 12, lg: 7 }} container spacing={3}>
          {/* Card 1: AI Workload Balancer */}
          <Grid size={12}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: '#0f172a' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <BalancerIcon sx={{ color: '#818cf8' }} /> AI Workload Balancer
                  </Typography>
                  <Chip label="Coming Soon" color="primary" size="small" variant="outlined" sx={{ borderColor: '#818cf8', color: '#818cf8' }} />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Analyzes inspector shifts, individual skillset levels, and estimated workload hours to recommend optimal card assignments that prevent bottlenecks.
                </Typography>
                
                <Box sx={{ bgcolor: 'rgba(7, 10, 19, 0.5)', p: 2, borderRadius: 2, border: '1px solid rgba(255, 255, 255, 0.02)' }}>
                  {!showBalancerRecom ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<RunIcon />}
                        onClick={() => setShowBalancerRecom(true)}
                        sx={{ borderColor: 'rgba(99, 102, 241, 0.3)', color: '#818cf8' }}
                      >
                        Simulate AI Balancer Recommendation
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 700 }}>AI RECOMMENDATION</Typography>
                        <Button size="small" sx={{ p: 0, minWidth: 0, color: '#64748b' }} onClick={() => setShowBalancerRecom(false)}><ResetIcon sx={{ fontSize: '1rem' }} /></Button>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#e2e8f0', mb: 1 }}>
                        Reassign **JOB1002** (Critical Priority) from Unassigned to **Jane Smith** (Day Shift).
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                        Jane has **High** skill level for Part **PART-8890** and has **2.5h** available before shift end. Saves **45 mins** compared to other inspectors.
                      </Typography>
                      <Button variant="contained" size="small" disabled sx={{ textTransform: 'none' }}>
                        Apply AI Assignment Recommendation
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: AI Priority Engine */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: '#0f172a', height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.05rem' }}>
                    <PriorityIcon sx={{ color: '#f59e0b' }} /> AI Priority Engine
                  </Typography>
                  <Chip label="Future Feature" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }} />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2, flexGrow: 1 }}>
                  Evaluates Epicor job due dates, part criticalities, and customer urgency rules to dynamically recommend card priorities (Low/Normal/High/Critical).
                </Typography>
                <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.03)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Auto-Priority" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                  <Typography variant="caption" color="textSecondary">Integrates directly with Epicor Customer SLA tiers.</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: AI Bottleneck Detection */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: '#0f172a', height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.05rem' }}>
                    <BottleneckIcon sx={{ color: '#ef4444' }} /> AI Bottlenecks
                  </Typography>
                  <Chip label="Coming Soon" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }} />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3, flexGrow: 1 }}>
                  Identifies inspectors with excessive backlogs, overdue items, or inactive card stalls. Proactively alerts supervisors.
                </Typography>

                <Box sx={{ bgcolor: 'rgba(7, 10, 19, 0.5)', p: 1.5, borderRadius: 1.5, border: '1px solid rgba(255, 255, 255, 0.01)' }}>
                  {!showBottleneckAnalysis ? (
                    <Button fullWidth variant="text" size="small" onClick={() => setShowBottleneckAnalysis(true)} sx={{ textTransform: 'none', color: '#f87171' }}>
                      Analyze Queue Health
                    </Button>
                  ) : (
                    <Box>
                      <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700, display: 'block', mb: 0.5 }}>1 CRITICAL ALARM</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.78rem', color: '#fca5a5', mb: 1 }}>
                        John Doe is approaching 100% capacity threshold for Day Shift.
                      </Typography>
                      <LinearProgress variant="determinate" value={92} color="error" sx={{ height: 6, borderRadius: 3, mb: 1 }} />
                      <Typography variant="caption" sx={{ color: '#64748b', cursor: 'pointer' }} onClick={() => setShowBottleneckAnalysis(false)}>Reset</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: AI Estimated Duration Predictor */}
          <Grid size={12}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: '#0f172a' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DurationIcon sx={{ color: '#10b981' }} /> AI Estimated Duration Engine
                  </Typography>
                  <Chip label="Interactive Simulator" color="success" size="small" variant="outlined" sx={{ borderColor: '#10b981', color: '#10b981' }} />
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Predicts inspection times based on part number, historical operations data, job complexity, and customer. Fill out fields to run a simulated prediction.
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Part Number"
                      value={predPart}
                      onChange={(e) => setPredPart(e.target.value)}
                    >
                      <MenuItem value="PART-8890">PART-8890 (Flange)</MenuItem>
                      <MenuItem value="PART-7789">PART-7789 (Bracket)</MenuItem>
                      <MenuItem value="PART-5544">PART-5544 (Wiring)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Customer"
                      value={predCustomer}
                      onChange={(e) => setPredCustomer(e.target.value)}
                    >
                      <MenuItem value="Epicor Corp">Epicor Corp</MenuItem>
                      <MenuItem value="Caterpillar Inc">Caterpillar Inc</MenuItem>
                      <MenuItem value="General Motors">General Motors</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Complexity"
                      value={predComplexity}
                      onChange={(e) => setPredComplexity(e.target.value)}
                    >
                      <MenuItem value="Low">Low Complexity</MenuItem>
                      <MenuItem value="Medium">Medium Complexity</MenuItem>
                      <MenuItem value="High">High Complexity</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, bgcolor: 'rgba(7, 10, 19, 0.5)', p: 2, borderRadius: 2 }}>
                  <Button variant="contained" color="success" onClick={calculatePrediction} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
                    Predict Inspection Duration
                  </Button>
                  {predictionResult && (
                    <Typography
                      variant="body2"
                      sx={{ color: '#f8fafc', fontWeight: 600 }}
                      dangerouslySetInnerHTML={{ __html: predictionResult }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Right Side: Interactive AI Copilot Terminal */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card
            sx={{
              border: '1px solid rgba(168, 85, 247, 0.3)',
              bgcolor: '#090d16',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15)'
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '24px !important' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, color: '#c084fc' }}>
                <CopilotIcon /> QC Copilot Simulator
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Test driving natural language queries. Click any of the pre-built prompts to test, or type your own question.
              </Typography>

              {/* Suggestions Chips */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: '#a78bfa', fontWeight: 700, display: 'block', mb: 1.5 }}>
                  SUGGESTED PROMPTS
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {copilotPrompts.map((p, idx) => (
                    <Button
                      key={idx}
                      variant="outlined"
                      size="small"
                      onClick={() => handleCopilotPromptClick(p.text, p.reply)}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        textTransform: 'none',
                        color: '#cbd5e1',
                        borderColor: 'rgba(168, 85, 247, 0.15)',
                        bgcolor: 'rgba(168, 85, 247, 0.02)',
                        py: 1,
                        px: 1.5,
                        borderRadius: 1.5,
                        fontSize: '0.8rem',
                        '&:hover': {
                          bgcolor: 'rgba(168, 85, 247, 0.08)',
                          borderColor: '#c084fc',
                          color: '#fff'
                        }
                      }}
                    >
                      {p.text}
                    </Button>
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.05)' }} />

              {/* Terminal Screen */}
              <Box
                sx={{
                  flexGrow: 1,
                  bgcolor: '#020617',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: 2,
                  p: 2.5,
                  minHeight: 250,
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: 'Consolas, Monaco, monospace',
                  position: 'relative'
                }}
              >
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                  {isCopilotTyping ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <CircularProgress size={16} sx={{ color: '#c084fc' }} />
                      <Typography variant="body2" sx={{ color: '#a78bfa', fontSize: '0.85rem' }}>
                        Copilot is processing scheduler data...
                      </Typography>
                    </Box>
                  ) : copilotResponse ? (
                    <Box sx={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', fontSize: '0.85rem', lineHeight: '1.4rem' }}>
                      {copilotResponse}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#475569', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      Terminal Idle. Select a query above or type below to interact.
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Input Form */}
              <Box component="form" onSubmit={handleCustomQuery} sx={{ mt: 3, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ask a question about jobs, inspectors..."
                  value={copilotQuery}
                  onChange={(e) => setCopilotQuery(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#020617',
                      borderColor: 'rgba(168, 85, 247, 0.2)'
                    }
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: '#a855f7',
                    '&:hover': { bgcolor: '#9333ea' },
                    minWidth: 50
                  }}
                >
                  <ArrowIcon />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FutureAIFeatures;
