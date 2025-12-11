import { useState } from "react";
import Header from "../Header";
import "./css/Reservation.css";

function ReservationFilterResult({ item, selected, onSelect }) {
  return (
    <div
      className={`reservation-summary ${selected ? "selected" : ""}`}
      onClick={() => onSelect(item)}
    >
      <span class="resFilId">{item.reservationId}</span>{" "}
      <span class="resFilUsr">{item.username}</span>{" "}
      <span class="resFilCrtd">{new Date(item.createdAt).toLocaleDateString()}</span>{" "}
      <span class="resFilPrc">${item.totalPrice}</span>{" "}
      <span class="resFilStts">{item.paymentStatus}</span>
    </div>
  );
}

function ReservationItem({ item, onCallback, onDelete }) {
  if (!item) return <div className="no-selection">Select a reservation to view details</div>;

  return (
    <div className="reservation-details">
      <div className="reservation-header">
        <h3>Reservation #{item.reservationId}</h3>
        <button
          className="transparent-bottom-border-button callback-btn"
          onClick={() => onCallback(item.reservationId)}>
          Trigger Callback
        </button>
        <button
          className="transparent-bottom-border-button delete-btn"
          onClick={() => onDelete(item.reservationId)}>
          Delete Reservation
        </button>
      </div>

      <div className="reservation-info-grid">
        <div>
          <strong>User:</strong> {item.username}
        </div>
        <div>
          <strong>Created:</strong> {new Date(item.createdAt).toLocaleString()}
        </div>
        <div>
          <strong>Total Price:</strong> ${item.totalPrice}
        </div>
        <div>
          <strong>Payment Status:</strong> {item.paymentStatus}
        </div>
      </div>

      {item.routes && item.routes.length > 0 && (
        <div className="reservation-section">
          <h4>Routes</h4>
          <div className="reservation-list">
            {item.routes.map((route, i) => (
              <div className="reservation-list-item" key={i}>
                <span className="route-name">
                  {route.departure} → {route.arrival}
                </span>
                <span className="route-ship">({route.shipName})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {item.containers && item.containers.length > 0 && (
        <div className="reservation-section">
          <h4>Containers</h4>
          <div className="reservation-list">
            {item.containers.map((c, i) => (
              <div className="reservation-list-item" key={i}>
                <span className="container-name">{c.name}</span>
                <span className="container-type"> — {c.type} ({c.size})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminReservation({ adminUsername, role }) {
  const [reservationId, setReservationId] = useState("");
  const [reservationUsername, setReservationUsername] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (reservationId) params.append("reservationId", reservationId);
      if (reservationUsername) params.append("username", reservationUsername);

      const res = await fetch(`/api/as/reservations/details?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reservations");
      const data = await res.json();
      setResults(data);
      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCallback = async (reservationId) => {
    try {
      const res = await fetch("/api/as/reservation/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });

      const data = await res.json();
      alert(`Verification result: ${data.callbackResponse}`);
    } catch (err) {
      console.error(err);
      alert("Callback failed. Check console for details.");
    }
  };

  const handleDelete = async (reservationId) => {
    try {
      const confirmed = window.confirm(`Delete reservation #${reservationId}? This cannot be undone.`);
      if (!confirmed) return;

      const res = await fetch(`/api/as/reservations/${reservationId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        alert(`Delete failed: ${err.message || res.statusText}`);
        return;
      }

      const data = await res.json();
      alert(data.message || 'Reservation deleted');

      setResults((prev) => prev.filter((r) => r.reservationId !== reservationId));
      setSelected(null);
    } catch (err) {
      console.error(err);
      alert('Delete failed. Check console for details.');
    }
  };

  return (
    <div>
      <Header username={adminUsername} onLogout={() => setReservationId("")} role={role} />
      <div id="reservationBody">
        <div className="filter-section">
          <div id="reservationFilter">
            <span>Id: </span>
            <input
              type="text"
              name="reservationId"
              id="reservationId"
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
            />
            <span className="label-username">Username:</span>
            <input
              type="text"
              name="reservationUsername"
              id="reservationUsername"
              value={reservationUsername}
              onChange={(e) => setReservationUsername(e.target.value)}
            />
            <button
              className="transparent-bottom-border-button search-button"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>

          <div id="reservationFilterResult">
            {results.map((res) => (
              <ReservationFilterResult
                key={res.reservationId}
                item={res}
                selected={selected && selected.reservationId === res.reservationId}
                onSelect={(item) => setSelected(item)}
              />
            ))}
          </div>
        </div>

        <div id="reservationDetails">
          <ReservationItem item={selected} onCallback={handleCallback} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}

export default AdminReservation;