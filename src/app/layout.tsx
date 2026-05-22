import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeLab C4 Viewer",
  description: "IcePanel-inspired Structurizr workspace viewer",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
