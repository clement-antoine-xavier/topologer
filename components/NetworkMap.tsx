'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Import Leaflet dynamically to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface Router {
  id: string;
  ipAddress: string;
  hostname: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  totalLinks: number;
}

interface Link {
  id: string;
  sequence: number;
  rtt: number | null;
  source: {
    id: string;
    ipAddress: string;
    latitude: number;
    longitude: number;
  };
  destination: {
    id: string;
    ipAddress: string;
    latitude: number;
    longitude: number;
  };
}

interface MapData {
  success: boolean;
  routers: Router[];
  links: Link[];
}

export default function NetworkMap() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMapData() {
      try {
        const response = await fetch('/api/map');
        const data = await response.json();
        
        if (data.success) {
          setMapData(data);
        } else {
          setError(data.error || 'Failed to load map data');
        }
      } catch (err) {
        setError('Failed to fetch map data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchMapData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMapData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!mapData || mapData.routers.length === 0) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">No network data yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Run a traceroute to start mapping the network topology
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Draw links first so they appear under routers */}
        {mapData.links.map((link) => (
          <Polyline
            key={link.id}
            positions={[
              [link.source.latitude, link.source.longitude],
              [link.destination.latitude, link.destination.longitude],
            ]}
            pathOptions={{
              color: '#3b82f6',
              weight: 2,
              opacity: 0.6,
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>Link #{link.sequence}</strong>
                <br />
                From: {link.source.ipAddress}
                <br />
                To: {link.destination.ipAddress}
                {link.rtt && (
                  <>
                    <br />
                    RTT: {link.rtt.toFixed(2)} ms
                  </>
                )}
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Draw routers */}
        {mapData.routers.map((router) => {
          // Size marker based on number of links
          const radius = Math.min(3 + router.totalLinks * 0.5, 15);
          
          return (
            <CircleMarker
              key={router.id}
              center={[router.latitude, router.longitude]}
              radius={radius}
              pathOptions={{
                fillColor: '#ef4444',
                color: '#dc2626',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{router.hostname || router.ipAddress}</strong>
                  {router.hostname && (
                    <>
                      <br />
                      IP: {router.ipAddress}
                    </>
                  )}
                  <br />
                  Location: {[router.city, router.region, router.country]
                    .filter(Boolean)
                    .join(', ')}
                  <br />
                  Links: {router.totalLinks}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
