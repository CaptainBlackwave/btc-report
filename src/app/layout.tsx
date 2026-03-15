import type { Metadata } from "next";
import { JetBrains_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { MultiTimeframeProvider } from "@/lib/TimeframeContext";
import { PortfolioProvider } from "@/lib/PortfolioContext";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BTC Report - AI Bitcoin Prediction",
  description: "AI-powered Bitcoin price prediction using LSTM and Random Forest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
        <MultiTimeframeProvider>
          <PortfolioProvider>
            {children}
          </PortfolioProvider>
        </MultiTimeframeProvider>
      </body>
    </html>
  );
}
