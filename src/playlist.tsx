import React, { useState } from "react";
import clsx from "clsx";

const videos: [string, number, string][] = [
  ["zb5-CXOeYj4", 0, "9-9s"],
  ["9jTlMgM-kuY", 13, "Gonzi - Turn it up"],
  ["y0GcRu6qSa0", 12, "Parasomnia"],
  ["hUTGTflHTrE", 1, "Doruksen - Intoxicated"],
  ["QRU5jpPgdfo", 0, "Mahtal - All in This"],
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
    <div className="h-full rounded-sm overflow-auto bg-gray-100">
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
            <div className="flex-1">
              <div className="text-sm font-bold">{title}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
