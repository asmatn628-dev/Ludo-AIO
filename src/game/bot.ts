import { Player, Token, TokenState } from './constants';
import { isValidMove } from './store';
import { LudoState } from './store';

export function getBestMove(state: LudoState, player: Player): number | null {
  const roll = state.diceValues[0];
  if (!roll) return null;
  const validTokens = player.tokens.filter(t => isValidMove(t, roll, state.gameMode, player));


  
  if (validTokens.length === 0) return null;
  if (validTokens.length === 1) return validTokens[0].id;

  const difficulty = player.botDifficulty || 'medium';

  if (difficulty === 'easy') {
    // Random move
    return validTokens[Math.floor(Math.random() * validTokens.length)].id;
  }

  // Evaluate each valid token's potential board state
  let bestScore = -Infinity;
  let bestTokenId = validTokens[0].id;

  for (const token of validTokens) {
    const score = evaluateMove(state, player, token, roll, difficulty);
    if (score > bestScore) {
      bestScore = score;
      bestTokenId = token.id;
    }
  }

  return bestTokenId;
}

function evaluateMove(state: LudoState, player: Player, token: Token, roll: number, difficulty: 'medium'|'hard'): number {
  let score = 0;
  
  // Calculate destination
  // Simple heuristic without full simulation:
  
  if (token.state === TokenState.BASE) {
    score += 50; // Getting a token out of base is generally very good
  } else if (token.state === TokenState.ACTIVE) {
    // Encourage moving forward
    score += 10;
    
    // Check if move results in a kill
    // We would need to calculate raw coordinate and check intersections.
    // For now, let's just make 'hard' prioritize not moving tokens that are in safe spots unless necessary
    // and moving tokens that are closer to home.
    score += token.position * 0.5; // push forward
  } else if (token.state === TokenState.HOME_PATH) {
    score += 20; // moving in home path is good
  }

  // If hard, prioritize moving home
  if (difficulty === 'hard') {
    if (token.state === TokenState.ACTIVE && token.position + roll > 50) { // arbitrary math
      score += 30; // close to home path
    }
  }

  return score;
}
