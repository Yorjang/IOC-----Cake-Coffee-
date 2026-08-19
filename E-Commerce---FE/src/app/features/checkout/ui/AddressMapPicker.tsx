import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, MapPinned, Pencil } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DeliveryCoordinates } from "../types";

interface AddressMapPickerProps {
  address: string;
  coordinates: DeliveryCoordinates | null;
  isGeocoding: boolean;
  onCoordinatesChange: (coordinates: DeliveryCoordinates) => void;
}

interface LeafletMapProps {
  coordinates: DeliveryCoordinates;
  draggable?: boolean;
  onChange?: (coordinates: DeliveryCoordinates) => void;
}

const markerIcon = L.divIcon({
  className: "address-map-marker",
  html: '<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#ef4d2d;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);transform:rotate(-45deg)"></div>',
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

function LeafletMap({ coordinates, draggable = false, onChange }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const position: L.LatLngExpression = [coordinates.latitude, coordinates.longitude];
    const map = L.map(containerRef.current, { zoomControl: draggable, dragging: draggable, scrollWheelZoom: draggable }).setView(position, draggable ? 17 : 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    const marker = L.marker(position, { icon: markerIcon, draggable }).addTo(map);
    if (draggable) {
      marker.on("dragend", () => {
        const point = marker.getLatLng();
        onChangeRef.current?.({ latitude: point.lat, longitude: point.lng });
      });
      map.on("click", event => {
        marker.setLatLng(event.latlng);
        onChangeRef.current?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
      });
    }
    mapRef.current = map;
    markerRef.current = marker;
    window.setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [draggable]);

  useEffect(() => {
    const position: L.LatLngExpression = [coordinates.latitude, coordinates.longitude];
    markerRef.current?.setLatLng(position);
    mapRef.current?.panTo(position);
  }, [coordinates.latitude, coordinates.longitude]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export function AddressMapPicker(props: AddressMapPickerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftCoordinates, setDraftCoordinates] = useState<DeliveryCoordinates | null>(props.coordinates);

  useEffect(() => setDraftCoordinates(props.coordinates), [props.coordinates]);

  if (props.isGeocoding) {
    return <div className="flex h-36 items-center justify-center gap-2 rounded-xl border bg-muted/30 text-xs text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Đang tìm vị trí trên bản đồ...</div>;
  }
  if (!props.coordinates) return null;

  const confirmPosition = () => {
    if (draftCoordinates) props.onCoordinatesChange(draftCoordinates);
    setIsEditing(false);
  };

  return (
    <>
      <div className="isolate overflow-hidden rounded-xl border">
        <div className="relative isolate h-40 overflow-hidden">
          <LeafletMap coordinates={props.coordinates} />
          <button type="button" onClick={() => setIsEditing(true)} className="absolute right-3 top-3 z-[400] flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-xs font-semibold text-primary shadow-md">
            <Pencil size={13} /> Sửa bản đồ
          </button>
        </div>
        <div className="flex items-start gap-2 border-t bg-card p-3 text-xs">
          <MapPinned size={16} className="mt-0.5 shrink-0 text-primary" />
          <span className="line-clamp-2 text-muted-foreground">{props.address}</span>
        </div>
      </div>

      {isEditing && draftCoordinates && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-3">
          <div className="flex h-[min(680px,92vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b p-4">
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg p-2 hover:bg-muted"><ArrowLeft size={20} /></button>
              <div><h3 className="font-semibold">Sửa vị trí</h3><p className="line-clamp-1 text-xs text-muted-foreground">{props.address}</p></div>
            </div>
            <div className="relative min-h-0 flex-1">
              <LeafletMap coordinates={draftCoordinates} draggable onChange={setDraftCoordinates} />
              <div className="pointer-events-none absolute left-1/2 top-4 z-[400] -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg">Kéo ghim hoặc chạm vào bản đồ</div>
            </div>
            <div className="flex justify-end gap-3 border-t p-4">
              <button type="button" onClick={() => setIsEditing(false)} className="rounded-xl px-5 py-2.5 text-sm font-medium">Trở lại</button>
              <button type="button" onClick={confirmPosition} className="rounded-xl bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground">Đồng ý</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
