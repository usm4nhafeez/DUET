import { deleteApp, getApp, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import type { Entry } from './types';

export const CLOUD_CFG_KEY = 'duet-firebase-config';
export const CLOUD_CODE_KEY = 'duet-ledger-code';
const CONNECT_PREFIX = 'duet-sync:';

export interface CloudHandle {
  app: FirebaseApp;
  db: Firestore;
  docRef: DocumentReference;
  code: string;
}

/** accepts the firebaseConfig object literal, strict JSON, or a duet connect code */
export function parseFirebaseConfig(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const unpacked = unpackConnectCode(trimmed);
  if (unpacked) return unpacked.config;

  const tryObj = (candidate: string): Record<string, unknown> | null => {
    try {
      const j = JSON.parse(candidate);
      if (j && typeof j === 'object' && (j as Record<string, unknown>).apiKey) {
        return j as Record<string, unknown>;
      }
    } catch {
      /* not strict json */
    }
    try {
      // firebase console snippets are JS object literals ({ apiKey: "…", … })
      const fn = new Function(`"use strict"; return (${candidate});`) as () => unknown;
      const o = fn();
      if (o && typeof o === 'object' && (o as Record<string, unknown>).apiKey) {
        return o as Record<string, unknown>;
      }
    } catch {
      /* not an object literal */
    }
    return null;
  };

  const direct = tryObj(trimmed);
  if (direct) return direct;
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    const inner = tryObj(match[0]);
    if (inner) return inner;
  }
  throw new Error('could not read that config — paste the firebaseConfig object from the firebase console');
}

export const sanitizeCode = (c: string): string =>
  c
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);

export async function connectCloud(
  config: Record<string, unknown>,
  codeRaw: string,
): Promise<CloudHandle> {
  const code = sanitizeCode(codeRaw) || 'usman-fasi';
  try {
    await deleteApp(getApp('duet-ledger-app'));
  } catch {
    /* no app alive yet */
  }
  const app = initializeApp(config, 'duet-ledger-app');
  const db = getFirestore(app);
  return { app, db, docRef: doc(db, 'duet-ledgers', code), code };
}

export async function pushEntries(h: CloudHandle, entries: Entry[]): Promise<void> {
  await setDoc(h.docRef, { v: 1, updatedAt: new Date().toISOString(), entries });
}

export function subscribeEntries(
  h: CloudHandle,
  cb: (entries: Entry[] | null) => void,
  onError: (msg: string) => void,
): () => void {
  return onSnapshot(
    h.docRef,
    (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      const data = snap.data() as { entries?: unknown };
      cb(Array.isArray(data?.entries) ? (data.entries as Entry[]) : []);
    },
    (err) => onError(err?.message ?? 'subscription failed'),
  );
}

export async function destroyCloud(h: CloudHandle): Promise<void> {
  try {
    await deleteApp(h.app);
  } catch {
    /* already gone */
  }
}

/* ---------- shareable connect code (config + ledger code in one blob) ---------- */

export function packConnectCode(config: Record<string, unknown>, code: string): string {
  return CONNECT_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify({ c: config, k: code }))));
}

export function unpackConnectCode(
  text: string,
): { config: Record<string, unknown>; code: string } | null {
  if (!text.startsWith(CONNECT_PREFIX)) return null;
  try {
    const obj = JSON.parse(decodeURIComponent(escape(atob(text.slice(CONNECT_PREFIX.length)))));
    if (obj?.c?.apiKey && typeof obj?.k === 'string') {
      return { config: obj.c as Record<string, unknown>, code: obj.k };
    }
  } catch {
    /* bad blob */
  }
  return null;
}
