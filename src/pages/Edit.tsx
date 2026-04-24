import { useState } from "react";
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
  const add = usePrayerStore((s) => s.add);
  const update = usePrayerStore((s) => s.update);

  const existing = id ? items.find((i) => i.id === Number(id)) : undefined;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [request, setRequest] = useState(existing?.request ?? "");
  const [category, setCategory] = useState<PrayerCategory>(existing?.category ?? "Healing");
  const [status, setStatus] = useState<PrayerStatus>(existing?.status ?? "Active");
  const [relationship, setRelationship] = useState(existing?.relationship ?? "");
  const [dateSubmitted, setDateSubmitted] = useState(existing?.dateSubmitted ?? new Date().toISOString().slice(0, 10));
  const [address, setAddress] = useState(existing?.address ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !request.trim()) {
      toast.error("Please give the request a name and a description.");
      return;
    }
    if (isNew) {
      const created = add({ title, request, category, status, relationship, dateSubmitted, address, notes });
      toast.success("Request added to the list.");
      navigate(`/request/${created.id}`);
    } else if (existing) {
      update(existing.id, { title, request, category, status, relationship, dateSubmitted, address, notes });
      toast.success("Request updated.");
      navigate(`/request/${existing.id}`);
    }
  };

  return (
    <div className="min-h-screen">
      <Masthead />

      <form onSubmit={onSave} className="container-prose py-12">
        <Link
          to={existing ? `/request/${existing.id}` : "/"}
          className="font-accent text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2"
        >
          <span aria-hidden>←</span> {existing ? "Cancel and return" : "Cancel"}
        </Link>

        <header className="mt-6 pb-4 border-b border-foreground/15">
          <p className="eyebrow">{isNew ? "A new entry" : "Editing"}</p>
          <h1 className="font-display mt-2">{isNew ? "New Prayer Request" : title || "Edit request"}</h1>
        </header>

        <div className="mt-8 space-y-7">
          <Field label="For whom or what">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Margaret Ellison, or The Wheeler family"
              className="w-full bg-transparent border-0 border-b border-foreground/30 focus:border-primary outline-none py-2 font-display text-2xl"
            />
          </Field>

          <Field label="The request">
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={6}
              placeholder="A few sentences describing how the congregation can pray…"
              className="w-full bg-surface-sunken/60 border border-foreground/20 focus:border-primary outline-none p-4 font-body leading-relaxed resize-y"
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-7">
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PrayerCategory)}
                className="w-full bg-transparent border-0 border-b border-foreground/30 focus:border-primary outline-none py-2 font-body"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PrayerStatus)}
                className="w-full bg-transparent border-0 border-b border-foreground/30 focus:border-primary outline-none py-2 font-body"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Relationship (optional)">
              <input
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Member · Family · Visitor"
                className="w-full bg-transparent border-0 border-b border-foreground/30 focus:border-primary outline-none py-2 font-body"
              />
            </Field>
            <Field label="Date submitted">
              <input
                type="date"
                value={dateSubmitted}
                onChange={(e) => setDateSubmitted(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-foreground/30 focus:border-primary outline-none py-2 font-body"
              />
            </Field>
          </div>

          <Ornament className="my-2" />

          <Field label="Address (optional)">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full bg-transparent border-0 border-b border-foreground/30 focus:border-primary outline-none py-2 font-body resize-y"
            />
          </Field>

          <Field label="Pastoral notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Visible to leadership only."
              className="w-full bg-surface-sunken/60 border border-foreground/20 focus:border-primary outline-none p-4 font-accent italic leading-relaxed resize-y"
            />
          </Field>
        </div>

        <hr className="rule my-10" />

        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="font-accent text-sm text-muted-foreground hover:text-foreground px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="font-accent text-sm bg-primary text-primary-foreground px-6 py-2 hover:bg-primary/90 transition-colors"
          >
            {isNew ? "Add to the list" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="eyebrow block mb-1">{label}</span>
    {children}
  </label>
);

export default Edit;
