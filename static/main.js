// ボトムシートの要素
const sheetOverlay = document.getElementById('bottom-sheet-overlay');
const bottomSheet = document.getElementById('bottom-sheet');
const sheetTaskId = document.getElementById('sheet-task-id');
const sheetTitle = document.getElementById('sheet-title');
const sheetDesc = document.getElementById('sheet-description');
const sheetDeleteBtn = document.getElementById('sheet-delete-btn');

// ボトムシートを開く
function openBottomSheet(slot = '未分類', task = null) {
    if (task) {
        // 編集モード
        sheetTaskId.value = task.id;
        sheetTitle.value = task.title;
        sheetDesc.value = task.description || '';
        document.querySelector(`input[name="sheet-slot"][value="${task.time_slot}"]`).checked = true;
        sheetDeleteBtn.style.display = '';
    } else {
        // 追加モード
        sheetTaskId.value = '';
        sheetTitle.value = '';
        sheetDesc.value = '';
        document.querySelector(`input[name="sheet-slot"][value="${slot}"]`).checked = true;
        sheetDeleteBtn.style.display = 'none';
    }

    sheetOverlay.classList.add('active');
    bottomSheet.classList.add('active');
    setTimeout(() => sheetTitle.focus(), 300);
}

// ボトムシートを閉じる（保存しない）
function hideBottomSheet() {
    sheetOverlay.classList.remove('active');
    bottomSheet.classList.remove('active');
    sheetTitle.blur();
    sheetDesc.blur();
}

// 入力内容を保存して閉じる（タイトルが空ならそのまま閉じる）
async function submitBottomSheet() {
    const title = sheetTitle.value.trim();
    if (!title) {
        hideBottomSheet();
        return;
    }

    const todoData = {
        title,
        description: sheetDesc.value.trim(),
        time_slot: document.querySelector('input[name="sheet-slot"]:checked').value
    };

    const isEdit = !!sheetTaskId.value;
    if (isEdit) {
        todoData.id = sheetTaskId.value;
    }

    const savedTodo = await saveTodo(todoData);

    if (isEdit) {
        // 既存の要素を削除して再描画
        const existingEl = document.querySelector(`.task-item[data-id="${savedTodo.id}"]`);
        if (existingEl) existingEl.remove();
    }

    renderTask(savedTodo);
    hideBottomSheet();
}

// 上矢印ボタン
document.getElementById('sheet-submit-btn').addEventListener('click', submitBottomSheet);

// タイトル欄でEnter/確定キーを押したら送信
sheetTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        submitBottomSheet();
    }
});

// オーバーレイ（上の空白部分）をタッチしたら入力を確定して閉じる
sheetOverlay.addEventListener('click', submitBottomSheet);

// ハンドル（上部のバー）はキャンセルして閉じる
document.querySelector('.bottom-sheet-handle').addEventListener('click', hideBottomSheet);

// 削除ボタン
sheetDeleteBtn.addEventListener('click', async () => {
    const id = sheetTaskId.value;
    if (id) {
        await deleteTodoApi(id);
        const existingEl = document.querySelector(`.task-item[data-id="${id}"]`);
        if (existingEl) existingEl.remove();
    }
    hideBottomSheet();
});

// 各＋ボタンのイベント
document.getElementById('fab-add-task').addEventListener('click', () => openBottomSheet('未分類'));
document.getElementById('unclassified-add-task').addEventListener('click', () => openBottomSheet('未分類'));
document.getElementById('morning-add-task').addEventListener('click', () => openBottomSheet('朝'));
document.getElementById('afternoon-add-task').addEventListener('click', () => openBottomSheet('昼'));
document.getElementById('night-add-task').addEventListener('click', () => openBottomSheet('夜'));

// APIとの通信
async function fetchTodos() {
    const res = await fetch('/api/todos');
    const todos = await res.json();

    // リストをクリア
    document.getElementById('taskList').innerHTML = '';
    document.getElementById('morningList').innerHTML = '';
    document.getElementById('afternoonList').innerHTML = '';
    document.getElementById('nightList').innerHTML = '';
    document.getElementById('doneList').innerHTML = '';

    todos.forEach(todo => renderTask(todo));
}

async function saveTodo(todoData) {
    const isEdit = !!todoData.id;
    const url = isEdit ? `/api/todos/${todoData.id}` : '/api/todos';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData)
    });
    return await res.json();
}

async function deleteTodoApi(id) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
}

// タスクの描画
function renderTask(todo) {
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";
    taskItem.dataset.id = todo.id;
    taskItem.dataset.slot = todo.time_slot;

    // コンテンツ部分
    const content = document.createElement("div");
    content.className = "task-item-content";

    // 完了チェックボックス
    const doneCheckbox = document.createElement("input");
    doneCheckbox.type = "checkbox";
    doneCheckbox.className = "task-done";
    doneCheckbox.checked = todo.completed;
    doneCheckbox.addEventListener("change", async () => {
        todo.completed = doneCheckbox.checked;
        await saveTodo({ id: todo.id, completed: todo.completed });

        taskItem.remove();
        renderTask(todo);
    });
    content.append(doneCheckbox);

    // テキスト部分
    const textWrapper = document.createElement("div");
    textWrapper.className = "task-content-wrapper";

    const titleEl = document.createElement("p");
    titleEl.className = "task-text";
    titleEl.textContent = todo.title;
    textWrapper.append(titleEl);

    if (todo.description) {
        const descEl = document.createElement("p");
        descEl.className = "task-desc";
        descEl.textContent = todo.description;
        textWrapper.append(descEl);
    }

    content.append(textWrapper);
    taskItem.append(content);

    // タップで編集（ボトムシートを開く）
    textWrapper.addEventListener('click', () => {
        openBottomSheet(todo.time_slot, todo);
    });

    // リストに追加
    if (todo.completed) {
        document.getElementById('doneList').append(taskItem);
    } else {
        const listMap = {
            "未分類": "#taskList",
            "朝": "#morningList",
            "昼": "#afternoonList",
            "夜": "#nightList"
        };
        document.querySelector(listMap[todo.time_slot] || "#taskList").append(taskItem);
    }
}

// スロット内の並び替え（ドラッグ） ※同じ時間帯の中だけで並び替え可能
const slotSortableOptions = {
    animation: 150,
    handle: ".task-item-content",
    draggable: ".task-item",
    delay: 200,
    delayOnTouchOnly: true,
    touchStartThreshold: 3,
};

// group を指定せず、各リストを独立させることで他の時間帯への移動を禁止する
for (const selector of ["#taskList", "#morningList", "#afternoonList", "#nightList"]) {
    new Sortable(document.querySelector(selector), slotSortableOptions);
}

// 初期読み込み
fetchTodos();