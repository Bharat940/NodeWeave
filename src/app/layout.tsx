import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Provider } from "jotai";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import {NuqsAdapter} from "nuqs/adapters/next/app";

import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://node-weave.vercel.app"),
  title: {
    default: "NodeWeave | Seamless Workflow Automation",
    template: "%s | NodeWeave"
  },
  description: "NodeWeave is a powerful workflow automation platform that enables users to create, manage, and execute complex automation through a visual interface.",
  keywords: ["automation", "workflow", "no-code", "visual-editor", "saas", "nodeweave"],
  authors: [{ name: "NodeWeave Team" }],
  creator: "NodeWeave",
  publisher: "NodeWeave",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://node-weave.vercel.app",
    siteName: "NodeWeave",
    title: "NodeWeave | Seamless Workflow Automation",
    description: "Build, manage, and scale your automations with NodeWeave's premium visual editor.",
    images: [
      {
        url: "/logos/logo.svg",
        width: 800,
        height: 600,
        alt: "NodeWeave Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NodeWeave | Seamless Workflow Automation",
    description: "Build, manage, and scale your automations with NodeWeave's premium visual editor.",
    images: ["/logos/logo.svg"],
    creator: "@nodeweave",
  },
  icons: {
    icon: "/logos/logo.svg",
    shortcut: "/logos/logo.svg",
    apple: "/logos/logo.svg",
  },
  alternates: {
    canonical: "/",
  },
};

import { ThemeProvider } from "@/components/theme-provider";
import { JsonLd } from "@/components/seo/json-ld";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JsonLd />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <NuqsAdapter>
              <Provider>
                {children}
              </Provider>
            </NuqsAdapter>
            <Toaster />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
