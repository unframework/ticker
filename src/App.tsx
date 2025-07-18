import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import "./App.css";

import { VideoPlayer } from "./videoPlayer";
import { PlaylistControls, useVideoList } from "./playlist";
import { useLocalState, useStableValue } from "./reactHelpers";

type TimerState =
  | {
      mode: "stopped";
      isDone?: boolean;
    }
  | {
      mode: "active";
      startMs: number;
    }
  | {
      mode: "paused";
      totalMs: number; // precise millis for restart
    };

const preDelay = 10; // in seconds
const cycleWork = 20; // in seconds
const cycleRest = 10; // in seconds
const cycleCount = 8;

const samples = {
  preRace: new Audio("/pre-race.wav"),
  start: new Audio("/start.wav"),
  finalLap: new Audio("/final-lap.wav"),
  chords: new Audio("/chords.wav"),
  finishLine: new Audio("/finish-line.wav"),
  countdownA: new Audio("/countdownA.wav"),
  go: new Audio("/go.wav"),
  rest: new Audio("/rest.wav"),
  count1: new Audio("/count1.wav"),
  count2: new Audio("/count2.wav"),
  count3: new Audio("/count3.wav"),
  done: new Audio("/done.wav"),
};
const countSamples = [samples.count1, samples.count2, samples.count3];
samples.countdownA.currentTime = 0; // try to triger load?

for (const key in samples) {
  samples[key as keyof typeof samples].preload = "auto";
}

