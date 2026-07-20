import Script from 'next/script';
import { isSafeGaMeasurementId, isSafeGtmId } from '@/lib/security/analytics-ids';

type AnalyticsScriptsProps = {
  gtmId: string;
  gaMeasurementId: string;
};

/**
 * Injects Google Tag Manager and/or Google Analytics 4 scripts when IDs are set
 * and match the expected format (blocks stored XSS via settings).
 */
export function AnalyticsScripts({ gtmId, gaMeasurementId }: AnalyticsScriptsProps) {
  const safeGtm = typeof gtmId === 'string' && isSafeGtmId(gtmId) ? gtmId.trim().toUpperCase() : '';
  const safeGa =
    typeof gaMeasurementId === 'string' && isSafeGaMeasurementId(gaMeasurementId)
      ? gaMeasurementId.trim().toUpperCase()
      : '';

  if (!safeGtm && !safeGa) return null;

  return (
    <>
      {safeGtm && (
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
                })(window,document,'script','dataLayer','${safeGtm}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${safeGtm}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      )}
      {safeGa && !safeGtm && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${safeGa}`}
            strategy="afterInteractive"
          />
          <Script id="ga-script" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${safeGa}');
            `}
          </Script>
        </>
      )}
    </>
  );
}
