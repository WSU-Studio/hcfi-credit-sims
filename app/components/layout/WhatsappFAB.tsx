import { IconBrandWhatsapp } from "@tabler/icons-react";
import Link from "next/link";

type WhatsappFABProps = {
  /** Nomor WhatsApp (format internasional tanpa +, contoh: 628111500708) */
  phone?: string;
  /** Teks prefill opsional untuk chat */
  message?: string;
};

const DEFAULT_PHONE = "628111500708";

export function WhatsappFAB({ phone = DEFAULT_PHONE, message }: WhatsappFABProps) {
  const params = new URLSearchParams();
  if (message?.trim()) params.set("text", message.trim());
  const query = params.toString();
  const href = `https://wa.me/${phone.replace(/\D/g, "")}${query ? `?${query}` : ""}`;

  return (
    <div className="fixed right-4 bottom-6 z-10 md:right-6 md:bottom-8">
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
