/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useEffect, useRef, useState } from 'react';
import { SupersetClient, getClientErrorObject } from '@superset-ui/core';
import { SupplychainWarehouseProps, WarehouseRecord } from './types';

// Leaflet CSS injected inline to avoid external CSS file dependency
const LEAFLET_CSS = `
.leaflet-pane,.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow,
.leaflet-tile-container,.leaflet-map-pane svg,.leaflet-map-pane canvas,
.leaflet-zoom-box,.leaflet-image-layer,.leaflet-layer{position:absolute;left:0;top:0}
.leaflet-container{overflow:hidden}
.leaflet-tile,.leaflet-marker-icon,.leaflet-marker-shadow{-webkit-user-select:none;-moz-user-select:none;user-select:none;-webkit-user-drag:none}
.leaflet-tile::selection{background:transparent}
.leaflet-tile::-moz-selection{background:transparent}
.leaflet-image-layer,.leaflet-layer{position:absolute}
.leaflet-container.leaflet-touch-zoom{-ms-touch-action:pan-x pan-y;touch-action:pan-x pan-y}
.leaflet-container.leaflet-touch-drag{-ms-touch-action:pinch-zoom;touch-action:pinch-zoom}
.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom{-ms-touch-action:none;touch-action:none}
.leaflet-container{-webkit-tap-highlight-color:transparent}
.leaflet-container a{-webkit-tap-highlight-color:rgba(51,181,229,.4)}
.leaflet-tile{filter:inherit;visibility:hidden}
.leaflet-tile-loaded{visibility:inherit}
.leaflet-zoom-box{width:0;height:0;-moz-box-sizing:border-box;box-sizing:border-box;z-index:800}
.leaflet-overlay-pane svg{-moz-user-select:none}
.leaflet-pane{z-index:400}
.leaflet-tile-pane{z-index:200}
.leaflet-overlay-pane{z-index:400}
.leaflet-shadow-pane{z-index:500}
.leaflet-marker-pane{z-index:600}
.leaflet-tooltip-pane{z-index:650}
.leaflet-popup-pane{z-index:700}
.leaflet-map-pane canvas{z-index:100}
.leaflet-map-pane svg{z-index:200}
.leaflet-vml-shape{width:1px;height:1px}
.lvml{behavior:url(#default#VML);display:inline-block;position:absolute}
.leaflet-control{position:relative;z-index:800;pointer-events:visiblePainted;pointer-events:auto}
.leaflet-top,.leaflet-bottom{position:absolute;z-index:1000;pointer-events:none}
.leaflet-top{top:0}
.leaflet-right{right:0}
.leaflet-bottom{bottom:0}
.leaflet-left{left:0}
.leaflet-control{float:left;clear:both}
.leaflet-right .leaflet-control{float:right}
.leaflet-top .leaflet-control{margin-top:10px}
.leaflet-bottom .leaflet-control{margin-bottom:10px}
.leaflet-left .leaflet-control{margin-left:10px}
.leaflet-right .leaflet-control{margin-right:10px}
.leaflet-fade-anim .leaflet-popup{opacity:0;-webkit-transition:opacity .2s linear;-moz-transition:opacity .2s linear;transition:opacity .2s linear}
.leaflet-fade-anim .leaflet-map-pane .leaflet-popup{opacity:1}
.leaflet-zoom-animated{-webkit-transform-origin:0 0;-ms-transform-origin:0 0;transform-origin:0 0}
svg.leaflet-zoom-animated{will-change:transform}
.leaflet-zoom-anim .leaflet-zoom-animated{-webkit-transition:-webkit-transform .25s cubic-bezier(0,0,.25,1);-moz-transition:-moz-transform .25s cubic-bezier(0,0,.25,1);transition:transform .25s cubic-bezier(0,0,.25,1)}
.leaflet-zoom-anim .leaflet-tile,.leaflet-pan-anim .leaflet-tile{-webkit-transition:none;-moz-transition:none;transition:none}
.leaflet-zoom-anim .leaflet-zoom-animated{will-change:transform}
.leaflet-interactive{cursor:pointer}
.leaflet-grab{cursor:-webkit-grab;cursor:-moz-grab;cursor:grab}
.leaflet-crosshair,.leaflet-crosshair .leaflet-interactive{cursor:crosshair}
.leaflet-popup-pane,.leaflet-control{cursor:auto}
.leaflet-dragging .leaflet-grab,.leaflet-dragging .leaflet-grab .leaflet-interactive,.leaflet-dragging .leaflet-marker-draggable{cursor:move;cursor:-webkit-grabbing;cursor:-moz-grabbing;cursor:grabbing}
.leaflet-marker-icon,.leaflet-marker-shadow,.leaflet-image-layer,.leaflet-pane > svg path,.leaflet-tile-container{pointer-events:none}
.leaflet-marker-icon.leaflet-interactive,.leaflet-image-layer.leaflet-interactive,.leaflet-pane > svg path.leaflet-interactive,svg.leaflet-image-layer.leaflet-interactive path{pointer-events:visiblePainted;pointer-events:auto}
.leaflet-container{background:#ddd;outline-offset:1px}
.leaflet-container a.leaflet-active{outline:2px solid orange}
.leaflet-zoom-box{border:2px dotted #38f;background:rgba(255,255,255,.5)}
.leaflet-container{font-family:Helvetica Neue,Arial,Helvetica,sans-serif;font-size:.75rem;font-size:12px;line-height:1.5}
.leaflet-bar{box-shadow:0 1px 5px rgba(0,0,0,.65);border-radius:4px}
.leaflet-bar a{background-color:#fff;border-bottom:1px solid #ccc;width:26px;height:26px;line-height:26px;display:block;text-align:center;text-decoration:none;color:black}
.leaflet-bar a,.leaflet-control-layers-toggle{background-position:50% 50%;background-repeat:no-repeat;display:block}
.leaflet-bar a:hover,.leaflet-bar a:focus{background-color:#f4f4f4}
.leaflet-bar a:first-child{border-top-left-radius:4px;border-top-right-radius:4px}
.leaflet-bar a:last-child{border-bottom-left-radius:4px;border-bottom-right-radius:4px;border-bottom:none}
.leaflet-bar a.leaflet-disabled{cursor:default;background-color:#f4f4f4;color:#bbb}
.leaflet-touch .leaflet-bar a{width:30px;height:30px;line-height:30px}
.leaflet-touch .leaflet-bar a:first-child{border-top-left-radius:2px;border-top-right-radius:2px}
.leaflet-touch .leaflet-bar a:last-child{border-bottom-left-radius:2px;border-bottom-right-radius:2px}
.leaflet-control-zoom-in,.leaflet-control-zoom-out{font:bold 18px 'Lucida Console',Monaco,monospace;text-indent:1px}
.leaflet-touch .leaflet-control-zoom-in{font-size:22px}
.leaflet-touch .leaflet-control-zoom-out{font-size:20px}
.leaflet-control-layers{box-shadow:0 1px 5px rgba(0,0,0,.4);background:#fff;border-radius:5px}
.leaflet-control-layers-toggle{background-image:url(data:image/png;base64,...);width:36px;height:36px}
.leaflet-retina .leaflet-control-layers-toggle{background-size:26px 26px}
.leaflet-touch .leaflet-control-layers-toggle{width:44px;height:44px}
.leaflet-control-layers .leaflet-control-layers-list,.leaflet-control-layers-expanded .leaflet-control-layers-toggle{display:none}
.leaflet-control-layers-expanded .leaflet-control-layers-list{display:block;position:relative}
.leaflet-control-layers-expanded{padding:6px 10px 6px 6px;color:#333;background:#fff}
.leaflet-control-layers-scrollbar{overflow-y:scroll;overflow-x:hidden;padding-right:5px}
.leaflet-control-layers-selector{margin-top:2px;position:relative;top:1px}
.leaflet-control-layers label{display:block;font-size:1.08333em}
.leaflet-control-layers-separator{height:0;border-top:1px solid #ddd;margin:5px -10px 5px -6px}
.leaflet-default-icon-path{background-image:url(data:image/png;base64,...)}
.leaflet-container .leaflet-control-attribution{background:#fff;background:rgba(255,255,255,.8);margin:0}
.leaflet-control-attribution,.leaflet-control-scale-line{padding:0 5px;color:#333;line-height:1.4}
.leaflet-control-attribution a{text-decoration:none}
.leaflet-control-attribution a:hover,.leaflet-control-attribution a:focus{text-decoration:underline}
.leaflet-attribution-flag{display:inline!important;vertical-align:baseline!important;width:1em;height:.6669em}
.leaflet-left .leaflet-control-scale{margin-left:5px}
.leaflet-bottom .leaflet-control-scale{margin-bottom:5px}
.leaflet-control-scale-line{border:2px solid #777;border-top:none;line-height:1.1;padding:2px 5px 1px;font-size:11px;white-space:nowrap;overflow:hidden;-moz-box-sizing:border-box;box-sizing:border-box;background:#fff;background:rgba(255,255,255,.5)}
.leaflet-control-scale-line:not(:first-child){border-top:2px solid #777;border-bottom:none;margin-top:-2px}
.leaflet-control-scale-line:not(:first-child):not(:last-child){border-bottom:2px solid #777}
.leaflet-touch .leaflet-control-attribution,.leaflet-touch .leaflet-control-layers,.leaflet-touch .leaflet-bar{box-shadow:none}
.leaflet-touch .leaflet-control-layers,.leaflet-touch .leaflet-bar{border:2px solid rgba(0,0,0,.2);background-clip:padding-box}
.leaflet-popup{position:absolute;text-align:center;margin-bottom:20px}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{background:#fff;color:#333;box-shadow:0 3px 14px rgba(0,0,0,.4)}
.leaflet-popup-content-wrapper{padding:1px;text-align:left;border-radius:12px}
.leaflet-popup-tip-container{width:40px;height:20px;position:absolute;left:50%;margin-left:-20px;overflow:hidden;pointer-events:none}
.leaflet-popup-tip{width:17px;height:17px;padding:1px;margin:-10px auto 0;-webkit-transform:rotate(45deg);-moz-transform:rotate(45deg);-ms-transform:rotate(45deg);transform:rotate(45deg)}
.leaflet-popup-content-wrapper,.leaflet-popup-tip{pointer-events:auto}
.leaflet-popup-content{margin:13px 24px 13px 20px;line-height:1.3;font-size:1.08333em}
.leaflet-popup-content p{margin:17px 0}
.leaflet-popup-close-button{position:absolute;top:0;right:0;border:none;text-align:center;width:24px;height:24px;font:16px/24px Tahoma,Verdana,sans-serif;color:#757575;text-decoration:none;background:transparent}
.leaflet-popup-close-button:hover,.leaflet-popup-close-button:focus{color:#585858}
.leaflet-popup-scrolled{overflow:auto;border-bottom:1px solid #ddd;border-top:1px solid #ddd}
.leaflet-oldie .leaflet-popup-content-wrapper{-ms-zoom:1}
.leaflet-oldie .leaflet-popup-tip{width:24px;-ms-filter:"progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)";filter:progid:DXImageTransform.Microsoft.Matrix(M11=0.70710678, M12=0.70710678, M21=-0.70710678, M22=0.70710678)}
.leaflet-oldie .leaflet-popup-tip-container{margin-top:-1px}
.leaflet-oldie .leaflet-control-zoom,.leaflet-oldie .leaflet-control-layers,.leaflet-oldie .leaflet-popup-content-wrapper,.leaflet-oldie .leaflet-popup-tip{border:1px solid #999}
.leaflet-div-icon{background:#fff;border:1px solid #666}
.leaflet-tooltip{position:absolute;padding:6px;background-color:#fff;border:1px solid #fff;border-radius:3px;color:#222;white-space:nowrap;-webkit-user-select:none;-moz-user-select:none;user-select:none;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.leaflet-tooltip.leaflet-interactive{cursor:pointer;pointer-events:auto}
.leaflet-tooltip-top:before,.leaflet-tooltip-bottom:before,.leaflet-tooltip-left:before,.leaflet-tooltip-right:before{position:absolute;pointer-events:none;border:6px solid transparent;background:transparent;content:""}
.leaflet-tooltip-bottom{margin-top:6px}
.leaflet-tooltip-top{margin-top:-6px}
.leaflet-tooltip-bubble{margin:0}
.leaflet-tooltip-bottom:before,.leaflet-tooltip-top:before{left:50%;margin-left:-6px}
.leaflet-tooltip-top:before{bottom:0;margin-bottom:-12px;border-top-color:#fff}
.leaflet-tooltip-bottom:before{top:0;margin-top:-12px;margin-left:-6px;border-bottom-color:#fff}
.leaflet-tooltip-left:before{right:0;margin-right:-12px;top:50%;margin-top:-6px;border-left-color:#fff}
.leaflet-tooltip-right:before{left:0;margin-left:-12px;top:50%;margin-top:-6px;border-right-color:#fff}
`;

