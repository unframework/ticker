import { useEffect, useRef, useState } from "react";

export function useLocalState(key: string, initialValue: string) {
  const keyRef = useRef(key); // Avoid depending on key inside effect

  const stateHandles = useState<string>(() => {
    const rawItem = localStorage.getItem(key);
    if (rawItem === null) {
      localStorage.setItem(key, initialValue);
      return initialValue;
    }

    return String(rawItem); // extra stringify just in case
  });
  const [state] = stateHandles;

  const storedRef = useRef<string>(state);

  useEffect(() => {
    if (storedRef.current !== state) {
      localStorage.setItem(keyRef.current, state);
      storedRef.current = state;
    }
  }, [state]);

  return stateHandles;
}
