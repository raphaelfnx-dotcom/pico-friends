import React, { useRef, useEffect, useCallback, useState } from 'react';
import confetti from 'canvas-confetti';
import { Player, Box, ButtonObject, DoorObject, KeyObject, MovingPlatform, PLAYER_COLORS, LevelData } from '../types/game';
import { GAME_LEVELS } from './levels';
import { sfx } from '../utils/audio';
import { SquadMode } from '../components/ActionControls';

const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 34;
const GRAVITY = 0.52;
const MOVE_SPEED = 4.2;
const JUMP_FORCE = -10.8;

interface GameCanvasProps {
  levelIndex: number;
  resetTrigger?: number;
  stackTrigger?: number;
  gatherTrigger?: number;
  players: Record<string, Player>;
  myPlayerId: string;
  isHost: boolean;
  isLocalMode?: boolean;
  activeLocalIndex?: number;
  squadMode?: SquadMode;
  onPlayerMove?: (state: Partial<Player>) => void;
  onSyncObject?: (data: { boxX?: number; boxY?: number; boxVx?: number; isDoorOpen?: boolean; keyPickedBy?: string | null }) => void;
  onLevelCleared?: () => void;
  onNextLevel?: () => void;
  inputVector: { x: number; y: number };
  isJumpRequested: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  levelIndex,
  resetTrigger = 0,
  stackTrigger = 0,
  gatherTrigger = 0,
  players,
  myPlayerId,
  isHost,
  isLocalMode,
  activeLocalIndex = 0,
  squadMode = 'follow',
  onPlayerMove,
  onSyncObject,
  onLevelCleared,
  onNextLevel,
  inputVector,
  isJumpRequested,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Local game state refs for high-fps loop
  const currentLevelRef = useRef<LevelData>(GAME_LEVELS[levelIndex] || GAME_LEVELS[0]);
  const playersRef = useRef<Record<string, Player>>({ ...players });
  const boxesRef = useRef<Box[]>([]);
  const buttonsRef = useRef<ButtonObject[]>([]);
  const doorsRef = useRef<DoorObject[]>([]);
  const keysRef = useRef<KeyObject[]>([]);
  const movingPlatformsRef = useRef<MovingPlatform[]>([]);

  // Camera tracking
  const cameraRef = useRef({ x: 0, y: 0, scale: 1, targetX: 0, targetY: 0, targetScale: 1 });

  // Victory state
  const isLevelClearedRef = useRef(false);
  const [showClearBanner, setShowClearBanner] = useState(false);

  // Jump edge trigger flag
  const jumpTriggeredRef = useRef(false);
  const pushSoundThrottleRef = useRef(0);

  // Live input refs so the 60fps loop never restarts on joystick move
  const inputVectorRef = useRef(inputVector);
  const isJumpRequestedRef = useRef(isJumpRequested);
  const activeLocalIndexRef = useRef(activeLocalIndex);
  const squadModeRef = useRef(squadMode);

  useEffect(() => {
    inputVectorRef.current = inputVector;
  }, [inputVector]);

  useEffect(() => {
    isJumpRequestedRef.current = isJumpRequested;
    if (isJumpRequested) {
      jumpTriggeredRef.current = true;
    }
  }, [isJumpRequested]);

  useEffect(() => {
    activeLocalIndexRef.current = activeLocalIndex;
  }, [activeLocalIndex]);

  useEffect(() => {
    squadModeRef.current = squadMode;
  }, [squadMode]);

  // Gimmick state refs (Pico Park 2 Worlds)
  const timeLimitRemainingRef = useRef<number | null>(null);
  const stopAndGoLightRef = useRef<'green' | 'red'>('green');
  const stopAndGoTimerRef = useRef<number>(0);
  const distanceOverLimitRef = useRef<boolean>(false);

  // Sync props to refs
  useEffect(() => {
    currentLevelRef.current = GAME_LEVELS[levelIndex] || GAME_LEVELS[0];
    isLevelClearedRef.current = false;
    setShowClearBanner(false);

    // Initialize level objects
    boxesRef.current = currentLevelRef.current.boxes.map((b) => ({ ...b, activePushers: 0 }));
    buttonsRef.current = currentLevelRef.current.buttons.map((b) => ({ ...b }));
    doorsRef.current = currentLevelRef.current.doors.map((d) => ({ ...d }));
    keysRef.current = currentLevelRef.current.keys.map((k) => ({ ...k }));
    movingPlatformsRef.current = currentLevelRef.current.movingPlatforms.map((p) => ({
      ...p,
      prevX: p.x,
      prevY: p.y,
      hasRider: false,
      riderWaitTimer: 0,
    }));

    // Reset gimmicks
    if (currentLevelRef.current.timeLimit) {
      timeLimitRemainingRef.current = currentLevelRef.current.timeLimit;
    } else {
      timeLimitRemainingRef.current = null;
    }
    stopAndGoLightRef.current = 'green';
    stopAndGoTimerRef.current = 0;
    distanceOverLimitRef.current = false;
  }, [levelIndex, resetTrigger]);

  useEffect(() => {
    playersRef.current = { ...players };
  }, [players]);

  // Quick Stack helper for Offline Mobile Mode (stacks an available friend onto the leader/top of stack)
  useEffect(() => {
    if (!isLocalMode || stackTrigger === 0) return;
    const allPlayers = Object.values(playersRef.current).sort((a, b) => a.colorIndex - b.colorIndex);
    const leader = allPlayers[activeLocalIndex] || allPlayers[0];
    if (!leader) return;

    // Find highest cat currently stacked on leader
    let topCat = leader;
    const visited = new Set<string>([leader.id]);
    let foundRider = true;
    while (foundRider) {
      foundRider = false;
      for (const p of allPlayers) {
        if (!visited.has(p.id)) {
          const horizontallyAligned = Math.abs(p.x - topCat.x) < PLAYER_WIDTH * 0.85;
          const onHead = Math.abs(p.y + PLAYER_HEIGHT - topCat.y) < 12;
          if (p.isRidingPlayerId === topCat.id || (horizontallyAligned && onHead)) {
            topCat = p;
            visited.add(p.id);
            foundRider = true;
            break;
          }
        }
      }
    }

    // Find nearest unstacked companion to place on top of topCat
    const candidate = allPlayers.find((p) => !visited.has(p.id));
    if (candidate) {
      candidate.x = topCat.x;
      candidate.y = topCat.y - PLAYER_HEIGHT;
      candidate.vx = 0;
      candidate.vy = 0;
      candidate.isGrounded = true;
      candidate.isRidingPlayerId = topCat.id;
      candidate.squash = 1.25;
      sfx.playJump();
    }
  }, [stackTrigger, isLocalMode, activeLocalIndex]);

