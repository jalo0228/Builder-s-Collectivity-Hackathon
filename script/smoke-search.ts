type Profile = {
  id: number;
  name: string;
  serviceType: string;
  description: string;
  location: string;
  lat: string | null;
  lng: string | null;
};

async function main() {
  const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:5000";
  const query = process.env.QUERY ?? "state college tutor";

  const url = new URL("/api/profiles/search", baseUrl);
  url.searchParams.set("q", query);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Search request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Profile[];

  // This smoke test guards against the old behavior where multi-word queries
  // returned 0 results despite matching profiles existing (e.g. locations).
  if (data.length === 0) {
    throw new Error(
      `Smoke test failed: expected results for query "${query}" at ${baseUrl}, got 0.`,
    );
  }

  const hasStateCollege = data.some((p) =>
    (p.location ?? "").toLowerCase().includes("state college"),
  );
  if (!hasStateCollege) {
    throw new Error(
      `Smoke test failed: expected at least one result with location containing "State College".`,
    );
  }

  console.log(`OK: ${data.length} results for "${query}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
