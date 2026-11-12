import { App } from "@/components/App";

// The whole app is one page. Everything on it depends on who is logged in,
// which only the browser knows (it holds the session cookie), so the page is
// a client component tree that calls the API from the browser.
export default function Home() {
  return <App />;
}