  // Gather Squad helper for Offline Mobile Mode (brings all companions next to active cat)
  useEffect(() => {
    if (!isLocalMode || gatherTrigger === 0) return;
    const allPlayers = Object.values(playersRef.current).sort((a, b) => a.colorIndex - b.colorIndex);
    const leader = allPlayers[activeLocalIndex] || allPlayers[0];
    if (!leader) return;

    let offsetIdx = 1;
    for (const p of allPlayers) {
      if (p.id === leader.id) continue;
      const dir = leader.facing === 'right' ? -1 : 1;
      p.x = Math.max(24, Math.min(currentLevelRef.current.width - 56, leader.x + dir * (offsetIdx * 24)));
      p.y = leader.y;
      p.vx = 0;
      p.vy = 0;
      p.isRidingPlayerId = null;
      p.squash = 1.2;
      offsetIdx++;
    }
    sfx.playButtonClick(true);
  }, [gatherTrigger, isLocalMode, activeLocalIndex]);

  // Main 60fps Game Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const gameLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05); // cap delta
      lastTime = time;

      const level = currentLevelRef.current;
      const allPlayers = Object.values(playersRef.current);
      const curInput = inputVectorRef.current;
      const curJumpHeld = isJumpRequestedRef.current;
      const curActiveIdx = activeLocalIndexRef.current;
      const curSquadMode = squadModeRef.current;

      // Determine which player we are controlling
      let controlledPlayerId = myPlayerId;
      if (isLocalMode && allPlayers.length > 0) {
        const sorted = [...allPlayers].sort((a, b) => a.colorIndex - b.colorIndex);
        if (sorted[curActiveIdx]) {
          controlledPlayerId = sorted[curActiveIdx].id;
        }
      }

      const me = playersRef.current[controlledPlayerId];

      // Determine which players to simulate physics for on this device:
      // In Online mode, we simulate our own player (`me`).
      // In Offline/Local mode (`isLocalMode`), we simulate ALL local players (`2P` to `8P`)!
      const simulatedPlayers = isLocalMode
        ? [...allPlayers].sort((a, b) => a.colorIndex - b.colorIndex)
        : me
        ? [me]
        : [];

      const consumeJumpThisFrame = jumpTriggeredRef.current;
      if (consumeJumpThisFrame) {
        jumpTriggeredRef.current = false;
      }

