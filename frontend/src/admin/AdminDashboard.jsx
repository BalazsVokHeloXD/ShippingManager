import Header from "../Header";

export default function AdminDashboard({ adminUsername, setAdminUsername, role }) {
  const handleLogout = () => {
    setAdminUsername("");
  };

  return (
    <div>
      <Header username={adminUsername} role={role} onLogout={handleLogout} />
      <h1>Welcome Admin: {adminUsername}</h1>
    </div>
  );
}