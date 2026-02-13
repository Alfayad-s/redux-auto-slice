/**
 * Edge cases: empty reducers, invalid shorthands, prefixed naming, customReducers.
 */
import { configureStore } from '@reduxjs/toolkit';
import { createAutoSlice, getEmptyEntityState } from '../src/index';

type User = { id: string; name: string };

describe('createAutoSlice – edge cases', () => {
  describe('empty or invalid reducers', () => {
    it('empty reducers array produces slice with no action creators', () => {
      const { slice, actions, selectors } = createAutoSlice({
        name: 'empty',
        initialState: [] as number[],
        reducers: [],
      });

      expect(slice.name).toBe('empty');
      expect(slice.getInitialState()).toEqual([]);
      expect(Object.keys(actions)).toHaveLength(0);
      expect(selectors.selectAll).toBeDefined();
      expect(selectors.selectTotal).toBeDefined();
    });

    it('invalid shorthand names are ignored (no action created)', () => {
      const { slice, actions } = createAutoSlice({
        name: 'items',
        initialState: [] as number[],
        reducers: ['add', 'invalidReducer', 'nonexistent', 'clear'],
      });

      expect(actions.add).toBeDefined();
      expect(actions.clear).toBeDefined();
      expect((actions as Record<string, unknown>)['invalidReducer']).toBeUndefined();
      expect((actions as Record<string, unknown>)['nonexistent']).toBeUndefined();
    });

    it('entity: only valid entity shorthands are applied', () => {
      const { slice, actions } = createAutoSlice<User>({
        name: 'users',
        adapter: 'entity',
        initialState: getEmptyEntityState<User>(),
        reducers: ['add', 'remove', 'fakeAction'],
      });

      expect(actions.add).toBeDefined();
      expect(actions.remove).toBeDefined();
      expect((actions as Record<string, unknown>)['fakeAction']).toBeUndefined();
    });
  });

  describe('actionNaming prefixed', () => {
    it('prefixed keys are used when actionNaming is prefixed', () => {
      const { slice, actions } = createAutoSlice({
        name: 'items',
        initialState: [] as number[],
        reducers: ['add', 'clear'],
        actionNaming: 'prefixed',
      });

      expect((actions as Record<string, unknown>).itemsAdd).toBeDefined();
      expect((actions as Record<string, unknown>).itemsClear).toBeDefined();
      expect((actions as Record<string, unknown>).add).toBeUndefined();

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const itemsAdd = (actions as Record<string, (payload: number) => { type: string; payload: number }>).itemsAdd;
      store.dispatch(itemsAdd(1));
      expect(store.getState()[slice.name]).toEqual([1]);
    });
  });

  describe('customReducers', () => {
    it('customReducers are merged and invoked', () => {
      const { slice, actions, selectors } = createAutoSlice({
        name: 'items',
        initialState: [] as number[],
        reducers: ['add'],
        customReducers: {
          reset: () => [],
          appendDouble: (state) => state.concat(state),
        },
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      store.dispatch(actions.add(1));
      store.dispatch(actions.add(2));
      expect(selectors.selectAll(getSliceState())).toEqual([1, 2]);

      const appendDouble = (actions as Record<string, (payload: undefined) => unknown>).appendDouble;
      store.dispatch(appendDouble(undefined) as { type: string });
      expect(selectors.selectAll(getSliceState())).toEqual([1, 2, 1, 2]);

      const reset = (actions as Record<string, (payload: undefined) => unknown>).reset;
      store.dispatch(reset(undefined) as { type: string });
      expect(selectors.selectAll(getSliceState())).toEqual([]);
    });
  });

  describe('slice reducer in store', () => {
    it('reducer handles unknown action by returning current state', () => {
      const { slice } = createAutoSlice({
        name: 'items',
        initialState: [1, 2, 3] as number[],
        reducers: ['add'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const before = store.getState()[slice.name];
      store.dispatch({ type: 'unknown/action' });
      expect(store.getState()[slice.name]).toBe(before);
    });
  });
});
