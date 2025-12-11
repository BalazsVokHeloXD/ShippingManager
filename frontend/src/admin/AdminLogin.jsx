import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../user/css/Login.css';

export default function AdminLogin({ onAdminLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/as/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password}),
      });

      if (res.ok) {
        onAdminLogin(username);
        navigate('/admin/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div id="loginForm">
      <form onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          />
        <br />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          />
        <br />
        <button type="submit" class="transparent-bottom-border-button">Login</button>
        
        <Link to="/login">User login</Link>
      </form>
    </div>
  );
}
