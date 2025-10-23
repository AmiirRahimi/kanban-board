'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card as CardType, CardStatus, useBoardStore } from '@/lib/store';
import Card from './Card';

interface ColumnProps {
  title: string;
  status: CardStatus;
  cards: CardType[];
  totalCards: number;
  visibleCount: number;
  color: string;
}

const WINDOW_SIZE = 50; // Show 50 cards at a time in the viewport
const BUFFER = 10; // Keep 10 extra cards above/below for smooth scrolling

export default function Column({ title, status, cards, totalCards, visibleCount, color }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Initialize window state - resets when totalCards changes (e.g., during search)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialWindow = useMemo(() => ({ start: 0, end: WINDOW_SIZE }), [totalCards]);
  const [windowStart, setWindowStart] = useState(initialWindow.start);
  const [windowEnd, setWindowEnd] = useState(initialWindow.end);

  // Reset window when initialWindow changes
  useEffect(() => {
    setWindowStart(initialWindow.start);
    setWindowEnd(initialWindow.end);
  }, [initialWindow]);

  // Bidirectional windowing: adjust visible window based on scroll position
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Estimate card height (average ~120px)
    const estimatedCardHeight = 120;
    const scrolledCards = Math.floor(scrollTop / estimatedCardHeight);
    
    // Calculate new window with buffer
    const newStart = Math.max(0, scrolledCards - BUFFER);
    const newEnd = Math.min(cards.length, scrolledCards + WINDOW_SIZE + BUFFER);

    setWindowStart(newStart);
    setWindowEnd(newEnd);

    // Load more when near bottom
    if (scrollHeight - scrollTop - clientHeight < 300 && visibleCount < totalCards) {
      useBoardStore.getState().loadMoreCards(status);
    }
  }, [cards.length, status, totalCards, visibleCount]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const visibleCards = cards.slice(windowStart, windowEnd);
  const topPadding = windowStart * 120; // Approximate height for scrolled cards
  const bottomPadding = Math.max(0, (cards.length - windowEnd) * 120);

  return (
    <div className="flex-1 bg-gray-50 rounded-xl p-4 flex flex-col min-w-0 border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <h2 className="font-bold text-base text-gray-800">{title}</h2>
        </div>
        <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
          {totalCards}
        </span>
      </div>
      <div className={`h-1 w-full rounded-full mb-4 ${
        color.replace('bg-', 'bg-')
      } opacity-60`}></div>

      <div
        ref={scrollRef}
        className={`flex-1 overflow-auto rounded-lg transition-colors ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
        }`}
      >
        <div ref={setNodeRef} className="min-h-[100px]">
          {/* Padding for scrolled-past items (removed from DOM) */}
          {topPadding > 0 && <div style={{ height: `${topPadding}px` }} />}
          
          <div className="space-y-3 pb-2">
            <SortableContext id={status} items={visibleCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {visibleCards.map((card) => (
                <Card key={card.id} card={card} />
              ))}
            </SortableContext>
          </div>

          {/* Padding for items below viewport (not yet rendered) */}
          {bottomPadding > 0 && <div style={{ height: `${bottomPadding}px` }} />}
          
          {visibleCount < totalCards && (
            <div className="w-full py-3 flex items-center justify-center text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span>Loading more...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

