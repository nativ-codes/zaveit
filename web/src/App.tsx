import { useEffect, useState, type FormEvent } from "react";
import placeholder from "./placeholder.svg";
import { searchPosts, type VisitorPost } from "./search";

// The page knows only the URL before unlock: /<username>/<list-path>, or /<username> alone, which never unlocks.
const [username = "", listPath = ""] = location.pathname
  .split("/")
  .filter(Boolean)
  .map((part) => decodeURIComponent(part).toLowerCase());
const api = `/v1/published-lists/${encodeURIComponent(username || "-")}${listPath ? `/${encodeURIComponent(listPath)}` : ""}`;
const tokenKey = `token:${username}/${listPath}`;

const storage = {
  get: () => {
    try {
      return sessionStorage.getItem(tokenKey);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      sessionStorage.setItem(tokenKey, token);
    } catch {
      /* the tab just won't stay unlocked */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(tokenKey);
    } catch {
      /* nothing stored */
    }
  },
};

type List = { name: string; posts: VisitorPost[] };

const errorFor = (status: number) =>
  status === 401
    ? "Wrong password."
    : status === 429
      ? "Too many tries. Try again later."
      : "Something went wrong. Try again.";

export default function App() {
  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(!!storage.get());
  const [error, setError] = useState("");

  async function load(token: string) {
    const res = await fetch(api, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    if (res?.ok) return setList(await res.json());
    if (res?.status === 401) storage.clear();
    else setError(errorFor(res?.status ?? 0));
  }

  useEffect(() => {
    const token = storage.get();
    if (token) load(token).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = `${list ? list.name : [username, listPath].filter(Boolean).join(" / ") || "Shared lists"} · Zaveit`;
  }, [list]);

  async function unlock(password: string) {
    setError("");
    const res = await fetch(`${api}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (!res?.ok) return setError(errorFor(res?.status ?? 0));
    const { token } = await res.json();
    storage.set(token);
    await load(token);
  }

  if (!username) return <Landing />;
  if (loading) return null;
  return (
    <>
      {list ? <Grid list={list} /> : <Prompt error={error} onUnlock={unlock} />}
      <Footer />
    </>
  );
}

function Logo({ size }: { size: number }) {
  return (
    <img
      className="logo"
      src="/icon.png"
      width={size}
      height={size}
      alt="Zaveit"
    />
  );
}

// The bare domain: no List can live here, so it only shows the app and where to get it.
function Landing() {
  return (
    <div className="landing">
      <main className="landing-in">
        <Logo size={120} />
        <h1>ZaveIt</h1>
        <div className="stores">
          <a href="https://apps.apple.com/ro/app/zaveit-smart-bookmark-manager/id6747726703">
            <img
              src="/app-store.webp"
              width={150}
              alt="Download on the App Store"
            />
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.nativcodes.zaveit">
            <img
              src="/google-play.webp"
              width={150}
              alt="Get it on Google Play"
            />
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Prompt({
  error,
  onUnlock,
}: {
  error: string;
  onUnlock: (password: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get(
      "password",
    ) as string;
    setBusy(true);
    await onUnlock(password);
    setBusy(false);
  }
  return (
    <main className="prompt">
      <form className="prompt-box" onSubmit={submit}>
        <Logo size={72} />
        <h1>{[username, listPath].filter(Boolean).join(" / ")}</h1>
        <p>This list is protected. Enter the password to view it.</p>
        <input
          className="field"
          type="password"
          name="password"
          placeholder="Password"
          aria-label="Password"
          required
          autoFocus
          autoComplete="current-password"
        />
        <div className="error" role="alert">
          {error}
        </div>
        <button className="button" disabled={busy}>
          View list
        </button>
      </form>
    </main>
  );
}

const safeHref = (url: string) => (/^https?:\/\//i.test(url) ? url : undefined);

function Grid({ list }: { list: List }) {
  const [query, setQuery] = useState("");
  const posts = searchPosts(list.posts, query);
  return (
    <>
      <div className="bar">
        <div className="bar-in">
          <Logo size={32} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search"
          />
          <span className="count">
            {posts.length} of {list.posts.length}
          </span>
        </div>
      </div>
      <h1 className="heading">{list.name}</h1>
      {posts.length ? (
        <main className="grid">
          {posts.map((post, i) => (
            <a
              key={i}
              className="tile"
              href={safeHref(post.url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={post.thumbnailUrl || placeholder}
                alt=""
                loading="lazy"
                onError={(e) => (e.currentTarget.src = placeholder)}
              />
              <div className="overlay">
                <div className="title">{post.title}</div>
                <div className="author">{post.author}</div>
                <div className="tags">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="tag">+{post.tags.length - 3}</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </main>
      ) : (
        <p className="empty">No posts match “{query}”.</p>
      )}
    </>
  );
}

function Footer() {
  const report = `mailto:hello@nativ.codes?subject=${encodeURIComponent("Report a list")}&body=${encodeURIComponent(location.href)}`;
  return (
    <footer className="footer">
      <a href="https://nativ.codes/legal/zaveit">Privacy</a>
      <a href={report}>Report</a>
    </footer>
  );
}
