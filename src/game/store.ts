import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Player, PlayerColor, Token, TokenState, GameState, GameMode, BASE_COLORS, STAR_POSITIONS } from "./constants";
import { playSound } from "./sounds";

export interface SavedGame {
  name: string;
  date: string;
  state: Partial<LudoState>;
}

export interface LudoState {
  gameState: GameState;
  gameMode: GameMode;
  isTeamMode: boolean;
  players: Player[];
  turnIndex: number;
  diceValues: number[];
  diceValue: number | null;
  hasRolled: boolean;
  roomId: string | null;
  winner: PlayerColor | null;
  isMoving: boolean;
  isRolling: boolean;
  savedGames: SavedGame[];

  // Actions
  setGameState: (state: GameState) => void;
  setGameMode: (mode: GameMode) => void;
  setIsTeamMode: (isTeam: boolean) => void;
  initializeGame: (playerConfigs: {color: PlayerColor; isBot: boolean; name: string; botDifficulty: 'easy'|'medium'|'hard'}[]) => void;
  rollDice: (val?: number) => void;
  moveToken: (playerColor: PlayerColor, tokenId: number, diceIdx?: number) => Promise<void>;
  nextTurn: () => void;
  joinRoom: (roomId: string) => void;
  checkAutoMove: () => void;
  
  // Custom Saves
  saveGame: (name: string) => void;
  loadGame: (name: string) => void;
  deleteGame: (name: string) => void;
}

const createInitialTokens = (color: PlayerColor): Token[] => {
  return Array.from({ length: 4 }).map((_, i) => ({
    id: i,
    color,
    state: TokenState.BASE,
    position: -1,
  }));
};

