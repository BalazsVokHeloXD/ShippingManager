// RouteSelector.jsx
import React, { useState, useEffect } from 'react';
import RouteRow from './RouteRow';

function formatDate(datetime) {
  const date = new Date(datetime);
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}.${MM}.${dd} ${HH}:${mm}`;
}

async function getFlag(iso3) {
  const link = 'https://restcountries.com/v3.1/alpha/' + iso3;
  try {
    const res = await fetch(link);
    const data = await res.json();
    return data[0]?.flags?.png || '';
  } catch (e) {
    console.error('Error fetching flag:', iso3, e);
    return '';
  }
}

export default function RouteSelector({ filters, setFilters, options, setSelectedRoute, selectedRoute, onNext }) {
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [error, setError] = useState(null);

  // Filter countries and harbors based on selected continent and country
  const filteredDepCountries = filters.depContinent
    ? options.countries.filter(c => c.continent === filters.depContinent)
    : options.countries;

  const filteredArrCountries = filters.arrContinent
    ? options.countries.filter(c => c.continent === filters.arrContinent)
    : options.countries;

  const filteredDepHarbors = filters.depCountry
    ? options.harbors.filter(h => h.country_iso3 === filters.depCountry)
    : [];

  const filteredArrHarbors = filters.arrCountry
    ? options.harbors.filter(h => h.country_iso3 === filters.arrCountry)
    : [];

  const handleFilterChange = (e) => {
    const { id, value } = e.target;

    if (id === 'depContinent') {
      setFilters(prev => ({ ...prev, depContinent: value, depCountry: '', depHarbor: '' }));
    } else if (id === 'depCountry') {
      setFilters(prev => ({ ...prev, depCountry: value, depHarbor: '' }));
    } else if (id === 'depHarbor') {
      setFilters(prev => ({ ...prev, depHarbor: value }));
    } else if (id === 'arrContinent') {
      setFilters(prev => ({ ...prev, arrContinent: value, arrCountry: '', arrHarbor: '' }));
    } else if (id === 'arrCountry') {
      setFilters(prev => ({ ...prev, arrCountry: value, arrHarbor: '' }));
    } else if (id === 'arrHarbor') {
      setFilters(prev => ({ ...prev, arrHarbor: value }));
    }
  };

  const canSearch = filters.depHarbor && filters.arrHarbor;

  const searchRoutes = () => {
    setLoadingRoutes(true);
    setError(null);

    const params = new URLSearchParams({
      depHarbor: filters.depHarbor,
      arrHarbor: filters.arrHarbor,
      depContinent: filters.depContinent,
      depCountry: filters.depCountry,
      arrContinent: filters.arrContinent,
      arrCountry: filters.arrCountry
    });

    fetch(`/api/rs/routes?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch routes');
        return res.json();
      })
      .then(data => setRoutes(data))
      .catch(err => setError(err.message))
      .finally(() => setLoadingRoutes(false));
  };

  return (
    <div>
      <h2>Select Route Filters</h2>
      <div id="filterSection">
        <div className="display-flex-row">
          <label>From: </label>
          <select
            id="depContinent"
            value={filters.depContinent}
            onChange={handleFilterChange}
            className="white-bottom-border-input"
          >
            <option value="">Continent</option>
            {options.continents.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          <select
            id="depCountry"
            value={filters.depCountry}
            onChange={handleFilterChange}
            className="white-bottom-border-input"
            disabled={!filters.depContinent}
          >
            <option value="">Country</option>
            {filteredDepCountries.map(c => (
              <option key={c.iso3} value={c.iso3}>{c.name}</option>
            ))}
          </select>

          <select
            id="depHarbor"
            value={filters.depHarbor}
            onChange={handleFilterChange}
            className="white-bottom-border-input"
            disabled={!filters.depCountry}
          >
            <option value="">Harbor</option>
            {filteredDepHarbors.map(h => (
              <option key={h.id} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>

        <div className="display-flex-row" style={{ marginTop: '1em' }}>
          <label>To: </label>
          <select
            id="arrContinent"
            value={filters.arrContinent}
            onChange={handleFilterChange}
            className="white-bottom-border-input"
          >
            <option value="">Continent</option>
            {options.continents.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          <select
            id="arrCountry"
            value={filters.arrCountry}
            onChange={handleFilterChange}
            className="white-bottom-border-input"
            disabled={!filters.arrContinent}
          >
            <option value="">Country</option>
            {filteredArrCountries.map(c => (
              <option key={c.iso3} value={c.iso3}>{c.name}</option>
            ))}
          </select>

          <select
            id="arrHarbor"
            value={filters.arrHarbor}
            onChange={handleFilterChange}
            className="white-bottom-border-input"
            disabled={!filters.arrCountry}
          >
            <option value="">Harbor</option>
            {filteredArrHarbors.map(h => (
              <option key={h.id} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <button onClick={searchRoutes} disabled={!canSearch} class="transparent-bottom-border-button">
            Search
          </button>
        </div>
      </div>

      <div>
        <h3>Available Routes:</h3>
        {loadingRoutes && <p>Loading routes...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loadingRoutes && !error && routes.length === 0 && <p>No routes found.</p>}
        {routes.map(route => (
          <RouteRow
            key={route.id}
            row={route}
            selectedRouteId={selectedRoute?.id || null}
            onSelect={setSelectedRoute}
          />
        ))}
      </div>

      <div>
        <button onClick={onNext} disabled={!selectedRoute} class="transparent-bottom-border-button">
          Next
        </button>
      </div>
    </div>
  );
}