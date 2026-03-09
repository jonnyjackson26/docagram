A canva-like editor where the state of the document is encoded into the URL, making this ideal for putting diagram images in README docs because if you ever need to alter a diagram, all you need to do is go to the link, make the changes, and replace the link.


Forked from [Excalidraw](https://github.com/excalidraw/excalidraw)

## Embeddable image URL

The app now includes a render endpoint for readonly payloads:

`/api/render?data=<readonlyPayload>&format=svg`

You can also pass a full readonly link:

`/api/render?url=<https://.../#data=...>&format=svg`

Use it in markdown image syntax:

![Diagram](https://docagram.vercel.app/api/render?data=<readonlyPayload>&format=svg)

Notes:
- `data` is the payload value from `#data=...` (omit the `#data=` prefix).
- You can provide either `data` or `url`.
- Current implementation supports `format=svg`.
- Payloads above the endpoint limit are rejected.

Install
```
yarn    (install )
yarn start    (run app)
```