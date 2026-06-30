import { AppToaster } from "@/app/components/AppToaster";
import { CredentialProvider } from "@/app/contexts/credential-context";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { StoreProvider } from "@/app/store/StoreProvider";
import type { Metadata } from "next";
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
      <body className={`${poppins.className} min-h-full flex flex-col antialiased`}>
        <StoreProvider>
          <QueryProvider>
            <CredentialProvider>
              {children}
              <AppToaster />
            </CredentialProvider>
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
