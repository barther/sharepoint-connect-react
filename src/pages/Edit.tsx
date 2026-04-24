import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Masthead } from "@/components/Masthead";
import { Ornament } from "@/components/Ornament";
import { usePrayerStore } from "@/lib/prayer-store";
import { CATEGORIES, STATUSES, type PrayerCategory, type PrayerStatus } from "@/lib/prayer-types";
import { toast } from "sonner";

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const items = usePrayerStore((s) => s.items);
  const loaded = usePrayerStore((s) => s.loaded);
  const loading = usePrayerStore((s) => s.loading);
  const add = usePrayerStore((s) => s.add);
  const update = usePrayerStore((s) => s.update);

  const existing = id ? items.find((i) => i.id === Number(id)) : undefined;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [request, setRequest] = useState(existing?.request ?? "");
  const [category, setCategory] = useState<PrayerCategory>(existing?.category ?? "Member");
  const [status, setStatus] = useState<PrayerStatus>(existing?.status ?? "Active");
  const [relationship, setRelationship] = useState(existing?.relationship ?? "");
  const [dateSubmitted, setDateSubmitted] = useState(
    existing?.dateSubmitted ?? new Date().toISOString().slice(0, 10)
  );
  const [address, setAddress] = useState(existing?.address ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setRequest(existing.request);
    setCategory(existing.category);
    setStatus(existing.status);
    setRelationship(existing.relationship ?? "");
    setDateSubmitted(existing.dateSubmitted);
    setAddress(existing.address ?? "");
    setNotes(existing.notes ?? "");
  }, [existing]);

  if (id && !existing) {
    const stillLoading = !loaded && loading;
    return (
      <div className="min-h-screen">
        <Masthead />
        <div className="container-prose py-24 text-center">
          <p className="font-display text-2xl">
            {stillLoading ? "Loading the list…" : "This request could not be found."}
          </p>
          {!stillLoading && (
            <Link to="/" className="font-accent italic text-primary mt-4 inline-block text-lg">
              ← Return to the list
            </Link>
          )}
        </div>
      </div>
    );
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !request.trim()) {
      toast.error("Please give the request a name and a description.");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const created = await add({ title, request, category, status, relationship, dateSubmitted, address, notes });
        toast.success("Request added to the list.");
        navigate(`/request/${created.id}`);
      } else if (existing) {
        await update(existing.id, { title, request, category, status, relationship, dateSubmitted, address, notes });
        toast.success("Request updated.");
        navigate(`/request/${existing.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-card border border-foreground/25 focus:border-primary outline-none px-4 py-3 min-h-[48px] font-body text-lg";
  const textareaClass =
    "w-full bg-card border border-foreground/25 focus:border-primary outline-none p-4 font-body text-lg leading-relaxed resize-y";

  return (
    <div className="min-h-screen">
      <Masthead />

      <form onSubmit={onSave} className="container-prose py-8 sm:py-12">
        <Link
          to={existing ? `/request/${existing.id}` : "/"}
          className="font-accent text-base text-foreground/80 hover:text-primary inline-flex items-center gap-2 min-h-[44px]"
        >
          <span aria-hidden className="text-xl">←</span> {existing ? "Cancel and return" : "Cancel"}
        </Link>

        <header className="mt-4 pb-4 border-b border-foreground/15">
          <p className="eyebrow">{isNew ? "A new entry" : "Editing"}</p>
          <h1 className="font-display mt-2">{isNew ? "New Prayer Request" : title || "Edit request"}</h1>
        </header>

        <div className="mt-8 space-y-7">
          <Field label="For whom or what *" hint="The person, family, or situation you're praying for.">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Margaret Ellison, or The Wheeler family"
              className={`${inputClass} font-display text-2xl py-3`}
            />
          </Field>

          <Field label="The request *" hint="A few sentences the prayer team can read aloud.">
            <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={6} className={textareaClass} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PrayerCategory)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as PrayerStatus)} className={inputClass}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Relationship" hint="Optional.">
              <input
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Member · Family · Visitor"
                className={inputClass}
              />
            </Field>
            <Field label="Date submitted">
              <input
                type="date"
                value={dateSubmitted}
                onChange={(e) => setDateSubmitted(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Ornament className="my-2" />

          <Field label="Address" hint="Optional. For cards or visits.">
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={textareaClass} />
          </Field>

          <Field label="Pastoral notes" hint="Visible to leadership only.">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${textareaClass} font-accent italic`}
            />
          </Field>
        </div>

        <hr className="rule my-10" />

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary w-full sm:w-auto">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto disabled:opacity-50">
            {saving ? "Saving…" : isNew ? "Add to the list" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="eyebrow block mb-2">{label}</span>
    {children}
    {hint && <span className="block font-accent italic text-sm text-muted-foreground mt-1.5">{hint}</span>}
  </label>
);

export default Edit;
