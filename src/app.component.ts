
import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  TECH_SERVICES, Tile, Player, TechService, CATEGORY_COLORS, 
  LOGIC_CARDS_DECK, GameState, GameCommand 
} from './models/game.types';
import { AIAdvisorService } from './services/ai-advisor.service';
import { GameSessionService } from './services/game-session.service';

type AppMode = 'LOBBY' | 'JOIN_SESSION' | 'SELECT_PLAYER' | 'BOARD' | 'CONTROLLER';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private aiAdvisor = inject(AIAdvisorService);
  private session = inject(GameSessionService);
  
  appMode = signal<AppMode>('LOBBY');
  sessionCode = signal<string>('');
  enteredCode = signal<string>('');
  joinedPlayerId = signal<number | null>(null);

  players = signal<Player[]>([
    { id: 0, name: 'Brick Master', color: '#ef4444', position: 0, balance: 1500, streetCred: 0, avatar: '👷', cards: [LOGIC_CARDS_DECK[0], LOGIC_CARDS_DECK[1]], mood: 'neutral' },
    { id: 1, name: 'Cyber Rogue', color: '#3b82f6', position: 0, balance: 1500, streetCred: 0, avatar: '🥷', cards: [LOGIC_CARDS_DECK[2], LOGIC_CARDS_DECK[5]], mood: 'neutral' },
    { id: 2, name: 'AI Bot', color: '#22c55e', position: 0, balance: 1500, streetCred: 0, avatar: '🤖', cards: [LOGIC_CARDS_DECK[4]], mood: 'neutral' },
    { id: 3, name: 'Lead Architect', color: '#9333ea', position: 0, balance: 1500, streetCred: 0, avatar: '🧙', cards: [LOGIC_CARDS_DECK[6]], mood: 'neutral' }
  ]);
  
  currentPlayerIndex = signal(0);
  turnPhase = signal<'ROLL' | 'ACTION' | 'END'>('ROLL');
  isRolling = signal(false);
  gameLog = signal<{msg: string, type: 'sys' | 'success' | 'err' | 'ai'}[]>([
    { msg: 'Cluster Online. 100 Nodes Detected.', type: 'sys' }
  ]);
  tiles = signal<Tile[]>(this.generateInitialTiles());

  // Board Navigation
  currentPlayer = computed(() => this.players()[this.currentPlayerIndex()]);
  currentTile = computed(() => this.tiles()[this.currentPlayer().position % 100]);
  myControllerPlayer = computed(() => this.joinedPlayerId() !== null ? this.players()[this.joinedPlayerId()!] : null);
  isMyTurn = computed(() => this.joinedPlayerId() === this.currentPlayerIndex());

  // Camera Logic
  boardTransform = computed(() => {
    const p = this.currentPlayer();
    const pos = p.position % 100;
    const row = Math.floor(pos / 10);
    const col = row % 2 === 0 ? (pos % 10) : 9 - (pos % 10);
    
    // Calculate translation to keep player centered
    const tx = (col * -200) + 400;
    const ty = (row * -200) + 200;
    return `rotateX(40deg) translate3d(${tx}px, ${ty}px, 0)`;
  });

  categoryColors = CATEGORY_COLORS;
  Math = Math;

  constructor() {
    effect(() => {
      const cmd = this.session.onCommand();
      if (!cmd) return;
      if (this.appMode() === 'BOARD') this.handleIncomingCommand(cmd);
      if (this.appMode() === 'CONTROLLER' && cmd.type === 'SYNC_STATE') {
        if (cmd.state.sessionCode === this.sessionCode()) this.syncLocalState(cmd.state);
      }
    });
  }

  private generateInitialTiles(): Tile[] {
    const tiles: Tile[] = [];
    const appNames = [
      'Pizzly', 'Fluttr', 'CodeFlow', 'GigaCache', 'Nexus', 'BitBot', 'Z-Cloud', 'Loom', 'Vibe', 'Onyx',
      'Quantum', 'SaaS.io', 'Proto', 'ECHO', 'Nova', 'Flux', 'Aether', 'Mantis', 'Neon', 'Void',
      'Synapse', 'Cortex', 'Drona', 'Glitch', 'Spark', 'Volt', 'Hyper', 'Titan', 'Zen', 'Aura'
    ];

    for (let i = 0; i < 100; i++) {
      if (i === 0) {
        tiles.push({ id: 0, name: 'GENESIS', type: 'Start', requirements: [], revenue: 500, description: 'Seed Funding', icon: '⚡', hype: 0 });
        continue;
      }

      const rand = Math.random();
      if (rand < 0.6) {
        // Project
        const name = appNames[i % appNames.length] + ' ' + (Math.floor(i/10) + 1);
        tiles.push({
          id: i, name, type: 'Project',
          requirements: TECH_SERVICES.slice(0, 3 + Math.floor(i/25)).map(s => ({ service: s, cost: 100 + (i * 2), installed: false })),
          revenue: 200 + (i * 5), description: 'Build this unicorn.', icon: '🚀', hype: i
        });
      } else if (rand < 0.75) {
        // Event / VC
        const isVC = Math.random() > 0.5;
        tiles.push({ 
          id: i, name: isVC ? 'VC SUMMIT' : 'SERVER CRASH', 
          type: isVC ? 'VentureCapital' : 'Event', requirements: [], revenue: 0, 
          description: isVC ? 'Pitch for logic.' : 'Hotfix required.', 
          icon: isVC ? '💼' : '🔥', hype: 0 
        });
      } else if (rand < 0.85) {
        // Data Center
        tiles.push({ id: i, name: 'DATA CENTER', type: 'DataCenter', requirements: [], revenue: 100, description: 'Passive Income', icon: '💾', hype: 0 });
      } else if (rand < 0.95) {
        // Incubator
        tiles.push({ id: i, name: 'INCUBATOR', type: 'Incubator', requirements: [], revenue: 0, description: 'Free Card', icon: '🐣', hype: 0 });
      } else {
        // Coffee
        tiles.push({ id: i, name: 'COFFEE', type: 'Coffee', requirements: [], revenue: 0, description: 'Refactor Break', icon: '☕', hype: 0 });
      }
    }
    return tiles;
  }

  private handleIncomingCommand(cmd: GameCommand) {
    switch (cmd.type) {
      case 'REQUEST_SYNC': this.broadcastState(); break;
      case 'PLAYER_ROLL': if (cmd.playerId === this.currentPlayerIndex()) this.rollDice(); break;
      case 'PLAYER_PURCHASE': if (cmd.playerId === this.currentPlayerIndex()) this.purchaseService(cmd.service); break;
      case 'PLAYER_USE_CARD': if (cmd.playerId === this.currentPlayerIndex()) this.useCard(cmd.cardIndex); break;
      case 'PLAYER_END_TURN': if (cmd.playerId === this.currentPlayerIndex()) this.endTurn(); break;
    }
  }

  private broadcastState() {
    if (this.appMode() !== 'BOARD') return;
    this.session.sendCommand({ type: 'SYNC_STATE', state: {
      sessionCode: this.sessionCode(), players: this.players(), tiles: this.tiles(),
      currentPlayerIndex: this.currentPlayerIndex(), turnPhase: this.turnPhase(), gameLog: this.gameLog()
    }});
  }

  private syncLocalState(state: GameState) {
    this.players.set(state.players);
    this.tiles.set(state.tiles);
    this.currentPlayerIndex.set(state.currentPlayerIndex);
    this.turnPhase.set(state.turnPhase);
    this.gameLog.set(state.gameLog);
  }

  // Action Triggers
  triggerRoll() { this.session.sendCommand({ type: 'PLAYER_ROLL', playerId: this.joinedPlayerId()! }); }
  triggerPurchase(s: TechService) { this.session.sendCommand({ type: 'PLAYER_PURCHASE', playerId: this.joinedPlayerId()!, service: s }); }
  triggerUseCard(i: number) { this.session.sendCommand({ type: 'PLAYER_USE_CARD', playerId: this.joinedPlayerId()!, cardIndex: i }); }
  triggerEndTurn() { this.session.sendCommand({ type: 'PLAYER_END_TURN', playerId: this.joinedPlayerId()! }); }

  async rollDice() {
    if (this.turnPhase() !== 'ROLL' || this.isRolling()) return;
    this.isRolling.set(true);
    await new Promise(r => setTimeout(r, 800));
    const roll = Math.floor(Math.random() * 6) + 1;
    this.movePlayer(this.currentPlayerIndex(), roll);
    this.isRolling.set(false);
    this.turnPhase.set('ACTION');
    await this.handleTileLanding();
    this.broadcastState();
  }

  movePlayer(idx: number, steps: number) {
    this.players.update(ps => {
      const p = ps[idx];
      const oldLap = Math.floor(p.position / 100);
      p.position += steps;
      if (Math.floor(p.position / 100) > oldLap) {
        p.balance += 1000;
        this.addToLog(`${p.name} completed the century circuit! +$1000`, 'success');
      }
      // Data Center Passive Income
      const centers = this.tiles().filter(t => t.type === 'DataCenter' && t.ownerId === idx).length;
      if (centers > 0) p.balance += centers * 100;
      return [...ps];
    });
  }

  async useCard(cardIdx: number) {
    const p = this.currentPlayer();
    const card = p.cards[cardIdx];
    this.addToLog(`EXE: ${card.code}`, 'sys');

    if (card.type === 'MOVE') this.movePlayer(this.currentPlayerIndex(), card.value);
    if (card.type === 'LOOP') this.turnPhase.set('ROLL');
    if (card.type === 'BOOST') {
        this.players.update(ps => { ps[this.currentPlayerIndex()].balance = Math.floor(ps[this.currentPlayerIndex()].balance * card.value); return [...ps]; });
    }
    if (card.type === 'PROTECT') {
        this.players.update(ps => { ps[this.currentPlayerIndex()].isProtected = true; return [...ps]; });
    }

    this.players.update(ps => { ps[this.currentPlayerIndex()].cards.splice(cardIdx, 1); return [...ps]; });
    this.broadcastState();
  }

  purchaseService(s: TechService) {
    const tile = this.currentTile();
    const p = this.currentPlayer();
    const req = tile.requirements?.find(r => r.service === s);
    if (!req || req.installed || p.balance < req.cost) return;

    this.tiles.update(ts => {
      const t = ts[tile.id];
      const rIdx = t.requirements.findIndex(r => r.service === s);
      t.requirements[rIdx].installed = true;
      if (t.requirements.every(r => r.installed)) t.ownerId = p.id;
      return [...ts];
    });

    this.players.update(ps => { ps[this.currentPlayerIndex()].balance -= req.cost; return [...ps]; });
    this.broadcastState();
  }

  async handleTileLanding() {
    const tile = this.currentTile();
    const p = this.currentPlayer();

    if (tile.type === 'Event') {
      if (p.isProtected) {
        this.addToLog(`Security Shield blocked the event!`, 'success');
        this.players.update(ps => { ps[this.currentPlayerIndex()].isProtected = false; return [...ps]; });
      } else {
        const event = await this.aiAdvisor.generateGameEvent(tile.name);
        this.addToLog(`BUG: ${event.title}`, 'ai');
        this.players.update(ps => { ps[this.currentPlayerIndex()].balance += event.impact; return [...ps]; });
      }
    } else if (tile.type === 'Incubator' || tile.type === 'VentureCapital') {
        this.players.update(ps => {
            ps[this.currentPlayerIndex()].cards.push(LOGIC_CARDS_DECK[Math.floor(Math.random() * LOGIC_CARDS_DECK.length)]);
            return [...ps];
        });
    } else if (tile.type === 'DataCenter' && tile.ownerId === undefined) {
        // Option to buy data center for passive income
        if (p.balance >= 500) {
            this.tiles.update(ts => { ts[tile.id].ownerId = p.id; return [...ts]; });
            this.players.update(ps => { ps[this.currentPlayerIndex()].balance -= 500; return [...ps]; });
            this.addToLog(`Bought Data Center! +$100/turn`, 'success');
        }
    }
  }

  endTurn() {
    this.currentPlayerIndex.update(idx => (idx + 1) % this.players().length);
    this.turnPhase.set('ROLL');
    this.broadcastState();
  }

  addToLog(msg: string, type: 'sys' | 'success' | 'err' | 'ai') {
    this.gameLog.update(log => [{msg, type}, ...log].slice(0, 8));
  }

  hostNewBoard() { this.sessionCode.set(Math.floor(1000 + Math.random() * 9000).toString()); this.appMode.set('BOARD'); }
  validateSessionCode() { if (this.enteredCode().length === 4) { this.sessionCode.set(this.enteredCode().toUpperCase()); this.appMode.set('SELECT_PLAYER'); this.session.requestInitialSync(); } }
  selectControllerPlayer(id: number) { this.joinedPlayerId.set(id); this.appMode.set('CONTROLLER'); this.session.requestInitialSync(); }
  resetToLobby() { this.appMode.set('LOBBY'); this.joinedPlayerId.set(null); }

  getSerpentinePosition(index: number) {
    const row = Math.floor(index / 10);
    const col = row % 2 === 0 ? (index % 10) : 9 - (index % 10);
    return { row, col };
  }
}
