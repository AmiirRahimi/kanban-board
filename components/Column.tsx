'use client';

import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card as CardType, CardStatus } from '@/lib/store';
import Card from './Card';

interface ColumnProps {
  title: string;
  status: CardStatus;
  cards: CardType[];
  color: string;
}

export default function Column({ title, status, cards, color }: ColumnProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    measureElement: (el) => {
      if (!el) return 120;
      const height = el.getBoundingClientRect().height;
      return height || 120;
    },
    overscan: 5,
    gap: 12,
  });

  // Force remeasure when cards change or when drag state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      virtualizer.measure();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, cards.map(c => c.id).join(','), isOver]);

  return (
    <div className="flex-1 bg-gray-50 rounded-xl p-4 flex flex-col min-w-0 border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <h2 className="font-bold text-base text-gray-800">{title}</h2>
        </div>
        <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
          {cards.length}
        </span>
      </div>
      <div className={`h-1 w-full rounded-full mb-4 ${
        color.replace('bg-', 'bg-')
      } opacity-60`}></div>

      <div
        ref={parentRef}
        className={`flex-1 overflow-auto rounded-lg transition-colors ${
          isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
        }`}
        style={{ height: '100%' }}
      >
        <div
          ref={setNodeRef}
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
            minHeight: '100px',
          }}
        >
          <SortableContext id={status} items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const card = cards[virtualItem.index];
              return (
                <div
                  key={card.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    willChange: 'transform',
                  }}
                >
                  <Card
                    card={card}
                    onResize={() => {
                      virtualizer.measure();
                    }}
                  />
                </div>
              );
            })}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

