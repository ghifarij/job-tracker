"use client";

import { useState, type FormEvent } from "react";
import {
  ApiError,
  createApplication,
  deleteApplication,
  STATUS_LABELS,
  STATUSES,
  updateApplication,
  type Application,
  type ApplicationInput,
  type FieldErrors,
  type Status,
} from "@/lib/api";
import { todayLocal } from "@/lib/dates";
import { Modal } from "./Modal";

// The add and edit form, in a dialog. With `application` it edits (and can
// delete) that one; without, it adds a new one.
export function ApplicationForm({
  application,
  onDone,
  onClose,
  onSessionExpired,
}: {
  application?: Application;
  // Called after a successful add, save or delete.
  onDone: () => void;
  onClose: () => void;
  onSessionExpired: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Runs one API call and turns a failure into something the form can show.
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setMessage(null);
    setFieldErrors({});
    try {
      await action();
      onDone();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired();
        return;
      }
      const fields = error instanceof ApiError ? error.fields : {};
      setFieldErrors(fields);
      setMessage(
        Object.keys(fields).length > 0
          ? "Some fields need fixing."
          : error instanceof ApiError
            ? error.message
            : "Something went wrong. Try again.",
      );
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();

    const input: ApplicationInput = {
      company: text("company"),
      role: text("role"),
      // An empty box means "none", which the API spells null.
      link: text("link") || null,
      status: text("status") as Status,
      appliedAt: text("appliedAt"),
      notes: text("notes") || null,
    };

    void run(() =>
      application ? updateApplication(application.id, input) : createApplication(input),
    );
  }

  const errorFor = (name: string) => fieldErrors[name]?.[0];

  return (
    <Modal title={application ? "Edit application" : "Add application"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
        <Field label="Company" error={errorFor("company")}>
          {(props) => (
            <input
              {...props}
              name="company"
              defaultValue={application?.company}
              required
              maxLength={200}
              autoFocus={!application}
              autoComplete="off"
            />
          )}
        </Field>

        <Field label="Role" error={errorFor("role")}>
          {(props) => (
            <input
              {...props}
              name="role"
              defaultValue={application?.role}
              required
              maxLength={200}
              autoComplete="off"
            />
          )}
        </Field>

        <Field
          label="Link to the job post"
          hint="optional"
          error={errorFor("link") && "Enter a full web address that starts with https://"}
        >
          {(props) => (
            <input
              {...props}
              name="link"
              type="url"
              defaultValue={application?.link ?? ""}
              maxLength={2000}
              placeholder="https://"
              autoComplete="off"
            />
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Status" error={errorFor("status")}>
            {(props) => (
              <select {...props} name="status" defaultValue={application?.status ?? "APPLIED"}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Date applied" error={errorFor("appliedAt")}>
            {(props) => (
              <input
                {...props}
                name="appliedAt"
                type="date"
                defaultValue={application?.appliedAt ?? todayLocal()}
                required
              />
            )}
          </Field>
        </div>

        <Field label="Notes" hint="optional" error={errorFor("notes")}>
          {(props) => (
            <textarea
              {...props}
              name="notes"
              defaultValue={application?.notes ?? ""}
              maxLength={5000}
              rows={4}
            />
          )}
        </Field>

        {message && (
          <p className="field-error" role="alert">
            {message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {application ? "Save changes" : "Add application"}
          </button>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          {application && !confirmingDelete && (
            <button
              type="button"
              className="link-btn link-btn-danger ml-auto"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
            >
              Delete application
            </button>
          )}
        </div>

        {application && confirmingDelete && (
          <div className="rounded-md border-[1.5px] border-red p-4" role="group">
            <p className="font-semibold">
              Delete the application to {application.company}? This can&apos;t be undone.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-danger"
                disabled={busy}
                onClick={() => void run(() => deleteApplication(application.id))}
              >
                Delete application
              </button>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => setConfirmingDelete(false)}
              >
                Keep it
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}

// A label, its input, and the input's error message, wired together for
// screen readers.
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: {
    className: string;
    "aria-invalid": boolean;
  }) => React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {hint && <span className="field-hint">({hint})</span>}
      </span>
      {children({ className: "field-input", "aria-invalid": Boolean(error) })}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
