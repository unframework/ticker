import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import YouTubePlayer from "youtube-player";

export interface VideoPlayerProps {
  videoId: string;
  playState: "active" | "paused" | "stopped";
  lowVolume?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  playState,
  lowVolume,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof YouTubePlayer> | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

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

    playerRef.current?.cueVideoById(videoId);
  }, [playerReady, videoId]);

  // Video playback
  useEffect(() => {
    if (!playerReady) {
      return;
    }

    if (playState === "active") {
      playerRef.current?.playVideo();
    } else if (playState === "paused") {
      playerRef.current?.pauseVideo();
    } else if (playState === "stopped") {
      playerRef.current?.stopVideo();
    }
  }, [playerReady, playState]);

  // Volume
  useEffect(() => {
    if (!playerReady) {
      return;
    }

    if (lowVolume) {
      playerRef.current?.setVolume(20);
    } else {
      playerRef.current?.setVolume(100);
    }
  }, [playerReady, lowVolume]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "w-96 h-56 flex items-center justify-center",
        "bg-gray-200 rounded-sm overflow-hidden",
      )}
    ></div>
  );
};
