import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Header.css";

function Header({ username, role, onLogout }) {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    if (role === "admin") {
      fetch("/api/as/permissions", { credentials: "include" })
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch permissions");
          return res.json();
        })
        .then(data => {
          setPermissions(data.permissions.map(p => p.pageKey));
        })
        .catch(err => {
          console.error("Error fetching permissions:", err);
          setPermissions([]);
        });
    }
  }, [role]);

  const logout = async () => {
    try {
      const endpoint = role === "admin" ? "api/as/logout" : "/api/us/logout";
      const redirect = role === "admin" ? "/admin/login" : "/login";
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Logout failed:", res.statusText);
      }

      onLogout();
      navigate(redirect);
    } catch (err) {
      console.error("Error during logout:", err);
      onLogout();
      navigate(redirect);
    }
  };

  return (
    <div id="headerDiv">
      {role === 'admin' ? (
        <>
          {permissions.includes("harbors") && (
            <button className="transparent-bottom-border-button" onClick={() => navigate('/admin/harbors')}>
              Harbors
            </button>
          )}
          {permissions.includes("containers") && (
            <button className="transparent-bottom-border-button" onClick={() => navigate('/admin/containers')}>
              Containers
            </button>
          )}
          {permissions.includes("containers") && (
            <button className="transparent-bottom-border-button" onClick={() => navigate('/admin/containerBalancer')}>
              Container Balancer
            </button>
          )}
          {permissions.includes("routes") && (
            <button className="transparent-bottom-border-button" onClick={() => navigate('/admin/routes')}>
              Routes
            </button>
          )}
          {permissions.includes("reservations") && (
            <button className="transparent-bottom-border-button" onClick={() => navigate('/admin/reservations')}>
              Reservations
            </button>
          )}
          {permissions.includes("administrators") && (
            <button className="transparent-bottom-border-button" onClick={() => navigate('/admin/administrators')}>
              Manage Administrators
            </button>
          )}
        </>
      ) : (
        <>
          <button className="transparent-bottom-border-button" onClick={() => navigate('/home')}>Home</button>
          <button className="transparent-bottom-border-button" onClick={() => navigate('/reservation')}>New</button>
          <button className="transparent-bottom-border-button" onClick={() => navigate('/account')}>Account</button>
          <button className="transparent-bottom-border-button" onClick={() => navigate('/payment')}>Payment</button>
        </>
      )}

      <div id="headerLoginDetails">
        <label>Logged in as {role}:</label>{username}
      </div>
      <button className="transparent-bottom-border-button" onClick={logout}>Logout</button>
    </div>
  );
}

export default Header;