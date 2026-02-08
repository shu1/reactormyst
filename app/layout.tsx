import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReactorMyst - Supercell AI Hackathon",
  description: "A real-time interactive world model demo with keyboard and camera controls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
