'use client';

import { useRef, useEffect } from 'react';
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

export default function Column({ title, status, cards, totalCards, visibleCount, color }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      if (scrollHeight - scrollTop - clientHeight < 300 && visibleCount < totalCards) {
        useBoardStore.getState().loadMoreCards(status);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [status, totalCards, visibleCount]);

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
        className={`flex-1 overflow-auto rounded-lg ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
        }`}
        style={{ willChange: 'scroll-position' }}
      >
        <div ref={setNodeRef} className="space-y-3 pb-2 min-h-[100px]" style={{ contain: 'layout style paint' }}>
          <SortableContext id={status} items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <Card key={card.id} card={card} />
            ))}
          </SortableContext>
          
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

