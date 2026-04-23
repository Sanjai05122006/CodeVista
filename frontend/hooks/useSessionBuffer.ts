"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveSessionSnapshot, type BufferedExecution } from "@/lib/api";

type SessionBufferState = {
  sessionId: string | null;
  startedAt: string;
  title?: string;
  executions: BufferedExecution[];
};

const SAVE_DEBOUNCE_MS = 15000;

export function useSessionBuffer(accessToken: string | null) {
  const [state, setState] = useState<SessionBufferState>({
    sessionId: null,
    startedAt: new Date().toISOString(),
    executions: [],
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const stateRef = useRef(state);
  const saveTimerRef = useRef<number | null>(null);
  const isFlushingRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearTimer = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    if (!accessToken || isFlushingRef.current) {
      return stateRef.current.sessionId;
    }

    const snapshot = stateRef.current;

    if (snapshot.executions.length === 0) {
      return snapshot.sessionId;
    }

    isFlushingRef.current = true;
    setSaving(true);
    setSaveError(null);

    try {
      const response = await saveSessionSnapshot(
        {
          sessionId: snapshot.sessionId ?? undefined,
          title: snapshot.title,
          startedAt: snapshot.startedAt,
          executions: snapshot.executions,
        },
        accessToken
      );

      setState((current) => ({
        ...current,
        sessionId: response.session_id,
      }));

      return response.session_id;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save session.";
      setSaveError(message);
      throw error;
    } finally {
      isFlushingRef.current = false;
      setSaving(false);
    }
  }, [accessToken]);

  const queueSave = useCallback(() => {
    clearTimer();

    if (!accessToken) {
      return;
    }

    saveTimerRef.current = window.setTimeout(() => {
      void flush();
    }, SAVE_DEBOUNCE_MS);
  }, [accessToken, clearTimer, flush]);

  const appendExecution = useCallback(
    (execution: BufferedExecution, title?: string) => {
      setState((current) => ({
        ...current,
        title: title ?? current.title,
        executions: [...current.executions, execution],
      }));

      queueSave();
    },
    [queueSave]
  );

  const resetBuffer = useCallback(() => {
    clearTimer();
    setState({
      sessionId: null,
      startedAt: new Date().toISOString(),
      executions: [],
    });
    setSaveError(null);
  }, [clearTimer]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      clearTimer();

      if (!accessToken || stateRef.current.executions.length === 0) {
        return;
      }

      void fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
        }/session/save`,
        {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            sessionId: stateRef.current.sessionId,
            title: stateRef.current.title,
            startedAt: stateRef.current.startedAt,
            executions: stateRef.current.executions,
          }),
        }
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [accessToken, clearTimer]);

  return useMemo(
    () => ({
      sessionId: state.sessionId,
      startedAt: state.startedAt,
      executions: state.executions,
      appendExecution,
      flush,
      resetBuffer,
      saving,
      saveError,
    }),
    [appendExecution, flush, resetBuffer, saveError, saving, state]
  );
}
