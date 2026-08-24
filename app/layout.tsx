import { AppToaster } from "@/app/components/AppToaster";
import { HideStripeTestingAssistant } from "@/app/components/HideStripeTestingAssistant";
import { ProductMetaPixel } from "@/app/components/ProductMetaPixel";
import { AuthProvider } from "@/app/contexts/auth-context";
import { CredentialProvider } from "@/app/contexts/credential-context";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { StoreProvider } from "@/app/store/StoreProvider";
import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { Poppins } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";

const productMetaPixelId =
  process.env.NEXT_PUBLIC_RP_META_PIXEL_ID?.trim() ?? "";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dealioo",
  description: "Create branded deal funnels, collect payments, issue QR passes, track redemptions and automate repeat visits from one dashboard.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

const spacesCdnOrigin = process.env.NEXT_PUBLIC_DO_SPACES_CDN_URL?.trim()?.replace(
  /\/$/,
  "",
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
      suppressHydrationWarning
    >
      <head>
        {spacesCdnOrigin ? (
          <link rel="preconnect" href={spacesCdnOrigin} crossOrigin="anonymous" />
        ) : null}
        {productMetaPixelId ? (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${productMetaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        ) : null}
      </head>
      <body
        className={`${poppins.className} min-h-full flex flex-col antialiased`}
        suppressHydrationWarning
      >
        {productMetaPixelId ? (
          <Script id="rp-product-meta-pixel" strategy="beforeInteractive">
            {`
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('set', 'autoConfig', false, '${productMetaPixelId}');
              fbq('init', '${productMetaPixelId}');
              window.__rpProductMetaPixelInitialized = '${productMetaPixelId}';
            `}
          </Script>
        ) : null}
        <StoreProvider>
          <QueryProvider>
            <AuthProvider>
              <CredentialProvider>
                {productMetaPixelId ? (
                  <Suspense fallback={null}>
                    <ProductMetaPixel />
                  </Suspense>
                ) : null}
                {children}
                <HideStripeTestingAssistant />
                <AppToaster />
              </CredentialProvider>
            </AuthProvider>
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
