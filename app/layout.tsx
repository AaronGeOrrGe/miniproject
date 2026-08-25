import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { PWAProvider } from "@/components/PWAProvider";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Students Academic Repository",
  description: "Cloud-based student project repository and retrieval system",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    title: "SAR",
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "light";
  const { user } = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${theme === "dark" ? "dark" : ""} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider initialTheme={theme === "dark" ? "dark" : "light"}>
          <AuthProvider initialUser={user}>
            <PWAProvider />
            <Header />
            <main className="flex-1">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
