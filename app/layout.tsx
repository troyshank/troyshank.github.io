import type { Metadata } from "next";
import "./globals.css";

const repository = process.env.GITHUB_REPOSITORY ?? "";
const [owner = "", repo = ""] = repository.split("/");
const isUserSite = repo.endsWith(".github.io");
const inferredPath = repo && !isUserSite ? `/${repo}` : "";
const sitePath = process.env.NEXT_PUBLIC_BASE_PATH ?? inferredPath;
const siteUrl = owner ? `https://${owner}.github.io${sitePath}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Sprout — Code, Play, Grow!",
  description: "A simpler, friendlier map coding playground made for young creators.",
  icons: { icon: `${sitePath}/favicon.svg`, shortcut: `${sitePath}/favicon.svg` },
  openGraph: { title: "Sprout — Code, Play, Grow!", description: "Guide Pip through friendly coding maps.", images: [{ url: `${siteUrl}/og.png`, width: 1736, height: 906 }] },
  twitter: { card: "summary_large_image", title: "Sprout — Code, Play, Grow!", description: "Guide Pip through friendly coding maps.", images: [`${siteUrl}/og.png`] },
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
