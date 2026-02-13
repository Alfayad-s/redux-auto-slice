/**
 * Tests for createAutoSlice with entity state (upsert/update and related).
 */
import { configureStore } from '@reduxjs/toolkit';
import { createAutoSlice, getEmptyEntityState } from '../src/index';

type User = { id: string; name: string };

describe('createAutoSlice – entity state', () => {
  describe('upsert and update', () => {
    it('creates entity slice with upsert/update reducers', () => {
      const { slice, actions, selectors } = createAutoSlice<User>({
        name: 'users',
        adapter: 'entity',
        initialState: getEmptyEntityState<User>(),
        reducers: ['add', 'upsert', 'update'],
      });

      expect(slice.name).toBe('users');
      expect(slice.getInitialState()).toEqual({ entities: {}, ids: [] });
      expect(actions.add).toBeDefined();
      expect(actions.upsert).toBeDefined();
      expect(actions.update).toBeDefined();
    });

    it('add and upsert by id; update merges changes', () => {
      const { slice, actions, selectors } = createAutoSlice<User>({
        name: 'users',
        adapter: 'entity',
        initialState: getEmptyEntityState<User>(),
        reducers: ['add', 'upsert', 'update'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      store.dispatch(actions.add({ id: '1', name: 'Alice' }));
      expect(selectors.selectById(getSliceState(), '1')).toEqual({ id: '1', name: 'Alice' });

      store.dispatch(actions.upsert({ id: '1', name: 'Alicia' }));
      expect(selectors.selectById(getSliceState(), '1')).toEqual({ id: '1', name: 'Alicia' });

      store.dispatch(actions.upsert({ id: '2', name: 'Bob' }));
      expect(selectors.selectAll(getSliceState())).toHaveLength(2);

      store.dispatch(actions.update({ id: '1', changes: { name: 'Al' } }));
      expect(selectors.selectById(getSliceState(), '1')).toEqual({ id: '1', name: 'Al' });
    });

    it('selectIds and selectEntities return correct shape', () => {
      const { slice, actions, selectors } = createAutoSlice<User>({
        name: 'users',
        adapter: 'entity',
        initialState: getEmptyEntityState<User>(),
        reducers: ['add'],
      });

      const store = configureStore({ reducer: { [slice.name]: slice.reducer } });
      const getSliceState = () => store.getState()[slice.name];

      store.dispatch(actions.add({ id: 'a', name: 'A' }));
      store.dispatch(actions.add({ id: 'b', name: 'B' }));

      expect(selectors.selectIds(getSliceState())).toEqual(['a', 'b']);
      expect(selectors.selectEntities(getSliceState())).toEqual({
        a: { id: 'a', name: 'A' },
        b: { id: 'b', name: 'B' },
      });
    });
  });
});
