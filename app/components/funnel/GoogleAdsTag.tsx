"use client";

import Script from "next/script";

type GoogleAdsTagProps = {
  googleAdsId?: string | null;
};

export function GoogleAdsTag({ googleAdsId }: GoogleAdsTagProps) {
  const id = googleAdsId?.trim() ?? "";
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script
        id={`google-ads-tag-${id}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];

            function gtag(){
              dataLayer.push(arguments);
            }

            window.gtag = gtag;

            gtag('js', new Date());
            gtag('config', '${id}');
          `,
        }}
      />
    </>
  );
}