const Timer: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerState>({
    mode: "stopped",
  });

  const [elapsedCounter, setElapsedCounter] = useState(0);

  const videoList = useVideoList();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const currentVideo = videoList[currentVideoIndex];

  const [volume, setVolume] = useLocalState("volume", "100"); // 0-100

  useEffect(() => {
    if (timerState.mode !== "active") {
      return;
    }

    // use precise timer to uptick elapsed counter only on aligned second boundaries
    const startMs = timerState.startMs; // local reference
    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startMs) / 1000);
      setElapsedCounter(elapsedSeconds);
    }, 100);

    return () => {
      console.log("stopping");
      clearInterval(interval);
    };
  }, [timerState]);

  function toggleTimer() {
    setTimerState((prev) => {
      if (prev.mode === "stopped") {
        return {
          mode: "active",
          startMs: Date.now(),
        };
      }

      if (prev.mode === "active") {
        return {
          mode: "paused",
          totalMs: Date.now() - prev.startMs,
        };
      }

      return {
        mode: "active",
        startMs: Date.now() - prev.totalMs, // account for precise previous elapsed time
      };
    });
  }

  const seqRaw = useMemo(() => {
    if (timerState.mode === "stopped") {
      return {
        type: timerState.isDone ? ("done" as const) : ("inactive" as const),
      };
    }

    const elapsedMs =
      timerState.mode === "paused"
        ? timerState.totalMs
        : Date.now() - timerState.startMs;
    const secondsDiff = Math.floor(elapsedMs / 1000);

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
  }, [timerState, elapsedCounter]);

  // prevent re-renders and event repeats by using a stable reference
  const seq = useStableValue(seqRaw);

  // play sound effects on step transitions
  useEffect(() => {
    if (!seq) {
      return;
    }

    if (seq.type === "preDelay") {
      if (seq.timeElapsed === 0) {
        console.log("preDelay start");
        samples.preRace.play();
      }
      if (seq.timeLeft <= 3) {
        console.log("work in", seq.timeLeft);

        // reset play position to start
        samples.countdownA.pause();
        samples.countdownA.currentTime = 0;
        samples.countdownA.play();
      }
      return;
    }

    if (seq.type === "work") {
      if (seq.timeElapsed === 0) {
        console.log("work start", seq.cycleIndex);
        if (seq.cycleIndex === 0) {
          // samples.countdownB.play();
          samples.start.play();
        } else {
          samples.go.play();
        }
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
        if (seq.cycleIndex === cycleCount - 2) {
          samples.finalLap.play();
        }

        samples.rest.play();
      }

      if (seq.timeLeft <= 3) {
        console.log("work in", seq.timeLeft);
        countSamples[seq.timeLeft - 1].play();
      }
      return;
    }

    if (seq.type === "done") {
      console.log("done");
      samples.finishLine.play();
      samples.done.play();

      setCurrentVideoIndex((prev) => (prev + 1) % videoList.length);

      // @todo this more reliably
      setTimerState({
        mode: "stopped",
        isDone: true,
      });
      return;
    }
  }, [seq]);

  // auto-stop the running timer when finished
  useEffect(() => {
    if (seq.type === "done") {
      setTimerState((prev) =>
        prev.mode === "stopped"
          ? prev
          : {
              mode: "stopped",
              isDone: true,
            },
      );
      return;
    }
  }, [seq]);

  function getBgClass() {
    if (seq.type === "work") {
      return "bg-yellow-100";
    }

    if (seq.type === "rest") {
      return "bg-blue-100";
    }

    if (seq.type === "done") {
      return "bg-green-300";
    }

    return null;
  }

  return (
    // fullscreen
    <div
      className={clsx(
        "flex flex-col h-screen w-screen fixed items-center justify-center pb-32",
        timerState.mode === "paused" ? "bg-gray-300" : getBgClass(),
      )}
    >
      <div
        className={clsx(
          "text-[10vh] md:text-[25vh] leading-none",
          timerState.mode === "paused" && "opacity-50",
          seq.type === "work" && "text-orange-700",
        )}
      >
        {seq.type === "inactive" && <div>--</div>}

        {seq.type === "preDelay" && <div>{-seq.timeLeft}</div>}

        {seq.type === "work" && (
          <div>00:{("0" + seq.timeElapsed).slice(-2)}</div>
        )}

        {seq.type === "rest" && <div>{-seq.timeLeft}</div>}

        {seq.type === "done" && <div>Done!</div>}
      </div>

      <div
        className={clsx(
          "text-[6vh] md:text-[8vh] leading-none empty:before:content-['--']",
          timerState.mode === "paused" && "opacity-50",
          seq.type === "work" || seq.type === "rest"
            ? "text-gray-800"
            : "text-gray-500",
        )}
      >
        {seq.type === "preDelay" && <div>Get ready</div>}

        {(seq.type === "work" || seq.type === "rest") && (
          // show next cycle number when counting down rest
          <div>
            {seq.cycleIndex + (seq.type === "rest" ? 2 : 1)}/{cycleCount}
          </div>
        )}

        {seq.type === "done" && <div>🎉🥳🎉</div>}
      </div>

      <div className="flex gap-2 mt-12">
        <button
          className="btn btn-primary btn-xl w-64" // fixed width due to dynamic label
          type="button"
          onClick={() => {
            toggleTimer();
          }}
        >
          {timerState.mode === "stopped"
            ? "Start"
            : timerState.mode === "paused"
              ? "Unpause"
              : "Pause"}
        </button>
        <button
          className="btn btn-error btn-xl"
          type="button"
          onClick={() => {
            setTimerState({
              mode: "stopped",
            });
          }}
        >
          Reset
        </button>
      </div>

      <div className="flex-none mt-12 flex items-center gap-4">
        <div className="text-sm">Music</div>
        <input
          type="range"
          className="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
        />
        <div className="text-sm font-mono w-12">{volume}%</div>
      </div>

      <div className="flex-none mt-4 flex flex-col md:flex-row items-stretch gap-4">
        <VideoPlayer
          videoId={currentVideo[0]}
          videoStart={currentVideo[1]} // in seconds
          playState={
            timerState.mode === "active"
              ? seq.type === "work" || seq.type === "rest"
                ? "active"
                : "stopped"
              : timerState.mode
          }
          volume={Number(volume)}
          lowVolume={seq.type !== "work"}
        />

        <div className="md:w-64 h-36 md:h-auto">
          <PlaylistControls
            videoList={videoList}
            index={currentVideoIndex}
            onSelect={setCurrentVideoIndex}
          />
        </div>
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
