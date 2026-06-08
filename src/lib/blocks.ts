// Shared helpers for the custom content blocks (admin block builder + site).
import type { Block, BlockType, BlockWidth, BlocksPosition } from "./types";

// Max-width per width option. Always w-full first so blocks fill the screen on
// phones, then cap on larger screens — keeps every device looking natural.
export const WIDTH_CLASS: Record<BlockWidth, string> = {
  full: "w-full",
  wide: "w-full max-w-4xl",
  medium: "w-full max-w-2xl",
  narrow: "w-full max-w-lg",
};

export const JUSTIFY_CLASS: Record<Block["align"], string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

export const WIDTH_LABEL: Record<BlockWidth, string> = {
  full: "Full",
  wide: "Wide",
  medium: "Medium",
  narrow: "Narrow",
};

export const BLOCK_TYPE_LABEL: Record<BlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  image: "Image",
  button: "Button",
};

export const POSITION_LABEL: Record<BlocksPosition, string> = {
  afterHero: "Top — just below the hero",
  afterProducts: "Middle — after the products",
  beforeBooking: "Before the booking form",
  beforeFooter: "Bottom — above the footer",
};

export function newBlock(type: BlockType, id: string): Block {
  return {
    id,
    type,
    text: type === "image" ? undefined : { he: "", en: "", ru: "" },
    image: type === "image" ? "" : undefined,
    href: type === "button" ? "#book" : undefined,
    style: {},
    align: "center",
    width: type === "image" ? "medium" : "wide",
  };
}
