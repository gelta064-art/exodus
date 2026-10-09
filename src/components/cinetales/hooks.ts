"use client";

import { useQuery } from "@tanstack/react-query";
import type { SeriesData } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";

export function useSeriesList() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<SeriesData[]>({
    queryKey: ["series", refreshKey],
    queryFn: async () => {
      const res = await api<{ series: SeriesData[] }>("/api/series");
      return res.series;
    },
  });
}

export function useSeries(seriesId: string | null) {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<SeriesData>({
    queryKey: ["series", seriesId, refreshKey],
    queryFn: async () => {
      const res = await api<{ series: SeriesData }>(`/api/series/${seriesId}`);
      return res.series;
    },
    enabled: !!seriesId,
  });
}
