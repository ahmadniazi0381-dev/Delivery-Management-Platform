import type { Metadata } from "next";
import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import LayoutWrapper from "@/components/LayoutWrapper";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Delivery Platform — Order Fresh Food Online",
    template: "%s | Delivery Platform",
  },
  description:
    "Fast and reliable food delivery platform. Order hot, flavorful meals online with real-time live tracking, fast 30-minute delivery, and secure payments.",
  keywords: [
    "Delivery Platform",
    "Food Delivery",
    "Order Food Online",
    "Fast Delivery",
    "Online Food Order",
    "Order Biryani Online",
  ],
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  openGraph: {
    title: "Delivery Platform — Order Fresh Food Online",
    description:
      "Order hot, flavorful meals online with real-time tracking and fast delivery.",
    type: "website",
    locale: "en_US",
    siteName: "Delivery Platform",
    url: "https://karachinaseebbiryani.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delivery Platform — Order Fresh Food Online",
    description:
      "Fresh meals delivered hot in 30 mins. Order now!",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL("https://karachinaseebbiryani.com"),
  alternates: {
    canonical: "/",
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
      className={`${poppins.variable} ${jakarta.variable} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              name: "Delivery Platform",
              image: "https://karachinaseebbiryani.com/logo.jpg",
              url: "https://karachinaseebbiryani.com",
              telephone: "+923054311118",
              email: "info@deliveryplatform.com",
              servesCuisine: ["Pakistani", "Fast Food", "Continental"],
              priceRange: "$$",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Shop #15, Near UCP, Khayaban-e-Jinnah",
                addressLocality: "Johar Town, Lahore",
                addressRegion: "Punjab",
                addressCountry: "PK",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 31.4475531,
                longitude: 74.2690347,
              },
              openingHoursSpecification: {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
                opens: "11:00",
                closes: "23:00",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                reviewCount: "5000",
              },
            }),
          }}
        />
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
