import { useEffect, useState } from "react";

import "./App.css";
import { DateTime } from "luxon";

interface TimerState {
  start: DateTime;
  current: DateTime;
}

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

  return (
    <div>
      {timerState ? (
        <div>
          {timerState.start.toFormat("hh:mm:ss")}
          {timerState.current.toFormat("hh:mm:ss")}
        </div>
      ) : (
        <div>--</div>
      )}
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => {
          startTimer();
        }}
      >
        Start
      </button>
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
