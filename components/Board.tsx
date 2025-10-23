'use client';

import { useMemo, useDeferredValue, useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useBoardStore, CardStatus } from '@/lib/store';
import Column from './Column';
import Card from './Card';
import CardModal from './CardModal';
import Settings from './Settings';

export default function Board() {
  const cards = useBoardStore((state) => state.cards);
  const visibleCount = useBoardStore((state) => state.visibleCount);
  const searchQuery = useBoardStore((state) => state.searchQuery);
  const setSearchQuery = useBoardStore((state) => state.setSearchQuery);
  const isSearching = useBoardStore((state) => state.isSearching);
  const setIsSearching = useBoardStore((state) => state.setIsSearching);
  const moveCard = useBoardStore((state) => state.moveCard);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingCard, setEditingCard] = useState<string | null>(null);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (inputValue !== deferredSearchQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [inputValue, deferredSearchQuery, setIsSearching]);

  useEffect(() => {
    const handler = (e: CustomEvent<{ id: string }>) => {
      setModalMode('edit');
      setEditingCard(e.detail.id);
      setModalOpen(true);
    };
    window.addEventListener('open-edit-modal', handler as EventListener);
    return () => window.removeEventListener('open-edit-modal', handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = () => {
      setModalMode('add');
      setEditingCard(null);
      setModalOpen(true);
    };
    window.addEventListener('open-add-modal', handler as EventListener);
    return () => window.removeEventListener('open-add-modal', handler as EventListener);
  }, []);

  const filteredCards = useMemo(() => {
    if (!deferredSearchQuery.trim()) return cards;
    
    const query = deferredSearchQuery.toLowerCase();
    return cards.filter(
      (card) =>
        card.title.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query)
    );
  }, [cards, deferredSearchQuery]);

  const columnCards = useMemo(() => {
    const allTodo = filteredCards.filter((c) => c.status === 'todo');
    const allInProgress = filteredCards.filter((c) => c.status === 'inprogress');
    const allDone = filteredCards.filter((c) => c.status === 'done');
    
    // When searching: show all results. When not: limit by visibleCount for performance
    const todo = deferredSearchQuery ? allTodo : allTodo.slice(0, visibleCount.todo);
    const inprogress = deferredSearchQuery ? allInProgress : allInProgress.slice(0, visibleCount.inprogress);
    const done = deferredSearchQuery ? allDone : allDone.slice(0, visibleCount.done);
    
    return { 
      todo, 
      inprogress, 
      done,
      totalTodo: allTodo.length,
      totalInProgress: allInProgress.length,
      totalDone: allDone.length,
    };
  }, [filteredCards, visibleCount, deferredSearchQuery]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the active card
    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    let targetStatus: CardStatus | null = null;
    
    if (overId === 'todo' || overId === 'inprogress' || overId === 'done') {
      targetStatus = overId;
    } else {
      // Extract container ID from sortable context when dropping on a card
      const containerId = (over.data?.current as { sortable?: { containerId: CardStatus } })?.sortable?.containerId;
      if (containerId === 'todo' || containerId === 'inprogress' || containerId === 'done') {
        targetStatus = containerId;
      }
    }

    if (!targetStatus) return;

    if (activeCard.status === targetStatus) {
      // Same column: just reorder
      if (activeId !== overId) {
        useBoardStore.getState().reorderCards(activeId, overId);
      }
    } else {
      // Different column: move and optionally position near dropped card
      const isDroppingOnCard = overId !== 'todo' && overId !== 'inprogress' && overId !== 'done';
      moveCard(activeId, targetStatus, isDroppingOnCard ? overId : undefined);
    }
  };

  const handleSearchChange = (value: string) => {
    setInputValue(value);
    setSearchQuery(value);
  };

  const activeCard = activeId ? cards.find((c) => c.id === activeId) : null;
  const editingCardObj = editingCard ? cards.find((c) => c.id === editingCard) : undefined;

  return (
    <div className="h-screen flex flex-col p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">📋 Kanban Board</h1>
          <Settings />
        </div>
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-gray-400 text-lg">🔍</span>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search cards by title or description..."
            className="w-full pl-12 pr-24 py-3.5 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span>loading...</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={() => { setModalMode('add'); setEditingCard(null); setModalOpen(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Add Task
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-6 overflow-hidden">
          <Column 
            title="To Do" 
            status="todo" 
            cards={columnCards.todo}
            totalCards={columnCards.totalTodo}
            visibleCount={visibleCount.todo}
            color="bg-slate-500"
          />
          <Column 
            title="In Progress" 
            status="inprogress" 
            cards={columnCards.inprogress}
            totalCards={columnCards.totalInProgress}
            visibleCount={visibleCount.inprogress}
            color="bg-amber-500"
          />
          <Column 
            title="Done" 
            status="done" 
            cards={columnCards.done}
            totalCards={columnCards.totalDone}
            visibleCount={visibleCount.done}
            color="bg-emerald-500"
          />
        </div>

        <DragOverlay>
          {activeCard ? <Card card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      <CardModal
        key={editingCard || 'new'}
        open={modalOpen}
        mode={modalMode}
        initial={modalMode === 'edit' && editingCardObj ? editingCardObj : { status: 'todo', labels: [] }}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => {
          if (modalMode === 'add') {
            useBoardStore.getState().addCard({
              title: data.title,
              description: data.description,
              status: data.status,
              labels: data.labels,
            });
          } else if (modalMode === 'edit' && editingCardObj) {
            useBoardStore.getState().updateCard(editingCardObj.id, {
              title: data.title,
              description: data.description,
              status: data.status,
              labels: data.labels,
            });
          }
        }}
      />
    </div>
  );
}

