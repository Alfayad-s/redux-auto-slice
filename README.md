# redux-auto-slice

Generate Redux Toolkit slices from a list of reducer names. Get typed actions, selectors, and optional async state without writing boilerplate.

## Why use it?

- **Less boilerplate** — Declare reducer names (`['add', 'remove', 'clear']`) instead of writing each reducer and action by hand.
- **CRUD out of the box** — Array and entity adapters with `add` / `remove` / `update` / `upsert` / `addMany` / `removeMany` and more.
- **Async built-in** — Pass `createAsyncThunk` instances; get `loading`, `error`, and `status` in state and matching selectors.
- **Typed** — State and actions infer from `initialState`; optional payload types and helpers for RootState.

## Installation

```bash
npm install redux-auto-slice
```

**Peer dependency:** `@reduxjs/toolkit` (required).

---

## Quick start (3 steps)

**1. Create a slice** — Pick a name, initial state, and which reducers you want:

```ts
import { createAutoSlice } from 'redux-auto-slice';

const { slice, actions, selectors } = createAutoSlice({
  name: 'items',
  initialState: [] as string[],
  reducers: ['add', 'remove', 'clear'],
});
```

**2. Add the slice to your store** — Use the slice’s name and reducer:

```ts
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    [slice.name]: slice.reducer,
  },
});
```

**3. Dispatch actions and read state** — Use the generated actions and selectors:

```ts
store.dispatch(actions.add('apple'));
store.dispatch(actions.add('banana'));
const items = selectors.selectAll(store.getState().items);  // ['apple', 'banana']
const count = selectors.selectTotal(store.getState().items); // 2
store.dispatch(actions.remove('apple'));
store.dispatch(actions.clear(undefined));
```

That’s it. For lists of objects, entity (normalized) state, or async fetching, see the examples below.

---

## Usage

### Basic array state

```ts
import { configureStore } from '@reduxjs/toolkit';
import { createAutoSlice } from 'redux-auto-slice';

const { slice, actions, selectors } = createAutoSlice({
  name: 'todos',
  initialState: [] as { id: string; text: string }[],
  reducers: ['add', 'remove', 'clear'],
});

const store = configureStore({ reducer: { [slice.name]: slice.reducer } });

store.dispatch(actions.add({ id: '1', text: 'Learn RTK' }));
store.dispatch(actions.remove({ id: '1' })); // or remove by value
store.dispatch(actions.clear(undefined));

const all = selectors.selectAll(store.getState().todos);
const total = selectors.selectTotal(store.getState().todos);
```

### Entity (normalized) state

Use the entity adapter for id-based lookups and updates. Entities must have an `id` field.

```ts
import { createAutoSlice, getEmptyEntityState } from 'redux-auto-slice';

type User = { id: string; name: string };

const { slice, actions, selectors } = createAutoSlice<User>({
  name: 'users',
  adapter: 'entity',
  initialState: getEmptyEntityState<User>(),
  reducers: ['add', 'remove', 'update', 'upsert', 'addMany', 'removeMany'],
});

// add / upsert by id
store.dispatch(actions.add({ id: '1', name: 'Alice' }));
store.dispatch(actions.update({ id: '1', changes: { name: 'Alicia' } }));

// selectors
const user = selectors.selectById(state.users, '1');
const ids = selectors.selectIds(state.users);
const entities = selectors.selectEntities(state.users);
```

### Async thunks

Pass thunks in `asyncThunks`; the slice gets `loading`, `error`, and `status`, and extraReducers for pending/fulfilled/rejected.

```ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { createAutoSlice, getEmptyEntityState } from 'redux-auto-slice';

const fetchUsers = createAsyncThunk('users/fetch', async () => {
  const res = await fetch('/api/users');
  return res.json();
});

const { slice, actions, selectors } = createAutoSlice<User>({
  name: 'users',
  adapter: 'entity',
  initialState: getEmptyEntityState<User>(),
  reducers: ['add', 'set'],
  asyncThunks: { fetchUsers },
});

// actions includes the thunk
await store.dispatch(actions.fetchUsers());

// async selectors (when asyncThunks is set)
selectors.selectLoading(state.users);  // boolean
selectors.selectError(state.users);    // string | null
selectors.selectStatus(state.users);   // 'idle' | 'pending' | 'fulfilled' | 'rejected'
```