      // --- 1. LOCAL PLAYER(S) INPUT & PHYSICS ---
      for (let pIdx = 0; pIdx < simulatedPlayers.length; pIdx++) {
        const simP = simulatedPlayers[pIdx];
        const isLeader = simP.id === controlledPlayerId;

        simP.isPushingRight = false;
        simP.isPushingLeft = false;

        let localInputX = 0;
        let wantsJump = false;

        if (isLeader) {
          localInputX = curInput.x;
          wantsJump = consumeJumpThisFrame;
        } else if (isLocalMode) {
          if (curSquadMode === 'all') {
            localInputX = curInput.x;
            wantsJump = consumeJumpThisFrame;
          } else if (curSquadMode === 'follow' && me) {
            // If stacked on someone's head, stay balanced on the stack unless jumping all together
            const isStackedOnFriend = allPlayers.some(
              (other) =>
                other.id !== simP.id &&
                Math.abs(simP.x - other.x) < PLAYER_WIDTH * 0.75 &&
                Math.abs(simP.y + PLAYER_HEIGHT - other.y) <= 10
            );

            if (!isStackedOnFriend) {
              // If leader is pushing a box, help push in the same direction!
              if (me.isPushingRight && Math.abs(simP.y - me.y) < 60) {
                localInputX = 1;
              } else if (me.isPushingLeft && Math.abs(simP.y - me.y) < 60) {
                localInputX = -1;
              } else if (me.inGoal) {
                // Move into the exit door with the leader!
                const goalCenterX = level.goal.x + level.goal.width / 2 - PLAYER_WIDTH / 2;
                const distToGoal = goalCenterX - simP.x;
                if (Math.abs(distToGoal) > 8) {
                  localInputX = Math.sign(distToGoal) * 0.9;
                }
              } else {
                // Follow behind the leader in a neat caravan
                const followSlot = ((pIdx % 4) + 1) * 28;
                const behindDir = me.facing === 'right' ? -1 : 1;
                const desiredX = me.x + behindDir * followSlot;
                const diffX = desiredX - simP.x;
                if (Math.abs(diffX) > 14) {
                  localInputX = Math.max(-1, Math.min(1, diffX / 26));
                }
              }

              // Jump if leader is significantly higher or if blocked by a step/wall while moving
              if (simP.isGrounded) {
                if (me.y + 28 < simP.y && Math.abs(me.x - simP.x) < 130) {
                  wantsJump = true;
                } else if (consumeJumpThisFrame && Math.abs(me.x - simP.x) < 90) {
                  wantsJump = true;
                }
              }
            }
          }
        }

        // Horizontal Movement
        const targetVx = localInputX * MOVE_SPEED;
        simP.vx = targetVx;

        if (localInputX > 0.1) {
          simP.facing = 'right';
          simP.walkFrame = (simP.walkFrame + dt * 10) % 4;
        } else if (localInputX < -0.1) {
          simP.facing = 'left';
          simP.walkFrame = (simP.walkFrame + dt * 10) % 4;
        } else {
          simP.walkFrame = 0;
        }

        // Jump physics
        if (wantsJump && simP.isGrounded) {
          simP.vy = JUMP_FORCE;
          simP.isGrounded = false;
          simP.isRidingPlayerId = null;
          simP.squash = 1.35; // stretch on jump
          if (isLeader) sfx.playJump();
        } else if (isLeader && !curJumpHeld && simP.vy < -3) {
          // Variable jump height: cut velocity if jump button released early
          simP.vy *= 0.65;
        }

        // Apply Gravity
        simP.vy += GRAVITY;

        // Apply squash & stretch recovery
        simP.squash += (1 - simP.squash) * 0.15;

        // Proposed new position
        let newX = simP.x + simP.vx;
        let newY = simP.y + simP.vy;

        // Check platform collisions (Horizontal first)
        let grounded = false;
        simP.isRidingPlayerId = null;

        // Platforms & Walls Collision
        for (const plat of level.platforms) {
          if (
            newX < plat.x + plat.width &&
            newX + PLAYER_WIDTH > plat.x &&
            simP.y < plat.y + plat.height &&
            simP.y + PLAYER_HEIGHT > plat.y
          ) {
            if (simP.vx > 0) {
              newX = plat.x - PLAYER_WIDTH;
              // Auto-hop over low steps for followers in 'follow' mode
              if (!isLeader && curSquadMode === 'follow' && simP.isGrounded) {
                simP.vy = JUMP_FORCE;
                simP.isGrounded = false;
              }
            } else if (simP.vx < 0) {
              newX = plat.x + plat.width;
              if (!isLeader && curSquadMode === 'follow' && simP.isGrounded) {
                simP.vy = JUMP_FORCE;
                simP.isGrounded = false;
              }
            }
          }
        }

        // Vertical collision with platforms
        for (const plat of level.platforms) {
          if (
            newX < plat.x + plat.width &&
            newX + PLAYER_WIDTH > plat.x &&
            newY < plat.y + plat.height &&
            newY + PLAYER_HEIGHT > plat.y
          ) {
            if (simP.vy > 0) {
              newY = plat.y - PLAYER_HEIGHT;
              simP.vy = 0;
              grounded = true;
            } else if (simP.vy < 0) {
              newY = plat.y + plat.height;
              simP.vy = 0;
            }
          }
        }

        // --- BOX COLLISION WITH PLAYER (Puxar / Empurrar / Subir na Caixa) ---
        for (const box of boxesRef.current) {
          const verticallyAligned =
            simP.y + PLAYER_HEIGHT > box.y + 4 && simP.y < box.y + box.height - 4;

          if (verticallyAligned) {
            // Player pushing right against left face of box
            if (newX + PLAYER_WIDTH > box.x && simP.x + PLAYER_WIDTH <= box.x + 8) {
              newX = box.x - PLAYER_WIDTH;
              if (localInputX > 0.1 || simP.facing === 'right') {
                simP.isPushingRight = true;
              }
            }
            // Player pushing left against right face of box
            else if (newX < box.x + box.width && simP.x >= box.x + box.width - 8) {
              newX = box.x + box.width;
              if (localInputX < -0.1 || simP.facing === 'left') {
                simP.isPushingLeft = true;
              }
            }
          }

          // Player standing on top of box
          if (
            newX + PLAYER_WIDTH > box.x + 2 &&
            newX < box.x + box.width - 2 &&
            newY + PLAYER_HEIGHT >= box.y &&
            simP.y + PLAYER_HEIGHT <= box.y + 14 &&
            simP.vy >= 0
          ) {
            newY = box.y - PLAYER_HEIGHT;
            simP.vy = 0;
            grounded = true;
          }
        }

        // Moving platforms collision (initial landing check)
        for (const mp of movingPlatformsRef.current) {
          if (
            newX + PLAYER_WIDTH > mp.x &&
            newX < mp.x + mp.width &&
            newY + PLAYER_HEIGHT >= mp.y &&
            simP.y + PLAYER_HEIGHT <= mp.y + 14 &&
            simP.vy >= 0
          ) {
            newY = mp.y - PLAYER_HEIGHT;
            simP.vy = 0;
            grounded = true;
          }
        }

        // Doors collision (solid when closed)
        for (const door of doorsRef.current) {
          if (!door.isOpen) {
            if (
              newX < door.x + door.width &&
              newX + PLAYER_WIDTH > door.x &&
              newY < door.y + door.height &&
              newY + PLAYER_HEIGHT > door.y
            ) {
              if (simP.vx > 0) newX = door.x - PLAYER_WIDTH;
              else if (simP.vx < 0) newX = door.x + door.width;
            }
          }
        }

        // --- STACKING PHYSICS (Empilhar em cima de outro jogador!) ---
        for (const other of allPlayers) {
          if (other.id === simP.id) continue;

          // Generous alignment on head for fun, stable stacking
          const isHorizontallyAligned =
            newX + PLAYER_WIDTH > other.x + 2 && newX < other.x + PLAYER_WIDTH - 2;
          const isLandingOnHead =
            simP.y + PLAYER_HEIGHT <= other.y + 14 && newY + PLAYER_HEIGHT >= other.y && simP.vy >= 0;

          if (isHorizontallyAligned && isLandingOnHead) {
            newY = other.y - PLAYER_HEIGHT;
            simP.vy = 0;
            grounded = true;
            simP.isRidingPlayerId = other.id;
            // Inherit horizontal motion of the friend you are riding!
            newX += other.vx;
          }
        }

        // Check if just landed
        if (!simP.isGrounded && grounded) {
          simP.squash = 0.75;
          if (isLeader) sfx.playLand();
        }

        simP.isGrounded = grounded;
        simP.x = newX;
        simP.y = newY;

        // Check goal collision
        const inGoalArea =
          simP.x + PLAYER_WIDTH / 2 >= level.goal.x &&
          simP.x + PLAYER_WIDTH / 2 <= level.goal.x + level.goal.width &&
          simP.y + PLAYER_HEIGHT >= level.goal.y &&
          simP.y <= level.goal.y + level.goal.height;

        simP.inGoal = inGoalArea;

        // Pit Hazard Check / Respawn
        let hitHazard = simP.y > level.height + 40;
        for (const haz of level.hazards) {
          if (
            simP.x < haz.x + haz.width &&
            simP.x + PLAYER_WIDTH > haz.x &&
            simP.y + PLAYER_HEIGHT > haz.y &&
            simP.y < haz.y + haz.height
          ) {
            hitHazard = true;
            break;
          }
        }

        if (hitHazard) {
          sfx.playFall();
          const spawn = level.spawnPoints[simP.colorIndex % level.spawnPoints.length] || { x: 80, y: 390 };
          simP.x = spawn.x;
          simP.y = spawn.y;
          simP.vx = 0;
          simP.vy = 0;
          simP.isGrounded = true;
        }

        // Send local player update to peers (only in online mode)
        if (!isLocalMode && isLeader) {
          onPlayerMove?.({
            x: simP.x,
            y: simP.y,
            vx: simP.vx,
            vy: simP.vy,
            facing: simP.facing,
            isGrounded: simP.isGrounded,
            inGoal: simP.inGoal,
            isPushingRight: simP.isPushingRight,
            isPushingLeft: simP.isPushingLeft,
          });
        }
      }

