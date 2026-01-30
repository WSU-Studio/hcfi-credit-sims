'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import type { Benefit, Slide } from "@/app/types";
import { Container } from "../ui/Container";
import { BenefitCard } from "../ui/BenefitCard";
import Image from "next/image";

type HeroSliderProps = {
  slides: Slide[];
  benefits: Benefit[];
  /** 'slide' = horizontal slide, 'fade' = crossfade */
  transition?: 'slide' | 'fade';
};

const AUTO_SLIDE_INTERVAL_MS = 7000;
const TRANSITION_DURATION_MS = 600;

export function HeroSlider({ slides, benefits, transition = 'slide' }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const fallbackImage = "/images/main-banner.jpg";

  // Auto-slide every 7 seconds; pause while dragging
  useEffect(() => {
    if (slides.length <= 1 || isDragging) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, AUTO_SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides.length, index, isDragging]);

  const goTo = useCallback((idx: number) => {
    setIndex(idx);
    setImageError((prev) => ({ ...prev, [idx]: false }));
  }, []);

  const getSlideWidthPx = useCallback(() => {
    const el = containerRef.current;
    if (!el || !slides.length) return 0;
    return el.offsetWidth / slides.length;
  }, [slides.length]);

  const snapFromDrag = useCallback(() => {
    const slideWidth = getSlideWidthPx();
    if (!slideWidth) {
      setDragOffset(0);
      return;
    }
    const effectiveIndex = index - dragOffset / slideWidth;
    const newIndex = Math.max(0, Math.min(slides.length - 1, Math.round(effectiveIndex)));
    setIndex(newIndex);
    setDragOffset(0);
    setIsDragging(false);
    setImageError((prev) => ({ ...prev, [newIndex]: false }));
  }, [index, dragOffset, slides.length, getSlideWidthPx]);

  const handleDragMove = useCallback((clientX: number) => {
    setDragOffset(clientX - dragStartX.current);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    snapFromDrag();
  }, [isDragging, snapFromDrag]);

  // Touch: swipe on mobile
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (transition !== 'slide' || slides.length <= 1) return;
      dragStartX.current = e.touches[0].clientX;
      setIsDragging(true);
      setDragOffset(0);
    },
    [transition, slides.length]
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      handleDragMove(e.touches[0].clientX);
    },
    [isDragging, handleDragMove]
  );
  const onTouchEnd = useCallback(() => {
    if (!isDragging) return;
    handleDragEnd();
  }, [isDragging, handleDragEnd]);

  // Mouse: click and hold to drag on desktop
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (transition !== 'slide' || slides.length <= 1) return;
      e.preventDefault();
      dragStartX.current = e.clientX;
      setIsDragging(true);
      setDragOffset(0);
    },
    [transition, slides.length]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const getImageUrl = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const urlHash = url.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0);
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}cb=${Math.abs(urlHash)}`;
  };

  if (!slides.length) return null;

  const slidePercent = 100 / slides.length;
  const baseTranslate = -index * slidePercent;
  const transformPx = isDragging ? `${dragOffset}px` : '0px';
  const stripTransform = `translateX(calc(${baseTranslate}% + ${transformPx}))`;

  return (
    <section id="hero" className="relative isolate overflow-hidden bg-black">
      <div
        ref={containerRef}
        className="relative w-full h-[376px] md:h-[480px] lg:h-[640px] overflow-hidden touch-pan-y select-none"
        style={{ touchAction: transition === 'slide' ? 'pan-y' : 'auto' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        {transition === 'slide' ? (
          /* Horizontal slide: strip of slides with translateX; draggable */
          <div
            className="flex h-full ease-out"
            style={{
              width: `${slides.length * 100}%`,
              transform: stripTransform,
              transitionProperty: isDragging ? 'none' : 'transform',
              transitionDuration: `${TRANSITION_DURATION_MS}ms`,
              cursor: slides.length > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
          >
            {slides.map((slide, i) => {
              const src = imageError[i] || !slide.image ? fallbackImage : slide.image;
              const isExternal = src.startsWith("http://") || src.startsWith("https://");
              const finalSrc = getImageUrl(src);
              return (
                <div
                  key={`${slide.title}-${i}`}
                  className="relative flex-shrink-0 w-full h-full"
                  style={{ width: `${100 / slides.length}%` }}
                >
                  {isExternal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={finalSrc}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => setImageError((p) => ({ ...p, [i]: true }))}
                      aria-hidden="true"
                    />
                  ) : (
                    <Image
                      src={finalSrc}
                      alt={slide.title}
                      fill
                      className="object-cover"
                      aria-hidden="true"
                      unoptimized
                    />
                  )}
                  <Container className="relative flex h-full items-end pb-8 md:pb-12">
                    <div className="w-full max-w-3xl space-y-3 bg-slate-800/60 p-6 rounded-xl">
                      <p className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-white">
                        {slide.title}{" "}
                        <span className="text-sky-500/90">{slide.highlight}</span>
                      </p>
                      <p className="w-full text-sm leading-relaxed text-white/90 md:text-base">
                        {slide.description}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {benefits.map((item) => (
                          <BenefitCard key={item.title} {...item} />
                        ))}
                      </div>
                    </div>
                  </Container>
                </div>
              );
            })}
          </div>
        ) : (
          /* Fade: stacked slides, only current visible */
          <>
            {slides.map((slide, i) => {
              const src = imageError[i] || !slide.image ? fallbackImage : slide.image;
              const isExternal = src.startsWith("http://") || src.startsWith("https://");
              const finalSrc = getImageUrl(src);
              const isActive = i === index;
              return (
                <div
                  key={`${slide.title}-${i}`}
                  className="absolute inset-0 transition-opacity ease-out"
                  style={{
                    opacity: isActive ? 1 : 0,
                    pointerEvents: isActive ? "auto" : "none",
                    zIndex: isActive ? 1 : 0,
                    transitionDuration: `${TRANSITION_DURATION_MS}ms`,
                  }}
                  aria-hidden={!isActive}
                >
                  {isExternal ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={finalSrc}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => setImageError((p) => ({ ...p, [i]: true }))}
                    />
                  ) : (
                    <Image
                      src={finalSrc}
                      alt={slide.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                  <Container className="relative flex h-full items-end pb-8 md:pb-12">
                    <div className="w-full max-w-3xl space-y-3 bg-slate-800/60 p-6 rounded-xl">
                      <p className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight text-white">
                        {slide.title}{" "}
                        <span className="text-sky-500/90">{slide.highlight}</span>
                      </p>
                      <p className="w-full text-sm leading-relaxed text-white/90 md:text-base">
                        {slide.description}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {benefits.map((item) => (
                          <BenefitCard key={item.title} {...item} />
                        ))}
                      </div>
                    </div>
                  </Container>
                </div>
              );
            })}
          </>
        )}
      </div>

      {slides.length > 1 ? (
        <Container className="relative -mt-6 flex justify-center gap-2 pb-4 md:-mt-6">
          {slides.map((slide, idx) => (
            <button
              key={`${slide.title}-${idx}`}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              aria-pressed={idx === index}
              onClick={() => goTo(idx)}
              className={`h-2 w-8 rounded-full transition cursor-pointer duration-300 ${
                idx === index
                  ? "bg-gray-100 shadow-[0_0_0_4px_rgba(0,138,236,0.25)]"
                  : "bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </Container>
      ) : null}
    </section>
  );
}


