import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface VirtualJoystickProps {
  onMove: (vector: { x: number; y: number }) => void;
  disabled?: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, disabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Keep latest onMove callback in a ref so we NEVER reset input on re-render!
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const radius = 56; // max distance knob can travel from center

  const updateVector = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }

      setKnobPos({ x: dx, y: dy });

      // Apply small deadzone and strong horizontal responsiveness for platforming
      const normX = dx / radius;
      const normY = dy / radius;
      const deadzone = 0.08;

      let filteredX = 0;
      if (Math.abs(normX) >= deadzone) {
        // Boost horizontal input so even a partial thumb tilt gives crisp full speed
        filteredX = Math.sign(normX) * Math.min(1, Math.abs(normX) * 1.35);
      }
      const filteredY = Math.abs(normY) < deadzone ? 0 : normY;

      onMoveRef.current({ x: filteredX, y: filteredY });
    },
    [radius]
  );

  const resetStick = useCallback(() => {
    setIsActive(false);
    activePointerIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    onMoveRef.current({ x: 0, y: 0 });
  }, []);

  // Touch Events (primary for Android WebView reliability)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    setIsActive(true);
    activePointerIdRef.current = touch.identifier;
    updateVector(touch.clientX, touch.clientY);

    if (navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === null) return;
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i];
      if (t.identifier === activePointerIdRef.current) {
        updateVector(t.clientX, t.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activePointerIdRef.current) {
        resetStick();
        break;
      }
    }
  };

  // Pointer Events fallback (for Desktop mouse testing)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.pointerType === 'touch') return;
    setIsActive(true);
    activePointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    updateVector(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (!isActive || e.pointerId !== activePointerIdRef.current) return;
    updateVector(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (e.pointerId !== activePointerIdRef.current) return;
    resetStick();
  };

  // Cleanup only on actual component unmount
  useEffect(() => {
    return () => {
      onMoveRef.current({ x: 0, y: 0 });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative flex items-center justify-center select-none touch-none"
      style={{
        width: `${radius * 2 + 40}px`,
        height: `${radius * 2 + 40}px`,
        touchAction: 'none',
      }}
    >
      {/* Outer Glow Ring with Left/Right Arrows */}
      <div
        className={`absolute inset-2 rounded-full border-2 transition-colors duration-150 backdrop-blur-md flex items-center justify-center pointer-events-none ${
          isActive
            ? 'border-emerald-400/80 bg-emerald-950/40 shadow-[0_0_24px_rgba(52,211,153,0.3)]'
            : 'border-white/25 bg-zinc-900/70 shadow-inner'
        }`}
      >
        {/* Left / Right visual directional chevrons */}
        <ChevronLeft
          className={`absolute left-2 w-5 h-5 transition-colors ${
            knobPos.x < -10 ? 'text-emerald-400 scale-125' : 'text-white/40'
          }`}
          strokeWidth={3}
        />
        <ChevronRight
          className={`absolute right-2 w-5 h-5 transition-colors ${
            knobPos.x > 10 ? 'text-emerald-400 scale-125' : 'text-white/40'
          }`}
          strokeWidth={3}
        />
        <div className="absolute top-3 w-2 h-2 rounded-full bg-white/20" />
        <div className="absolute bottom-3 w-2 h-2 rounded-full bg-white/20" />

        {/* Center Guide Dot */}
        <div className="w-3 h-3 rounded-full bg-white/15" />
      </div>

      {/* Floating Dynamic Thumb Knob */}
      <div
        className={`absolute w-14 h-14 rounded-full shadow-lg flex items-center justify-center pointer-events-none will-change-transform ${
          isActive
            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 scale-105 shadow-[0_4px_16px_rgba(16,185,129,0.5)]'
            : 'bg-gradient-to-br from-zinc-600 to-zinc-800 border border-white/25'
        }`}
        style={{
          transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
          transition: isActive ? 'none' : 'transform 0.12s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
      >
        <div className="w-5 h-5 rounded-full bg-white/35 backdrop-blur-sm" />
      </div>
    </div>
  );
};
