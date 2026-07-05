// Shared admin form-field styling — one source instead of a copy per page.
// Width is intentionally left out of the base so pages can size fields with
// cn(inputCls, "w-28") without clashing utility classes (cn is clsx, no merge).
export const inputCls =
  "h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

export const inputClsFull = `${inputCls} w-full`;
