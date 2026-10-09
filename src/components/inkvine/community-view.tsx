"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Users, Star, BookOpen, Check, Library, Sparkles, TrendingUp } from "lucide-react";
import { useActivity, useDocuments } from "./hooks";
import { useAppStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActivityData } from "@/lib/types";

const ACTIVITY_META: Record<string, { icon: any; color: string; verb: string }> = {
  started: { icon: BookOpen, color: "#f59e0b", verb: "started reading" },
  finished: { icon: Check, color: "#34d399", verb: "finished" },
  rated: { icon: Star, color: "#fb7185", verb: "rated" },
  reviewed: { icon: Sparkles, color: "#a78bfa", verb: "reviewed" },
  shelved: { icon: Library, color: "#22d3ee", verb: "shelved" },
};

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export function CommunityView() {
  const { data: activities, isLoading } = useActivity();
  const { data: docs } = useDocuments();
  const openReader = useAppStore((s) => s.openReader);
  const setView = useAppStore((s) => s.setView);

  // Stats
  const totalReaders = new Set(activities?.map((a) => a.reader)).size;
  const totalReviews = activities?.filter((a) => a.type === "reviewed" || a.type === "rated").length ?? 0;
  const avgRating = (() => {
    const rated = docs?.filter((d) => d.rating) ?? [];
    if (rated.length === 0) return 0;
    return rated.reduce((a, d) => a + (d.rating || 0), 0) / rated.length;
  })();

  // "Readers also enjoyed" = your books + suggest similar titles from activity
  const trendingTitles = React.useMemo(() => {
    const counts: Record<string, number> = {};
    activities?.forEach((a) => {
      counts[a.documentTitle] = (counts[a.documentTitle] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([title, count]) => ({ title, count }));
  }, [activities]);

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 ring-1 ring-primary/20 px-3 py-1 text-xs font-medium text-primary mb-3">
          <Users className="h-3.5 w-3.5" />
          Community
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Reader Activity</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          See what the Inkvine community is reading, rating, and reviewing.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard icon={<Users className="h-4 w-4" />} label="Active readers" value={String(totalReaders)} />
        <StatCard icon={<Star className="h-4 w-4" />} label="Ratings & reviews" value={String(totalReviews)} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Avg. rating" value={avgRating > 0 ? avgRating.toFixed(1) : "—"} />
      </div>

      {/* Trending */}
      {trendingTitles.length > 0 && (
        <div className="mb-6 rounded-2xl bg-card ring-1 ring-border/60 p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-primary" />
            Trending this week
          </h2>
          <div className="flex flex-wrap gap-2">
            {trendingTitles.map((t, i) => (
              <span key={t.title} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-foreground px-3 py-1.5 text-xs">
                <span className="text-primary font-bold">{i + 1}</span>
                <span className="font-medium">{t.title}</span>
                <span className="text-muted-foreground">· {t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Activity feed */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
        Recent Activity
      </h2>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          No activity yet. Be the first to share what you&apos;re reading!
        </div>
      ) : (
        <div className="space-y-2.5">
          {activities.map((a, i) => (
            <ActivityRow key={a.id} activity={a} index={i} />
          ))}
        </div>
      )}

      <button
        onClick={() => setView("library")}
        className="mt-6 w-full rounded-xl bg-card ring-1 ring-border/60 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:ring-primary/30 transition"
      >
        Browse your library →
      </button>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card ring-1 ring-border/60 p-3 text-center">
      <div className="mx-auto mb-1 grid place-items-center h-8 w-8 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function ActivityRow({ activity, index }: { activity: ActivityData; index: number }) {
  const meta = ACTIVITY_META[activity.type] || ACTIVITY_META.started;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-start gap-3 rounded-xl bg-card ring-1 ring-border/60 p-3 hover:ring-primary/20 transition"
    >
      {/* Avatar */}
      <div className="grid place-items-center h-10 w-10 rounded-full bg-muted shrink-0 text-lg">
        {activity.readerAvatar || "👤"}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{activity.reader}</span>{" "}
          <span className="text-muted-foreground">{meta.verb}</span>{" "}
          <span className="font-medium text-primary">{activity.documentTitle}</span>
        </p>
        {activity.detail && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{activity.detail}</p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(activity.createdAt)}</p>
      </div>
      {/* Icon */}
      <span className="grid place-items-center h-8 w-8 rounded-lg shrink-0" style={{ backgroundColor: meta.color + "22" }}>
        <Icon className="h-4 w-4" style={{ color: meta.color }} />
      </span>
    </motion.div>
  );
}
