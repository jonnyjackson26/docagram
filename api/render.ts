import { inflate } from "pako";
import { JSDOM } from "jsdom";

import type { ExcalidrawElement } from "@excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";

type ImportedDataState = {
  elements: readonly ExcalidrawElement[] | null;
  appState: Partial<AppState> | null;
};

type ApiRequest = {
  query: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ApiResponse;
  send: (body: string) => void;
};

const MAX_DATA_LENGTH = 20_000;
const READONLY_HASH_DATA_REGEX = /^#data=([a-zA-Z0-9_-]+)$/;

const getStringQueryParam = (
  req: ApiRequest,
  key: string,
): string | undefined => {
  const value = req.query[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const fromBase64urlToByteString = (encoded: string): string => {
  const normalized = encoded
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), "=");

  return Buffer.from(normalized, "base64").toString("latin1");
};

const fromByteStringToUint8 = (byteString: string): Uint8Array => {
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }
  return bytes;
};

const getPayloadFromReadonlyUrl = (readonlyUrl: string): string | null => {
  try {
    const hash = new URL(readonlyUrl).hash;
    const match = hash.match(READONLY_HASH_DATA_REGEX);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
};

const importFromReadonlyLinkData = (payload: string): ImportedDataState => {
  const compressedByteString = fromBase64urlToByteString(payload);
  const inflated = inflate(fromByteStringToUint8(compressedByteString), {
    to: "string",
  });

  const parsedData = JSON.parse(inflated) as ImportedDataState;

  return {
    elements: parsedData.elements || null,
    appState: parsedData.appState || null,
  };
};

const installDomGlobals = () => {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return;
  }

  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
  });

  const globalScope = globalThis as typeof globalThis & {
    window: Window & typeof globalThis;
    document: Document;
    navigator: Navigator;
    HTMLElement: typeof HTMLElement;
    SVGElement: typeof SVGElement;
    Element: typeof Element;
    Node: typeof Node;
    atob: (data: string) => string;
    btoa: (data: string) => string;
  };

  globalScope.window = dom.window as unknown as Window & typeof globalThis;
  globalScope.document = dom.window.document;
  globalScope.navigator = dom.window.navigator;
  globalScope.HTMLElement = dom.window.HTMLElement;
  globalScope.SVGElement = dom.window.SVGElement;
  globalScope.Element = dom.window.Element;
  globalScope.Node = dom.window.Node;
  globalScope.atob = (data: string) =>
    Buffer.from(data, "base64").toString("binary");
  globalScope.btoa = (data: string) =>
    Buffer.from(data, "binary").toString("base64");
};

const sendError = (res: ApiResponse, code: number, message: string) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(code).send(message);
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const format = (getStringQueryParam(req, "format") || "svg").toLowerCase();

  if (format !== "svg") {
    return sendError(res, 400, "Only format=svg is currently supported.");
  }

  const payloadFromData = getStringQueryParam(req, "data");
  const payloadFromUrl = getPayloadFromReadonlyUrl(
    getStringQueryParam(req, "url") || "",
  );
  const payload = payloadFromData || payloadFromUrl;

  if (!payload) {
    return sendError(
      res,
      400,
      "Missing payload. Use either data=<payload> or url=<readonlyLink>",
    );
  }

  if (payload.length > MAX_DATA_LENGTH) {
    return sendError(res, 413, "Payload too large");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(payload)) {
    return sendError(res, 400, "Invalid payload format");
  }

  try {
    installDomGlobals();

    const [appStateModule, restoreModule, exportModule] = await Promise.all([
      import("../packages/excalidraw/appState"),
      import("../packages/excalidraw/data/restore"),
      import("../packages/excalidraw/scene/export"),
    ]);

    const { getDefaultAppState } = appStateModule;
    const { restoreAppState, restoreElements } = restoreModule;
    const { exportToSvg } = exportModule;

    const imported = importFromReadonlyLinkData(payload);
    const restoredElements = restoreElements(imported.elements, null, {
      deleteInvisibleElements: true,
    });

    if (!restoredElements.length) {
      return sendError(res, 422, "No drawable elements found");
    }

    const restoredAppState = restoreAppState(imported.appState, null);
    const exportAppState = {
      ...getDefaultAppState(),
      ...restoredAppState,
      exportBackground: restoredAppState.exportBackground ?? true,
      viewBackgroundColor: restoredAppState.viewBackgroundColor ?? "#ffffff",
      exportScale: 1,
      exportEmbedScene: false,
    };

    const svg = await exportToSvg(restoredElements, exportAppState, null, {
      skipInliningFonts: true,
    });

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.status(200).send(svg.outerHTML);
  } catch (error) {
    console.error("Failed to render readonly scene", error);
    return sendError(res, 500, "Failed to render scene");
  }
}
