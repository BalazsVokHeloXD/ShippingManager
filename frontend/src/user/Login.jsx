import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './css/Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/us/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      onLogin(username);
    } else {
      const data = await res.json();
      setError(data.message || 'Login failed');
    }
  };

  return (
    <div id="loginForm">
      <form onSubmit={submit}>
        <h2>Login</h2>
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
        <Link to="/register">Register</Link>
        <Link to="/admin/login">Admin login</Link>
      </form>
    </div>
  );
}

export default Login;
