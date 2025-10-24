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
  allCards: Card[]; // Store all cards from worker
  filteredCards: {
    todo: Card[];
    inprogress: Card[];
    done: Card[];
  };
  totals: {
    todo: number;
    inprogress: number;
    done: number;
  };
  totalCardsCount: number;
  visibleCount: { [key in CardStatus]: number };
  searchQuery: string;
  isSearching: boolean;
  isLoading: boolean;
  worker: Worker | null;
  initializeWorker: () => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  loadMoreCards: (status: CardStatus) => void;
  setTotalCardsCount: (count: number) => void;
  resetOrder: () => void;
  addCard: (card: Omit<Card, 'id'>) => void;
  updateCard: (id: string, updates: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  moveCard: (id: string, status: CardStatus, overId?: string) => void;
  reorderCards: (activeId: string, overId: string) => void;
  requestFilter: () => void;
}

// Chunked loading strategy: Start with fewer cards, load more on demand
const INITIAL_LOAD = 50;
const LOAD_MORE_CHUNK = 30;
const DEFAULT_TOTAL_CARDS = 5000;
const MAX_SEARCH_RESULTS = 100; // Limit search results to prevent rendering thousands of cards

export const useBoardStore = create<BoardStore>((set, get) => ({
  allCards: [],
  cards: [],
  filteredCards: {
    todo: [],
    inprogress: [],
    done: [],
  },
  totals: {
    todo: 0,
    inprogress: 0,
    done: 0,
  },
  totalCardsCount: DEFAULT_TOTAL_CARDS,
  visibleCount: {
    todo: INITIAL_LOAD,
    inprogress: INITIAL_LOAD,
    done: INITIAL_LOAD,
  },
  searchQuery: '',
  isSearching: false,
  isLoading: true,
  worker: null,

  initializeWorker: () => {
    const state = get();
    if (state.worker) return; // Already initialized

    const worker = new Worker(new URL('./cards.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e) => {
      const message = e.data;

      switch (message.type) {
        case 'GENERATED':
          set({
            allCards: message.cards,
            cards: message.cards,
            isLoading: false,
          });
          // Trigger initial filter
          get().requestFilter();
          break;

        case 'FILTERED':
          set({
            filteredCards: message.cards,
            totals: message.totals,
            isSearching: false,
          });
          break;

        case 'UPDATED':
          set({
            allCards: message.cards,
            cards: message.cards,
          });
          // Trigger filter after update
          get().requestFilter();
          break;
      }
    };

    // Initialize with default count
    worker.postMessage({ type: 'GENERATE', count: DEFAULT_TOTAL_CARDS });

    set({ worker });
  },

  requestFilter: () => {
    const state = get();
    if (!state.worker) return;

    state.worker.postMessage({
      type: 'FILTER',
      searchQuery: state.searchQuery,
      visibleCount: state.visibleCount,
      maxSearchResults: MAX_SEARCH_RESULTS,
    });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query, isSearching: true });
    // Debounce is handled by useDeferredValue in component
    get().requestFilter();
  },

  setIsSearching: (isSearching) => set({ isSearching }),

  loadMoreCards: (status: CardStatus) => {
    set((state) => ({
      visibleCount: {
        ...state.visibleCount,
        [status]: state.visibleCount[status] + LOAD_MORE_CHUNK,
      },
    }));
    get().requestFilter();
  },

  setTotalCardsCount: (count: number) => {
    const state = get();
    if (!state.worker) return;

    set({
      totalCardsCount: count,
      visibleCount: {
        todo: INITIAL_LOAD,
        inprogress: INITIAL_LOAD,
        done: INITIAL_LOAD,
      },
      isLoading: true,
    });

    state.worker.postMessage({ type: 'GENERATE', count });
  },

  resetOrder: () => {
    const state = get();
    if (!state.worker) return;

    set({
      totalCardsCount: DEFAULT_TOTAL_CARDS,
      visibleCount: {
        todo: INITIAL_LOAD,
        inprogress: INITIAL_LOAD,
        done: INITIAL_LOAD,
      },
      searchQuery: '',
      isSearching: false,
      isLoading: true,
    });

    state.worker.postMessage({ type: 'RESET' });
  },

  addCard: (card) => {
    const state = get();
    if (!state.worker) return;
    state.worker.postMessage({ type: 'ADD_CARD', card });
  },

  updateCard: (id, updates) => {
    const state = get();
    if (!state.worker) return;
    state.worker.postMessage({ type: 'UPDATE_CARD', id, updates });
  },

  deleteCard: (id) => {
    const state = get();
    if (!state.worker) return;
    state.worker.postMessage({ type: 'DELETE_CARD', id });
  },

  moveCard: (id, status, overId) => {
    const state = get();
    if (!state.worker) return;
    state.worker.postMessage({ type: 'MOVE_CARD', id, status, overId });
  },

  reorderCards: (activeId: string, overId: string) => {
    const state = get();
    if (!state.worker) return;
    state.worker.postMessage({ type: 'REORDER_CARDS', activeId, overId });
  },
}));

