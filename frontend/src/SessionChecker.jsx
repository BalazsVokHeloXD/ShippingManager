import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SessionChecker({ children, setUsername, username, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const endpoint = requiredRole === "admin" ? "/api/as/session" : "/api/us/session";
    const redirect = requiredRole === "admin" ? "/admin/login" : "/login";
    fetch(endpoint, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (!data.loggedIn) {
          navigate(redirect);
        } else if (requiredRole && data.role !== requiredRole) {
          navigate(redirect);
        } else {
          if (!username) setUsername(data.username);
        }
        setLoading(false);
      })
      .catch(() => {
        navigate(redirect);
        setLoading(false);
      });
  }, [navigate, setUsername, username, requiredRole]);


  if (loading) return <p>Loading session...</p>;

  return children;
}
