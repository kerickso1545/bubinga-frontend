import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './types';

interface ViewerState {
  scale: number;
  positionX: number;
  positionY: number;
  setViewerState: (state: { scale: number; positionX: number; positionY: number }) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  scale: 1,
  positionX: 0,
  positionY: 0,
  setViewerState: (state) => set(state),
}));

interface ExcerptState {
  zoom: number;
  setZoom: (zoom: number) => void;
}

export const useExcerptStore = create<ExcerptState>()((set) => ({
  zoom: 1.0,
  setZoom: (zoom) => set({ zoom }),
}));

interface LayoutState {
  isToolbarExpanded: boolean;
  setToolbarExpanded: (expanded: boolean) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      isToolbarExpanded: false,
      setToolbarExpanded: (expanded) => set({ isToolbarExpanded: expanded }),
    }),
    {
      name: 'layout-storage',
    }
  )
);

interface ExceptionCounts {
  classification: number;
  extraction: number;
  isLoading: boolean;
  error: string | null;
  fetchCounts: () => Promise<void>;
}

export const useExceptionCountStore = create<ExceptionCounts>((set) => ({
  classification: 0,
  extraction: 0,
  isLoading: false,
  error: null,
  fetchCounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'}/exceptions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const classificationCount = data.filter(ex => ex.step === 'classification').length;
      const extractionCount = data.filter(ex => ex.step === 'extraction').length;
      
      set({ 
        classification: classificationCount, 
        extraction: extractionCount,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch exception counts:', error);
      set({ 
        error: 'Failed to load counts', 
        isLoading: false 
      });
    }
  }
}));

interface UserPreferences {
  hasVisitedClassification: boolean;
  hasVisitedExtraction: boolean;
}

interface AuthStore {
  user: User | null;
  preferences: UserPreferences;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  markClassificationVisited: () => void;
  markExtractionVisited: () => void;
}

function getWebContainerBase() {
  const url = new URL(window.location.href);
  const parts = url.hostname.split('.');
  if (parts.length >= 2 && parts[1] === 'local-credentialless') {
    return parts[0];
  }
  return window.location.origin;
}

const STORAGE_KEY = `auth-storage-${getWebContainerBase()}`;

function broadcastAuthState(user: User | null, preferences: UserPreferences) {
  const channel = new BroadcastChannel(STORAGE_KEY);
  channel.postMessage({ user, preferences });
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      preferences: {
        hasVisitedClassification: false,
        hasVisitedExtraction: false
      },
      login: async (email: string, password: string) => {
        if (email === 'demo@example.com' && password === 'demo') {
          const user = {
            id: '1',
            name: 'Demo User',
            email: 'demo@example.com',
            roles: ['classification', 'extraction'] as const,
          };
          set(state => {
            const newState = {
              user,
              preferences: {
                hasVisitedClassification: false,
                hasVisitedExtraction: false
              }
            };
            broadcastAuthState(user, newState.preferences);
            return newState;
          });
        } else {
          throw new Error('Invalid credentials');
        }
      },
      logout: () => {
        set({ user: null, preferences: { hasVisitedClassification: false, hasVisitedExtraction: false } });
        broadcastAuthState(null, { hasVisitedClassification: false, hasVisitedExtraction: false });
      },
      markClassificationVisited: () => {
        set(state => {
          const newPreferences = {
            ...state.preferences,
            hasVisitedClassification: true
          };
          broadcastAuthState(state.user, newPreferences);
          return { ...state, preferences: newPreferences };
        });
      },
      markExtractionVisited: () => {
        set(state => {
          const newPreferences = {
            ...state.preferences,
            hasVisitedExtraction: true
          };
          broadcastAuthState(state.user, newPreferences);
          return { ...state, preferences: newPreferences };
        });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          if (!str) return null;
          try {
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value));
          } catch {}
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);

if (typeof window !== 'undefined') {
  const channel = new BroadcastChannel(STORAGE_KEY);
  channel.onmessage = (event) => {
    const { user, preferences } = event.data;
    useAuthStore.setState({ user, preferences });
  };
}