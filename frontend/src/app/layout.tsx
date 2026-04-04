import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artist Tracker",
  description: "Visualize upcoming live events on an interactive 3D globe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
