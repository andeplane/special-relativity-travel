# Coding Standards

## 1. Dependency Injection

Inject dependencies via React context (hooks/components) or factory-override pattern (plain functions). Never hard-code dependencies.

**React context**
```typescript
const defaultDeps = { useDataSource, useAnalytics };
export type MyHookContextType = typeof defaultDeps;
export const MyHookContext = createContext<MyHookContextType>(defaultDeps);

export function useMyHook() {
  const { useDataSource } = useContext(MyHookContext);
}
```

**Factory overrides**
```typescript
type Deps = { serviceFactory: () => SomeService };
const defaultDeps: Deps = { serviceFactory: () => new SomeServiceImpl() };

export const doWork = async (props: Props, overrides?: Partial<Deps>) => {
  const { serviceFactory } = { ...defaultDeps, ...overrides };
};
```

---

## 2. Interface-Based Services

Define an interface; implement with a class. Never reference the concrete class outside its own file.

```typescript
export interface DataService {
  load(): Promise<Data>;
  save(data: Data): Promise<void>;
}

export class ApiDataService implements DataService { /* ... */ }
```

---

## 3. ViewModel Pattern

Business logic lives in `use<Name>ViewModel`. Components only render.

```typescript
export function useTodoViewModel(): TodoViewModel {
  const { useTodoStorage, addTodoCommand } = useContext(TodoViewModelContext);
  const storage = useTodoStorage();
  const addTodo = useCallback((text: string) => addTodoCommand(text, storage), [storage, addTodoCommand]);
  return { todos: storage.listAllTodos(), addTodo };
}

export const TodoView = () => {
  const { todos, addTodo } = useTodoViewModel();
  return <ul>{todos.map(t => <TodoItem key={t.id} todo={t} onAdd={addTodo} />)}</ul>;
};
```

---

## 4. Test-Driven Development

### File creation order
1. Integration tests
2. Unit tests
3. Source files to make tests pass

### Conventions
- Files: `*.test.ts(x)` — runner: **Vitest** (`pnpm test` to run all, `vitest run` within a package)
- Structure: Arrange / Act / Assert (explicit comments when test > ~10 statements)
- One behavior per test; helper functions at the bottom of the file
- Prefer context injection over `vi.mock`; always add a comment when `vi.mock` is unavoidable

### Type-safe mocks
```typescript
// Preferred: vi.fn(() => ...) for consistent behavior
mockContext = { useUserInfo: vi.fn(() => ({ data: mockUser, isFetched: true })) };

// For per-test reconfiguration
mockContext = { useUserInfo: vi.fn() };
vi.mocked(mockContext.useUserInfo).mockReturnValue({ data: undefined, isFetched: true });
```

For full interface mocks, use `assert.fail` on methods the unit under test should never call — or better, use narrow interfaces that only expose what is needed.

```typescript
mockStorage = {
  list: vi.fn(),
  retrieve: vi.fn(() => { assert.fail('Not implemented'); }),
};
```

### React hooks
```typescript
describe(useMyHook.name, () => {
  let mockContext: MyContextType;
  let wrapper: ComponentType<{ children: ReactNode }>;

  beforeEach(() => {
    mockContext = { useUserInfo: vi.fn(() => ({ data: mockUser })) };
    wrapper = ({ children }) => (
      <MyHookContext.Provider value={mockContext}>{children}</MyHookContext.Provider>
    );
  });

  it('should ...', async () => {
    const { result } = renderHook(() => useMyHook(), { wrapper });

    await act(async () => { await result.current.someAction(); });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
```

### Type rules
- Never use `any` — prefer `unknown` or strong types
- No `as unknown as T` casts; for partial mocks use `{ ...defaults, ...overrides } as T`

```typescript
function createMockWindow(overrides: Partial<Window> = {}): Window {
  return { postMessage: vi.fn(), ...overrides } as Window;
}
```

- Use direct React type imports: `import type { ComponentType, ReactNode } from 'react'`

### Shared mock data
Place reusable factories in `src/__mocks__/`. Use `.test` TLD for fake URLs (RFC 2606).
