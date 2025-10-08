import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "../../sentry/client";
import ConsoleBridgeClient from "./ConsoleBridgeClient";
import NetworkHealthDialog from "@/components/NetworkHealthDialog";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import UpdateSnackbar from "@/components/UpdateSnackbar";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MasterFabric Onboarding",
    template: "%s • MasterFabric",
  },
  description:
    "Developer onboarding system for MasterFabric Information Technologies Inc.",
  applicationName: "MasterFabric Welcome",
  keywords: [
    "MasterFabric",
    "onboarding",
    "developer onboarding",
    "supabase",
    "next.js",
  ],
  authors: [{ name: "MasterFabric" }],
  creator: "MasterFabric",
  publisher: "MasterFabric",
  openGraph: {
    type: "website",
    url: "/",
    title: "MasterFabric Onboarding",
    description:
      "Developer onboarding system for MasterFabric Information Technologies Inc.",
    siteName: "MasterFabric Welcome",
  },
  twitter: {
    card: "summary_large_image",
    title: "MasterFabric Onboarding",
    description:
      "Developer onboarding system for MasterFabric Information Technologies Inc.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} antialiased font-mono`}>
        <AuthProvider>
          <NotificationProvider>
            <ConsoleBridgeClient />
            {children}
            <UpdateSnackbar />
            <NetworkHealthDialog />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
