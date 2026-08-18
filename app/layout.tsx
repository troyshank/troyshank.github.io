import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  return {
    metadataBase: base,
    title: "Sprout — Code, Play, Grow!",
    description: "A simpler, friendlier block coding playground made for young creators.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "Sprout — Code, Play, Grow!", description: "A friendlier first block-coding playground for young creators.", images: [{ url: new URL("/og.png", base).toString(), width: 1736, height: 906 }] },
    twitter: { card: "summary_large_image", title: "Sprout — Code, Play, Grow!", description: "A friendlier first block-coding playground for young creators.", images: [new URL("/og.png", base).toString()] },
  };
}

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
