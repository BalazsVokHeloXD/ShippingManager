import { useEffect, useState } from 'react';
import Header from '../Header';
import RouteRow from '../user/RouteRow';
import './css/Route.css';

function Route({ adminUsername, role }) {
    const [routes, setRoutes] = useState([]);
    const [selectedRouteId, setSelectedRouteId] = useState(null);

    useEffect(() => {
        fetch('/api/as/routes/all')
            .then(res => res.json())
            .then(data => {
                setRoutes(data);
            })
            .catch(err => {
                console.error("Error fetching routes:", err);
            });
    }, []);

    const handleToggle = (routeId) => {
        setSelectedRouteId(routeId === selectedRouteId ? null : routeId);
    };

    return (
        <div>
            <Header username={adminUsername} onLogout={() => setRoutes([])} role={role} />
            <div id="routeBody">
                <div id="routeDisplay">
                    <div id="routeHeader">
                        <span class="col2">Departure Harbor</span>
                        <span class="col3">Destination Harbor</span>
                        <span>Ship Name</span>
                        <span>Price</span>
                    </div>
                    <div id="routeList">
                        {routes.map((route) => (
                            <RouteRow
                                key={route.id}
                                row={route}
                                selected={selectedRouteId === route.id}
                                onToggle={handleToggle}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Route;