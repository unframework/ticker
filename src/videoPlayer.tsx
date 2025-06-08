import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import YouTubePlayer from "youtube-player";

async function initPlayer(container: HTMLDivElement) {
  const player = YouTubePlayer(container);

  player.cueVideoById("dQw4w9WgXcQ");
  // player.playVideo();
}

export const VideoPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initPlayer(containerRef.current!);
    }, 50);

    // Debounce double-invocations of useEffect
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "w-96 h-56 flex items-center justify-center",
        "bg-gray-200 rounded-sm overflow-hidden"
      )}
    >
      VideoPlayer
    </div>
  );
};
