"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Rotate3D } from "lucide-react";

type Props = {
  frames: string[];
  alt: string;
  priority?: boolean;
  className?: string;
  auto?: boolean;
};

export function SpinPreview({ frames, alt, priority = false, className = "", auto = false }: Props) {
  const safeFrames = frames.length ? frames : ["/media/A2_full_outfit.webp"];
  const [frame, setFrame] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startFrame = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "80px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible || dragging || safeFrames.length <= 1) return;
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % safeFrames.length), 1500);
    return () => window.clearInterval(timer);
  }, [auto, visible, dragging, safeFrames.length]);

  const updateFromX = (x: number) => {
    const delta = x - startX.current;
    const steps = Math.round(delta / 45);
    const next = (startFrame.current + steps) % safeFrames.length;
    setFrame((next + safeFrames.length) % safeFrames.length);
  };

  return (
    <div
      ref={containerRef}
      className={`spinPreview ${className}`}
      onPointerDown={(event) => {
        setDragging(true);
        startX.current = event.clientX;
        startFrame.current = frame;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => dragging && updateFromX(event.clientX)}
      onPointerUp={(event) => {
        setDragging(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => setDragging(false)}
    >
      <Image src={safeFrames[frame]} alt={alt} fill sizes="(max-width: 760px) 50vw, 33vw" priority={priority} draggable={false} />
      {safeFrames.length > 1 && (
        <div className="spinHint"><Rotate3D size={14} /><span>Drag to rotate</span></div>
      )}
      <div className="spinProgress" aria-hidden="true">
        {safeFrames.map((_, index) => <i key={index} className={index === frame ? "active" : ""} />)}
      </div>
    </div>
  );
}
