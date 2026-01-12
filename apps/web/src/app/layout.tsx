import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { WalletProvider } from "@/components/WalletProvider";
import { Starfield } from "@/components/Starfield";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Geek Protocol",
  description: "Your Knowledge is Now an Asset. All hope, no hype.",
  metadataBase: new URL("https://geekprotocol.xyz"),
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Geek Protocol",
    description: "Your Knowledge is Now an Asset. All hope, no hype.",
    url: "https://geekprotocol.xyz",
    siteName: "Geek Protocol",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Geek Protocol",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Geek Protocol",
    description: "Your Knowledge is Now an Asset. All hope, no hype.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased font-sans`}>
        <WalletProvider>
          <div className="relative min-h-screen overflow-hidden bg-[var(--surface-0)] text-[var(--text-1)]">
            <div className="absolute inset-0 bg-[var(--surface-gradient)]" aria-hidden />
            <div className="absolute inset-0 bg-[var(--noise-image)] opacity-30 mix-blend-screen" aria-hidden />
            <Starfield />
            <div className="relative z-10 flex min-h-screen flex-col">
              <TopBar />
              <div className="flex-1">{children}</div>
            </div>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
