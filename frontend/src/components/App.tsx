"use client";

import { useEffect, useState } from "react";
import { ApiError, getCurrentUser, type User } from "@/lib/api";
import { SignIn } from "./SignIn";
import { Tracker } from "./Tracker";

type Session =
  | { state: "loading" }
  | { state: "unreachable"; message: string }
  | { state: "signedOut" }
  | { state: "signedIn"; user: User };

// Decides which screen to show: the sign-in screen or the tracker. The
// browser can't read the session cookie (it is httpOnly), so the only way to
// know who is logged in is to ask the backend.
export function App() {
  const [session, setSession] = useState<Session>({ state: "loading" });

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) {
          setSession(user ? { state: "signedIn", user } : { state: "signedOut" });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSession({
            state: "unreachable",
            message: error instanceof ApiError ? error.message : "Something went wrong.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (session.state === "signedIn") {
    return (
      <Tracker user={session.user} onSignedOut={() => setSession({ state: "signedOut" })} />
    );
  }

  if (session.state === "signedOut") {
    return <SignIn onSignedIn={(user) => setSession({ state: "signedIn", user })} />;
  }

  return (
    <>
      <div className="airmail-stripe" />
      <main className="mx-auto w-full max-w-3xl px-5 py-16">
        {session.state === "loading" ? (
          <p className="text-muted" role="status">
            Loading your applications…
          </p>
        ) : (
          <div role="alert">
            <p className="display text-2xl">The job tracker can&apos;t load right now</p>
            <p className="mt-2 text-muted">{session.message}</p>
            <button className="btn mt-6" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        )}
      </main>
    </>
  );
}
