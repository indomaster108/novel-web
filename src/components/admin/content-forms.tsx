"use client";

import { useActionState, useState } from "react";
import {
  createChapterAction,
  createNovelAction,
  deleteChapterAction,
  deleteNovelAction,
  moderateCommentAction,
  updateChapterAction,
  updateNovelAction,
  type AdminActionState,
} from "@/app/admin/actions";

type PublicationStatus = "draft" | "published";

type NovelValues = {
  id?: string;
  title?: string;
  slug?: string;
  authorName?: string;
  synopsis?: string;
  coverUrl?: string | null;
  genres?: string[];
  status?: PublicationStatus;
};

type ChapterValues = {
  id?: string;
  novelId: string;
  chapterNumber?: number;
  title?: string;
  slug?: string;
  content?: string;
  status?: PublicationStatus;
};

type NovelDraft = {
  title: string;
  authorName: string;
  slug: string;
  genres: string;
  coverUrl: string;
  synopsis: string;
  status: PublicationStatus;
};

type ChapterDraft = {
  chapterNumber: string;
  title: string;
  slug: string;
  content: string;
  status: PublicationStatus;
};

const initialState: AdminActionState = { status: "idle", message: "" };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeSlug(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ActionMessage({ state, localMessage }: { state: AdminActionState; localMessage?: string }) {
  const message = localMessage || state.message;
  const isError = Boolean(localMessage) || state.status === "error";
  return message ? <p role={isError ? "alert" : "status"} className={isError ? "rounded-xl bg-red-500/10 p-3 text-sm leading-6 text-[var(--danger)]" : "rounded-xl bg-emerald-500/10 p-3 text-sm leading-6 text-emerald-800 dark:text-emerald-300"}>{message}</p> : null;
}

export function NovelForm({ values = {}, mode }: { values?: NovelValues; mode: "create" | "update" }) {
  const actionFn = mode === "create" ? createNovelAction : updateNovelAction;
  const [state, action, pending] = useActionState<AdminActionState, FormData>(actionFn, initialState);
  const [draft, setDraft] = useState<NovelDraft>({
    title: values.title ?? "",
    authorName: values.authorName ?? "",
    slug: values.slug ?? "",
    genres: values.genres?.join(", ") ?? "",
    coverUrl: values.coverUrl ?? "",
    synopsis: values.synopsis ?? "",
    status: values.status ?? "draft",
  });
  const [localMessage, setLocalMessage] = useState("");

  function updateDraft<Key extends keyof NovelDraft>(key: Key, value: NovelDraft[Key]) {
    setLocalMessage("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    const normalized = normalizeSlug(draft.slug);
    if (!slugPattern.test(normalized)) {
      event.preventDefault();
      setLocalMessage("Masukkan slug yang berisi huruf, angka, atau tanda hubung.");
      return;
    }
    if (normalized !== draft.slug) setDraft((current) => ({ ...current, slug: normalized }));
  }

  return <form action={action} onSubmit={submit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
    {values.id && <input type="hidden" name="id" value={values.id} />}
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Judul" name="title" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} required maxLength={200} disabled={pending} />
      <Field label="Penulis" name="authorName" value={draft.authorName} onChange={(event) => updateDraft("authorName", event.target.value)} required maxLength={120} disabled={pending} />
      <Field label="Slug" name="slug" value={draft.slug} onChange={(event) => updateDraft("slug", normalizeSlug(event.target.value))} required maxLength={200} hint="Huruf besar dan spasi akan otomatis disesuaikan." disabled={pending} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
      <Field label="Genre" name="genres" value={draft.genres} onChange={(event) => updateDraft("genres", event.target.value)} maxLength={500} hint="Pisahkan dengan koma; maksimal 12 genre." disabled={pending} />
    </div>
    <Field label="URL cover" name="coverUrl" type="url" value={draft.coverUrl} onChange={(event) => updateDraft("coverUrl", event.target.value)} maxLength={2048} hint="Unggah cover terlebih dahulu, lalu tempel URL bucket covers yang dihasilkan." disabled={pending} />
    <div><label htmlFor="synopsis" className="text-sm font-extrabold">Sinopsis</label><textarea id="synopsis" name="synopsis" value={draft.synopsis} onChange={(event) => updateDraft("synopsis", event.target.value)} maxLength={5000} rows={6} disabled={pending} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--accent)]" /></div>
    <StatusSelect value={draft.status} onChange={(value) => updateDraft("status", value)} disabled={pending} />
    <ActionMessage state={state} localMessage={localMessage} />
    <button type="submit" disabled={pending} className="ui-button w-full sm:w-auto">{pending ? "Menyimpan…" : mode === "create" ? "Buat novel" : "Simpan perubahan"}</button>
  </form>;
}

export function ChapterForm({ values, mode }: { values: ChapterValues; mode: "create" | "update" }) {
  const actionFn = mode === "create" ? createChapterAction : updateChapterAction;
  const [state, action, pending] = useActionState<AdminActionState, FormData>(actionFn, initialState);
  const [draft, setDraft] = useState<ChapterDraft>({
    chapterNumber: values.chapterNumber?.toString() ?? "",
    title: values.title ?? "",
    slug: values.slug ?? "",
    content: values.content ?? "",
    status: values.status ?? "draft",
  });
  const [localMessage, setLocalMessage] = useState("");

  function updateDraft<Key extends keyof ChapterDraft>(key: Key, value: ChapterDraft[Key]) {
    setLocalMessage("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    const normalized = normalizeSlug(draft.slug);
    if (!slugPattern.test(normalized)) {
      event.preventDefault();
      setLocalMessage("Masukkan slug yang berisi huruf, angka, atau tanda hubung.");
      return;
    }
    if (normalized !== draft.slug) setDraft((current) => ({ ...current, slug: normalized }));
  }

  return <form action={action} onSubmit={submit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
    {values.id && <input type="hidden" name="id" value={values.id} />}
    <input type="hidden" name="novelId" value={values.novelId} />
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Nomor bab" name="chapterNumber" type="number" value={draft.chapterNumber} onChange={(event) => updateDraft("chapterNumber", event.target.value)} min={1} required disabled={pending} />
      <Field label="Judul bab" name="title" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} maxLength={200} required disabled={pending} />
    </div>
    <Field label="Slug bab" name="slug" value={draft.slug} onChange={(event) => updateDraft("slug", normalizeSlug(event.target.value))} maxLength={200} required hint="Huruf besar dan spasi akan otomatis disesuaikan." disabled={pending} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
    <div><label htmlFor="content" className="text-sm font-extrabold">Isi bab</label><textarea id="content" name="content" value={draft.content} onChange={(event) => updateDraft("content", event.target.value)} required maxLength={100000} rows={18} disabled={pending} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 font-[family-name:var(--font-lora)] text-sm leading-7 outline-none focus:border-[var(--accent)]" /><p className="mt-1 text-xs text-[var(--muted)]">Gunakan baris kosong untuk memisahkan paragraf pada halaman baca.</p></div>
    <StatusSelect value={draft.status} onChange={(value) => updateDraft("status", value)} disabled={pending} />
    <ActionMessage state={state} localMessage={localMessage} />
    <button type="submit" disabled={pending} className="ui-button w-full sm:w-auto">{pending ? "Menyimpan…" : mode === "create" ? "Buat bab" : "Simpan perubahan"}</button>
  </form>;
}

export function NovelDeleteForm({ id }: { id: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(deleteNovelAction, initialState);
  return <form action={action} className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5"><input type="hidden" name="id" value={id} /><input type="hidden" name="confirmation" value={confirmed ? "DELETE" : ""} /><p className="font-bold text-red-800 dark:text-red-300">Hapus novel</p><p className="text-sm text-red-900/80 dark:text-red-200/80">Tindakan ini menghapus semua bab terkait dan tidak dapat dibatalkan.</p><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={pending} className="mt-1" /> Saya memahami penghapusan ini permanen.</label><ActionMessage state={state} /><button type="submit" disabled={!confirmed || pending} className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-extrabold text-white disabled:opacity-50">{pending ? "Menghapus…" : "Hapus novel"}</button></form>;
}

export function ChapterDeleteForm({ id }: { id: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(deleteChapterAction, initialState);
  return <form action={action} className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5"><input type="hidden" name="id" value={id} /><input type="hidden" name="confirmation" value={confirmed ? "DELETE" : ""} /><p className="font-bold text-red-800 dark:text-red-300">Hapus bab</p><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={pending} className="mt-1" /> Saya memahami penghapusan ini permanen.</label><ActionMessage state={state} /><button type="submit" disabled={!confirmed || pending} className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-extrabold text-white disabled:opacity-50">{pending ? "Menghapus…" : "Hapus bab"}</button></form>;
}

export function CommentModerationForm({ id, status }: { id: string; status: "pending" | "approved" | "rejected" }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(moderateCommentAction, initialState);
  if (status !== "pending") return <p className="text-xs font-bold text-[var(--muted)]">{status === "approved" ? "Disetujui" : "Ditolak"}</p>;
  return <form action={action} className="flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={id} /><button type="submit" name="status" value="approved" disabled={pending} className="min-h-10 rounded-full bg-emerald-700 px-3 text-xs font-bold text-white disabled:opacity-50">Setujui</button><button type="submit" name="status" value="rejected" disabled={pending} className="min-h-10 rounded-full border border-red-700 px-3 text-xs font-bold text-red-700 disabled:opacity-50">Tolak</button><ActionMessage state={state} /></form>;
}

function Field({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.name;
  return <div><label htmlFor={id} className="text-sm font-extrabold">{label}</label><input id={id} {...props} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]" />{hint && <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{hint}</p>}</div>;
}

function StatusSelect({ value, onChange, disabled }: { value: PublicationStatus; onChange: (value: PublicationStatus) => void; disabled: boolean }) {
  return <div><label htmlFor="status" className="text-sm font-extrabold">Status</label><select id="status" name="status" value={value} onChange={(event) => onChange(event.target.value as PublicationStatus)} disabled={disabled} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"><option value="draft">Draft</option><option value="published">Terbit</option></select><p className="mt-1 text-xs text-[var(--muted)]">Konten draft tidak tampil pada halaman publik.</p></div>;
}
