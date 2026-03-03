import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mint Hub - Premium Marketplace for High-Value Assets",
  description: "The premier marketplace for high-value trade. Browse verified cars, luxury villas, and professional tech from trusted sellers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
