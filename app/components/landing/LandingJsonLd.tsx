import { getSiteOrigin } from "@/app/lib/site-origin";

export function LandingJsonLd() {
  const origin = getSiteOrigin();

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Dealioo",
    url: origin,
    logo: `${origin}/black-logo.png`,
    email: "support@dealioo.com",
    description:
      "Dealioo is the AI growth platform for local businesses — deal funnels, Meta and Google Ads, payments, QR passes, and repeat-visit automation.",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Dealioo",
    url: origin,
    publisher: {
      "@type": "Organization",
      name: "Dealioo",
      url: origin,
    },
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Dealioo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: origin,
    description:
      "Create branded deal funnels, run Meta and Google Ads, collect payments, issue QR passes, track redemptions, and automate repeat visits from one dashboard.",
    offers: {
      "@type": "Offer",
      url: `${origin}/#pricing`,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}
