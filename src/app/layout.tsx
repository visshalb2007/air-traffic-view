import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyWatch ATC — Air Traffic Monitor",
  description: "Real-time air traffic surveillance powered by OpenSky Network ADS-B telemetry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-atc-bg text-atc-text font-sans antialiased min-h-screen selection:bg-atc-accent selection:text-black">
        {children}
      </body>
    </html>
  );
}
