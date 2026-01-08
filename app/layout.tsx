import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MockSessionProvider } from "@/components/mock-session-provider";
import { RoleSwitcher } from "@/components/role-switcher";
import { Header } from "@/components/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manakhaah - Connect with Muslim Businesses",
  description: "Keep Muslim money within the Muslim community. Find halal services, Muslim-owned businesses, masjids, and community aid in the Bay Area.",
  keywords: ["halal", "muslim business", "masjid", "islamic center", "bay area", "fremont"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MockSessionProvider>
          <Header />
          <main>{children}</main>
          <RoleSwitcher />
        </MockSessionProvider>
      </body>
    </html>
  );
}
