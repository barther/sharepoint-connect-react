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
          <Link to="/" className="font-accent italic text-primary mt-4 inline-block text-lg">
            ← Return to the list
          </Link>
        </div>
      </div>
    );
  }

  const isInactive = item.status === "Resolved" || item.status === "Archived";
  const backTo = isInactive ? "/archive" : "/";

  return (
    <div className="min-h-screen">
      <Masthead />

      <article className="container-prose py-8 sm:py-12">
        <Link
          to={backTo}
          className="font-accent text-base text-foreground/80 hover:text-primary inline-flex items-center gap-2 min-h-[44px]"
        >
          <span aria-hidden className="text-xl">←</span> Back to the list
        </Link>

        <header className="mt-4 pb-6 border-b border-foreground/15">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
            <StatusBadge status={item.status} />
            <span className="font-accent text-sm uppercase tracking-[0.16em] text-muted-foreground">
              {item.category}
            </span>
          </div>
          <h1 className="font-display">{item.title}</h1>
          {item.relationship && (
            <p className="font-accent italic text-muted-foreground mt-2 text-lg">{item.relationship}</p>
          )}
          <p className="font-accent text-sm text-muted-foreground mt-3 tabular-nums">
            Submitted {format(new Date(item.dateSubmitted), "MMMM d, yyyy")}
            <span className="hidden sm:inline"> · by {item.author}</span>
            <span className="sm:hidden block">by {item.author}</span>
          </p>
        </header>

        <div className="mt-8">
          <p className="drop-cap text-lg sm:text-xl leading-[1.7] text-foreground">
            {item.request}
          </p>
        </div>

        {item.notes && (
          <>
            <Ornament className="my-10" />
            <section>
              <h3 className="eyebrow mb-3">Pastoral notes</h3>
              <p className="font-accent italic text-foreground/85 leading-relaxed text-lg">{item.notes}</p>
            </section>
          </>
        )}

        {item.address && (
          <section className="mt-8">
            <h3 className="eyebrow mb-2">Address</h3>
            <p className="text-foreground/85 whitespace-pre-line text-lg">{item.address}</p>
          </section>
        )}

        <hr className="rule my-10" />

        {/* Actions — full width and stacked on phone, primary action obviously solid */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
          <Link to={`/request/${item.id}/edit`} className="btn-primary w-full sm:w-auto">
            {isInactive ? "Update details" : "Update request"}
          </Link>

          {item.status === "Active" || item.status === "Ongoing" ? (
            <>
              <button
                onClick={() => {
                  setStatus(item.id, "Resolved");
                  toast.success("Marked as resolved with thanksgiving.");
                }}
                className="btn-secondary w-full sm:w-auto"
              >
                ✓ Mark resolved
              </button>
              <button
                onClick={() => {
                  setStatus(item.id, "Archived");
                  toast.success("Moved to the archive.");
                  navigate("/archive");
                }}
                className="btn-secondary w-full sm:w-auto"
              >
                Archive
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setStatus(item.id, "Active");
                toast.success("Restored to the current list.");
                navigate("/");
              }}
              className="btn-secondary w-full sm:w-auto"
            >
              Restore to list
            </button>
          )}

          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-quiet w-full sm:w-auto sm:ml-auto text-destructive/80 hover:text-destructive"
          >
            Delete permanently
          </button>
        </div>
      </article>

      {/* Confirm delete */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-foreground/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="bg-card border-t sm:border border-foreground/20 max-w-md w-full p-6 sm:p-8 shadow-2xl rounded-t-lg sm:rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl">Remove this request?</h3>
            <p className="font-body mt-3 text-foreground/85">
              This permanently deletes the entry. The Wednesday bulletin will no longer reference it.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:justify-end">
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary w-full sm:w-auto">
                Cancel
              </button>
              <button
                onClick={() => {
                  remove(item.id);
                  toast.success("Request removed.");
                  navigate("/");
                }}
                className="btn-danger w-full sm:w-auto"
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
