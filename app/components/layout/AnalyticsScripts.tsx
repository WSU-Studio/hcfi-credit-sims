import Script from 'next/script';

type AnalyticsScriptsProps = {
  gtmId: string;
  gaMeasurementId: string;
};

/**
 * Injects Google Tag Manager and/or Google Analytics 4 scripts when IDs are set.
 * Used in site layout; no auth required.
 */
export function AnalyticsScripts({ gtmId, gaMeasurementId }: AnalyticsScriptsProps) {
  const hasGtm = typeof gtmId === 'string' && gtmId.trim().length > 0;
  const hasGa = typeof gaMeasurementId === 'string' && gaMeasurementId.trim().length > 0;

  if (!hasGtm && !hasGa) return null;

  return (
    <>
      {hasGtm && (
        <>
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId.trim()}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId.trim()}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}
      {hasGa && !hasGtm && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId.trim()}`}
            strategy="afterInteractive"
          />
          <Script id="ga-script" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId.trim()}');
            `}
          </Script>
        </>
      )}
    </>
  );
}
