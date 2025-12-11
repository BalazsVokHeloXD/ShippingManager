import React, { useState } from 'react';
import Header from '../Header';
import './css/Payment.css';

function Payment({ username, setUsername }) {
  const [reservationId, setReservationId] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [price, setPrice] = useState(null);
  const [paymentLink, setPaymentLink] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      setError('');
      const response = await fetch('/api/ps/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, birthdate })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to validate reservation');
      }

      const data = await response.json();
      setPrice(data.price);
      setPaymentLink(data.paymentLink);
    } catch (err) {
      setPrice(null);
      setPaymentLink('');
      setError(err.message);
    }
  };

  const handleProceed = () => {
    if (paymentLink) {
      window.location.href = paymentLink;
    }
  };

  const canSearch = reservationId.trim() !== '' && birthdate.trim() !== '';
  const canProceed = paymentLink !== '';

  return (
    <div>
      <Header username={username} onLogout={() => setUsername('')} />
      <div id="paymentBody">
        <h1>Online Payment</h1>
        <div className="dividerLine" />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div>
          <div className="display-flex-row">
            <label htmlFor="reservationId">Reservation ID:</label>
            <input
              type="text"
              name="reservationId"
              id="reservationId"
              className="white-bottom-border-input"
              value={reservationId}
              onChange={e => setReservationId(e.target.value)}
            />
          </div>

          <div className="display-flex-row">
            <label htmlFor="birthdate">Birthdate of client:</label>
            <input
              type="date"
              name="birthdate"
              id="birthdate"
              className="white-bottom-border-input"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
            />
          </div>

          <div className="display-flex-row">
            <label htmlFor="price">Price: </label>
            <input
              type="text"
              name="price"
              id="price"
              className="white-bottom-border-input"
              readOnly
              value={price !== null ? `${price} HUF` : ''}
            />
          </div>
        </div>

        <div id="buttonHolder">
          <button
            className="transparent-bottom-border-button"
            disabled={!canSearch}
            onClick={handleSearch}
          >
            Search
          </button>

          <button
            className="transparent-bottom-border-button"
            disabled={!canProceed}
            onClick={handleProceed}
          >
            Proceed to payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default Payment;
