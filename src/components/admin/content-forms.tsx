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

type NovelValues = {
  id?: string;
  title?: string;
  slug?: string;
  authorName?: string;
  synopsis?: string;
  coverUrl?: string | null;
  genres?: string[];
  status?: "draft" | "published";
};

type ChapterValues = {
  id?: string;
  novelId: string;
  chapterNumber?: number;
  title?: string;
  slug?: string;
  content?: string;
  status?: "draft" | "published";
};

const initialState: AdminActionState = { status: "idle", message: "" };

function ActionMessage({ state }: { state: AdminActionState }) {
  return state.message ? <p role="status" className={state.status === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{state.message}</p> : null;
}

export function NovelForm({ values = {}, mode }: { values?: NovelValues; mode: "create" | "update" }) {
  const actionFn = mode === "create" ? createNovelAction : updateNovelAction;
  const [state, action, pending] = useActionState<AdminActionState, FormData>(actionFn, initialState);
  return <form action={action} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
    {values.id && <input type="hidden" name="id" value={values.id} />}
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Judul" name="title" defaultValue={values.title} required maxLength={200} disabled={pending} />
      <Field label="Penulis" name="authorName" defaultValue={values.authorName} required maxLength={120} disabled={pending} />
      <Field label="Slug" name="slug" defaultValue={values.slug} required maxLength={200} hint="huruf kecil, angka, dan tanda hubung" disabled={pending} />
      <Field label="Genre" name="genres" defaultValue={values.genres?.join(", ")} maxLength={500} hint="Pisahkan dengan koma; maksimal 12 genre" disabled={pending} />
    </div>
    <Field label="URL cover" name="coverUrl" type="url" defaultValue={values.coverUrl ?? ""} maxLength={2048} hint="Unggah cover di bawah, lalu tempel URL bucket covers yang dihasilkan." disabled={pending} />
    <div>
      <label htmlFor="synopsis" className="text-sm font-bold">Sinopsis</label>
      <textarea id="synopsis" name="synopsis" defaultValue={values.synopsis} maxLength={5000} rows={6} disabled={pending} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--accent)]" />
    </div>
    <StatusSelect value={values.status} disabled={pending} />
    <ActionMessage state={state} />
    <button type="submit" disabled={pending} className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white disabled:opacity-50">{pending ? "Menyimpan…" : mode === "create" ? "Buat novel" : "Simpan perubahan"}</button>
  </form>;
}

export function ChapterForm({ values, mode }: { values: ChapterValues; mode: "create" | "update" }) {
  const actionFn = mode === "create" ? createChapterAction : updateChapterAction;
  const [state, action, pending] = useActionState<AdminActionState, FormData>(actionFn, initialState);
  return <form action={action} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
    {values.id && <input type="hidden" name="id" value={values.id} />}
    <input type="hidden" name="novelId" value={values.novelId} />
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Nomor bab" name="chapterNumber" type="number" defaultValue={values.chapterNumber?.toString()} min={1} required disabled={pending} />
      <Field label="Judul bab" name="title" defaultValue={values.title} maxLength={200} required disabled={pending} />
    </div>
    <Field label="Slug bab" name="slug" defaultValue={values.slug} maxLength={200} required hint="huruf kecil, angka, dan tanda hubung" disabled={pending} />
    <div>
      <label htmlFor="content" className="text-sm font-bold">Isi bab</label>
      <textarea id="content" name="content" defaultValue={values.content} required maxLength={100000} rows={18} disabled={pending} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 font-[family-name:var(--font-lora)] text-sm leading-7 outline-none focus:border-[var(--accent)]" />
      <p className="mt-1 text-xs text-[var(--muted)]">Gunakan baris kosong untuk memisahkan paragraf pada halaman baca.</p>
    </div>
    <StatusSelect value={values.status} disabled={pending} />
    <ActionMessage state={state} />
    <button type="submit" disabled={pending} className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-white disabled:opacity-50">{pending ? "Menyimpan…" : mode === "create" ? "Buat bab" : "Simpan perubahan"}</button>
  </form>;
}

export function NovelDeleteForm({ id }: { id: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(deleteNovelAction, initialState);
  return <form action={action} className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="confirmation" value={confirmed ? "DELETE" : ""} />
    <p className="font-bold text-red-800">Hapus novel</p>
    <p className="text-sm text-red-900/80">Tindakan ini menghapus semua bab terkait dan tidak dapat dibatalkan.</p>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={pending} className="mt-1" /> Saya memahami penghapusan ini permanen.</label>
    <ActionMessage state={state} />
    <button type="submit" disabled={!confirmed || pending} className="min-h-11 rounded-full bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-50">{pending ? "Menghapus…" : "Hapus novel"}</button>
  </form>;
}

export function ChapterDeleteForm({ id }: { id: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, action, pending] = useActionState<AdminActionState, FormData>(deleteChapterAction, initialState);
  return <form action={action} className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="confirmation" value={confirmed ? "DELETE" : ""} />
    <p className="font-bold text-red-800">Hapus bab</p>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={pending} className="mt-1" /> Saya memahami penghapusan ini permanen.</label>
    <ActionMessage state={state} />
    <button type="submit" disabled={!confirmed || pending} className="min-h-11 rounded-full bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-50">{pending ? "Menghapus…" : "Hapus bab"}</button>
  </form>;
}

export function CommentModerationForm({ id, status }: { id: string; status: "pending" | "approved" | "rejected" }) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(moderateCommentAction, initialState);
  if (status !== "pending") return <p className="text-xs font-bold text-[var(--muted)]">{status === "approved" ? "Disetujui" : "Ditolak"}</p>;
  return <form action={action} className="flex flex-wrap items-center gap-2">
    <input type="hidden" name="id" value={id} />
    <button type="submit" name="status" value="approved" disabled={pending} className="min-h-10 rounded-full bg-emerald-700 px-3 text-xs font-bold text-white disabled:opacity-50">Setujui</button>
    <button type="submit" name="status" value="rejected" disabled={pending} className="min-h-10 rounded-full border border-red-700 px-3 text-xs font-bold text-red-700 disabled:opacity-50">Tolak</button>
    <ActionMessage state={state} />
  </form>;
}

function Field({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.name;
  return <div><label htmlFor={id} className="text-sm font-bold">{label}</label><input id={id} {...props} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]" />{hint && <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>}</div>;
}

function StatusSelect({ value = "draft", disabled }: { value?: "draft" | "published"; disabled: boolean }) {
  return <div><label htmlFor="status" className="text-sm font-bold">Status</label><select id="status" name="status" defaultValue={value} disabled={disabled} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--accent)]"><option value="draft">Draft</option><option value="published">Terbit</option></select><p className="mt-1 text-xs text-[var(--muted)]">Konten draft tidak tampil pada halaman publik.</p></div>;
}
