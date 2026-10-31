import { STORAGE_KEY, loadTodos, saveTodos } from './storage.js';
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
} from './todos.js';

const EMPTY_MESSAGES = {
  none: 'タスクはまだありません。上の入力欄から追加しましょう。',
  active: '未完了のタスクはありません。おつかれさまでした！',
  completed: '完了済みのタスクはまだありません。',
};

const $ = (selector) => document.querySelector(selector);

const ui = {
  today: $('#today'),
  form: $('#new-todo-form'),
  input: $('#new-todo'),
  toggleAll: $('#toggle-all'),
  list: $('#todo-list'),
  emptyMessage: $('#empty-message'),
  footer: $('#footer'),
  count: $('#todo-count'),
  filterLinks: document.querySelectorAll('[data-filter]'),
  clearCompleted: $('#clear-completed'),
  itemTemplate: $('#todo-item-template'),
};

const state = {
  todos: loadTodos(),
  filter: parseFilter(location.hash),
  editingId: null,
};

// 表示中の項目（id → <li>）。描画のたびに作り直さず使い回すことで、フォーカスや入力中の内容を保つ。
const itemElements = new Map();

function setTodos(todos) {
  state.todos = todos;
  saveTodos(todos);
  render();
}

// ---- 描画 ----

function render() {
  const { todos, filter } = state;
  const visible = filterTodos(todos, filter);
  const activeCount = countActive(todos);
  const completedCount = todos.length - activeCount;

  renderList(visible);

  ui.emptyMessage.hidden = visible.length > 0;
  ui.emptyMessage.textContent = EMPTY_MESSAGES[todos.length === 0 ? 'none' : filter] ?? '';

  const toggleAllLabel = activeCount === 0 ? 'すべて未完了に戻す' : 'すべて完了にする';
  ui.toggleAll.disabled = todos.length === 0;
  ui.toggleAll.checked = todos.length > 0 && activeCount === 0;
  ui.toggleAll.indeterminate = activeCount > 0 && completedCount > 0;
  ui.toggleAll.setAttribute('aria-label', toggleAllLabel);
  ui.toggleAll.title = toggleAllLabel;

  ui.footer.hidden = todos.length === 0;
  ui.count.textContent = `残り ${activeCount} 件`;
  ui.clearCompleted.hidden = completedCount === 0;
  for (const link of ui.filterLinks) {
    if (link.dataset.filter === filter) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function renderList(visible) {
  const { list } = ui;
  const visibleIds = new Set(visible.map((todo) => todo.id));

  // 表示しなくなった項目を外す。フォーカスを持っていた場合は、あとで隣の項目へ移す。
  let lostFocus = null;
  let removedCount = 0;
  [...list.children].forEach((item, index) => {
    if (visibleIds.has(item.dataset.id)) return;
    if (item.contains(document.activeElement)) {
      lostFocus = { index: index - removedCount, role: document.activeElement.dataset.role };
    }
    item.remove();
    itemElements.delete(item.dataset.id);
    removedCount += 1;
  });

  // 並び順は変わらないので、既存の項目は動かさず、新しい項目だけを正しい位置に差し込む
  let previous = null;
  for (const todo of visible) {
    let item = itemElements.get(todo.id);
    if (!item) {
      item = createItem(todo.id);
      itemElements.set(todo.id, item);
    }
    updateItem(item, todo);
    const expected = previous ? previous.nextElementSibling : list.firstElementChild;
    if (item !== expected) list.insertBefore(item, expected);
    previous = item;
  }

  if (lostFocus) {
    const neighbor = list.children[Math.min(lostFocus.index, list.children.length - 1)];
    const role = lostFocus.role === 'edit-input' ? 'edit' : lostFocus.role;
    (neighbor?.querySelector(`[data-role="${role}"]`) ?? ui.input).focus();
  }
}

function createItem(id) {
  const item = ui.itemTemplate.content.firstElementChild.cloneNode(true);
  item.dataset.id = id;
  return item;
}

function updateItem(item, todo) {
  item.classList.toggle('completed', todo.completed);
  item.classList.toggle('editing', state.editingId === todo.id);

  const toggle = item.querySelector('[data-role="toggle"]');
  toggle.checked = todo.completed;
  toggle.setAttribute('aria-label', todo.title);

  item.querySelector('[data-role="title"]').textContent = todo.title;
  item.querySelector('[data-role="edit"]').setAttribute('aria-label', `「${todo.title}」を編集`);
  item.querySelector('[data-role="destroy"]').setAttribute('aria-label', `「${todo.title}」を削除`);
}

// ---- 編集 ----

function startEditing(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;

  state.editingId = id;
  render();

  const input = itemElements.get(id)?.querySelector('[data-role="edit-input"]');
  if (!input) return;
  input.value = todo.title;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

/**
 * @param {string} id
 * @param {{ save: boolean, refocus: boolean }} options
 *   save: 入力内容を保存するか / refocus: 終了後に編集ボタンへフォーカスを戻すか
 */
function finishEditing(id, { save, refocus }) {
  // Enter で確定した直後にも focusout が届くため、二重に処理しない
  if (state.editingId !== id) return;

  const input = itemElements.get(id)?.querySelector('[data-role="edit-input"]');
  state.editingId = null;
  if (save && input) setTodos(editTodo(state.todos, id, input.value));
  else render();

  if (refocus) itemElements.get(id)?.querySelector('[data-role="edit"]')?.focus();
}

// ---- イベント ----

const idOf = (element) => element.closest('.todo-item')?.dataset.id;

ui.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const next = addTodo(state.todos, ui.input.value);
  if (next === state.todos) return;

  ui.input.value = '';
  // 「完了済み」表示のままだと追加したタスクが見えないので、すべて表示に切り替える
  if (state.filter === 'completed') location.hash = '#/';
  setTodos(next);
});

ui.toggleAll.addEventListener('change', () => {
  setTodos(toggleAll(state.todos, ui.toggleAll.checked));
});

ui.clearCompleted.addEventListener('click', () => {
  setTodos(clearCompleted(state.todos));
  ui.input.focus();
});

ui.list.addEventListener('change', (event) => {
  if (event.target.dataset.role === 'toggle') setTodos(toggleTodo(state.todos, idOf(event.target)));
});

ui.list.addEventListener('click', (event) => {
  const control = event.target.closest('[data-role]');
  if (control?.dataset.role === 'edit') startEditing(idOf(control));
  if (control?.dataset.role === 'destroy') setTodos(removeTodo(state.todos, idOf(control)));
});

ui.list.addEventListener('dblclick', (event) => {
  if (event.target.closest('[data-role="title"]')) startEditing(idOf(event.target));
});

ui.list.addEventListener('keydown', (event) => {
  if (event.target.dataset.role !== 'edit-input') return;
  // 日本語入力の変換確定の Enter では確定しない（Safari は isComposing が false になるため keyCode も見る）
  if (event.isComposing || event.keyCode === 229) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    finishEditing(idOf(event.target), { save: true, refocus: true });
  } else if (event.key === 'Escape') {
    finishEditing(idOf(event.target), { save: false, refocus: true });
  }
});

ui.list.addEventListener('focusout', (event) => {
  if (event.target.dataset.role === 'edit-input') {
    finishEditing(idOf(event.target), { save: true, refocus: false });
  }
});

window.addEventListener('hashchange', () => {
  state.filter = parseFilter(location.hash);
  render();
});

// 別のタブで変更されたら読み込み直す
window.addEventListener('storage', (event) => {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  state.todos = loadTodos();
  if (!state.todos.some((todo) => todo.id === state.editingId)) state.editingId = null;
  render();
});

ui.today.textContent = new Intl.DateTimeFormat('ja-JP', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date());

render();
