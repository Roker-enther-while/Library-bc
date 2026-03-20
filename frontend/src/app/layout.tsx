import type { Metadata } from "next";
import { Inter, Playfair_Display, Lora } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/layout/ScrollToTop";
import BottomNavigation from "@/components/layout/BottomNavigation";
import AIChatbot from "@/components/layout/AIChatbot";
import { ToastProvider } from "@/components/ui/Toast";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const lora = Lora({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Văn Học Việt Nam | Kho tàng văn chương dân tộc",
  description: "Khám phá kho tàng văn học Việt Nam từ trung đại đến hiện đại.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${lora.variable} font-body antialiased`}>
        <ToastProvider>
          <AppShell>
            {children}
          </AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
