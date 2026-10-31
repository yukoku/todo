import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { STORAGE_KEY, loadTodos, saveTodos } from '../src/storage.js';

function createMemoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

const todos = [
  { id: 'a', title: '牛乳を買う', completed: false },
  { id: 'b', title: '本を返す', completed: true },
];

describe('saveTodos / loadTodos', () => {
  it('保存した内容を読み込める', () => {
    const storage = createMemoryStorage();
    assert.equal(saveTodos(todos, storage), true);
    assert.deepEqual(loadTodos(storage), todos);
  });

  it('何も保存されていなければ空配列を返す', () => {
    assert.deepEqual(loadTodos(createMemoryStorage()), []);
  });

  it('壊れた JSON は空配列として扱う', () => {
    assert.deepEqual(loadTodos(createMemoryStorage({ [STORAGE_KEY]: '{oops' })), []);
  });

  it('配列でないデータは空配列として扱う', () => {
    assert.deepEqual(loadTodos(createMemoryStorage({ [STORAGE_KEY]: '{"id":"a"}' })), []);
  });

  it('形式が正しくない項目は読み飛ばす', () => {
    const raw = JSON.stringify([todos[0], null, { id: 1, title: 'x', completed: false }, { id: 'c' }]);
    assert.deepEqual(loadTodos(createMemoryStorage({ [STORAGE_KEY]: raw })), [todos[0]]);
  });

  it('容量超過などで書き込めなければ false を返す', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    assert.equal(saveTodos(todos, storage), false);
  });

  it('ストレージが使えなくても例外を投げない', () => {
    assert.deepEqual(loadTodos(null), []);
    assert.equal(saveTodos(todos, null), false);
  });
});
