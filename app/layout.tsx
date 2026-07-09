import { AppToaster } from "@/app/components/AppToaster";
import { AuthProvider } from "@/app/contexts/auth-context";
import { CredentialProvider } from "@/app/contexts/credential-context";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { StoreProvider } from "@/app/store/StoreProvider";
import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { Poppins } from "next/font/google";
import "./globals.css";

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
    >
      <head>
        {spacesCdnOrigin ? (
          <link rel="preconnect" href={spacesCdnOrigin} crossOrigin="anonymous" />
        ) : null}
      </head>
      <body className={`${poppins.className} min-h-full flex flex-col antialiased`}>
        <StoreProvider>
          <QueryProvider>
            <AuthProvider>
              <CredentialProvider>
                {children}
                <AppToaster />
              </CredentialProvider>
            </AuthProvider>
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
