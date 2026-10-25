import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const nunito = localFont({
  src: "./fonts/Nunito.ttf",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyTake",
  description: "A personal home for media and your opinions.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "MyTake",
    description: "A personal home for media and your opinions.",
    url: "/",
    siteName: "MyTake",
    type: "website",
    images: [{
      url: "/icon.png",
      width: 256,
      height: 256,
      alt: "MyTake ! logo",
    }],
  },
  twitter: {
    card: "summary",
    title: "MyTake",
    description: "A personal home for media and your opinions.",
    images: ["/icon.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>{children}</body>
    </html>
  );
}
