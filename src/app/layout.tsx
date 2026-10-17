import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SKYWATCH ATC - Real-Time Air Traffic Monitoring Dashboard",
  description:
    "Real-time tactical air traffic control monitoring system powered by OpenSky Network API with dead reckoning, alerts, and resilient offline telemetry.",
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
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-radar-bg text-radar-text antialiased min-h-screen selection:bg-radar-primary selection:text-black">
        {children}
      </body>
    </html>
  );
}
