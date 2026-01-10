import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { WalletProvider } from "@/components/WalletProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}>
        <WalletProvider>
          <TopBar />
          <div className="min-h-screen">{children}</div>
        </WalletProvider>
      </body>
    </html>
  );
}
