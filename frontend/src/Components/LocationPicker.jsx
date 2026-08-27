import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Locate } from "lucide-react";

// Explicitly define the default marker icon using reliable unpkg URLs
// This avoids React prototype pollution where the icon changes or breaks across different pages
const defaultIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const LocateControl = ({ setPosition }) => {
    const map = useMap();
    const [locating, setLocating] = useState(false);

    const handleLocate = () => {
        setLocating(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setPosition(newPos);
                    map.flyTo([newPos.lat, newPos.lng], 15, { animate: true, duration: 1 });
                    setLocating(false);
                },
                (err) => {
                    console.error("Location access denied", err);
                    setLocating(false);
                }
            );
        } else {
            setLocating(false);
        }
    };

    return (
        <div className="leaflet-bottom leaflet-right" style={{ marginBottom: '20px', marginRight: '10px' }}>
            <div className="leaflet-control leaflet-bar">
                <button 
                    type="button"
                    className="bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm"
                    style={{ width: '34px', height: '34px', cursor: locating ? 'wait' : 'pointer' }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLocate();
                    }}
                    title="Focus on my location"
                >
                    <Locate size={18} className={locating ? "animate-pulse text-blue-500" : "text-gray-700"} />
                </button>
            </div>
        </div>
    );
};

const LocationMarker = ({ position, setPosition }) => {
    const markerRef = useRef(null);
    
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
        dblclick(e) {
            setPosition(e.latlng);
        }
    });

    return !position || position.lat === undefined ? null : (
        <Marker 
            draggable={true}
            eventHandlers={{
                dragend() {
                    const marker = markerRef.current;
                    if (marker != null) {
                        setPosition(marker.getLatLng());
                    }
                },
            }}
            position={position} 
            ref={markerRef}
            icon={defaultIcon}
        />
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
                        // Fallback to default center if geolocation fails so the marker is visible
                        setPosition({ lat: defaultCenter[0], lng: defaultCenter[1] });
                    }
                );
            } else {
                setPosition({ lat: defaultCenter[0], lng: defaultCenter[1] });
            }
        }
    }, []);

    return (
        <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mt-2 z-0 relative">
            <MapContainer
                center={position ? [position.lat, position.lng] : defaultCenter}
                zoom={12}
                scrollWheelZoom={true}
                doubleClickZoom={false}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <LocationMarker position={position} setPosition={setPosition} />
                <LocateControl setPosition={setPosition} />
            </MapContainer>
        </div>
    );
};

export default LocationPicker;
