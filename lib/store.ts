import { create } from 'zustand';

export type CardStatus = 'todo' | 'inprogress' | 'done';

export type LabelColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export const LABEL_OPTIONS: Label[] = [
  { id: 'lbl-email', name: 'Email Campaign', color: 'purple' },
  { id: 'lbl-blog', name: 'Blog', color: 'green' },
  { id: 'lbl-website', name: 'Website', color: 'orange' },
  { id: 'lbl-social', name: 'Social Media', color: 'yellow' },
  { id: 'lbl-seo', name: 'SEO', color: 'blue' },
];

export interface Card {
  id: string;
  title: string;
  description: string;
  status: CardStatus;
  labels?: Label[];
  dueDate?: string;
  comments?: number;
  attachments?: number;
  checklistDone?: number;
  checklistTotal?: number;
  members?: { id: string; initials: string; color: string }[];
}

interface BoardStore {
  cards: Card[];
  searchQuery: string;
  isSearching: boolean;
  setSearchQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  addCard: (card: Omit<Card, 'id'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (id: string, status: CardStatus) => void;
  reorderCards: (activeId: string, overId: string) => void;
}

const generateFakeCards = (count: number): Card[] => {
  const statuses: CardStatus[] = ['todo', 'inprogress', 'done'];
  const cards: Card[] = [];
  
  for (let i = 0; i < count; i++) {
    const labels: Label[] = [];
    if (i % 7 === 0) labels.push(LABEL_OPTIONS[i % LABEL_OPTIONS.length]);
    if (i % 13 === 0) labels.push(LABEL_OPTIONS[(i + 2) % LABEL_OPTIONS.length]);

    const checklistTotal = i % 5 === 0 ? 3 : i % 7 === 0 ? 5 : 0;
    const checklistDone = checklistTotal ? Math.min(checklistTotal, i % (checklistTotal + 1)) : 0;
    const comments = i % 9 === 0 ? (i % 4) + 1 : 0;
    const attachments = i % 11 === 0 ? (i % 3) + 1 : 0;
    const dueDate = i % 6 === 0 ? new Date(Date.now() + (i % 10) * 86400000).toISOString() : undefined;
    const members = (i % 8 === 0)
      ? [
          { id: `m-a-${i}`, initials: 'AR', color: '#f97316' },
          { id: `m-b-${i}`, initials: 'MS', color: '#22c55e' },
        ]
      : [];
    cards.push({
      id: `card-${i}`,
      title: `Task ${i + 1}`,
      description: `This is the description for task ${i + 1}`,
      status: statuses[i % 3],
      labels,
      checklistDone,
      checklistTotal,
      comments,
      attachments,
      dueDate,
      members,
    });
  }
  
  return cards;
};

export const useBoardStore = create<BoardStore>((set) => ({
  cards: generateFakeCards(5000),
  searchQuery: '',
  isSearching: false,
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsSearching: (isSearching) => set({ isSearching }),
  
  addCard: (card) => set((state) => ({
    cards: [...state.cards, { ...card, labels: card.labels ?? [], id: `card-${Date.now()}` }],
  })),
  
  updateCard: (id, updates) => set((state) => ({
    cards: state.cards.map((card) =>
      card.id === id ? { ...card, ...updates } : card
    ),
  })),
  
  deleteCard: (id) => set((state) => ({
    cards: state.cards.filter((card) => card.id !== id),
  })),
  
  moveCard: (id, status) => set((state) => ({
    cards: state.cards.map((card) =>
      card.id === id ? { ...card, status } : card
    ),
  })),
  
  reorderCards: (activeId: string, overId: string) => set((state) => {
    const oldIndex = state.cards.findIndex((c) => c.id === activeId);
    const newIndex = state.cards.findIndex((c) => c.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return state;
    
    const newCards = [...state.cards];
    const [movedCard] = newCards.splice(oldIndex, 1);
    newCards.splice(newIndex, 0, movedCard);
    
    return { cards: newCards };
  }),
}));

