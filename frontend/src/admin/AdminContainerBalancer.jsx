import React, { useState, useEffect } from 'react';
import Header from "../Header";
import "./css/AdminContainerBalancer.css";

export default function AdminContainerBalancer({ adminUsername, setAdminUsername, role }) {
  const [targets, setTargets] = useState([]);
  const [totalContainers, setTotalContainers] = useState(0);
  const [continentFilter, setContinentFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetch("/api/as/harbor-targets")
      .then(res => res.json())
      .then(data => setTargets(data.map(h => ({ ...h, edited: false }))))
      .catch(err => console.error("Failed to fetch harbor targets:", err));

    fetch("/api/as/total-containers") 
      .then(res => res.json())
      .then(data => setTotalContainers(data.total_count))
      .catch(err => console.error("Failed to fetch total containers:", err));
  }, []);

  useEffect(() => {
    if (continentFilter) {
      const filteredCountries = targets
        .filter(h => h.continent_code === continentFilter)
        .map(h => ({ code: h.country_iso3, name: h.country_name }));
      setCountries(filteredCountries);
      setCountryFilter("");
    } else {
      setCountries([]);
      setCountryFilter("");
    }
  }, [continentFilter, targets]);

  const handleChange = (harbor_id, value) => {
    setTargets(prev => prev.map(h => {
      if (h.harbor_id === harbor_id) {
        return { ...h, target_container_amount: value, edited: true };
      }
      return h;
    }));
  };

  const handleSaveRow = async (harbor) => {
    try {
      const response = await fetch("/api/as/harbor-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          harbor_id: harbor.harbor_id,
          desired_count: Number(harbor.target_container_amount)
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to save target");
        return;
      }

      setTargets(prev => prev.map(h =>
        h.harbor_id === harbor.harbor_id ? { ...h, edited: false } : h
      ));

      alert(data.message || `Saved target for ${harbor.harbor_name}`);
    } catch (err) {
      console.error("Failed to save harbor target:", err);
      alert("Network or server error while saving target");
    }
  };

  const filteredTargets = targets.filter(h => 
    (!continentFilter || h.continent_code === continentFilter) &&
    (!countryFilter || h.country_iso3 === countryFilter)
  );

  const continents = [...new Set(targets.map(h => h.continent_code))];

  return (
    <div className="container-balancer">
      <Header username={adminUsername} onLogout={() => {}} role={role} />

      <div className="filters">
        Continent: 
        <select value={continentFilter} onChange={e => setContinentFilter(e.target.value)}>
            <option value="">All</option>
            {continents.map(code => (
            <option key={code} value={code}>{code}</option>
            ))}
        </select>

        Country: 
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}>
            <option value="">All</option>
            {countries.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
            ))}
        </select>

        <button
            className="run-balancer-btn transparent-bottom-border-button"
            onClick={async () => {
            try {
                const response = await fetch("/api/as/balance-containers", { method: "POST" });
                const data = await response.json();
                if (!response.ok) {
                alert(data.message || "Failed to run balancer");
                return;
                }
                alert("Balancer executed! Check console for details.");
                console.log("Balancer results:", data.details);

                const resTargets = await fetch("/api/as/harbor-targets");
                const targetsData = await resTargets.json();
                setTargets(targetsData.map(h => ({ ...h, edited: false })));
            } catch (err) {
                console.error("Error running balancer:", err);
                alert("Network or server error while running balancer");
            }
            }}
        >
            Run Balancer
        </button>
        </div>


      <table className="harbor-table">
        <thead>
          <tr>
            <th>Continent</th>
            <th>Country</th>
            <th>Harbor</th>
            <th>Current Containers Total: {totalContainers}</th>
            <th>Target Containers</th>
            <th>Desired %</th>
            <th>Actual %</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredTargets.map(h => {
            const desiredPercentage = totalContainers > 0
              ? Math.min(100, (h.target_container_amount / totalContainers) * 100)
              : 0;
            const actualPercentage = h.current_container_count > 0
              ? Math.min(100, (h.current_container_count / totalContainers) * 100)
              : 0;

            return (
              <tr key={h.harbor_id} className={h.edited ? "edited-row" : ""}>
                <td>{h.continent_code}</td>
                <td>{h.country_name}</td>
                <td>{h.harbor_name}</td>
                <td>{h.current_container_count}</td>
                <td>
                  <input
                    type="text"
                    className="target-input"
                    value={h.target_container_amount}
                    onChange={e => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        handleChange(h.harbor_id, val);
                      }
                    }}
                  />
                </td>
                <td>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${desiredPercentage > 100 ? "over" : "ok"}`}
                      style={{ width: `${desiredPercentage}%` }}
                    />
                  </div>
                  <span className="progress-label">{desiredPercentage.toFixed(0)}%</span>
                </td>
                <td>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${actualPercentage < 100 ? "under" : "ok"}`}
                      style={{ width: `${actualPercentage}%` }}
                    />
                  </div>
                  <span className="progress-label">{actualPercentage.toFixed(0)}%</span>
                </td>
                <td>
                  {h.edited && (
                    <button className="save-btn" onClick={() => handleSaveRow(h)}>Save</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}