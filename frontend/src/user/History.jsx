import React, { useEffect, useState } from 'react';
import RouteRow from './RouteRow';
import './css/History.css';

function ContainerItem({ row }) {
  return (
    <div className="display-flex-row containerItem summary-container">
      <label>{row.name}</label>
      <label>{row.type}</label>
      <label>{row.size}</label>
      <label>${row.price}</label>
    </div>
  );
}

function getStatusClass(status) {
  switch (status) {
    case 'Pending':
      return 'status-pending';
    case 'Settled':
      return 'status-settled';
    case 'Due':
      return 'status-due';
    case 'Overdue':
      return 'status-overdue';
    default:
      return '';
  }
}

function HistoryRow({ reservation }) {
  return (
    <div className="reservation-row">
      <div className="display-flex-row route-details">
        <span className="reservationDetail">{reservation.reservationId}</span>
        <RouteRow
          row={reservation.route}
          selectedRouteId={reservation.route.id}
          onSelect={() => {}}
        />
        <span className="reservationDetail">Total: ${reservation.totalPrice}</span>
        <span className={`reservationDetail ${getStatusClass(reservation.paymentStatus)}`}>
          Payment: {reservation.paymentStatus}
        </span>
      </div>
      <div className="container-list">
        {reservation.containers.map(container => (
          <ContainerItem key={container.id} row={container} />
        ))}
      </div>
    </div>
  );
}

export default function History() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/rs/reservations', {credentials: 'include'})
      .then(res => {
        if (!res.ok) throw new Error('Failed to load reservation history');
        return res.json();
      })
      .then(data => setReservations(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div id="historyPage">
      <h2>Your Reservation History</h2>
      <div id="reservationHistory">
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && reservations.length === 0 && <p>No reservations found.</p>}
        {reservations.map((res, index) => (
          <HistoryRow key={index} reservation={res} />
        ))}
      </div>
    </div>
  );
}