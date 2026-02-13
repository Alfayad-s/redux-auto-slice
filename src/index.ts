/**
 * redux-auto-slice – Redux Toolkit utility for auto-generating slices
 */

import {
  createSlice,
  type PayloadAction,
  type Slice,
  type AsyncThunk,
} from '@reduxjs/toolkit';

export const VERSION = '1.0.0';

/** Status for async thunk lifecycle. */
export type AsyncStatus = 'idle' | 'pending' | 'fulfilled' | 'rejected';

/** State fields added when asyncThunks is provided. */
export interface AsyncStateFields {
  loading: boolean;
  error: string | null;
  status: AsyncStatus;
}

const DEFAULT_ASYNC_STATE: AsyncStateFields = {
  loading: false,
  error: null,
  status: 'idle',
};

/** Normalized entity state (createEntityAdapter-style). Entities must have an `id` field. */
export interface EntityState<T extends { id: string | number }> {
  entities: Record<string, T>;
  ids: string[];
}

/** How action creator keys are named. */
export type ActionNaming = 'short' | 'prefixed';

/** Custom reducer function (state, action) => newState | void. */
export type CustomReducer<State> = (state: State, action: PayloadAction<unknown>) => State | void;

/** Config for array adapter (default). */
export interface CreateAutoSliceConfigArray<T = unknown> {
  name: string;
  adapter?: 'array';
  initialState: T[];
  reducers: string[];
  /** Extra reducers by name. Keys become action types. */
  customReducers?: Record<string, CustomReducer<T[]>>;
  /** 'short' = action keys like `add`, `remove`. 'prefixed' = `${name}${Capitalize(key)}` e.g. `itemsAdd`. */
  actionNaming?: ActionNaming;
  /** Async thunks; adds extraReducers for pending/fulfilled/rejected and injects loading/error/status into state. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accept any async thunk signature
  asyncThunks?: Record<string, AsyncThunk<any, any, any>>;
}

/** Config for entity adapter. initialState must be EntityState. */
export interface CreateAutoSliceConfigEntity<T extends { id: string | number }> {
  name: string;
  adapter: 'entity';
  initialState: EntityState<T>;
  reducers: string[];
  /** Extra reducers by name. Keys become action types. */
  customReducers?: Record<string, CustomReducer<EntityState<T>>>;
  /** 'short' = action keys like `add`, `remove`. 'prefixed' = `${name}${Capitalize(key)}` e.g. `usersAdd`. */
  actionNaming?: ActionNaming;
  /** Async thunks; adds extraReducers for pending/fulfilled/rejected and injects loading/error/status into state. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accept any async thunk signature
  asyncThunks?: Record<string, AsyncThunk<any, any, any>>;
}

export type CreateAutoSliceConfig<T = unknown> =
  | CreateAutoSliceConfigArray<T>
  | CreateAutoSliceConfigEntity<T extends { id: string | number } ? T : never>;

/** Result for array adapter. */
export interface CreateAutoSliceResultArray<T> {
  slice: Slice<T[]>;
  actions: Slice<T[]>['actions'];
  selectors: {
    selectAll: (state: T[]) => T[];
    selectTotal: (state: T[]) => number;
  };
}

/** Result for entity adapter. */
export interface CreateAutoSliceResultEntity<T extends { id: string | number }> {
  slice: Slice<EntityState<T>>;
  actions: Slice<EntityState<T>>['actions'];
  selectors: {
    selectAll: (state: EntityState<T>) => T[];
    selectTotal: (state: EntityState<T>) => number;
    selectIds: (state: EntityState<T>) => string[];
    selectEntities: (state: EntityState<T>) => Record<string, T>;
    selectById: (state: EntityState<T>, id: string | number) => T | undefined;
  };
}

export type CreateAutoSliceResult<T> =
  | CreateAutoSliceResultArray<T>
  | CreateAutoSliceResultEntity<T extends { id: string | number } ? T : never>;

// ---------------------------------------------------------------------------
// Exported option/result aliases (AutoSliceOptions / AutoSliceResult)
// ---------------------------------------------------------------------------

/** Options for array adapter. State inferred from initialState (T[]). */
export type AutoSliceOptionsArray<T = unknown> = CreateAutoSliceConfigArray<T>;

/** Options for entity adapter. Entity type T inferred from initialState. */
export type AutoSliceOptionsEntity<T extends { id: string | number } = { id: string | number }> =
  CreateAutoSliceConfigEntity<T>;

/** Union of all createAutoSlice option types. */
export type AutoSliceOptions<T = unknown> = CreateAutoSliceConfig<T>;

/** Result for array adapter. State is T[]. */
export type AutoSliceResultArray<T> = CreateAutoSliceResultArray<T>;

/** Result for entity adapter. State is EntityState<T>. */
export type AutoSliceResultEntity<T extends { id: string | number }> = CreateAutoSliceResultEntity<T>;

/** Union of all createAutoSlice result types. */
export type AutoSliceResult<T> = CreateAutoSliceResult<T>;

// ---------------------------------------------------------------------------
// Infer state type from options (for use in store or selectors)
// ---------------------------------------------------------------------------

/** Infer array item type T from array options (initialState is T[]). */
export type InferArrayItem<O> = O extends { initialState: (infer T)[] } ? T : never;

/** Infer entity type T from entity options (initialState is EntityState<T>). */
export type InferEntityFromOptions<O> = O extends { initialState: EntityState<infer T> } ? T : never;

/** Infer slice state type from array options. With asyncThunks this is { data: T[] } & AsyncStateFields. */
export type InferArrayState<O> = O extends { initialState: (infer T)[] }
  ? O extends { asyncThunks: Record<string, unknown> }
    ? { data: T[] } & AsyncStateFields
    : T[]
  : never;

/** Infer slice state type from entity options. With asyncThunks includes AsyncStateFields. */
export type InferEntityState<O> = O extends { initialState: EntityState<infer T> }
  ? O extends { asyncThunks: Record<string, unknown> }
    ? EntityState<T> & AsyncStateFields
    : EntityState<T>
  : never;

// ---------------------------------------------------------------------------
// Action payload types (for typing dispatch or custom code)
// ---------------------------------------------------------------------------

/** Payload types for array adapter built-in reducers. */
export interface ArrayReducerPayloads<T> {
  add: T;
  remove: T | { id: string | number };
  clear: void;
  update: { at: number; value: T } | { id: string | number; changes: Partial<T> };
  set: T[];
  addMany: T[];
  removeMany: T[] | (string | number)[];
  upsert: T | T[];
}

/** Payload types for entity adapter built-in reducers. */
export interface EntityReducerPayloads<T extends { id: string | number }> {
  add: T | T[];
  remove: string | number | (string | number)[];
  update: { id: string | number; changes: Partial<T> };
  clear: void;
  set: EntityState<T>;
  addMany: T[];
  removeMany: string | number | (string | number)[];
  upsert: T | T[];
  increment: { id: string | number; field?: string; amount?: number };
  toggle: { id: string | number; field?: string };
}

/** Extract slice state type from a createAutoSlice result (for RootState). */
export type SliceStateFromResult<R> = R extends { slice: Slice<infer S> } ? S : never;

const ARRAY_REDUCERS = [
  'add',
  'remove',
  'clear',
  'update',
  'set',
  'addMany',
  'removeMany',
  'upsert',
] as const;
const ENTITY_REDUCERS = [
  'add',
  'remove',
  'update',
  'clear',
  'set',
  'addMany',
  'removeMany',
  'upsert',
  'increment',
  'toggle',
] as const;
type ArrayReducerName = (typeof ARRAY_REDUCERS)[number];
type EntityReducerName = (typeof ENTITY_REDUCERS)[number];

function isArrayReducer(name: string): name is ArrayReducerName {
  return ARRAY_REDUCERS.includes(name as ArrayReducerName);
}

function isEntityReducer(name: string): name is EntityReducerName {
  return ENTITY_REDUCERS.includes(name as EntityReducerName);
}

function toId(id: string | number): string {
  return String(id);
}

/**
 * Returns empty entity state for use as initialState with entity adapter.
 * Typed so that EntityState<T> is inferred when passed to createAutoSlice.
 */
export function getEmptyEntityState<T extends { id: string | number }>(): EntityState<T> {
  return { entities: {}, ids: [] };
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function actionKey(name: string, reducerName: string, actionNaming?: ActionNaming): string {
  return actionNaming === 'prefixed' ? name + capitalize(reducerName) : reducerName;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- accept any async thunk signature
type AsyncThunkMap = Record<string, AsyncThunk<any, any, any>>;

function addAsyncExtraReducers<S extends AsyncStateFields>(
  builder: { addCase: (actionCreator: { match: (a: unknown) => boolean }, reducer: (state: S, action: unknown) => void) => void },
  asyncThunks: AsyncThunkMap
): void {
  for (const thunk of Object.values(asyncThunks)) {
    builder.addCase(thunk.pending, (state: S) => {
      state.loading = true;
      state.error = null;
      state.status = 'pending';
    });
    builder.addCase(thunk.fulfilled, (state: S) => {
      state.loading = false;
      state.error = null;
      state.status = 'fulfilled';
    });
    builder.addCase(thunk.rejected, (state: S, action: unknown) => {
      state.loading = false;
      const a = action as { error?: { message?: string }; payload?: string };
      state.error = a.payload ?? a.error?.message ?? 'Request failed';
      state.status = 'rejected';
    });
  }
}

type ArrayReducerMap<T> = Record<string, (state: T[], action: PayloadAction<unknown>) => T[] | void>;

function createArrayReducers<T>(
  reducers: string[],
  options?: { name: string; actionNaming?: ActionNaming }
): ArrayReducerMap<T> {
  const { name = '', actionNaming } = options ?? {};
  const key = (r: string) => actionKey(name, r, actionNaming);
  const reducersMap: ArrayReducerMap<T> = {};
  for (const reducerName of reducers) {
    if (!isArrayReducer(reducerName)) continue;
    const k = key(reducerName);
    switch (reducerName) {
      case 'add':
        reducersMap[k] = (state, action) => {
          state.push(action.payload as T);
        };
        break;
      case 'remove':
        reducersMap[k] = (state, action) => {
          const payload = action.payload as { id?: string | number } | T;
          if (payload !== null && typeof payload === 'object' && 'id' in payload) {
            return state.filter((item: unknown) => (item as { id?: string | number }).id !== payload.id);
          }
          return state.filter((item) => item !== payload);
        };
        break;
      case 'clear':
        reducersMap[k] = () => [] as T[];
        break;
      case 'update': {
        reducersMap[k] = (state, action) => {
          const payload = action.payload as { at: number; value: T } | { id: string | number; changes: Partial<T> };
          if (payload !== null && typeof payload === 'object') {
            if ('at' in payload && typeof payload.at === 'number') {
              if (payload.at >= 0 && payload.at < state.length) {
                state[payload.at] = payload.value as T;
              }
              return;
            }
            if ('id' in payload && 'changes' in payload) {
              const idx = state.findIndex((item: unknown) => (item as { id?: string | number }).id === payload.id);
              if (idx >= 0 && state[idx] !== null && typeof state[idx] === 'object') {
                (state[idx] as T) = { ...state[idx], ...payload.changes } as T;
              }
            }
          }
        };
        break;
      }
      case 'set':
        reducersMap[k] = (_, action) => (action.payload as T[]) ?? [];
        break;
      case 'addMany':
        reducersMap[k] = (state, action) => {
          const items = action.payload as T[];
          if (Array.isArray(items)) state.push(...items);
        };
        break;
      case 'removeMany':
        reducersMap[k] = (state, action) => {
          const payload = action.payload as T[] | (string | number)[];
          const arr = Array.isArray(payload) ? payload : [payload];
          const first = arr[0];
          const isIds =
            arr.length > 0 &&
            first !== null &&
            typeof first === 'object' &&
            'id' in first &&
            (typeof (first as { id: string | number }).id === 'string' ||
              typeof (first as { id: string | number }).id === 'number');
          if (isIds) {
            const idSet = new Set(
              (arr as Array<{ id: string | number }>).map((x) => toId(x.id))
            );
            return state.filter((item: unknown) => !idSet.has(toId((item as { id: string | number }).id)));
          }
          const valueSet = new Set(arr as T[]);
          return state.filter((item) => !valueSet.has(item));
        };
        break;
      case 'upsert':
        reducersMap[k] = (state, action) => {
          const payload = action.payload as T | T[];
          const items = Array.isArray(payload) ? payload : [payload];
          for (const entity of items) {
            const e = entity as unknown as { id?: string | number };
            const idx = state.findIndex((item: unknown) => (item as { id?: string | number }).id === e?.id);
            if (idx >= 0) (state[idx] as T) = entity;
            else state.push(entity);
          }
        };
        break;
    }
  }
  return reducersMap;
}

type EntityReducerMap<T extends { id: string | number }> = Record<
  string,
  (state: EntityState<T>, action: PayloadAction<unknown>) => EntityState<T> | void
>;

function createEntityReducers<T extends { id: string | number }>(
  reducers: string[],
  options?: { name: string; actionNaming?: ActionNaming }
): EntityReducerMap<T> {
  const { name = '', actionNaming } = options ?? {};
  const key = (r: string) => actionKey(name, r, actionNaming);
  const reducersMap: EntityReducerMap<T> = {};
  for (const reducerName of reducers) {
    if (!isEntityReducer(reducerName)) continue;
    const k = key(reducerName);
    switch (reducerName) {
      case 'add': {
        reducersMap[k] = (state, action) => {
          const payload = action.payload as T | T[];
          const items = Array.isArray(payload) ? payload : [payload];
          for (const entity of items) {
            const id = toId(entity.id);
            state.entities[id] = entity as T;
            if (!state.ids.includes(id)) {
              state.ids.push(id);
            }
          }
        };
        break;
      }
      case 'remove': {
        reducersMap[k] = (state, action) => {
          const payload = action.payload as string | number | (string | number)[];
          const idsToRemove = new Set(
            (Array.isArray(payload) ? payload : [payload]).map(toId)
          );
          for (const id of idsToRemove) {
            delete state.entities[id];
          }
          state.ids = state.ids.filter((id) => !idsToRemove.has(id));
        };
        break;
      }
      case 'update': {
        reducersMap[k] = (state, action) => {
          const { id, changes } = action.payload as { id: string | number; changes: Partial<T> };
          const keyId = toId(id);
          const existing = state.entities[keyId];
          if (existing) {
            (state.entities[keyId] as T) = { ...existing, ...changes } as T;
          }
        };
        break;
      }
      case 'clear':
        reducersMap[k] = () => ({ entities: {}, ids: [] });
        break;
      case 'set':
        reducersMap[k] = (_, action) => (action.payload as EntityState<T>) ?? { entities: {}, ids: [] };
        break;
      case 'addMany': {
        reducersMap[k] = (state, action) => {
          const items = (action.payload as T[]) ?? [];
          for (const entity of items) {
            const id = toId(entity.id);
            state.entities[id] = entity as T;
            if (!state.ids.includes(id)) {
              state.ids.push(id);
            }
          }
        };
        break;
      }
      case 'removeMany': {
        reducersMap[k] = (state, action) => {
          const payload = action.payload as string | number | (string | number)[];
          const idsToRemove = new Set(
            (Array.isArray(payload) ? payload : [payload]).map(toId)
          );
          for (const id of idsToRemove) {
            delete state.entities[id];
          }
          state.ids = state.ids.filter((id) => !idsToRemove.has(id));
        };
        break;
      }
      case 'upsert': {
        reducersMap[k] = (state, action) => {
          const payload = action.payload as T | T[];
          const items = Array.isArray(payload) ? payload : [payload];
          for (const entity of items) {
            const id = toId(entity.id);
            state.entities[id] = entity as T;
            if (!state.ids.includes(id)) {
              state.ids.push(id);
            }
          }
        };
        break;
      }
      case 'increment': {
        reducersMap[k] = (state, action) => {
          const { id, field = 'value', amount = 1 } = (action.payload as {
            id: string | number;
            field?: string;
            amount?: number;
          }) ?? {};
          const keyId = toId(id);
          const existing = state.entities[keyId] as Record<string, unknown> | undefined;
          if (existing && field in existing && typeof (existing[field] as number) === 'number') {
            (existing[field] as number) += amount;
          }
        };
        break;
      }
      case 'toggle': {
        reducersMap[k] = (state, action) => {
          const { id, field = 'value' } = (action.payload as { id: string | number; field?: string }) ?? {};
          const keyId = toId(id);
          const existing = state.entities[keyId] as Record<string, unknown> | undefined;
          if (existing && field in existing && typeof (existing[field] as boolean) === 'boolean') {
            (existing[field] as boolean) = !(existing[field] as boolean);
          }
        };
        break;
      }
    }
  }
  return reducersMap;
}

/**
 * Creates a Redux Toolkit slice with reducers generated from a list of names.
 * **Type inference**: `T` is inferred from `initialState` (array item type or entity type).
 * Use `getEmptyEntityState<YourEntity>()` for typed entity initial state.
 *
 * **Array adapter** (default): initialState is T[]
 * - 'add': pushes action.payload
 * - 'remove': filters by id (payload.id) or by value (payload)
 * - 'clear': resets to []
 * - 'update': payload `{ at: number, value: T }` or `{ id, changes }` (items with id)
 * - 'set': replace state with payload (T[])
 * - 'addMany': push all items from payload (T[])
 * - 'removeMany': remove by ids (if payload items have id) or by value
 * - 'upsert': by id – replace or push
 *
 * **Entity adapter**: initialState is { entities: {}, ids: [] }
 * - 'add' / 'upsert': upsert by id (one entity or array)
 * - 'remove': delete by id (one id or array of ids)
 * - 'update': payload `{ id, changes }` – merge into entity
 * - 'clear': resets to { entities: {}, ids: [] }
 * - 'set': replace entire state with payload (EntityState<T>)
 * - 'addMany' / 'removeMany': bulk add or remove by ids
 * - 'increment': payload `{ id, field?, amount? }` – increment numeric field (default field 'value', amount 1)
 * - 'toggle': payload `{ id, field? }` – toggle boolean field (default field 'value')
 *
 * **Options**
 * - `customReducers`: object of name -> (state, action) => newState | void; keys become action creators.
 * - `actionNaming`: 'short' (default) – keys like `add`, `remove`; 'prefixed' – keys like `itemsAdd`, `itemsRemove`.
 * - `asyncThunks`: object of thunk creators (e.g. from createAsyncThunk). Adds extraReducers for pending/fulfilled/rejected
 *   and injects `loading`, `error`, `status` into state. Initial state is extended with `{ loading: false, error: null, status: 'idle' }`.
 *   For array adapter, state becomes `{ data, loading, error, status }`; sync reducers operate on `data`. Selectors include selectLoading, selectError, selectStatus.
 *
 * @see AutoSliceOptions – config type union
 * @see AutoSliceResult – return type union
 * @see ArrayReducerPayloads / EntityReducerPayloads – action payload types
 * @see SliceStateFromResult – extract state type for RootState
 */
/* eslint-disable no-redeclare -- TypeScript overload signatures */
export function createAutoSlice<T>(config: CreateAutoSliceConfigArray<T>): CreateAutoSliceResultArray<T>;
export function createAutoSlice<T extends { id: string | number }>(
  config: CreateAutoSliceConfigEntity<T>
): CreateAutoSliceResultEntity<T>;
export function createAutoSlice<T>(
  config: CreateAutoSliceConfig<T>
): CreateAutoSliceResult<T> {
  const adapter = 'adapter' in config ? config.adapter : 'array';

  if (adapter === 'entity') {
    const {
      name,
      initialState,
      reducers,
      customReducers: customEntityReducers,
      actionNaming,
      asyncThunks,
    } = config as CreateAutoSliceConfigEntity<T & { id: string | number }>;
    const entityReducers = createEntityReducers<T & { id: string | number }>(reducers, {
      name,
      actionNaming,
    });
    const mergedEntity: EntityReducerMap<T & { id: string | number }> = { ...entityReducers };
    if (customEntityReducers) {
      for (const [customName, fn] of Object.entries(customEntityReducers)) {
        mergedEntity[actionKey(name, customName, actionNaming)] = fn;
      }
    }
    const hasAsync = asyncThunks && Object.keys(asyncThunks).length > 0;

    if (hasAsync) {
      type EntityStateWithAsync = EntityState<T & { id: string | number }> & AsyncStateFields;
      const entityAsyncInitialState: EntityStateWithAsync = {
        ...initialState,
        ...DEFAULT_ASYNC_STATE,
      };
      const slice = createSlice({
        name,
        initialState: entityAsyncInitialState,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic reducers built from config
        reducers: mergedEntity as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- builder type from RTK
        extraReducers: (builder) => addAsyncExtraReducers(builder as any, asyncThunks),
        selectors: {
          selectAll: (state: EntityStateWithAsync) => state.ids.map((id) => state.entities[id]).filter(Boolean),
          selectTotal: (state: EntityStateWithAsync) => state.ids.length,
          selectIds: (state: EntityStateWithAsync) => state.ids,
          selectEntities: (state: EntityStateWithAsync) => state.entities,
          selectById: (state: EntityStateWithAsync, id: string | number) => state.entities[toId(id)],
          selectLoading: (state: EntityStateWithAsync) => state.loading,
          selectError: (state: EntityStateWithAsync) => state.error,
          selectStatus: (state: EntityStateWithAsync) => state.status,
        },
      });
      const localSelectors = slice.getSelectors();
      return {
        slice,
        actions: { ...slice.actions, ...asyncThunks },
        selectors: {
          selectAll: localSelectors.selectAll,
          selectTotal: localSelectors.selectTotal,
          selectIds: localSelectors.selectIds,
          selectEntities: localSelectors.selectEntities,
          selectById: localSelectors.selectById,
          selectLoading: localSelectors.selectLoading,
          selectError: localSelectors.selectError,
          selectStatus: localSelectors.selectStatus,
        },
      } as unknown as CreateAutoSliceResult<T>;
    }

    const slice = createSlice({
      name,
      initialState,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic reducers built from config
      reducers: mergedEntity as any,
      selectors: {
        selectAll: (state) => state.ids.map((id) => state.entities[id]).filter(Boolean),
        selectTotal: (state) => state.ids.length,
        selectIds: (state) => state.ids,
        selectEntities: (state) => state.entities,
        selectById: (state: EntityState<T & { id: string | number }>, id: string | number) =>
          state.entities[toId(id)],
      },
    });
    const localSelectors = slice.getSelectors();
    return {
      slice,
      actions: slice.actions,
      selectors: {
        selectAll: localSelectors.selectAll,
        selectTotal: localSelectors.selectTotal,
        selectIds: localSelectors.selectIds,
        selectEntities: localSelectors.selectEntities,
        selectById: localSelectors.selectById,
      },
    } as CreateAutoSliceResult<T>;
  }

  const {
    name,
    initialState,
    reducers,
    customReducers: customArrayReducers,
    actionNaming,
    asyncThunks,
  } = config as CreateAutoSliceConfigArray<T>;
  const arrayReducers = createArrayReducers<T>(reducers, { name, actionNaming });
  const mergedArray = { ...arrayReducers };
  if (customArrayReducers) {
    for (const [customName, fn] of Object.entries(customArrayReducers)) {
      mergedArray[actionKey(name, customName, actionNaming)] = fn;
    }
  }
  const hasAsync = asyncThunks && Object.keys(asyncThunks).length > 0;

  if (hasAsync) {
    type AsyncArrayState = { data: T[] } & AsyncStateFields;
    const asyncInitialState: AsyncArrayState = {
      data: initialState,
      ...DEFAULT_ASYNC_STATE,
    };
    const wrappedReducers: Record<string, (state: AsyncArrayState, action: PayloadAction<unknown>) => void> = {};
    for (const [key, reducer] of Object.entries(mergedArray)) {
      wrappedReducers[key] = (state, action) => {
        const result = (reducer as (s: T[], a: PayloadAction<unknown>) => T[] | void)(state.data, action);
        if (result !== undefined) state.data = result;
      };
    }
    const slice = createSlice({
      name,
      initialState: asyncInitialState,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic reducers built from config
      reducers: wrappedReducers as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- builder type from RTK
      extraReducers: (builder) => addAsyncExtraReducers(builder as any, asyncThunks),
      selectors: {
        selectAll: (state: AsyncArrayState) => state.data,
        selectTotal: (state: AsyncArrayState) => state.data.length,
        selectLoading: (state: AsyncArrayState) => state.loading,
        selectError: (state: AsyncArrayState) => state.error,
        selectStatus: (state: AsyncArrayState) => state.status,
      },
    });
    const localSelectors = slice.getSelectors();
    return {
      slice,
      actions: { ...slice.actions, ...asyncThunks },
      selectors: {
        selectAll: localSelectors.selectAll,
        selectTotal: localSelectors.selectTotal,
        selectLoading: localSelectors.selectLoading,
        selectError: localSelectors.selectError,
        selectStatus: localSelectors.selectStatus,
      },
    } as unknown as CreateAutoSliceResult<T>;
  }

  const slice = createSlice({
    name,
    initialState,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic reducers built from config
    reducers: mergedArray as any,
    selectors: {
      selectAll: (state: T[]) => state,
      selectTotal: (state: T[]) => state.length,
    },
  });
  const localSelectors = slice.getSelectors();
  return {
    slice,
    actions: slice.actions,
    selectors: {
      selectAll: localSelectors.selectAll,
      selectTotal: localSelectors.selectTotal,
    },
  } as CreateAutoSliceResult<T>;
}
/* eslint-enable no-redeclare */
