"use client";

import { useEffect, useRef, useState } from "react";

export type InlinePlayerProps = {
  videoIds: string[];
  currentIndex: number;
  onIndexChange: (nextIndex: number) => void;
};

export function InlinePlayer({ videoIds, currentIndex, onIndexChange }: InlinePlayerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any | null>(null);

  const currentVideoId = videoIds[currentIndex] ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile((event as MediaQueryList).matches ?? (event as MediaQueryListEvent).matches);
    };
    handleChange(mq as any);
    mq.addEventListener("change", handleChange as any);
    return () => mq.removeEventListener("change", handleChange as any);
  }, []);

  useEffect(() => {
    if (!currentVideoId) {
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }

    const loadPlayer = () => {
      const YT = (window as any).YT;
      if (!YT || !YT.Player || !playerContainerRef.current) return;

      if (!playerRef.current) {
        playerRef.current = new YT.Player(playerContainerRef.current, {
          videoId: currentVideoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
          },
          events: {
            onStateChange: (event: any) => {
              const ENDED = (window as any).YT?.PlayerState?.ENDED;
              if (ENDED != null && event.data === ENDED) {
                onIndexChange(currentIndex < videoIds.length - 1 ? currentIndex + 1 : currentIndex);
              }
            },
          },
        });
      } else {
        try {
          playerRef.current.loadVideoById(currentVideoId);
        } catch {
          // no-op
        }
      }
    };

    if (!(window as any).YT || !(window as any).YT.Player) {
      const existingScript = document.getElementById("youtube-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.id = "youtube-iframe-api";
        document.body.appendChild(tag);
      }
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prev === "function") prev();
        loadPlayer();
      };
    } else {
      loadPlayer();
    }

    return () => {
      // Keep player alive while the component is mounted.
    };
  }, [currentVideoId, currentIndex, videoIds.length, onIndexChange]);

  useEffect(() => {
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        playerRef.current.destroy();
      }
    };
  }, []);

  if (!currentVideoId) return null;

  return (
    <div
      className="player-sticky-wrap"
      style={{
        position: isMobile ? "sticky" : "relative",
        top: isMobile ? 0 : undefined,
        paddingTop: isMobile ? "0.35rem" : 0,
        background: isMobile
          ? "linear-gradient(180deg, rgba(7,16,23,0.98) 0%, rgba(7,16,23,0.92) 60%, rgba(7,16,23,0) 100%)"
          : "transparent",
      }}
    >
      <div className="player-shell">
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%",
            height: 0,
          }}
        >
          <div
            ref={playerContainerRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
