import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Let's Do | Practical digital solutions",
  description:
    "Practical digital solutions for safety, compliance, maintenance, and operational improvement.",
  openGraph: {
    title: "Let's Do | Practical digital solutions",
    description:
      "Practical digital solutions for safety, compliance, maintenance, and operational improvement.",
    url: siteUrl,
    siteName: "Let's Do",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
