import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addTodo,
  clearCompleted,
  countActive,
  editTodo,
  filterTodos,
  parseFilter,
  removeTodo,
  toggleAll,
  toggleTodo,
} from '../src/todos.js';

const sample = () => [
  { id: 'a', title: '牛乳を買う', completed: false },
  { id: 'b', title: '本を返す', completed: true },
  { id: 'c', title: '部屋を掃除する', completed: false },
];

describe('addTodo', () => {
  it('前後の空白を取り除いて末尾に追加する', () => {
    const todos = addTodo(sample(), '  洗濯する  ', 'd');
    assert.deepEqual(todos.at(-1), { id: 'd', title: '洗濯する', completed: false });
    assert.equal(todos.length, 4);
  });

  it('空白だけのタイトルは追加せず、同じ配列を返す', () => {
    const todos = sample();
    assert.equal(addTodo(todos, ''), todos);
    assert.equal(addTodo(todos, '   '), todos);
    assert.equal(addTodo(todos, '　'), todos); // 全角スペース
  });

  it('id を省略すると重複しない id を振る', () => {
    const todos = addTodo(addTodo([], 'A'), 'B');
    assert.equal(typeof todos[0].id, 'string');
    assert.notEqual(todos[0].id, todos[1].id);
  });

  it('元の配列を変更しない', () => {
    const todos = sample();
    addTodo(todos, '洗濯する');
    assert.deepEqual(todos, sample());
  });
});

describe('toggleTodo', () => {
  it('指定したタスクだけ完了状態を反転する', () => {
    const todos = toggleTodo(sample(), 'a');
    assert.deepEqual(
      todos.map((t) => t.completed),
      [true, true, false],
    );
    assert.equal(toggleTodo(todos, 'a')[0].completed, false);
  });
});

describe('editTodo', () => {
  it('タイトルを空白を取り除いて更新する', () => {
    const todos = editTodo(sample(), 'b', '  図書館に本を返す ');
    assert.equal(todos[1].title, '図書館に本を返す');
    assert.equal(todos[1].completed, true);
  });

  it('空のタイトルで確定するとタスクを削除する', () => {
    const todos = editTodo(sample(), 'b', '  ');
    assert.deepEqual(
      todos.map((t) => t.id),
      ['a', 'c'],
    );
  });
});

describe('removeTodo', () => {
  it('指定したタスクを削除する', () => {
    assert.deepEqual(
      removeTodo(sample(), 'a').map((t) => t.id),
      ['b', 'c'],
    );
  });

  it('存在しない id なら何も変わらない', () => {
    assert.deepEqual(removeTodo(sample(), 'zzz'), sample());
  });
});

describe('toggleAll', () => {
  it('すべて完了にする', () => {
    assert.ok(toggleAll(sample(), true).every((t) => t.completed));
  });

  it('すべて未完了に戻す', () => {
    assert.ok(toggleAll(sample(), false).every((t) => !t.completed));
  });
});

describe('clearCompleted', () => {
  it('完了済みのタスクだけを削除する', () => {
    assert.deepEqual(
      clearCompleted(sample()).map((t) => t.id),
      ['a', 'c'],
    );
  });
});

describe('filterTodos', () => {
  const ids = (todos) => todos.map((t) => t.id);

  it('all はすべて返す', () => {
    assert.deepEqual(ids(filterTodos(sample(), 'all')), ['a', 'b', 'c']);
  });

  it('active は未完了だけ返す', () => {
    assert.deepEqual(ids(filterTodos(sample(), 'active')), ['a', 'c']);
  });

  it('completed は完了済みだけ返す', () => {
    assert.deepEqual(ids(filterTodos(sample(), 'completed')), ['b']);
  });

  it('不明なフィルターはすべて返す', () => {
    assert.deepEqual(ids(filterTodos(sample(), 'unknown')), ['a', 'b', 'c']);
  });
});

describe('countActive', () => {
  it('未完了のタスク数を数える', () => {
    assert.equal(countActive(sample()), 2);
    assert.equal(countActive([]), 0);
  });
});

describe('parseFilter', () => {
  it('ハッシュからフィルター名を取り出す', () => {
    assert.equal(parseFilter('#/active'), 'active');
    assert.equal(parseFilter('#/completed'), 'completed');
    assert.equal(parseFilter('#/all'), 'all');
  });

  it('空や不明な値は all になる', () => {
    assert.equal(parseFilter(''), 'all');
    assert.equal(parseFilter('#/'), 'all');
    assert.equal(parseFilter('#/foo'), 'all');
    assert.equal(parseFilter(undefined), 'all');
  });
});
