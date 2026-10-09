import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SuggestChange from "@/components/SuggestChange";
import { Suspense } from "react";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shelfhound",
  description: "Find the edition worth owning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-cocoa text-creme antialiased">
        <SiteHeader />
        <main className="container mx-auto w-full max-w-7xl flex-1 px-4 py-8">
          {children}
        </main>
        {/* Reads ?suggest= on the client, so it waits for the search parameters */}
        <Suspense fallback={null}>
          <SuggestChange />
        </Suspense>
        <SiteFooter />
      </body>
    </html>
  );
}