      // --- WORLD GIMMICKS LOGIC (Pico Park 2) ---
      // 1. Time Limit Countdown (World 5)
      if (timeLimitRemainingRef.current !== null && !isLevelClearedRef.current) {
        timeLimitRemainingRef.current -= dt;
        if (timeLimitRemainingRef.current <= 0) {
          timeLimitRemainingRef.current = level.timeLimit || 25;
          sfx.playFall();
          let sIdx = 0;
          for (const p of allPlayers) {
            const sp = level.spawnPoints[sIdx % level.spawnPoints.length] || { x: 80, y: 390 };
            p.x = sp.x;
            p.y = sp.y;
            p.vx = 0;
            p.vy = 0;
            sIdx++;
          }
        }
      }

      // 2. Stop and Go Semáforo (World 7)
      if (level.hasStopAndGo && !isLevelClearedRef.current) {
        stopAndGoTimerRef.current += dt;
        const cycle = level.stopAndGoCycle || { green: 3.5, red: 2.5 };
        if (stopAndGoLightRef.current === 'green' && stopAndGoTimerRef.current >= cycle.green) {
          stopAndGoLightRef.current = 'red';
          stopAndGoTimerRef.current = 0;
          sfx.playButtonClick(false);
        } else if (stopAndGoLightRef.current === 'red' && stopAndGoTimerRef.current >= cycle.red) {
          stopAndGoLightRef.current = 'green';
          stopAndGoTimerRef.current = 0;
          sfx.playButtonClick(true);
        }

        // If light is RED and moving:
        if (stopAndGoLightRef.current === 'red' && me && (Math.abs(me.vx) > 0.4 || !me.isGrounded)) {
          sfx.playFall();
          const sp = level.spawnPoints[me.colorIndex % level.spawnPoints.length] || { x: 80, y: 390 };
          me.x = sp.x;
          me.y = sp.y;
          me.vx = 0;
          me.vy = 0;
        }
      }

      // 3. Distance Sensor Tether (World 2)
      if (level.hasDistanceSensor && allPlayers.length >= 2) {
        let maxDist = 0;
        for (let i = 0; i < allPlayers.length; i++) {
          for (let j = i + 1; j < allPlayers.length; j++) {
            const d = Math.hypot(allPlayers[i].x - allPlayers[j].x, allPlayers[i].y - allPlayers[j].y);
            if (d > maxDist) maxDist = d;
          }
        }
        const allowed = level.maxDistanceAllowed || 260;
        distanceOverLimitRef.current = maxDist > allowed;
        if (distanceOverLimitRef.current && me) {
          const avgX = allPlayers.reduce((acc, p) => acc + p.x, 0) / allPlayers.length;
          me.x += (avgX - me.x) * 0.02;
        }
      }

      // --- 2. MOVING PLATFORMS UPDATE & RIDER CARRYING ---
      for (const mp of movingPlatformsRef.current) {
        mp.prevX = mp.x;
        mp.prevY = mp.y;

        // Check which players are currently standing on this platform
        const riders = allPlayers.filter(
          (p) =>
            p.x + PLAYER_WIDTH > mp.x + 2 &&
            p.x < mp.x + mp.width - 2 &&
            Math.abs(p.y + PLAYER_HEIGHT - mp.y) <= 8
        );
        mp.hasRider = riders.length > 0;

        let shouldMove = false;
        const behavior = mp.behavior || 'automatic';

        if (behavior === 'automatic') {
          shouldMove = true;
        } else if (behavior === 'stepToActivate') {
          // Platform moves UP when stepped on!
          if (mp.hasRider) {
            mp.direction = 1;
            shouldMove = mp.currentT < 1;
            mp.riderWaitTimer = 0;
          } else {
            // When no rider is on, wait a moment then return down
            if (mp.currentT > 0) {
              mp.riderWaitTimer = (mp.riderWaitTimer || 0) + dt;
              if (mp.riderWaitTimer > 0.8) {
                mp.direction = -1;
                shouldMove = true;
              }
            }
          }
        } else if (behavior === 'buttonRequired') {
          if (mp.activeOnlyWhenButtonPressed === 'btn-sync-both') {
            const allPressed = buttonsRef.current.every((b) => b.pressed);
            shouldMove = allPressed;
          } else {
            const btn = buttonsRef.current.find((b) => b.id === mp.activeOnlyWhenButtonPressed);
            shouldMove = btn ? btn.pressed : false;
          }
        }

        if (shouldMove) {
          mp.currentT += mp.speed * dt * mp.direction;
          if (mp.currentT >= 1) {
            mp.currentT = 1;
            if (behavior === 'automatic') mp.direction = -1;
          } else if (mp.currentT <= 0) {
            mp.currentT = 0;
            if (behavior === 'automatic') mp.direction = 1;
          }

          mp.x = mp.startX + (mp.endX - mp.startX) * mp.currentT;
          mp.y = mp.startY + (mp.endY - mp.startY) * mp.currentT;
        }

        // CARRY ALL RIDERS SEAMLESSLY (no falling off, zero jitter!)
        const deltaX = mp.x - mp.prevX;
        const deltaY = mp.y - mp.prevY;
        if (deltaX !== 0 || deltaY !== 0) {
          for (const rider of riders) {
            rider.x += deltaX;
            rider.y += deltaY;
            rider.isGrounded = true;
            rider.vy = 0;
          }
        }
      }

