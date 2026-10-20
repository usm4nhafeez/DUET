import { useCallback, useEffect, useRef, useState } from 'react';
import type { Entry } from '../lib/types';
import { fmtTime } from '../lib/format';
import {
  CLOUD_CFG_KEY,
  CLOUD_CODE_KEY,
  connectCloud,
  destroyCloud,
  packConnectCode,
  parseFirebaseConfig,
  pushEntries,
  subscribeEntries,
  unpackConnectCode,
  type CloudHandle,
} from '../lib/cloud';

export type CloudState = 'off' | 'connecting' | 'online' | 'error';

export interface CloudSync {
  state: CloudState;
  code: string;
  error: string;
  lastPush: string;
  connectCode: string; // shareable blob when online
  connect: (text: string, codeText: string) => Promise<boolean>;
  disconnect: () => void;
}

const ls = {
  get(key: string): string {
    try {
      return localStorage.getItem(key) ?? '';
    } catch {
      return '';
    }
  },
  set(key: string, val: string): void {
    try {
      localStorage.setItem(key, val);
    } catch {
      /* private mode */
    }
  },
  del(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

/**
 * Realtime cross-device sync via Firebase Firestore.
 * One shared document holds the entries array — every screen
 * subscribes to it, so edits appear everywhere in ~1s.
 */
export function useCloudSync(entries: Entry[], adopt: (list: Entry[]) => void): CloudSync {
  const [state, setState] = useState<CloudState>('off');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [lastPush, setLastPush] = useState('');
  const [connectCode, setConnectCode] = useState('');

  const cloudRef = useRef<CloudHandle | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const entriesRef = useRef(entries);
  const adoptRef = useRef(adopt);
  const lastRemoteRef = useRef('__init__');
  const pushTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);
  useEffect(() => {
    adoptRef.current = adopt;
  }, [adopt]);

  const ser = (list: Entry[]) => JSON.stringify(list);

  const attach = useCallback((h: CloudHandle) => {
    cloudRef.current = h;
    unsubRef.current?.();
    lastRemoteRef.current = '__init__';
    unsubRef.current = subscribeEntries(
      h,
      (remote) => {
        if (remote === null) {
          /* doc doesn't exist yet — this device becomes the author */
          const local = entriesRef.current;
          lastRemoteRef.current = ser(local);
          pushEntries(h, local)
            .then(() => setLastPush(fmtTime(new Date())))
            .catch((e: unknown) => {
              setState('error');
              setError(`first write failed — check firestore rules (${(e as Error)?.message ?? e})`);
            });
          return;
        }
        const remoteSer = ser(remote);
        const differs = remoteSer !== ser(entriesRef.current);
        lastRemoteRef.current = remoteSer;
        if (differs) adoptRef.current(remote); // another device edited — mirror it
      },
      (msg) => {
        setState('error');
        setError(`live link broken — ${msg}`);
      },
    );
  }, []);

  const connect = useCallback(
    async (text: string, codeText: string): Promise<boolean> => {
      setState('connecting');
      setError('');
      try {
        const packed = unpackConnectCode(text.trim());
        const code = packed ? packed.code : codeText;
        const config = packed ? packed.config : parseFirebaseConfig(text);
        const h = await connectCloud(config, code);
        attach(h);
        setCode(h.code);
        setConnectCode(packConnectCode(config, h.code));
        ls.set(CLOUD_CFG_KEY, JSON.stringify(config));
        ls.set(CLOUD_CODE_KEY, h.code);
        setState('online');
        return true;
      } catch (e) {
        setState('error');
        setError(e instanceof Error ? e.message : 'connection failed');
        return false;
      }
    },
    [attach],
  );

  /* boot — reconnect silently when setup was saved before */
  useEffect(() => {
    const cfg = ls.get(CLOUD_CFG_KEY);
    if (cfg) void connect(cfg, ls.get(CLOUD_CODE_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* push local edits to every other device (debounced) */
  useEffect(() => {
    if (state !== 'online') return;
    const local = ser(entries);
    if (local === lastRemoteRef.current) return; // this change came FROM the cloud
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      const h = cloudRef.current;
      if (!h) return;
      pushEntries(h, entries)
        .then(() => {
          lastRemoteRef.current = local;
          setLastPush(fmtTime(new Date()));
        })
        .catch((e: unknown) => {
          setState('error');
          setError(`sync write failed — ${(e as Error)?.message ?? e}`);
        });
    }, 450);
    return () => clearTimeout(pushTimer.current);
  }, [entries, state]);

  const disconnect = useCallback(() => {
    clearTimeout(pushTimer.current);
    unsubRef.current?.();
    unsubRef.current = null;
    const h = cloudRef.current;
    cloudRef.current = null;
    if (h) void destroyCloud(h);
    ls.del(CLOUD_CFG_KEY);
    ls.del(CLOUD_CODE_KEY);
    lastRemoteRef.current = '__init__';
    setCode('');
    setConnectCode('');
    setLastPush('');
    setError('');
    setState('off');
  }, []);

  return { state, code, error, lastPush, connectCode, connect, disconnect };
}
