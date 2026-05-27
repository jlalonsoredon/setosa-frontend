import type { APIRoute } from "astro";

const UPSTREAM = "https://setosa-te3e.onrender.com/api/v1/predict";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();
  const res = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
};
