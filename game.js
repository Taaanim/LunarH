/**
 * IMPOSTER HUNT - Main Game Logic v2
 * Features: Fog of War, Path Movement, Kill System, Improved Meetings
 */

class ImposterHunt {
    constructor() {
        // Game state
        this.currentScreen = 'mainMenu';
        this.isHost = false;
        this.isLocalGame = false;
        this.roomCode = null;

        // Player data
        this.localPlayer = null;
        this.players = new Map();

        // Canvas and rendering
        this.canvas = null;
        this.ctx = null;
        this.camera = { x: 0, y: 0 };
        this.visionRadius = 200;

        // Player movement
        this.playerPosition = { x: 1000, y: 700 };
        this.playerSpeed = 4;
        this.keysPressed = new Set();

        // Map dimensions
        this.mapWidth = 2000;
        this.mapHeight = 1500;

        // Walkable paths (rectangles defining corridors)
        this.paths = [
            // Central hall (vertical) - connects cafeteria to storage
            { x: 950, y: 300, width: 100, height: 900 },

            // Upper horizontal - connects left side to right side
            { x: 300, y: 380, width: 1400, height: 80 },

            // Lower horizontal - connects left side to right side
            { x: 300, y: 1000, width: 1400, height: 80 },

            // Left vertical - connects medbay to security
            { x: 350, y: 300, width: 80, height: 1000 },

            // Right vertical - connects weapons to shields
            { x: 1570, y: 300, width: 80, height: 1000 },

            // Middle left branch - connects left vertical to central hall
            { x: 430, y: 680, width: 520, height: 80 },

            // Middle right branch - connects central hall to right vertical
            { x: 1050, y: 680, width: 520, height: 80 },

            // Top left connector - reactor to upper horizontal
            { x: 500, y: 300, width: 250, height: 80 },

            // Top right connector - admin to upper horizontal
            { x: 1200, y: 300, width: 200, height: 80 },

            // Bottom left connector - engine to lower horizontal
            { x: 500, y: 1080, width: 250, height: 80 },

            // Bottom right connector - shields to lower horizontal
            { x: 1570, y: 1080, width: 130, height: 80 },
        ];

        // Rooms
        this.rooms = [
            { id: 'cafeteria', x: 850, y: 100, width: 300, height: 200, name: 'Cafeteria', color: '#2a4a2a', hasEmergency: true },
            { id: 'medbay', x: 100, y: 300, width: 200, height: 250, name: 'MedBay', color: '#2a2a4a', task: 'scan' },
            { id: 'electrical', x: 100, y: 700, width: 200, height: 250, name: 'Electrical', color: '#4a2a2a', task: 'wires' },
            { id: 'security', x: 100, y: 1100, width: 200, height: 200, name: 'Security', color: '#3a3a3a', task: 'cameras' },
            { id: 'reactor', x: 500, y: 100, width: 250, height: 200, name: 'Reactor', color: '#4a3a2a', task: 'reactor' },
            { id: 'engine', x: 500, y: 1100, width: 250, height: 200, name: 'Engine', color: '#4a4a2a', task: 'fuel' },
            { id: 'storage', x: 850, y: 1100, width: 300, height: 200, name: 'Storage', color: '#3a4a3a', task: 'trash' },
            { id: 'admin', x: 1200, y: 100, width: 200, height: 250, name: 'Admin', color: '#4a2a4a', task: 'card' },
            { id: 'weapons', x: 1700, y: 300, width: 200, height: 250, name: 'Weapons', color: '#2a3a4a', task: 'asteroids' },
            { id: 'navigation', x: 1700, y: 700, width: 200, height: 250, name: 'Navigation', color: '#3a2a4a', task: 'navigation' },
            { id: 'shields', x: 1700, y: 1100, width: 200, height: 200, name: 'Shields', color: '#2a4a4a', task: 'shields' },
        ];

        // Dead bodies
        this.bodies = [];

        // Game settings
        this.gameSettings = {
            imposterCount: 1,
            meetingTime: 60,
            killCooldown: 30
        };

        // Kill cooldown
        this.killCooldown = 0;
        this.lastKillTime = 0;

        // Tasks
        this.tasksCompleted = 0;
        this.totalTasks = 5;
        this.currentRoom = null;
        this.nearTask = false;
        this.nearBody = false;
        this.nearPlayer = null;

        // Bot AI
        this.botTargets = new Map(); // botId -> {targetX, targetY, nextMoveTime}
        this.botMoveInterval = 3000; // Bots change direction every 3 seconds


        // Meeting state
        this.meetingPhase = 'discuss'; // discuss, listen, vote
        this.selectedMeetingPlayer = null;
        this.selectedEmotion = null;
        this.playerEmotions = new Map(); // playerId -> [{from, emotion}]
        this.myVote = null;
        this.votes = new Map();
        this.meetingTimer = null;
        this.timeLeft = 60;

        // Tutorial
        this.tutorialSlide = 0;
        this.totalSlides = 4;

        this.init();
    }

    init() {
        this.createStars();
        this.setupCanvas();
        this.bindEvents();
        this.bindKeyboardControls();
        this.bindMobileControls();
        this.initializeTutorial();
        this.setupMultiplayerCallbacks();
        this.startGameLoop();
    }

    createStars() {
        const container = document.getElementById('starsContainer');
        if (!container) return;
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.width = `${Math.random() * 3 + 1}px`;
            star.style.height = star.style.width;
            star.style.animationDelay = `${Math.random() * 3}s`;
            container.appendChild(star);
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
        }
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    // ================== EVENT BINDING ==================

