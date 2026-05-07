export const getCenter = (r: number, c: number) => ({ x: c * 10 + 5, y: r * 10 + 5 });

export const pathGridMap: Record<number, {x: number, y: number}> = {
  // Red path (0-12)
  0: getCenter(13, 6), 1: getCenter(12, 6), 2: getCenter(11, 6), 3: getCenter(10, 6), 4: getCenter(9, 6),
  5: getCenter(8, 5), 6: getCenter(8, 4), 7: getCenter(8, 3), 8: getCenter(8, 2), 9: getCenter(8, 1), 10: getCenter(8, 0),
  11: getCenter(7, 0), 12: getCenter(6, 0),
  
  // Green path (13-25)
  13: getCenter(6, 1), 14: getCenter(6, 2), 15: getCenter(6, 3), 16: getCenter(6, 4), 17: getCenter(6, 5),
  18: getCenter(5, 6), 19: getCenter(4, 6), 20: getCenter(3, 6), 21: getCenter(2, 6), 22: getCenter(1, 6), 23: getCenter(0, 6),
  24: getCenter(0, 7), 25: getCenter(0, 8),

  // Yellow path (26-38)
  26: getCenter(1, 8), 27: getCenter(2, 8), 28: getCenter(3, 8), 29: getCenter(4, 8), 30: getCenter(5, 8),
  31: getCenter(6, 9), 32: getCenter(6, 10), 33: getCenter(6, 11), 34: getCenter(6, 12), 35: getCenter(6, 13), 36: getCenter(6, 14),
  37: getCenter(7, 14), 38: getCenter(8, 14),

  // Blue path (39-51)
  39: getCenter(8, 13), 40: getCenter(8, 12), 41: getCenter(8, 11), 42: getCenter(8, 10), 43: getCenter(8, 9),
  44: getCenter(9, 8), 45: getCenter(10, 8), 46: getCenter(11, 8), 47: getCenter(12, 8), 48: getCenter(13, 8), 49: getCenter(14, 8),
  50: getCenter(14, 7), 51: getCenter(14, 6)
};

export const homePathGridMap: Record<string, {x: number, y: number}[]> = {
  red: [
    getCenter(13, 7), getCenter(12, 7), getCenter(11, 7), getCenter(10, 7), getCenter(9, 7)
  ],
  green: [
    getCenter(7, 1), getCenter(7, 2), getCenter(7, 3), getCenter(7, 4), getCenter(7, 5)
  ],
  yellow: [
    getCenter(1, 7), getCenter(2, 7), getCenter(3, 7), getCenter(4, 7), getCenter(5, 7)
  ],
  blue: [
    getCenter(7, 13), getCenter(7, 12), getCenter(7, 11), getCenter(7, 10), getCenter(7, 9)
  ]
};

// Bases centers for spreading tokens
export const baseGridMap: Record<string, {x: number, y: number}[]> = {
  green: [
    getCenter(1.6, 1.6), getCenter(1.6, 3.4), getCenter(3.4, 1.6), getCenter(3.4, 3.4)
  ],
  yellow: [
    getCenter(1.6, 10.6), getCenter(1.6, 12.4), getCenter(3.4, 10.6), getCenter(3.4, 12.4)
  ],
  red: [
    getCenter(10.6, 1.6), getCenter(10.6, 3.4), getCenter(12.4, 1.6), getCenter(12.4, 3.4)
  ],
  blue: [
    getCenter(10.6, 10.6), getCenter(10.6, 12.4), getCenter(12.4, 10.6), getCenter(12.4, 12.4)
  ]
};
