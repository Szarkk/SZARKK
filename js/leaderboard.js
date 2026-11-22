/* =========================================================================
   ARCADE LEADERBOARD PERSISTENCE (TOP 10 PER MODE: NORMAL & HARD)
   ========================================================================= */

import { STORAGE_KEYS } from './config.js';
import { readLS, writeLS } from './utils.js';

export const LEADERBOARD_MAX_ENTRIES = 10;

export function sanitizeCallsign(raw) {
  const cleaned = String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9 _-]/g, '')
    .trim()
    .slice(0, 8);
  return cleaned || 'PILOT';
}

export function getSavedCallsign() {
  return sanitizeCallsign(readLS(STORAGE_KEYS.callsign, 'FLYNN'));
}

export function setSavedCallsign(tag) {
  const clean = sanitizeCallsign(tag);
  writeLS(STORAGE_KEYS.callsign, clean);
  return clean;
}

function loadAllEntries() {
  try {
    const raw = readLS(STORAGE_KEYS.leaderboard, '[]');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && typeof item.score === 'number' && Number.isFinite(item.score))
      .map(item => ({
        ...item,
        mode: item.mode === 'HARD' ? 'HARD' : 'NORMAL'
      }));
  } catch {
    return [];
  }
}

export function loadLeaderboard(mode = 'NORMAL') {
  const targetMode = mode === 'HARD' ? 'HARD' : 'NORMAL';
  return loadAllEntries()
    .filter(item => item.mode === targetMode)
    .sort((a, b) => (b.score - a.score) || ((b.sector || 0) - (a.sector || 0)) || ((b.ts || 0) - (a.ts || 0)))
    .slice(0, LEADERBOARD_MAX_ENTRIES);
}

export function hasAnyLeaderboardEntries() {
  return loadAllEntries().length > 0;
}

export function saveLeaderboardEntry({ tag, score, sector, accuracy, mode = 'NORMAL' }) {
  const cleanTag = setSavedCallsign(tag);
  const targetMode = mode === 'HARD' ? 'HARD' : 'NORMAL';
  const all = loadAllEntries();
  const entry = {
    id: `${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    mode: targetMode,
    tag: cleanTag,
    score: Math.max(0, Math.floor(score || 0)),
    sector: Math.max(1, Math.floor(sector || 1)),
    accuracy: String(accuracy || '0.0%'),
    ts: Date.now()
  };

  const otherMode = all.filter(e => e.mode !== targetMode);
  const sameMode = all.filter(e => e.mode === targetMode);
  sameMode.push(entry);
  sameMode.sort((a, b) => (b.score - a.score) || ((b.sector || 0) - (a.sector || 0)) || ((b.ts || 0) - (a.ts || 0)));
  const trimmedSame = sameMode.slice(0, LEADERBOARD_MAX_ENTRIES);

  writeLS(STORAGE_KEYS.leaderboard, JSON.stringify([...otherMode, ...trimmedSame]));

  const rankIndex = trimmedSame.findIndex(e => e.id === entry.id);
  return {
    entry,
    entries: trimmedSame,
    rank: rankIndex >= 0 ? rankIndex + 1 : null
  };
}

export function clearLeaderboard() {
  writeLS(STORAGE_KEYS.leaderboard, '[]');
  writeLS(STORAGE_KEYS.hi, '0');
  writeLS(STORAGE_KEYS.hiHard, '0');
}

export function getTopLeaderboardScore(mode = 'NORMAL') {
  const entries = loadLeaderboard(mode);
  return entries.length > 0 ? entries[0].score : 0;
}