    bindEvents() {
        // Main menu
        document.getElementById('btnHostGame')?.addEventListener('click', () => this.showScreen('hostScreen'));
        document.getElementById('btnJoinGame')?.addEventListener('click', () => this.showScreen('joinScreen'));
        document.getElementById('btnLocalPlay')?.addEventListener('click', () => this.startLocalGame());
        document.getElementById('btnHowToPlay')?.addEventListener('click', () => this.showModal('howToPlayModal'));

        // Host/Join
        document.getElementById('btnBackFromHost')?.addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('btnBackFromJoin')?.addEventListener('click', () => this.showScreen('mainMenu'));
        document.getElementById('btnCreateRoom')?.addEventListener('click', () => this.createRoom());
        document.getElementById('btnJoinRoom')?.addEventListener('click', () => this.joinRoom());

        this.bindColorPicker('hostColorOptions', 'hostCharacterPreview');
        this.bindColorPicker('joinColorOptions', 'joinCharacterPreview');

        // Lobby
        document.getElementById('btnBackFromLobby')?.addEventListener('click', () => this.leaveLobby());
        document.getElementById('btnCopyCode')?.addEventListener('click', () => this.copyRoomCode());
        document.getElementById('btnStartGame')?.addEventListener('click', () => this.startGame());
        document.getElementById('btnDecreaseImposters')?.addEventListener('click', () => this.adjustSetting('imposterCount', -1));
        document.getElementById('btnIncreaseImposters')?.addEventListener('click', () => this.adjustSetting('imposterCount', 1));
        document.getElementById('btnDecreaseMeetingTime')?.addEventListener('click', () => this.adjustSetting('meetingTime', -15));
        document.getElementById('btnIncreaseMeetingTime')?.addEventListener('click', () => this.adjustSetting('meetingTime', 15));

        // Game
        document.getElementById('btnUse')?.addEventListener('click', () => this.useTask());
        document.getElementById('btnEmergency')?.addEventListener('click', () => this.callEmergencyMeeting());
        document.getElementById('btnKill')?.addEventListener('click', () => this.killPlayer());
        document.getElementById('btnReport')?.addEventListener('click', () => this.reportBody());
        document.getElementById('btnCloseTask')?.addEventListener('click', () => this.closeTask());

        // Role reveal
        document.getElementById('btnStartPlaying')?.addEventListener('click', () => this.showScreen('gameScreen'));

        // Meeting
        document.getElementById('btnSendEmotion')?.addEventListener('click', () => this.sendEmotion());
        document.getElementById('btnSkipVote')?.addEventListener('click', () => this.selectVote('skip'));
        // Note: btnNextPhase onclick is set dynamically in showMeetingPhase()
        document.getElementById('btnPrevPhase')?.addEventListener('click', () => this.prevMeetingPhase());

        this.bindEmotionButtons();

        // Modal
        document.getElementById('btnCloseHowTo')?.addEventListener('click', () => this.closeModal('howToPlayModal'));
        document.getElementById('btnPrevSlide')?.addEventListener('click', () => this.changeTutorialSlide(-1));
        document.getElementById('btnNextSlide')?.addEventListener('click', () => this.changeTutorialSlide(1));

        // Victory
        document.getElementById('btnPlayAgain')?.addEventListener('click', () => this.resetGame());
        document.getElementById('btnBackToMenu')?.addEventListener('click', () => {
            window.multiplayer?.disconnect();
            this.showScreen('mainMenu');
        });
    }

