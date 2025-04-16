import { useEffect, useMemo, useState } from "react";

import "./App.css";
import { DateTime } from "luxon";

interface TimerState {
  start: DateTime;
  current: DateTime;
}

const preDelay = 10; // in seconds
const cycleWork = 20; // in seconds
const cycleRest = 10; // in seconds
const cycleCount = 8;

const Timer: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerState | null>(null);

  const start = timerState?.start;
  useEffect(() => {
    if (!start) {
      return;
    }

    const interval = setInterval(() => {
      setTimerState(
        (prevState) =>
          prevState && {
            ...prevState,
            current: DateTime.now(),
          },
      );
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [start]);

  function startTimer() {
    setTimerState({
      start: DateTime.now(),
      current: DateTime.now(),
    });
  }

  const seq = useMemo(() => {
    if (!timerState) {
      return null;
    }

    const secondsDiff = Math.floor(
      timerState.current.diff(timerState.start, "seconds").seconds,
    );

    if (secondsDiff < preDelay) {
      return {
        type: "preDelay" as const,
        timeLeft: preDelay - secondsDiff,
      };
    }

    const cycleTime = secondsDiff - preDelay;
    const cycleIndex = Math.floor(cycleTime / (cycleWork + cycleRest));
    if (cycleIndex >= cycleCount) {
      return {
        type: "done" as const,
      };
    }

    const cycleStart = cycleIndex * (cycleWork + cycleRest);
    const cycleElapsed = cycleTime - cycleStart;

    if (cycleElapsed < cycleWork) {
      return {
        type: "work" as const,
        cycleTime,
        cycleIndex,
        timeLeft: cycleWork - cycleElapsed,
      };
    }

    const cycleRestElapsed = cycleElapsed - cycleWork;

    return {
      type: "rest" as const,
      cycleTime,
      cycleIndex,
      timeLeft: cycleRest - cycleRestElapsed,
    };
  }, [timerState]);

  return (
    <div>
      {seq ? (
        <div>
          {seq.type === "preDelay" && (
            <div>Get ready: {seq.timeLeft} seconds</div>
          )}

          {seq.type === "work" && (
            <div>
              Cycle {seq.cycleIndex + 1}/{cycleCount}: work {seq.timeLeft}{" "}
              seconds
            </div>
          )}

          {seq.type === "rest" && (
            <div>
              Cycle {seq.cycleIndex + 1}/{cycleCount}: rest {seq.timeLeft}{" "}
              seconds
            </div>
          )}

          {seq.type === "done" && <div>Done!</div>}
        </div>
      ) : (
        <div>--</div>
      )}

      <div className="flex gap-2">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            startTimer();
          }}
        >
          Start
        </button>
        <button
          className="btn btn-error"
          type="button"
          onClick={() => {
            setTimerState(null);
          }}
        >
          Stop
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <div>
      <Timer />
    </div>
  );
}

export default App;
