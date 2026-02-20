import { Layers } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { CustomLayer } from "./map-tiles";

const LAYER_OPTIONS: Record<CustomLayer, { label: string }> = {
  standard: { label: "Standard" },
  satellite: { label: "Satellite" },
} as const;

type MapLayerPickerProps = {
  layerMode: CustomLayer;
  setLayerMode: (layerMode: CustomLayer) => void;
};

function MapLayerPicker({ layerMode, setLayerMode }: MapLayerPickerProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 shadow-md"
            aria-label="Toggle map layer"
          >
            <Layers className="h-4 w-4" />
          </Button>
        }
      />
      <PopoverContent className="w-36 p-1.5" align="end">
        <p className="text-muted-foreground px-2 py-1 text-xs font-medium">
          Map layer
        </p>
        <div className="flex flex-col gap-0.5">
          {Object.entries(LAYER_OPTIONS).map(([key, option]) => (
            <button
              key={key}
              onClick={() => setLayerMode(key as CustomLayer)}
              className={`w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                layerMode === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { MapLayerPicker };
