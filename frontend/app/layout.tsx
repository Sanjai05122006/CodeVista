import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast";

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="h-full" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-full">{children}</div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