const WAREHOUSE_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48">
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
  </filter>
  <g filter="url(#shadow)">
    <polygon points="20,2 38,14 38,42 2,42 2,14" fill="#1890ff" stroke="#fff" stroke-width="1.5"/>
    <polygon points="20,2 38,14 20,14" fill="#096dd9"/>
    <polygon points="20,2 2,14 20,14" fill="#40a9ff"/>
    <rect x="8" y="22" width="10" height="20" fill="#fff" opacity="0.9"/>
    <rect x="22" y="22" width="10" height="12" fill="#fff" opacity="0.9"/>
    <rect x="24" y="24" width="2" height="4" fill="#1890ff" opacity="0.6"/>
    <rect x="28" y="24" width="2" height="4" fill="#1890ff" opacity="0.6"/>
  </g>
  <polygon points="20,44 16,42 24,42" fill="#1890ff"/>
</svg>
`;

const WAREHOUSE_ICON_SVG_EDITING = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48">
  <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.5"/>
  </filter>
  <g filter="url(#shadow2)">
    <polygon points="20,2 38,14 38,42 2,42 2,14" fill="#fa8c16" stroke="#fff" stroke-width="1.5"/>
    <polygon points="20,2 38,14 20,14" fill="#d46b08"/>
    <polygon points="20,2 2,14 20,14" fill="#ffc069"/>
    <rect x="8" y="22" width="10" height="20" fill="#fff" opacity="0.9"/>
    <rect x="22" y="22" width="10" height="12" fill="#fff" opacity="0.9"/>
    <rect x="24" y="24" width="2" height="4" fill="#fa8c16" opacity="0.6"/>
    <rect x="28" y="24" width="2" height="4" fill="#fa8c16" opacity="0.6"/>
  </g>
  <polygon points="20,44 16,42 24,42" fill="#fa8c16"/>
</svg>
`;

