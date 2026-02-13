/**
 * Tests for createAutoSlice with array state (add/remove and related).
 */
import { configureStore } from '@reduxjs/toolkit';
import { createAutoSlice } from '../src/index';

describe('createAutoSlice – array state', () => {
  describe('add and remove', () => {
    it('creates slice with add/remove reducers', () => {
      const { slice, actions, selectors } = createAutoSlice({
        name: 'items',
        initialState: [] as number[],
        reducers: ['add', 'remove'],
      });

      expect(slice.name).toBe('items');
      expect(slice.getInitialState()).toEqual([]);
      expect(actions.add).toBeDefined();
      expect(actions.remove).toBeDefined();
      expect(selectors.selectAll).toBeDefined();
      expect(selectors.selectTotal).toBeDefined();
    });

    it('add pushes payload; remove filters by value', () => {
      const { slice, actions, selectors } = createAutoSlice({
        name: 'items',
        initialState: [] as number[],
        reducers: ['add', 'remove'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      store.dispatch(actions.add(1));
      store.dispatch(actions.add(2));
      store.dispatch(actions.add(3));
      expect(selectors.selectAll(getSliceState())).toEqual([1, 2, 3]);
      expect(selectors.selectTotal(getSliceState())).toBe(3);

      store.dispatch(actions.remove(2));
      expect(selectors.selectAll(getSliceState())).toEqual([1, 3]);
    });

    it('remove by id when items have id', () => {
      type Item = { id: string; label: string };
      const { slice, actions, selectors } = createAutoSlice<Item>({
        name: 'items',
        initialState: [] as Item[],
        reducers: ['add', 'remove'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      store.dispatch(actions.add({ id: 'a', label: 'A' }));
      store.dispatch(actions.add({ id: 'b', label: 'B' }));
      store.dispatch(actions.remove({ id: 'a' }));
      expect(selectors.selectAll(getSliceState())).toEqual([{ id: 'b', label: 'B' }]);
    });
  });

  describe('clear', () => {
    it('clear resets to empty array', () => {
      const { slice, actions, selectors } = createAutoSlice({
        name: 'items',
        initialState: [] as number[],
        reducers: ['add', 'clear'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      store.dispatch(actions.add(1));
      store.dispatch(actions.clear(undefined));
      expect(selectors.selectAll(getSliceState())).toEqual([]);
      expect(selectors.selectTotal(getSliceState())).toBe(0);
    });
  });
});
