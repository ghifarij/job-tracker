"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  deleteAccount,
  listApplications,
  signOut,
  STATUS_LABELS,
  STATUSES,
  updateApplication,
  type Application,
  type Status,
  type User,
} from "@/lib/api";
import { daysAgo, formatDate, todayLocal } from "@/lib/dates";
import { ApplicationForm } from "./ApplicationForm";
import { Modal } from "./Modal";

type Dialog =
  | { kind: "add" }
  | { kind: "edit"; application: Application }
  | { kind: "settings" };

// The signed-in screen: the list of applications, the status filter, the
// dialogs for adding and editing, and the Settings drawer.
export function Tracker({ user, onSignedOut }: { user: User; onSignedOut: () => void }) {
  const [filter, setFilter] = useState<Status | undefined>(undefined);
  // null until the first answer arrives.
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  // Bumped after every change, to load the list again from the backend. The
  // backend owns the order and the filter, so the list is never patched here.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((current) => current + 1);

  // A 401 means the session ended (expired, or the account was deleted in
  // another tab): go back to the sign-in screen.
  const handleError = useCallback(
    (caught: unknown) => {
      if (caught instanceof ApiError && caught.status === 401) {
        onSignedOut();
        return;
      }
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Try again.");
    },
    [onSignedOut],
  );

  useEffect(() => {
    let cancelled = false;
    listApplications(filter)
      .then((list) => {
        if (!cancelled) {
          setApplications(list);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) handleError(caught);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, version, handleError]);

  async function changeStatus(application: Application, status: Status) {
    try {
      await updateApplication(application.id, { status });
    } catch (caught) {
      handleError(caught);
    }
    reload();
  }

  const today = todayLocal();

  return (
    <>
      <div className="airmail-stripe" />
      <header className="mx-auto flex w-full max-w-3xl items-baseline justify-between gap-6 px-5 pt-6">
        <p className="font-semibold">Job tracker</p>
        <button className="link-btn" onClick={() => setDialog({ kind: "settings" })}>
          Settings
        </button>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-5xl">Applications</h1>
          <button className="btn btn-primary" onClick={() => setDialog({ kind: "add" })}>
            Add application
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          <FilterButton active={filter === undefined} onClick={() => setFilter(undefined)}>
            All
          </FilterButton>
          {STATUSES.map((status) => (
            <FilterButton
              key={status}
              active={filter === status}
              onClick={() => setFilter(status)}
            >
              {STATUS_LABELS[status]}
            </FilterButton>
          ))}
        </div>

        {error && (
          <p className="field-error mt-6" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6">
          {applications === null ? (
            !error && (
              <p className="text-muted" role="status">
                Loading your applications…
              </p>
            )
          ) : applications.length === 0 ? (
            <EmptyList filter={filter} />
          ) : (
            <ul className="divide-y divide-line rounded-lg bg-sheet">
              {applications.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  today={today}
                  onStatusChange={(status) => changeStatus(application, status)}
                  onEdit={() => setDialog({ kind: "edit", application })}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      {(dialog?.kind === "add" || dialog?.kind === "edit") && (
        <ApplicationForm
          // A fresh form for each application.
          key={dialog.kind === "edit" ? dialog.application.id : "add"}
          application={dialog.kind === "edit" ? dialog.application : undefined}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            reload();
          }}
          onSessionExpired={onSignedOut}
        />
      )}

      {dialog?.kind === "settings" && (
        <SettingsDrawer user={user} onClose={() => setDialog(null)} onSignedOut={onSignedOut} />
      )}
    </>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      className={`min-h-9 rounded-md border-[1.5px] px-3 text-sm font-semibold ${
        active
          ? "border-ink bg-ink text-sheet"
          : "border-line bg-transparent text-ink hover:border-ink"
      }`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ApplicationRow({
  application,
  today,
  onStatusChange,
  onEdit,
}: {
  application: Application;
  today: string;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
}) {
  const { company, role, link, status, appliedAt, notes } = application;

  return (
    <li className="grid gap-x-6 gap-y-3 px-5 py-5 sm:grid-cols-[6.5rem_1fr_auto]">
      <p className="text-sm leading-snug text-muted sm:pt-1.5">
        <time dateTime={appliedAt} className="font-semibold text-ink sm:block">
          {formatDate(appliedAt)}
        </time>
        <span className="sm:hidden">, </span>
        {daysAgo(appliedAt, today)}
      </p>

      <div className="min-w-0">
        {/* A ghosted application fades: nobody answered. */}
        <h2 className={`display break-words text-3xl ${status === "GHOSTED" ? "text-ghost" : ""}`}>
          {company}
        </h2>
        <p className="mt-1 break-words">{role}</p>
        {notes && (
          <p className="mt-2 max-w-[60ch] whitespace-pre-line break-words text-sm leading-relaxed text-muted line-clamp-3">
            {notes}
          </p>
        )}
        {link && (
          <p className="mt-2 text-sm">
            {/* The backend only stores http(s) links, so this is safe to open. */}
            <a className="link-btn text-sm" href={link} target="_blank" rel="noopener noreferrer">
              Open the job post
            </a>
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
        <select
          className="status"
          data-status={status}
          value={status}
          aria-label={`Status of the application to ${company}`}
          onChange={(event) => onStatusChange(event.target.value as Status)}
        >
          {STATUSES.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABELS[option]}
            </option>
          ))}
        </select>
        <button
          className="link-btn text-sm"
          aria-label={`Edit the application to ${company}`}
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
    </li>
  );
}

function EmptyList({ filter }: { filter: Status | undefined }) {
  if (filter) {
    return (
      <p className="rounded-lg bg-sheet px-5 py-8 text-muted">
        No applications are marked {STATUS_LABELS[filter].toLowerCase()}.
      </p>
    );
  }

  return (
    <div className="rounded-lg bg-sheet px-5 py-10">
      <p className="display text-3xl">Nothing here yet</p>
      <p className="mt-2 max-w-[44ch] text-muted">
        Add the first job you applied to. It takes a company name and a role; the rest is
        optional.
      </p>
    </div>
  );
}

// Settings, in a drawer: who is signed in, signing out, and deleting the
// account. Both ways out of the account live here and nowhere else.
function SettingsDrawer({
  user,
  onClose,
  onSignedOut,
}: {
  user: User;
  onClose: () => void;
  // Called after signing out and after deleting the account: either way,
  // nobody is signed in any more.
  onSignedOut: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onSignedOut();
    } catch (caught) {
      // Already signed out or already deleted: the result is the same.
      if (caught instanceof ApiError && caught.status === 401) {
        onSignedOut();
        return;
      }
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <Modal title="Settings" variant="drawer" onClose={onClose}>
      <section className="mt-8" aria-labelledby="settings-profile">
        <h3 id="settings-profile" className="font-semibold">
          Profile
        </h3>
        <dl className="mt-3 divide-y divide-line border-y border-line">
          <ProfileRow label="Name" value={user.name ?? "Not set in your Google account"} />
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow label="Signed in with" value="Google" />
        </dl>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your name and email come from your Google account and are updated each time you
          sign in.
        </p>
        <button className="btn mt-6 w-full" onClick={() => void run(signOut)} disabled={busy}>
          Sign out
        </button>
      </section>

      {error && (
        <p className="field-error mt-4" role="alert">
          {error}
        </p>
      )}

      {/* mt-auto pushes this to the bottom of the drawer, away from Sign out. */}
      <section className="mt-auto pt-10" aria-labelledby="settings-delete">
        <h3 id="settings-delete" className="font-semibold">
          Delete account
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Deletes your account and every application in it. If you sign in with the same
          Google account later, you start with an empty list.
        </p>
        {confirmingDelete ? (
          <div className="mt-4 rounded-md border-[1.5px] border-red p-4" role="group">
            <p className="font-semibold">
              Delete the account for <span className="break-all">{user.email}</span>? This
              can&apos;t be undone.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                className="btn btn-danger"
                onClick={() => void run(deleteAccount)}
                disabled={busy}
              >
                Delete my account
              </button>
              <button className="btn" onClick={() => setConfirmingDelete(false)} disabled={busy}>
                Keep my account
              </button>
            </div>
          </div>
        ) : (
          <button
            className="link-btn link-btn-danger mt-4"
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
          >
            Delete my account
          </button>
        )}
      </section>
    </Modal>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 break-all font-semibold">{value}</dd>
    </div>
  );
}
