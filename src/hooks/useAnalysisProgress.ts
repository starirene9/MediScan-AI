import { useEffect, useMemo, useState } from "react";

export type AnalysisPhase =
  | "preparing"
  | "inference"
  | "gradcam"
  | "long_running";

const PHASE_MESSAGE_IDS: Record<AnalysisPhase, string> = {
  preparing: "analyze_phase_preparing",
  inference: "analyze_phase_inference",
  gradcam: "analyze_phase_gradcam",
  long_running: "analyze_phase_long_running",
};

function resolvePhase(elapsedSeconds: number, modelReady: boolean): AnalysisPhase {
  if (!modelReady && elapsedSeconds < 120) {
    return "preparing";
  }
  if (elapsedSeconds >= 45) {
    return "long_running";
  }
  if (elapsedSeconds >= 12) {
    return "gradcam";
  }
  return "inference";
}

export function useAnalysisProgress(analyzing: boolean, modelReady: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!analyzing) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    setElapsedSeconds(0);
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [analyzing]);

  const phase = useMemo(
    () => (analyzing ? resolvePhase(elapsedSeconds, modelReady) : "inference"),
    [analyzing, elapsedSeconds, modelReady]
  );

  return {
    elapsedSeconds,
    phase,
    phaseMessageId: PHASE_MESSAGE_IDS[phase],
    showFirstRunHint:
      analyzing && (!modelReady || phase === "preparing" || phase === "long_running"),
  };
}
