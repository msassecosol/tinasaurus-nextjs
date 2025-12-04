import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>TinaCMS Backend</h1>
      <p>Your TinaCMS self-hosted backend is ready!</p>
      <nav style={{ marginTop: "1rem" }}>
        <ul>
          <li>
            <Link href="/admin">Go to TinaCMS Admin</Link>
          </li>
          <li>
            <Link href="/demo/blog/hello-world">View Demo Blog Post</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
