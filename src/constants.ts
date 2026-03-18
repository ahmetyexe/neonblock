import { TetrominoType } from './types';

export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 30;

export const COLORS: Record<TetrominoType, string> = {
  I: '#00f2ff',
  J: '#0078ff',
  L: '#ff9d00',
  O: '#fff600',
  S: '#00ff84',
  T: '#cc00ff',
  Z: '#ff0060',
};

export const SHAPES: Record<TetrominoType, number[][]> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
};
