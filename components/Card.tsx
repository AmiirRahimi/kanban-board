'use client';

import { memo, useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType, LABEL_OPTIONS, Label } from '@/lib/store';
import { useBoardStore } from '@/lib/store';

interface CardProps {
  card: CardType;
  onResize?: () => void;
}

const Card = memo(({ card, onResize }: CardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [labels, setLabels] = useState<Label[]>(card.labels ?? []);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  
  const updateCard = useBoardStore((state) => state.updateCard);
  const deleteCard = useBoardStore((state) => state.deleteCard);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  useEffect(() => {
    onResize?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleSave = () => {
    updateCard(card.id, { title, description, labels });
    setIsEditing(false);
    onResize?.();
  };

  const handleCancel = () => {
    setTitle(card.title);
    setDescription(card.description);
    setIsEditing(false);
    onResize?.();
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-3"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Card title..."
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Add description..."
        />
        <div className="flex flex-wrap gap-2 mb-3">
          {LABEL_OPTIONS.map(option => {
            const active = labels.some(l => l.id === option.id);
            const colorClass = option.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
              option.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
              option.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
              option.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
              option.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
              'bg-purple-100 text-purple-700 border-purple-200';
            return (
              <button
                key={option.id}
                onClick={() => {
                  setLabels(prev => active ? prev.filter(l => l.id !== option.id) : [...prev, option]);
                }}
                className={`h-6 px-2 rounded-md text-[10px] font-semibold border transition-colors ${colorClass} ${active ? 'ring-2 ring-offset-1 ring-current' : ''}`}
              >
                {option.name}
              </button>
            );
          })}
        </div>
        <div className="sticky bottom-0 left-0 right-0 bg-white pt-1 flex gap-2 z-10">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
    >
      <div className="flex flex-wrap gap-2 mb-2">
        {(card.labels ?? []).map((lbl) => {
          const colorClass = lbl.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
            lbl.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
            lbl.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
            lbl.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
            lbl.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
            'bg-purple-100 text-purple-700 border-purple-200';
          return (
            <span key={lbl.id} className={`px-2 h-5 rounded-md text-[10px] font-semibold border ${colorClass}`}>
              {lbl.name}
            </span>
          );
        })}
      </div>
      <div className="flex items-start mb-2">
        <h3 className="font-semibold text-sm text-gray-800 flex-1 mr-2 line-clamp-2">{card.title}</h3>
        <div className="flex items-center gap-1">
          <button
            aria-label="Drag"
            {...attributes}
            {...listeners}
            className="p-1 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing text-gray-500"
            onClick={(e) => e.stopPropagation()}
          >
            ⠿
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{card.description}</p>
      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-3">
          {typeof card.dueDate === 'string' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              ⏰ {new Date(card.dueDate).toLocaleDateString()}
            </span>
          )}
          {card.checklistTotal ? (
            <span className="inline-flex items-center gap-1">☑️ {card.checklistDone}/{card.checklistTotal}</span>
          ) : null}
          {card.comments ? (
            <span className="inline-flex items-center gap-1">💬 {card.comments}</span>
          ) : null}
          {card.attachments ? (
            <span className="inline-flex items-center gap-1">📎 {card.attachments}</span>
          ) : null}
        </div>
        {card.members && card.members.length > 0 && (
          <div className="flex -space-x-2">
            {card.members.slice(0, 3).map(m => (
              <span key={m.id} className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold border border-white shadow-sm" style={{ backgroundColor: m.color }}>
                {m.initials}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const event = new CustomEvent('open-edit-modal', { detail: { id: card.id } });
            window.dispatchEvent(event);
          }}
          className="flex-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmingDelete(true);
          }}
          className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100 transition-colors"
        >
          🗑️ Delete
        </button>
        {confirmingDelete && (
          <div className="absolute -top-2 right-0 translate-y-[-100%] bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-56">
            <p className="text-xs text-gray-700 mb-2">Are you sure you want to delete this card?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmingDelete(false); }}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteCard(card.id); setConfirmingDelete(false); }}
                className="px-2 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  const a = prevProps.card;
  const b = nextProps.card;
  const labelsEqual = JSON.stringify(a.labels ?? []) === JSON.stringify(b.labels ?? []);
  return a.id === b.id && a.title === b.title && a.description === b.description && a.status === b.status && labelsEqual && a.dueDate === b.dueDate && a.comments === b.comments && a.attachments === b.attachments && a.checklistDone === b.checklistDone && a.checklistTotal === b.checklistTotal;
});

Card.displayName = 'Card';

export default Card;

