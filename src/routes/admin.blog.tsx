import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, StatusBadge, type Column } from "@/components/admin/DataTable";
import { Modal, ModalField } from "@/components/admin/Modal";
import { useLanguage } from "@/lib/i18n";
import {
  loadBlogPosts,
  newBlockId,
  saveBlogPosts,
  slugify,
  tx,
  type BlogBlock,
  type BlogInline,
  type BlogPost,
  type Localized,
} from "@/data/blog";
import { saveBlogPosts as saveCmsBlogPosts } from "@/services/adminCmsService";
import type { BlogContent } from "@/types/content";
import { cn } from "@/lib/utils";
import gallery1 from "@/assets/gallery/gallery-01-marina.jpg";

export const Route = createFileRoute("/admin/blog")({
  head: () => ({
    meta: [
      { title: "Blog — lunayairmarina Admin" },
      { name: "description", content: "Create and edit SEO-optimized blog posts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBlogPage,
});

type Draft = {
  titleEn: string;
  titleAr: string;
  slug: string;
  excerptEn: string;
  excerptAr: string;
  coverImage: string;
  coverAltEn: string;
  coverAltAr: string;
  authorEn: string;
  authorAr: string;
  status: "published" | "draft";
  seoTitleEn: string;
  seoTitleAr: string;
  seoDescriptionEn: string;
  seoDescriptionAr: string;
  focusKeywordEn: string;
  focusKeywordAr: string;
  tagsEn: string;
  tagsAr: string;
  blocks: BlogBlock[];
};

const emptyLocalized = (en = "", ar = ""): Localized => ({ en, ar });

const emptyDraft = (): Draft => ({
  titleEn: "",
  titleAr: "",
  slug: "",
  excerptEn: "",
  excerptAr: "",
  coverImage: gallery1,
  coverAltEn: "",
  coverAltAr: "",
  authorEn: "lunayairmarina Editorial",
  authorAr: "فريق تحرير lunayairmarina",
  status: "draft",
  seoTitleEn: "",
  seoTitleAr: "",
  seoDescriptionEn: "",
  seoDescriptionAr: "",
  focusKeywordEn: "",
  focusKeywordAr: "",
  tagsEn: "",
  tagsAr: "",
  blocks: [
    {
      id: newBlockId(),
      type: "paragraph",
      spans: [{ type: "text", text: emptyLocalized() }],
    },
  ],
});

function paragraphText(spans: BlogInline[], lang: "en" | "ar") {
  return spans.map((span) => tx(span.text, lang)).join("");
}

function AdminBlogPage() {
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<BlogPost[]>(() => loadBlogPosts());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const persist = (next: BlogPost[]) => {
    setRows(next);
    saveBlogPosts(next);
    const cmsRows: BlogContent[] = next.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      content: post.excerpt,
      excerpt: post.excerpt,
      image: post.coverImage,
      coverImage: post.coverImage,
      coverAlt: post.coverAlt,
      date: post.publishedAt,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      status: post.status,
      author: post.author,
      blocks: post.blocks,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      focusKeyword: post.focusKeyword,
      tags: post.tags,
    }));
    void saveCmsBlogPosts(cmsRows);
  };

  const save = () => {
    if (!draft.titleEn.trim() || !draft.slug.trim()) return;
    const now = new Date().toISOString();
    const title = emptyLocalized(draft.titleEn.trim(), draft.titleAr.trim() || draft.titleEn.trim());
    const excerpt = emptyLocalized(
      draft.excerptEn.trim(),
      draft.excerptAr.trim() || draft.excerptEn.trim(),
    );
    const tagsEn = draft.tagsEn
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const tagsAr = draft.tagsAr
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const tags =
      tagsEn.length === 0
        ? []
        : tagsEn.map((en, index) => emptyLocalized(en, tagsAr[index] || en));

    const payload: Omit<BlogPost, "id" | "publishedAt"> & { publishedAt?: string } = {
      slug: slugify(draft.slug),
      title,
      excerpt,
      coverImage: draft.coverImage.trim() || gallery1,
      coverAlt: emptyLocalized(
        draft.coverAltEn.trim() || draft.titleEn.trim(),
        draft.coverAltAr.trim() || draft.titleAr.trim() || draft.titleEn.trim(),
      ),
      author: emptyLocalized(
        draft.authorEn.trim() || "lunayairmarina",
        draft.authorAr.trim() || draft.authorEn.trim() || "lunayairmarina",
      ),
      updatedAt: now,
      status: draft.status,
      seoTitle: emptyLocalized(
        draft.seoTitleEn.trim() || draft.titleEn.trim(),
        draft.seoTitleAr.trim() || draft.titleAr.trim() || draft.titleEn.trim(),
      ),
      seoDescription: emptyLocalized(
        draft.seoDescriptionEn.trim() || draft.excerptEn.trim(),
        draft.seoDescriptionAr.trim() || draft.excerptAr.trim() || draft.excerptEn.trim(),
      ),
      focusKeyword: emptyLocalized(draft.focusKeywordEn.trim(), draft.focusKeywordAr.trim()),
      tags,
      blocks: draft.blocks,
    };

    if (editingId) {
      persist(
        rows.map((row) =>
          row.id === editingId
            ? {
                ...row,
                ...payload,
                publishedAt: row.publishedAt,
              }
            : row,
        ),
      );
    } else {
      persist([
        ...rows,
        {
          id: `b${Date.now()}`,
          publishedAt: now,
          ...payload,
        } as BlogPost,
      ]);
    }

    setOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setOpen(true);
  };

  const openEdit = (row: BlogPost) => {
    setEditingId(row.id);
    setDraft({
      titleEn: tx(row.title, "en"),
      titleAr: tx(row.title, "ar"),
      slug: row.slug,
      excerptEn: tx(row.excerpt, "en"),
      excerptAr: tx(row.excerpt, "ar"),
      coverImage: row.coverImage,
      coverAltEn: tx(row.coverAlt, "en"),
      coverAltAr: tx(row.coverAlt, "ar"),
      authorEn: tx(row.author, "en"),
      authorAr: tx(row.author, "ar"),
      status: row.status,
      seoTitleEn: tx(row.seoTitle, "en"),
      seoTitleAr: tx(row.seoTitle, "ar"),
      seoDescriptionEn: tx(row.seoDescription, "en"),
      seoDescriptionAr: tx(row.seoDescription, "ar"),
      focusKeywordEn: tx(row.focusKeyword, "en"),
      focusKeywordAr: tx(row.focusKeyword, "ar"),
      tagsEn: row.tags.map((tag) => tx(tag, "en")).join(", "),
      tagsAr: row.tags.map((tag) => tx(tag, "ar")).join(", "),
      blocks: row.blocks,
    });
    setOpen(true);
  };

  const updateBlock = (id: string, patch: Partial<BlogBlock>) => {
    setDraft((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === id ? ({ ...block, ...patch } as BlogBlock) : block,
      ),
    }));
  };

  const addBlock = (type: BlogBlock["type"]) => {
    const id = newBlockId();
    let block: BlogBlock;
    if (type === "heading") block = { id, type, level: 2, text: emptyLocalized() };
    else if (type === "image")
      block = { id, type, src: gallery1, alt: emptyLocalized(), caption: emptyLocalized() };
    else if (type === "quote") block = { id, type, text: emptyLocalized() };
    else block = { id, type: "paragraph", spans: [{ type: "text", text: emptyLocalized() }] };
    setDraft((current) => ({ ...current, blocks: [...current.blocks, block] }));
  };

  const columns: Column<BlogPost>[] = useMemo(
    () => [
      {
        key: "title",
        header: t("admin.blog.postTitle"),
        render: (row) => (
          <div>
            <p className="font-medium text-navy">{tx(row.title, language)}</p>
            <p className="text-xs text-muted-foreground">/blog/{row.slug}</p>
          </div>
        ),
      },
      {
        key: "keyword",
        header: t("admin.blog.focusKeyword"),
        render: (row) => (
          <span className="text-navy/80">{tx(row.focusKeyword, language) || "—"}</span>
        ),
      },
      {
        key: "status",
        header: t("admin.table.status"),
        render: (row) => (
          <StatusBadge
            label={row.status === "published" ? t("admin.status.active") : t("admin.status.draft")}
            tone={row.status === "published" ? "active" : "draft"}
          />
        ),
      },
    ],
    [t, language],
  );

  return (
    <AdminLayout title={t("admin.nav.blog")}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-muted-foreground">{t("admin.blog.subtitle")}</p>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-xs tracking-[0.18em] text-white uppercase transition-colors hover:bg-navy/90"
        >
          <Plus className="size-4" strokeWidth={1.5} />
          {t("admin.blog.add")}
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        actions={(row) => (
          <>
            <RowAction icon={Pencil} label={t("admin.actions.edit")} onClick={() => openEdit(row)} />
            <RowAction
              icon={Trash2}
              tone="danger"
              label={t("admin.actions.delete")}
              onClick={() => persist(rows.filter((item) => item.id !== row.id))}
            />
          </>
        )}
      />

      <Modal
        open={open}
        title={editingId ? t("admin.blog.edit") : t("admin.blog.add")}
        onClose={() => setOpen(false)}
        onSubmit={save}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <ModalField
            label={`${t("admin.blog.postTitle")} (EN)`}
            value={draft.titleEn}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                titleEn: value,
                slug: current.slug || slugify(value),
                seoTitleEn: current.seoTitleEn || value,
              }))
            }
          />
          <ModalField
            label={`${t("admin.blog.postTitle")} (AR)`}
            value={draft.titleAr}
            onChange={(value) => setDraft({ ...draft, titleAr: value })}
          />
        </div>
        <ModalField
          label={t("admin.blog.slug")}
          value={draft.slug}
          onChange={(value) => setDraft({ ...draft, slug: slugify(value) })}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <ModalField
            textarea
            label={`${t("admin.blog.excerpt")} (EN)`}
            value={draft.excerptEn}
            onChange={(value) => setDraft({ ...draft, excerptEn: value })}
          />
          <ModalField
            textarea
            label={`${t("admin.blog.excerpt")} (AR)`}
            value={draft.excerptAr}
            onChange={(value) => setDraft({ ...draft, excerptAr: value })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ModalField
            label={t("admin.blog.coverImage")}
            value={draft.coverImage}
            onChange={(value) => setDraft({ ...draft, coverImage: value })}
          />
          <ModalField
            label={`${t("admin.blog.coverAlt")} (EN)`}
            value={draft.coverAltEn}
            onChange={(value) => setDraft({ ...draft, coverAltEn: value })}
          />
          <ModalField
            label={`${t("admin.blog.coverAlt")} (AR)`}
            value={draft.coverAltAr}
            onChange={(value) => setDraft({ ...draft, coverAltAr: value })}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <ModalField
            label={`${t("admin.blog.author")} (EN)`}
            value={draft.authorEn}
            onChange={(value) => setDraft({ ...draft, authorEn: value })}
          />
          <ModalField
            label={`${t("admin.blog.author")} (AR)`}
            value={draft.authorAr}
            onChange={(value) => setDraft({ ...draft, authorAr: value })}
          />
          <label className="flex flex-col gap-2">
            <span className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase">
              {t("admin.table.status")}
            </span>
            <select
              value={draft.status}
              onChange={(event) =>
                setDraft({ ...draft, status: event.target.value as "published" | "draft" })
              }
              className="rounded-md border border-navy/10 bg-[#faf8f4] px-4 py-3 text-sm outline-none focus:border-navy/30"
            >
              <option value="draft">{t("admin.status.draft")}</option>
              <option value="published">{t("admin.status.active")}</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
          <p className="text-[0.65rem] tracking-[0.2em] text-gold uppercase">{t("admin.blog.seoBox")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ModalField
              label={`${t("admin.blog.seoTitle")} (EN)`}
              value={draft.seoTitleEn}
              onChange={(value) => setDraft({ ...draft, seoTitleEn: value })}
            />
            <ModalField
              label={`${t("admin.blog.seoTitle")} (AR)`}
              value={draft.seoTitleAr}
              onChange={(value) => setDraft({ ...draft, seoTitleAr: value })}
            />
            <ModalField
              textarea
              label={`${t("admin.blog.seoDescription")} (EN)`}
              value={draft.seoDescriptionEn}
              onChange={(value) => setDraft({ ...draft, seoDescriptionEn: value })}
            />
            <ModalField
              textarea
              label={`${t("admin.blog.seoDescription")} (AR)`}
              value={draft.seoDescriptionAr}
              onChange={(value) => setDraft({ ...draft, seoDescriptionAr: value })}
            />
            <ModalField
              label={`${t("admin.blog.focusKeyword")} (EN)`}
              value={draft.focusKeywordEn}
              onChange={(value) => setDraft({ ...draft, focusKeywordEn: value })}
            />
            <ModalField
              label={`${t("admin.blog.focusKeyword")} (AR)`}
              value={draft.focusKeywordAr}
              onChange={(value) => setDraft({ ...draft, focusKeywordAr: value })}
            />
            <ModalField
              label={`${t("admin.blog.tags")} (EN)`}
              value={draft.tagsEn}
              onChange={(value) => setDraft({ ...draft, tagsEn: value })}
            />
            <ModalField
              label={`${t("admin.blog.tags")} (AR)`}
              value={draft.tagsAr}
              onChange={(value) => setDraft({ ...draft, tagsAr: value })}
            />
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase">
              {t("admin.blog.contentBlocks")}
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["paragraph", t("admin.blog.addParagraph")],
                  ["heading", t("admin.blog.addHeading")],
                  ["image", t("admin.blog.addImage")],
                  ["quote", t("admin.blog.addQuote")],
                ] as const
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className="rounded-md border border-navy/10 px-3 py-1.5 text-[0.65rem] tracking-[0.12em] text-navy uppercase hover:border-navy/25"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {draft.blocks.map((block, index) => (
              <div key={block.id} className="rounded-md border border-navy/10 bg-[#faf8f4] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[0.65rem] tracking-[0.16em] text-gold uppercase">
                    {block.type} #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        blocks: current.blocks.filter((item) => item.id !== block.id),
                      }))
                    }
                    className="text-xs text-destructive"
                  >
                    {t("admin.actions.delete")}
                  </button>
                </div>

                {block.type === "paragraph" ? (
                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      value={paragraphText(block.spans, "en")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          spans: [
                            {
                              type: "text",
                              text: {
                                en: event.target.value,
                                ar: paragraphText(block.spans, "ar"),
                              },
                            },
                          ],
                        })
                      }
                      className="w-full resize-none rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                      placeholder={`${t("admin.blog.paragraphPlaceholder")} (EN)`}
                    />
                    <textarea
                      rows={3}
                      value={paragraphText(block.spans, "ar")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          spans: [
                            {
                              type: "text",
                              text: {
                                en: paragraphText(block.spans, "en"),
                                ar: event.target.value,
                              },
                            },
                          ],
                        })
                      }
                      className="w-full resize-none rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                      placeholder={`${t("admin.blog.paragraphPlaceholder")} (AR)`}
                      dir="rtl"
                    />
                    <KeywordLinker
                      label={t("admin.blog.keywordLink")}
                      onApply={(keywordEn, keywordAr, href) => {
                        const textEn = paragraphText(block.spans, "en");
                        const textAr = paragraphText(block.spans, "ar");
                        if (!keywordEn || !href || !textEn.includes(keywordEn)) return;
                        const [before, ...rest] = textEn.split(keywordEn);
                        const after = rest.join(keywordEn);
                        const spans: BlogInline[] = [];
                        if (before) spans.push({ type: "text", text: { en: before, ar: "" } });
                        spans.push({
                          type: "keyword",
                          text: { en: keywordEn, ar: keywordAr || keywordEn },
                          href,
                        });
                        if (after) spans.push({ type: "text", text: { en: after, ar: textAr } });
                        else if (textAr) spans.push({ type: "text", text: { en: "", ar: textAr } });
                        updateBlock(block.id, { spans });
                      }}
                    />
                  </div>
                ) : null}

                {block.type === "heading" ? (
                  <div className="grid gap-3">
                    <select
                      value={block.level}
                      onChange={(event) =>
                        updateBlock(block.id, { level: Number(event.target.value) as 2 | 3 })
                      }
                      className="rounded-md border border-navy/10 px-3 py-2 text-sm sm:max-w-[7rem]"
                    >
                      <option value={2}>H2</option>
                      <option value={3}>H3</option>
                    </select>
                    <input
                      value={tx(block.text, "en")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          text: { en: event.target.value, ar: tx(block.text, "ar") },
                        })
                      }
                      placeholder="Heading EN"
                      className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                    />
                    <input
                      value={tx(block.text, "ar")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          text: { en: tx(block.text, "en"), ar: event.target.value },
                        })
                      }
                      placeholder="Heading AR"
                      dir="rtl"
                      className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                    />
                  </div>
                ) : null}

                {block.type === "image" ? (
                  <div className="grid gap-3">
                    <input
                      value={block.src}
                      onChange={(event) => updateBlock(block.id, { src: event.target.value })}
                      placeholder={t("admin.blog.imageUrl")}
                      className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                    />
                    <input
                      value={tx(block.alt, "en")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          alt: { en: event.target.value, ar: tx(block.alt, "ar") },
                        })
                      }
                      placeholder={`${t("admin.blog.imageAlt")} (EN)`}
                      className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                    />
                    <input
                      value={tx(block.alt, "ar")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          alt: { en: tx(block.alt, "en"), ar: event.target.value },
                        })
                      }
                      placeholder={`${t("admin.blog.imageAlt")} (AR)`}
                      dir="rtl"
                      className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                    />
                    <input
                      value={tx(block.caption, "en")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          caption: { en: event.target.value, ar: tx(block.caption, "ar") },
                        })
                      }
                      placeholder={`${t("admin.blog.imageCaption")} (EN)`}
                      className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                    />
                    <input
                      value={tx(block.caption, "ar")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          caption: { en: tx(block.caption, "en"), ar: event.target.value },
                        })
                      }
                      placeholder={`${t("admin.blog.imageCaption")} (AR)`}
                      dir="rtl"
                      className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                    />
                  </div>
                ) : null}

                {block.type === "quote" ? (
                  <div className="grid gap-3">
                    <textarea
                      rows={2}
                      value={tx(block.text, "en")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          text: { en: event.target.value, ar: tx(block.text, "ar") },
                        })
                      }
                      className="w-full resize-none rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                      placeholder="Quote EN"
                    />
                    <textarea
                      rows={2}
                      value={tx(block.text, "ar")}
                      onChange={(event) =>
                        updateBlock(block.id, {
                          text: { en: tx(block.text, "en"), ar: event.target.value },
                        })
                      }
                      dir="rtl"
                      className="w-full resize-none rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
                      placeholder="Quote AR"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

