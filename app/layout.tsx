import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MockSessionProvider } from "@/components/mock-session-provider";
import { RoleSwitcher } from "@/components/role-switcher";
import { Header } from "@/components/header";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { QueryProvider } from "@/components/query-provider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export const metadata: Metadata = {
  title: "Manaakhah - Connect with Muslim Businesses",
  description: "Keep Muslim money within the Muslim community. Find halal services, Muslim-owned businesses, masjids, and community aid in the Bay Area.",
  keywords: ["halal", "muslim business", "masjid", "islamic center", "bay area", "fremont", "halal food", "muslim owned"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Manaakhah",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://manaakhah.com",
    siteName: "Manaakhah",
    title: "Manaakhah - Connect with Muslim Businesses",
    description: "Keep Muslim money within the Muslim community. Find halal services, Muslim-owned businesses, masjids, and community aid in the Bay Area.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Manaakhah - Muslim Business Directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manaakhah - Connect with Muslim Businesses",
    description: "Find halal services, Muslim-owned businesses, and masjids in the Bay Area.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <LanguageProvider>
            <MockSessionProvider>
              <Header />
              <main>{children}</main>
              <RoleSwitcher />
            </MockSessionProvider>
          </LanguageProvider>
        </QueryProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful');
                    })
                    .catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
