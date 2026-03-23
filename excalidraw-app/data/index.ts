import {
  encode,
  decode,
  base64urlToString,
  stringToBase64,
} from "@excalidraw/excalidraw/data/encode";
import { serializeAsJSON } from "@excalidraw/excalidraw/data/json";
import { isInvisiblySmallElement } from "@excalidraw/element";
import { isInitializedImageElement } from "@excalidraw/element";
import { t } from "@excalidraw/excalidraw/i18n";

import type { ImportedDataState } from "@excalidraw/excalidraw/data/types";
import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

export const isSyncableElement = (
  element: OrderedExcalidrawElement,
): element is OrderedExcalidrawElement => {
  if (element.isDeleted) {
    if (element.updated > Date.now() - 24 * 60 * 60 * 1000) {
      return true;
    }
    return false;
  }
  return !isInvisiblySmallElement(element);
};

export const getSyncableElements = (
  elements: readonly OrderedExcalidrawElement[],
) =>
  elements.filter((element) =>
    isSyncableElement(element),
  );

const URL_SHARE_SCENE_MAX_LENGTH = 2000;
const RE_READONLY_LINK = /^#data=([a-zA-Z0-9_-]+)$/;

const toBase64url = (buffer: string) =>
  stringToBase64(buffer, true)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

export const getReadonlyLinkData = (link: string) => {
  const hash = new URL(link).hash;
  const match = hash.match(RE_READONLY_LINK);
  return match ? match[1] : null;
};

export const importFromReadonlyLinkData = async (
  payload: string,
): Promise<ImportedDataState> => {
  const compressedText = base64urlToString(payload);
  const parsedData: ImportedDataState = JSON.parse(
    decode({
      version: "1",
      encoding: "bstring",
      compressed: true,
      encoded: compressedText,
    }),
  );

  return {
    elements: parsedData.elements || null,
    appState: parsedData.appState || null,
  };
};

type ExportToReadonlyLinkResult =
  | { url: null; errorMessage: string }
  | { url: string; errorMessage: null };

export const exportToReadonlyLink = async (
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  _files: BinaryFiles,
): Promise<ExportToReadonlyLinkResult> => {
  if (
    elements.some((element) => isInitializedImageElement(element))
  ) {
    return {
      url: null,
      errorMessage: t("alerts.urlShareImagesNotSupported"),
    };
  }

  try {
    const payload = encode({
      text: serializeAsJSON(elements, appState, {}, "database"),
      compress: true,
    });

    const shareData = toBase64url(payload.encoded);

    const url = new URL(window.location.href);
    url.hash = `data=${shareData}`;

    if (url.toString().length > URL_SHARE_SCENE_MAX_LENGTH) {
      return {
        url: null,
        errorMessage: t("alerts.couldNotCreateShareableLinkTooBig"),
      };
    }

    return { url: url.toString(), errorMessage: null };
  } catch (error: any) {
    console.error(error);

    return { url: null, errorMessage: t("alerts.couldNotCreateShareableLink") };
  }
};
