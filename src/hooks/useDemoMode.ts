import { useEffect, useState } from "react";
import { fetchHealth } from "../services/apiClient";

let cached: Promise<boolean> | null = null;

function loadDemoMode(): Promise<boolean> {
  cached ??= fetchHealth()
    .then((health) => Boolean(health.demoMode))
    .catch(() => {
      cached = null;
      return false;
    });
  return cached;
}

/** True when the backend runs as the public demo (deletes and patient edits disabled). */
const useDemoMode = (): boolean => {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let active = true;
    loadDemoMode().then((value) => {
      if (active) setDemoMode(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return demoMode;
};

export default useDemoMode;
