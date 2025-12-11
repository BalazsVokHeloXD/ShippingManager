import { useEffect, useState, useMemo } from "react";
import Header from "../Header";
import bcrypt from "bcryptjs";
import "./css/Administrator.css";

function AdministratorItem({ admin, allPages, onSaveSuccess, loggedInUsername }) {
  const originalPermKeys = useMemo(
    () => new Set(admin.permissions.map((p) => p.pageKey)),
    [admin.permissions]
  );
  const [localPermKeys, setLocalPermKeys] = useState(originalPermKeys);
  const [saving, setSaving] = useState(false);

  const isSelf = admin.username === loggedInUsername;
  console.log(admin.username);
  console.log(loggedInUsername);
  const unsavedChanges = useMemo(() => {
    if (originalPermKeys.size !== localPermKeys.size) return true;
    for (const key of localPermKeys) {
      if (!originalPermKeys.has(key)) return true;
    }
    return false;
  }, [localPermKeys, originalPermKeys]);

  const togglePermission = (pageKey) => {
    if (isSelf) return; 
    setLocalPermKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageKey)) {
        newSet.delete(pageKey);
      } else {
        newSet.add(pageKey);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (isSelf) return; 
    setSaving(true);
    try {
      const res = await fetch(
        `/api/as/admins/${encodeURIComponent(admin.username)}/permissions`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: Array.from(localPermKeys) }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save permissions");
      }

      onSaveSuccess(admin.username, Array.from(localPermKeys));
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="administrator-item">
      <span className="adminUsername">{admin.username}</span>
      <div className="permissions-list">
        {allPages.map((page) => (
          <label key={page.page_key} className="permission-label">
            <input
              type="checkbox"
              checked={localPermKeys.has(page.page_key)}
              onChange={() => togglePermission(page.page_key)}
              disabled={isSelf} 
            />{" "}
            {page.page_name}
          </label>
        ))}
      </div>
      {unsavedChanges && !isSelf && ( 
        <button className="save-button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      )}
    </div>
  );
}


function NewAdministratorItem({ allPages, onCancel, onCreateSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localPermKeys, setLocalPermKeys] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const togglePermission = (pageKey) => {
    setLocalPermKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pageKey)) {
        newSet.delete(pageKey);
      } else {
        newSet.add(pageKey);
      }
      return newSet;
    });
  };

  const handleCreate = async () => {
    if (!username.trim() || !password) {
      alert("Username and password are required");
      return;
    }

    setSaving(true);

    try {
      
      const res = await fetch(`/api/as/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          passwordAgain: confirmPassword,
          permissions: Array.from(localPermKeys),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create admin");
      }

      onCreateSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="administrator-item new-admin-item">
      <input
        type="text"
        className="adminUsernameInput"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <div className="permissions-list">
        {allPages.map((page) => (
          <label key={page.page_key} className="permission-label">
            <input
              type="checkbox"
              checked={localPermKeys.has(page.page_key)}
              onChange={() => togglePermission(page.page_key)}
            />{" "}
            {page.page_name}
          </label>
        ))}
      </div>
      <input
        type="password"
        className="adminPasswordInput"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        className="adminPasswordInput"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <div class="display-flex-row">
        <button className="save-button" onClick={handleCreate} disabled={saving}>
          {saving ? "Creating..." : "Create"}
        </button>
        <button className="cancel-button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Administrator({ adminUsername, role }) {
  const [admins, setAdmins] = useState([]);
  const [allPages, setAllPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAdminActive, setNewAdminActive] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [adminsRes, pagesRes] = await Promise.all([
          fetch("/api/as/admins"),
          fetch("/api/as/admin-pages"),
        ]);

        if (!adminsRes.ok || !pagesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const adminsData = await adminsRes.json();
        const pagesData = await pagesRes.json();

        setAdmins(adminsData);
        setAllPages(pagesData);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSaveSuccess = (username, newPermKeys) => {
    setAdmins((prevAdmins) =>
      prevAdmins.map((admin) =>
        admin.username === username
          ? {
              ...admin,
              permissions: allPages
                .filter((page) => newPermKeys.includes(page.page_key))
                .map((p) => ({ pageKey: p.page_key, pageName: p.page_name })),
            }
          : admin
      )
    );
  };

  const handleCreateSuccess = () => {
    setNewAdminActive(false);
    setLoading(true);
    fetch("/api/as/admins")
      .then((res) => res.json())
      .then((data) => {
        setAdmins(data);
      })
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <Header username={adminUsername} onLogout={() => {}} role={role} />
      <div id="administratorBody">
        <div id="administratorActions">
          <button class="transparent-bottom-border-button" disabled={newAdminActive} onClick={() => setNewAdminActive(true)}>
            New Administrator
          </button>
        </div>
        <div id="administratorData">
          {loading && <p>Loading admins...</p>}
          {!loading && newAdminActive && (
            <NewAdministratorItem
              allPages={allPages}
              onCancel={() => setNewAdminActive(false)}
              onCreateSuccess={handleCreateSuccess}
            />
          )}
          {!loading && admins.length === 0 && <p>No administrators found.</p>}
          {!loading &&
            admins.map((admin) => (
              <AdministratorItem
                key={admin.username}
                admin={admin}
                allPages={allPages}
                onSaveSuccess={handleSaveSuccess}
                loggedInUsername={adminUsername}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

export default Administrator;