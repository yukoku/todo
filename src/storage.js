// TODO リストを localStorage に保存・読み込みする。
// ストレージが使えない環境でもアプリが止まらないよう、例外はすべてここで吸収する。

export const STORAGE_KEY = 'todo-app:todos';

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // サイトデータがブロックされているとアクセスしただけで例外になる
    return null;
  }
}

export function loadTodos(storage = defaultStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isTodo) : [];
  } catch {
    return [];
  }
}

/** @returns {boolean} 保存できたかどうか */
export function saveTodos(todos, storage = defaultStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch {
    return false;
  }
}

function isTodo(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.completed === 'boolean'
  );
}
