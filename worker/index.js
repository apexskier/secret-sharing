const HEADERS = {
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer-when-downgrade",
  "Permissions-Policy":
    "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()",
};

function cspNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default {
  async fetch(request, env) {
    const asset = await env.ASSETS.fetch(request);
    const headers = new Headers(asset.headers);
    for (const [name, value] of Object.entries(HEADERS)) {
      headers.set(name, value);
    }

    if (!headers.get("Content-Type")?.startsWith("text/html")) {
      return new Response(asset.body, { status: asset.status, headers });
    }

    // index.html's <meta> CSP references __CSP_NONCE__, which must be unique
    // per response, so HTML is never cacheable.
    const body = (await asset.text()).replaceAll("__CSP_NONCE__", cspNonce());
    headers.set("Cache-Control", "no-store");
    headers.delete("ETag");
    headers.delete("Content-Length");
    return new Response(body, { status: asset.status, headers });
  },
};
