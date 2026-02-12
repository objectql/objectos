/**
 * DevDataProvider — wraps mock data injection in development only.
 *
 * In production builds, the mock data modules are never imported because
 * the dynamic `import()` is behind an `import.meta.env.DEV` guard which
 * Vite statically evaluates and tree-shakes.
 *
 * Usage:
 *   <DevDataProvider>
 *     <App />
 *   </DevDataProvider>
 *
 * Consumers access mock data via `useDevData()`:
 *   const { useMocks, mockData } = useDevData();
 *
 * @module apps/web/src/providers/dev-data-provider
 * @see docs/guide/technical-debt-resolution.md — TD-8
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

export interface DevDataContextType {
  /** Whether mock data fallback is active */
  useMocks: boolean;
  /** Loaded mock data modules (null until loaded) */
  mockData: Record<string, unknown> | null;
  /** Loaded workflow mock data (null until loaded) */
  mockWorkflowData: Record<string, unknown> | null;
}

const DevDataContext = createContext<DevDataContextType>({
  useMocks: false,
  mockData: null,
  mockWorkflowData: null,
});

export function DevDataProvider({ children }: { children: ReactNode }) {
  const [mockData, setMockData] = useState<Record<string, unknown> | null>(null);
  const [mockWorkflowData, setMockWorkflowData] = useState<Record<string, unknown> | null>(null);

  const useMocks =
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_MOCK_DATA !== 'false';

  useEffect(() => {
    if (useMocks) {
      void import('../lib/__mocks__/mock-data').then((m) => {
        setMockData(m as unknown as Record<string, unknown>);
      });
      void import('../lib/__mocks__/mock-workflow-data').then((m) => {
        setMockWorkflowData(m as unknown as Record<string, unknown>);
      });

      console.warn(
        '[ObjectOS] Mock data is active. Set VITE_USE_MOCK_DATA=false to disable.',
      );
    }
  }, [useMocks]);

  return (
    <DevDataContext.Provider value={{ useMocks, mockData, mockWorkflowData }}>
      {children}
    </DevDataContext.Provider>
  );
}

export const useDevData = () => useContext(DevDataContext);
