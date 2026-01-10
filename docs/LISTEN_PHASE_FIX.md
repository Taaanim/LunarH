# Listen Phase Documentation

## Overview

This document describes the Listen & Analysis phase (Phase 2) functionality in the meeting system.

## Phase Flow

### Phase 1: Express Emotions
- Bots automatically express 1-3 emotions
- Player can express emotions
- Emotions are recorded for analysis

### Phase 2: Listen & Analysis
1. Click "Next Phase" to enter this phase
2. Emotion Summary Grid displays all player cards
3. Each card shows:
   - Player color and name
   - Emotion indicators
   - Opinion count
   - Click hint
4. Click any card to hear emotion sounds
5. Sounds play in sequence (500ms intervals)

### Phase 3: Vote
1. Click "Next Phase"
2. Vote for suspicious player or skip

## Technical Implementation

### Files Modified
- `game.js`: Updated `updateEmotionSummaryGrid()` and `playPlayerEmotions()` functions

### Key Features
- Cursor pointer style on clickable cards
- Console logging for debugging
- Error handling for empty emotions
- Visual feedback with player name colors

## Sound Playback

| Setting | Value |
|---------|-------|
| Delay between sounds | 500ms |
| Sound duration | 0.6-0.9s |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No cards in Phase 2 | Check console for errors, verify Phase 1 had emotions |
| Cards not clickable | Clear browser cache, hard refresh |
| No sound playing | Click page first to enable audio, check volume |
| "No emotions yet" message | Normal if player has no emotions recorded |
