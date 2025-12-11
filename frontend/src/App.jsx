import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Home from './user/Home';
import SessionChecker from './SessionChecker';

//User import
import Login from './user/Login';
import Register from './user/Register';
import Account from './user/Account';
import Reservation from './user/Reservation';
import Payment from './user/Payment';
//admin import
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import Harbor from './admin/Harbor';
import Container from './admin/Container';
import AdminContainerBalancer from './admin/AdminContainerBalancer';
import RoutePage from './admin/Route';
import AdminReservation from './admin/AdminReservation';
import Administrator from './admin/Administrator';


import './ButtonStyles.css';
import './InputStyles.css';
import './Colors.css';

function App() {
  const [username, setUsername] = useState('');
  const [adminUsername, setAdminUsername] = useState('');

  return (
    <Router>
      <Routes>
        {/* User routes with role="user" */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={
          <SessionChecker setUsername={setUsername} username={username} requiredRole="user">
            <Home username={username} setUsername={setUsername} role="user" />
          </SessionChecker>
        } />
        <Route path="/login" element={<LoginRedirect setUsername={setUsername} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={
          <SessionChecker setUsername={setUsername} username={username} requiredRole="user">
            <Account username={username} setUsername={setUsername} />
          </SessionChecker>
        } />
        <Route path="/reservation" element={
          <SessionChecker setUsername={setUsername} username={username} requiredRole="user">
            <Reservation username={username} setUsername={setUsername} />
          </SessionChecker>
        } />
        <Route path="/payment" element={
          <SessionChecker setUsername={setUsername} username={username} requiredRole="user">
            <Payment username={username} setUsername={setUsername} />
          </SessionChecker>
        } />

        {/* Admin routes with role="admin" */}
        <Route path="/admin/login" element={<AdminLogin onAdminLogin={setAdminUsername} />} />
        <Route path="/admin/dashboard" element={
          <SessionChecker setUsername={setAdminUsername} username={adminUsername} requiredRole="admin">
            <AdminDashboard adminUsername={adminUsername} setAdminUsername={setAdminUsername} role="admin"/>
          </SessionChecker>
        } />
        <Route path="/admin/harbors" element={
          <SessionChecker setUsername={setAdminUsername} username={adminUsername} requiredRole="admin">
            <Harbor adminUsername={adminUsername} setAdminUsername={setAdminUsername} role="admin"/>
          </SessionChecker>
        } />
        <Route path="/admin/containers" element={
          <SessionChecker setUsername={setAdminUsername} username={adminUsername} requiredRole="admin">
            <Container adminUsername={adminUsername} setAdminUsername={setAdminUsername} role="admin"/>
          </SessionChecker>
        } />
        <Route path="/admin/containerBalancer" element={
          <SessionChecker setUsername={setAdminUsername} username={adminUsername} requiredRole="admin">
            <AdminContainerBalancer adminUsername={adminUsername} setAdminUsername={setAdminUsername} role="admin"/>
          </SessionChecker>
        } />
        <Route path="/admin/routes" element={
          <SessionChecker setUsername={setAdminUsername} username={adminUsername} requiredRole="admin">
            <RoutePage adminUsername={adminUsername} setAdminUsername={setAdminUsername} role="admin"/>
          </SessionChecker>
        } />
        <Route path="/admin/reservations" element={
          <SessionChecker setUsername={setAdminUsername} username={adminUsername} requiredRole="admin">
            <AdminReservation adminUsername={adminUsername} setAdminUsername={setAdminUsername} role="admin"/>
          </SessionChecker>
        } />
        <Route path="/admin/administrators" element={
          <SessionChecker setUsername={setAdminUsername} username={adminUsername} requiredRole="admin">
            <Administrator adminUsername={adminUsername} setAdminUsername={setAdminUsername} role="admin"/>
          </SessionChecker>
        } />
        
      </Routes>
    </Router>
  );
}

function LoginRedirect({ setUsername }) {
  const navigate = useNavigate();

  return (
    <Login
      onLogin={(user) => {
        setUsername(user);
        navigate('/home');
      }}
    />
  );
}

export default App;
