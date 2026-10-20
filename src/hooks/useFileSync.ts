import { useCallback, useEffect, useRef, useState } from 'react';
import type { Entry } from '../lib/types';
import { localUpdatedAt } from '../lib/store';
import { fmtTime } from '../lib/format';
import {
  clearHandle,
  ensurePermission,
  isFileSyncSupported,
  loadHandle,
  pickOpenFile,
  pickSaveFile,
  queryPermission,
  readFromFile,
  saveHandle,
  writeToFile,
  type FSHandleLite,
} from '../lib/fileSync';

export type FileSyncState =
  | 'checking'
  | 'disconnected'
  | 'needs-permission'
  | 'connected'
  | 'unsupported';

export interface FileSync {
  supported: boolean;
  state: FileSyncState;
  fileName: string;
  lastSaved: string;
  note: string;
  onCreate: () => void;
  onLink: () => void;
  onEnable: () => void;
  onDisconnect: () => void;
}

/**
 * Connects the ledger to a real JSON file on disk:
 *  - auto-writes every change (debounced)
 *  - on boot, restores entries from the file when it holds newer data
 *  - remembers the file across sessions via IndexedDB
 */
export function useFileSync(entries: Entry[], adopt: (list: Entry[]) => void): FileSync {
  const [supported] = useState(() => isFileSyncSupported());
  const [state, setState] = useState<FileSyncState>(supported ? 'checking' : 'unsupported');
  const [fileName, setFileName] = useState('');
  const [lastSaved, setLastSaved] = useState('');
  const [note, setNote] = useState('');

  const handleRef = useRef<FSHandleLite | null>(null);
  const entriesRef = useRef(entries);
  const adoptRef = useRef(adopt);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);
  useEffect(() => {
    adoptRef.current = adopt;
  }, [adopt]);

  /** write the given entries to the linked file */
  const writeNow = useCallback(async (list: Entry[]): Promise<boolean> => {
    const h = handleRef.current;
    if (!h) return false;
    if (!(await ensurePermission(h))) {
      setState('needs-permission');
      setNote('write access was revoked — re-enable it');
      return false;
    }
    try {
      await writeToFile(h, list);
      setLastSaved(fmtTime(new Date()));
      return true;
    } catch {
      setState('needs-permission');
      setNote('could not write to the file — re-enable access');
      return false;
    }
  }, []);

  /** compare file vs browser data — newest side wins */
  const reconcile = useCallback(
    async (h: FSHandleLite) => {
      const res = await readFromFile(h).catch(() => null);
      if (res && res.entries.length > 0 && res.updatedAt > localUpdatedAt()) {
        adoptRef.current(res.entries);
        setNote(`restored ${res.entries.length} entries from ${h.name}`);
        setLastSaved(fmtTime(new Date()));
      } else {
        await writeNow(entriesRef.current);
      }
      setState('connected');
    },
    [writeNow],
  );

  /* boot — silently reconnect if we already know a file */
  useEffect(() => {
    if (!supported) return;
    let alive = true;
    void (async () => {
      const h = await loadHandle().catch(() => null);
      if (!alive) return;
      if (!h) {
        setState('disconnected');
        return;
      }
      handleRef.current = h;
      setFileName(h.name);
      if ((await queryPermission(h)) === 'granted') {
        await reconcile(h);
      } else {
        setState('needs-permission');
      }
    })();
    return () => {
      alive = false;
    };
  }, [supported, reconcile]);

  /* auto-save on every change */
  useEffect(() => {
    if (state !== 'connected') return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void writeNow(entriesRef.current);
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [entries, state, writeNow]);

  /* ---------------- actions ---------------- */
  const onCreate = useCallback(async () => {
    if (!supported) return;
    try {
      const h = await pickSaveFile();
      await saveHandle(h).catch(() => {});
      handleRef.current = h;
      setFileName(h.name);
      if (await writeNow(entriesRef.current)) setState('connected');
      setNote('file created — every change now writes to it');
    } catch {
      /* picker cancelled */
    }
  }, [supported, writeNow]);

  const onLink = useCallback(async () => {
    if (!supported) return;
    try {
      const h = await pickOpenFile();
      if (!h) return;
      await saveHandle(h).catch(() => {});
      handleRef.current = h;
      setFileName(h.name);
      const res = await readFromFile(h).catch(() => null);
      if (res && res.entries.length > 0) {
        const loadIt = window.confirm(
          `"${h.name}" contains ${res.entries.length} ledger entries.\n\n` +
            `OK — load them into the app (recommended if this is your backup)\n` +
            `Cancel — keep current app data and overwrite the file`,
        );
        if (loadIt) {
          adoptRef.current(res.entries);
          setNote(`loaded ${res.entries.length} entries from ${h.name}`);
        } else {
          await writeNow(entriesRef.current);
        }
      } else {
        await writeNow(entriesRef.current);
        setNote('file linked — every change now writes to it');
      }
      setState('connected');
    } catch {
      /* picker cancelled */
    }
  }, [supported, writeNow]);

  const onEnable = useCallback(async () => {
    const h = handleRef.current ?? (await loadHandle().catch(() => null));
    if (!h) {
      setState('disconnected');
      return;
    }
    handleRef.current = h;
    setFileName(h.name);
    if (await ensurePermission(h)) {
      await reconcile(h);
    } else {
      setState('needs-permission');
      setNote('the browser denied file access');
    }
  }, [reconcile]);

  const onDisconnect = useCallback(async () => {
    await clearHandle();
    handleRef.current = null;
    setFileName('');
    setLastSaved('');
    setNote('');
    setState('disconnected');
  }, []);

  return {
    supported,
    state,
    fileName,
    lastSaved,
    note,
    onCreate,
    onLink,
    onEnable,
    onDisconnect,
  };
}
