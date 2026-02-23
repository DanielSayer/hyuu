import "leaflet/dist/leaflet.css";

import { cn } from "@/lib/utils";
import type { ActivityMapData } from "@/utils/types/activities";
import type { ReactNode } from "react";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import { LoadingWrapper } from "../loading-wrapper";
import { Skeleton } from "../ui/skeleton";
import {
  useGetLayerSelection,
  useSetLayerSelection,
} from "./layer-selection-actions";
import { MapLayerPicker } from "./map-layer-picker";
import { MAP_ATTRIBUTION, useGetMapTileUrl } from "./map-tiles";

type Coordinate = [number, number];

type RouteMapProps = {
  mapData: ActivityMapData | null | undefined;
  disabled?: boolean;
  className?: string;
  fallback?: ReactNode;
  showLayerToggle?: boolean;
  allowCustomLayers?: boolean;
};

function toLeafletBounds(bounds: number[][]) {
  return [
    [bounds[0][0], bounds[0][1]],
    [bounds[1][0], bounds[1][1]],
  ] as [Coordinate, Coordinate];
}

const mapDisabledProps = {
  zoomControl: false,
  dragging: false,
  touchZoom: false,
  doubleClickZoom: false,
  scrollWheelZoom: false,
  boxZoom: false,
  keyboard: false,
  zoomAnimation: false,
  fadeAnimation: false,
  markerZoomAnimation: false,
  inertia: false,
};

export function RouteMap({
  mapData,
  disabled,
  className,
  fallback = <EmptyRouteMap />,
  allowCustomLayers = true,
  showLayerToggle = true,
}: RouteMapProps) {
  const { data: layerMode, isLoading } = useGetLayerSelection();
  const { mutate: setLayerMode } = useSetLayerSelection();
  const tileUrl = useGetMapTileUrl(layerMode ?? "standard", allowCustomLayers);

  if (!mapData) {
    return fallback;
  }

  const { latlngs, bounds } = mapData;
  const coordinates = latlngs
    .filter((x) => !!x)
    .map(([lat, lng]) => [lat, lng] as Coordinate);

  return (
    <div
      className={cn("relative h-100 w-full", className)}
      role="img"
      aria-label="Locked route map preview"
    >
      <LoadingWrapper
        isLoading={isLoading}
        fallback={<Skeleton className="h-full w-full rounded-sm" />}
      >
        <MapContainer
          bounds={toLeafletBounds(bounds)}
          className="h-full w-full overflow-hidden rounded-xl"
          style={{ height: "100%", width: "100%" }}
          {...(disabled ? mapDisabledProps : {})}
        >
          <TileLayer
            key={tileUrl}
            url={tileUrl}
            attribution={MAP_ATTRIBUTION}
          />
          <Polyline
            positions={coordinates.map(
              ([lat, lng]) => [lat, lng] as Coordinate,
            )}
            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.95 }}
            interactive={false}
          />
        </MapContainer>

        {showLayerToggle && (
          <div className="absolute top-2 right-2">
            <MapLayerPicker
              layerMode={layerMode ?? "standard"}
              setLayerMode={setLayerMode}
            />
          </div>
        )}
      </LoadingWrapper>
    </div>
  );
}

function EmptyRouteMap() {
  return (
    <div className="bg-muted/30 text-muted-foreground flex h-50 w-full items-center justify-center rounded-md border text-xs">
      Route unavailable
    </div>
  );
}
