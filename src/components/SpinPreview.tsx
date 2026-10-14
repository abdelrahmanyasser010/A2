"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Rotate3D } from "lucide-react";
import { useStore } from "./StoreProvider";

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
  const isDraggingRef = useRef(false);
  const draggedDistRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { t } = useStore();

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

  const updateFromDrag = (clientX: number) => {
    const delta = clientX - startX.current;
    draggedDistRef.current = Math.abs(delta);
    const steps = Math.trunc(delta / 22);
    const total = safeFrames.length;
    const next = (((startFrame.current + steps) % total) + total) % total;
    setFrame(next);
  };

  const handleHoverMove = (clientX: number) => {
    if (isDraggingRef.current || safeFrames.length <= 1) return;
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(0.999, (clientX - rect.left) / rect.width));
    const targetFrame = Math.floor(ratio * safeFrames.length);
    setFrame(targetFrame);
  };

  return (
    <div
      ref={containerRef}
      className={`spinPreview ${className} ${dragging ? "isDragging" : ""}`}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 && event.pointerType === "mouse") return;
        setDragging(true);
        isDraggingRef.current = true;
        draggedDistRef.current = 0;
        startX.current = event.clientX;
        startFrame.current = frame;
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }}
      onPointerMove={(event) => {
        if (isDraggingRef.current) {
          updateFromDrag(event.clientX);
        } else if (event.pointerType === "mouse") {
          handleHoverMove(event.clientX);
        }
      }}
      onPointerUp={(event) => {
        isDraggingRef.current = false;
        setDragging(false);
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // ignore
        }
      }}
      onPointerCancel={() => {
        isDraggingRef.current = false;
        setDragging(false);
      }}
      onClickCapture={(e) => {
        if (draggedDistRef.current > 8) {
          e.preventDefault();
          e.stopPropagation();
          draggedDistRef.current = 0;
        }
      }}
    >
      <Image
        src={safeFrames[frame]}
        alt={alt}
        fill
        sizes="(max-width: 760px) 50vw, 33vw"
        priority={priority}
        draggable={false}
      />
      {safeFrames.length > 1 && (
        <div className="spinHint">
          <Rotate3D size={14} />
          <span>{t("dragToRotate")}</span>
        </div>
      )}
      <div className="spinProgress" aria-hidden="true">
        {safeFrames.map((_, index) => (
          <i key={index} className={index === frame ? "active" : ""} />
        ))}
      </div>
    </div>
  );
}
