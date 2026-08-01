import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viaje Lite | Elite AI Travel",
  description: "Book flights with AI. Zero hassle.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-obsidian text-neutral-100 antialiased min-h-screen">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
