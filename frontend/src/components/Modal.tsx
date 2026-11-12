"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

// A native <dialog> opened with showModal(): the browser keeps keyboard focus
// inside it, dims the page behind it, and closes it on Escape.
//
// Two shapes: "dialog" sits in the middle of the screen (the forms), "drawer"
// slides in from the right edge and fills the height (Settings).
export function Modal({
  title,
  variant = "dialog",
  onClose,
  children,
}: {
  title: string;
  variant?: "dialog" | "drawer";
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialog}
      className={variant === "drawer" ? "modal drawer" : "modal"}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click on the dimmed page lands on the <dialog> element itself;
      // a click inside lands on one of its children.
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current.close();
      }}
    >
      <div className={variant === "drawer" ? "flex min-h-full flex-col p-6 sm:p-8" : "p-6 sm:p-8"}>
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="display text-3xl">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </dialog>
  );
}
