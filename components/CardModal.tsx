'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card as CardType, Label, LABEL_OPTIONS, CardStatus } from '@/lib/store';

interface CardModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  initial?: Partial<CardType> & { status?: CardStatus };
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; labels: Label[]; status: CardStatus }) => void;
}

export default function CardModal({ open, mode, initial, onClose, onSubmit }: CardModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [labels, setLabels] = useState<Label[]>(initial?.labels ?? []);
  const [status, setStatus] = useState<CardStatus>(initial?.status ?? 'todo');

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setDescription(initial?.description ?? '');
      setLabels(initial?.labels ?? []);
      setStatus(initial?.status ?? 'todo');
    }
  }, [open, initial]);

  if (!open) return null;

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), labels, status });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{mode === 'add' ? 'Add Task' : 'Edit Task'}</h2>
          <button onClick={onClose} className="px-2 py-1 rounded hover:bg-gray-100">✕</button>
        </div>
        <div className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={4}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Labels</label>
            <div className="flex flex-wrap gap-2">
              {LABEL_OPTIONS.map(opt => {
                const active = labels.some(l => l.id === opt.id);
                const cls = opt.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
                  opt.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  opt.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  opt.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                  opt.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-purple-100 text-purple-700 border-purple-200';
                return (
                  <button
                    key={opt.id}
                    onClick={() => setLabels(prev => active ? prev.filter(l => l.id !== opt.id) : [...prev, opt])}
                    className={`h-7 px-2 rounded-md text-[11px] font-semibold border ${cls} ${active ? 'ring-2 ring-offset-1 ring-current' : ''}`}
                  >
                    {opt.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Column</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CardStatus)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button onClick={submit} className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">{mode === 'add' ? 'Add' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}


