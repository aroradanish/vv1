'use client';

import { useEffect, useRef } from 'react';
import { Property } from '@/lib/api';
import { coordsFor } from '@/lib/karto';
import { rupees } from '@/lib/utils';

/**
 * Leaflet interactive map (loaded from CDN at runtime, mirroring the original pages).
 * Shows price-bubble markers; clicking a marker calls onSelect.
 */
export default function LeafletMap({
  properties,
  onSelect,
  center,
  zoom = 5,
  focus,
}: {
  properties: Property[];
  onSelect?: (p: Property) => void;
  center?: [number, number];
  zoom?: number;
  focus?: [number, number] | null;
}) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<any[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    // Leaflet is loaded via <Script> in the pages that use the map.
    const L = (window as any).L;
    if (!L || !containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(center || [20.5937, 78.9629], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    } else if (center) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    markersRef.current.forEach((m) => mapRef.current.removeLayer(m));
    markersRef.current = [];
    const bounds: [number, number][] = [];

    properties.forEach((p) => {
      const coords = coordsFor(p.location, p.latitude, p.longitude);
      const mainImg = p.images?.[0] || '/images/paris.webp';

      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div class="price-marker-bubble">${rupees(p.price)}</div>`,
        iconSize: [60, 30],
      });

      const marker = L.marker(coords, { icon })
        .addTo(mapRef.current)
        .bindPopup(
          `<div class="map-popup-card" style="width:100%;text-align:left">
            <img src="${mainImg}" style="width:100%;height:130px;object-fit:cover;display:block" alt="${p.room_type}"/>
            <div style="padding:12px">
              <div style="font-size:14px;font-weight:700;margin-bottom:4px">${p.room_type}</div>
              <div style="font-size:11px;color:#888;margin-bottom:8px">📍 ${p.location}</div>
              <div style="font-size:15px;font-weight:800;color:var(--primary)">${rupees(p.price)} / night</div>
            </div>
          </div>`,
        );

      if (onSelectRef.current) marker.on('click', () => onSelectRef.current?.(p));
      markersRef.current.push(marker);
      bounds.push(coords);
    });

    if (bounds.length > 0 && bounds.length > 1) {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [properties]);

  useEffect(() => {
    if (focus && mapRef.current) {
      mapRef.current.setView(focus, 16);
      const hit = markersRef.current.find(
        (m) => m.getLatLng().lat === focus[0] && m.getLatLng().lng === focus[1],
      );
      if (hit) hit.openPopup();
    }
  }, [focus]);

  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) mapRef.current.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 250);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={containerRef} className="w-full h-full rounded-md border border-line z-[1]" style={{ minHeight: 400 }} />;
}
