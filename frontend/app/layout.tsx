import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

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
        <AuthProvider>
          <div className="min-h-full">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
