import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dramai — AI Mini-Drama Series",
  description:
    "Turn any story into addictive vertical mini-dramas. AI writes the script, casts distinct voices, paints every scene, and plays it back episode by episode.",
  keywords: [
    "Dramai",
    "mini drama",
    "AI drama",
    "short drama",
    "vertical drama",
    "ReelShort",
    "DramaBox",
  ],
  authors: [{ name: "Dramai" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster position="bottom-center" />
        </Providers>
      </body>
    </html>
  );
}
