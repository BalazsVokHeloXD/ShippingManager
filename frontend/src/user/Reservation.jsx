import React, { useState, useEffect } from 'react';
import Header from '../Header';
import RouteSelector from './RouteSelector';
import ContainerSelector from './ContainerSelector';
import Summary from './SummaryReservation';
import './css/Reservation.css';

export default function Reservation({ username, setUsername }) {
  const [step, setStep] = useState(1);

  const [filters, setFilters] = useState({
    depContinent: '',
    depCountry: '',
    depHarbor: '',
    arrContinent: '',
    arrCountry: '',
    arrHarbor: ''
  });
  const [options, setOptions] = useState({
    continents: [],
    countries: [],
    harbors: []
  });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedContainers, setSelectedContainers] = useState([]);
  

  useEffect(() => {
    fetch('/api/rs/filters')
      .then(res => res.json())
      .then(data => {
        setOptions({
          continents: data.continents,
          countries: data.countries,
          harbors: data.harbors
        });
      })
      .catch(err => console.error('Failed to load filter options:', err));
  }, []);

  return (
    <div>
      <Header username={username} onLogout={() => setUsername('')} />
      <div id="reservationPage">
        {step === 1 && (
          <RouteSelector
            filters={filters}
            setFilters={setFilters}
            options={options}
            selectedRoute={selectedRoute}
            setSelectedRoute={setSelectedRoute}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <ContainerSelector
            selectedRoute={selectedRoute}
            selectedContainers={selectedContainers}
            setSelectedContainers={setSelectedContainers}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <Summary
            selectedRoute={selectedRoute}
            selectedContainers={selectedContainers}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}