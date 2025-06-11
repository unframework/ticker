import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import YouTubePlayer from "youtube-player";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";

export interface VideoPlayerProps {
  videoId: string;
  videoStart: number;
  playState: "active" | "paused" | "stopped";
  lowVolume?: boolean;
}

// TODO: volume bar for overall adjustments
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoStart,
  playState,
  lowVolume,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof YouTubePlayer> | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Prevent re-triggering effect
  const videoStartRef = useRef(videoStart);
  videoStartRef.current = videoStart;

  useEffect(() => {
    // Create sacrificial div that gets replaced by this player instance
    // (this prevents React errors when unmounting)
    const div = document.createElement("div");
    containerRef.current!.appendChild(div);

    const timeoutId = setTimeout(() => {
      playerRef.current = YouTubePlayer(div, {
        width: containerRef.current!.clientWidth,
        height: containerRef.current!.clientHeight,
      });
      setPlayerReady(true);
    }, 50);

    // Debounce double-invocations of useEffect,
    // and also destroy the player on unmount
    return () => {
      clearTimeout(timeoutId);
      playerRef.current?.destroy(); // Puts the sacrificial div back in place
      div.parentElement?.removeChild(div); // Always clean up the sacrificial div
    };
  }, []);

  // Video cueing
  useEffect(() => {
    if (!playerReady) {
      return;
    }

    // Mute and ensure video is loaded for playback
    console.log("cueing video", videoId, videoStart);
    setVideoReady(false);

    // Kick off the process in the next tick (in case eg this render cycle
    // results in pauseVideo calls, etc)
    const player = playerRef.current!;
    setTimeout(() => {
      console.log("loading video", videoId, videoStart);
      player.setVolume(0);
      player.loadVideoById(videoId, videoStart);

      // Wait for the video to be ready to play
      const listener = player.on("stateChange", ({ data }) => {
        console.log("waiting stateChange", data);
        if (data === PlayerStates.PLAYING) {
          console.log("video ready, pausing");
          player.pauseVideo();
          (player as any).off(listener);
          setVideoReady(true);
        }
      });
    }, 0);
  }, [playerReady, videoId, videoStart]);

  // Video playback
  useEffect(() => {
    if (!playerReady || !videoReady) {
      return;
    }

    console.log("applying video status", playState);

    if (playState === "active") {
      playerRef.current?.playVideo();
    } else if (playState === "paused") {
      playerRef.current?.pauseVideo();
    } else if (playState === "stopped") {
      // Use videoStartRef to avoid triggering this on track change
      playerRef.current?.pauseVideo();
      playerRef.current?.seekTo(videoStartRef.current, true);
    }
  }, [playerReady, videoReady, playState]);

  // Volume
  useEffect(() => {
    if (!playerReady || !videoReady) {
      return;
    }

    if (lowVolume) {
      playerRef.current?.setVolume(20);
    } else {
      playerRef.current?.setVolume(100);
    }
  }, [playerReady, videoReady, lowVolume]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "w-80 h-56 flex items-center justify-center",
        "bg-gray-200 rounded-sm overflow-hidden",
      )}
    ></div>
  );
};
