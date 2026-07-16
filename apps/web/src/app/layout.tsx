import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

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
      <body className={`${jakarta.variable} antialiased`}>
        <AuthProvider>
          <div className="relative min-h-screen bg-[var(--surface-0)] text-[var(--text-1)]">
            <div className="relative z-10 flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
