import { describe, test, expect, beforeEach } from 'vitest';
import { PrsiEngine } from '../PrsiEngine';
import type { Card, Suit } from '@hry/shared';

function card(suit: Suit, rank: Card['rank']): Card {
  return { suit, rank };
}

describe('PrsiEngine', () => {
  let engine: PrsiEngine;

  // === Game Creation & Setup ===

  describe('createGame', () => {
    test('creates a game with 2 players', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const state = engine.getState();
      expect(state.phase).toBe('playing');
      expect(state.players).toHaveLength(2);
      expect(state.currentPlayerId).toBeTruthy();
      expect(state.topCard).not.toBeNull();
      expect(state.drawPileCount).toBeGreaterThan(0);
    });

    test('creates a game with 4 players', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.addPlayer('p3', 'Charlie');
      engine.addPlayer('p4', 'Dana');
      engine.startGame();

      const state = engine.getState();
      expect(state.players).toHaveLength(4);
    });

    test('deals 4 cards to each player', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const view1 = engine.getPlayerView('p1');
      const view2 = engine.getPlayerView('p2');
      expect(view1.hand).toHaveLength(4);
      expect(view2.hand).toHaveLength(4);
    });

    test('top card is not a special card', () => {
      // Start many games — top card should never be 7, eso, or svrsek
      for (let i = 0; i < 50; i++) {
        const e = new PrsiEngine('classic');
        e.addPlayer('p1', 'A');
        e.addPlayer('p2', 'B');
        e.startGame();
        const top = e.getState().topCard!;
        expect(['7', 'eso', 'svrsek']).not.toContain(top.rank);
      }
    });
  });

  // === Player View ===

  describe('getPlayerView', () => {
    beforeEach(() => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();
    });

    test('shows own hand', () => {
      const view = engine.getPlayerView('p1');
      const self = view.players.find(p => p.id === 'p1')!;
      expect(self.hand).toBeDefined();
      expect(self.hand!.length).toBeGreaterThan(0);
    });

    test('hides other players hands', () => {
      const view = engine.getPlayerView('p1');
      const other = view.players.find(p => p.id === 'p2')!;
      expect(other.hand).toBeUndefined();
    });

    test('shows card count for all players', () => {
      const view = engine.getPlayerView('p1');
      for (const p of view.players) {
        expect(p.cardCount).toBe(4);
      }
    });
  });

  // === Valid Moves ===

  describe('playCard - valid moves', () => {
    test('can play card matching top card suit', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      const topCard = engine.getState().topCard!;
      const view = engine.getPlayerView(currentId);
      const matchingSuit = view.hand!.find(c => c.suit === topCard.suit && c.rank !== 'svrsek');

      if (matchingSuit) {
        const result = engine.playCard(currentId, matchingSuit);
        expect(result.success).toBe(true);
      }
    });

    test('can play card matching top card rank', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      const topCard = engine.getState().topCard!;
      const view = engine.getPlayerView(currentId);
      const matchingRank = view.hand!.find(c => c.rank === topCard.rank && c.suit !== topCard.suit);

      if (matchingRank) {
        const result = engine.playCard(currentId, matchingRank);
        expect(result.success).toBe(true);
      }
    });

    test('svrsek can be played on anything', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      const view = engine.getPlayerView(currentId);
      const svrsek = view.hand!.find(c => c.rank === 'svrsek');

      if (svrsek) {
        const result = engine.playCard(currentId, svrsek, 'cerveny');
        expect(result.success).toBe(true);
      }
    });
  });

  // === Invalid Moves ===

  describe('playCard - invalid moves', () => {
    test('rejects card not matching suit or rank', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      const topCard = engine.getState().topCard!;
      const view = engine.getPlayerView(currentId);
      const nonMatching = view.hand!.find(
        c => c.suit !== topCard.suit && c.rank !== topCard.rank && c.rank !== 'svrsek'
      );

      if (nonMatching) {
        const result = engine.playCard(currentId, nonMatching);
        expect(result.success).toBe(false);
      }
    });

    test('rejects play from non-current player', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      const otherId = currentId === 'p1' ? 'p2' : 'p1';
      const view = engine.getPlayerView(otherId);

      const result = engine.playCard(otherId, view.hand![0]);
      expect(result.success).toBe(false);
    });

    test('rejects card not in player hand', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      const fakeCard = card('cerveny', 'kral');
      const view = engine.getPlayerView(currentId);
      const hasCard = view.hand!.some(c => c.suit === fakeCard.suit && c.rank === fakeCard.rank);

      if (!hasCard) {
        const result = engine.playCard(currentId, fakeCard);
        expect(result.success).toBe(false);
      }
    });

    test('svrsek requires suit override', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      const view = engine.getPlayerView(currentId);
      const svrsek = view.hand!.find(c => c.rank === 'svrsek');

      if (svrsek) {
        const result = engine.playCard(currentId, svrsek); // no suit override
        expect(result.success).toBe(false);
      }
    });
  });

  // === Special Cards ===

  describe('special card: 7 (draw 2)', () => {
    test('playing 7 forces next player to draw 2 in classic', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      // Force a 7 into current player's hand and matching top card
      engine['_forceTopCard'](card('cerveny', '8'));
      const currentId = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](currentId, [card('cerveny', '7')]);

      engine.playCard(currentId, card('cerveny', '7'));

      // In classic mode, next player must draw (no stacking)
      const state = engine.getState();
      expect(state.pendingDrawCount).toBe(2);
    });
  });

  describe('special card: 7 stacking', () => {
    test('playing 7 on 7 stacks draw count (stacking variant)', () => {
      engine = new PrsiEngine('stacking');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      // P1 plays a 7
      const p1 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p1, [card('cerveny', '7'), card('zeleny', '9')]);
      engine.playCard(p1, card('cerveny', '7'));

      // P2 can stack a 7
      const p2 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p2, [card('cerveny', '7'), card('zeleny', '10')]);
      engine.playCard(p2, card('cerveny', '7'));

      expect(engine.getState().pendingDrawCount).toBe(4);
    });

    test('playing 7 on 7 stacks draw count (classic variant)', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      // P1 plays a 7
      const p1 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p1, [card('cerveny', '7'), card('zeleny', '9')]);
      engine.playCard(p1, card('cerveny', '7'));

      // P2 should be able to stack a 7 even in classic mode
      const p2 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p2, [card('zeleny', '7'), card('kule', '10')]);
      const result = engine.playCard(p2, card('zeleny', '7'));

      expect(result.success).toBe(true);
      expect(engine.getState().pendingDrawCount).toBe(4);
    });

    test('three 7s stacked results in draw 6', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.addPlayer('p3', 'Charlie');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      // P1 plays a 7
      const p1 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p1, [card('cerveny', '7'), card('zeleny', '9')]);
      engine.playCard(p1, card('cerveny', '7'));

      // P2 stacks a 7
      const p2 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p2, [card('zeleny', '7'), card('kule', '10')]);
      engine.playCard(p2, card('zeleny', '7'));

      // P3 stacks a 7
      const p3 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p3, [card('kule', '7'), card('zaludy', '10')]);
      engine.playCard(p3, card('kule', '7'));

      expect(engine.getState().pendingDrawCount).toBe(6);
    });

    test('player without 7 must draw accumulated penalty', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      // P1 plays a 7
      const p1 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p1, [card('cerveny', '7'), card('zeleny', '9')]);
      engine.playCard(p1, card('cerveny', '7'));

      // P2 has no 7, must draw 2
      const p2 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p2, [card('kule', '10')]);
      const handBefore = engine.getPlayerView(p2).hand!.length;
      engine.drawCard(p2);
      const handAfter = engine.getPlayerView(p2).hand!.length;

      expect(handAfter - handBefore).toBe(2);
      expect(engine.getState().pendingDrawCount).toBe(0);
    });

    test('non-7 card cannot be played when draw pending', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      // P1 plays a 7
      const p1 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p1, [card('cerveny', '7'), card('zeleny', '9')]);
      engine.playCard(p1, card('cerveny', '7'));

      // P2 tries to play a non-7 card
      const p2 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p2, [card('cerveny', '9'), card('kule', '10')]);
      const result = engine.playCard(p2, card('cerveny', '9'));

      expect(result.success).toBe(false);
    });

    test('drawing when 7 pending draws correct number of cards', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      const p1 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p1, [card('cerveny', '7'), card('zeleny', '9')]);
      engine.playCard(p1, card('cerveny', '7'));

      // Next player draws
      const p2 = engine.getState().currentPlayerId!;
      const handBefore = engine.getPlayerView(p2).hand!.length;
      engine.drawCard(p2);
      const handAfter = engine.getPlayerView(p2).hand!.length;

      expect(handAfter - handBefore).toBe(2);
      expect(engine.getState().pendingDrawCount).toBe(0);
    });
  });

  describe('special card: Eso (skip next)', () => {
    test('playing Eso skips next player', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.addPlayer('p3', 'Charlie');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      const currentId = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](currentId, [card('cerveny', 'eso'), card('zeleny', '9')]);
      engine.playCard(currentId, card('cerveny', 'eso'));

      // Should skip one player
      const state = engine.getState();
      const players = state.players.map(p => p.id);
      const currentIdx = players.indexOf(currentId);
      const expectedNextIdx = (currentIdx + 2) % players.length;
      expect(state.currentPlayerId).toBe(players[expectedNextIdx]);
    });

    test('eso skips in 2-player game (back to same player)', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      const currentId = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](currentId, [card('cerveny', 'eso'), card('zeleny', '9')]);
      engine.playCard(currentId, card('cerveny', 'eso'));

      // In 2-player, skip means it comes back to same player
      expect(engine.getState().currentPlayerId).toBe(currentId);
    });
  });

  describe('special card: Svršek (change suit)', () => {
    test('playing svrsek changes active suit', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      const currentId = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](currentId, [card('zeleny', 'svrsek'), card('kule', '9')]);
      engine.playCard(currentId, card('zeleny', 'svrsek'), 'zaludy');

      expect(engine.getState().suitOverride).toBe('zaludy');
    });

    test('next player must follow overridden suit', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      const p1 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p1, [card('zeleny', 'svrsek'), card('kule', '9')]);
      engine.playCard(p1, card('zeleny', 'svrsek'), 'zaludy');

      const p2 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p2, [card('cerveny', '10'), card('zaludy', '9')]);

      // Can't play cerveny 10 (wrong suit, override is zaludy)
      const result1 = engine.playCard(p2, card('cerveny', '10'));
      expect(result1.success).toBe(false);

      // Can play zaludy 9
      const result2 = engine.playCard(p2, card('zaludy', '9'));
      expect(result2.success).toBe(true);
    });

    test('suit override clears after next play', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));

      const p1 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p1, [card('zeleny', 'svrsek'), card('kule', '9')]);
      engine.playCard(p1, card('zeleny', 'svrsek'), 'zaludy');

      expect(engine.getState().suitOverride).toBe('zaludy');

      const p2 = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](p2, [card('zaludy', '9'), card('cerveny', '10')]);
      engine.playCard(p2, card('zaludy', '9'));

      expect(engine.getState().suitOverride).toBeNull();
    });
  });

  // === Drawing ===

  describe('drawCard', () => {
    test('draw adds one card to hand', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      const handBefore = engine.getPlayerView(currentId).hand!.length;
      engine.drawCard(currentId);
      const handAfter = engine.getPlayerView(currentId).hand!.length;

      expect(handAfter).toBe(handBefore + 1);
    });

    test('draw advances turn', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      engine.drawCard(currentId);

      expect(engine.getState().currentPlayerId).not.toBe(currentId);
    });

    test('rejects draw from non-current player', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const currentId = engine.getState().currentPlayerId!;
      const otherId = currentId === 'p1' ? 'p2' : 'p1';

      const result = engine.drawCard(otherId);
      expect(result.success).toBe(false);
    });
  });

  // === Turn Rotation ===

  describe('turn rotation', () => {
    test('turns alternate between players', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      const first = engine.getState().currentPlayerId!;
      engine.drawCard(first);

      const second = engine.getState().currentPlayerId!;
      expect(second).not.toBe(first);

      engine.drawCard(second);
      expect(engine.getState().currentPlayerId).toBe(first);
    });

    test('turns rotate through 3 players in order', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.addPlayer('p3', 'Charlie');
      engine.startGame();

      const order: string[] = [];
      for (let i = 0; i < 6; i++) {
        const current = engine.getState().currentPlayerId!;
        order.push(current);
        engine.drawCard(current);
      }

      // Should cycle: a, b, c, a, b, c
      expect(order[0]).toBe(order[3]);
      expect(order[1]).toBe(order[4]);
      expect(order[2]).toBe(order[5]);
      expect(new Set(order.slice(0, 3)).size).toBe(3);
    });
  });

  // === Win Condition ===

  describe('win condition', () => {
    test('player wins when hand is empty', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));
      const currentId = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](currentId, [card('cerveny', '9')]);

      engine.playCard(currentId, card('cerveny', '9'));

      const state = engine.getState();
      expect(state.phase).toBe('finished');
      expect(state.winnerId).toBe(currentId);
      expect(state.placements[0]).toBe(currentId);
    });

    test('game ends with 2 players when one wins', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      engine['_forceTopCard'](card('cerveny', '8'));
      const currentId = engine.getState().currentPlayerId!;
      engine['_forcePlayerHand'](currentId, [card('cerveny', '9')]);

      engine.playCard(currentId, card('cerveny', '9'));

      expect(engine.getState().phase).toBe('finished');
      expect(engine.getState().placements).toHaveLength(2);
    });
  });

  // === Deck Reshuffling ===

  describe('deck reshuffling', () => {
    test('reshuffles discard pile when draw pile is empty', () => {
      engine = new PrsiEngine('classic');
      engine.addPlayer('p1', 'Alice');
      engine.addPlayer('p2', 'Bob');
      engine.startGame();

      // Draw many cards to deplete the draw pile
      let safety = 0;
      while (engine.getState().drawPileCount > 0 && safety < 100) {
        const current = engine.getState().currentPlayerId!;
        engine.drawCard(current);
        safety++;
      }

      // Should still be able to draw after reshuffle
      const current = engine.getState().currentPlayerId!;
      const result = engine.drawCard(current);
      // After reshuffle, draw pile should have been replenished
      expect(result.success).toBe(true);
    });
  });
});
