/**
 * Tests for createAutoSlice selectors (selectAll, selectTotal, selectById, etc.).
 */
import { configureStore } from '@reduxjs/toolkit';
import { createAutoSlice, getEmptyEntityState } from '../src/index';

type User = { id: string; name: string };

describe('createAutoSlice – selectors', () => {
  describe('array adapter', () => {
    it('selectAll returns full array; selectTotal returns length', () => {
      const { slice, actions, selectors } = createAutoSlice({
        name: 'items',
        initialState: [] as number[],
        reducers: ['add'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      expect(selectors.selectAll(getSliceState())).toEqual([]);
      expect(selectors.selectTotal(getSliceState())).toBe(0);

      store.dispatch(actions.add(1));
      store.dispatch(actions.add(2));
      expect(selectors.selectAll(getSliceState())).toEqual([1, 2]);
      expect(selectors.selectTotal(getSliceState())).toBe(2);
    });
  });

  describe('entity adapter', () => {
    it('selectAll returns entities in ids order', () => {
      const { slice, actions, selectors } = createAutoSlice<User>({
        name: 'users',
        adapter: 'entity',
        initialState: getEmptyEntityState<User>(),
        reducers: ['add'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      store.dispatch(actions.add({ id: 'b', name: 'B' }));
      store.dispatch(actions.add({ id: 'a', name: 'A' }));

      expect(selectors.selectAll(getSliceState())).toEqual([
        { id: 'b', name: 'B' },
        { id: 'a', name: 'A' },
      ]);
    });

    it('selectById returns entity or undefined', () => {
      const { slice, actions, selectors } = createAutoSlice<User>({
        name: 'users',
        adapter: 'entity',
        initialState: getEmptyEntityState<User>(),
        reducers: ['add'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      expect(selectors.selectById(getSliceState(), '1')).toBeUndefined();

      store.dispatch(actions.add({ id: '1', name: 'Alice' }));
      expect(selectors.selectById(getSliceState(), '1')).toEqual({ id: '1', name: 'Alice' });
      expect(selectors.selectById(getSliceState(), '2')).toBeUndefined();
    });

    it('selectTotal and selectIds match', () => {
      const { slice, actions, selectors } = createAutoSlice<User>({
        name: 'users',
        adapter: 'entity',
        initialState: getEmptyEntityState<User>(),
        reducers: ['add'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      store.dispatch(actions.add({ id: 'x', name: 'X' }));
      expect(selectors.selectTotal(getSliceState())).toBe(1);
      expect(selectors.selectIds(getSliceState())).toEqual(['x']);
    });
  });
});
