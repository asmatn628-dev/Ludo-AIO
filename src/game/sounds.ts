const soundMap = {
  roll: '/Sounds/dice_roll.mp3',
  move: '/Sounds/token_move.mp3',
  kill: '/Sounds/kill_alter.mp3',
  win: '/Sounds/cheer_2.mp3',
  safe: '/Sounds/click.mp3',
  match: '/Sounds/match.mp3',
  turn: '/Sounds/my_turn.mp3'
};

const audioCache: Record<string, HTMLAudioElement> = {};

// Pre-load sounds
if (typeof window !== 'undefined') {
  Object.entries(soundMap).forEach(([key, path]) => {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audioCache[key] = audio;
  });
}

export const playSound = (type: keyof typeof soundMap) => {
  try {
    const audio = audioCache[type];
    if (audio) {
      // For instant restart of sound if already playing
      audio.currentTime = 0;
      audio.play().catch(e => console.warn("Audio play failed", e));
    }
  } catch (e) {
    console.warn("Audio not supported or allowed yet", e);
  }
};
