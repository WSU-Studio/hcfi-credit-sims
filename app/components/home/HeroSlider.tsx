'use client';

import { useState } from "react";
import type { Benefit, Slide } from "@/app/types";
import { Container } from "../ui/Container";
import { BenefitCard } from "../ui/BenefitCard";

type HeroSliderProps = {
  slides: Slide[];
  benefits: Benefit[];
};

export function HeroSlider({ slides, benefits }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const current = slides[index] ?? slides[0];

  if (!current) return null;

  return (
    <section id="hero" className="relative isolate overflow-hidden bg-black">
      <div className="relative h-[540px] w-full md:h-[680px]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-[background-image]"
          style={{ backgroundImage: `url(${current.image})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10" />

        <Container className="relative flex h-full items-end pb-12 md:pb-16">
          <div className="max-w-2xl space-y-5">
            <p className="text-3xl font-semibold leading-tight text-white md:text-4xl">
              {current.title}{" "}
              <span className="text-[var(--accent)]">{current.highlight}</span>
            </p>
            <p className="max-w-xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
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
              onClick={() => setIndex(idx)}
              className={`h-2 w-8 rounded-full transition ${
                idx === index
                  ? "bg-[var(--accent)] shadow-[0_0_0_4px_rgba(59,130,246,0.25)]"
                  : "bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </Container>
      ) : null}
    </section>
  );
}