      // --- 3. HEAVY BOX PHYSICS & COOPERATIVE PUSHING ---
      pushSoundThrottleRef.current -= dt;

      for (const box of boxesRef.current) {
        // Apply box gravity
        box.vy += GRAVITY;
        let bNewY = box.y + box.vy;

        // Ground collision for box
        for (const plat of level.platforms) {
          if (
            box.x < plat.x + plat.width &&
            box.x + box.width > plat.x &&
            bNewY < plat.y + plat.height &&
            bNewY + box.height > plat.y
          ) {
            if (box.vy > 0) {
              bNewY = plat.y - box.height;
              box.vy = 0;
            }
          }
        }
        box.y = bNewY;

        // Count pushers from left and right across all active players
        let pushersRight = 0; // -> pushing right
        let pushersLeft = 0; // <- pushing left

        const pushingPlayersR: Player[] = [];
        const pushingPlayersL: Player[] = [];

        for (const p of allPlayers) {
          const verticallyAligned =
            p.y + PLAYER_HEIGHT > box.y + 4 && p.y < box.y + box.height - 4;

          if (verticallyAligned) {
            // Player touching left edge of box
            const atLeftFace = p.x + PLAYER_WIDTH >= box.x - 8 && p.x + PLAYER_WIDTH <= box.x + 8;
            if (atLeftFace && (p.isPushingRight || p.facing === 'right' || p.vx > 0.05)) {
              pushersRight++;
              pushingPlayersR.push(p);
            }

            // Player touching right edge of box
            const atRightFace = p.x >= box.x + box.width - 8 && p.x <= box.x + box.width + 8;
            if (atRightFace && (p.isPushingLeft || p.facing === 'left' || p.vx < -0.05)) {
              pushersLeft++;
              pushingPlayersL.push(p);
            }
          }
        }

        // In Local Practice mode:
        // If testing alone, when the player pushes the box, helper push power is granted!
        if (isLocalMode) {
          if (pushersRight >= 1) pushersRight = Math.max(pushersRight, 2);
          if (pushersLeft >= 1) pushersLeft = Math.max(pushersLeft, 2);
        }

        // Dynamic Player Scaling according to Pico Park 2 specs:
        // 2 players: 2 pushers.
        // 4 players: 3 pushers.
        // 8 players: 5 to 6 pushers!
        let requiredPlayers = box.mass || 2;
        if (!isLocalMode && allPlayers.length > 2) {
          requiredPlayers = Math.max(2, Math.min(allPlayers.length, Math.ceil(allPlayers.length * 0.65)));
        }
        let boxMoveX = 0;

        if (pushersRight >= requiredPlayers) {
          boxMoveX = 2.0;
          box.activePushers = pushersRight;
        } else if (pushersLeft >= requiredPlayers) {
          boxMoveX = -2.0;
          box.activePushers = pushersLeft;
        } else {
          box.activePushers = Math.max(pushersRight, pushersLeft);
          if (box.activePushers > 0) {
            // Strain rumble effect: box shakes slightly to show it needs another friend!
            box.x += (Math.random() - 0.5) * 1.0;
            if (pushSoundThrottleRef.current <= 0) {
              sfx.playBoxPush();
              pushSoundThrottleRef.current = 0.35;
            }
          }
        }

        // Apply box movement
        if (boxMoveX !== 0) {
          box.x += boxMoveX;

          // Sound effect
          if (pushSoundThrottleRef.current <= 0) {
            sfx.playBoxPush();
            pushSoundThrottleRef.current = 0.22;
          }

          // Move the pushing players with the box so they remain flush
          if (boxMoveX > 0) {
            for (const p of pushingPlayersR) {
              p.x = box.x - PLAYER_WIDTH;
            }
          } else {
            for (const p of pushingPlayersL) {
              p.x = box.x + box.width;
            }
          }

          // Wall collision for box
          for (const plat of level.platforms) {
            if (
              box.x < plat.x + plat.width &&
              box.x + box.width > plat.x &&
              box.y < plat.y + plat.height &&
              box.y + box.height > plat.y
            ) {
              if (boxMoveX > 0) box.x = plat.x - box.width;
              else if (boxMoveX < 0) box.x = plat.x + plat.width;
            }
          }

          // Broadcast box position if host
          if (isHost) {
            onSyncObject?.({ boxX: box.x, boxY: box.y });
          }
        }
      }

      // --- 4. BUTTONS & PRESSURE MECHANISM ---
      for (const btn of buttonsRef.current) {
        let isPressed: boolean = Boolean(btn.isLatched && btn.pressed);

        if (!isPressed) {
          // Check if any player is stepping on the button
          for (const p of allPlayers) {
            if (
              p.x + PLAYER_WIDTH - 6 > btn.x &&
              p.x + 6 < btn.x + btn.width &&
              p.y + PLAYER_HEIGHT >= btn.y - 4 &&
              p.y + PLAYER_HEIGHT <= btn.y + btn.height + 8
            ) {
              isPressed = true;
              break;
            }
          }

          // Check if any box is resting on the button
          if (!isPressed) {
            for (const b of boxesRef.current) {
              if (
                b.x + b.width > btn.x &&
                b.x < btn.x + btn.width &&
                b.y + b.height >= btn.y - 6 &&
                b.y + b.height <= btn.y + btn.height + 8
              ) {
                isPressed = true;
                break;
              }
            }
          }
        }

        if (isPressed !== btn.pressed) {
          btn.pressed = isPressed;
          sfx.playButtonClick(isPressed);

          // Update target doors
          if (level.id === 3 || level.id === 7) {
            // In simultaneous button levels, check if all required buttons are active
            const allPressed = buttonsRef.current.every((b) => b.pressed);
            for (const d of doorsRef.current) {
              if (!d.requiresKey && d.isOpen !== allPressed) {
                d.isOpen = allPressed;
                if (allPressed) sfx.playDoorOpen();
                onSyncObject?.({ isDoorOpen: allPressed });
              }
            }
          } else {
            const targetDoor = doorsRef.current.find((d) => d.id === btn.targetId);
            if (targetDoor && targetDoor.isOpen !== isPressed) {
              targetDoor.isOpen = isPressed;
              if (isPressed) sfx.playDoorOpen();
              onSyncObject?.({ isDoorOpen: isPressed });
            }
          }
        }
      }

