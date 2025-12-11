import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import History from './History';

function Home({ username, setUsername, role }) {
  return (
    <div>
      <Header username={username} onLogout={() => setUsername('')} role={role} />
      <History />
    </div>
  );
}

export default Home;