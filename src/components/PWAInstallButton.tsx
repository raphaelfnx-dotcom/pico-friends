import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, Check, Copy, Share2, Plane } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isOnline, install } = usePWAInstall();
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Pico Friends - Modo Viagem Offline',
          text: 'Abra no celular e instale para jogar as 15 fases offline na viagem!',
          url: appUrl,
        })
        .catch(() => {});
    } else {
      handleCopyUrl();
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {/* Offline status indicator when disconnected */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-300">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Você está Offline (Modo Avião) — Jogo 100% pronto no cache!</span>
          </div>
        )}

        {/* Direct Android/Chrome Install or Mobile Guide Trigger */}
        {!isInstalled && (
          <div className="flex gap-2">
            {isInstallable ? (
              <button
                type="button"
                onClick={install}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-sky-500 hover:bg-sky-400 px-4 py-3 text-xs sm:text-sm font-extrabold text-zinc-950 shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4" />
                Instalar App Offline no Celular
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowMobileGuide(true)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-sky-500/30 px-4 py-2.5 text-xs font-bold text-sky-300 active:scale-[0.98] transition-all"
              >
                <Plane className="w-4 h-4 text-sky-400" />
                {isIOS
                  ? 'Como Instalar Offline no iPhone'
                  : 'Baixar / Instalar no Celular p/ Viagem'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step-by-Step Mobile & Offline Trip Guide Modal */}
      {showMobileGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-sky-400 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Jogar Offline no Celular (Modo Viagem)
              </h3>
              <button
                type="button"
                onClick={() => setShowMobileGuide(false)}
                className="text-zinc-400 hover:text-white font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              <div className="bg-zinc-800/80 p-3.5 rounded-2xl border border-white/5 space-y-2">
                <p className="font-bold text-white">
                  1. Abra este link no navegador do seu celular antes de ficar sem sinal:
                </p>
                <div className="flex items-center gap-2 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2">
                  <span className="text-xs text-sky-300 font-mono truncate flex-1">{appUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUrl ? 'Copiado!' : 'Copiar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
                    title="Compartilhar Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-zinc-800/80 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
                <p className="font-bold text-emerald-400">2. Salve na Tela Inicial (Funciona em Modo Avião!):</p>
                <p className="text-xs text-zinc-300">
                  • <strong>No Android (Chrome):</strong> Toque no botão{' '}
                  <strong>"Instalar App Offline"</strong> ou no menu <strong>⋮ → Instalar aplicativo</strong>.
                </p>
                <p className="text-xs text-zinc-300">
                  • <strong>No iPhone (Safari):</strong> Toque no ícone de{' '}
                  <strong>Compartilhar (quadrado com seta ↑)</strong> na barra inferior e escolha{' '}
                  <strong>"Adicionar à Tela de Início"</strong>.
                </p>
              </div>

              <div className="bg-zinc-800/80 p-3.5 rounded-2xl border border-amber-500/20 space-y-1">
                <p className="font-bold text-amber-300">3. Como testar sozinho de 2 a 8 jogadores na viagem:</p>
                <p className="text-xs text-zinc-400">
                  Use o <strong>Modo Viagem Offline (2 a 8 Gatinhos)</strong>! Você pode alternar entre controlar{' '}
                  <strong>1 gatinho por vez</strong>, ativar o modo <strong>"Seguir (Bots)"</strong> para os outros te
                  ajudarem a empurrar caixas, ou usar o botão <strong>"🗼 Empilhar"</strong> para montar torres com 1 toque!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileGuide(false)}
              className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-extrabold text-sm transition-all"
            >
              Pronto para a Viagem!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
