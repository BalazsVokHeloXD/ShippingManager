import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/Register.css';

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordAgain: '',
    firstname: '',
    lastname: '',
    email: '',
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { username, password, passwordAgain, firstname, lastname, email } = formData;

    // Frontend validations
    if (!username || !password || !passwordAgain || !firstname || !lastname || !email) {
      setError('All fields are required.');
      setSuccess(null);
      return;
    }

    if (password !== passwordAgain) {
      setError('Passwords do not match.');
      setSuccess(null);
      return;
    }

    try {
      const res = await fetch('/api/us/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setError(null);
        setSuccess(data.message || 'Registration successful.');
        setTimeout(() => navigate('/login'), 1500); // Redirect to login after 1.5 sec
      } else {
        setError(data.message || 'Registration failed.');
        setSuccess(null);
      }
    } catch (err) {
      setError('Network or server error.');
      setSuccess(null);
    }
  };

  return (
    <div id="registerDiv">
      <h1>Register a new SM account</h1>
      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

        <div id="reg-upper-third">
          <div className="display-flex-row">
            <label htmlFor="username">Username: </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleChange}
              className="white-bottom-border-input"
              required
            />
          </div>
          <div className="display-flex-row">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="white-bottom-border-input"
              required
            />
          </div>
          <div className="display-flex-row">
            <label htmlFor="passwordAgain">Repeat password:</label>
            <input
              type="password"
              id="passwordAgain"
              value={formData.passwordAgain}
              onChange={handleChange}
              className="white-bottom-border-input"
              required
            />
          </div>
        </div>

        <div id="reg-middle-third">
          <div className="display-flex-row">
            <input
              type="text"
              id="firstname"
              placeholder="Firstname"
              value={formData.firstname}
              onChange={handleChange}
              className="white-bottom-border-input"
              required
            />
            <input
              type="text"
              id="lastname"
              placeholder="Lastname"
              value={formData.lastname}
              onChange={handleChange}
              className="white-bottom-border-input"
              required
            />
          </div>
        </div>

        <div id="reg-bottom-third" className="display-flex-row">
          <input
            type="email"
            id="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={handleChange}
            className="white-bottom-border-input"
            required
          />
        </div>

        <div id="footerDiv">
          <button type="submit" className="transparent-bottom-border-button">Register</button>
          <Link to="/login" style={{ marginLeft: '1rem' }}>Back to Login</Link>
        </div>
      </form>
    </div>
  );
}

export default Register;
