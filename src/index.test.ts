import { configureStore, createAsyncThunk } from '@reduxjs/toolkit';
import { VERSION, createAutoSlice, getEmptyEntityState } from './index';

type User = { id: string; name: string };

describe('redux-auto-slice', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('1.0.0');
  });

  it('createAutoSlice returns slice, actions, and selectors', () => {
    const { slice, actions, selectors } = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add', 'remove', 'clear'],
    });

    expect(slice.name).toBe('items');
    expect(slice.getInitialState()).toEqual([]);
    expect(actions.add).toBeDefined();
    expect(actions.remove).toBeDefined();
    expect(actions.clear).toBeDefined();
    expect(selectors.selectAll).toBeDefined();
    expect(selectors.selectTotal).toBeDefined();
  });

  it('add pushes payload to state', () => {
    const { slice, actions, selectors } = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add'],
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    expect(selectors.selectAll(state())).toEqual([]);

    store.dispatch(actions.add(1));
    store.dispatch(actions.add(2));
    expect(selectors.selectAll(state())).toEqual([1, 2]);
    expect(selectors.selectTotal(state())).toBe(2);
  });

  it('remove filters by value or by id', () => {
    const { slice, actions, selectors } = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add', 'remove'],
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    store.dispatch(actions.add(10));
    store.dispatch(actions.add(20));
    store.dispatch(actions.add(30));
    store.dispatch(actions.remove(20));
    expect(selectors.selectAll(state())).toEqual([10, 30]);

    store.dispatch(actions.remove(10));
    expect(selectors.selectAll(state())).toEqual([30]);
  });

  it('remove by id when payload is object with id', () => {
    type Item = { id: string; label: string };
    const { slice, actions, selectors } = createAutoSlice<Item>({
      name: 'items',
      initialState: [] as Item[],
      reducers: ['add', 'remove'],
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    store.dispatch(actions.add({ id: 'a', label: 'A' }));
    store.dispatch(actions.add({ id: 'b', label: 'B' }));
    store.dispatch(actions.add({ id: 'c', label: 'C' }));
    store.dispatch(actions.remove({ id: 'b' }));
    expect(selectors.selectAll(state())).toEqual([
      { id: 'a', label: 'A' },
      { id: 'c', label: 'C' },
    ]);
  });

  it('clear resets to empty array', () => {
    const { slice, actions, selectors } = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add', 'clear'],
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    store.dispatch(actions.add(1));
    store.dispatch(actions.add(2));
    expect(selectors.selectAll(state())).toEqual([1, 2]);

    store.dispatch(actions.clear(undefined));
    expect(selectors.selectAll(state())).toEqual([]);
    expect(selectors.selectTotal(state())).toBe(0);
  });

  it('only includes requested reducers', () => {
    const { actions } = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add'],
    });

    expect(actions.add).toBeDefined();
    expect(actions.remove).toBeUndefined();
    expect(actions.clear).toBeUndefined();
  });
});

