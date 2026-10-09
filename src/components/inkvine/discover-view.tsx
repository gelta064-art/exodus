"use client";

import { Compass, TrendingUp, Star, Sparkles } from "lucide-react";
import { useActivity } from "./hooks";
import { useAppStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const RECOMMENDED = [
  { title: "The Midnight Library", author: "Matt Haig", emoji: "🌙", blurb: "Between life and death there is a library" },
  { title: "Project Hail Mary", author: "Andy Weir", emoji: "🚀", blurb: "A lone astronaut saves humanity" },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", emoji: "☀️", blurb: "An AI friend observes the world" },
  { title: "Piranesi", author: "Susanna Clarke", emoji: "🏛️", blurb: "A man lives in a labyrinth of statues" },
  { title: "Tomorrow x3", author: "Gabrielle Zevin", emoji: "🎮", blurb: "Two friends design games across decades" },
  { title: "Circe", author: "Madeline Miller", emoji: "🌊", blurb: "The witch of Aeaea tells her story" },
  { title: "The House in the Cerulean Sea", author: "TJ Klune", emoji: "🏡", blurb: "A caseworker finds magic children" },
  { title: "Atomic Habits", author: "James Clear", emoji: "⚛️", blurb: "Tiny changes, remarkable results" },
];

const GENRES = [
  { name: "Fiction", emoji: "📖", count: "1,240" },
  { name: "Fantasy", emoji: "🐉", count: "892" },
  { name: "Sci-Fi", emoji: "🚀", count: "654" },
  { name: "Mystery", emoji: "🔍", count: "521" },
  { name: "Romance", emoji: "💞", count: "1,103" },
  { name: "Self-Help", emoji: "🌱", count: "445" },
  { name: "Biography", emoji: "👤", count: "389" },
  { name: "Classics", emoji: "📚", count: "672" },
];

export function DiscoverView() {
  const { data: activities, isLoading } = useActivity();
  const setView = useAppStore((s) => s.setView);

  const trending = [...new Set(activities?.map((a) => a.documentTitle))].slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 pb-32">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 ring-1 ring-primary/20 px-3 py-1 text-xs font-medium text-primary mb-3">
          <Compass className="h-3.5 w-3.5" />
          Discover
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Find your next listen</h1>
      </div>

      {/* Trending from community */}
      {trending.length > 0 && (
        <Carousel title="Trending in your community" icon={<TrendingUp className="h-4 w-4" />}>
          {trending.map((title, i) => (
            <DiscoverCard key={i} title={title} author="Community pick" emoji="🔥" blurb="" index={i} />
          ))}
        </Carousel>
      )}

      {/* Recommended for you */}
      <Carousel title="Recommended for you" icon={<Sparkles className="h-4 w-4" />}>
        {RECOMMENDED.map((b, i) => (
          <DiscoverCard key={i} title={b.title} author={`By ${b.author}`} emoji={b.emoji} blurb={b.blurb} index={i} />
        ))}
      </Carousel>

      {/* Genres */}
      <Section title="Browse by genre" icon={<Star className="h-4 w-4" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GENRES.map((g, i) => (
            <motion.button
              key={g.name}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setView("library")}
              className="rounded-xl bg-card ring-1 ring-border/60 p-4 text-center hover:ring-primary/30 transition group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{g.emoji}</div>
              <p className="text-sm font-semibold">{g.name}</p>
              <p className="text-[11px] text-muted-foreground">{g.count} titles</p>
            </motion.button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Carousel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-1.5">
        {icon}
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto ct-scroll pb-2 -mx-1 px-1">
        {children}
      </div>
    </section>
  );
}

function DiscoverCard({ title, author, emoji, blurb, index }: { title: string; author: string; emoji: string; blurb: string; index: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group shrink-0 w-32 sm:w-36 text-left"
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted ring-1 ring-border/60 group-hover:ring-primary/40 transition shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all grid place-items-center text-5xl bg-gradient-to-br from-primary/15 via-card to-card">
        <span className="group-hover:scale-110 transition-transform">{emoji}</span>
      </div>
      <h3 className="mt-2 text-xs font-semibold leading-tight line-clamp-2">{title}</h3>
      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{author}</p>
      {blurb && <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-1">{blurb}</p>}
    </motion.button>
  );
}