With the **array** adapter and `asyncThunks`, state is wrapped as `{ data, loading, error, status }`; sync reducers (e.g. `add`) update `data`, and selectors like `selectAll` read from `data`.

---

## API reference

### `createAutoSlice(config)`

Creates a Redux Toolkit slice and returns `{ slice, actions, selectors }`. Optionally includes async thunk actions and `selectLoading` / `selectError` / `selectStatus` when `asyncThunks` is provided.

#### Config (array adapter, default)

| Property         | Type       | Description |
|------------------|------------|-------------|
| `name`           | `string`   | Slice name (used for action types). |
| `initialState`   | `T[]`      | Initial state array. |
| `reducers`       | `string[]` | List of shorthand names (see below). |
| `adapter`        | `'array'`  | Optional; default is array. |
| `customReducers` | `Record<string, CustomReducer<T[]>>` | Extra reducers; keys become action names. |
| `actionNaming`   | `'short' \| 'prefixed'` | `'prefixed'` → e.g. `itemsAdd` instead of `add`. |
| `asyncThunks`    | `Record<string, AsyncThunk>` | Thunks to handle; adds loading/error/status. |

**Array reducer shorthands:** `add`, `remove`, `clear`, `update`, `set`, `addMany`, `removeMany`, `upsert`.

#### Config (entity adapter)

Same as above, with:

- `adapter: 'entity'`
- `initialState`: `EntityState<T>` (e.g. `getEmptyEntityState<User>()`)
- `reducers`: may include `increment`, `toggle` in addition to the array list.

**Entity-only shorthands:** `increment` (payload: `{ id, field?, amount? }`), `toggle` (payload: `{ id, field? }`).

#### Return value

- **`slice`** — RTK `Slice` (`.name`, `.reducer`, `.getInitialState()`).
- **`actions`** — Action creators (and thunk creators if `asyncThunks` was set).
- **`selectors`** — `selectAll`, `selectTotal`; entity adds `selectIds`, `selectEntities`, `selectById`; with async adds `selectLoading`, `selectError`, `selectStatus`.

---

### Helpers

- **`getEmptyEntityState<T>()`** — Returns `{ entities: {}, ids: [] }` typed as `EntityState<T>`. Use as `initialState` for entity adapter.

### Types (for inference and typing)

- **`AutoSliceOptions<T>`** / **`AutoSliceResult<T>`** — Config and result unions.
- **`EntityState<T>`** — `{ entities: Record<string, T>; ids: string[] }`.
- **`AsyncStateFields`** — `{ loading; error; status }`.
- **`ArrayReducerPayloads<T>`** / **`EntityReducerPayloads<T>`** — Payload types for each shorthand.
- **`SliceStateFromResult<R>`** — Extract slice state type from a result (e.g. for `RootState`).
- **`InferArrayState<O>`** / **`InferEntityState<O>`** — Infer state type from options.

---

## Reducer reference

### Array (`initialState: T[]`)

| Name        | Payload / behavior |
|-------------|---------------------|
| `add`       | `T` — push. |
| `remove`    | `T` or `{ id }` — filter by value or by id. |
| `clear`     | `undefined` — reset to `[]`. |
| `set`       | `T[]` — replace state. |
| `addMany`   | `T[]` — push all. |
| `removeMany`| Values or ids — remove all matching. |
| `update`    | `{ at, value }` or `{ id, changes }` — update at index or by id. |
| `upsert`    | `T \| T[]` — replace by id or push. |

### Entity (`adapter: 'entity'`)

| Name        | Payload / behavior |
|-------------|---------------------|
| `add` / `upsert` | `T \| T[]` — upsert by id. |
| `remove` / `removeMany` | id(s) — delete by id. |
| `update`    | `{ id, changes }` — merge into entity. |
| `clear`     | `undefined` — reset to empty entity state. |
| `set`       | `EntityState<T>` — replace state. |
| `addMany`   | `T[]` — add many. |
| `increment` | `{ id, field?, amount? }` — default `field: 'value'`, `amount: 1`. |
| `toggle`    | `{ id, field? }` — default `field: 'value'`. |

---

## License

MIT — see [LICENSE](LICENSE).
