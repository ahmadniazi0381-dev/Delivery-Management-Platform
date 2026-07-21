import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import LayoutWrapper from "@/components/LayoutWrapper";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Karachi Naseeb Baryani & Pulao | UCP Branch - Order Online",
  description:
    "Order fresh, authentic Karachi Baryani and Pulao online from the UCP branch. Fast delivery within 2.2km. Pay via Cash, JazzCash, Easypaisa, or Card.",
  keywords: [
    "Karachi biryani Lahore",
    "Naseeb Baryani UCP",
    "biryani delivery Lahore",
    "pulao delivery UCP",
    "online food order UCP",
  ],
  openGraph: {
    title: "Karachi Naseeb Baryani & Pulao | UCP",
    description: "Authentic Karachi biryani delivered fresh to your doorstep.",
    type: "website",
    locale: "en_PK",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <a href="#main-content" className="skip-nav">Skip to main content</a>
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