describe('createAutoSlice entity adapter', () => {
  it('returns slice, actions, and entity selectors', () => {
    const { slice, actions, selectors } = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: ['add', 'remove', 'update', 'clear'],
    });

    expect(slice.name).toBe('users');
    expect(slice.getInitialState()).toEqual({ entities: {}, ids: [] });
    expect(actions.add).toBeDefined();
    expect(actions.remove).toBeDefined();
    expect(actions.update).toBeDefined();
    expect(actions.clear).toBeDefined();
    expect(selectors.selectAll).toBeDefined();
    expect(selectors.selectTotal).toBeDefined();
    expect(selectors.selectIds).toBeDefined();
    expect(selectors.selectEntities).toBeDefined();
    expect(selectors.selectById).toBeDefined();
  });

  it('add upserts by id (single or array)', () => {
    const { slice, actions, selectors } = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: ['add'],
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    store.dispatch(actions.add({ id: '1', name: 'Alice' }));
    store.dispatch(actions.add({ id: '2', name: 'Bob' }));
    expect(selectors.selectAll(state())).toEqual([
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ]);
    expect(selectors.selectIds(state())).toEqual(['1', '2']);
    expect(selectors.selectById(state(), '1')).toEqual({ id: '1', name: 'Alice' });
    expect(selectors.selectEntities(state())).toEqual({
      '1': { id: '1', name: 'Alice' },
      '2': { id: '2', name: 'Bob' },
    });

    store.dispatch(actions.add({ id: '1', name: 'Alicia' }));
    expect(selectors.selectById(state(), '1')).toEqual({ id: '1', name: 'Alicia' });
  });

  it('remove deletes by id (single or array)', () => {
    const { slice, actions, selectors } = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: ['add', 'remove'],
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    store.dispatch(actions.add({ id: 'a', name: 'A' }));
    store.dispatch(actions.add({ id: 'b', name: 'B' }));
    store.dispatch(actions.add({ id: 'c', name: 'C' }));
    store.dispatch(actions.remove('b'));
    expect(selectors.selectIds(state())).toEqual(['a', 'c']);
    expect(selectors.selectById(state(), 'b')).toBeUndefined();

    store.dispatch(actions.remove(['a', 'c']));
    expect(selectors.selectAll(state())).toEqual([]);
  });

  it('update merges changes by id', () => {
    const { slice, actions, selectors } = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: ['add', 'update'],
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    store.dispatch(actions.add({ id: '1', name: 'Alice' }));
    store.dispatch(actions.update({ id: '1', changes: { name: 'Alicia' } }));
    expect(selectors.selectById(state(), '1')).toEqual({ id: '1', name: 'Alicia' });
  });

  it('clear resets to empty entity state', () => {
    const { slice, actions, selectors } = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: ['add', 'clear'],
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    store.dispatch(actions.add({ id: '1', name: 'Alice' }));
    expect(selectors.selectTotal(state())).toBe(1);
    store.dispatch(actions.clear(undefined));
    expect(selectors.selectAll(state())).toEqual([]);
    expect(selectors.selectTotal(state())).toBe(0);
    expect(selectors.selectEntities(state())).toEqual({});
  });

  it('set replaces entire entity state', () => {
    const { slice, actions, selectors } = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: ['add', 'set'],
    });
    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];
    store.dispatch(actions.add({ id: '1', name: 'Alice' }));
    store.dispatch(
      actions.set({
        entities: { '2': { id: '2', name: 'Bob' } },
        ids: ['2'],
      })
    );
    expect(selectors.selectAll(state())).toEqual([{ id: '2', name: 'Bob' }]);
  });

  it('addMany and removeMany work', () => {
    const { slice, actions, selectors } = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: ['addMany', 'removeMany'],
    });
    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];
    store.dispatch(
      actions.addMany([
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
        { id: 'c', name: 'C' },
      ])
    );
    expect(selectors.selectIds(state())).toEqual(['a', 'b', 'c']);
    store.dispatch(actions.removeMany(['b']));
    expect(selectors.selectIds(state())).toEqual(['a', 'c']);
  });

  it('increment and toggle work on entity fields', () => {
    type Counter = { id: string; value: number; active: boolean };
    const { slice, actions, selectors } = createAutoSlice<Counter>({
      name: 'counters',
      adapter: 'entity',
      initialState: getEmptyEntityState<Counter>(),
      reducers: ['add', 'increment', 'toggle'],
    });
    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];
    store.dispatch(actions.add({ id: '1', value: 10, active: true }));
    store.dispatch(actions.increment({ id: '1', field: 'value', amount: 5 }));
    expect(selectors.selectById(state(), '1')).toEqual({ id: '1', value: 15, active: true });
    store.dispatch(actions.toggle({ id: '1', field: 'active' }));
    expect(selectors.selectById(state(), '1')).toEqual({ id: '1', value: 15, active: false });
  });
});

describe('createAutoSlice array shorthands', () => {
  it('set replaces array state', () => {
    const { slice, actions, selectors } = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add', 'set'],
    });
    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];
    store.dispatch(actions.add(1));
    store.dispatch(actions.add(2));
    store.dispatch(actions.set([10, 20]));
    expect(selectors.selectAll(state())).toEqual([10, 20]);
  });

  it('addMany and removeMany work', () => {
    const { slice, actions, selectors } = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['addMany', 'removeMany'],
    });
    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];
    store.dispatch(actions.addMany([1, 2, 3]));
    expect(selectors.selectAll(state())).toEqual([1, 2, 3]);
    store.dispatch(actions.removeMany([2]));
    expect(selectors.selectAll(state())).toEqual([1, 3]);
  });

  it('update by index and upsert by id work', () => {
    type Item = { id: string; x: number };
    const { slice, actions, selectors } = createAutoSlice<Item>({
      name: 'items',
      initialState: [] as Item[],
      reducers: ['add', 'update', 'upsert'],
    });
    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];
    store.dispatch(actions.add({ id: 'a', x: 1 }));
    store.dispatch(actions.add({ id: 'b', x: 2 }));
    store.dispatch(actions.update({ at: 0, value: { id: 'a', x: 10 } }));
    expect(selectors.selectAll(state())[0]).toEqual({ id: 'a', x: 10 });
    store.dispatch(actions.upsert({ id: 'b', x: 20 }));
    expect(selectors.selectAll(state()).find((i) => i.id === 'b')).toEqual({ id: 'b', x: 20 });
  });
});

