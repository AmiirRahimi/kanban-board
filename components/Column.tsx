'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card as CardType, CardStatus } from '@/lib/store';
import { useBoardStore } from '@/lib/store';
import Card from './Card';

interface ColumnProps {
  title: string;
  status: CardStatus;
  cards: CardType[];
  color: string;
}

export default function Column({ title, status, cards, color }: ColumnProps) {
  const addCard = useBoardStore((state) => state.addCard);
  const parentRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 5,
    gap: 12,
  });

  const handleAddCard = () => {
    const ev = new CustomEvent('open-add-modal', { detail: { status } });
    window.dispatchEvent(ev);
  };

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
      
      <div className="mb-4">
        <button onClick={handleAddCard} className="px-3 py-2 bg-white border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:bg-gray-50 text-sm font-medium transition-all">+ Add a card</button>
      </div>

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
                  }}
                >
                  <Card
                    card={card}
                    onResize={() => {
                      // measurement is handled via ref+ResizeObserver by react-virtual when measureElement is provided
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

