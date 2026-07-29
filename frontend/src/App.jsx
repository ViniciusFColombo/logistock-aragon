import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Movements from './pages/Movements';
import Products from './pages/Products';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    jwtDecode(token);
    return children;
  } catch (error) {
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }
}

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
        <Route path="/" element={<Login />} />

        <Route 
          path="/admin/cadastro" 
          element={
            <AdminRoute>
              <RegisterUser />
            </AdminRoute>
          } 
        />

        <Route 
          path="/change-password" 
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/movements" 
          element={
            <PrivateRoute>
              <Movements />
            </PrivateRoute>
          } 
        />

        <Route 
          path="/products" 
          element={
            <PrivateRoute>
              <Products />
            </PrivateRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;