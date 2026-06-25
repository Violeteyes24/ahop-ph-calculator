import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apnea Dynamics Payroll System",
  description: "AHOP payroll calculator, payroll processing, and payslip tools for Apnea Dynamics.",
};

const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${firaSans.className} h-full antialiased font-sans`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
