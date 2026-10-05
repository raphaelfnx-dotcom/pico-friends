import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Player, PLAYER_COLORS } from './types/game';
import { GAME_LEVELS } from './game/levels';
import { GameCanvas } from './game/GameCanvas';
import { VirtualJoystick } from './components/VirtualJoystick';
import { ActionControls, SquadMode } from './components/ActionControls';
import { HUD } from './components/HUD';
import { RoomLobby } from './components/RoomLobby';
import { sfx } from './utils/audio';

export default function App() {
  const [inLobby, setInLobby] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Room state
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('local-p1');
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

  // Local / Offline Trip Mode (2 to 8 Players)
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [offlinePlayerCount, setOfflinePlayerCount] = useState<number>(2);
  const [activeLocalIndex, setActiveLocalIndex] = useState(0);
  const [squadMode, setSquadMode] = useState<SquadMode>('follow');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [stackTrigger, setStackTrigger] = useState(0);
  const [gatherTrigger, setGatherTrigger] = useState(0);

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Input states
  const [inputVector, setInputVector] = useState({ x: 0, y: 0 });
  const [isJumpRequested, setIsJumpRequested] = useState(false);

  // Keyboard keys tracked
  const keysDownRef = useRef<Record<string, boolean>>({});

  // Socket reference & Online server URL (for Android APK support)
  const socketRef = useRef<Socket | null>(null);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>(() => {
    const saved = localStorage.getItem('pico_server_url');
    if (saved) return saved;
    // If running inside Capacitor Android APK (https://localhost without port), default to cloud URL
    const isCapacitorApk =
      window.location.hostname === 'localhost' &&
      (window.location.port === '' || window.location.port === '80' || window.location.port === '443');
    return isCapacitorApk
      ? 'https://ais-pre-5pwcimgqhqck4mjpqc6mdb-455282328210.us-east5.run.app'
      : window.location.origin;
  });

  // Check URL query parameters for direct room join (e.g. ?room=ABCD)
  const [initialRoomCode, setInitialRoomCode] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setInitialRoomCode(code.toUpperCase());
    }
  }, []);

  // Initialize Socket connection (gracefully handles offline mode when traveling & remote server in APK)
  useEffect(() => {
    const targetUrl = serverUrl.trim() || window.location.origin;
    const socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      timeout: 6000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado ao servidor de jogos Pico Friends:', socket.id);
      setIsServerConnected(true);
      setErrorMessage(null);
    });

    socket.on('disconnect', () => {
      setIsServerConnected(false);
    });

    socket.on('connect_error', () => {
      setIsServerConnected(false);
    });

    socket.on('room_created', ({ code, room, myId, isHost: hostFlag }) => {
      setRoomCode(code);
      setMyPlayerId(myId);
      setIsHost(hostFlag);
      setIsLocalMode(false);
      setCurrentLevelIndex((room.currentLevel || 1) - 1);
      setPlayers(room.players || {});
      setInLobby(false);
      setIsLoading(false);
    });

    socket.on('room_joined', ({ code, room, myId, isHost: hostFlag }) => {
      setRoomCode(code);
      setMyPlayerId(myId);
      setIsHost(hostFlag);
      setIsLocalMode(false);
      setCurrentLevelIndex((room.currentLevel || 1) - 1);
      setPlayers(room.players || {});
      setInLobby(false);
      setIsLoading(false);
    });

    socket.on('room_updated', (room) => {
      setPlayers(room.players || {});
      if (typeof room.currentLevel === 'number') {
        setCurrentLevelIndex(room.currentLevel - 1);
      }
    });

    socket.on('player_moved', (data) => {
      setPlayers((prev) => {
        if (!prev[data.id]) return prev;
        return {
          ...prev,
          [data.id]: {
            ...prev[data.id],
            x: data.x,
            y: data.y,
            vx: data.vx,
            vy: data.vy,
            facing: data.facing,
            isGrounded: data.isGrounded,
            inGoal: data.inGoal,
            isPushingRight: data.isPushingRight,
            isPushingLeft: data.isPushingLeft,
          },
        };
      });
    });

    socket.on('level_changed', ({ level, room }) => {
      setCurrentLevelIndex(level - 1);
      if (room?.players) {
        setPlayers(room.players);
      }
    });

    socket.on('level_reset', ({ room }) => {
      if (room?.players) {
        setPlayers(room.players);
      }
    });

    socket.on('error_message', ({ message }) => {
      setErrorMessage(message);
      setIsLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  const handleChangeServerUrl = (newUrl: string) => {
    const cleaned = newUrl.trim().replace(/\/+$/, '');
    setServerUrl(cleaned);
    localStorage.setItem('pico_server_url', cleaned);
  };

  // Helper to build local players dictionary for 2P-8P
  const createLocalPlayers = useCallback((count: number, levelIdx: number) => {
    const clampedCount = Math.max(2, Math.min(8, count));
    const level = GAME_LEVELS[levelIdx] || GAME_LEVELS[0];
    const nextPlayers: Record<string, Player> = {};

    for (let i = 0; i < clampedCount; i++) {
      const pid = `local-p${i + 1}`;
      const spawn = level.spawnPoints[i % level.spawnPoints.length] || {
        x: 60 + i * 28,
        y: 390,
      };
      nextPlayers[pid] = {
        id: pid,
        name: `Gato P${i + 1} (${PLAYER_COLORS[i % PLAYER_COLORS.length].name})`,
        colorIndex: i % PLAYER_COLORS.length,
        x: spawn.x + Math.floor(i / level.spawnPoints.length) * 18,
        y: spawn.y,
        vx: 0,
        vy: 0,
        facing: 'right',
        isGrounded: true,
        inGoal: false,
        squash: 1,
        walkFrame: 0,
      };
    }
    return nextPlayers;
  }, []);

  // Keyboard controls handler (Desktop / Debugging support)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inLobby) return;
      keysDownRef.current[e.code] = true;

      if (isLocalMode) {
        if (e.code === 'Tab' || e.code === 'KeyQ') {
          e.preventDefault();
          setActiveLocalIndex((prev) => (prev + 1) % offlinePlayerCount);
          return;
        }
        if (e.code === 'KeyE') {
          e.preventDefault();
          setStackTrigger((prev) => prev + 1);
          return;
        }
        if (e.code === 'KeyF') {
          e.preventDefault();
          setGatherTrigger((prev) => prev + 1);
          return;
        }
        if (e.code === 'KeyM') {
          e.preventDefault();
          setSquadMode((prev) => (prev === 'follow' ? 'all' : prev === 'all' ? 'solo' : 'follow'));
          return;
        }
        // Digits 1 to 8 select active local player
        if (e.code.startsWith('Digit')) {
          const num = parseInt(e.code.replace('Digit', ''), 10);
          if (num >= 1 && num <= offlinePlayerCount) {
            setActiveLocalIndex(num - 1);
            return;
          }
        }
      }

      updateInputFromKeyboard();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (inLobby) return;
      keysDownRef.current[e.code] = false;
      updateInputFromKeyboard();
    };

    const updateInputFromKeyboard = () => {
      const keys = keysDownRef.current;
      let x = 0;
      let jump = false;

      if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) x += 1;
      if (keys['KeyW'] || keys['ArrowUp'] || keys['Space']) jump = true;

      setInputVector((prev) => ({ ...prev, x }));
      setIsJumpRequested(jump);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [inLobby, isLocalMode, offlinePlayerCount]);

  // Create Room action
  const handleCreateRoom = (playerName: string) => {
    if (!navigator.onLine) {
      setErrorMessage('Você está offline! Use a aba "Offline (2P-8P)" para jogar sem internet.');
      return;
    }
    if (!socketRef.current?.connected) {
      socketRef.current?.connect();
      setErrorMessage(
        'Não foi possível conectar ao servidor online. No APK, configure o IP do Wi-Fi (ex: http://192.168.1.15:3000) ou a URL do seu servidor no Render.com!'
      );
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    socketRef.current?.emit('create_room', { playerName });
  };

  // Join Room action
  const handleJoinRoom = (code: string, playerName: string) => {
    if (!navigator.onLine) {
      setErrorMessage('Você está offline! Use a aba "Offline (2P-8P)" para jogar sem internet.');
      return;
    }
    if (!socketRef.current?.connected) {
      socketRef.current?.connect();
      setErrorMessage(
        'Não foi possível conectar ao servidor online. Verifique se todos estão usando o mesmo Endereço do Servidor!'
      );
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    socketRef.current?.emit('join_room', { code, playerName });
  };

  // Start Offline / Local Mode (supports 2 to 8 players and optional starting level)
  const handleStartLocalMode = (playerCount = 2, startLevelIndex = 0) => {
    const count = Math.max(2, Math.min(8, playerCount));
    const lvlIdx = Math.max(0, Math.min(GAME_LEVELS.length - 1, startLevelIndex));

    // Request Fullscreen & Landscape lock on Android mobile devices
    try {
      if (window.innerWidth < 950 && !document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().then(() => {
          (screen.orientation as any)?.lock?.('landscape').catch(() => {});
        }).catch(() => {});
      } else {
        (screen.orientation as any)?.lock?.('landscape').catch(() => {});
      }
    } catch {}

    setIsLocalMode(true);
    setOfflinePlayerCount(count);
    setActiveLocalIndex(0);
    setSquadMode('follow');
    setRoomCode('OFFLINE');
    setIsHost(true);
    setMyPlayerId('local-p1');

    setPlayers(createLocalPlayers(count, lvlIdx));
    setCurrentLevelIndex(lvlIdx);
    setResetTrigger((prev) => prev + 1);
    setInLobby(false);
  };

  // Change Offline Player Count dynamically from the HUD (2P to 8P)
  const handleChangeOfflinePlayerCount = (newCount: number) => {
    const count = Math.max(2, Math.min(8, newCount));
    setOfflinePlayerCount(count);
    setActiveLocalIndex((prev) => (prev >= count ? 0 : prev));
    setPlayers(createLocalPlayers(count, currentLevelIndex));
    setResetTrigger((prev) => prev + 1);
  };

  // Reset Level action
  const handleResetLevel = () => {
    if (isLocalMode) {
      setPlayers(createLocalPlayers(offlinePlayerCount, currentLevelIndex));
      setResetTrigger((prev) => prev + 1);
    } else {
      socketRef.current?.emit('reset_level');
    }
  };

  // Change Level action
  const handleChangeLevel = (lvlIndex: number) => {
    if (lvlIndex < 0 || lvlIndex >= GAME_LEVELS.length) return;
    if (isLocalMode) {
      setCurrentLevelIndex(lvlIndex);
      setPlayers(createLocalPlayers(offlinePlayerCount, lvlIndex));
      setResetTrigger((prev) => prev + 1);
    } else {
      socketRef.current?.emit('change_level', { level: lvlIndex + 1 });
    }
  };

  // Level Cleared
  const handleLevelCleared = () => {
    if (!isLocalMode) {
      socketRef.current?.emit('level_cleared');
    }
  };

  // Auto Advance to Next Level
  const handleNextLevel = () => {
    const nextIdx = (currentLevelIndex + 1) % GAME_LEVELS.length;
    handleChangeLevel(nextIdx);
  };

  // Toggle Sound FX
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.enabled = next;
  };

  // Player movement update callback from GameCanvas
  const handlePlayerMove = useCallback(
    (state: Partial<Player>) => {
      if (isLocalMode) return;
      socketRef.current?.emit('player_update', state);
    },
    [isLocalMode]
  );

  // Sync interactive objects from host (box, key, doors)
  const handleSyncObject = useCallback(
    (data: { boxX?: number; boxY?: number; boxVx?: number; isDoorOpen?: boolean; keyPickedBy?: string | null }) => {
      if (isLocalMode) return;
      socketRef.current?.emit('sync_object', data);
    },
    [isLocalMode]
  );

  // If in Lobby, show RoomLobby
  if (inLobby) {
    return (
      <RoomLobby
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartLocalMode={handleStartLocalMode}
        isLoading={isLoading}
        errorMessage={errorMessage}
        initialCode={initialRoomCode}
        isServerConnected={isServerConnected}
        serverUrl={serverUrl}
        onChangeServerUrl={handleChangeServerUrl}
      />
    );
  }

  const currentLevel = GAME_LEVELS[currentLevelIndex] || GAME_LEVELS[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 select-none touch-none flex flex-col">
      {/* Top HUD with Room Code, Player list, 2P-8P Offline Selector, Level selector and Audio toggle */}
      <HUD
        roomCode={roomCode}
        isHost={isHost}
        currentLevelIndex={currentLevelIndex}
        totalLevels={GAME_LEVELS.length}
        levelName={currentLevel.name}
        coopTip={currentLevel.coopTip}
        players={players}
        myPlayerId={`local-p${activeLocalIndex + 1}`}
        onResetLevel={handleResetLevel}
        onChangeLevel={handleChangeLevel}
        onToggleSound={handleToggleSound}
        soundEnabled={soundEnabled}
        isLocalMode={isLocalMode}
        offlinePlayerCount={offlinePlayerCount}
        onChangeOfflinePlayerCount={handleChangeOfflinePlayerCount}
        onBackToLobby={() => setInLobby(true)}
      />

      {/* Main Game Canvas */}
      <div className="relative flex-1 w-full h-full">
        <GameCanvas
          levelIndex={currentLevelIndex}
          resetTrigger={resetTrigger}
          stackTrigger={stackTrigger}
          gatherTrigger={gatherTrigger}
          players={players}
          myPlayerId={myPlayerId}
          isHost={isHost}
          isLocalMode={isLocalMode}
          activeLocalIndex={activeLocalIndex}
          squadMode={squadMode}
          onPlayerMove={handlePlayerMove}
          onSyncObject={handleSyncObject}
          onLevelCleared={handleLevelCleared}
          onNextLevel={handleNextLevel}
          inputVector={inputVector}
          isJumpRequested={isJumpRequested}
        />
      </div>

      {/* Mobile Touch Controls Layer (Docked at Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none p-4 sm:p-6 pb-6 sm:pb-8 flex items-end justify-between">
        {/* Virtual Joystick (Left Hand) */}
        <div className="pointer-events-auto">
          <VirtualJoystick
            onMove={(vec) => {
              setInputVector(vec);
            }}
          />
        </div>

        {/* Action & Jump Controls + Offline Squad Controls (Right Hand) */}
        <div className="pointer-events-auto">
          <ActionControls
            onJumpStart={() => setIsJumpRequested(true)}
            onJumpEnd={() => setIsJumpRequested(false)}
            onSwitchPlayer={() => setActiveLocalIndex((prev) => (prev + 1) % offlinePlayerCount)}
            onToggleSquadMode={() =>
              setSquadMode((prev) => (prev === 'follow' ? 'all' : prev === 'all' ? 'solo' : 'follow'))
            }
            onQuickStack={() => setStackTrigger((prev) => prev + 1)}
            onGatherSquad={() => setGatherTrigger((prev) => prev + 1)}
            isLocalTwoPlayerMode={isLocalMode}
            activeLocalPlayerIndex={activeLocalIndex}
            totalLocalPlayers={offlinePlayerCount}
            squadMode={squadMode}
          />
        </div>
      </div>
    </div>
  );
}
