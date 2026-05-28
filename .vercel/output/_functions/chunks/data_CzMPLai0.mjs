const prerender = false;
const UPSTREAM = "https://setosa-te3e.onrender.com/api/v1/data";
const GET = async () => {
  const res = await fetch(UPSTREAM);
  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
