import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Algomora",
    template: "%s · Algomora",
  },
  description:
    "A focused spaced-repetition and mastery workspace for LeetCode.",
};

// Apply the saved theme before hydration to avoid a flash of the default theme.
const themeScript = `
  try {
    const saved = localStorage.getItem("dashboard:preferences:theme");
    document.documentElement.dataset.theme = saved === "light" ? "light" : "dark";
  } catch (_) {
    document.documentElement.dataset.theme = "dark";
  }
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
