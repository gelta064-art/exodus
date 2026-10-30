"use client";

import { useQuery } from "@tanstack/react-query";
import type { DocumentData, VoiceProfileData, ActivityData, LivingBookData } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";

export function useDocuments() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<DocumentData[]>({
    queryKey: ["documents", refreshKey],
    queryFn: async () => {
      const res = await api<{ documents: DocumentData[] }>("/api/documents");
      return res.documents;
    },
  });
}

export function useDocument(docId: string | null) {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<DocumentData>({
    queryKey: ["document", docId, refreshKey],
    queryFn: async () => {
      const res = await api<{ document: DocumentData }>(`/api/documents/${docId}`);
      return res.document;
    },
    enabled: !!docId,
  });
}

export function useVoices() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<VoiceProfileData[]>({
    queryKey: ["voices", refreshKey],
    queryFn: async () => {
      const res = await api<{ voices: VoiceProfileData[] }>("/api/voices");
      return res.voices;
    },
  });
}

export function useActivity() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<ActivityData[]>({
    queryKey: ["activity", refreshKey],
    queryFn: async () => {
      const res = await api<{ activities: ActivityData[] }>("/api/activity");
      return res.activities;
    },
  });
}

export function useLivingBooks() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<LivingBookData[]>({
    queryKey: ["livingBooks", refreshKey],
    queryFn: async () => {
      const res = await api<{ books: LivingBookData[] }>("/api/living-books");
      return res.books;
    },
  });
}

export function useLivingBook(bookId: string | null) {
  const refreshKey = useAppStore((s) => s.refreshKey);
  return useQuery<LivingBookData>({
    queryKey: ["livingBook", bookId, refreshKey],
    queryFn: async () => {
      const res = await api<{ book: LivingBookData }>(`/api/living-books/${bookId}`);
      return res.book;
    },
    enabled: !!bookId,
  });
}
