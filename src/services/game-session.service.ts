
import { Injectable, signal } from '@angular/core';
import { GameState, GameCommand } from '../models/game.types';

@Injectable({ providedIn: 'root' })
export class GameSessionService {
  private channel = new BroadcastChannel('code-tycoon-network');
  
  // Observable-like command stream
  onCommand = signal<GameCommand | null>(null);

  constructor() {
    this.channel.onmessage = (event) => {
      this.onCommand.set(event.data);
    };
  }

  sendCommand(command: GameCommand) {
    this.channel.postMessage(command);
  }

  // Helper to ensure state is fresh when a new controller joins
  requestInitialSync() {
    this.sendCommand({ type: 'REQUEST_SYNC' });
  }
}
