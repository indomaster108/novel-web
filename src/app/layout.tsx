import type { Metadata } from "next";
import { Lora, Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getViewer } from "@/lib/auth";
import { siteUrl } from "@/lib/site";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ruang Aksara | Cerita untuk tinggal lebih lama",
    template: "%s | Ruang Aksara",
  },
  description: "Baca cerita orisinal yang dirawat untuk dinikmati perlahan.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Ruang Aksara",
    title: "Ruang Aksara | Cerita untuk tinggal lebih lama",
    description: "Baca cerita orisinal yang dirawat untuk dinikmati perlahan.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewer();

  return (
    <html
      lang="id"
      className={`${manrope.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] font-[family-name:var(--font-manrope)] text-[var(--foreground)]">
        <SiteHeader viewer={viewer} />
        <main className="min-h-[calc(100vh-9rem)]">{children}</main>
        <SiteFooter viewer={viewer} />
      </body>
    </html>
  );
}
