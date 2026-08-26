"use client";

import { useQuery } from "@tanstack/react-query";
import type { StoryData } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";

export function useStories() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<StoryData[]>({
    queryKey: ["stories", refreshKey],
    queryFn: async () => {
      const res = await api<{ stories: StoryData[] }>("/api/stories");
      return res.stories;
    },
  });
}

export function useStory(storyId: string | null) {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<StoryData>({
    queryKey: ["story", storyId, refreshKey],
    queryFn: async () => {
      const res = await api<{ story: StoryData }>(`/api/stories/${storyId}`);
      return res.story;
    },
    enabled: !!storyId,
  });
}
