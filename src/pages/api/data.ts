import type { APIRoute } from "astro";

const UPSTREAM = "https://setosa-te3e.onrender.com/api/v1/data";

export const GET: APIRoute = async () => {
  const res = await fetch(UPSTREAM);
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
