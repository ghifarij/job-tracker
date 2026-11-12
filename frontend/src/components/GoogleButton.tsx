"use client";

import Script from "next/script";
import { useRef } from "react";

// The part of Google Identity Services this app uses.
type GoogleIdentity = {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Google's own "Continue with Google" button. Google draws it and runs the
// account picker; this app only receives the result: an ID token
// ("credential"), which the backend then verifies.
export function GoogleButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const container = useRef<HTMLDivElement>(null);

  if (!CLIENT_ID) {
    return (
      <p className="field-error" role="alert">
        Sign-in isn&apos;t set up yet: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing from the
        frontend&apos;s environment variables.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        // Runs once the script has loaded, and again each time this
        // component is shown (after signing out, for one).
        onReady={() => {
          const google = window.google;
          if (!google || !container.current) return;
          google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (response) => onCredential(response.credential),
          });
          google.accounts.id.renderButton(container.current, {
            theme: "filled_blue",
            size: "large",
            shape: "rectangular",
            text: "continue_with",
            logo_alignment: "left",
            width: 280,
          });
        }}
      />
      {/* Holds the height so the page doesn't jump when the button appears. */}
      <div ref={container} className="min-h-[44px]" />
    </>
  );
}
