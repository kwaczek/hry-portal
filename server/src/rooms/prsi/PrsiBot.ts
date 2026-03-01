import type { Card, Suit, PrsiAction, PrsiGameState } from '@hry/shared';
import { SUITS } from '@hry/shared';

/**
 * Simple Prší bot AI.
 *
 * Strategy priority:
 * 1. If can play a special card advantageously → play it
 * 2. If can play a matching card → prefer cards that limit next player's options
 * 3. Otherwise → draw
 */
export class PrsiBot {
  chooseAction(state: PrsiGameState, hand: Card[]): PrsiAction {
    const topCard = state.topCard;
    if (!topCard) return { type: 'draw' };

    const activeSuit = state.suitOverride ?? topCard.suit;
    const hasPendingDraw = state.pendingDrawCount > 0;

    // When 7 is pending, try to stack another 7; otherwise draw penalty
    if (hasPendingDraw) {
      const seven = hand.find(c => c.rank === '7');
      if (seven) return { type: 'play', card: seven };
      return { type: 'draw' };
    }

    const playable = hand.filter(c => this.canPlay(c, topCard, activeSuit));

    if (playable.length === 0) return { type: 'draw' };

    // Priority 1: Play special cards advantageously
    const special = this.pickSpecialCard(playable, hand);
    if (special) return special;

    // Priority 2: Play card that limits next player (prefer cards from suits we have many of)
    const best = this.pickBestCard(playable, hand);
    return { type: 'play', card: best };
  }

  private canPlay(card: Card, topCard: Card, activeSuit: Suit): boolean {
    if (card.rank === 'svrsek') return true;
    return card.suit === activeSuit || card.rank === topCard.rank;
  }

  private pickSpecialCard(playable: Card[], hand: Card[]): PrsiAction | null {
    // Play 7 if it hurts the opponent (we have more than 1 card)
    if (hand.length > 1) {
      const seven = playable.find(c => c.rank === '7');
      if (seven) return { type: 'play', card: seven };
    }

    // Play Eso to skip opponent if we have more than 1 card
    if (hand.length > 1) {
      const eso = playable.find(c => c.rank === 'eso');
      if (eso) return { type: 'play', card: eso };
    }

    // Play Svršek to change to a suit we have many of
    const svrsek = playable.find(c => c.rank === 'svrsek');
    if (svrsek && hand.length > 1) {
      const bestSuit = this.getMostCommonSuit(hand.filter(c => c.rank !== 'svrsek'));
      return { type: 'play', card: svrsek, suitOverride: bestSuit };
    }

    return null;
  }

  private pickBestCard(playable: Card[], hand: Card[]): Card {
    // Prefer non-special cards first (save specials for later)
    const nonSpecial = playable.filter(
      c => c.rank !== '7' && c.rank !== 'eso' && c.rank !== 'svrsek'
    );
    const candidates = nonSpecial.length > 0 ? nonSpecial : playable;

    // Prefer cards from suits where we have the most cards
    // (keeps options open for future turns)
    const suitCounts = new Map<Suit, number>();
    for (const c of hand) {
      suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
    }

    candidates.sort((a, b) => {
      const countA = suitCounts.get(a.suit) ?? 0;
      const countB = suitCounts.get(b.suit) ?? 0;
      return countB - countA; // prefer suit with more cards
    });

    return candidates[0];
  }

  private getMostCommonSuit(hand: Card[]): Suit {
    const counts = new Map<Suit, number>();
    for (const c of hand) {
      counts.set(c.suit, (counts.get(c.suit) ?? 0) + 1);
    }

    let bestSuit: Suit = SUITS[0];
    let bestCount = 0;
    for (const [suit, count] of counts) {
      if (count > bestCount) {
        bestSuit = suit;
        bestCount = count;
      }
    }

    return bestSuit;
  }
}
