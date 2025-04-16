import { useEffect, useMemo, useRef, useState } from "react";

import "./App.css";
import { DateTime } from "luxon";

interface TimerState {
  start: DateTime;
  current: DateTime;
  isPaused: boolean;
  pausedTime: number; // seconds, fractional
}

const preDelay = 10; // in seconds
const cycleWork = 20; // in seconds
const cycleRest = 10; // in seconds
const cycleCount = 8;

const startAudio = new Audio("/start.wav");
const goAudio = new Audio("/go.wav");
const restAudio = new Audio("/rest.wav");
const count1Audio = new Audio("/count1.wav");
const count2Audio = new Audio("/count2.wav");
const count3Audio = new Audio("/count3.wav");
const countSamples = [count1Audio, count2Audio, count3Audio];
const doneAudio = new Audio("/done.wav");

function isDeepEqual(a: unknown, b: unknown) {
  // cheap and dirty JSON stringify comparison
  // @todo use a better deep equal function
  const aStr = JSON.stringify(a);
  const bStr = JSON.stringify(b);
  return aStr === bStr;
}

// return consistent object reference if value is deep-equal
function useStableValue<T>(value: T) {
  const stableRef = useRef<T>(value);
  if (!isDeepEqual(stableRef.current, value)) {
    stableRef.current = value;
  }

  return stableRef.current;
}

const Timer: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerState | null>(null);

  const start = timerState && !timerState.isPaused ? timerState.start : null;
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
    }, 250);

    return () => {
      console.log("stopping");
      clearInterval(interval);
    };
  }, [start]);

  function startTimer() {
    setTimerState((prev) => {
      if (!prev) {
        return {
          start: DateTime.now(),
          current: DateTime.now(),
          isPaused: false,
          pausedTime: 0,
        };
      }

      if (prev.isPaused) {
        const addedTime = prev.current.diff(prev.start, "seconds").seconds;
        return {
          start: DateTime.now(),
          current: DateTime.now(),
          isPaused: false,
          pausedTime: prev.pausedTime + addedTime,
        };
      }

      return {
        ...prev,
        isPaused: true,
      };
    });
  }

  const seqRaw = useMemo(() => {
    if (!timerState) {
      return null;
    }

    const secondsDiff = Math.floor(
      timerState.current.diff(timerState.start, "seconds").seconds +
        timerState.pausedTime,
    );

    if (secondsDiff < preDelay) {
      return {
        type: "preDelay" as const,
        timeElapsed: secondsDiff,
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
        timeElapsed: cycleElapsed,
        timeLeft: cycleWork - cycleElapsed,
      };
    }

    if (cycleIndex === cycleCount - 1) {
      // last cycle's rest is already done
      return {
        type: "done" as const,
      };
    }

    const cycleRestElapsed = cycleElapsed - cycleWork;

    return {
      type: "rest" as const,
      cycleTime,
      cycleIndex,
      timeElapsed: cycleRestElapsed,
      timeLeft: cycleRest - cycleRestElapsed,
    };
  }, [timerState]);

  // prevent re-renders and event repeats by using a stable reference
  const seq = useStableValue(seqRaw);

  useEffect(() => {
    if (!seq) {
      return;
    }

    if (seq.type === "preDelay") {
      if (seq.timeElapsed === 0) {
        console.log("preDelay start");
        startAudio.play();
      }
      if (seq.timeLeft <= 3) {
        console.log("work in", seq.timeLeft);
        countSamples[seq.timeLeft - 1].play();
      }
      return;
    }

    if (seq.type === "work") {
      if (seq.timeElapsed === 0) {
        console.log("work start", seq.cycleIndex);
        goAudio.play();
      }

      if (seq.timeLeft <= 3) {
        console.log("rest in", seq.timeLeft);
        countSamples[seq.timeLeft - 1].play();
      }
      return;
    }

    if (seq.type === "rest") {
      if (seq.timeElapsed === 0) {
        console.log("rest start", seq.cycleIndex);
        restAudio.play();
      }

      if (seq.timeLeft <= 3) {
        console.log("work in", seq.timeLeft);
        countSamples[seq.timeLeft - 1].play();
      }
      return;
    }

    if (seq.type === "done") {
      console.log("done");
      doneAudio.play();

      setTimerState(null); // @todo this more reliably
      return;
    }
  }, [seq]);

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
          {timerState === null || timerState.isPaused ? "Start" : "Pause"}
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
