import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomLayer } from "./map-tiles";

const PREFFERED_MAP_KEY = "preffered-map-type";

function useGetLayerSelection() {
  return useQuery({
    queryKey: [PREFFERED_MAP_KEY],
    queryFn: () => {
      const preferredMapType = localStorage.getItem(PREFFERED_MAP_KEY);
      return (preferredMapType as CustomLayer) ?? "standard";
    },
  });
}

function useSetLayerSelection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (layerMode: CustomLayer) => {
      localStorage.setItem(PREFFERED_MAP_KEY, layerMode);
      queryClient.setQueryData([PREFFERED_MAP_KEY], layerMode);

      return Promise.resolve();
    },
  });
}

export { useGetLayerSelection, useSetLayerSelection };
