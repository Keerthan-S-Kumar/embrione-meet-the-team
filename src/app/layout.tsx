import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import { Toaster } from "sonner";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ConfigBanner } from "@/components/ConfigBanner";
import { CursorGlow } from "@/components/CursorGlow";

export const metadata: Metadata = {
  title: { default: "Embrione: Meet the Team", template: "%s | Embrione" },
  description:
    "Create your Embrione Member Card, get it approved, and appear on the team page. Built for The Embrione, PES University CSE.",
};

export const viewport: Viewport = {
  themeColor: "#0b0813",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col">
        <CursorGlow />
        <Nav />
        <ConfigBanner />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-8 sm:px-8">{children}</main>
        <Footer />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-cell-2)",
              border: "1px solid var(--color-wall-2)",
              color: "var(--color-fg)",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
