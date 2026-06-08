"use client";

import type { CSSProperties } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  titleStyle,
  subtitleStyle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  titleStyle?: CSSProperties;
  subtitleStyle?: CSSProperties;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <Reveal>
        <span className="inline-block rounded-full bg-brand-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-brand">
          {eyebrow}
        </span>
      </Reveal>
      <Reveal index={1}>
        <h2 style={titleStyle} className="mt-4 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h2>
      </Reveal>
      {subtitle && (
        <Reveal index={2}>
          <p style={subtitleStyle} className="mt-3 text-base text-muted md:text-lg">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}
