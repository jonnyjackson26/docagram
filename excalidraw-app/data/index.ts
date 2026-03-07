import {
  encode,
  decode,
  base64urlToString,
  stringToBase64,
} from "@excalidraw/excalidraw/data/encode";
import { generateEncryptionKey } from "@excalidraw/excalidraw/data/encryption";
import { serializeAsJSON } from "@excalidraw/excalidraw/data/json";
import { isInvisiblySmallElement } from "@excalidraw/element";
import { isInitializedImageElement } from "@excalidraw/element";
import { t } from "@excalidraw/excalidraw/i18n";
import { bytesToHexString } from "@excalidraw/common";

import type { UserIdleState } from "@excalidraw/common";
import type { ImportedDataState } from "@excalidraw/excalidraw/data/types";
import type { SceneBounds } from "@excalidraw/element";
import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type {
  AppState,
  BinaryFiles,
  SocketId,
} from "@excalidraw/excalidraw/types";
import type { MakeBrand } from "@excalidraw/common/utility-types";

import {
  DELETED_ELEMENT_TIMEOUT,
  ROOM_ID_BYTES,
} from "../app_constants";

import type { WS_SUBTYPES } from "../app_constants";

export type SyncableExcalidrawElement = OrderedExcalidrawElement &
  MakeBrand<"SyncableExcalidrawElement">;

export const isSyncableElement = (
  element: OrderedExcalidrawElement,
): element is SyncableExcalidrawElement => {
  if (element.isDeleted) {
    if (element.updated > Date.now() - DELETED_ELEMENT_TIMEOUT) {
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
  ) as SyncableExcalidrawElement[];

const URL_SHARE_SCENE_MAX_LENGTH = 2000;
const RE_READONLY_LINK = /^#data=([a-zA-Z0-9_-]+)$/;

const generateRoomId = async () => {
  const buffer = new Uint8Array(ROOM_ID_BYTES);
  window.crypto.getRandomValues(buffer);
  return bytesToHexString(buffer);
};

export type EncryptedData = {
  data: ArrayBuffer;
  iv: Uint8Array;
};

export type SocketUpdateDataSource = {
  INVALID_RESPONSE: {
    type: WS_SUBTYPES.INVALID_RESPONSE;
  };
  SCENE_INIT: {
    type: WS_SUBTYPES.INIT;
    payload: {
      elements: readonly OrderedExcalidrawElement[];
    };
  };
  SCENE_UPDATE: {
    type: WS_SUBTYPES.UPDATE;
    payload: {
      elements: readonly OrderedExcalidrawElement[];
    };
  };
  MOUSE_LOCATION: {
    type: WS_SUBTYPES.MOUSE_LOCATION;
    payload: {
      socketId: SocketId;
      pointer: { x: number; y: number; tool: "pointer" | "laser" };
      button: "down" | "up";
      selectedElementIds: AppState["selectedElementIds"];
      username: string;
    };
  };
  USER_VISIBLE_SCENE_BOUNDS: {
    type: WS_SUBTYPES.USER_VISIBLE_SCENE_BOUNDS;
    payload: {
      socketId: SocketId;
      username: string;
      sceneBounds: SceneBounds;
    };
  };
  IDLE_STATUS: {
    type: WS_SUBTYPES.IDLE_STATUS;
    payload: {
      socketId: SocketId;
      userState: UserIdleState;
      username: string;
    };
  };
};

export type SocketUpdateDataIncoming =
  SocketUpdateDataSource[keyof SocketUpdateDataSource];

export type SocketUpdateData =
  SocketUpdateDataSource[keyof SocketUpdateDataSource] & {
    _brand: "socketUpdateData";
  };

const RE_COLLAB_LINK = /^#room=([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)$/;

export const isCollaborationLink = (link: string) => {
  const hash = new URL(link).hash;
  return RE_COLLAB_LINK.test(hash);
};

export const getCollaborationLinkData = (link: string) => {
  const hash = new URL(link).hash;
  const match = hash.match(RE_COLLAB_LINK);
  if (match && match[2].length !== 22) {
    window.alert(t("alerts.invalidEncryptionKey"));
    return null;
  }
  return match ? { roomId: match[1], roomKey: match[2] } : null;
};

export const generateCollaborationLinkData = async () => {
  const roomId = await generateRoomId();
  const roomKey = await generateEncryptionKey();

  if (!roomKey) {
    throw new Error("Couldn't generate room key");
  }

  return { roomId, roomKey };
};

export const getCollaborationLink = (data: {
  roomId: string;
  roomKey: string;
}) => {
  return `${window.location.origin}${window.location.pathname}#room=${data.roomId},${data.roomKey}`;
};

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
