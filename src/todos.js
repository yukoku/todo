// TODO リストを操作する純粋関数。
// どの関数も引数の配列を変更せず、新しい配列を返す。

/** @typedef {{ id: string, title: string, completed: boolean }} Todo */

export const FILTERS = Object.freeze(['all', 'active', 'completed']);

/**
 * 末尾にタスクを追加する。
 * @param {Todo[]} todos
 * @param {string} title
 * @param {string} [id]
 * @returns {Todo[]} タイトルが空のときは引数の配列をそのまま返す
 */
export function addTodo(todos, title, id = generateId()) {
  const normalized = normalizeTitle(title);
  if (!normalized) return todos;
  return [...todos, { id, title: normalized, completed: false }];
}

export function toggleTodo(todos, id) {
  return todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo));
}

/** タイトルを変更する。空のタイトルで確定した場合はタスクを削除する。 */
export function editTodo(todos, id, title) {
  const normalized = normalizeTitle(title);
  if (!normalized) return removeTodo(todos, id);
  return todos.map((todo) => (todo.id === id ? { ...todo, title: normalized } : todo));
}

export function removeTodo(todos, id) {
  return todos.filter((todo) => todo.id !== id);
}

export function toggleAll(todos, completed) {
  return todos.map((todo) => (todo.completed === completed ? todo : { ...todo, completed }));
}

export function clearCompleted(todos) {
  return todos.filter((todo) => !todo.completed);
}

export function filterTodos(todos, filter) {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    default:
      return todos;
  }
}

export function countActive(todos) {
  return todos.filter((todo) => !todo.completed).length;
}

/** URL のハッシュ（例: "#/active"）から表示フィルターを求める。 */
export function parseFilter(hash) {
  const name = String(hash ?? '').replace(/^#\/?/, '');
  return FILTERS.includes(name) ? name : 'all';
}

// trim() は全角スペースも取り除く
function normalizeTitle(title) {
  return String(title ?? '').trim();
}

function generateId() {
  // randomUUID は安全なコンテキスト（https / localhost）でのみ使える
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}
