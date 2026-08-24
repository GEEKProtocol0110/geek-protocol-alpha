import type { Metadata } from "next";
import { Baloo_2, Space_Grotesk, JetBrains_Mono, Bungee, Press_Start_2P, Luckiest_Guy, Archivo_Black } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CyberBackground } from "@/components/CyberBackground";
import AlphaBanner from "@/components/AlphaBanner";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const jbMono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"], weight: ["400", "500", "600"] });
const bungee = Bungee({ variable: "--font-arcade", subsets: ["latin"], weight: "400" });
const pressStart = Press_Start_2P({ variable: "--font-pixel", subsets: ["latin"], weight: "400" });
const luckiest = Luckiest_Guy({ variable: "--font-logo", subsets: ["latin"], weight: "400" });
const archivo = Archivo_Black({ variable: "--font-wordmark", subsets: ["latin"], weight: "400" });

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
      <body className={`${baloo.variable} ${grotesk.variable} ${jbMono.variable} ${bungee.variable} ${pressStart.variable} ${luckiest.variable} ${archivo.variable} antialiased`}>
        {/* Google Fonts embed (hoisted to <head>) — guarantees Bungee &
            friends load even if the self-hosted next/font copies fail */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Bebas+Neue&family=Bungee&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=League+Spartan:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <AuthProvider>
          <div className="relative min-h-screen text-[var(--text-1)]">
            <CyberBackground />
            <div className="relative z-10 flex min-h-screen flex-col">
              {/* Site-wide Alpha disclosure, server-rendered so it is present
                  in the initial HTML rather than appearing after hydration. */}
              <AlphaBanner />
              <div className="flex-1">{children}</div>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
