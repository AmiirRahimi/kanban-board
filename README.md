# Kanban Board

A fast, modern kanban board that handles 5000 cards smoothly.

## Features

- 3 columns with color indicators: To Do, In Progress, Done
- Smooth drag & drop between columns
- Real-time search with loading indicator
- Add, edit, delete cards
- Handles 5000+ cards without performance issues

## How to run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Tech

- Next.js + TypeScript
- Zustand for state management
- @dnd-kit for drag & drop
- Virtual scrolling for performance
- Each card only re-renders when needed

## UI/UX highlights

- Clean, modern design with smooth animations
- Cards fade in/out on hover
- Color-coded columns
- Custom scrollbars
- Spinning loader during search
- Grab cursor for draggable cards

The search uses React's deferred value feature to keep typing smooth while filtering thousands of cards.
