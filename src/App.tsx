import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/login';
import { Dashboard } from './components/dashboard';
import { ProcessDashboard } from './components/process-dashboard';
import { ClassificationReview } from './components/classification-review';
import { ClassificationReview2 } from './components/classification-review2';
import { ExtractionReview } from './components/extraction-review';
import { ExtractionReview2 } from './components/extraction-review2';
import { Admin } from './components/admin';
import { Settings } from './components/settings';
import { Layout } from './components/layout';
import { useAuthStore } from './lib/store';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/process-dashboard"
          element={
            <PrivateRoute>
              <ProcessDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/classification"
          element={
            <PrivateRoute>
              <ClassificationReview />
            </PrivateRoute>
          }
        />
        <Route
          path="/classification2"
          element={
            <PrivateRoute>
              <ClassificationReview2 />
            </PrivateRoute>
          }
        />
        <Route
          path="/extraction"
          element={
            <PrivateRoute>
              <ExtractionReview />
            </PrivateRoute>
          }
        />
        <Route
          path="/extraction2"
          element={
            <PrivateRoute>
              <ExtractionReview2 />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/process-dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;