function KeywordLinker({
  label,
  onApply,
}: {
  label: string;
  onApply: (keywordEn: string, keywordAr: string, href: string) => void;
}) {
  const [keywordEn, setKeywordEn] = useState("");
  const [keywordAr, setKeywordAr] = useState("");
  const [href, setHref] = useState("/services");

  return (
    <div className="rounded-xl border border-dashed border-gold/40 bg-[#faf8f4] p-3">
      <p className="text-[0.6rem] tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <input
          value={keywordEn}
          onChange={(event) => setKeywordEn(event.target.value)}
          placeholder="keyword EN"
          className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
        />
        <input
          value={keywordAr}
          onChange={(event) => setKeywordAr(event.target.value)}
          placeholder="keyword AR"
          dir="rtl"
          className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
        />
        <input
          value={href}
          onChange={(event) => setHref(event.target.value)}
          placeholder="/services"
          className="rounded-md border border-navy/10 px-3 py-2 text-sm outline-none focus:border-navy/30"
        />
        <button
          type="button"
          onClick={() => onApply(keywordEn.trim(), keywordAr.trim(), href.trim())}
          className={cn(
            "rounded-md bg-navy px-4 py-2 text-[0.65rem] tracking-[0.14em] text-navy-foreground uppercase",
          )}
        >
          Link
        </button>
      </div>
    </div>
  );
}
