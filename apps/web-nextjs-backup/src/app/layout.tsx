import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ObjectOS - Authentication",
  description: "ObjectOS Authentication with Better-Auth",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
