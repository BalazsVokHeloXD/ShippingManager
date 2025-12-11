import { useEffect, useState } from 'react';
import Header from '../Header';
import AdminContainerItem from './AdminContainerItem';
import RouteRow from '../user/RouteRow';
import './css/Container.css';

function Container({ adminUsername, role }) {
  const [containers, setContainers] = useState([]);
  const [originalContainers, setOriginalContainers] = useState([]);
  const [selectedContainerId, setSelectedContainerId] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState('original');
  const [searchQuery, setSearchQuery] = useState('');
  const [relatedRoutes, setRelatedRoutes] = useState([]);

  const fetchContainers = () => {
    fetch('/api/as/containers/all')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setContainers(data);
        setOriginalContainers(data);
        setSelectedContainerId(null);
        setSortKey(null);
        setSortDirection('original');
        setSearchQuery('');
        setRelatedRoutes([]);
      })
      .catch((err) => {
        console.error('Error fetching containers:', err);
        setContainers([]);
        setOriginalContainers([]);
      });
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const handleSelect = (id) => {
    setSelectedContainerId(id);
    if (id) {
      fetch(`/api/as/routes/container/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch routes');
          return res.json();
        })
        .then((routes) => setRelatedRoutes(routes))
        .catch((err) => {
          console.error('Error fetching related routes:', err);
          setRelatedRoutes([]);
        });
    } else {
      setRelatedRoutes([]);
    }
  };

  const handleSort = (key) => {
    let newDirection = 'asc';

    if (sortKey === key) {
      newDirection =
        sortDirection === 'asc'
          ? 'desc'
          : sortDirection === 'desc'
          ? 'original'
          : 'asc';
    }

    setSortKey(key);
    setSortDirection(newDirection);

    if (newDirection === 'original') {
      setContainers(originalContainers);
      return;
    }

    const sorted = [...containers].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      const numericKeys = ['price', 'size'];

      if (numericKeys.includes(key)) {
        return newDirection === 'asc' ? valA - valB : valB - valA;
      }

      return newDirection === 'asc'
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });

    setContainers(sorted);
  };

  const filteredContainers = containers.filter((container) =>
    container.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Header username={adminUsername} onLogout={() => setContainers([])} role={role} />

      <div id="containersBody">
        <div id="containersDisplay">
          <div id="containersListHeader">
            <AdminContainerItem
              header={true}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortClick={handleSort}
            />
          </div>

          <div id="containersList">
            {filteredContainers.map((container) => (
              <AdminContainerItem
                key={container.id}
                row={container}
                selectedId={selectedContainerId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        <div id="containerDetails">
          <div id="containerDetailsFilter">
            <div>
              <label htmlFor="searchContainerName">Search: </label>
              <input
                type="text"
                name="searchContainerName"
                id="searchContainerName"
                placeholder="Name of container"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="transparent-bottom-border-button"
              onClick={fetchContainers}
            >
              Refresh
            </button>
          </div>

          <div id="containerDetailsRoutes">
            {selectedContainerId ? (
              relatedRoutes.length > 0 ? (
                <>
                  <h3>Routes related to this container:</h3>
                  <div>
                    {relatedRoutes.map((route) => (
                      <RouteRow key={route.id} row={route} />
                    ))}
                  </div>
                </>
              ) : (
                <p>This container has no associated routes.</p>
              )
            ) : (
              <p>Select a container to view its routes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Container;