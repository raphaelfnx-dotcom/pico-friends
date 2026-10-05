import React, { useState } from 'react';
import { ArrowUp, UserCheck, Users, Layers, Magnet } from 'lucide-react';

export type SquadMode = 'solo' | 'follow' | 'all';

interface ActionControlsProps {
  onJumpStart: () => void;
  onJumpEnd: () => void;
  onSwitchPlayer?: () => void;
  onToggleSquadMode?: () => void;
  onQuickStack?: () => void;
  onGatherSquad?: () => void;
  isLocalTwoPlayerMode?: boolean;
  activeLocalPlayerIndex?: number;
  totalLocalPlayers?: number;
  squadMode?: SquadMode;
  disabled?: boolean;
}

export const ActionControls: React.FC<ActionControlsProps> = ({
  onJumpStart,
  onJumpEnd,
  onSwitchPlayer,
  onToggleSquadMode,
  onQuickStack,
  onGatherSquad,
  isLocalTwoPlayerMode,
  activeLocalPlayerIndex = 0,
  totalLocalPlayers = 2,
  squadMode = 'follow',
  disabled,
}) => {
  const [isJumpPressed, setIsJumpPressed] = useState(false);

  const handleJumpTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsJumpPressed(true);
    onJumpStart();
    if (navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  const handleJumpTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsJumpPressed(false);
    onJumpEnd();
  };

  const handleJumpDown = (e: React.PointerEvent) => {
    if (disabled || e.pointerType === 'touch') return;
    setIsJumpPressed(true);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    onJumpStart();
  };

  const handleJumpUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    setIsJumpPressed(false);
    onJumpEnd();
  };

  const squadModeLabel =
    squadMode === 'follow' ? 'Seguir' : squadMode === 'all' ? 'Todos' : 'Solo';

  const squadModeColor =
    squadMode === 'follow'
      ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/80'
      : squadMode === 'all'
      ? 'border-sky-500/40 text-sky-300 bg-sky-950/80'
      : 'border-amber-500/40 text-amber-300 bg-zinc-900/85';

  return (
    <div className="flex items-end gap-2.5 sm:gap-3.5 select-none touch-none">
      {/* Offline / Local Mode Squad Helper Controls */}
      {isLocalTwoPlayerMode && (
        <div className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-1.5">
            {onQuickStack && (
              <button
                type="button"
                onClick={onQuickStack}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-purple-950/85 border border-purple-400/40 active:scale-95 text-purple-200 text-[11px] font-bold shadow-md backdrop-blur-md transition-transform"
                title="Empilhar um gatinho amigo na sua cabeça instantaneamente"
              >
                <Layers className="w-3.5 h-3.5 text-purple-300" />
                <span>Empilhar</span>
              </button>
            )}

            {onGatherSquad && (
              <button
                type="button"
                onClick={onGatherSquad}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-900/85 border border-white/15 active:scale-95 text-zinc-200 text-[11px] font-bold shadow-md backdrop-blur-md transition-transform"
                title="Chamar todos os gatinhos para perto de você"
              >
                <Magnet className="w-3.5 h-3.5 text-amber-400" />
                <span>Chamar</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onToggleSquadMode && (
              <button
                type="button"
                onClick={onToggleSquadMode}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border active:scale-95 shadow-md backdrop-blur-md transition-transform ${squadModeColor}`}
                title="Alternar modo de controle: Seguir (Bots ajudam), Todos Juntos ou Solo (1 por vez)"
              >
                <Users className="w-4 h-4 mb-0.5" />
                <span className="text-[10px] font-extrabold leading-tight">{squadModeLabel}</span>
              </button>
            )}

            {onSwitchPlayer && (
              <button
                type="button"
                onClick={onSwitchPlayer}
                className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900/85 border border-amber-400/40 active:scale-95 text-white shadow-md backdrop-blur-md transition-transform"
                title="Alternar qual gatinho você controla"
              >
                <UserCheck className="w-4 h-4 text-amber-400 mb-0.5" />
                <span className="text-[10px] font-extrabold text-amber-300 leading-tight">
                  P{activeLocalPlayerIndex + 1}/{totalLocalPlayers}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Large Main Jump Button */}
      <div
        onTouchStart={handleJumpTouchStart}
        onTouchEnd={handleJumpTouchEnd}
        onTouchCancel={handleJumpTouchEnd}
        onPointerDown={handleJumpDown}
        onPointerUp={handleJumpUp}
        onPointerCancel={handleJumpUp}
        className={`relative flex flex-col items-center justify-center rounded-3xl cursor-pointer select-none touch-none transition-all duration-75 will-change-transform ${
          isJumpPressed
            ? 'scale-90 bg-gradient-to-t from-emerald-600 to-emerald-500 shadow-[0_2px_10px_rgba(16,185,129,0.7)] translate-y-1'
            : 'bg-gradient-to-t from-emerald-500 to-emerald-400 shadow-[0_8px_20px_rgba(16,185,129,0.4)] hover:brightness-105 active:scale-90'
        }`}
        style={{
          width: '84px',
          height: '84px',
        }}
      >
        <div className="absolute inset-0 rounded-3xl border-2 border-white/30 pointer-events-none" />
        <ArrowUp
          className={`w-9 h-9 text-white transition-transform ${
            isJumpPressed ? 'scale-90 -translate-y-0.5' : 'scale-100'
          }`}
          strokeWidth={3.5}
        />
        <span className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-950 mt-0.5">
          Pular
        </span>
      </div>
    </div>
  );
};
