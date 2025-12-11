import React, { useEffect, useState } from 'react';
import Header from '../Header';
import './css/Account.css';

function Account({ username, setUsername }) {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [email, setEmail] = useState('');
  const [countryIso3, setCountryIso3] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [address, setAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordAgain, setNewPasswordAgain] = useState('');

  useEffect(() => {
    fetch('/api/us/account', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch account data');
        return res.json();
      })
      .then(data => {
        const acc = data.account || {};
        setFirstname(acc.firstname || '');
        setLastname(acc.lastname || '');
        setBirthdate(acc.birthdate || '');
        setBirthplace(acc.birthplace || '');
        setEmail(acc.email || '');
        setCountryIso3(acc.country_iso3 || '');
        setZipcode(acc.zipcode || '');
        setAddress(acc.address || '');
      })
      .catch(err => alert(err.message));
  }, []);

  const updateDetails = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/us/account/update-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstname, lastname, birthdate, birthplace, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update details');
      alert(data.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const updateBilling = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/us/account/update-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ country_iso3: countryIso3, zipcode, address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update billing info');
      alert(data.message);
    } catch (err) {
      alert(err.message);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== newPasswordAgain) {
      alert('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('/api/us/account/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword, newPasswordAgain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');
      alert(data.message);
      setNewPassword('');
      setNewPasswordAgain('');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <Header username={username} onLogout={() => setUsername('')} />

      <div id="accountDetails">

        <div id="top-section">
          <h1>Account details</h1>
          <div className="display-flex-row">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              className="white-bottom-border-input"
              disabled
              value={username}
            />
          </div>
        </div>

        <div className="dividerLine" />

        <div id="password-section">
          <h2>Change password</h2>
          <form onSubmit={updatePassword}>
            <div className="display-flex-row">
              <label htmlFor="newPassword">New password:</label>
              <input
                type="password"
                id="newPassword"
                className="white-bottom-border-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="display-flex-row">
              <label htmlFor="newPasswordAgain">New password again:</label>
              <input
                type="password"
                id="newPasswordAgain"
                className="white-bottom-border-input"
                value={newPasswordAgain}
                onChange={e => setNewPasswordAgain(e.target.value)}
                required
              />
            </div>
            <div className="display-flex-row">
              <button type="submit" className="transparent-bottom-border-button">Change password</button>
            </div>
          </form>
        </div>

        <div className="dividerLine" />

        <div id="details-section">
          <h2>Account details</h2>
          <form onSubmit={updateDetails}>
            <div className="display-flex-row">
              <label htmlFor="firstname">Firstname:</label>
              <input
                type="text"
                id="firstname"
                className="white-bottom-border-input"
                value={firstname}
                onChange={e => setFirstname(e.target.value)}
                required
              />
            </div>
            <div className="display-flex-row">
              <label htmlFor="lastname">Lastname:</label>
              <input
                type="text"
                id="lastname"
                className="white-bottom-border-input"
                value={lastname}
                onChange={e => setLastname(e.target.value)}
                required
              />
            </div>
            <div className="display-flex-row">
              <label htmlFor="birthdate">Birthdate:</label>
              <input
                type="date"
                id="birthdate"
                className="white-bottom-border-input"
                value={birthdate}
                onChange={e => setBirthdate(e.target.value)}
              />
            </div>
            <div className="display-flex-row">
              <label htmlFor="birthplace">Birthplace:</label>
              <input
                type="text"
                id="birthplace"
                className="white-bottom-border-input"
                value={birthplace}
                onChange={e => setBirthplace(e.target.value)}
              />
            </div>
            <div className="display-flex-row">
              <label htmlFor="email">E-Mail:</label>
              <input
                type="email"
                id="email"
                className="white-bottom-border-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="display-flex-row">
              <button type="submit" className="transparent-bottom-border-button">Save changes</button>
            </div>
          </form>
        </div>

        <div className="dividerLine" />

        <div id="billing-section">
          <h2>Billing details</h2>
          <form onSubmit={updateBilling}>
            <div className="display-flex-row">
              <label htmlFor="country">Country (ISO3):</label>
              <input
                type="text"
                id="country"
                className="white-bottom-border-input"
                value={countryIso3}
                onChange={e => setCountryIso3(e.target.value)}
              />
            </div>
            <div className="display-flex-row">
              <label htmlFor="zipcode">ZIP code:</label>
              <input
                type="text"
                id="zipcode"
                className="white-bottom-border-input"
                value={zipcode}
                onChange={e => setZipcode(e.target.value)}
              />
            </div>
            <div className="display-flex-row">
              <label htmlFor="address">Address:</label>
              <input
                type="text"
                id="address"
                className="white-bottom-border-input"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            <div className="display-flex-row">
              <button type="submit" className="transparent-bottom-border-button">Save changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Account;