export const useGameStore = create<LudoState>()(
  persist(
    (set, get) => ({
      gameState: "menu",
      gameMode: "classic",
      isTeamMode: false,
      players: [],
      turnIndex: 0,
      diceValues: [],
      diceValue: null,
      hasRolled: false,
      roomId: null,
      winner: null,
      isMoving: false,
      isRolling: false,
      savedGames: [],

      setGameState: (state) => set({ gameState: state }),
      setGameMode: (mode) => set({ gameMode: mode }),
      setIsTeamMode: (isTeam) => set({ isTeamMode: isTeam }),
      
      initializeGame: (playerConfigs) => {
        const players: Player[] = BASE_COLORS.map(color => {
          const config = playerConfigs.find(c => c.color === color);
          return {
            color: color as PlayerColor,
            isBot: config ? config.isBot : false,
            isActive: !!config,
            name: config ? config.name : color,
            botDifficulty: config ? config.botDifficulty : 'medium',
            hasKilled: false,
            tokens: createInitialTokens(color as PlayerColor)
          };
        });

        const firstActiveIndex = players.findIndex(p => p.isActive);

        set({
          gameState: "playing",
          players,
          turnIndex: firstActiveIndex !== -1 ? firstActiveIndex : 0,
          diceValues: [],
          diceValue: null,
          hasRolled: false,
          winner: null,
          isRolling: false,
        });
        playSound('match');
      },

      rollDice: (val) => {
        const { hasRolled, players, turnIndex, isMoving, diceValues, isRolling } = get();
        if (hasRolled || isMoving || isRolling) return;

        set({ isRolling: true });
        playSound('roll');

        setTimeout(() => {
          const roll = val || Math.floor(Math.random() * 6) + 1;
          const newDiceValues = [...diceValues, roll];
          
          if (newDiceValues.length === 3 && newDiceValues.every(v => v === 6)) {
             set({ diceValues: [], diceValue: 6, hasRolled: true, isRolling: false });
             setTimeout(() => {
                get().nextTurn();
             }, 1000);
             return;
          }

          if (roll === 6) {
             set({ diceValues: newDiceValues, diceValue: roll, hasRolled: false, isRolling: false });
             playSound('turn');
          } else {
             set({ diceValues: newDiceValues, diceValue: roll, hasRolled: true, isRolling: false });
             get().checkAutoMove();
          }
        }, 400);
      },

      checkAutoMove: () => {
        const state = get();
        if (!state.hasRolled || state.diceValues.length === 0 || state.isMoving) return;

        const currPlayer = state.players[state.turnIndex];
        if (!currPlayer.isActive) return;

        const currRoll = state.diceValues[0];
        const validTokens = currPlayer.tokens.filter(t => isValidMove(t, currRoll, state.gameMode, currPlayer));

        if (validTokens.length === 0) {
           const newValues = state.diceValues.slice(1);
           if (newValues.length === 0) {
              setTimeout(() => {
                 get().nextTurn();
              }, 800);
           } else {
              set({ diceValues: newValues });
              setTimeout(() => {
                 get().checkAutoMove();
              }, 300);
           }
        } else if (validTokens.length === 1 && !currPlayer.isBot) {
           setTimeout(() => {
              if (get().turnIndex === state.turnIndex && !get().isMoving) {
                 get().moveToken(currPlayer.color, validTokens[0].id, 0);
              }
           }, 400); 
        }
      },

      moveToken: async (playerColor, tokenId, diceIdx = 0) => {
        const state = get();
        const { players, diceValues, hasRolled, turnIndex, gameMode, isMoving, isTeamMode } = state;
        if (!hasRolled || diceValues.length === 0 || isMoving) return;

        const currPlayer = players[turnIndex];
        if (currPlayer.color !== playerColor) return;

        const token = currPlayer.tokens.find(t => t.id === tokenId);
        if (!token) return;

        const moveValue = diceValues[diceIdx];
        if (!moveValue) return;

        if (!isValidMove(token, moveValue, gameMode, currPlayer)) return;
        
        set({ isMoving: true });

        const newDiceValues = [...diceValues];
        newDiceValues.splice(diceIdx, 1);
        set({ diceValues: newDiceValues });

        const steps = token.state === TokenState.BASE ? 1 : moveValue;

        let currentTokenState = token.state;
        let currentTokenPos = token.position;

        for(let i=0; i<steps; i++) {
            const next = calculateSingleStep({ ...token, state: currentTokenState, position: currentTokenPos });
            currentTokenState = next.newState;
            currentTokenPos = next.newPosition;

            const tempPlayers = [...get().players];
            const pIdx = tempPlayers.findIndex(p => p.color === playerColor);
            tempPlayers[pIdx].tokens = tempPlayers[pIdx].tokens.map(t => 
              t.id === tokenId ? { ...t, state: currentTokenState, position: currentTokenPos } : t
            );
            set({ players: tempPlayers });

            playSound('move');
            await new Promise(r => setTimeout(r, 200));
        }

        let killed = false;
        let finalPlayers = [...get().players];
        const finalPlayerIdx = finalPlayers.findIndex(p => p.color === playerColor);

        let landedOnSafe = false;
        const isSafePosition = (pos: number) => STAR_POSITIONS.includes(pos) || [0, 13, 26, 39].includes(pos);

        if (currentTokenState === TokenState.ACTIVE) {
          if (isSafePosition(currentTokenPos)) {
             landedOnSafe = true;
          }
          finalPlayers.forEach((p, pIdx) => {
            if (p.color !== playerColor) {
              let isTeammate = false;
              if (isTeamMode) {
                 const team1 = ['red', 'yellow'];
                 const team2 = ['green', 'blue'];
                 if (team1.includes(playerColor) && team1.includes(p.color)) isTeammate = true;
                 if (team2.includes(playerColor) && team2.includes(p.color)) isTeammate = true;
              }

              if (!isTeammate) {
                p.tokens.forEach((otherToken, oIdx) => {
                  if (otherToken.state === TokenState.ACTIVE && otherToken.position === currentTokenPos) {
                    if (!isSafePosition(currentTokenPos)) {
                       finalPlayers[pIdx].tokens[oIdx] = {
                         ...otherToken,
                         state: TokenState.BASE,
                         position: -1
                       };
                       killed = true;
                    }
                  }
                });
              }
            }
          });
        }

        if (killed) {
           finalPlayers[finalPlayerIdx].hasKilled = true;
           playSound('kill');
        } else if (landedOnSafe) {
           playSound('safe');
        }

        finalPlayers = [...get().players];

        const winTokensNeeded = (gameMode === "quick" || gameMode === "blitz") ? 1 : 4;
        const homeTokens = finalPlayers[finalPlayerIdx].tokens.filter(t => t.state === TokenState.HOME).length;
        let winner = get().winner;
        if (homeTokens >= winTokensNeeded) {
           if (isTeamMode) {
              const teammates = finalPlayers.filter(p => {
                 const team1 = ['red', 'yellow'];
                 const team2 = ['green', 'blue'];
                 return (team1.includes(playerColor) && team1.includes(p.color)) || 
                        (team2.includes(playerColor) && team2.includes(p.color));
              });
              const bothFinished = teammates.every(p => p.tokens.filter(t => t.state === TokenState.HOME).length >= winTokensNeeded);
              if (bothFinished) {
                 winner = playerColor;
                 playSound('win');
              }
           } else {
              winner = playerColor;
              playSound('win');
           }
        }

        set({ players: finalPlayers, winner, isMoving: false });
        
        if (winner) {
          set({ gameState: "finished" });
          return;
        }

        if (killed || currentTokenState === TokenState.HOME) {
           if (get().diceValues.length === 0) {
               set({ hasRolled: false, diceValue: null });
               playSound('turn');
               return;
           }
        }

        setTimeout(() => {
           if (get().diceValues.length > 0) {
               get().checkAutoMove();
           } else {
               if (killed || currentTokenState === TokenState.HOME) {
                   set({ hasRolled: false, diceValue: null });
                   playSound('turn');
               } else {
                   get().nextTurn();
               }
           }
        }, 300);
      },

      nextTurn: () => {
        const { players, turnIndex, gameMode } = get();
        const winTokensNeeded = (gameMode === "quick" || gameMode === "blitz") ? 1 : 4;

        let nextIdx = (turnIndex + 1) % players.length;
        while (!players[nextIdx].isActive || players[nextIdx].tokens.filter(t=>t.state===TokenState.HOME).length >= winTokensNeeded) {
          nextIdx = (nextIdx + 1) % players.length;
          if (nextIdx === turnIndex) break;
        }

        set({
          turnIndex: nextIdx,
          hasRolled: false,
          diceValue: null,
          diceValues: []
        });
        playSound('turn');
      },

      joinRoom: (roomId) => set({ roomId }),

      saveGame: (name) => {
        const { gameState, gameMode, isTeamMode, players, turnIndex, diceValues, diceValue, hasRolled, winner, savedGames } = get();
        const newState: Partial<LudoState> = {
          gameState,
          gameMode,
          isTeamMode,
          players,
          turnIndex,
          diceValues,
          diceValue,
          hasRolled,
          winner
        };
        const newSavedGames = [...savedGames.filter(g => g.name !== name), {
          name,
          date: new Date().toLocaleString(),
          state: newState
        }];
        set({ savedGames: newSavedGames });
      },

      loadGame: (name) => {
        const { savedGames } = get();
        const save = savedGames.find(g => g.name === name);
        if (save) {
          set({ ...save.state as any });
        }
      },

      deleteGame: (name) => {
        const { savedGames } = get();
        set({ savedGames: savedGames.filter(g => g.name !== name) });
      }
    }),
    {
      name: "ludo-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist specific keys to avoid bloat and issues with references
      partialize: (state) => ({ 
        savedGames: state.savedGames,
        // We could also auto-save current state if we want
        players: state.players,
        gameState: state.gameState,
        gameMode: state.gameMode,
        isTeamMode: state.isTeamMode,
        turnIndex: state.turnIndex,
        diceValues: state.diceValues,
        diceValue: state.diceValue,
        hasRolled: state.hasRolled,
        winner: state.winner,
      }),
    }
  )
);

