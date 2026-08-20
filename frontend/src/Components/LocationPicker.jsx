import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

const LocationPicker = ({ position, setPosition }) => {
    const defaultCenter = [33.6844, 73.0479]; // Islamabad as default

    useEffect(() => {
        if (!position) {
            // Attempt to get user location
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    },
                    (err) => {
                        console.error("Location access denied", err);
                    }
                );
            }
        }
    }, [position, setPosition]);

    return (
        <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mt-2 z-0 relative">
            <MapContainer
                center={position ? [position.lat, position.lng] : defaultCenter}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
        </div>
    );
};

export default LocationPicker;
