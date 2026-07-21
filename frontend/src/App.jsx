import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Movements from './pages/Movements';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    jwtDecode(token);
    return children;
  } catch (error) {
    // If the token is invalid or corrupted, clear it and log out
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }
}

// Admins Only
function AdminRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    
    if (decoded.role === 'admin') {
      return children;
    } else {
      alert('Access denied: This operation is permitted for administrators only.');
      return <Navigate to="/" replace />;
    }
  } catch (error) {
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route: Login Screen */}
        <Route path="/" element={<Login />} />

        {/* Protected Route: User Registration (Administrators Only) */}
        <Route 
          path="/admin/cadastro" 
          element={
            <AdminRoute>
              <RegisterUser />
            </AdminRoute>
          } 
        />

        {/* Protected Route: Password Change (Any Logged-in User) */}
        <Route 
          path="/change-password" 
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          } 
        />

        {/* Protected Route: System Dashboard (Any Logged-in User) */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Protected Route: Movements Screen (Any Logged-in User) */}
        <Route 
          path="/movements" 
          element={
            <PrivateRoute>
              <Movements />
            </PrivateRoute>
          } 
        />

        {/* For non-existent routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;