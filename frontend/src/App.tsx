import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Board from './pages/Board';
import Inspectors from './pages/Inspectors';
import Dashboard from './pages/Dashboard';
import Workloads from './pages/Workloads';
import FutureAIFeatures from './pages/FutureAIFeatures';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Board />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspectors"
          element={
            <ProtectedRoute>
              <Layout>
                <Inspectors />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workloads"
          element={
            <ProtectedRoute>
              <Layout>
                <Workloads />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/future-ai"
          element={
            <ProtectedRoute>
              <Layout>
                <FutureAIFeatures />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