      // --- 5. KEY MECHANISM ---
      for (const key of keysRef.current) {
        if (!key.pickedBy) {
          for (const p of allPlayers) {
            const dist = Math.hypot(p.x + PLAYER_WIDTH / 2 - key.x, p.y + PLAYER_HEIGHT / 2 - key.y);
            if (dist < 34) {
              key.pickedBy = p.id;
              sfx.playKeyPickup();
              onSyncObject?.({ keyPickedBy: p.id });
              break;
            }
          }
        } else {
          // Key follows carrier above head
          const carrier = playersRef.current[key.pickedBy];
          if (carrier) {
            key.x = carrier.x + PLAYER_WIDTH / 2;
            key.y = carrier.y - 18 + Math.sin(time * 0.006) * 4;

            // Check if carrier reached locked door
            for (const d of doorsRef.current) {
              if (d.requiresKey && !d.isOpen) {
                const distToDoor = Math.hypot(carrier.x - d.x, carrier.y - d.y);
                if (distToDoor < 70) {
                  d.isOpen = true;
                  sfx.playDoorOpen();
                  onSyncObject?.({ isDoorOpen: true });
                }
              }
            }
          } else {
            key.pickedBy = null;
          }
        }
      }

      // Smooth door animation progress
      for (const d of doorsRef.current) {
        const targetProgress = d.isOpen ? 1 : 0;
        d.progress += (targetProgress - d.progress) * 0.12;
      }

