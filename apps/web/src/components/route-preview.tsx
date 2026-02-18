import "leaflet/dist/leaflet.css";
import { useTheme } from "./theme-provider";

import { MapContainer, Polyline, TileLayer } from "react-leaflet";

type Coordinate = [number, number];

type RoutePreview = {
  hasRoute: boolean;
  bounds: [number, number, number, number] | null;
  latlngs: Coordinate[];
};

type RoutePreviewProps = {
  routePreview: RoutePreview | null | undefined;
};

function toLeafletBounds(bounds: [number, number, number, number]) {
  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ] as [Coordinate, Coordinate];
}

const mapTiles = {
  light: "https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png",
  dark: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
  satellite:
    "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.png",
} as const;

export function RoutePreview({ routePreview }: RoutePreviewProps) {
  const { resolvedTheme } = useTheme();

  if (!routePreview?.hasRoute || !routePreview.bounds) {
    return (
      <div
        className={
          "h-50 w-full rounded-md border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground"
        }
      >
        Route unavailable
      </div>
    );
  }

  const { latlngs, bounds } = routePreview;

  return (
    <div
      className={"h-100 w-full rounded-md border bg-muted/20 p-1"}
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
          url={
            mapTiles[resolvedTheme as keyof typeof mapTiles] ?? mapTiles.light
          }
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