export function isValidMove(token: Token, diceValue: number, gameMode: GameMode, player?: Player): boolean {
  if (token.state === TokenState.BASE) {
    if (gameMode === 'blitz') return diceValue === 1 || diceValue === 6;
    return diceValue === 6;
  }
  if (token.state === TokenState.HOME) {
    return false;
  }
  if (token.state === TokenState.HOME_PATH) {
    // 0 to 4 in home path. 5 is HOME.
    return token.position + diceValue <= 5;
  }
  if (token.state === TokenState.ACTIVE) {
    // Calculate distance walked
    const walked = getWalkedDistance(token);
    
    // Master and Blitz mode rule: must have killed to enter home path
    if (walked + diceValue > 50) {
      if ((gameMode === 'master' || gameMode === 'blitz') && player && !player.hasKilled) {
        return false;
      }
    }

    return walked + diceValue <= 56; // 51 active path + 5 home path
  }
  return false;
}

function getWalkedDistance(token: Token): number {
  if (token.state !== TokenState.ACTIVE) return 0;
  
  const startPoints = { "red": 0, "green": 13, "yellow": 26, "blue": 39 };
  const start = startPoints[token.color];
  
  if (token.position >= start) {
    return token.position - start;
  } else {
    // e.g. red starts at 0. if position is 50, walked = 50.
    // e.g. green starts at 13. if position is 12, walked = (52 - 13) + 12 = 39 + 12 = 51.
    return (52 - start) + token.position;
  }
}

function calculateSingleStep(token: Token): {newState: TokenState, newPosition: number} {
  const startPoints = { "red": 0, "green": 13, "yellow": 26, "blue": 39 };

  if (token.state === TokenState.BASE) {
    return { newState: TokenState.ACTIVE, newPosition: startPoints[token.color] };
  }

  if (token.state === TokenState.HOME_PATH) {
    const np = token.position + 1;
    if (np === 5) return { newState: TokenState.HOME, newPosition: 5 };
    return { newState: TokenState.HOME_PATH, newPosition: np };
  }

  if (token.state === TokenState.ACTIVE) {
    const walked = getWalkedDistance(token);
    const newWalked = walked + 1;

    if (newWalked > 50) {
      if (newWalked === 56) return { newState: TokenState.HOME, newPosition: 5 };
      return { newState: TokenState.HOME_PATH, newPosition: 0 };
    } else {
      return { newState: TokenState.ACTIVE, newPosition: (token.position + 1) % 52 };
    }
  }

  return { newState: token.state, newPosition: token.position };
}
