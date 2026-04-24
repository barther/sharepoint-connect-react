import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Masthead } from "@/components/Masthead";
import { Ornament } from "@/components/Ornament";
import { StatusBadge } from "@/components/StatusBadge";
import { usePrayerStore } from "@/lib/prayer-store";
import { toast } from "sonner";

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = usePrayerStore((s) => s.items.find((i) => i.id === Number(id)));
  const setStatus = usePrayerStore((s) => s.setStatus);
  const remove = usePrayerStore((s) => s.remove);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) {
    return (
      <div className="min-h-screen">
        <Masthead />
        <div className="container-prose py-24 text-center">
          <p className="font-display text-2xl">This request could not be found.</p>
          <Link to="/" className="font-accent italic text-primary mt-4 inline-block">← Return to the list</Link>
        </div>
      </div>
    );
  }

  const isInactive = item.status === "Resolved" || item.status === "Archived";

  return (
    <div className="min-h-screen">
      <Masthead />

      <article className="container-prose py-12">
        <Link to={item.status === "Archived" || item.status === "Resolved" ? "/archive" : "/"}
          className="font-accent text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2">
          <span aria-hidden>←</span> Back to the list
        </Link>

        <header className="mt-6 pb-6 border-b border-foreground/15">
          <div className="flex items-center gap-4 mb-3">
            <StatusBadge status={item.status} />
            <span className="font-accent text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {item.category}
            </span>
          </div>
          <h1 className="font-display">{item.title}</h1>
          {item.relationship && (
            <p className="font-accent italic text-muted-foreground mt-2">{item.relationship}</p>
          )}
          <p className="font-accent text-xs text-muted-foreground mt-3 tabular-nums">
            Submitted {format(new Date(item.dateSubmitted), "MMMM d, yyyy")}
            {" · "}by {item.author}
          </p>
        </header>

        <div className="mt-8 prose-like">
          <p className="drop-cap text-lg leading-[1.7] text-foreground/90 first-letter:font-display">
            {item.request}
          </p>
        </div>

        {item.notes && (
          <>
            <Ornament className="my-10" />
            <section>
              <h3 className="eyebrow mb-3">Pastoral notes</h3>
              <p className="font-accent italic text-foreground/80 leading-relaxed">{item.notes}</p>
            </section>
          </>
        )}

        {item.address && (
          <section className="mt-8">
            <h3 className="eyebrow mb-2">Address</h3>
            <p className="text-foreground/80 whitespace-pre-line">{item.address}</p>
          </section>
        )}

        <hr className="rule my-12" />

        {/* Actions — mirrors the .msapp BtnUpdateRequest / MarkResolved / Archive / Restore / Delete */}
        <div className="flex flex-wrap gap-3 items-center">
          <Link
            to={`/request/${item.id}/edit`}
            className="font-accent text-sm border border-primary text-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {isInactive ? "Update details" : "Update request"}
          </Link>

          {item.status === "Active" || item.status === "Ongoing" ? (
            <>
              <button
                onClick={() => { setStatus(item.id, "Resolved"); toast.success("Marked as resolved with thanksgiving."); }}
                className="font-accent text-sm border border-resolved text-resolved px-4 py-2 hover:bg-resolved hover:text-resolved-foreground transition-colors"
              >
                Mark resolved
              </button>
              <button
                onClick={() => { setStatus(item.id, "Archived"); toast.success("Moved to the archive."); navigate("/archive"); }}
                className="font-accent text-sm border border-foreground/40 text-foreground/70 px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
              >
                Archive
              </button>
            </>
          ) : (
            <button
              onClick={() => { setStatus(item.id, "Active"); toast.success("Restored to the current list."); navigate("/"); }}
              className="font-accent text-sm border border-primary text-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Restore to list
            </button>
          )}

          <button
            onClick={() => setConfirmDelete(true)}
            className="font-accent text-sm text-muted-foreground italic ml-auto hover:text-destructive"
          >
            Delete permanently
          </button>
        </div>
      </article>

      {/* Confirm delete modal — mirrors GrpConfirmDelete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-foreground/20 max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-display text-xl">Remove this request?</h3>
            <p className="font-body text-sm text-muted-foreground mt-2">
              This will permanently delete the entry. The Wednesday bulletin will no longer reference it.
            </p>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="font-accent text-sm px-4 py-2 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => { remove(item.id); toast.success("Request removed."); navigate("/"); }}
                className="font-accent text-sm border border-destructive text-destructive px-4 py-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;
