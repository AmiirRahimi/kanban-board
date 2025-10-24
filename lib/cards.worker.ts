import type { Card, CardStatus, Label } from './store';

export const LABEL_OPTIONS: Label[] = [
  { id: 'lbl-email', name: 'Email Campaign', color: 'purple' },
  { id: 'lbl-blog', name: 'Blog', color: 'green' },
  { id: 'lbl-website', name: 'Website', color: 'orange' },
  { id: 'lbl-social', name: 'Social Media', color: 'yellow' },
  { id: 'lbl-seo', name: 'SEO', color: 'blue' },
];

const generateFakeCards = (count: number): Card[] => {
  const statuses: CardStatus[] = ['todo', 'inprogress', 'done'];
  const cards: Card[] = [];
  
  // Distribute cards evenly across columns
  const cardsPerColumn = Math.ceil(count / 3);
  
  for (let statusIndex = 0; statusIndex < 3; statusIndex++) {
    const status = statuses[statusIndex];
    const startNum = statusIndex * cardsPerColumn;
    const endNum = Math.min(startNum + cardsPerColumn, count);
    
    for (let i = startNum; i < endNum; i++) {
      const cardNumber = i - startNum + 1; // Sequential number within column
      
      const labels: Label[] = [];
      if (cardNumber % 7 === 0) labels.push(LABEL_OPTIONS[cardNumber % LABEL_OPTIONS.length]);
      if (cardNumber % 13 === 0) labels.push(LABEL_OPTIONS[(cardNumber + 2) % LABEL_OPTIONS.length]);

      const checklistTotal = cardNumber % 5 === 0 ? 3 : cardNumber % 7 === 0 ? 5 : 0;
      const checklistDone = checklistTotal ? Math.min(checklistTotal, cardNumber % (checklistTotal + 1)) : 0;
      const comments = cardNumber % 9 === 0 ? (cardNumber % 4) + 1 : 0;
      const attachments = cardNumber % 11 === 0 ? (cardNumber % 3) + 1 : 0;
      const dueDate = cardNumber % 6 === 0 ? new Date('2024-01-01').toISOString() : undefined;
      const members = (cardNumber % 8 === 0)
        ? [
            { id: `m-a-${i}`, initials: 'AR', color: '#f97316' },
            { id: `m-b-${i}`, initials: 'MS', color: '#22c55e' },
          ]
        : [];
      
      cards.push({
        id: `card-${i}`,
        title: `Task ${cardNumber}`,
        description: `This is the description for task ${cardNumber}`,
        status,
        labels,
        checklistDone,
        checklistTotal,
        comments,
        attachments,
        dueDate,
        members,
      });
    }
  }
  
  return cards;
};

let allCards: Card[] = [];

// Message types
interface GenerateMessage {
  type: 'GENERATE';
  count: number;
}

interface FilterMessage {
  type: 'FILTER';
  searchQuery: string;
  visibleCount: { [key in CardStatus]: number };
  maxSearchResults: number; // Limit results to prevent UI freeze
}

interface UpdateCardMessage {
  type: 'UPDATE_CARD';
  id: string;
  updates: Partial<Card>;
}

interface AddCardMessage {
  type: 'ADD_CARD';
  card: Omit<Card, 'id'>;
}

interface DeleteCardMessage {
  type: 'DELETE_CARD';
  id: string;
}

interface MoveCardMessage {
  type: 'MOVE_CARD';
  id: string;
  status: CardStatus;
  overId?: string;
}

interface ReorderCardsMessage {
  type: 'REORDER_CARDS';
  activeId: string;
  overId: string;
}

interface ResetMessage {
  type: 'RESET';
}

