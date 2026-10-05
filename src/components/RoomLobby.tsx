import React, { useState } from 'react';
import { Users, Plus, Key, HelpCircle, Gamepad2, ArrowRight, BookOpen, Plane, Download } from 'lucide-react';
import { PLAYER_COLORS } from '../types/game';
import { WorldsDatabaseModal } from './WorldsDatabaseModal';
import { PWAInstallButton } from './PWAInstallButton';

interface RoomLobbyProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  onStartLocalMode: (playerCount?: number, startLevelIndex?: number) => void;
  isLoading: boolean;
  errorMessage: string | null;
  initialCode?: string;
  isServerConnected?: boolean;
  serverUrl?: string;
  onChangeServerUrl?: (url: string) => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  onCreateRoom,
  onJoinRoom,
  onStartLocalMode,
  isLoading,
  errorMessage,
  initialCode = '',
  isServerConnected = false,
  serverUrl = '',
  onChangeServerUrl,
}) => {
  const [tab, setTab] = useState<'offline' | 'create' | 'join'>('offline');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('pico_name') || `Amigo ${Math.floor(Math.random() * 899 + 100)}`
  );
  const [roomCode, setRoomCode] = useState(initialCode.toUpperCase());
  const [offlineCount, setOfflineCount] = useState<number>(2);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showWorldsModal, setShowWorldsModal] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsDownloadingZip(true);
      const response = await fetch(`/api/download-zip?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Falha ao baixar ZIP');
      }
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        throw new Error('Resposta inválida do servidor');
      }
      const blob = new Blob([buffer], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pico-friends-github.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('Erro ao baixar ZIP:', err);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 14);
    setPlayerName(val);
    localStorage.setItem('pico_name', val);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onCreateRoom(playerName.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div
      className="relative h-full w-full overflow-y-auto bg-zinc-950 p-2.5 sm:p-5 flex items-center justify-center"
      style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Background playful grid pattern & soft gradient blobs */}
      <div className="fixed inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: 2-Column Side-by-Side in Landscape / Desktop, 1-Column in Portrait */}
      <div className="relative w-full max-w-4xl my-auto bg-zinc-900/95 border border-white/10 rounded-3xl p-3.5 sm:p-6 shadow-2xl backdrop-blur-xl grid grid-cols-1 landscape:grid-cols-12 md:grid-cols-12 gap-3.5 sm:gap-6 items-center">
        {/* LEFT COLUMN (5 cols in Landscape): Game Icon, Title, Stacked Cats & Quick Actions */}
        <div className="landscape:col-span-5 md:col-span-5 flex flex-col items-center justify-between text-center landscape:border-r md:border-r border-white/10 landscape:pr-4 md:pr-5">
          {/* Custom Stacked Cat Icon + Cute Characters */}
          <div className="flex items-center justify-center gap-3 mb-1.5">
            <img
              src="/pwa-192x192.png"
              alt="Pico Friends Icon"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-emerald-400/50 shadow-lg"
            />
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 leading-none">
                Pico Friends
              </h1>
              <p className="text-zinc-400 text-[11px] sm:text-xs font-medium mt-1">
                15 Mundos • 2 a 8 Gatinhos
              </p>
            </div>
          </div>

          {/* Cute 4-cat mini row */}
          <div className="flex items-end justify-center gap-1.5 my-2">
            {[0, 1, 2, 3].map((colorIdx, i) => {
              const c = PLAYER_COLORS[colorIdx];
              return (
                <div
                  key={colorIdx}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border-2 border-black/30 shadow-md transform transition-transform ${
                    i === 1 ? '-translate-y-1' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-900" />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-900" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Buttons (15 Worlds, How to Play, GitHub ZIP) */}
          <div className="w-full space-y-2 mt-1">
            <button
              type="button"
              onClick={() => setShowWorldsModal(true)}
              className="w-full py-2 px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Escolher Fase (15 Mundos)
            </button>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowHowToPlay(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                Como Jogar
              </button>

              <span className="text-zinc-700">·</span>

              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isDownloadingZip}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {isDownloadingZip ? 'Gerando...' : 'Baixar .ZIP'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols in Landscape): Mode Tabs + Player Count + Big START Button */}
        <div className="landscape:col-span-7 md:col-span-7 flex flex-col justify-center">
          {/* Error Notification */}
          {errorMessage && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-2xl mb-3 border border-white/5">
            <button
              type="button"
              onClick={() => setTab('offline')}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'offline'
                  ? 'bg-amber-400 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              Offline (2P-8P)
            </button>
            <button
              type="button"
              onClick={() => setTab('create')}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'create'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Criar Sala
            </button>
            <button
              type="button"
              onClick={() => setTab('join')}
              className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'join'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Entrar Online
            </button>
          </div>

          {/* TAB 1: MODO VIAGEM OFFLINE */}
          {tab === 'offline' && (
            <div className="space-y-2.5">
              {/* Player Count Selector (2P to 8P) */}
              <div className="bg-zinc-950/90 border border-white/10 rounded-2xl p-2.5 sm:p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Quantos gatinhos na fase?
                  </span>
                  <span className="text-xs font-extrabold text-amber-400">
                    {offlineCount} Jogadores
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setOfflineCount(num)}
                      className={`py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        offlineCount === num
                          ? 'bg-amber-400 text-zinc-950 shadow-md scale-105'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {num}P
                    </button>
                  ))}
                </div>
              </div>

              {/* Big Prominent START GAME Button */}
              <button
                type="button"
                onClick={() => onStartLocalMode(offlineCount, 0)}
                className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 hover:brightness-105 active:scale-[0.98] text-zinc-950 font-extrabold text-sm sm:text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Gamepad2 className="w-5 h-5" />
                <span>INICIAR JOGO ({offlineCount}P)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Compact PWA Install helper */}
              <div className="hidden sm:block">
                <PWAInstallButton />
              </div>
            </div>
          )}

          {/* Server Connection Status & URL Config (for Create / Join Online tabs) */}
          {(tab === 'create' || tab === 'join') && (
            <div className="mb-2.5 bg-zinc-950/80 border border-white/10 rounded-xl p-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isServerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-bold text-[11px] text-zinc-300">
                    {isServerConnected ? 'Servidor Online Conectado' : 'Servidor Desconectado'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowServerConfig((prev) => !prev)}
                  className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  {showServerConfig ? 'Ocultar URL' : 'Configurar Servidor'}
                </button>
              </div>

              {(showServerConfig || !isServerConnected) && onChangeServerUrl && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1">
                    URL do Servidor (Ex: https://seu-app.onrender.com ou http://192.168.1.15:3000 no Wi-Fi):
                  </label>
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => onChangeServerUrl(e.target.value)}
                    placeholder="https://pico-friends.onrender.com"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-white/15 rounded-lg text-amber-300 font-mono text-xs focus:outline-none focus:border-emerald-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CRIAR SALA ONLINE */}
          {tab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Seu Apelido
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={handleNameChange}
                  placeholder="Ex: Gatinho Verde"
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-zinc-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Criando Sala...' : 'Criar Sala Online'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: ENTRAR NA SALA ONLINE */}
          {tab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Seu Apelido
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={handleNameChange}
                    placeholder="Ex: Player 2"
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-white/10 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Código (4 Letras)
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={4}
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="ABCD"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-white/10 rounded-xl text-amber-300 font-mono font-extrabold text-base tracking-widest uppercase focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || roomCode.length < 4}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 active:scale-[0.98] text-zinc-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Entrando...' : 'Entrar na Sala'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 15 Worlds Encyclopedia Modal */}
      <WorldsDatabaseModal
        isOpen={showWorldsModal}
        onClose={() => setShowWorldsModal(false)}
        onSelectWorldLevel={(worldId) => {
          setShowWorldsModal(false);
          onStartLocalMode(offlineCount, worldId - 1);
        }}
      />

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3 max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-extrabold text-emerald-400 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" /> Controles de Teste (2 a 8 Jogadores)
            </h3>

            <div
              className="space-y-2.5 text-xs text-zinc-300 leading-relaxed overflow-y-auto pr-1 flex-1"
              style={{ touchAction: 'pan-y' }}
            >
              <div className="bg-zinc-800/60 p-2.5 rounded-2xl border border-white/5">
                <span className="font-bold text-amber-300">Botões na Direita da Tela:</span>
                <p className="text-zinc-400 text-xs mt-1">
                  • <strong>P1/2 (Trocar Gato):</strong> Alterna entre controlar o Jogador 1, Jogador 2, etc.
                  <br />• <strong>Seguir:</strong> Os outros gatinhos seguem você e ajudam a empurrar caixas pesadas automaticamente.
                  <br />• <strong>Solo:</strong> Você controla 1 gatinho por vez enquanto o outro fica parado onde deixou (ótimo para pisar em botões!).
                  <br />• <strong>Todos:</strong> Todos os gatinhos andam e pulam juntos.
                  <br />• <strong>Empilhar:</strong> Coloca um gatinho amigo em cima da sua cabeça com 1 toque!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Entendi, vamos jogar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
