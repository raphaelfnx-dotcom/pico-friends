import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Users,
  Copy,
  Check,
  Maximize,
  Minimize,
  HelpCircle,
  Share2,
  BookOpen,
  Home,
} from 'lucide-react';
import { Player, PLAYER_COLORS } from '../types/game';
import { GAME_LEVELS } from '../game/levels';
import { WorldsDatabaseModal } from './WorldsDatabaseModal';

interface HUDProps {
  roomCode: string | null;
  isHost: boolean;
  currentLevelIndex: number;
  totalLevels: number;
  levelName: string;
  coopTip: string;
  players: Record<string, Player>;
  myPlayerId: string;
  onResetLevel: () => void;
  onChangeLevel: (lvl: number) => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
  onOpenHelp?: () => void;
  isLocalMode?: boolean;
  offlinePlayerCount?: number;
  onChangeOfflinePlayerCount?: (count: number) => void;
  onBackToLobby?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  roomCode,
  currentLevelIndex,
  levelName,
  coopTip,
  players,
  myPlayerId,
  onResetLevel,
  onChangeLevel,
  onToggleSound,
  soundEnabled,
  isLocalMode,
  offlinePlayerCount = 2,
  onChangeOfflinePlayerCount,
  onBackToLobby,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showWorldsModal, setShowWorldsModal] = useState(false);

  const playerList = Object.values(players);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (!roomCode) return;
    const url = `${window.location.origin}?room=${roomCode}`;
    if (navigator.share) {
      navigator
        .share({
          title: 'Pico Friends Multiplayer',
          text: `Entre na minha sala ${roomCode} para jogar cooperativo!`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-30 p-2 sm:p-3 pointer-events-none flex flex-col gap-2">
        <div className="flex items-center justify-between w-full gap-1.5">
          {/* Left Side: Lobby Back, Room Code / Offline Scale Selector */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {onBackToLobby && (
              <button
                type="button"
                onClick={onBackToLobby}
                className="p-2 rounded-2xl bg-zinc-900/85 hover:bg-zinc-800 border border-white/15 shadow-lg text-zinc-300 active:scale-95 transition-all"
                title="Voltar ao Menu Inicial"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            )}

            {roomCode && !isLocalMode ? (
              <div className="flex items-center gap-1 bg-zinc-900/85 backdrop-blur-md border border-white/15 px-2.5 py-1.5 rounded-2xl shadow-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Sala:</span>
                <span className="font-extrabold text-sm sm:text-base text-emerald-400 tracking-widest px-1">
                  {roomCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 rounded-lg hover:bg-white/10 active:scale-95 text-zinc-300 transition-colors"
                  title="Copiar Código"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="p-1 rounded-lg hover:bg-white/10 active:scale-95 text-zinc-300 transition-colors"
                  title="Compartilhar Link da Sala"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/40 px-2.5 py-1.5 rounded-2xl shadow-lg backdrop-blur-md">
                <span className="text-[11px] font-bold text-amber-300 hidden xs:inline">Offline:</span>
                {onChangeOfflinePlayerCount ? (
                  <select
                    value={offlinePlayerCount}
                    onChange={(e) => onChangeOfflinePlayerCount(Number(e.target.value))}
                    className="bg-transparent text-xs font-extrabold text-amber-200 focus:outline-none cursor-pointer"
                    title="Escolher quantidade de gatinhos para testar a escala da fase (2 a 8 jogadores)"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n} className="bg-zinc-900 text-white">
                        {n} Gatinhos ({n}P)
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-amber-300">{offlinePlayerCount}P Offline</span>
                )}
              </div>
            )}

            {/* Players Avatars List */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded-2xl shadow-lg">
              <Users className="w-3.5 h-3.5 text-zinc-400 mr-1" />
              <div className="flex -space-x-1.5">
                {playerList.map((p) => {
                  const color = PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length];
                  const isMe = p.id === myPlayerId;
                  return (
                    <div
                      key={p.id}
                      title={`${p.name} ${isMe ? '(Ativo)' : ''} ${p.inGoal ? '✓ No Cofre' : ''}`}
                      className={`relative w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm transition-transform ${
                        p.inGoal ? 'ring-2 ring-emerald-400 scale-110' : ''
                      } ${isMe ? 'border-2 border-white' : 'border border-black/40'}`}
                      style={{ backgroundColor: color.hex }}
                    >
                      <div className="flex gap-0.5 pointer-events-none">
                        <div className="w-1 h-1 rounded-full bg-white flex items-center justify-center">
                          <div className="w-0.5 h-0.5 rounded-full bg-zinc-900" />
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white flex items-center justify-center">
                          <div className="w-0.5 h-0.5 rounded-full bg-zinc-900" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center: World Selector & Database button */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-zinc-900/85 backdrop-blur-md border border-white/15 px-2.5 py-1.5 rounded-2xl shadow-lg">
            <select
              value={currentLevelIndex}
              onChange={(e) => onChangeLevel(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer max-w-[125px] sm:max-w-[200px] truncate"
            >
              {GAME_LEVELS.map((lvl, idx) => (
                <option key={idx} value={idx} className="bg-zinc-900 text-white">
                  Mundo {lvl.worldNumber || idx + 1}: {lvl.subtitle}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowWorldsModal(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold active:scale-95 transition-all"
              title="Enciclopédia dos 15 Mundos de Pico Park 2"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">15 Mundos</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTip(!showTip)}
              className="p-1 rounded-lg hover:bg-white/10 text-amber-400 active:scale-95 transition-transform"
              title="Dica da Fase"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Side Controls: Reset, Sound, Fullscreen */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={onResetLevel}
              className="flex items-center gap-1 bg-zinc-900/85 hover:bg-zinc-800 border border-white/15 px-2.5 py-1.5 rounded-2xl shadow-lg text-zinc-200 active:scale-95 transition-all"
              title="Reiniciar Posições da Fase"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline text-xs font-bold">Reiniciar</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              className="p-2 rounded-2xl bg-zinc-900/85 hover:bg-zinc-800 border border-white/15 shadow-lg text-zinc-200 active:scale-95 transition-all"
              title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Áudio'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-2xl bg-zinc-900/85 hover:bg-zinc-800 border border-white/15 shadow-lg text-zinc-200 active:scale-95 transition-all"
              title="Tela Cheia"
            >
              {isFullscreen ? (
                <Minimize className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <Maximize className="w-3.5 h-3.5 text-zinc-300" />
              )}
            </button>
          </div>
        </div>

        {/* Tip Banner if toggled */}
        {showTip && (
          <div className="pointer-events-auto self-center max-w-md w-full bg-gradient-to-r from-amber-950/90 to-zinc-900/90 border border-amber-500/40 rounded-2xl p-2.5 px-3.5 text-xs text-amber-200 shadow-xl backdrop-blur-md flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-300 mr-1">{levelName}:</span>
              <span>{coopTip}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowTip(false)}
              className="text-amber-400/80 hover:text-white font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 15 Worlds Encyclopedia Modal */}
      <WorldsDatabaseModal
        isOpen={showWorldsModal}
        onClose={() => setShowWorldsModal(false)}
        onSelectWorldLevel={(worldId) => onChangeLevel(worldId - 1)}
        currentLevelIndex={currentLevelIndex}
      />
    </>
  );
};
