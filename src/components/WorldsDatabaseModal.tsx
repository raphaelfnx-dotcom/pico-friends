import React, { useState } from 'react';
import { PICO_PARK_2_WORLDS, WorldReference } from '../data/picoPark2Worlds';
import {
  BookOpen,
  Users,
  AlertTriangle,
  Zap,
  Clock,
  Sparkles,
  ChevronRight,
  Shield,
  Gamepad2,
  X,
  Star,
  Layers,
} from 'lucide-react';

interface WorldsDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorldLevel?: (worldId: number) => void;
  currentLevelIndex?: number;
}

export const WorldsDatabaseModal: React.FC<WorldsDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectWorldLevel,
  currentLevelIndex = 0,
}) => {
  const [selectedWorldId, setSelectedWorldId] = useState<number>(1);
  const [viewingScale, setViewingScale] = useState<'2p' | '8p'>('2p');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredWorlds = PICO_PARK_2_WORLDS.filter((w) => {
    if (difficultyFilter === 'all') return true;
    if (difficultyFilter === 'easy') return w.difficulty.includes('Fácil');
    if (difficultyFilter === 'medium') return w.difficulty.includes('Média');
    if (difficultyFilter === 'hard') return w.difficulty.includes('Difícil') || w.difficulty === 'Extrema';
    return true;
  });

  const selectedWorld = PICO_PARK_2_WORLDS.find((w) => w.id === selectedWorldId) || PICO_PARK_2_WORLDS[0];

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Muito Fácil':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30';
      case 'Fácil':
      case 'Fácil a Média':
        return 'text-teal-400 bg-teal-950/60 border-teal-500/30';
      case 'Média':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/30';
      case 'Média-Alta':
        return 'text-orange-400 bg-orange-950/60 border-orange-500/30';
      case 'Difícil':
        return 'text-rose-400 bg-rose-950/60 border-rose-500/30';
      case 'Muito Difícil':
      case 'Extrema':
        return 'text-red-400 bg-red-950/70 border-red-500/40';
      default:
        return 'text-purple-400 bg-purple-950/60 border-purple-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[760px] bg-zinc-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                15 Mundos de Pico Park 2
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Referência Oficial
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Diretrizes de design, mecânicas inovadoras e balanceamento para 2 a 8 jogadores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters and Sub-nav */}
        <div className="flex flex-wrap items-center justify-between px-5 py-2.5 border-b border-white/10 bg-zinc-900/90 gap-2">
          {/* Difficulty filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {[
              { id: 'all', label: 'Todos os 15 Mundos' },
              { id: 'easy', label: 'Fáceis (1-3)' },
              { id: 'medium', label: 'Médios (4-9)' },
              { id: 'hard', label: 'Difíceis (10-15)' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDifficultyFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  difficultyFilter === f.id
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Scale perspective toggle */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-800/90 border border-white/10">
            <button
              type="button"
              onClick={() => setViewingScale('2p')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewingScale === '2p'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Escala 2P (Dupla)
            </button>
            <button
              type="button"
              onClick={() => setViewingScale('8p')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                viewingScale === '8p'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Escala 8P (Caos Total)
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar list + Detail view */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left World Cards List */}
          <div className="w-full md:w-72 border-r border-white/10 bg-zinc-950/40 overflow-y-auto divide-y divide-white/5 shrink-0">
            {filteredWorlds.map((world) => {
              const isSelected = world.id === selectedWorldId;
              return (
                <button
                  key={world.id}
                  type="button"
                  onClick={() => setSelectedWorldId(world.id)}
                  className={`w-full text-left p-3 sm:p-3.5 transition-all flex items-start gap-2.5 hover:bg-white/5 ${
                    isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-400' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                      isSelected
                        ? 'bg-emerald-400 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {world.worldNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                        {world.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                      {world.tagline}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getDifficultyColor(
                          world.difficulty
                        )}`}
                      >
                        {world.difficulty}
                      </span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: world.difficultyStars }).map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right World Deep Detail Card */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-zinc-900/60 space-y-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    MUNDO {selectedWorld.worldNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getDifficultyColor(
                      selectedWorld.difficulty
                    )}`}
                  >
                    Dificuldade: {selectedWorld.difficulty}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {selectedWorld.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {selectedWorld.tagline}
                </p>
              </div>

              {onSelectWorldLevel && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectWorldLevel(selectedWorld.worldNumber);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all self-start sm:self-auto"
                >
                  <Gamepad2 className="w-4 h-4" />
                  Jogar Nível Correspondente
                </button>
              )}
            </div>

            {/* Gimmick Central */}
            <div className="bg-zinc-800/70 border border-white/10 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-400">
                <Zap className="w-4 h-4" />
                Gimmick Central & Conceito
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
                {selectedWorld.gimmickCentral}
              </p>
            </div>

            {/* Scaling Comparison: 2 Players vs 8 Players */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 2 Players */}
              <div
                className={`rounded-2xl p-4 border transition-all ${
                  viewingScale === '2p'
                    ? 'bg-amber-950/40 border-amber-500/50 ring-2 ring-amber-500/20'
                    : 'bg-zinc-800/40 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-wider mb-2">
                  <Users className="w-4 h-4" />
                  Escala para 2 Jogadores (Dupla)
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  {selectedWorld.scale2Players}
                </p>
              </div>

              {/* 8 Players */}
              <div
                className={`rounded-2xl p-4 border transition-all ${
                  viewingScale === '8p'
                    ? 'bg-rose-950/40 border-rose-500/50 ring-2 ring-rose-500/20'
                    : 'bg-zinc-800/40 border-white/5 opacity-80'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-rose-400 uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Escala para 8 Jogadores (Caos)
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  {selectedWorld.scale8Players}
                </p>
              </div>
            </div>

            {/* Design Notes & Level Designer Guidance */}
            <div className="bg-zinc-800/50 border border-white/10 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                <Layers className="w-4 h-4" />
                Notas de Level Design & Balanceamento
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {selectedWorld.designNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-zinc-950/70 flex items-center justify-between text-xs text-zinc-400">
          <span className="font-medium">
            15 Mundos inspirados no design cooperativo original de Pico Park 2
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
