"use client";

import { useState } from "react";
import { ApiError, signInWithGoogle, STATUS_LABELS, type Status, type User } from "@/lib/api";
import { GoogleButton } from "./GoogleButton";

// Made-up rows that show what the list looks like before anyone signs in.
const EXAMPLES: { date: string; company: string; role: string; status: Status }[] = [
  { date: "9 Nov", company: "Tokonesia", role: "Backend engineer", status: "INTERVIEWED" },
  { date: "3 Nov", company: "Bank Nusantara", role: "Site reliability engineer", status: "APPLIED" },
  { date: "14 Oct", company: "Kopi Cloud", role: "Platform engineer", status: "GHOSTED" },
];

export function SignIn({ onSignedIn }: { onSignedIn: (user: User) => void }) {
  const [error, setError] = useState<string | null>(null);
  // True between Google handing over the token and the backend answering.
  const [signingIn, setSigningIn] = useState(false);

  async function handleCredential(credential: string) {
    setError(null);
    setSigningIn(true);
    try {
      onSignedIn(await signInWithGoogle(credential));
    } catch (caught) {
      setSigningIn(false);
      setError(
        caught instanceof ApiError && caught.status !== 401
          ? caught.message
          : "Google sign-in didn't go through. Try again.",
      );
    }
  }

  return (
    <>
      <div className="airmail-stripe" />
      <main className="mx-auto grid w-full max-w-5xl flex-1 content-center gap-x-16 gap-y-12 px-5 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="font-semibold">Job tracker</p>
          <h1 className="display mt-6 text-5xl sm:text-6xl">
            Remember every job you applied to.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted">
            Write down each application when you send it. Change its status when you hear
            back, and see which companies went quiet.
          </p>
          <div className="mt-8">
            <GoogleButton onCredential={handleCredential} />
            {signingIn && (
              <p className="mt-3 font-semibold" role="status">
                Signing you in…
              </p>
            )}
            {error && (
              <p className="field-error mt-3" role="alert">
                {error}
              </p>
            )}
          </div>
          <p className="mt-4 max-w-[34rem] text-sm text-muted">
            Only you can see your list. You can delete your account and everything in it at
            any time.
          </p>
        </div>

        <figure>
          <ul className="divide-y divide-line rounded-lg bg-sheet">
            {EXAMPLES.map((example) => (
              <li key={example.company} className="flex items-center gap-4 px-5 py-4">
                <span className="w-14 shrink-0 text-sm text-muted">{example.date}</span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`display block text-2xl ${example.status === "GHOSTED" ? "text-ghost" : ""}`}
                  >
                    {example.company}
                  </span>
                  <span className="block text-sm text-muted">{example.role}</span>
                </span>
                <span className="status" data-status={example.status}>
                  {STATUS_LABELS[example.status]}
                </span>
              </li>
            ))}
          </ul>
          <figcaption className="mt-3 text-sm text-muted">
            An example list. The companies are made up.
          </figcaption>
        </figure>
      </main>
    </>
  );
}
