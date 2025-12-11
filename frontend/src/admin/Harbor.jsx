import React, { useEffect, useState, useRef } from 'react';
import Header from '../Header';
import RouteRow from '../user/RouteRow';
import './css/Harbor.css';

function HarborItem({ item, header, onSortClick, sortKey, sortDirection, onClick }) {
  const renderHeaderCell = (label, key, className) => (
    <span
      className={`${className} HarborCellItem ${sortKey === key ? `sorted-${sortDirection}` : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onSortClick) onSortClick(key);
      }}
      onMouseDown={(e) => e.preventDefault()}
      role="button"
      tabIndex={0}
    >
      {label}
      {sortKey === key && (
        <span className="sortIndicator">
          {sortDirection === 'asc' ? ' ▲' : sortDirection === 'desc' ? ' ▼' : ''}
        </span>
      )}
    </span>
  );

  return (
    <div
      className={`display-flex-row harborItem ${header ? 'harborItemHeader' : ''}`}
      onClick={!header ? () => onClick && onClick(item) : undefined}
    >
      {header ? (
        <>
          {renderHeaderCell('ID', 'id', 'harborId')}
          {renderHeaderCell('ISO3', 'country_iso3', 'harborIso3')}
          {renderHeaderCell('Country name', 'country_name', 'harborCountry')}
          {renderHeaderCell('Harbor', 'name', 'harborName')}
          {renderHeaderCell('Containers', 'containerNumber', 'harborContainers')}
          <span className="harborButton"></span>
        </>
      ) : (
        <>
          <span className="harborId">{item.id}</span>
          <span className="harborIso3">{item.country_iso3}</span>
          <span className="harborCountry">{item.country_name}</span>
          <span className="harborName">{item.name}</span>
          <span className="harborContainers">{item.containerNumber}</span>
        </>
      )}
    </div>
  );
}

function Harbor({ adminUsername, role }) {
  const [harbors, setHarbors] = useState([]);
  const [originalHarbors, setOriginalHarbors] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('original');
  const [selectedHarbor, setSelectedHarbor] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [countries, setCountries] = useState([]);

  const idRef = useRef();
  const nameRef = useRef();
  const iso3Ref = useRef();

  const fetchRoutesForHarbor = async (harbor_id) => {
    try {
      const res = await fetch(`/api/as/routes/${harbor_id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load routes');
      const data = await res.json();
      setRoutes(data);
      setSelectedRoute(null);
    } catch (err) {
      console.error(err);
      setRoutes([]);
    }
  };

  const handleHarborClick = (harbor) => {
    setSelectedHarbor(harbor);
    fetchRoutesForHarbor(harbor.id);
    if (idRef.current) idRef.current.value = harbor.id;
    if (nameRef.current) nameRef.current.value = harbor.name;
    if (iso3Ref.current) iso3Ref.current.value = harbor.country_iso3;
  };

  const handleSort = (key) => {
    let newDirection = 'asc';
    if (sortKey === key) {
      newDirection = sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? 'original' : 'asc';
    }

    setSortKey(key);
    setSortDirection(newDirection);

    if (newDirection === 'original') {
      setHarbors(originalHarbors);
      return;
    }

    const sorted = [...harbors].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (key === 'id' || key === 'containerNumber') {
        return newDirection === 'asc' ? valA - valB : valB - valA;
      }

      return newDirection === 'asc'
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });

    setHarbors(sorted);
  };

  const handleNewHarbor = () => {
    setSelectedHarbor(null);
    setRoutes([]);
    if (idRef.current) idRef.current.value = '';
    if (nameRef.current) nameRef.current.value = '';
    if (iso3Ref.current) iso3Ref.current.value = '';
  };

  const handleSaveHarbor = async () => {
    const id = idRef.current?.value?.trim();
    const name = nameRef.current?.value?.trim();
    const country_iso3 = iso3Ref.current?.value;

    if (!name || !country_iso3) {
      alert('Please provide both name and country.');
      return;
    }

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/as/harbor/${id}` : '/api/as/harbor';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, country_iso3 }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save harbor');
      }

      const savedHarbor = await res.json();

      setHarbors((prev) => {
        const idx = prev.findIndex((h) => h.id === savedHarbor.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = savedHarbor;
          return updated;
        } else {
          return [...prev, savedHarbor];
        }
      });

      setOriginalHarbors((prev) => {
        const idx = prev.findIndex((h) => h.id === savedHarbor.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = savedHarbor;
          return updated;
        } else {
          return [...prev, savedHarbor];
        }
      });

      handleHarborClick(savedHarbor);
      alert(`Harbor ${id ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      alert(err.message);
      console.error('Failed to save harbor:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [harborRes, countryRes] = await Promise.all([
          fetch('/api/as/harbors', { credentials: 'include' }),
          fetch('/api/as/countries', { credentials: 'include' }),
        ]);

        if (!harborRes.ok) throw new Error('Failed to load harbors');
        if (!countryRes.ok) throw new Error('Failed to load countries');

        const harborData = await harborRes.json();
        const countryData = await countryRes.json();

        setHarbors(harborData);
        setOriginalHarbors(harborData);
        setCountries(countryData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Header username={adminUsername} onLogout={() => setHarbors([])} role={role} />
      <div id="harborBody" className="display-flex-row">
        <div id="harborList">
          <h2>Available Harbors</h2>

          <HarborItem
            item={{}}
            header={true}
            onSortClick={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
          />

          {loading && <p>Loading...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && harbors.length === 0 && <p>No harbors found.</p>}
          {harbors.map((h, index) => (
            <HarborItem key={index} item={h} onClick={handleHarborClick} />
          ))}
        </div>

        <div id="harborDetails">
          <div id="harborDetailsEdit">
            <div id="harborData">
              <label htmlFor="harborIdEdit">Id: </label>
              <input type="text" id="harborIdEdit" disabled ref={idRef} />

              <label htmlFor="harborNameEdit">Name: </label>
              <input type="text" id="harborNameEdit" ref={nameRef} />

              <label htmlFor="harborIso3Edit">Country: </label>
              <select id="harborIso3Edit" ref={iso3Ref}>
                <option value="">-- Select country --</option>
                {countries.map((c) => (
                  <option key={c.iso3} value={c.iso3}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button className="transparent-bottom-border-button" onClick={handleNewHarbor}>
                New Harbor
              </button>
              <button className="transparent-bottom-border-button" onClick={handleSaveHarbor}>
                Save Harbor
              </button>
            </div>
          </div>

          <div id="harborDetailsRoutes">
            <h3>Routes related to {selectedHarbor?.name || '...'}</h3>
            {routes.length === 0 && <p>No routes found.</p>}
            {routes.map((route) => (
              <RouteRow
                key={route.id}
                row={route}
                selectedRouteId={selectedRoute?.id}
                onSelect={(route) => setSelectedRoute(route)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Harbor;