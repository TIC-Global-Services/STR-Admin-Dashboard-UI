import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Halfre, Velcan } from "@/fonts";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "STR Admin",
  description: "Admin dashboard for STR organization",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${Halfre.variable} ${Velcan.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