// Geocode an address using Nominatim (OpenStreetMap)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const response = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'SupplychainWarehousePlugin/1.0' },
  });
  if (!response.ok) throw new Error(`Geocoding failed: ${response.statusText}`);
  const results = await response.json() as Array<{ lat: string; lon: string }>;
  if (results.length === 0) throw new Error('Address not found');
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

// Reverse geocode coordinates to address using Nominatim
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'SupplychainWarehousePlugin/1.0' },
  });
  if (!response.ok) return '';
  const result = await response.json() as { display_name?: string };
  return result.display_name || '';
}

export default function SupplychainWarehouse(props: SupplychainWarehouseProps) {
  const { data, height, width, databaseId, tableName } = props;

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const styleInjected = useRef(false);

  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>(data);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ address: string; latitude: string; longitude: string }>({
    address: '',
    latitude: '',
    longitude: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Inject Leaflet CSS once
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const style = document.createElement('style');
    style.textContent = LEAFLET_CSS;
    document.head.appendChild(style);
  }, []);

  // Initialise the Leaflet map once the container is mounted
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // Dynamic import to avoid SSR issues
    import('leaflet').then(mod => {
      const L = ((mod as any).default as typeof import('leaflet')) || mod;
      if (!mapRef.current || leafletMap.current) return;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([20, 0], 2);
      leafletMap.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      renderMarkers(L, map, warehouses);
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markersRef.current.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when warehouses change
  useEffect(() => {
    import('leaflet').then(mod => {
      const L = ((mod as any).default as typeof import('leaflet')) || mod;
      if (!leafletMap.current) return;
      renderMarkers(L, leafletMap.current, warehouses);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses, editingId]);

  function buildIcon(L: typeof import('leaflet'), isEditing: boolean): L.DivIcon {
    return L.divIcon({
      html: isEditing ? WAREHOUSE_ICON_SVG_EDITING : WAREHOUSE_ICON_SVG,
      iconSize: [40, 48],
      iconAnchor: [20, 44],
      popupAnchor: [0, -44],
      tooltipAnchor: [20, -28],
      className: '',
    });
  }

  function renderMarkers(L: typeof import('leaflet'), map: L.Map, whs: WarehouseRecord[]) {
    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const bounds: [number, number][] = [];

    whs.forEach(wh => {
      if (!isValidCoord(wh.latitude, wh.longitude)) return;

      const isEditing = editingId === wh.id;
      const marker = L.marker([wh.latitude, wh.longitude], {
        icon: buildIcon(L, isEditing),
        draggable: isEditing,
        title: wh.name,
      });

      marker.bindTooltip(wh.name, { permanent: true, direction: 'right', offset: [8, -20] });
      marker.bindPopup(`
        <strong>${wh.name}</strong><br/>
        ${wh.address}<br/>
        <em>Stock: ${wh.stock_size.toLocaleString()} units</em><br/>
        <small>📍 ${wh.latitude.toFixed(4)}, ${wh.longitude.toFixed(4)}</small>
      `);

      marker.on('click', () => startEdit(wh));

      if (isEditing) {
        marker.on('dragend', (e: L.LeafletEvent) => {
          const dragEvent = e as L.DragEndEvent;
          const { lat, lng } = dragEvent.target.getLatLng();
          setEditForm(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
          }));
          reverseGeocode(lat, lng).then(addr => {
            if (addr) setEditForm(prev => ({ ...prev, address: addr }));
          });
        });
      }

      marker.addTo(map);
      markersRef.current.set(wh.id, marker);
      bounds.push([wh.latitude, wh.longitude]);
    });

    if (bounds.length > 0 && !editingId) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      } catch (_) {
        // ignore fitBounds errors on empty bounds
      }
    }
  }

  function isValidCoord(lat: number, lng: number): boolean {
    return typeof lat === 'number' && typeof lng === 'number' &&
      !isNaN(lat) && !isNaN(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  function startEdit(wh: WarehouseRecord) {
    setEditingId(wh.id);
    setEditForm({
      address: wh.address,
      latitude: String(wh.latitude),
      longitude: String(wh.longitude),
    });
    setStatusMsg('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ address: '', latitude: '', longitude: '' });
    setStatusMsg('');
    // Restore original warehouse positions
    setWarehouses(prev => [...prev]);
  }

  async function handleGeocode() {
    if (!editForm.address.trim()) return;
    setIsLoading(true);
    setStatusMsg('');
    try {
      const { lat, lng } = await geocodeAddress(editForm.address);
      setEditForm(prev => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
      // Move marker on map preview
      if (editingId !== null && leafletMap.current) {
        const marker = markersRef.current.get(editingId);
        if (marker) {
          marker.setLatLng([lat, lng]);
          leafletMap.current.panTo([lat, lng]);
        }
      }
      setStatusMsg('✅ Address geocoded');
    } catch (err) {
      setStatusMsg(`❌ ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (editingId === null) return;
    const lat = parseFloat(editForm.latitude);
    const lng = parseFloat(editForm.longitude);

    if (!isValidCoord(lat, lng)) {
      setStatusMsg('❌ Invalid coordinates');
      return;
    }

    setIsLoading(true);
    setStatusMsg('');

    const sanitizedAddress = editForm.address.replace(/'/g, "''");
    const sql = `UPDATE ${tableName} SET latitude = ${lat}, longitude = ${lng}, address = '${sanitizedAddress}' WHERE id = ${editingId}`;

    try {
      // Mirror exactly what sqlLab.js does: body + Content-Type header + parseMethod
      const { json } = await (SupersetClient as any).post({
        endpoint: '/api/v1/sqllab/execute/',
        body: JSON.stringify({
          database_id: Number(databaseId),
          sql,
          client_id: `wh-update-${editingId}-${Date.now()}`,
          json: true,
          runAsync: false,
          schema: null,
          expand_data: true,
        }),
        headers: { 'Content-Type': 'application/json' },
        parseMethod: 'json-bigint',
      });

      // Superset can return HTTP 200 but with an error status in the JSON body
      if (json?.status === 'error' || json?.error) {
        const errMsg = json.error || json.message || 'SQL execution failed';
        setStatusMsg(`❌ Update failed: ${errMsg}`);
        return;
      }

      setWarehouses(prev =>
        prev.map(wh =>
          wh.id === editingId
            ? { ...wh, latitude: lat, longitude: lng, address: editForm.address }
            : wh,
        ),
      );
      setStatusMsg('✅ Warehouse updated');
      setEditingId(null);
    } catch (response: unknown) {
      // Use getClientErrorObject — same pattern as sqlLab.js line 364
      console.error('[SupplychainWarehouse] Save failed (raw):', response);
      getClientErrorObject(response as any).then(error => {
        const msg =
          error.error ||
          error.message ||
          error.statusText ||
          JSON.stringify(response);
        const dmlHint =
          msg.includes('DML') || msg.includes('DDL') || msg.includes('read-only')
            ? ' 💡 Fix: Settings → Database Connections → Edit DB_supply → Advanced → Security → ☑ Allow DML'
            : '';
        setStatusMsg(`❌ Update failed: ${msg}${dmlHint}`);
      }).catch(() => {
        setStatusMsg(`❌ Update failed: ${String(response)}`);
      });
    } finally {
      setIsLoading(false);
    }
  }

  const editingWarehouse = warehouses.find(w => w.id === editingId);
  const mapHeight = editingId !== null ? height - 180 : height;

  return (
    <div style={{ width, height, display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      {/* Map container */}
      <div ref={mapRef} style={{ width: '100%', height: mapHeight, flexShrink: 0 }} />

      {/* Edit panel */}
      {editingId !== null && editingWarehouse && (
        <div
          style={{
            padding: '10px 14px',
            background: '#fff',
            borderTop: '2px solid #1890ff',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: 13, color: '#1890ff' }}>
            ✏️ {editingWarehouse.name}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="text"
              value={editForm.address}
              onChange={e => { const v = e.target.value; setEditForm(prev => ({ ...prev, address: v })); }}
              placeholder="Address"
              style={{ flex: 1, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 12 }}
            />
            <button
              onClick={handleGeocode}
              disabled={isLoading}
              style={btnStyle('#52c41a')}
            >
              📍 Geocode
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <label style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>Lat:</label>
            <input
              type="number"
              value={editForm.latitude}
              onChange={e => { const v = e.target.value; setEditForm(prev => ({ ...prev, latitude: v })); }}
              step="0.0001"
              style={{ width: 110, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 12 }}
            />
            <label style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>Lng:</label>
            <input
              type="number"
              value={editForm.longitude}
              onChange={e => { const v = e.target.value; setEditForm(prev => ({ ...prev, longitude: v })); }}
              step="0.0001"
              style={{ width: 110, padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 12 }}
            />
            <button onClick={handleSave} disabled={isLoading} style={btnStyle('#1890ff')}>
              💾 Save
            </button>
            <button onClick={cancelEdit} disabled={isLoading} style={btnStyle('#d9d9d9', '#333')}>
              ✕ Cancel
            </button>
            {statusMsg && (
              <span style={{ fontSize: 12, color: statusMsg.startsWith('✅') ? '#52c41a' : '#f5222d' }}>
                {statusMsg}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg: string, color = '#fff'): React.CSSProperties {
  return {
    padding: '4px 10px',
    background: bg,
    color,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 12,
    whiteSpace: 'nowrap',
  };
}
