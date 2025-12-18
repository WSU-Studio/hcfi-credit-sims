import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyundai Capital - Simulasi Kredit",
  description: "Simulasi kredit pembiayaan kendaraan dengan layanan profesional",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <div className="min-h-screen bg-black text-white">
          {children}
        </div>
      </body>
    </html>
  );
}
