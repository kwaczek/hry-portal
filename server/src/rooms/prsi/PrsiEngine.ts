import type { Card, Suit, Rank, GamePhase, PrsiGameState, PrsiPlayer, PrsiRuleVariant } from '@hry/shared';
import { FULL_DECK } from '@hry/shared';

interface InternalPlayer {
  id: string;
  username: string;
  hand: Card[];
  isBot: boolean;
  isGuest: boolean;
  isReady: boolean;
  isConnected: boolean;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

export class PrsiEngine {
  private ruleVariant: PrsiRuleVariant;
  private phase: GamePhase = 'waiting';
  private players: InternalPlayer[] = [];
  private currentPlayerIndex = 0;
  private drawPile: Card[] = [];
  private discardPile: Card[] = [];
  private suitOverride: Suit | null = null;
  private pendingDrawCount = 0;
  private pendingSkipCount = 0;
  private winnerId: string | null = null;
  private placements: string[] = [];

  constructor(ruleVariant: PrsiRuleVariant) {
    this.ruleVariant = ruleVariant;
  }

  addPlayer(id: string, username: string, isBot = false, isGuest = false): void {
    this.players.push({
      id,
      username,
      hand: [],
      isBot,
      isGuest,
      isReady: false,
      isConnected: true,
    });
  }

  startGame(): void {
    this.phase = 'playing';
    this.drawPile = this.shuffleDeck([...FULL_DECK]);
    this.dealCards();
    this.placeInitialCard();
    this.currentPlayerIndex = 0;
  }

  private shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  private dealCards(): void {
    const cardsPerPlayer = 4;
    for (let i = 0; i < cardsPerPlayer; i++) {
      for (const player of this.players) {
        player.hand.push(this.drawPile.pop()!);
      }
    }
  }

  private placeInitialCard(): void {
    // Find a non-special card to start with
    let cardIndex = this.drawPile.findIndex(
      c => c.rank !== '7' && c.rank !== 'eso' && c.rank !== 'svrsek'
    );
    if (cardIndex === -1) {
      // Very unlikely: all remaining are special. Just use the top card.
      cardIndex = this.drawPile.length - 1;
    }
    const [startCard] = this.drawPile.splice(cardIndex, 1);
    this.discardPile.push(startCard);
  }

  private get topCard(): Card | null {
    return this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null;
  }

  private get currentPlayerId(): string | null {
    if (this.phase !== 'playing') return null;
    return this.players[this.currentPlayerIndex].id;
  }

  getState(): PrsiGameState {
    return {
      phase: this.phase,
      roomCode: '',
      players: this.players.map(p => ({
        id: p.id,
        username: p.username,
        displayName: p.username,
        isGuest: p.isGuest,
        isBot: p.isBot,
        isReady: p.isReady,
        isConnected: p.isConnected,
        cardCount: p.hand.length,
      })),
      currentPlayerId: this.currentPlayerId,
      topCard: this.topCard,
      drawPileCount: this.drawPile.length,
      suitOverride: this.suitOverride,
      pendingDrawCount: this.pendingDrawCount,
      pendingSkipCount: this.pendingSkipCount,
      turnTimeRemaining: 30,
      ruleVariant: this.ruleVariant,
      winnerId: this.winnerId,
      placements: this.placements,
    };
  }

  getPlayerView(playerId: string): PrsiGameState & { hand: Card[] } {
    const state = this.getState();
    const player = this.players.find(p => p.id === playerId);
    const hand = player ? [...player.hand] : [];

    // Show own hand, hide others
    state.players = state.players.map(p => {
      if (p.id === playerId) {
        return { ...p, hand };
      }
      return p; // hand stays undefined
    });

    return { ...state, hand };
  }

