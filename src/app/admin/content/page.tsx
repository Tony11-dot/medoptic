"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ImagePositioner } from "@/components/admin/ImagePositioner";
import { StyleToolbar } from "@/components/admin/StyleToolbar";
import { ContentPreview } from "@/components/admin/ContentPreview";
import { BlockBuilder } from "@/components/admin/BlockBuilder";
import { GalleryEditor } from "@/components/admin/GalleryEditor";
import { Blocks } from "@/components/site/Blocks";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Block, BlocksPosition, GalleryImage, Locale, Localized, Review, SiteContent, TeamMember, TextStyle } from "@/lib/types";
import { STYLE_KEYS } from "@/lib/textStyle";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { cn } from "@/lib/cn";

type Tab = "hero" | "gallery" | "team" | "reviews" | "footer" | "blocks" | "backgrounds";

const BG_SECTIONS = ["home", "gallery", "team", "services", "reviews", "book"] as const;

const PREVIEW_LANGS: { code: Locale; label: string }[] = [
  { code: "he", label: "עברית" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

const emptyLocalized = (): Localized => ({ he: "", en: "", ru: "" });
const plainInput =
  "h-10 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function ContentAdmin() {
  const toast = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("hero");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<Locale>("he");

  const TABS: { id: Tab; label: string }[] = [
    { id: "hero", label: t.admin.contentTabs.hero },
    { id: "gallery", label: t.admin.contentTabs.gallery },
    { id: "team", label: t.admin.contentTabs.team },
    { id: "reviews", label: t.admin.contentTabs.reviews },
    { id: "blocks", label: t.admin.contentTabs.blocks },
    { id: "backgrounds", label: t.admin.contentTabs.backgrounds },
    { id: "footer", label: t.admin.contentTabs.footer },
  ];

  useEffect(() => {
    fetch("/api/content").then((r) => r.json()).then((d) => setContent(d.content));
  }, []);

  async function save() {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error();
      toast.success("Content saved — live on the site");
    } catch {
      toast.error("Could not save content");
    } finally {
      setSaving(false);
    }
  }

  // Section updaters keep edits immutable.
  const setHero = (patch: Partial<SiteContent["hero"]>) =>
    setContent((c) => (c ? { ...c, hero: { ...c.hero, ...patch } } : c));
  const setTeam = (patch: Partial<SiteContent["team"]>) =>
    setContent((c) => (c ? { ...c, team: { ...c.team, ...patch } } : c));
  const setFooter = (patch: Partial<SiteContent["footer"]>) =>
    setContent((c) => (c ? { ...c, footer: { ...c.footer, ...patch } } : c));
  const setStyle = (key: string, v: TextStyle) =>
    setContent((c) => (c ? { ...c, styles: { ...(c.styles ?? {}), [key]: v } } : c));
  const setBlocks = (blocks: Block[]) => setContent((c) => (c ? { ...c, blocks } : c));
  const setGallery = (gallery: GalleryImage[]) => setContent((c) => (c ? { ...c, gallery } : c));
  const setBackground = (id: string, url: string) =>
    setContent((c) => (c ? { ...c, backgrounds: { ...(c.backgrounds ?? {}), [id]: url } } : c));
  const setBlocksPosition = (blocksPosition: BlocksPosition) =>
    setContent((c) => (c ? { ...c, blocksPosition } : c));

  // Reviews (manual list + Google settings).
  const reviews = content?.reviews ?? [];
  const setReviews = (next: Review[]) => setContent((c) => (c ? { ...c, reviews: next } : c));
  const addReview = () =>
    setReviews([...reviews, { id: `r-${Date.now()}`, author: "", rating: 5, text: "", date: "", source: "manual" }]);
  const updateReview = (id: string, patch: Partial<Review>) =>
    setReviews(reviews.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeReview = (id: string) => setReviews(reviews.filter((r) => r.id !== id));
  const setGooglePlaceId = (googlePlaceId: string) =>
    setContent((c) => (c ? { ...c, googlePlaceId } : c));
  const setShowGoogleReviews = (showGoogleReviews: boolean) =>
    setContent((c) => (c ? { ...c, showGoogleReviews } : c));

  function updateMember(id: string, patch: Partial<TeamMember>) {
    setContent((c) =>
      c ? { ...c, team: { ...c.team, members: c.team.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) } } : c,
    );
  }
  function addMember() {
    const id = `t-${Date.now()}`;
    setContent((c) =>
      c
        ? { ...c, team: { ...c.team, members: [...c.team.members, { id, name: "", title: emptyLocalized(), specialty: emptyLocalized(), image: "" }] } }
        : c,
    );
  }
  function removeMember(id: string) {
    setContent((c) => (c ? { ...c, team: { ...c.team, members: c.team.members.filter((m) => m.id !== id) } } : c));
  }

  if (!content) {
    return (
      <AdminShell>
        <p className="text-muted">{t.admin.loading}</p>
      </AdminShell>
    );
  }

  // Field + its formatting toolbar.
  const styled = (label: string, value: Localized, onChange: (v: Localized) => void, key: string, opts?: { textarea?: boolean; rows?: number }) => (
    <div>
      <LocalizedField label={label} value={value} onChange={onChange} textarea={opts?.textarea} rows={opts?.rows} />
      <StyleToolbar value={content.styles?.[key]} onChange={(v) => setStyle(key, v)} />
    </div>
  );

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.titles.content}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.titles.contentSub}</p>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? t.admin.saving : t.admin.save}</Button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition",
              tab === t.id ? "bg-white text-brand-dark shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Editor */}
        <div className="space-y-5 rounded-2xl border border-line bg-white p-6 shadow-sm">
          {tab === "hero" && (
            <>
              <ImageUpload value={content.hero.image} icon="eye" onChange={(image) => setHero({ image })} />
              {content.hero.image && (
                <ImagePositioner value={content.hero.imagePosition} onChange={(imagePosition) => setHero({ imagePosition })} />
              )}
              {styled(t.admin.fields.headline, content.hero.title, (title) => setHero({ title }), STYLE_KEYS.heroTitle)}
              {styled(t.admin.fields.subtitle, content.hero.subtitle, (subtitle) => setHero({ subtitle }), STYLE_KEYS.heroSubtitle)}
              {styled(t.admin.fields.body, content.hero.body, (body) => setHero({ body }), STYLE_KEYS.heroBody, { textarea: true, rows: 4 })}
            </>
          )}

          {tab === "team" && (
            <>
              {styled(t.admin.fields.sectionHeading, content.team.heading, (heading) => setTeam({ heading }), STYLE_KEYS.teamHeading)}
              {styled(t.admin.fields.sectionDescription, content.team.body, (body) => setTeam({ body }), STYLE_KEYS.teamBody, { textarea: true })}

              <div className="space-y-4 border-t border-line pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">{t.admin.fields.teamMembers}</h3>
                  <Button size="sm" variant="subtle" onClick={addMember}>+ {t.admin.fields.addMember}</Button>
                </div>
                {content.team.members.map((m) => (
                  <div key={m.id} className="space-y-3 rounded-xl border border-line p-4">
                    <ImageUpload value={m.image} icon="user" onChange={(image) => updateMember(m.id, { image })} />
                    {m.image && (
                      <ImagePositioner value={m.imagePosition} onChange={(imagePosition) => updateMember(m.id, { imagePosition })} />
                    )}
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.fields.memberName}</span>
                      <input value={m.name} onChange={(e) => updateMember(m.id, { name: e.target.value })} className={plainInput} />
                    </label>
                    <LocalizedField label={t.admin.fields.memberTitle} value={m.title} onChange={(title) => updateMember(m.id, { title })} />
                    <LocalizedField label={t.admin.fields.memberSpecialty} value={m.specialty} onChange={(specialty) => updateMember(m.id, { specialty })} />
                    <button onClick={() => removeMember(m.id)} className="text-sm font-medium text-rose-600 hover:underline">
                      {t.admin.fields.removeMember}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "footer" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.fields.phone}</span>
                  <input dir="ltr" value={content.footer.phone} onChange={(e) => setFooter({ phone: e.target.value })} className={plainInput} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.fields.email}</span>
                  <input dir="ltr" value={content.footer.email} onChange={(e) => setFooter({ email: e.target.value })} className={plainInput} />
                </label>
              </div>
              <LocalizedField label={t.admin.fields.address} value={content.footer.address} onChange={(address) => setFooter({ address })} />
              <LocalizedField label={t.admin.fields.hours} value={content.footer.hours} onChange={(hours) => setFooter({ hours })} />

              <div className="space-y-3 border-t border-line pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink">{t.admin.fields.socialLinks}</h3>
                  <Button size="sm" variant="subtle" onClick={() => setFooter({ social: [...content.footer.social, { label: "", url: "" }] })}>
                    + {t.admin.fields.addLink}
                  </Button>
                </div>
                {content.footer.social.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      placeholder="Label"
                      value={s.label}
                      onChange={(e) => setFooter({ social: content.footer.social.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                      className={cn(plainInput, "max-w-40")}
                    />
                    <input
                      placeholder="https://…"
                      dir="ltr"
                      value={s.url}
                      onChange={(e) => setFooter({ social: content.footer.social.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })}
                      className={plainInput}
                    />
                    <button
                      onClick={() => setFooter({ social: content.footer.social.filter((_, j) => j !== i) })}
                      aria-label="Remove link"
                      className="grid size-9 shrink-0 place-items-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "gallery" && (
            <GalleryEditor
              gallery={content.gallery ?? []}
              onChange={setGallery}
              addLabel={t.admin.gallery.add}
              emptyLabel={t.admin.gallery.empty}
              captionLabel={t.admin.gallery.caption}
            />
          )}

          {tab === "blocks" && (
            <BlockBuilder
              blocks={content.blocks ?? []}
              position={content.blocksPosition ?? "afterProducts"}
              onBlocksChange={setBlocks}
              onPositionChange={setBlocksPosition}
            />
          )}

          {tab === "reviews" && (
            <div className="space-y-5">
              <p className="text-sm text-muted">{t.admin.reviews.subtitle}</p>

              {/* Manual reviews */}
              <div className="space-y-4">
                {reviews.length === 0 && <p className="text-sm text-muted">{t.admin.reviews.none}</p>}
                {reviews.map((r) => (
                  <div key={r.id} className="space-y-3 rounded-xl border border-line p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.reviews.author}</span>
                        <input value={r.author} onChange={(e) => updateReview(r.id, { author: e.target.value })} className={plainInput} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.reviews.rating}</span>
                        <select
                          value={r.rating}
                          onChange={(e) => updateReview(r.id, { rating: Number(e.target.value) })}
                          className={plainInput}
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>{"★".repeat(n)}{"☆".repeat(5 - n)} ({n})</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.reviews.text}</span>
                      <textarea
                        rows={3}
                        value={r.text}
                        onChange={(e) => updateReview(r.id, { text: e.target.value })}
                        className={cn(plainInput, "h-auto resize-none py-2.5")}
                      />
                    </label>
                    <label className="block max-w-xs">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.reviews.date}</span>
                      <input
                        value={r.date ?? ""}
                        placeholder={t.admin.reviews.datePlaceholder}
                        onChange={(e) => updateReview(r.id, { date: e.target.value })}
                        className={plainInput}
                      />
                    </label>
                    <button onClick={() => removeReview(r.id)} className="text-sm font-medium text-rose-600 hover:underline">
                      {t.admin.reviews.remove}
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="subtle" onClick={addReview}>+ {t.admin.reviews.add}</Button>
              </div>

              {/* Google reviews */}
              <div className="space-y-3 rounded-xl border border-line bg-surface/50 p-4">
                <h3 className="text-sm font-bold text-ink">{t.admin.reviews.googleTitle}</h3>
                <p className="text-xs text-muted">{t.admin.reviews.googleHelp}</p>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!content.showGoogleReviews}
                    onChange={(e) => setShowGoogleReviews(e.target.checked)}
                    className="size-4"
                  />
                  <span className="text-sm font-semibold text-ink">{t.admin.reviews.showGoogle}</span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.reviews.placeId}</span>
                  <input
                    dir="ltr"
                    value={content.googlePlaceId ?? ""}
                    onChange={(e) => setGooglePlaceId(e.target.value)}
                    className={plainInput}
                    placeholder="ChIJ…"
                  />
                  <span className="mt-1 block text-xs text-muted">{t.admin.reviews.placeIdHint}</span>
                </label>
              </div>
            </div>
          )}

          {tab === "backgrounds" && (
            <div className="space-y-5">
              <p className="text-sm text-muted">{t.admin.bg.subtitle}</p>
              {BG_SECTIONS.map((id) => (
                <div key={id} className="rounded-xl border border-line p-4">
                  <p className="mb-2 text-sm font-bold text-ink">{t.nav[id]}</p>
                  <ImageUpload value={content.backgrounds?.[id] ?? ""} icon="eye" onChange={(url) => setBackground(id, url)} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-6">
          <div className="mb-2 flex items-center justify-end gap-1 rounded-lg bg-surface p-1">
            <span className="me-auto ps-2 text-xs font-semibold text-muted">{t.admin.fields.previewLanguage}</span>
            {PREVIEW_LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setPreviewLocale(l.code)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                  previewLocale === l.code ? "bg-white text-brand-dark shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          {tab === "blocks" ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line bg-surface px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
                Live preview (exact site rendering)
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                {(content.blocks ?? []).length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted">Add blocks to see them here.</p>
                ) : (
                  <Blocks
                    blocks={content.blocks ?? []}
                    pick={(v) => v?.[previewLocale] || v?.he || ""}
                    dir={previewLocale === "he" ? "rtl" : "ltr"}
                  />
                )}
              </div>
            </div>
          ) : tab === "gallery" ? (
            <div className="overflow-hidden rounded-2xl border border-line bg-white p-4" dir={previewLocale === "he" ? "rtl" : "ltr"}>
              {(content.gallery ?? []).length === 0 ? (
                <p className="p-8 text-center text-sm text-muted">{t.admin.gallery.empty}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {(content.gallery ?? []).map((g, n) => (
                    <div key={g.id} className="overflow-hidden rounded-xl border border-line">
                      <div className="aspect-video">
                        <ImageBlock src={g.image} alt="" icon="eye" rounded="rounded-none" />
                      </div>
                      {(g.caption?.[previewLocale] || g.caption?.he) && (
                        <p className="truncate px-2 py-1.5 text-xs font-semibold text-ink">{g.caption?.[previewLocale] || g.caption?.he}</p>
                      )}
                      <span className="block px-2 pb-1.5 text-[10px] text-muted">#{n + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <ContentPreview content={content} locale={previewLocale} tab={tab} />
          )}
        </div>
      </div>
    </AdminShell>
  );
}
