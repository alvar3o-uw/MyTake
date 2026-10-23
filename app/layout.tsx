import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyTake",
  description: "A personal home for media and your opinions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" >
      <body>{children}</body>
    </html>
  );
}
