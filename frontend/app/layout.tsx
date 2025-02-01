import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VideoGraph AI - YouTube Research Assistant",
  description: "Transform YouTube videos into interactive knowledge bases with AI-powered analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} min-h-screen bg-black text-white`}>
          <Header />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
