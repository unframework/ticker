import React, { useState } from "react";
import clsx from "clsx";

const videos: [string, number, string][] = [
  ["zb5-CXOeYj4", 0, "9-9s"],
  ["9jTlMgM-kuY", 23, "Gonzi - Turn it up"],
  ["y0GcRu6qSa0", 22, "Parasomnia"],
  ["hUTGTflHTrE", 11, "Doruksen - Intoxicated"],
  ["QRU5jpPgdfo", 0, "Mahtal - All in This"],
  ["_GfcIprkuvw", 0, "Chemical Beats"],
  ["yst_-HXWIm0", 41, "Leftfield - Phat Planet"],
  ["d4rQSINk46k", 0, "Herbsmoke"],
  ["ZguPdN1L7vg", 15, "Block Rockin' Beats"],
  ["ltdhuNmfWuU", 65, "Ed Solo & Deekline - Bam Bam"],
  ["gdZK482P31s", 78, "Pendulum - Hold Your Colour (Noisia Remix)"],
];

export function useVideoList() {
  const [videoList] = useState(() => {
    const tmp = [...videos];
    return videos.map(() => {
      const itemIndex = Math.floor(Math.random() * tmp.length);
      const item = tmp[itemIndex];
      tmp.splice(itemIndex, 1);
      return item;
    });
  });

  return videoList;
}

export interface PlaylistControlsProps {
  videoList: [string, number, string][];
  index: number;
  onSelect: (index: number) => void;
}

export const PlaylistControls: React.FC<PlaylistControlsProps> = ({
  videoList,
  index,
  onSelect,
}) => {
  return (
    <div className="h-full rounded-sm overflow-y-scroll bg-gray-100">
      <div className="flex flex-col">
        {videoList.map(([videoId, , title], i) => (
          <button
            key={videoId}
            type="button"
            className={clsx(
              "flex items-center px-4 py-2 gap-4",
              index === i
                ? "bg-accent/50 hover:bg-accent cursor-pointer"
                : "bg-gray-200 hover:bg-gray-300 cursor-pointer",
            )}
            onClick={() => onSelect(i)}
          >
            <span className="flex-1 text-left text-sm font-bold">{title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