describe('createAutoSlice customReducers and actionNaming', () => {
  it('customReducers are merged and invoked', () => {
    const { slice, actions, selectors } = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add'],
      customReducers: {
        reset: () => [],
        double: (state) => state.concat(state),
      },
    });
    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];
    store.dispatch(actions.add(1));
    store.dispatch(actions.add(2));
    expect(selectors.selectAll(state())).toEqual([1, 2]);
    store.dispatch(actions.double(undefined));
    expect(selectors.selectAll(state())).toEqual([1, 2, 1, 2]);
    store.dispatch(actions.reset(undefined));
    expect(selectors.selectAll(state())).toEqual([]);
  });

  it('actionNaming prefixed yields prefixed action keys', () => {
    const { slice, actions } = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add', 'clear'],
      actionNaming: 'prefixed',
    });
    expect(actions.itemsAdd).toBeDefined();
    expect(actions.itemsClear).toBeDefined();
    expect(actions.add).toBeUndefined();
    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    store.dispatch(actions.itemsAdd(1));
    expect(store.getState()[slice.name]).toEqual([1]);
    store.dispatch(actions.itemsClear(undefined));
    expect(store.getState()[slice.name]).toEqual([]);
  });
});

type SelectorsWithAsync = {
  selectLoading: (state: unknown) => boolean;
  selectError: (state: unknown) => string | null;
  selectStatus: (state: unknown) => string;
};

describe('createAutoSlice asyncThunks', () => {
  const delay = (ms: number) => new Promise((r) => globalThis.setTimeout(r, ms));
  const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async () => {
      await delay(5);
      return [{ id: '1', name: 'Alice' }] as User[];
    }
  );
  const fetchUsersReject = createAsyncThunk(
    'users/fetchUsersReject',
    async (_, { rejectWithValue }) => {
      await delay(5);
      return rejectWithValue('Network error');
    }
  );

  it('entity: adds loading/error/status to state and extraReducers', async () => {
    const result = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: ['add'],
      asyncThunks: { fetchUsers },
    });
    const { slice, actions, selectors } = result;
    const asyncSelectors = selectors as typeof selectors & SelectorsWithAsync;

    expect(slice.getInitialState()).toEqual({
      entities: {},
      ids: [],
      loading: false,
      error: null,
      status: 'idle',
    });
    expect(asyncSelectors.selectLoading).toBeDefined();
    expect(asyncSelectors.selectError).toBeDefined();
    expect(asyncSelectors.selectStatus).toBeDefined();
    expect(actions.fetchUsers).toBeDefined();

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    expect(asyncSelectors.selectLoading(state())).toBe(false);
    expect(asyncSelectors.selectStatus(state())).toBe('idle');

    const promise = store.dispatch(actions.fetchUsers(undefined));
    expect(asyncSelectors.selectLoading(state())).toBe(true);
    expect(asyncSelectors.selectStatus(state())).toBe('pending');

    await promise;
    expect(asyncSelectors.selectLoading(state())).toBe(false);
    expect(asyncSelectors.selectError(state())).toBe(null);
    expect(asyncSelectors.selectStatus(state())).toBe('fulfilled');
  });

  it('entity: rejected thunk sets error and status', async () => {
    const result = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: [],
      asyncThunks: { fetchUsersReject },
    });
    const { slice, actions, selectors } = result;
    const asyncSelectors = selectors as typeof selectors & SelectorsWithAsync;
    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    await store.dispatch(actions.fetchUsersReject(undefined));
    expect(asyncSelectors.selectLoading(state())).toBe(false);
    expect(asyncSelectors.selectError(state())).toBe('Network error');
    expect(asyncSelectors.selectStatus(state())).toBe('rejected');
  });

  it('array: wrapped state (data, loading, error, status) and sync reducers work', async () => {
    const fetchItems = createAsyncThunk('items/fetchItems', async () => {
      await delay(2);
      return [1, 2, 3] as number[];
    });

    const result = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add', 'set'],
      asyncThunks: { fetchItems },
    });
    const { slice, actions, selectors } = result;
    const asyncSelectors = selectors as typeof selectors & SelectorsWithAsync;

    expect(slice.getInitialState()).toEqual({
      data: [],
      loading: false,
      error: null,
      status: 'idle',
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const state = () => store.getState()[slice.name];

    store.dispatch(actions.add(1));
    expect(selectors.selectAll(state())).toEqual([1]);
    expect(selectors.selectTotal(state())).toBe(1);

    store.dispatch(actions.set([10, 20]));
    expect(selectors.selectAll(state())).toEqual([10, 20]);

    const promise = store.dispatch(actions.fetchItems(undefined));
    expect(asyncSelectors.selectLoading(state())).toBe(true);
    await promise;
    expect(asyncSelectors.selectLoading(state())).toBe(false);
    expect(asyncSelectors.selectStatus(state())).toBe('fulfilled');
  });
});
