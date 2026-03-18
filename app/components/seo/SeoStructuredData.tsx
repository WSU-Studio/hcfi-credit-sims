type ContactPoint = {
  label: string;
  text: string;
};

type SeoStructuredDataProps = {
  organizationName: string;
  baseUrl: string;
  addressLines?: string[];
  contact?: ContactPoint[];
};

export function SeoStructuredDataOrganization({
  organizationName,
  baseUrl,
  addressLines,
  contact,
}: SeoStructuredDataProps) {
  if (!baseUrl) return null;

  const streetAddress = addressLines && addressLines.length > 0 ? addressLines.join(", ") : undefined;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organizationName,
    url: baseUrl,
    address: streetAddress
      ? {
          "@type": "PostalAddress",
          streetAddress,
        }
      : undefined,
    contactPoint:
      contact && contact.length > 0
        ? contact.map((c) => ({
            "@type": "ContactPoint",
            telephone: c.text,
            contactType: c.label,
          }))
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

