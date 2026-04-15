import { IconBrandWhatsapp } from "@tabler/icons-react";
import Link from "next/link";
import { useLocale } from "next-intl";

type WhatsappFABProps = {
  /** Nomor WhatsApp dari Site Settings (format 62xxx atau 08xxx). Kosong = pakai fallback. */
  phone?: string;
  /** Pesan awal dari Site Settings (prefill chat). */
  message?: string;
  /** Teks CTA bubble ID di atas FAB. Kosong = pakai fallback. */
  ctaTextId?: string;
  /** Teks CTA bubble EN di atas FAB. Kosong = pakai fallback. */
  ctaTextEn?: string;
};

/** Fallback bila nomor tidak diatur di Admin → Site Settings. */
const DEFAULT_PHONE = "628111500708";
const DEFAULT_CTA = "Mau beli? Hubungi kami di sini.";

export function WhatsappFAB({ phone = DEFAULT_PHONE, message, ctaTextId, ctaTextEn }: WhatsappFABProps) {
  const locale = useLocale();
  const params = new URLSearchParams();
  if (message?.trim()) params.set("text", message.trim());
  const query = params.toString();
  const href = `https://wa.me/${phone.replace(/\D/g, "")}${query ? `?${query}` : ""}`;
  const bubbleText = (locale === "en" ? ctaTextEn : ctaTextId)?.trim() || DEFAULT_CTA;

  return (
    <div className="fixed right-4 bottom-6 z-10 flex flex-col items-end md:right-6 md:bottom-8">
      <div
        className="
          mb-2 inline-flex rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-700
          shadow-md ring-1 ring-gray-200 backdrop-blur
        "
      >
        {bubbleText}
      </div>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex flex-col items-center justify-center
          w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500 
          text-white shadow-lg block
          opacity-70 hover:opacity-100 transition-opacity duration-300
        "
        aria-label="Chat sekarang via WhatsApp"
      >
        <IconBrandWhatsapp size={32} />
      </Link>
    </div>
  );
}
