import type { Pattern } from './engine';
import { LEGS } from './exercises/legs';
import { PULL } from './exercises/pull';
import { PUSH } from './exercises/push';

export const PATTERNS: Record<string, Pattern> = { ...PUSH, ...PULL, ...LEGS };
