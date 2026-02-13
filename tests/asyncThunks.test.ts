/**
 * Tests for createAutoSlice with asyncThunks (pending/fulfilled/rejected state and RTK matchers).
 */
import { configureStore, createAsyncThunk, isFulfilled, isRejected } from '@reduxjs/toolkit';
import { createAutoSlice, getEmptyEntityState } from '../src/index';

type User = { id: string; name: string };

type SelectorsWithAsync = {
  selectLoading: (state: unknown) => boolean;
  selectError: (state: unknown) => string | null;
  selectStatus: (state: unknown) => string;
};

const delay = (ms: number) => new Promise((r) => globalThis.setTimeout(r, ms));

describe('createAutoSlice – async thunks', () => {
  const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
    await delay(10);
    return [{ id: '1', name: 'Alice' }] as User[];
  });

  const fetchUsersReject = createAsyncThunk(
    'users/fetchReject',
    async (_, { rejectWithValue }) => {
      await delay(10);
      return rejectWithValue('Network error');
    }
  );

  it('adds loading/error/status to initial state when asyncThunks provided', () => {
    const { slice } = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: [],
      asyncThunks: { fetchUsers },
    });

    expect(slice.getInitialState()).toMatchObject({
      entities: {},
      ids: [],
      loading: false,
      error: null,
      status: 'idle',
    });
  });

  it('updates loading/status on pending and fulfilled', async () => {
    const result = createAutoSlice<User>({
      name: 'users',
      adapter: 'entity',
      initialState: getEmptyEntityState<User>(),
      reducers: [],
      asyncThunks: { fetchUsers },
    });
    const { slice, actions, selectors } = result;
    const asyncSelectors = selectors as typeof selectors & SelectorsWithAsync;

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const getSliceState = () => store.getState()[slice.name];

    const promise = store.dispatch(actions.fetchUsers(undefined));
    expect(asyncSelectors.selectLoading(getSliceState())).toBe(true);
    expect(asyncSelectors.selectStatus(getSliceState())).toBe('pending');

    const resolved = await promise;
    expect(isFulfilled(resolved)).toBe(true);
    expect(asyncSelectors.selectLoading(getSliceState())).toBe(false);
    expect(asyncSelectors.selectError(getSliceState())).toBe(null);
    expect(asyncSelectors.selectStatus(getSliceState())).toBe('fulfilled');
  });

  it('updates error/status on rejected (RTK isRejected matcher)', async () => {
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
    const getSliceState = () => store.getState()[slice.name];

    const resolved = await store.dispatch(actions.fetchUsersReject(undefined));
    expect(isRejected(resolved)).toBe(true);
    expect(asyncSelectors.selectLoading(getSliceState())).toBe(false);
    expect(asyncSelectors.selectError(getSliceState())).toBe('Network error');
    expect(asyncSelectors.selectStatus(getSliceState())).toBe('rejected');
  });

  it('array adapter with async: state is { data, loading, error, status }', async () => {
    const fetchItems = createAsyncThunk('items/fetch', async () => {
      await delay(5);
      return [1, 2, 3] as number[];
    });

    const created = createAutoSlice({
      name: 'items',
      initialState: [] as number[],
      reducers: ['add'],
      asyncThunks: { fetchItems },
    });
    const { slice, actions, selectors } = created;
    const asyncSelectors = selectors as typeof selectors & SelectorsWithAsync;

    expect(slice.getInitialState()).toMatchObject({
      data: [],
      loading: false,
      error: null,
      status: 'idle',
    });

    const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
    const getSliceState = () => store.getState()[slice.name];

    store.dispatch(actions.add(0));
    expect(selectors.selectAll(getSliceState())).toEqual([0]);

    const result = await store.dispatch(actions.fetchItems(undefined));
    expect(isFulfilled(result)).toBe(true);
    expect(asyncSelectors.selectLoading(getSliceState())).toBe(false);
  });
});
