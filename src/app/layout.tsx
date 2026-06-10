import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AHOP PH Calculator",
  description: "Employee-friendly AHOP payroll explainer and calculator for PH daily and monthly pay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
