'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Inline SVG avoids Leaflet's classic broken default-marker-image problem
// under bundlers without adding an external icon asset.
const pinIcon = L.divIcon({
  className: '',
  html: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="#9A8073" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
});

interface SingleBranchMapProps {
  readonly shopName: string;
  readonly branchName: string;
  readonly address: string;
  readonly city: string;
  readonly latitude: number;
  readonly longitude: number;
}

export default function SingleBranchMap({ shopName, branchName, address, city, latitude, longitude }: Readonly<SingleBranchMapProps>) {
  const pos: [number, number] = [latitude, longitude];

  return (
    <div className="rounded-2xl overflow-hidden border border-line" style={{ height: 360 }}>
      <MapContainer center={pos} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={pos} icon={pinIcon}>
          <Popup>
            <strong>{shopName} — {branchName}</strong>
            <br />
            {address}, {city}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
