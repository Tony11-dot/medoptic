"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ImagePositioner } from "@/components/admin/ImagePositioner";
import { StyleToolbar } from "@/components/admin/StyleToolbar";
import { BlockBuilder } from "@/components/admin/BlockBuilder";
import { GalleryEditor } from "@/components/admin/GalleryEditor";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Block, BlocksPosition, GalleryImage, Localized, Review, Service, SiteContent, TeamMember, TextStyle } from "@/lib/types";
import { STYLE_KEYS } from "@/lib/textStyle";
import { cn } from "@/lib/cn";

type Tab = "hero" | "gallery" | "team" | "services" | "reviews" | "essays" | "footer" | "blocks" | "backgrounds";

const BG_SECTIONS = ["home", "gallery", "team", "services", "reviews", "book"] as const;

const emptyLocalized = (): Localized => ({ he: "", en: "", ru: "" });
const plainInput =
  "h-10 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function ContentAdmin() {
  const toast = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("hero");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  // Services (queue types) live in their own store; edited inline here and
  // synced to /api/services on save. We keep the originally-loaded list to diff
  // against (to know what to create / update / delete).
  const [services, setServices] = useState<Service[]>([]);
  const [servicesOriginal, setServicesOriginal] = useState<Service[]>([]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "hero", label: t.admin.contentTabs.hero },
    { id: "gallery", label: t.admin.contentTabs.gallery },
    { id: "team", label: t.admin.contentTabs.team },
    { id: "services", label: t.admin.contentTabs.services },
    { id: "reviews", label: t.admin.contentTabs.reviews },
    { id: "essays", label: t.admin.contentTabs.essays },
    { id: "blocks", label: t.admin.contentTabs.blocks },
    { id: "backgrounds", label: t.admin.contentTabs.backgrounds },
    { id: "footer", label: t.admin.contentTabs.footer },
  ];

  useEffect(() => {
    fetch("/api/content").then((r) => r.json()).then((d) => setContent(d.content));
    fetch("/api/services?all=1").then((r) => r.json()).then((d) => {
      const list: Service[] = d.services ?? [];
      setServices(list);
      setServicesOriginal(list);
    });
  }, []);

  // Push the inline service edits to the services API: delete removed ones,
  // create new ones (temp id "new-…"), and patch the rest with their order.
  async function syncServices() {
    const removed = servicesOriginal.filter((o) => !services.some((s) => s.id === o.id));
    await Promise.all(removed.map((s) => fetch(`/api/services/${s.id}`, { method: "DELETE" })));
    await Promise.all(
      services.map((s, i) => {
        const body = JSON.stringify({
          label: s.label,
          description: s.description,
          image: s.image ?? "",
          images: (s.images ?? []).filter(Boolean),
          imagePosition: s.imagePosition,
          aspectRatio: s.aspectRatio,
          detailBg: s.detailBg ?? "",
          enabled: s.enabled,
          order: i,
        });
        const isNew = s.id.startsWith("new-");
        return fetch(isNew ? "/api/services" : `/api/services/${s.id}`, {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        });
      }),
    );
  }

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
      await syncServices();
      const fresh = await fetch("/api/services?all=1").then((r) => r.json());
      setServices(fresh.services ?? []);
      setServicesOriginal(fresh.services ?? []);
      setPreviewKey((k) => k + 1); // reload the live preview with saved changes
      toast.success(t.admin.toasts.saved);
    } catch {
      toast.error(t.admin.toasts.saveError);
    } finally {
      setSaving(false);
    }
  }

  // Inline service (queue type) editing.
  const updateService = (id: string, patch: Partial<Service>) =>
    setServices((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeService = (id: string) => setServices((list) => list.filter((s) => s.id !== id));
  const addService = () =>
    setServices((list) => [
      ...list,
      {
        id: `new-${Date.now()}`,
        label: emptyLocalized(),
        description: emptyLocalized(),
        image: "",
        imagePosition: "center",
        enabled: true,
        order: list.length,
        createdAt: new Date().toISOString(),
      },
    ]);
  // Extra detail-gallery photos for a service.
  const addServiceImage = (id: string) =>
    setServices((list) => list.map((s) => (s.id === id ? { ...s, images: [...(s.images ?? []), ""] } : s)));
  const setServiceImage = (id: string, idx: number, url: string) =>
    setServices((list) => list.map((s) => (s.id === id ? { ...s, images: (s.images ?? []).map((im, i) => (i === idx ? url : im)) } : s)));
  const removeServiceImage = (id: string, idx: number) =>
    setServices((list) => list.map((s) => (s.id === id ? { ...s, images: (s.images ?? []).filter((_, i) => i !== idx) } : s)));
  // Promote a gallery photo to be the card "face": swap it into the cover slot
  // (the old cover, if any, moves back into the gallery).
  const setServiceCover = (id: string, idx: number) =>
    setServices((list) =>
      list.map((s) => {
        if (s.id !== id) return s;
        const imgs = [...(s.images ?? [])];
        const chosen = imgs[idx];
        if (!chosen) return s;
        imgs[idx] = s.image ?? "";
        return { ...s, image: chosen, images: imgs.filter(Boolean) };
      }),
    );
  const moveService = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= services.length) return;
    setServices((list) => {
      const next = [...list];
      const [m] = next.splice(index, 1);
      next.splice(target, 0, m);
      return next;
    });
  };

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

  // Essays (text over a background image).
  const essays = content?.essays ?? [];
  const setEssays = (next: typeof essays) => setContent((c) => (c ? { ...c, essays: next } : c));
  const addEssay = () =>
    setEssays([...essays, { id: `e-${Date.now()}`, title: emptyLocalized(), body: emptyLocalized(), image: "", imagePosition: "center" }]);
  const updateEssay = (id: string, patch: Partial<(typeof essays)[number]>) =>
    setEssays(essays.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const removeEssay = (id: string) => setEssays(essays.filter((e) => e.id !== id));

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
                <ImagePositioner src={content.hero.image} value={content.hero.imagePosition} onChange={(imagePosition) => setHero({ imagePosition })} aspectRatio={content.hero.aspectRatio ?? "4 / 5"} onAspectChange={(aspectRatio) => setHero({ aspectRatio })} />
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
                      <ImagePositioner src={m.image} value={m.imagePosition} onChange={(imagePosition) => updateMember(m.id, { imagePosition })} aspectRatio={m.aspectRatio ?? "4 / 3"} onAspectChange={(aspectRatio) => updateMember(m.id, { aspectRatio })} />
                    )}
                    <div>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.fields.memberName}</span>
                        <input value={m.name} onChange={(e) => updateMember(m.id, { name: e.target.value })} className={plainInput} />
                      </label>
                      <StyleToolbar value={content.styles?.[`team.member.${m.id}.name`]} onChange={(v) => setStyle(`team.member.${m.id}.name`, v)} />
                    </div>
                    {styled(t.admin.fields.memberTitle, m.title, (title) => updateMember(m.id, { title }), `team.member.${m.id}.title`)}
                    {styled(t.admin.fields.memberSpecialty, m.specialty, (specialty) => updateMember(m.id, { specialty }), `team.member.${m.id}.specialty`)}
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
              {styled(t.admin.fields.address, content.footer.address, (address) => setFooter({ address }), "footer.address")}
              {styled(t.admin.fields.hours, content.footer.hours, (hours) => setFooter({ hours }), "footer.hours")}

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
                      placeholder={t.admin.fields.linkLabel}
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
              styles={content.styles}
              onStyle={setStyle}
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

          {tab === "services" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted">{t.admin.titles.queueTypesSub}</p>
                <Button size="sm" variant="subtle" onClick={addService}>+ {t.admin.actions.add}</Button>
              </div>
              {services.length === 0 && <p className="text-sm text-muted">{t.admin.svc.none}</p>}
              {services.map((s, i) => (
                <div key={s.id} className="space-y-3 rounded-xl border border-line p-4">
                  <div className="flex items-center gap-1">
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-dark">#{i + 1}</span>
                    <div className="ms-auto flex items-center gap-1">
                      <button type="button" onClick={() => moveService(i, -1)} disabled={i === 0} aria-label="up" className="grid size-7 place-items-center rounded-md border border-line text-muted transition hover:border-brand disabled:opacity-30">↑</button>
                      <button type="button" onClick={() => moveService(i, 1)} disabled={i === services.length - 1} aria-label="down" className="grid size-7 place-items-center rounded-md border border-line text-muted transition hover:border-brand disabled:opacity-30">↓</button>
                      <button type="button" onClick={() => removeService(s.id)} aria-label="delete" className="grid size-7 place-items-center rounded-md bg-rose-50 text-rose-600 transition hover:bg-rose-100">✕</button>
                    </div>
                  </div>
                  <span className="block text-sm font-semibold text-ink">
                    {t.admin.svc.cover} <span className="font-normal text-muted">— {t.admin.svc.coverHint}</span>
                  </span>
                  <ImageUpload value={s.image ?? ""} icon="glasses" onChange={(image) => updateService(s.id, { image })} />
                  {s.image && (
                    <ImagePositioner src={s.image} value={s.imagePosition} onChange={(imagePosition) => updateService(s.id, { imagePosition })} aspectRatio={s.aspectRatio ?? "16 / 10"} onAspectChange={(aspectRatio) => updateService(s.id, { aspectRatio })} />
                  )}
                  <LocalizedField label={t.admin.svc.name} value={s.label} onChange={(label) => updateService(s.id, { label })} />
                  <LocalizedField label={t.admin.svc.description} textarea value={s.description} onChange={(description) => updateService(s.id, { description })} />
                  <div className="space-y-2 border-t border-line pt-3">
                    <span className="block text-sm font-semibold text-ink">
                      {t.admin.svc.gallery} <span className="font-normal text-muted">— {t.admin.svc.galleryHint}</span>
                    </span>
                    {(s.images ?? []).map((img, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="flex-1">
                          <ImageUpload value={img} icon="glasses" onChange={(url) => setServiceImage(s.id, idx, url)} />
                        </div>
                        {img && (
                          <button
                            type="button"
                            onClick={() => setServiceCover(s.id, idx)}
                            title={t.admin.svc.setCover}
                            className="shrink-0 rounded-md border border-line px-2 py-1 text-xs font-semibold text-brand-dark transition hover:border-brand"
                          >
                            ★ {t.admin.svc.setCover}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeServiceImage(s.id, idx)}
                          aria-label={t.admin.actions.delete}
                          className="grid size-7 shrink-0 place-items-center rounded-md bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <Button size="sm" variant="subtle" onClick={() => addServiceImage(s.id)}>+ {t.admin.svc.addPhoto}</Button>
                  </div>
                  <div>
                    <span className="mb-1.5 block text-sm font-semibold text-ink">
                      {t.admin.svc.detailBg} <span className="font-normal text-muted">— {t.admin.svc.detailBgHint}</span>
                    </span>
                    <ImageUpload value={s.detailBg ?? ""} icon="eye" onChange={(detailBg) => updateService(s.id, { detailBg })} />
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
                    <input type="checkbox" checked={s.enabled} onChange={(e) => updateService(s.id, { enabled: e.target.checked })} className="size-4" />
                    <span className="text-sm font-semibold text-ink">{t.admin.svc.show}</span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {tab === "essays" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted">{t.admin.essay.subtitle}</p>
                <Button size="sm" variant="subtle" onClick={addEssay}>+ {t.admin.essay.add}</Button>
              </div>
              {essays.length === 0 && <p className="text-sm text-muted">{t.admin.essay.none}</p>}
              {essays.map((e) => (
                <div key={e.id} className="space-y-3 rounded-xl border border-line p-4">
                  <ImageUpload value={e.image ?? ""} icon="eye" onChange={(image) => updateEssay(e.id, { image })} />
                  {e.image && (
                    <ImagePositioner src={e.image} value={e.imagePosition} onChange={(imagePosition) => updateEssay(e.id, { imagePosition })} aspectRatio="16 / 9" />
                  )}
                  <LocalizedField label={t.admin.essay.titleField} value={e.title} onChange={(title) => updateEssay(e.id, { title })} />
                  <LocalizedField label={t.admin.essay.bodyField} textarea rows={5} value={e.body} onChange={(body) => updateEssay(e.id, { body })} />
                  <button onClick={() => removeEssay(e.id)} className="text-sm font-medium text-rose-600 hover:underline">
                    {t.admin.essay.remove}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-5">
              <p className="text-sm text-muted">{t.admin.reviews.subtitle}</p>

              {/* Manual reviews */}
              <div className="space-y-4">
                {reviews.length === 0 && <p className="text-sm text-muted">{t.admin.reviews.none}</p>}
                {reviews.map((r) => {
                  const type = r.source ?? (r.image ? "google" : "manual");
                  return (
                  <div key={r.id} className={cn("space-y-3 rounded-xl border p-4", r.approved === false ? "border-amber-300 bg-amber-50/40" : "border-line")}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={r.approved !== false} onChange={(e) => updateReview(r.id, { approved: e.target.checked })} className="size-4" />
                      <span className="text-sm font-semibold text-ink">{t.admin.reviews.visible}</span>
                      {r.approved === false && <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{t.admin.reviews.pending}</span>}
                    </label>
                    <div className="flex gap-1 rounded-lg bg-surface p-0.5">
                      <button type="button" onClick={() => updateReview(r.id, { source: "manual" })} className={cn("flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition", type === "manual" ? "bg-white text-brand-dark shadow-sm" : "text-muted")}>
                        {t.admin.reviews.typed}
                      </button>
                      <button type="button" onClick={() => updateReview(r.id, { source: "google" })} className={cn("flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition", type === "google" ? "bg-white text-brand-dark shadow-sm" : "text-muted")}>
                        {t.admin.reviews.googlePhoto}
                      </button>
                    </div>

                    {type === "google" ? (
                      <>
                        <p className="text-xs text-muted">{t.admin.reviews.googlePhotoHint}</p>
                        <ImageUpload value={r.image ?? ""} icon="user" onChange={(image) => updateReview(r.id, { image })} />
                        <ImagePositioner
                          src={r.image}
                          value={r.imagePosition}
                          onChange={(imagePosition) => updateReview(r.id, { imagePosition })}
                          aspectRatio={r.aspectRatio ?? "3 / 4"}
                          onAspectChange={(aspectRatio) => updateReview(r.id, { aspectRatio })}
                        />
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                    <button onClick={() => removeReview(r.id)} className="text-sm font-medium text-rose-600 hover:underline">
                      {t.admin.reviews.remove}
                    </button>
                  </div>
                  );
                })}
                <Button size="sm" variant="subtle" onClick={addReview}>+ {t.admin.reviews.add}</Button>
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

        {/* Live preview — the real site, reloaded after each save */}
        <div className="lg:sticky lg:top-6">
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-1.5">
            <span className="text-xs font-semibold text-muted">{t.admin.preview.label}</span>
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-brand-dark shadow-sm transition hover:text-brand"
            >
              ↻ {t.admin.refresh}
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <iframe key={previewKey} src="/" title="Live preview" className="h-[78vh] w-full" />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
