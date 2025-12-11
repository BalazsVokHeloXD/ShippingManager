import React, { useEffect, useState } from 'react';
import RouteRow from './RouteRow';
import ContainerItem from './Containeritem';

export default function ContainerSelector({
  selectedRoute,
  selectedContainers,
  setSelectedContainers,
  onBack,
  onNext
}) {
  const [allContainers, setAllContainers] = useState([]);
  const [filteredContainers, setFilteredContainers] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');

  const containerSizes = ['small', 'medium', 'large'];

  useEffect(() => {
    fetch('/api/rs/container-types')
      .then(res => res.json())
      .then(data => setTypeOptions(data))
      .catch(err => console.error('Failed to load container types:', err));
  }, []);

  useEffect(() => {
    if (!selectedRoute?.departure_harbor_id) return;

    fetch(`/api/rs/containers?harbor_id=${selectedRoute.departure_harbor_id}`)
      .then(res => res.json())
      .then(data => {
        setAllContainers(data);
        setFilteredContainers(data);
      })
      .catch(err => console.error('Failed to fetch containers:', err));
  }, [selectedRoute]);

  useEffect(() => {
    let result = [...allContainers];
    if (typeFilter) result = result.filter(c => c.type === typeFilter);
    if (sizeFilter) result = result.filter(c => c.size === sizeFilter);
    setFilteredContainers(result);
  }, [typeFilter, sizeFilter, allContainers]);

  const handleToggleContainer = (id) => {
    setSelectedContainers(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  return (
    <div id="containerSelectorBody">
      <h2>Select Containers</h2>

      {selectedRoute && (
        <div style={{ marginBottom: '1em' }}>
          <RouteRow row={selectedRoute} selectedRouteId={selectedRoute.id} onSelect={() => {}} />
        </div>
      )}

      <div className="dividerLine" />

      <div id="containerFilter" className="display-flex-row">
        <label htmlFor="containerType">Type:</label>
        <select
          id="containerType"
          class="white-bottom-border-input"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {typeOptions.map(type => (
            <option key={type.id} value={type.type}>{type.type}</option>
          ))}
        </select>

        <label htmlFor="containerSize">Size:</label>
        <select
          id="containerSize"
          class="white-bottom-border-input"
          value={sizeFilter}
          onChange={(e) => setSizeFilter(e.target.value)}
        >
          <option value="">All sizes</option>
          {containerSizes.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="dividerLine" />

      <div id="containerList">
        {filteredContainers.length === 0 && <p>No containers found.</p>}
        {filteredContainers.map(container => (
          <ContainerItem
            key={container.id}
            row={container}
            selected={selectedContainers.includes(container.id)}
            onToggle={handleToggleContainer}
          />
        ))}
      </div>

      <div style={{ marginTop: '1em' }}>
        <button onClick={onBack} class="transparent-bottom-border-button">Back</button>
        <button onClick={onNext} disabled={selectedContainers.length === 0} class="transparent-bottom-border-button">
          Next
        </button>
      </div>
    </div>
  );
}