      // --- 6. WIN CONDITION CHECK (ALL PLAYERS IN GOAL) ---
      if (!isLevelClearedRef.current && allPlayers.length > 0) {
        const allInGoal = allPlayers.every((p) => p.inGoal);
        if (allInGoal) {
          isLevelClearedRef.current = true;
          setShowClearBanner(true);
          sfx.playLevelClear();

          // Confetti celebratory burst
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#22c55e', '#f97316', '#38bdf8', '#a855f7', '#facc15'],
            });
          } catch {}

          onLevelCleared?.();

          // Auto-advance to next level after celebration
          setTimeout(() => {
            onNextLevel?.();
          }, 2400);
        }
      }

      // --- 7. DYNAMIC CAMERA ZOOM & TRACKING ---
      if (allPlayers.length > 0) {
        let minX = Infinity,
          maxX = -Infinity;
        let minY = Infinity,
          maxY = -Infinity;

        for (const p of allPlayers) {
          if (p.x < minX) minX = p.x;
          if (p.x + PLAYER_WIDTH > maxX) maxX = p.x + PLAYER_WIDTH;
          if (p.y < minY) minY = p.y;
          if (p.y + PLAYER_HEIGHT > maxY) maxY = p.y + PLAYER_HEIGHT;
        }

        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.width / dpr;
        const cssH = canvas.height / dpr;

        // Fit the entire level nicely on landscape mobile screens, with gentle tracking
        const fitScaleX = (cssW * 0.94) / level.width;
        const fitScaleY = (cssH * 0.88) / level.height;
        const baseFitScale = Math.min(fitScaleX, fitScaleY, 1.35);

        const playersCenterX = (minX + maxX) / 2;
        const playersCenterY = (minY + maxY) / 2;

        // Blend 70% level center + 30% player focus so the stage never shifts awkwardly off-center
        const centerTargetX = level.width * 0.5 * 0.65 + playersCenterX * 0.35;
        const centerTargetY = level.height * 0.54 * 0.75 + playersCenterY * 0.25;

        cameraRef.current.targetX = centerTargetX;
        cameraRef.current.targetY = centerTargetY;
        cameraRef.current.targetScale = baseFitScale * dpr;

        if (cameraRef.current.x === 0 && cameraRef.current.y === 0) {
          cameraRef.current.x = cameraRef.current.targetX;
          cameraRef.current.y = cameraRef.current.targetY;
          cameraRef.current.scale = cameraRef.current.targetScale;
        } else {
          cameraRef.current.x += (cameraRef.current.targetX - cameraRef.current.x) * 0.12;
          cameraRef.current.y += (cameraRef.current.targetY - cameraRef.current.y) * 0.12;
          cameraRef.current.scale += (cameraRef.current.targetScale - cameraRef.current.scale) * 0.12;
        }
      }

      // --- 8. RENDER CANVAS SCENE ---
      renderScene(ctx, canvas, level, allPlayers, controlledPlayerId, time);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    levelIndex,
    myPlayerId,
    isLocalMode,
    isHost,
    onPlayerMove,
    onSyncObject,
    onLevelCleared,
    onNextLevel,
  ]);

  // Scene Rendering Function
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    level: LevelData,
    players: Player[],
    controlledPlayerId: string,
    time: number
  ) => {
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0f172a'; // Deep slate blue
    ctx.fillRect(0, 0, width, height);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(cameraRef.current.scale, cameraRef.current.scale);
    ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

    // Ambient room boundary grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= level.width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, level.height);
    }
    for (let y = 0; y <= level.height; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(level.width, y);
    }
    ctx.stroke();

    // Stage border line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, level.width, level.height);

    // --- DRAW WORLD GIMMICKS VISUALS ---
    // 1. Draw Distance Tether between players (World 2: Distance)
    if (level.hasDistanceSensor && players.length >= 2) {
      ctx.save();
      for (let i = 0; i < players.length - 1; i++) {
        const p1 = players[i];
        const p2 = players[i + 1];
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const isAlert = dist > (level.maxDistanceAllowed || 260);

        ctx.strokeStyle = isAlert ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = isAlert ? 3 : 2;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.moveTo(p1.x + PLAYER_WIDTH / 2, p1.y + PLAYER_HEIGHT / 2);
        ctx.lineTo(p2.x + PLAYER_WIDTH / 2, p2.y + PLAYER_HEIGHT / 2);
        ctx.stroke();

        const midX = (p1.x + p2.x + PLAYER_WIDTH) / 2;
        const midY = (p1.y + p2.y + PLAYER_HEIGHT) / 2;
        ctx.setLineDash([]);
        ctx.fillStyle = isAlert ? '#7f1d1d' : '#0c4a6e';
        ctx.beginPath();
        ctx.roundRect(midX - 22, midY - 9, 44, 18, 6);
        ctx.fill();
        ctx.fillStyle = isAlert ? '#fca5a5' : '#7dd3fc';
        ctx.font = 'bold 9px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(dist)}px`, midX, midY);
      }
      ctx.restore();
    }

    // 2. Draw Stop and Go Traffic Light (World 7: Stop and Go)
    if (level.hasStopAndGo) {
      ctx.save();
      const lightX = level.width / 2;
      const lightY = 55;
      const isRed = stopAndGoLightRef.current === 'red';

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.roundRect(lightX - 45, lightY - 24, 90, 48, 12);
      ctx.fill();
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Red bulb
      ctx.fillStyle = isRed ? '#ef4444' : '#450a0a';
      ctx.beginPath();
      ctx.arc(lightX - 20, lightY, 13, 0, Math.PI * 2);
      ctx.fill();

      // Green bulb
      ctx.fillStyle = !isRed ? '#22c55e' : '#052e16';
      ctx.beginPath();
      ctx.arc(lightX + 20, lightY, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isRed ? '#f87171' : '#4ade80';
      ctx.font = 'bold 11px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isRed ? 'PAREM! (VERMELHO)' : 'CORRAM! (VERDE)', lightX, lightY + 36);
      ctx.restore();
    }

    // 3. Draw Time Limit Clock (World 5: Time Limit)
    if (timeLimitRemainingRef.current !== null) {
      ctx.save();
      const clockX = level.width / 2;
      const clockY = 50;
      const timeLeft = Math.max(0, timeLimitRemainingRef.current);
      const isUrgent = timeLeft < 8;

      ctx.fillStyle = isUrgent ? '#7f1d1d' : '#18181b';
      ctx.beginPath();
      ctx.roundRect(clockX - 55, clockY - 16, 110, 32, 16);
      ctx.fill();
      ctx.strokeStyle = isUrgent ? '#ef4444' : '#3f3f46';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = isUrgent ? '#fca5a5' : '#facc15';
      ctx.font = 'bold 15px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⏱️ ${timeLeft.toFixed(1)}s`, clockX, clockY);
      ctx.restore();
    }

    // Draw Hazards / Spikes
    for (const haz of level.hazards) {
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(haz.x, haz.y, haz.width, haz.height);

      ctx.fillStyle = '#ef4444';
      for (let hx = haz.x; hx < haz.x + haz.width; hx += 16) {
        ctx.beginPath();
        ctx.moveTo(hx, haz.y + haz.height);
        ctx.lineTo(hx + 8, haz.y);
        ctx.lineTo(hx + 16, haz.y + haz.height);
        ctx.fill();
      }
    }

    // Draw Platforms
    for (const plat of level.platforms) {
      if (plat.width <= 0 || plat.height <= 0) continue;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, plat.width, plat.height, 4);
      ctx.fill();

      // Top grass/accent edge
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(plat.x, plat.y, plat.width, 4);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Moving Platforms (Elevators)
    for (const mp of movingPlatformsRef.current) {
      const isElevator = mp.behavior === 'stepToActivate';
      ctx.fillStyle = isElevator ? '#059669' : '#0284c7';
      ctx.beginPath();
      ctx.roundRect(mp.x, mp.y, mp.width, mp.height, 4);
      ctx.fill();

      ctx.fillStyle = isElevator ? '#34d399' : '#38bdf8';
      ctx.fillRect(mp.x, mp.y, mp.width, 3);

      ctx.strokeStyle = isElevator ? '#a7f3d0' : '#bae6fd';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Little indicator arrow for elevators
      if (isElevator) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▲ ELEVADOR', mp.x + mp.width / 2, mp.y + 11);
      }
    }

    // Draw Floor Buttons
    for (const btn of buttonsRef.current) {
      const depth = btn.pressed ? 2 : 6;
      ctx.fillStyle = btn.pressed ? '#10b981' : btn.color;
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y + (6 - depth), btn.width, depth, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.fillRect(btn.x - 3, btn.y + 6, btn.width + 6, 3);

      ctx.fillStyle = btn.pressed ? '#4ade80' : '#ffffff';
      ctx.beginPath();
      ctx.arc(btn.x + btn.width / 2, btn.y + (6 - depth) / 2 + 1, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Sliding Doors
    for (const door of doorsRef.current) {
      const openOffset = door.progress * (door.height - 4);
      const visibleHeight = Math.max(door.height - openOffset, 4);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.strokeRect(door.x, door.y, door.width, door.height);

      ctx.fillStyle = door.requiresKey ? '#eab308' : '#3b82f6';
      ctx.fillRect(door.x + 2, door.y, door.width - 4, visibleHeight);

      ctx.fillStyle = '#1e293b';
      for (let dy = 0; dy < visibleHeight; dy += 14) {
        ctx.fillRect(door.x + 3, door.y + dy, door.width - 6, 4);
      }
    }

    // Draw Boxes (Caixa Pesada)
    for (const box of boxesRef.current) {
      ctx.fillStyle = box.color || '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(box.x, box.y, box.width, box.height, 6);
      ctx.fill();

      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 13px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2P', box.x + box.width / 2, box.y + box.height / 2 - 3);

      ctx.font = 'bold 8px Fredoka, sans-serif';
      ctx.fillText('EMPURRE', box.x + box.width / 2, box.y + box.height / 2 + 10);

      // Active pusher feedback badge above box
      const pushers = box.activePushers || 0;
      if (pushers > 0) {
        ctx.save();
        if (pushers >= 2) {
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.roundRect(box.x - 12, box.y - 20, box.width + 24, 16, 8);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Fredoka, sans-serif';
          ctx.fillText('✨ 2/2 EMPURRANDO!', box.x + box.width / 2, box.y - 12);
        } else {
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.roundRect(box.x - 14, box.y - 20, box.width + 28, 16, 8);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9px Fredoka, sans-serif';
          ctx.fillText('👥 1/2 (JUNTOS!)', box.x + box.width / 2, box.y - 12);
        }
        ctx.restore();
      }
    }

    // Draw Goal (Cofre Verde de Saída)
    const goal = level.goal;
    const isReadyToClear = players.length > 0 && players.every((p) => p.inGoal);

    ctx.fillStyle = isReadyToClear ? '#15803d' : '#064e3b';
    ctx.beginPath();
    ctx.roundRect(goal.x, goal.y, goal.width, goal.height, [16, 16, 0, 0]);
    ctx.fill();

    ctx.strokeStyle = isReadyToClear ? '#4ade80' : '#10b981';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COFRE', goal.x + goal.width / 2, goal.y - 8);

    const pulse = 0.5 + Math.sin(time * 0.005) * 0.25;
    ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`;
    ctx.beginPath();
    ctx.arc(goal.x + goal.width / 2, goal.y + goal.height / 2, 16, 0, Math.PI * 2);
    ctx.fill();

    // Draw Floating Golden Key
    for (const key of keysRef.current) {
      ctx.save();
      ctx.translate(key.x, key.y);

      const rot = time * 0.003;
      ctx.rotate(rot);

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, -6, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -6, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.fillRect(-2, 0, 4, 14);
      ctx.fillRect(2, 6, 5, 3);
      ctx.fillRect(2, 11, 4, 3);

      ctx.restore();
    }

    // --- DRAW CHARACTERS (PICO PARK STYLE ADORABLE CATS/BLOCKS) ---
    for (const p of players) {
      const color = PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length];
      const isControlled = p.id === controlledPlayerId;

      ctx.save();

      const centerX = p.x + PLAYER_WIDTH / 2;
      const centerY = p.y + PLAYER_HEIGHT;
      ctx.translate(centerX, centerY);

      const scaleY = p.squash || 1;
      const scaleX = 1 / Math.sqrt(scaleY);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-centerX, -centerY);

      // Body (Rounded block with cute ears)
      ctx.fillStyle = color.hex;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, PLAYER_WIDTH, PLAYER_HEIGHT, 8);
      ctx.fill();

      // Little Cat Ears
      ctx.fillStyle = color.hex;
      ctx.beginPath();
      ctx.moveTo(p.x + 3, p.y + 4);
      ctx.lineTo(p.x + 8, p.y - 6);
      ctx.lineTo(p.x + 13, p.y + 2);

      ctx.moveTo(p.x + PLAYER_WIDTH - 13, p.y + 2);
      ctx.lineTo(p.x + PLAYER_WIDTH - 8, p.y - 6);
      ctx.lineTo(p.x + PLAYER_WIDTH - 3, p.y + 4);
      ctx.fill();

      // Border
      ctx.strokeStyle = color.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, PLAYER_WIDTH, PLAYER_HEIGHT, 8);
      ctx.stroke();

      // Feet
      const footCycle = Math.sin(p.walkFrame * Math.PI) * 4;
      ctx.fillStyle = color.border;
      ctx.beginPath();
      ctx.ellipse(p.x + 7, p.y + PLAYER_HEIGHT, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(p.x + PLAYER_WIDTH - 7, p.y + PLAYER_HEIGHT + (p.isGrounded ? footCycle : 0), 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      const eyeLookX = p.facing === 'left' ? -2.5 : 2.5;
      const eyeY = p.y + 12;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(p.x + 10 + eyeLookX * 0.5, eyeY, 4.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(p.x + 22 + eyeLookX * 0.5, eyeY, 4.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(p.x + 10 + eyeLookX, eyeY, 2.5, 0, Math.PI * 2);
      ctx.arc(p.x + 22 + eyeLookX, eyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Glimmer
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x + 9 + eyeLookX, eyeY - 1.5, 1, 0, Math.PI * 2);
      ctx.arc(p.x + 21 + eyeLookX, eyeY - 1.5, 1, 0, Math.PI * 2);
      ctx.fill();

      // Expression
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (!p.isGrounded) {
        ctx.fillStyle = '#09090b';
        ctx.ellipse(p.x + 16 + eyeLookX * 0.5, eyeY + 8, 2.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(p.x + 16 + eyeLookX * 0.5, eyeY + 7, 3.5, 0, Math.PI);
        ctx.stroke();
      }

      ctx.restore();

      // Player Name / Tag above character
      ctx.save();
      ctx.font = 'bold 10px Fredoka, sans-serif';
      ctx.textAlign = 'center';

      if (isControlled) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(p.x + PLAYER_WIDTH / 2 - 4, p.y - 12);
        ctx.lineTo(p.x + PLAYER_WIDTH / 2 + 4, p.y - 12);
        ctx.lineTo(p.x + PLAYER_WIDTH / 2, p.y - 6);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.fillText(p.name || 'Você', p.x + PLAYER_WIDTH / 2, p.y - 16);
      } else {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(p.name, p.x + PLAYER_WIDTH / 2, p.y - 12);
      }

      ctx.restore();
    }

    ctx.restore();
  };

  // Adjust canvas pixel density on resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 select-none">
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />

      {/* Victory Level Clear Banner Overlay */}
      {showClearBanner && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in zoom-in-95 duration-300">
          <div className="text-center p-6 rounded-3xl bg-zinc-900/90 border-2 border-emerald-400 shadow-2xl">
            <span className="text-4xl sm:text-6xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 animate-bounce">
              LEVEL CLEAR!
            </span>
            <p className="text-zinc-300 font-bold text-sm sm:text-base mt-2">
              Vocês venceram como um verdadeiro time! 🎉
            </p>
            <div className="mt-4 text-xs font-semibold text-emerald-400">
              Próxima fase começando em instantes...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
