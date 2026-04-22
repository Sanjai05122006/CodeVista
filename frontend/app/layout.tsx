import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeVista",
  description: "Interactive code execution and deterministic analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        <div className="min-h-full">{children}</div>
      </body>
    </html>
  );
}
