import React, { useEffect, useState } from 'react';

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

export default function RouteRow({ row, selectedRouteId, onSelect }) {
  const [departureFlagUrl, setDepartureFlagUrl] = useState('');
  const [arrivalFlagUrl, setArrivalFlagUrl] = useState('');

  useEffect(() => {
    getFlag(row.departure_flag).then(setDepartureFlagUrl);
    getFlag(row.destination_flag).then(setArrivalFlagUrl);
  }, [row.departure_flag, row.destination_flag]);

  const isSelected = Number(selectedRouteId) === Number(row.id);
  return (
    <div
      className={`display-flex-row route-row ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(row)}
      style={{ cursor: 'pointer' }}
    >
      <div className="col2 display-flex-row">
        <div className="img-container">
          <img src={departureFlagUrl} alt="" />
        </div>
        <div className="harborname-container">{row.departure_harbor}</div>
        <div className="date-container">{formatDate(row.departure_time)}</div>
      </div>
      <div className="col3 display-flex-row">
        <div className="img-container">
          <img src={arrivalFlagUrl} alt="" />
        </div>
        <div className="harborname-container">{row.destination_harbor}</div>
        <div className="date-container">{formatDate(row.arrival_time)}</div>
      </div>
      <div className="col4">{row.shipname}</div>
      <div className="col5">{row.price.toFixed(0)}€</div>
    </div>
  );
}
