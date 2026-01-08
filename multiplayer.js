/**
 * IMPOSTER HUNT - Multiplayer System
 * Uses PeerJS for WebRTC peer-to-peer connections
 * Works without a dedicated server - perfect for GitHub Pages hosting
 */

class MultiplayerManager {
    constructor() {
        this.peer = null;
        this.connections = new Map(); // peerId -> connection
        this.isHost = false;
        this.roomCode = null;
        this.playerId = null;
        this.players = new Map(); // peerId -> playerData
        this.messageHandlers = new Map();

        this.onPlayerJoin = null;
        this.onPlayerLeave = null;
        this.onPlayerUpdate = null;
        this.onGameStart = null;
        this.onMeetingStart = null;
        this.onVoteReceived = null;
        this.onEmotionReceived = null;
        this.onKill = null;
    }

    /**
     * Generate a random room code
     */
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Host a new game room
     */
    async hostGame(playerData) {
        return new Promise((resolve, reject) => {
            this.isHost = true;
            this.roomCode = this.generateRoomCode();

            // Create peer with room code as ID for easy joining
            const peerId = `imposter-hunt-${this.roomCode}`;

            this.peer = new Peer(peerId, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log('Host peer created:', id);
                this.playerId = id;

                // Add host as first player
                this.players.set(id, {
                    ...playerData,
                    id: id,
                    isHost: true,
                    isReady: true
                });

                resolve({
                    success: true,
                    roomCode: this.roomCode,
                    playerId: id
                });
            });

            this.peer.on('connection', (conn) => {
                this.handleNewConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.error('Host peer error:', err);
                if (err.type === 'unavailable-id') {
                    // Room code already in use, generate new one
                    this.roomCode = this.generateRoomCode();
                    reject({ error: 'Room code taken, try again' });
                } else {
                    reject({ error: err.message });
                }
            });
        });
    }

    /**
     * Join an existing game room
     */
    async joinGame(roomCode, playerData) {
        return new Promise((resolve, reject) => {
            this.isHost = false;
            this.roomCode = roomCode.toUpperCase();

            // Generate unique ID for this player
            const myId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

            this.peer = new Peer(myId, {
                debug: 1
            });

            this.peer.on('open', (id) => {
                console.log('Client peer created:', id);
                this.playerId = id;

                // Connect to host
                const hostId = `imposter-hunt-${this.roomCode}`;
                const conn = this.peer.connect(hostId, {
                    reliable: true,
                    metadata: playerData
                });

                conn.on('open', () => {
                    console.log('Connected to host');
                    this.connections.set(hostId, conn);

                    // Send join request
                    this.sendToHost({
                        type: 'join',
                        player: {
                            ...playerData,
                            id: id
                        }
                    });

                    this.setupConnectionHandlers(conn);

                    resolve({
                        success: true,
                        roomCode: this.roomCode,
                        playerId: id
                    });
                });

                conn.on('error', (err) => {
                    console.error('Connection error:', err);
                    reject({ error: 'Could not connect to room' });
                });

                // Timeout for connection
                setTimeout(() => {
                    if (!conn.open) {
                        reject({ error: 'Connection timeout - room may not exist' });
                    }
                }, 10000);
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                reject({ error: err.message });
            });

            // Also listen for incoming connections (for peer-to-peer mesh)
            this.peer.on('connection', (conn) => {
                this.handleNewConnection(conn);
            });
        });
    }

    /**
     * Handle new peer connection
     */
    handleNewConnection(conn) {
        console.log('New connection from:', conn.peer);

        conn.on('open', () => {
            this.connections.set(conn.peer, conn);
            this.setupConnectionHandlers(conn);

            if (this.isHost) {
                // Send current game state to new player
                this.sendTo(conn.peer, {
                    type: 'gameState',
                    players: Array.from(this.players.values()),
                    settings: window.game?.gameSettings
                });
            }
        });
    }

    /**
     * Setup message handlers for a connection
     */
    setupConnectionHandlers(conn) {
        conn.on('data', (data) => {
            this.handleMessage(conn.peer, data);
        });

        conn.on('close', () => {
            console.log('Connection closed:', conn.peer);
            this.connections.delete(conn.peer);
            this.players.delete(conn.peer);

            if (this.onPlayerLeave) {
                this.onPlayerLeave(conn.peer);
            }

            // Broadcast updated player list if host
            if (this.isHost) {
                this.broadcastPlayerList();
            }
        });
    }

    /**
     * Handle incoming message
     */
    handleMessage(fromPeer, data) {
        console.log('Message from', fromPeer, ':', data.type);

        switch (data.type) {
            case 'join':
                if (this.isHost) {
                    // Add new player
                    this.players.set(fromPeer, {
                        ...data.player,
                        isHost: false
                    });

                    // Broadcast updated player list
                    this.broadcastPlayerList();

                    if (this.onPlayerJoin) {
                        this.onPlayerJoin(data.player);
                    }
                }
                break;

            case 'gameState':
                // Received current game state from host
                data.players.forEach(player => {
                    this.players.set(player.id, player);
                });

                if (this.onPlayerJoin) {
                    this.onPlayerJoin(null); // Trigger UI update
                }
                break;

            case 'playerList':
                // Update player list
                this.players.clear();
                data.players.forEach(player => {
                    this.players.set(player.id, player);
                });

                if (this.onPlayerJoin) {
                    this.onPlayerJoin(null);
                }
                break;

            case 'playerMove':
                // Update player position
                const player = this.players.get(fromPeer);
                if (player) {
                    player.x = data.x;
                    player.y = data.y;
                }

                if (this.onPlayerUpdate) {
                    this.onPlayerUpdate(fromPeer, data);
                }

                // Host rebroadcasts to all others
                if (this.isHost) {
                    this.broadcast({ ...data, playerId: fromPeer }, fromPeer);
                }
                break;

            case 'startGame':
                if (this.onGameStart) {
                    this.onGameStart(data);
                }
                break;

            case 'meeting':
                if (this.onMeetingStart) {
                    this.onMeetingStart(data);
                }
                break;

            case 'vote':
                if (this.onVoteReceived) {
                    this.onVoteReceived(fromPeer, data.vote);
                }
                break;

            case 'emotion':
                if (this.onEmotionReceived) {
                    this.onEmotionReceived(fromPeer, data.emotion, data.intensity);
                }
                break;

            case 'kill':
                if (this.onKill) {
                    this.onKill(data.victimId, data.killerId, data.bodyData);
                }
                break;

            case 'chat':
                // Handle chat messages if implemented
                break;
        }
    }

    /**
     * Send message to a specific peer
     */
    sendTo(peerId, data) {
        const conn = this.connections.get(peerId);
        if (conn && conn.open) {
            conn.send(data);
        }
    }

    /**
     * Send message to host (for clients)
     */
    sendToHost(data) {
        const hostId = `imposter-hunt-${this.roomCode}`;
        this.sendTo(hostId, data);
    }

    /**
     * Broadcast message to all connected peers
     */
    broadcast(data, excludePeer = null) {
        this.connections.forEach((conn, peerId) => {
            if (peerId !== excludePeer && conn.open) {
                conn.send(data);
            }
        });
    }

    /**
     * Broadcast updated player list (host only)
     */
    broadcastPlayerList() {
        if (!this.isHost) return;

        this.broadcast({
            type: 'playerList',
            players: Array.from(this.players.values())
        });
    }

    /**
     * Send player movement update
     */
    sendMovement(x, y) {
        const data = {
            type: 'playerMove',
            x: x,
            y: y
        };

        if (this.isHost) {
            this.broadcast(data);
        } else {
            this.sendToHost(data);
        }
    }

    /**
     * Start the game (host only)
     */
    startGame(gameData) {
        if (!this.isHost) return;

        this.broadcast({
            type: 'startGame',
            ...gameData
        });
    }

    /**
     * Call a meeting
     */
    callMeeting(meetingData) {
        const data = {
            type: 'meeting',
            ...meetingData
        };

        if (this.isHost) {
            this.broadcast(data);
        } else {
            this.sendToHost(data);
        }
    }

    /**
     * Send a vote
     */
    sendVote(vote) {
        const data = {
            type: 'vote',
            vote: vote
        };

        if (this.isHost) {
            this.broadcast(data);
        } else {
            this.sendToHost(data);
        }
    }

    /**
     * Send emotion update
     */
    sendEmotion(emotion, intensity) {
        const data = {
            type: 'emotion',
            emotion: emotion,
            intensity: intensity
        };

        if (this.isHost) {
            this.broadcast(data);
        } else {
            this.sendToHost(data);
        }
    }

    /**
     * Send kill event
     */
    sendKill(victimId, bodyData) {
        const data = {
            type: 'kill',
            victimId: victimId,
            killerId: this.playerId,
            bodyData: bodyData
        };

        if (this.isHost) {
            this.broadcast(data);
        } else {
            this.sendToHost(data);
        }
    }

    /**
     * Get all players
     */
    getAllPlayers() {
        return Array.from(this.players.values());
    }

    /**
     * Get player count
     */
    getPlayerCount() {
        return this.players.size;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.peer && !this.peer.destroyed;
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        this.connections.forEach(conn => conn.close());
        this.connections.clear();
        this.players.clear();

        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }

        this.isHost = false;
        this.roomCode = null;
    }
}

// Create global multiplayer instance
window.multiplayer = new MultiplayerManager();
