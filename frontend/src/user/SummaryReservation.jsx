import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RouteRow from './RouteRow';

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

export default function SummaryReservation({ selectedRoute, selectedContainers, onBack }) {
  const [containerDetails, setContainerDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedContainers.length) return;

    fetch('/api/rs/containers/by-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedContainers })
    })
      .then(res => res.json())
      .then(data => setContainerDetails(data))
      .catch(err => console.error('Failed to fetch container details:', err));
  }, [selectedContainers]);

  const handleReservation = async () => {
    if (!selectedRoute || !selectedContainers.length) return;

    setLoading(true);
    setStatusMessage("Submitting reservation...");

    try {
      const response = await fetch('/api/rs/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: selectedRoute.id,
          containerIds: selectedContainers
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        setStatusMessage(`Reservation failed: ${data.message}`);
        return;
      }

      const { reservationId } = data;
      setStatusMessage("Reservation submitted. Waiting for confirmation...");

      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/rs/reservations/${reservationId}/status`, { credentials: 'include' });
          const statusData = await statusRes.json();

          if (statusData.status === "success") {
            clearInterval(interval);
            setLoading(false);
            setStatusMessage("Reservation successful!");
            setTimeout(() => navigate('/'), 1000); // redirect after 1s
          } else if (statusData.status === "failed") {
            clearInterval(interval);
            setLoading(false);
            setStatusMessage(`Reservation failed: ${statusData.message}`);
          }
        } catch (err) {
          clearInterval(interval);
          setLoading(false);
          setStatusMessage("Error checking reservation status.");
          console.error(err);
        }
      }, 2000);

    } catch (err) {
      setLoading(false);
      setStatusMessage("Error submitting reservation.");
      console.error(err);
    }
  };

  return (
    <div id="summaryBody">
      <h2>Reservation Summary</h2>

      {selectedRoute && (
        <div style={{ marginBottom: '1em' }}>
          <h3>Selected Route:</h3>
          <RouteRow row={selectedRoute} selectedRouteId={selectedRoute.id} onSelect={() => {}} />
        </div>
      )}

      <div>
        <h3>Selected Containers:</h3>
        {containerDetails.length === 0 && <p>No containers selected.</p>}
        {containerDetails.map(container => (
          <ContainerItem key={container.id} row={container} />
        ))}
      </div>

      <div style={{ marginTop: '1em' }}>
        <button onClick={onBack} disabled={loading} class="transparent-bottom-border-button">Back</button>
        <button onClick={handleReservation} disabled={loading} class="transparent-bottom-border-button">Confirm Reservation</button>
      </div>

      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>{statusMessage}</p>
        </div>
      )}
      {!loading && statusMessage && <p>{statusMessage}</p>}
    </div>
  );
}