import { SITE_ORIGIN } from "@/lib/app-url";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

/** Homepage SoftwareApplication + WebApplication schema. */
export function HomeJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_ORIGIN}/#application`,
        name: SITE_NAME,
        alternateName: SITE_TAGLINE,
        description: SITE_DESCRIPTION,
        url: SITE_ORIGIN,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
          description: "Free to browse; dots required to post tester and feedback requests",
        },
        featureList: [
          "14-day closed tester runs",
          "Structured written feedback",
          "Google Play closed testing support",
          "TestFlight and App Store feedback",
          "Steam and itch.io game testing",
          "Dot-based credit economy",
        ],
        publisher: { "@id": `${SITE_ORIGIN}/#organization` },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_ORIGIN}/#webapp`,
        name: SITE_NAME,
        url: SITE_ORIGIN,
        browserRequirements: "Requires JavaScript",
        applicationCategory: "ProductivityApplication",
        isAccessibleForFree: true,
        inLanguage: "en",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
