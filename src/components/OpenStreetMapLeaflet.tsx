import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Sparkles, MapPin, ExternalLink } from 'lucide-react';

export interface MapMarkerItem {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  type: 'destination' | 'hotel' | 'restaurant';
  rating?: number;
  image?: string;
  subtitle?: string;
  price?: number;
}

interface OpenStreetMapLeafletProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarkerItem[];
  routeLine?: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
  } | null;
  onPlanTrip?: (name: string) => void;
  className?: string;
}

export const OpenStreetMapLeaflet: React.FC<OpenStreetMapLeafletProps> = ({
  center = { lat: 20.5937, lng: 78.9629 },
  zoom = 5,
  markers = [],
  routeLine = null,
  onPlanTrip,
  className = 'w-full h-full',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Center / Zoom
  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center.lat, center.lng, zoom]);

  // Render Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    markers.forEach((m) => {
      const bg = m.type === 'destination' ? '#E11D48' : m.type === 'hotel' ? '#2563EB' : '#D97706';
      const emoji = m.type === 'destination' ? '🏝️' : m.type === 'hotel' ? '🏨' : '🍽️';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${bg};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            font-size: 14px;
            cursor: pointer;
          ">
            ${emoji}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const leafletMarker = L.marker([m.position.lat, m.position.lng], { icon: customIcon });

      // Popup Content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 font-sans text-slate-900 max-w-[200px]';

      let popupHtml = `
        <div style="font-family: system-ui, sans-serif;">
          ${m.image ? `<img src="${m.image}" style="width:100%; height:80px; object-fit:cover; border-radius:8px; margin-bottom:6px;" />` : ''}
          <div style="display:flex; justify-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size:13px; font-weight:700;">${m.name}</strong>
            ${m.rating ? `<span style="font-size:11px; font-weight:bold; color:#D97706;">⭐ ${m.rating}</span>` : ''}
          </div>
          ${m.subtitle ? `<p style="font-size:11px; color:#475569; margin:0 0 6px 0; line-height:1.3;">${m.subtitle}</p>` : ''}
          ${m.price ? `<p style="font-size:11px; font-weight:bold; color:#1E3A8A; margin:0 0 6px 0;">₹${m.price.toLocaleString('en-IN')}</p>` : ''}
        </div>
      `;

      popupDiv.innerHTML = popupHtml;

      if (onPlanTrip) {
        const btn = document.createElement('button');
        btn.innerText = '✨ Plan AI Trip';
        btn.style.cssText = `
          width: 100%;
          padding: 5px;
          background: #1E3A8A;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 4px;
        `;
        btn.onclick = () => onPlanTrip(m.name);
        popupDiv.appendChild(btn);
      }

      leafletMarker.bindPopup(popupDiv);
      markersLayerRef.current?.addLayer(leafletMarker);
    });
  }, [markers, onPlanTrip]);

  // Render Route Polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (routeLine) {
      const latlngs: L.LatLngExpression[] = [
        [routeLine.origin.lat, routeLine.origin.lng],
        [routeLine.destination.lat, routeLine.destination.lng],
      ];

      const polyline = L.polyline(latlngs, {
        color: '#E11D48',
        weight: 4,
        dashArray: '8, 8',
      }).addTo(mapRef.current);

      routePolylineRef.current = polyline;
      mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [routeLine]);

  return <div ref={containerRef} className={className} />;
};