type WorkerMessage = 
  | GenerateMessage 
  | FilterMessage 
  | UpdateCardMessage 
  | AddCardMessage 
  | DeleteCardMessage 
  | MoveCardMessage
  | ReorderCardsMessage
  | ResetMessage;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const message = e.data;

  switch (message.type) {
    case 'GENERATE': {
      allCards = generateFakeCards(message.count);
      self.postMessage({
        type: 'GENERATED',
        cards: allCards,
      });
      break;
    }

    case 'FILTER': {
      const { searchQuery, visibleCount, maxSearchResults } = message;
      let filtered = allCards;

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = allCards.filter(
          (card) =>
            card.title.toLowerCase().includes(query) ||
            card.description.toLowerCase().includes(query)
        );
      }

      // Separate by status
      const todoCards = filtered.filter((c) => c.status === 'todo');
      const inprogressCards = filtered.filter((c) => c.status === 'inprogress');
      const doneCards = filtered.filter((c) => c.status === 'done');

      // Limit results to prevent UI freeze
      // When searching, cap at maxSearchResults per column instead of showing ALL
      const isSearching = searchQuery.trim().length > 0;
      const limit = isSearching ? maxSearchResults : Infinity;

      const todo = todoCards.slice(0, isSearching ? limit : visibleCount.todo);
      const inprogress = inprogressCards.slice(0, isSearching ? limit : visibleCount.inprogress);
      const done = doneCards.slice(0, isSearching ? limit : visibleCount.done);

      self.postMessage({
        type: 'FILTERED',
        cards: {
          todo,
          inprogress,
          done,
        },
        totals: {
          todo: todoCards.length,
          inprogress: inprogressCards.length,
          done: doneCards.length,
        },
      });
      break;
    }

    case 'UPDATE_CARD': {
      const { id, updates } = message;
      const index = allCards.findIndex((c) => c.id === id);
      if (index !== -1) {
        allCards[index] = { ...allCards[index], ...updates };
      }
      self.postMessage({
        type: 'UPDATED',
        cards: allCards,
      });
      break;
    }

    case 'ADD_CARD': {
      const newCard: Card = {
        ...message.card,
        labels: message.card.labels ?? [],
        id: `card-${Math.random().toString(36).substr(2, 9)}`,
      };
      allCards = [newCard, ...allCards];
      self.postMessage({
        type: 'UPDATED',
        cards: allCards,
      });
      break;
    }

    case 'DELETE_CARD': {
      allCards = allCards.filter((c) => c.id !== message.id);
      self.postMessage({
        type: 'UPDATED',
        cards: allCards,
      });
      break;
    }

    case 'MOVE_CARD': {
      const { id, status, overId } = message;
      const cardIndex = allCards.findIndex((c) => c.id === id);
      if (cardIndex === -1) break;
      
      const card = allCards[cardIndex];
      if (card.status === status) break;
      
      const newCards = allCards.filter((c) => c.id !== id);
      
      if (overId) {
        const targetIndex = newCards.findIndex((c) => c.id === overId);
        if (targetIndex !== -1) {
          newCards.splice(targetIndex, 0, { ...card, status });
        } else {
          const firstCardIndex = newCards.findIndex((c) => c.status === status);
          if (firstCardIndex === -1) {
            newCards.push({ ...card, status });
          } else {
            newCards.splice(firstCardIndex, 0, { ...card, status });
          }
        }
      } else {
        const firstCardIndex = newCards.findIndex((c) => c.status === status);
        if (firstCardIndex === -1) {
          newCards.push({ ...card, status });
        } else {
          newCards.splice(firstCardIndex, 0, { ...card, status });
        }
      }
      
      allCards = newCards;
      self.postMessage({
        type: 'UPDATED',
        cards: allCards,
      });
      break;
    }

    case 'REORDER_CARDS': {
      const { activeId, overId } = message;
      const oldIndex = allCards.findIndex((c) => c.id === activeId);
      const newIndex = allCards.findIndex((c) => c.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) break;
      
      const newCards = [...allCards];
      const [movedCard] = newCards.splice(oldIndex, 1);
      newCards.splice(newIndex, 0, movedCard);
      
      allCards = newCards;
      self.postMessage({
        type: 'UPDATED',
        cards: allCards,
      });
      break;
    }

    case 'RESET': {
      allCards = generateFakeCards(5000);
      self.postMessage({
        type: 'UPDATED',
        cards: allCards,
      });
      break;
    }
  }
};

export {};