    bindColorPicker(containerId, previewId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                container.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                const preview = document.getElementById(previewId);
                if (preview) preview.style.background = option.dataset.color;
                window.audioManager?.playButtonClick();
            });
        });
    }

    bindEmotionButtons() {
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedEmotion = btn.dataset.emotion;
                window.audioManager?.playButtonClick();
            });
        });
    }

    bindKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (this.currentScreen !== 'gameScreen') return;

            const key = e.key.toLowerCase();

            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                e.preventDefault();
                this.keysPressed.add(key);
            }

            if (key === ' ' || key === 'space') {
                e.preventDefault();
                if (this.nearTask) this.useTask();
                if (this.currentRoom?.hasEmergency) this.callEmergencyMeeting();
            }

            if (key === 'q' && this.localPlayer?.isImposter && this.nearPlayer) {
                this.killPlayer();
            }

            if (key === 'r' && this.nearBody) {
                this.reportBody();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keysPressed.delete(e.key.toLowerCase());
        });
    }

    bindMobileControls() {
        document.querySelectorAll('.control-btn').forEach(btn => {
            const dir = btn.dataset.direction;
            const key = { up: 'w', down: 's', left: 'a', right: 'd' }[dir];

            ['touchstart', 'mousedown'].forEach(evt => {
                btn.addEventListener(evt, (e) => {
                    e.preventDefault();
                    this.keysPressed.add(key);
                });
            });

            ['touchend', 'mouseup', 'mouseleave'].forEach(evt => {
                btn.addEventListener(evt, () => this.keysPressed.delete(key));
            });
        });
    }

    // ================== GAME LOOP ==================

    startGameLoop() {
        const loop = () => {
            if (this.currentScreen === 'gameScreen') {
                this.update();
                this.render();
            }
            requestAnimationFrame(loop);
        };
        loop();
    }

    update() {
        // Movement
        let dx = 0, dy = 0;

        if (this.keysPressed.has('w') || this.keysPressed.has('arrowup')) dy -= 1;
        if (this.keysPressed.has('s') || this.keysPressed.has('arrowdown')) dy += 1;
        if (this.keysPressed.has('a') || this.keysPressed.has('arrowleft')) dx -= 1;
        if (this.keysPressed.has('d') || this.keysPressed.has('arrowright')) dx += 1;

        if (dx !== 0 || dy !== 0) {
            if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

            const newX = this.playerPosition.x + dx * this.playerSpeed;
            const newY = this.playerPosition.y + dy * this.playerSpeed;

            // Check if new position is valid (on a path or in a room)
            if (this.isValidPosition(newX, newY)) {
                this.playerPosition.x = newX;
                this.playerPosition.y = newY;

                if (!this.isLocalGame) {
                    window.multiplayer?.sendMovement(this.playerPosition.x, this.playerPosition.y);
                }
            }
        }

        // Update camera to follow player
        this.camera.x = this.playerPosition.x - this.canvas.width / 2;
        this.camera.y = this.playerPosition.y - this.canvas.height / 2;

        // Clamp camera
        this.camera.x = Math.max(0, Math.min(this.mapWidth - this.canvas.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.mapHeight - this.canvas.height, this.camera.y));

        // Update bots in local game
        if (this.isLocalGame && this.currentScreen === 'gameScreen') {
            this.updateBots();
        }

        // Check collisions
        this.checkInteractions();

        // Update kill cooldown
        if (this.localPlayer?.isImposter) {
            const now = Date.now();
            this.killCooldown = Math.max(0, this.gameSettings.killCooldown - (now - this.lastKillTime) / 1000);
        }

        this.updateHUD();
    }

    updateBots() {
        const now = Date.now();

        this.players.forEach((player, id) => {
            // Skip local player and dead players
            if (id === this.localPlayer?.id || !player.isAlive) return;

            // Initialize bot target if needed
            if (!this.botTargets.has(id) || now >= this.botTargets.get(id).nextMoveTime) {
                // Pick a random room as target
                const targetRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
                this.botTargets.set(id, {
                    targetX: targetRoom.x + targetRoom.width / 2,
                    targetY: targetRoom.y + targetRoom.height / 2,
                    nextMoveTime: now + this.botMoveInterval + Math.random() * 2000
                });
            }

            const target = this.botTargets.get(id);
            const dx = target.targetX - player.x;
            const dy = target.targetY - player.y;
            const distance = Math.hypot(dx, dy);

            // If close to target, pick new target
            if (distance < 50) {
                const targetRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
                this.botTargets.set(id, {
                    targetX: targetRoom.x + targetRoom.width / 2,
                    targetY: targetRoom.y + targetRoom.height / 2,
                    nextMoveTime: now + this.botMoveInterval + Math.random() * 2000
                });
                return;
            }

            // Move towards target
            const speed = 2; // Bot speed
            const moveX = (dx / distance) * speed;
            const moveY = (dy / distance) * speed;

            const newX = player.x + moveX;
            const newY = player.y + moveY;

            // Only move if valid position
            if (this.isValidPosition(newX, newY)) {
                player.x = newX;
                player.y = newY;
            } else {
                // If stuck, pick new target immediately
                const targetRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
                this.botTargets.set(id, {
                    targetX: targetRoom.x + targetRoom.width / 2,
                    targetY: targetRoom.y + targetRoom.height / 2,
                    nextMoveTime: now + 500,
                    lastKillTime: target.lastKillTime || 0
                });
            }

            // Bot imposter AI - kill nearby players
            if (player.isImposter && player.isAlive) {
                const killCooldown = 30000; // 30 seconds
                const lastKill = target.lastKillTime || 0;
                const timeSinceLastKill = now - lastKill;

                if (timeSinceLastKill >= killCooldown) {
                    // Find nearby alive crewmates
                    const nearbyVictims = Array.from(this.players.values()).filter(p => {
                        if (p.id === id || !p.isAlive || p.isImposter) return false;
                        const dist = Math.hypot(p.x - player.x, p.y - player.y);
                        return dist < 60;
                    });

                    if (nearbyVictims.length > 0) {
                        // Kill random nearby victim
                        const victim = nearbyVictims[Math.floor(Math.random() * nearbyVictims.length)];
                        victim.isAlive = false;

                        // Add body
                        const bodyData = {
                            x: victim.x,
                            y: victim.y,
                            color: victim.color,
                            playerId: victim.id
                        };
                        this.bodies.push(bodyData);

                        // Update kill time in target
                        const updatedTarget = this.botTargets.get(id);
                        updatedTarget.lastKillTime = now;
                        this.botTargets.set(id, updatedTarget);

                        // Play kill sound
                        window.audioManager?.playKillSound();
                    }
                }
            }

            // Bot crewmate AI - report bodies
            if (!player.isImposter && player.isAlive) {
                // Check for nearby bodies
                for (const body of this.bodies) {
                    const dist = Math.hypot(body.x - player.x, body.y - player.y);
                    if (dist < 80) {
                        // 10% chance per frame to report when near body
                        if (Math.random() < 0.01) {
                            setTimeout(() => {
                                if (this.bodies.length > 0) { // Check bodies still exist
                                    this.startMeeting('report', player.name);
                                }
                            }, 500);
                            return; // Stop checking after deciding to report
                        }
                    }
                }
            }
        });
    }

    isValidPosition(x, y) {
        const size = 15;

        // Check rooms
        for (const room of this.rooms) {
            if (x >= room.x && x <= room.x + room.width &&
                y >= room.y && y <= room.y + room.height) {
                return true;
            }
        }

        // Check paths
        for (const path of this.paths) {
            if (x >= path.x && x <= path.x + path.width &&
                y >= path.y && y <= path.y + path.height) {
                return true;
            }
        }

        return false;
    }

    checkInteractions() {
        const px = this.playerPosition.x;
        const py = this.playerPosition.y;

        // Check room
        this.currentRoom = null;
        this.nearTask = false;

        for (const room of this.rooms) {
            if (px >= room.x && px <= room.x + room.width &&
                py >= room.y && py <= room.y + room.height) {
                this.currentRoom = room;
                if (room.task) this.nearTask = true;
                break;
            }
        }

        // Check bodies
        this.nearBody = false;
        for (const body of this.bodies) {
            const dist = Math.hypot(body.x - px, body.y - py);
            if (dist < 50) {
                this.nearBody = true;
                break;
            }
        }

        // Check nearby players (for kill)
        this.nearPlayer = null;
        if (this.localPlayer?.isImposter) {
            this.players.forEach((player, id) => {
                if (id !== this.localPlayer.id && player.isAlive && !player.isImposter) {
                    const dist = Math.hypot(player.x - px, player.y - py);
                    if (dist < 60) {
                        this.nearPlayer = player;
                    }
                }
            });
        }
    }

    updateHUD() {
        const useBtn = document.getElementById('btnUse');
        const emergencyBtn = document.getElementById('btnEmergency');
        const killBtn = document.getElementById('btnKill');
        const reportBtn = document.getElementById('btnReport');

        // Show USE button for tasks only
        useBtn?.classList.toggle('hidden', !this.nearTask);
        if (useBtn && this.nearTask) {
            useBtn.textContent = 'USE';
        }

        // Show EMERGENCY button when in Cafeteria
        const inCafeteria = this.currentRoom?.hasEmergency;
        emergencyBtn?.classList.toggle('hidden', !inCafeteria);

        reportBtn?.classList.toggle('hidden', !this.nearBody);

        if (this.localPlayer?.isImposter) {
            killBtn?.classList.toggle('hidden', !this.nearPlayer || this.killCooldown > 0);
            if (this.killCooldown > 0) {
                killBtn.textContent = `KILL (${Math.ceil(this.killCooldown)}s)`;
            } else {
                killBtn.textContent = 'KILL';
            }
        } else {
            killBtn?.classList.add('hidden');
        }
    }

    // ================== RENDERING ==================

    render() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const cam = this.camera;

        // Clear
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw rooms
        for (const room of this.rooms) {
            ctx.fillStyle = room.color;
            ctx.fillRect(room.x - cam.x, room.y - cam.y, room.width, room.height);

            // Room border
            ctx.strokeStyle = '#38ffdd44';
            ctx.lineWidth = 2;
            ctx.strokeRect(room.x - cam.x, room.y - cam.y, room.width, room.height);

            // Room name
            ctx.fillStyle = '#ffffff88';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(room.name, room.x + room.width / 2 - cam.x, room.y + 25 - cam.y);

            // Task indicator
            if (room.task) {
                ctx.fillStyle = '#f6f658';
                ctx.fillRect(room.x + room.width / 2 - 15 - cam.x, room.y + room.height / 2 - 15 - cam.y, 30, 30);
            }

            // Emergency button
            if (room.hasEmergency) {
                ctx.fillStyle = '#c51111';
                ctx.beginPath();
                ctx.arc(room.x + room.width / 2 - cam.x, room.y + room.height / 2 - cam.y, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = '8px Russo One';
                ctx.fillText('EMERGENCY', room.x + room.width / 2 - cam.x, room.y + room.height / 2 + 3 - cam.y);
            }
        }

        // Draw paths
        ctx.fillStyle = '#1a1a2e';
        for (const path of this.paths) {
            ctx.fillRect(path.x - cam.x, path.y - cam.y, path.width, path.height);
        }

        // Draw bodies
        for (const body of this.bodies) {
            ctx.fillStyle = body.color;
            ctx.save();
            ctx.translate(body.x - cam.x, body.y - cam.y);
            ctx.rotate(Math.PI / 4);
            this.drawCrewmate(ctx, 0, 0, body.color, true);
            ctx.restore();
        }

        // Draw other players (only if in vision)
        this.players.forEach((player, id) => {
            if (id === this.localPlayer?.id) return;
            if (!player.isAlive) return;

            const dist = Math.hypot(player.x - this.playerPosition.x, player.y - this.playerPosition.y);
            if (dist <= this.visionRadius) {
                this.drawCrewmate(ctx, player.x - cam.x, player.y - cam.y, player.color);

                // Name
                ctx.fillStyle = 'white';
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(player.name, player.x - cam.x, player.y + 40 - cam.y);
            }
        });

        // Draw local player
        this.drawCrewmate(ctx, this.playerPosition.x - cam.x, this.playerPosition.y - cam.y, this.localPlayer?.color || '#c51111');

        // Player name
        ctx.fillStyle = 'white';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(this.localPlayer?.name || 'You', this.playerPosition.x - cam.x, this.playerPosition.y + 40 - cam.y);

        // Draw fog of war
        this.drawFogOfWar(ctx);
    }

    drawCrewmate(ctx, x, y, color, isDead = false) {
        ctx.save();
        ctx.translate(x, y);

        if (isDead) {
            ctx.globalAlpha = 0.7;
        }

        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = '#7ec8e3';
        ctx.beginPath();
        ctx.ellipse(5, -5, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Backpack
        ctx.fillStyle = color;
        ctx.fillRect(-20, -8, 8, 16);

        ctx.restore();
    }

    drawFogOfWar(ctx) {
        const playerScreenX = this.playerPosition.x - this.camera.x;
        const playerScreenY = this.playerPosition.y - this.camera.y;

        // Create radial gradient for vision
        const gradient = ctx.createRadialGradient(
            playerScreenX, playerScreenY, this.visionRadius * 0.5,
            playerScreenX, playerScreenY, this.visionRadius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

        // Draw fog
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Outer darkness
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';

        // Top
        ctx.fillRect(0, 0, this.canvas.width, Math.max(0, playerScreenY - this.visionRadius));
        // Bottom
        ctx.fillRect(0, playerScreenY + this.visionRadius, this.canvas.width, this.canvas.height);
        // Left
        ctx.fillRect(0, 0, Math.max(0, playerScreenX - this.visionRadius), this.canvas.height);
        // Right
        ctx.fillRect(playerScreenX + this.visionRadius, 0, this.canvas.width, this.canvas.height);
    }

    // ================== GAME ACTIONS ==================

    useTask() {
        if (!this.nearTask && !this.currentRoom?.hasEmergency) return;

        if (this.currentRoom?.hasEmergency) {
            this.callEmergencyMeeting();
            return;
        }

        const panel = document.getElementById('taskPanel');
        const content = document.getElementById('taskContent');

        if (panel && content) {
            panel.classList.remove('hidden');
            content.innerHTML = this.generateTaskHTML(this.currentRoom?.task || 'default');
        }
    }

    generateTaskHTML(taskType) {
        const tasks = {
            wires: `
                <h3>Fix Wiring</h3>
                <p>Match the colored wires!</p>
                <div class="task-game wires-game">
                    <div class="wire-side left">
                        <div class="wire" style="background:#c51111" data-color="red"></div>
                        <div class="wire" style="background:#132ed2" data-color="blue"></div>
                        <div class="wire" style="background:#f6f658" data-color="yellow"></div>
                    </div>
                    <div class="wire-side right">
                        <div class="wire" style="background:#f6f658" data-color="yellow"></div>
                        <div class="wire" style="background:#c51111" data-color="red"></div>
                        <div class="wire" style="background:#132ed2" data-color="blue"></div>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="game.completeTask()">Complete</button>
            `,
            default: `
                <h3>${taskType || 'Task'}</h3>
                <p>Complete this task to help the crew.</p>
                <div class="task-game simple-task">
                    <div class="progress-circle" id="taskProgress">0%</div>
                </div>
                <button class="btn btn-primary" onclick="game.completeTask()">Complete Task</button>
            `
        };
        return tasks[taskType] || tasks.default;
    }

    completeTask() {
        this.closeTask();
        this.tasksCompleted++;
        window.audioManager?.playTaskComplete();

        document.getElementById('taskProgress').style.width = `${(this.tasksCompleted / this.totalTasks) * 100}%`;
        document.getElementById('taskCount').textContent = `${this.tasksCompleted}/${this.totalTasks}`;

        if (this.tasksCompleted >= this.totalTasks) {
            this.showVictory(true);
        }
    }

    closeTask() {
        document.getElementById('taskPanel')?.classList.add('hidden');
    }

    killPlayer() {
        if (!this.localPlayer?.isImposter || !this.nearPlayer || this.killCooldown > 0) return;

        // Kill the nearby player
        this.nearPlayer.isAlive = false;

        // Add body
        const bodyData = {
            x: this.nearPlayer.x,
            y: this.nearPlayer.y,
            color: this.nearPlayer.color,
            playerId: this.nearPlayer.id
        };

        this.bodies.push(bodyData);

        // Start cooldown
        this.lastKillTime = Date.now();
        this.killCooldown = this.gameSettings.killCooldown;

        window.audioManager?.playKillSound();

        // Broadcast kill to other players
        if (!this.isLocalGame) {
            window.multiplayer?.sendKill(this.nearPlayer.id, bodyData);
        }

        // Don't check game end here - let meetings handle it
        // Players must find the body and vote out imposters
    }

    callEmergencyMeeting() {
        window.audioManager?.playEmergencyAlarm();

        // Broadcast to other players in multiplayer
        if (!this.isLocalGame) {
            window.multiplayer?.callMeeting({
                type: 'emergency',
                caller: this.localPlayer?.name
            });
        }

        this.startMeeting('emergency', this.localPlayer?.name);
    }

    reportBody() {
        if (!this.nearBody) return;
        window.audioManager?.playEmergencyAlarm();

        // Broadcast to other players in multiplayer
        if (!this.isLocalGame) {
            window.multiplayer?.callMeeting({
                type: 'report',
                caller: this.localPlayer?.name
            });
        }

        this.startMeeting('report', this.localPlayer?.name);
    }

    // ================== MEETING SYSTEM ==================

    startMeeting(type, caller) {
        this.meetingPhase = 'discuss';
        this.selectedMeetingPlayer = null;
        this.selectedEmotion = null;
        this.playerEmotions.clear();
        this.myVote = null;
        this.votes.clear();
        this.timeLeft = this.gameSettings.meetingTime;

        // Clear bodies
        this.bodies = [];

        // Setup meeting UI with theme-aligned messaging
        const meetingType = document.getElementById('meetingType');
        if (meetingType) {
            meetingType.textContent = type === 'report' ? '💀 BODY REPORTED' : '🚨 EMERGENCY MEETING';
            meetingType.style.textShadow = type === 'report' ? '0 0 20px #c51111' : '0 0 20px #f6f658';
        }

        const reporter = document.getElementById('meetingReporter');
        if (type === 'report' && reporter) {
            reporter.style.display = 'flex';
            const reporterText = document.getElementById('reporterText');
            if (reporterText) {
                reporterText.textContent = `${caller} found a body! Use colors and sounds to find the truth...`;
            }
        } else if (reporter) {
            reporter.style.display = 'none';
        }

        // Generate player grid
        this.updateMeetingPlayerGrid();

        // Show discuss section
        this.showMeetingPhase('discuss');

        // Start timer
        this.startMeetingTimer();

        // In solo mode, make bots express emotions automatically
        if (this.isLocalGame) {
            this.startBotMeetingAI();
        }

        this.showScreen('meetingScreen');
    }

    startBotMeetingAI() {
        // Bots express emotions randomly during discuss phase
        const emotions = ['suspicious', 'accusing', 'defending', 'confused', 'innocent'];
        const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
        const bots = alivePlayers.filter(p => p.id !== this.localPlayer?.id);

        // Each bot expresses 1-3 emotions
        bots.forEach((bot, botIndex) => {
            const emotionCount = 1 + Math.floor(Math.random() * 3);

            for (let i = 0; i < emotionCount; i++) {
                setTimeout(() => {
                    // Pick random target (not self)
                    const targets = alivePlayers.filter(p => p.id !== bot.id);
                    if (targets.length === 0) return;

                    const target = targets[Math.floor(Math.random() * targets.length)];
                    const emotion = emotions[Math.floor(Math.random() * emotions.length)];

                    // Add emotion
                    const targetEmotions = this.playerEmotions.get(target.id) || [];
                    targetEmotions.push({
                        from: bot.id,
                        emotion: emotion
                    });
                    this.playerEmotions.set(target.id, targetEmotions);

                    // Play sound
                    window.audioManager?.playEmotionSound(emotion, 5);

                    // Update grid
                    this.updateMeetingPlayerGrid();
                }, (botIndex * 1000) + (i * 800)); // Stagger bot emotions
            }
        });
    }

    updateMeetingPlayerGrid() {
        const grid = document.getElementById('playerGridMeeting');
        if (!grid) return;

        grid.innerHTML = '';

        this.players.forEach((player, id) => {
            const card = document.createElement('div');
            card.className = `meeting-player-card ${!player.isAlive ? 'dead' : ''} ${id === this.selectedMeetingPlayer ? 'selected' : ''}`;
            card.dataset.playerId = id;

            // Add colored border based on player color
            card.style.borderColor = player.color;
            card.style.boxShadow = `0 0 10px ${player.color}40`;

            // Get emotions received by this player
            const emotions = this.playerEmotions.get(id) || [];
            const emotionCounts = this.countEmotions(emotions);

            card.innerHTML = `
                <div class="meeting-crewmate" style="background: ${player.color}"></div>
                <div class="meeting-player-name" style="color: ${player.color}">${player.name}</div>
                ${!player.isAlive ? '<div class="dead-overlay">💀</div>' : ''}
                <div class="emotion-indicators">
                    ${this.renderEmotionIndicators(emotionCounts)}
                </div>
            `;

            if (player.isAlive && id !== this.localPlayer?.id) {
                card.addEventListener('click', () => this.selectMeetingPlayer(id));
            }

            grid.appendChild(card);
        });
    }

    countEmotions(emotions) {
        const counts = {};
        emotions.forEach(e => {
            counts[e.emotion] = (counts[e.emotion] || 0) + 1;
        });
        return counts;
    }

    renderEmotionIndicators(counts) {
        const icons = {
            suspicious: '🤔',
            accusing: '👆',
            defending: '🛡️',
            confused: '😕',
            innocent: '✅'
        };

        let html = '';
        for (const [emotion, count] of Object.entries(counts)) {
            html += `<span class="emotion-indicator ${emotion}" title="${emotion}: ${count}">${icons[emotion]}${count > 1 ? count : ''}</span>`;
        }
        return html;
    }

    selectMeetingPlayer(playerId) {
        this.selectedMeetingPlayer = playerId;
        const player = this.players.get(playerId);

        // Update selection
        document.querySelectorAll('.meeting-player-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.playerId === playerId);
        });

        // Show selected player panel
        const panel = document.getElementById('selectedPlayerPanel');
        if (panel && player) {
            panel.classList.remove('hidden');
            document.getElementById('selectedCrewmate').style.background = player.color;
            document.getElementById('selectedName').textContent = player.name;
        }

        // If in listen phase, play emotions
        if (this.meetingPhase === 'listen') {
            this.playPlayerEmotions(playerId);
        }

        window.audioManager?.playButtonClick();
    }

    sendEmotion() {
        if (!this.selectedMeetingPlayer || !this.selectedEmotion) {
            alert('Select a player and an emotion first!');
            return;
        }

        // Add emotion to that player
        const emotions = this.playerEmotions.get(this.selectedMeetingPlayer) || [];
        emotions.push({
            from: this.localPlayer?.id,
            emotion: this.selectedEmotion
        });
        this.playerEmotions.set(this.selectedMeetingPlayer, emotions);

        // Play sound
        window.audioManager?.playEmotionSound(this.selectedEmotion, 5);

        // Update grid
        this.updateMeetingPlayerGrid();

        // Reset selection
        this.selectedEmotion = null;
        document.querySelectorAll('.emotion-btn').forEach(b => b.classList.remove('active'));

        // Broadcast to others
        if (!this.isLocalGame) {
            window.multiplayer?.sendEmotion(this.selectedEmotion, 5);
        }
    }

    playPlayerEmotions(playerId) {
        const emotions = this.playerEmotions.get(playerId) || [];
        const player = this.players.get(playerId);

        // Show audio panel
        const panel = document.getElementById('emotionAudioPanel');
        if (panel) {
            panel.classList.remove('hidden');
            document.getElementById('emotionTargetName').textContent = player?.name || 'Player';
        }

        // Update visualizer
        this.updateEmotionVisualizer(emotions);

        // Play combined sounds
        emotions.forEach((e, i) => {
            setTimeout(() => {
                window.audioManager?.playEmotionSound(e.emotion, 5);
            }, i * 500);
        });
    }

    updateEmotionVisualizer(emotions) {
        const counts = this.countEmotions(emotions);
        const lights = document.getElementById('visualizerLights');
        const breakdown = document.getElementById('emotionBreakdown');

        if (lights) {
            lights.innerHTML = '';
            emotions.forEach(e => {
                const light = document.createElement('div');
                light.className = `visualizer-light ${e.emotion}`;
                lights.appendChild(light);
            });
        }

        if (breakdown) {
            const icons = { suspicious: '🤔', accusing: '👆', defending: '🛡️', confused: '😕', innocent: '✅' };
            breakdown.innerHTML = Object.entries(counts).map(([emotion, count]) =>
                `<div class="breakdown-item ${emotion}">${icons[emotion]} ${emotion}: ${count}</div>`
            ).join('');
        }
    }

    showMeetingPhase(phase) {
        this.meetingPhase = phase;

        // Update phase indicators
        document.querySelectorAll('.phase-step').forEach(step => {
            step.classList.toggle('active', step.dataset.phase === phase);
        });

        // Show/hide sections
        document.getElementById('discussionSection')?.classList.toggle('hidden', phase !== 'discuss');
        document.getElementById('listenSection')?.classList.toggle('hidden', phase !== 'listen');
        document.getElementById('voteSection')?.classList.toggle('hidden', phase !== 'vote');

        // Update nav buttons
        document.getElementById('btnPrevPhase')?.classList.toggle('hidden', phase === 'discuss');

        const nextBtn = document.getElementById('btnNextPhase');
        if (nextBtn) {
            if (phase === 'vote') {
                nextBtn.textContent = 'Confirm Vote';
                nextBtn.onclick = () => this.confirmVote();
            } else {
                nextBtn.textContent = 'Next Phase →';
                nextBtn.onclick = () => this.nextMeetingPhase();
            }
        }

        // Setup phase-specific content
        if (phase === 'listen') {
            this.updateEmotionSummaryGrid();
        } else if (phase === 'vote') {
            this.updateVoteGrid();
        }
    }

    updateEmotionSummaryGrid() {
        const grid = document.getElementById('emotionSummaryGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.players.forEach((player, id) => {
            if (!player.isAlive) return;

            const emotions = this.playerEmotions.get(id) || [];
            const counts = this.countEmotions(emotions);

            const card = document.createElement('div');
            card.className = 'emotion-summary-card';
            card.dataset.playerId = id;

            // Add colored border
            card.style.borderColor = player.color;
            card.style.boxShadow = `0 0 10px ${player.color}40`;

            card.innerHTML = `
                <div class="summary-crewmate" style="background: ${player.color}"></div>
                <div class="summary-name" style="color: ${player.color}">${player.name}</div>
                <div class="summary-emotions">
                    ${emotions.length > 0 ? this.renderEmotionIndicators(counts) : '<span class="no-emotions">No opinions yet</span>'}
                </div>
                <div class="summary-count">${emotions.length} opinion${emotions.length !== 1 ? 's' : ''}</div>
            `;

            card.addEventListener('click', () => this.playPlayerEmotions(id));
            grid.appendChild(card);
        });
    }

    updateVoteGrid() {
        const grid = document.getElementById('voteGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.players.forEach((player, id) => {
            if (!player.isAlive) return;

            const btn = document.createElement('button');
            btn.className = `vote-btn ${this.myVote === id ? 'selected' : ''}`;
            btn.dataset.playerId = id;

            // Add colored border
            btn.style.borderColor = player.color;
            if (this.myVote === id) {
                btn.style.boxShadow = `0 0 20px ${player.color}`;
            }

            btn.innerHTML = `
                <div class="vote-crewmate" style="background: ${player.color}"></div>
                <span style="color: ${player.color}">${player.name}</span>
            `;

            btn.addEventListener('click', () => this.selectVote(id));
            grid.appendChild(btn);
        });
    }

    nextMeetingPhase() {
        const phases = ['discuss', 'listen', 'vote'];
        const currentIndex = phases.indexOf(this.meetingPhase);
        if (currentIndex < phases.length - 1) {
            this.showMeetingPhase(phases[currentIndex + 1]);
        }
    }

    prevMeetingPhase() {
        const phases = ['discuss', 'listen', 'vote'];
        const currentIndex = phases.indexOf(this.meetingPhase);
        if (currentIndex > 0) {
            this.showMeetingPhase(phases[currentIndex - 1]);
        }
    }

    selectVote(playerId) {
        this.myVote = playerId;

        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.playerId === playerId);
        });

        document.getElementById('btnSkipVote')?.classList.toggle('selected', playerId === 'skip');

        window.audioManager?.playButtonClick();
    }

    confirmVote() {
        if (!this.myVote) {
            alert('Please vote for someone or skip!');
            return;
        }

        window.audioManager?.playVoteSound();

        // Stop timer
        if (this.meetingTimer) {
            clearInterval(this.meetingTimer);
        }

        // Process results
        setTimeout(() => this.processMeetingResults(), 1500);
    }

    startMeetingTimer() {
        if (this.meetingTimer) clearInterval(this.meetingTimer);

        const timerEl = document.getElementById('meetingTimeLeft');

        this.meetingTimer = setInterval(() => {
            this.timeLeft--;
            if (timerEl) timerEl.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                clearInterval(this.meetingTimer);
                this.processMeetingResults();
            }
        }, 1000);
    }

    processMeetingResults() {
        let ejected = null;

        if (this.myVote && this.myVote !== 'skip') {
            ejected = this.players.get(this.myVote);
        }

        if (ejected) {
            ejected.isAlive = false;

            const body = document.querySelector('.ejected-body');
            if (body) body.style.background = ejected.color;

            document.getElementById('resultsTitle').textContent = `${ejected.name} was ejected.`;
            document.getElementById('resultsSubtitle').textContent = ejected.isImposter
                ? `${ejected.name} was An Imposter.`
                : `${ejected.name} was not An Imposter.`;
            document.getElementById('resultsSubtitle').className = ejected.isImposter ? 'results-imposter' : 'results-not-imposter';

            const remaining = Array.from(this.players.values()).filter(p => p.isImposter && p.isAlive).length;
            document.getElementById('impostersRemaining').textContent = `${remaining} Imposter${remaining !== 1 ? 's' : ''} remain${remaining === 1 ? 's' : ''}.`;

            window.audioManager?.playEjectSound();
        } else {
            document.getElementById('resultsTitle').textContent = 'No one was ejected.';
            document.getElementById('resultsSubtitle').textContent = 'Skipped';
        }

        this.showScreen('resultsScreen');

        setTimeout(() => this.checkGameEnd(), 4000);
    }

    checkGameEnd() {
        const aliveCrew = Array.from(this.players.values()).filter(p => !p.isImposter && p.isAlive).length;
        const aliveImposters = Array.from(this.players.values()).filter(p => p.isImposter && p.isAlive).length;

        if (aliveImposters === 0) {
            this.showVictory(true);
        } else if (aliveImposters >= aliveCrew) {
            this.showVictory(false);
        } else {
            // Reset positions
            this.playerPosition = { x: 1000, y: 700 };
            this.showScreen('gameScreen');
        }
    }

    showVictory(crewmatesWin) {
        const title = document.getElementById('victoryTitle');
        const subtitle = document.getElementById('victorySubtitle');

        if (title) {
            title.textContent = crewmatesWin ? 'CREWMATES WIN' : 'IMPOSTERS WIN';
            title.className = `victory-title ${crewmatesWin ? 'crewmate-win' : 'imposter-win'}`;
        }

        if (subtitle) {
            subtitle.textContent = crewmatesWin ? 'All imposters have been ejected!' : 'The imposters have taken over!';
        }

        window.audioManager?.playVictoryFanfare(crewmatesWin);
        this.showScreen('victoryScreen');
    }

    // ================== LOBBY & GAME SETUP ==================

    startLocalGame() {
        this.isLocalGame = true;
        this.isHost = true;
        this.roomCode = 'LOCAL';

        this.localPlayer = {
            id: 'local-player',
            name: 'You',
            color: '#c51111',
            isHost: true,
            isImposter: false,
            isAlive: true,
            x: 1000,
            y: 700
        };

        this.players.clear();
        this.players.set(this.localPlayer.id, this.localPlayer);

        // Add demo bots
        const bots = [
            { id: 'bot-1', name: 'Blue', color: '#132ed2', x: 900, y: 700 },
            { id: 'bot-2', name: 'Green', color: '#11802d', x: 1100, y: 700 },
            { id: 'bot-3', name: 'Pink', color: '#ee54bb', x: 1000, y: 600 }
        ];

        bots.forEach(bot => {
            this.players.set(bot.id, { ...bot, isImposter: false, isAlive: true });
        });

        document.getElementById('roomCode').textContent = 'LOCAL';
        document.getElementById('connectionStatus').innerHTML = '<span class="status-dot online"></span><span>Solo Mode</span>';

        this.updateLobbyPlayers();
        this.showScreen('lobbyScreen');
    }

    async createRoom() {
        const name = document.getElementById('hostPlayerName')?.value.trim() || 'Host';
        const color = document.querySelector('#hostColorOptions .color-option.selected')?.dataset.color || '#c51111';

        this.localPlayer = { name, color, isHost: true, isImposter: false, isAlive: true };

        try {
            const result = await window.multiplayer.hostGame(this.localPlayer);
            this.isHost = true;
            this.isLocalGame = false;
            this.roomCode = result.roomCode;
            this.localPlayer.id = result.playerId;

            this.players.clear();
            this.players.set(this.localPlayer.id, { ...this.localPlayer, x: 1000, y: 700 });

            document.getElementById('roomCode').textContent = this.roomCode;
            document.getElementById('connectionStatus').innerHTML = '<span class="status-dot online"></span><span>Hosting</span>';

            this.updateLobbyPlayers();
            this.showScreen('lobbyScreen');
        } catch (error) {
            alert('Could not create room: ' + (error.error || 'Unknown error'));
        }
    }

    async joinRoom() {
        const name = document.getElementById('joinPlayerName')?.value.trim() || 'Player';
        const code = document.getElementById('roomCodeInput')?.value.trim().toUpperCase();
        const color = document.querySelector('#joinColorOptions .color-option.selected')?.dataset.color || '#132ed2';

        if (!code || code.length !== 6) {
            alert('Please enter a valid room code');
            return;
        }

        this.localPlayer = { name, color, isHost: false, isImposter: false, isAlive: true };

        try {
            const result = await window.multiplayer.joinGame(code, this.localPlayer);
            this.isHost = false;
            this.isLocalGame = false;
            this.roomCode = result.roomCode;
            this.localPlayer.id = result.playerId;

            this.players.set(this.localPlayer.id, { ...this.localPlayer, x: 1000, y: 700 });

            document.getElementById('roomCode').textContent = this.roomCode;
            document.getElementById('connectionStatus').innerHTML = '<span class="status-dot online"></span><span>Connected</span>';

            document.getElementById('gameSettingsPanel').style.display = 'none';
            document.getElementById('btnStartGame').style.display = 'none';

            this.updateLobbyPlayers();
            this.showScreen('lobbyScreen');
        } catch (error) {
            alert('Could not join: ' + (error.error || 'Room not found'));
        }
    }

    leaveLobby() {
        window.multiplayer?.disconnect();
        this.players.clear();
        this.showScreen('mainMenu');
    }

    copyRoomCode() {
        if (this.roomCode) {
            navigator.clipboard.writeText(this.roomCode);
            const btn = document.getElementById('btnCopyCode');
            if (btn) {
                btn.textContent = '✓';
                setTimeout(() => btn.textContent = '📋', 2000);
            }
        }
    }

    updateLobbyPlayers() {
        const grid = document.getElementById('playersGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const allPlayers = this.isLocalGame
            ? Array.from(this.players.values())
            : window.multiplayer?.getAllPlayers() || [];

        allPlayers.forEach(player => {
            const slot = document.createElement('div');
            slot.className = 'player-slot occupied';
            slot.innerHTML = `
                <div class="mini-crewmate" style="background: ${player.color}"></div>
                <span class="player-name">${player.name}</span>
                ${player.id === this.localPlayer?.id ? '<span class="you-badge">(You)</span>' : ''}
                ${player.isHost ? '<span class="host-badge">👑</span>' : ''}
            `;
            grid.appendChild(slot);
        });

        document.getElementById('currentPlayers').textContent = allPlayers.length;
    }

    adjustSetting(setting, delta) {
        if (setting === 'imposterCount') {
            this.gameSettings.imposterCount = Math.max(1, Math.min(2, this.gameSettings.imposterCount + delta));
            document.getElementById('imposterCount').textContent = this.gameSettings.imposterCount;
        } else if (setting === 'meetingTime') {
            this.gameSettings.meetingTime = Math.max(30, Math.min(120, this.gameSettings.meetingTime + delta));
            document.getElementById('meetingTime').textContent = this.gameSettings.meetingTime;
        }
    }

    startGame() {
        if (!this.isHost) return;

        const allPlayers = this.isLocalGame
            ? Array.from(this.players.values())
            : window.multiplayer?.getAllPlayers() || [];

        // Assign imposters
        const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(this.gameSettings.imposterCount, shuffled.length - 1); i++) {
            shuffled[i].isImposter = true;
        }

        // Update players - spawn in central hall (guaranteed walkable area)
        this.players.clear();
        allPlayers.forEach((p, index) => {
            // Spawn in central vertical hall area (x: 950-1050, y: 400-1100)
            // Spread players out vertically
            const spacing = 100;
            const startY = 500;
            p.x = 975 + (Math.random() * 50 - 25); // Center of hall with small variation
            p.y = startY + (index * spacing) + (Math.random() * 40 - 20);
            // Ensure within bounds
            p.y = Math.max(400, Math.min(1100, p.y));
            this.players.set(p.id, p);
        });

        const me = this.players.get(this.localPlayer.id);
        if (me) {
            this.localPlayer.isImposter = me.isImposter;
            this.playerPosition = { x: me.x, y: me.y };
        }

        this.tasksCompleted = 0;
        this.bodies = [];
        this.lastKillTime = 0;

        // Broadcast game start to all players in multiplayer
        if (!this.isLocalGame) {
            window.multiplayer?.startGame({
                players: Array.from(this.players.values()),
                settings: this.gameSettings
            });
        }

        // Show role reveal
        this.showRoleReveal();
    }

    showRoleReveal() {
        const title = document.getElementById('roleRevealTitle');
        const subtitle = document.getElementById('roleRevealSubtitle');
        const character = document.getElementById('revealCharacter');
        const teammates = document.getElementById('imposterTeammates');

        if (character) character.style.background = this.localPlayer?.color;

        if (this.localPlayer?.isImposter) {
            if (title) {
                title.textContent = 'IMPOSTER';
                title.style.color = '#c51111';
            }
            if (subtitle) subtitle.textContent = 'Sabotage and eliminate the crew without getting caught!';

            // Show teammates
            const otherImposters = Array.from(this.players.values()).filter(p => p.isImposter && p.id !== this.localPlayer.id);
            if (otherImposters.length > 0 && teammates) {
                teammates.classList.remove('hidden');
                const list = document.getElementById('teammateList');
                if (list) {
                    list.innerHTML = otherImposters.map(p =>
                        `<div class="teammate"><div class="teammate-color" style="background:${p.color}"></div>${p.name}</div>`
                    ).join('');
                }
            }
        } else {
            if (title) {
                title.textContent = 'CREWMATE';
                title.style.color = '#38ffdd';
            }
            if (subtitle) subtitle.textContent = 'Complete your tasks and find the imposter!';
            teammates?.classList.add('hidden');
        }

        // Update badge
        const badge = document.getElementById('roleBadge');
        if (badge) {
            badge.textContent = this.localPlayer?.isImposter ? 'IMPOSTER' : 'CREWMATE';
            badge.className = `role-badge ${this.localPlayer?.isImposter ? 'imposter' : 'crewmate'}`;
        }

        this.showScreen('roleRevealScreen');
    }

    resetGame() {
        this.players.forEach(p => {
            p.isAlive = true;
            p.isImposter = false;
        });
        this.tasksCompleted = 0;
        this.bodies = [];
        this.updateLobbyPlayers();
        this.showScreen('lobbyScreen');
    }

    // ================== SCREEN MANAGEMENT ==================

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId)?.classList.add('active');
        this.currentScreen = screenId;
        window.audioManager?.playButtonClick();
    }

    showModal(modalId) {
        document.getElementById(modalId)?.classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    }

    // ================== TUTORIAL ==================

    initializeTutorial() {
        const dots = document.getElementById('slideDots');
        if (dots) {
            dots.innerHTML = '';
            for (let i = 0; i < this.totalSlides; i++) {
                const dot = document.createElement('div');
                dot.className = `slide-dot ${i === 0 ? 'active' : ''}`;
                dots.appendChild(dot);
            }
        }
    }

    changeTutorialSlide(delta) {
        this.tutorialSlide = Math.max(0, Math.min(this.totalSlides - 1, this.tutorialSlide + delta));

        document.querySelectorAll('.tutorial-slide').forEach((slide, i) => {
            slide.classList.toggle('active', i === this.tutorialSlide);
        });

        document.querySelectorAll('.slide-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === this.tutorialSlide);
        });
    }

    // ================== MULTIPLAYER CALLBACKS ==================

    setupMultiplayerCallbacks() {
        if (!window.multiplayer) return;

        window.multiplayer.onPlayerJoin = () => {
            // Sync all players from multiplayer to game
            if (!this.isLocalGame) {
                const multiplayerPlayers = window.multiplayer.getAllPlayers();
                multiplayerPlayers.forEach(p => {
                    if (!this.players.has(p.id)) {
                        // Initialize position for new players
                        p.x = p.x || 1000;
                        p.y = p.y || 700;
                        p.isAlive = p.isAlive !== undefined ? p.isAlive : true;
                    }
                    this.players.set(p.id, p);
                });
            }
            this.updateLobbyPlayers();
        };

        window.multiplayer.onPlayerLeave = (playerId) => {
            this.players.delete(playerId);
            this.updateLobbyPlayers();
        };

        window.multiplayer.onPlayerUpdate = (playerId, data) => {
            // Update player position in game.players
            let player = this.players.get(playerId);
            if (!player) {
                // Player not in game.players yet, get from multiplayer
                player = window.multiplayer.players.get(playerId);
                if (player) {
                    player.x = data.x;
                    player.y = data.y;
                    this.players.set(playerId, player);
                }
            } else {
                player.x = data.x;
                player.y = data.y;
            }
        };

        window.multiplayer.onGameStart = (data) => {
            this.players.clear();
            data.players.forEach(p => this.players.set(p.id, p));

            const me = this.players.get(this.localPlayer.id);
            if (me) {
                this.localPlayer.isImposter = me.isImposter;
                this.playerPosition = { x: me.x, y: me.y };
            }

            this.showRoleReveal();
        };

        window.multiplayer.onMeetingStart = (data) => {
            this.startMeeting(data.type, data.caller);
        };

        window.multiplayer.onKill = (victimId, killerId, bodyData) => {
            // Mark victim as dead
            const victim = this.players.get(victimId);
            if (victim) {
                victim.isAlive = false;
            }

            // Add body to the scene
            if (bodyData) {
                this.bodies.push(bodyData);
            }

            // Play sound effect
            window.audioManager?.playKillSound();
        };
    }
}

// Initialize
window.game = new ImposterHunt();
