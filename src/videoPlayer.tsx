import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import YouTubePlayer from "youtube-player";

export interface VideoPlayerProps {
  videoId: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof YouTubePlayer> | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      playerRef.current = YouTubePlayer(containerRef.current!);
      setPlayerReady(true);
    }, 50);

    // Debounce double-invocations of useEffect,
    // and also destroy the player on unmount
    return () => {
      clearTimeout(timeoutId);
      playerRef.current?.destroy();
    };
  }, []);

  // Video cueing
  useEffect(() => {
    if (!playerReady) {
      return;
    }

    playerRef.current?.cueVideoById(videoId);
  }, [playerReady, videoId]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        "w-96 h-56 flex items-center justify-center",
        "bg-gray-200 rounded-sm overflow-hidden",
      )}
    >
      VideoPlayer
    </div>
  );
};