  playCard(playerId: string, card: Card, suitOverride?: Suit): ActionResult {
    if (this.phase !== 'playing') {
      return { success: false, error: 'Hra neběží' };
    }

    if (playerId !== this.currentPlayerId) {
      return { success: false, error: 'Nejsi na tahu' };
    }

    const player = this.players[this.currentPlayerIndex];
    const cardIndex = player.hand.findIndex(
      c => c.suit === card.suit && c.rank === card.rank
    );

    if (cardIndex === -1) {
      return { success: false, error: 'Nemáš tuto kartu' };
    }

    // Svršek requires suit override
    if (card.rank === 'svrsek' && !suitOverride) {
      return { success: false, error: 'Musíš zvolit barvu' };
    }

    // Validate the move
    if (!this.isValidPlay(card)) {
      return { success: false, error: 'Neplatný tah' };
    }

    // Remove card from hand
    player.hand.splice(cardIndex, 1);

    // Add to discard pile
    this.discardPile.push(card);

    // Handle special card effects
    this.handleSpecialCard(card, suitOverride);

    // Check win condition
    if (player.hand.length === 0) {
      this.placements.push(player.id);
      this.winnerId = player.id;

      // In 2-player game, add the other player to placements and end
      if (this.players.length === 2) {
        const other = this.players.find(p => p.id !== player.id)!;
        this.placements.push(other.id);
        this.phase = 'finished';
        return { success: true };
      }

      // In 3-4 player game, check if only 1 player left
      const remaining = this.players.filter(p => !this.placements.includes(p.id));
      if (remaining.length <= 1) {
        if (remaining.length === 1) {
          this.placements.push(remaining[0].id);
        }
        this.phase = 'finished';
        return { success: true };
      }
    }

    // Advance turn (if game not ended)
    if (this.phase === 'playing') {
      this.advanceTurn(false);
    }

    return { success: true };
  }

  private isValidPlay(card: Card): boolean {
    // When 7 is pending, only a 7 can be played (to stack the penalty)
    // This is standard Czech Prší behavior regardless of variant
    if (this.pendingDrawCount > 0) {
      return card.rank === '7';
    }

    // When Eso skip is pending, only another Eso can be played (to counter/stack)
    if (this.pendingSkipCount > 0) {
      return card.rank === 'eso';
    }

    // Svršek can be played on anything (but not when 7 or Eso is pending)
    if (card.rank === 'svrsek') return true;

    const top = this.topCard!;
    const activeSuit = this.suitOverride ?? top.suit;

    // Match suit or rank
    return card.suit === activeSuit || card.rank === top.rank;
  }

  private handleSpecialCard(card: Card, suitOverride?: Suit): void {
    // Clear suit override when a non-svrsek is played
    if (card.rank !== 'svrsek') {
      this.suitOverride = null;
    }

    switch (card.rank) {
      case '7':
        this.pendingDrawCount += 2;
        break;
      case 'eso':
        // Counter-Eso passes the skip forward (doesn't accumulate)
        this.pendingSkipCount = 1;
        break;
      case 'svrsek':
        this.suitOverride = suitOverride ?? null;
        break;
    }
  }

  private advanceTurn(skip: boolean): void {
    const activePlayers = this.players.filter(p => !this.placements.includes(p.id));
    const currentActiveIdx = activePlayers.findIndex(p => p.id === this.currentPlayerId);
    const step = skip ? 2 : 1;
    const nextActiveIdx = (currentActiveIdx + step) % activePlayers.length;
    const nextPlayer = activePlayers[nextActiveIdx];
    this.currentPlayerIndex = this.players.findIndex(p => p.id === nextPlayer.id);
  }

  drawCard(playerId: string): ActionResult {
    if (this.phase !== 'playing') {
      return { success: false, error: 'Hra neběží' };
    }

    if (playerId !== this.currentPlayerId) {
      return { success: false, error: 'Nejsi na tahu' };
    }

    const player = this.players[this.currentPlayerIndex];
    const count = this.pendingDrawCount > 0 ? this.pendingDrawCount : 1;

    for (let i = 0; i < count; i++) {
      this.ensureDrawPile();
      if (this.drawPile.length > 0) {
        player.hand.push(this.drawPile.pop()!);
      }
    }

    this.pendingDrawCount = 0;
    this.pendingSkipCount = 0;
    this.advanceTurn(false);

    return { success: true };
  }

  private ensureDrawPile(): void {
    if (this.drawPile.length > 0) return;

    // Keep the top card, reshuffle the rest of the discard pile
    const topCard = this.discardPile.pop()!;
    this.drawPile = this.shuffleDeck(this.discardPile);
    this.discardPile = [topCard];
  }

  // === Test helpers (prefixed with _ to indicate internal use) ===

  /** @internal - for testing only */
  _forceTopCard(card: Card): void {
    this.discardPile.push(card);
    this.suitOverride = null;
    this.pendingDrawCount = 0;
  }

  /** @internal - for testing only */
  _forcePlayerHand(playerId: string, hand: Card[]): void {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.hand = [...hand];
    }
  }
}
