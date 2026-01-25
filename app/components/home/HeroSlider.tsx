'use client';

import { useState } from "react";
import type { Benefit, Slide } from "@/app/types";
import { Container } from "../ui/Container";
import { BenefitCard } from "../ui/BenefitCard";
import Image from "next/image";

type HeroSliderProps = {
  slides: Slide[];
  benefits: Benefit[];
};

export function HeroSlider({ slides, benefits }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const fallbackImage = "/images/main-banner.jpg";
  const current = slides[index] ?? slides[0] ?? { image: fallbackImage, title: "", highlight: "", description: "" };

  if (!current) return null;

  // Get the current image source, fallback if error occurred
  const imageSrc = imageError || !current.image ? fallbackImage : current.image;
  
  // Check if image is external URL (starts with http/https)
  const isExternalUrl = imageSrc.startsWith('http://') || imageSrc.startsWith('https://');
  
  // Add cache busting for local images - use URL as key to force reload when URL changes
  const getImageUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // For local images, add a hash-based cache buster that changes when URL changes
    // This ensures browser reloads when image is updated even with same filename
    const urlHash = url.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cb=${Math.abs(urlHash)}`;
  };
  
  const finalImageSrc = getImageUrl(imageSrc);

  return (
    <section id="hero" className="relative isolate overflow-hidden bg-black">
      <div className="relative w-full h-[376px] md:h-[480px] lg:h-[640px]">
        {isExternalUrl ? (
          // Use regular img tag for external URLs to avoid Next.js Image optimization issues
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={finalImageSrc}
            alt={current.title}
            className="md:absolute left-0 right-0 bottom-0 w-full h-full object-cover"
            onError={() => setImageError(true)}
            aria-hidden="true"
            key={finalImageSrc}
          />
        ) : (
          <Image
            src={finalImageSrc}
            alt={current.title}
            width={1000}
            height={1000}
            className="md:absolute left-0 right-0 bottom-0 w-full h-full object-cover"
            aria-hidden="true"
            key={finalImageSrc}
            unoptimized
          />
        )}
        {/* <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10" /> */}

        <Container className="relative flex h-full items-end pb-12 md:pb-16">
          <div className="max-w-2xl space-y-5">
            <p className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-white">
              {current.title}{" "}
              <span className="text-[#008AEC]">{current.highlight}</span>
            </p>
            <p className="max-w-xl text-base leading-relaxed text-white/90 md:text-lg">
              {current.description}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {benefits.map((item) => (
                <BenefitCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </Container>
      </div>

      {slides.length > 1 ? (
        <Container className="relative -mt-6 flex justify-center gap-2 pb-8 md:-mt-8">
          {slides.map((slide, idx) => (
            <button
              key={`${slide.title}-${idx}`}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              aria-pressed={idx === index}
              onClick={() => {
                setIndex(idx);
                setImageError(false); // Reset error state when changing slide
              }}
              className={`h-2 w-8 rounded-full transition ${
                idx === index
                  ? "bg-[#008AEC] shadow-[0_0_0_4px_rgba(0,138,236,0.25)]"
                  : "bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </Container>
      ) : null}
    </section>
  );
}


