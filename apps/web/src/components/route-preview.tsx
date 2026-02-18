import "leaflet/dist/leaflet.css";

import { MapContainer, Polyline, TileLayer } from "react-leaflet";

type LatLng = [number, number];

type RoutePreview = {
  hasRoute: boolean;
  bounds: [number, number, number, number] | null;
  latlngs: LatLng[];
};

type RoutePreviewProps = {
  routePreview: RoutePreview | null | undefined;
  className?: string;
};

function toLeafletBounds(bounds: [number, number, number, number]) {
  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ] as [[number, number], [number, number]];
}

export function RoutePreview({ routePreview, className }: RoutePreviewProps) {
  const hasRoute = Boolean(
    routePreview?.hasRoute &&
    routePreview.bounds &&
    routePreview.latlngs &&
    routePreview.latlngs.length > 1,
  );

  if (!hasRoute) {
    return (
      <div
        className={
          className ??
          "h-50 w-full rounded-md border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground"
        }
      >
        Route unavailable
      </div>
    );
  }

  const { latlngs, bounds } = routePreview as {
    latlngs: LatLng[];
    bounds: [number, number, number, number];
  };

  return (
    <div
      className={className ?? "h-100 w-full rounded-md border bg-muted/20 p-1"}
      role="img"
      aria-label="Locked route map preview"
    >
      <MapContainer
        bounds={toLeafletBounds(bounds)}
        className="h-full w-full overflow-hidden rounded-sm"
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
        inertia={false}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Polyline
          positions={latlngs}
          pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.95 }}
          interactive={false}
        />
      </MapContainer>
    </div>
  );
}
