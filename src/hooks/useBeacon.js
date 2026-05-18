import { useState, useCallback } from 'react';
import { SEED, DEFAULTS } from '../data/seed.js';

const STORE_KEY = "beacon.v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.earliestOnly === undefined) parsed.earliestOnly = DEFAULTS.earliestOnly;
      const existing = new Set((parsed.records || []).map(r => r.id));
      const missing = SEED.filter(r => !existing.has(r.id));
      if (missing.length) parsed.records = (parsed.records || []).concat(missing);
      return parsed;
    }
  } catch (e) {}
  return {
    records: SEED.slice(),
    weights: { ...DEFAULTS.weights },
    digestSize: DEFAULTS.digestSize,
    slackWebhook: DEFAULTS.slackWebhook,
    earliestOnly: DEFAULTS.earliestOnly,
  };
}

export function useBeacon() {
  const [state, setStateRaw] = useState(loadState);

  const setState = useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateRecord = useCallback((rec) => {
    setState(prev => {
      const idx = prev.records.findIndex(r => r.id === rec.id);
      const records = [...prev.records];
      if (idx >= 0) records[idx] = rec;
      else records.unshift(rec);
      return { ...prev, records };
    });
  }, [setState]);

  const moveRecord = useCallback((id, status) => {
    setState(prev => ({
      ...prev,
      records: prev.records.map(r => r.id === id ? { ...r, status } : r),
    }));
  }, [setState]);

  const resetWeights = useCallback(() => {
    setState(prev => ({ ...prev, weights: { ...DEFAULTS.weights } }));
  }, [setState]);

  const setWeights = useCallback((weights) => {
    setState(prev => ({ ...prev, weights }));
  }, [setState]);

  const setDigestSize = useCallback((digestSize) => {
    setState(prev => ({ ...prev, digestSize }));
  }, [setState]);

  const setSlackWebhook = useCallback((slackWebhook) => {
    setState(prev => ({ ...prev, slackWebhook }));
  }, [setState]);

  const setEarliestOnly = useCallback((earliestOnly) => {
    setState(prev => ({ ...prev, earliestOnly }));
  }, [setState]);

  const importState = useCallback((newState) => {
    setState(newState);
  }, [setState]);

  const resetToSeed = useCallback((slackWebhook) => {
    setState({
      records: SEED.slice(),
      weights: { ...DEFAULTS.weights },
      digestSize: DEFAULTS.digestSize,
      slackWebhook: slackWebhook || "",
      earliestOnly: DEFAULTS.earliestOnly,
    });
  }, [setState]);

  return {
    state,
    updateRecord,
    moveRecord,
    resetWeights,
    setWeights,
    setDigestSize,
    setSlackWebhook,
    setEarliestOnly,
    importState,
    resetToSeed,
  };
}
