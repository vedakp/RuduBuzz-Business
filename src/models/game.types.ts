
export type TechService = 'Frontend' | 'Backend' | 'Database' | 'Storage' | 'UI/UX' | 'AI' | 'Security' | 'DevOps';
export type CardCategory = 'Motion' | 'Control' | 'Logic' | 'Event' | 'Utility';

export interface ProjectRequirement {
  service: TechService;
  cost: number;
  installed: boolean;
}

export interface LogicCard {
  id: string;
  name: string;
  code: string;
  description: string;
  category: CardCategory;
  value: number;
  type: 'MOVE' | 'LOOP' | 'IF_STMT' | 'SABOTAGE' | 'BOOST' | 'PROTECT' | 'STEAL';
}

export interface Tile {
  id: number;
  name: string;
  type: 'Project' | 'Event' | 'Start' | 'VentureCapital' | 'DataCenter' | 'Coffee' | 'Incubator';
  requirements: ProjectRequirement[];
  ownerId?: number;
  revenue: number;
  description: string;
  icon: string;
  hype: number;
  isUnicorn?: boolean;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  position: number;
  balance: number;
  streetCred: number;
  avatar: string;
  cards: LogicCard[];
  mood: 'happy' | 'neutral' | 'worried' | 'cool' | 'evil';
  isProtected?: boolean;
}

export interface GameState {
  sessionCode: string;
  players: Player[];
  tiles: Tile[];
  currentPlayerIndex: number;
  turnPhase: 'ROLL' | 'ACTION' | 'END';
  gameLog: {msg: string, type: 'sys' | 'success' | 'err' | 'ai'}[];
}

export type GameCommand = 
  | { type: 'SYNC_STATE', state: GameState }
  | { type: 'REQUEST_SYNC' }
  | { type: 'PLAYER_ROLL', playerId: number }
  | { type: 'PLAYER_PURCHASE', playerId: number, service: TechService }
  | { type: 'PLAYER_USE_CARD', playerId: number, cardIndex: number }
  | { type: 'PLAYER_END_TURN', playerId: number };

export const TECH_SERVICES: TechService[] = ['Frontend', 'Backend', 'Database', 'Storage', 'UI/UX', 'AI', 'Security', 'DevOps'];

export const CATEGORY_COLORS: Record<CardCategory, string> = {
  'Motion': 'bg-[#4C97FF]',
  'Control': 'bg-[#FFAB19]',
  'Logic': 'bg-[#5CB1D6]',
  'Event': 'bg-[#FF6680]',
  'Utility': 'bg-[#9966FF]'
};

export const LOGIC_CARDS_DECK: LogicCard[] = [
  { id: 'c1', name: 'Move(3)', code: 'move(3)', description: 'Step forward 3 spaces.', category: 'Motion', value: 3, type: 'MOVE' },
  { id: 'c2', name: 'Repeat(2x)', code: 'repeat(2) { roll() }', description: 'Take two turns in a row.', category: 'Control', value: 2, type: 'LOOP' },
  { id: 'c3', name: 'If (Rich)', code: 'if (balance > 1000)', description: 'If balance > $1k, gain $200.', category: 'Logic', value: 200, type: 'IF_STMT' },
  { id: 'c4', name: 'Bug Strike', code: 'sabotage(rival)', description: 'Destroy a rival service.', category: 'Event', value: 0, type: 'SABOTAGE' },
  { id: 'c5', name: 'Refactor', code: 'optimize(current)', description: 'Buy next service for 50% off.', category: 'Control', value: 0.5, type: 'BOOST' },
  { id: 'c6', name: 'Jump(8)', code: 'jump(8)', description: 'Fast travel forward.', category: 'Motion', value: 8, type: 'MOVE' },
  { id: 'c7', name: 'Try-Catch', code: 'try { protect() }', description: 'Blocks the next negative event.', category: 'Utility', value: 0, type: 'PROTECT' },
  { id: 'c8', name: 'Git Pull', code: 'steal(card)', description: 'Take a random card from a rival.', category: 'Event', value: 0, type: 'STEAL' },
  { id: 'c9', name: 'Scale Up', code: 'balance *= 1.2', description: '20% interest on current funds.', category: 'Logic', value: 1.2, type: 'BOOST' }
];
