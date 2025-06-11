import { useEffect, useRef, useState } from "react";

function isDeepEqual(a: unknown, b: unknown) {
  // cheap and dirty JSON stringify comparison
  // @todo use a better deep equal function
  const aStr = JSON.stringify(a);
  const bStr = JSON.stringify(b);
  return aStr === bStr;
}

// return consistent object reference if value is deep-equal
export function useStableValue<T>(value: T) {
  const stableRef = useRef<T>(value);
  if (!isDeepEqual(stableRef.current, value)) {
    stableRef.current = value;
  }

  return stableRef.current;
}

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
