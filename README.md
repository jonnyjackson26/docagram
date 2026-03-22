# Docs + Diagrams = Docagram
A diagram editor where the state of the document is encoded into the URL, making it ideal for embedding diagram images in README docs. If you ever need to alter a diagram, just go to the link, make changes, and replace the link.

Forked from [Excalidraw](https://github.com/excalidraw/excalidraw)

## Embeddable SVG rendering

The `/api/render` endpoint renders any diagram as an SVG image, server-side. Pass the encoded payload directly or a full readonly URL:

```
/api/render?data=<payload>&format=svg
/api/render?url=<https://docagram.vercel.app/#data=...>&format=svg
```

Use it in markdown to embed a live diagram image:

```markdown
![Diagram](https://docagram.vercel.app/api/render?data=<payload>&format=svg)
```

- `data` is the payload from the URL hash (`#data=...`), without the `#data=` prefix.
- `format=svg` is the only supported format currently.
- Large payloads (>20,000 chars) are rejected.


# Example:
![Diagram](https://docagram.vercel.app/api/render?data=eJx1U11vmzAUfe-vQPR1STGfIY_b-tBpmSYxaZqmaXLgAk4cmxqTlFX57712ErxkGkiWOPfr-JzL653n-XrswF96PryUlLNK0YP_zuB7UD2TAkOh_e7loEqb2Wrd9cuHB6hrKDXbw6zvaInn2GvYzTb5ZrNPVfecH8pks4lnURCQOe26ecN0O6znFexPI4DDDoTuselP_Pa8V3tihFVm0EqScPxRfIXiWxPWvz8Xn57VaEtt0oW5QhZUNBxc6AXxhCTzMMDZYRhkQUTCKTqaSyWL62gyhQ-s0q1JidIJa4E1rUaQZPE8xrokziOSxkHq2p44LL1gQnqt5BY-SC6VIXpPwLyO5pqW20bJQVRTjlZUoJwKdXF5NeO80KPtjkagTf7NjO8Xzjf4_6pwaNMK6I32ZEIl-si0kYcE7haGYfdUWZt-OU6K7uDJ-CQGzieYiQqM-j4NrqaJ6jzt4rEzMDojR8cdwDTOk3SRRmnirHFLSbJb8IsUdj9JEibxIk1TV8b6j7hr2jatKe_BOWCYPbo9vLrL0FX0VESyLCILkkf5InMScya2tzVclls3x6JHPK1uPv4EhcaWkwyoLasK9scg4VnxE6ahMzv8F7SSFTwKuua31_D3DA7v_12l-9o-ZxvOzFYD16xANfDPlcIaYvgd745vAgUQxA&format=svg)

# The Problem:  

# The Soultion:  


## Local Development

```bash
yarn                       # install dependencies

# Terminal 1: build & start the render server
yarn build:render          # bundles server/render-handler.ts + excalidraw into api/serve.mjs
yarn start:render          # starts render server on port 3002

# Terminal 2: start the app
yarn start                 # starts Vite dev server on port 3001
```

Vite proxies `/api/render` requests to the render server automatically.

The render server port is configurable via `RENDER_PORT` env var (default: 3002). If you change it, update the proxy target in `excalidraw-app/vite.config.mts` to match.

## Deployment

Deployed to Vercel. The build step bundles `server/render-handler.ts` into `api/render.js` using esbuild, which Vercel serves as a serverless function. The app build (`excalidraw-app/`) is served as static files.

## Project Structure (additions to Excalidraw)

- `server/render-handler.ts` — SVG render handler (uses JSDOM + Excalidraw's `exportToSvg`)
- `server/serve.ts` — standalone HTTP server for local dev
- `api/render.js` — pre-bundled serverless function (build artifact, committed for Vercel)
