# Modern Theme Guide

## Overview

This document describes the modern semi-light theme featuring 3D elements, glassmorphism, and smooth animations.

## Theme Features

- Semi-light background with gradient
- Glassmorphism cards with blur effects
- 3D elements with depth and shadows
- Smooth animations and transitions
- Floating particles background

## Color Palette

| Element | Value |
|---------|-------|
| Background | #f0f4f8 to #e1e8ed (gradient) |
| Cards | White with glass effect |
| Primary Accent | #667eea |
| Secondary Accent | #764ba2 |

## Glassmorphism Style

```css
backdrop-filter: blur(20px);
background: rgba(255, 255, 255, 0.7);
border: 1px solid rgba(255, 255, 255, 0.3);
```

## Theme Application

### Option 1: Replace Current Theme
1. Backup `styles.css`
2. Replace with `theme-modern.css` content
3. Rename to `styles.css`

### Option 2: Add as Alternative
Change in `index.html`:
```html
<link rel="stylesheet" href="theme-modern.css">
```

## Key CSS Classes

| Class | Purpose |
|-------|---------|
| `.glass-card` | Glassmorphism container |
| `.crewmate-3d` | 3D player avatar |
| `.btn` | 3D button with effects |
| `.meeting-player-card` | 3D player card |
| `.phase-step` | 3D phase indicator |

## Customization

### Primary Color
```css
--accent-primary: #667eea;
--accent-secondary: #764ba2;
```

### 3D Depth
```css
--shadow-3d: 0 10px 30px rgba(102, 126, 234, 0.3);
```

### Glass Effect
```css
--bg-glass: rgba(255, 255, 255, 0.7);
backdrop-filter: blur(20px);
```

## Performance Notes

- Use `transform` for animations
- Use `opacity` for fading effects
- Avoid animating `width/height`
- Use `will-change` sparingly
