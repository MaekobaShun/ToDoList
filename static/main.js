// ボトムシートの要素
const sheetOverlay = document.getElementById('bottom-sheet-overlay');
const bottomSheet = document.getElementById('bottom-sheet');
const sheetForm = document.getElementById('sheet-form');
const sheetTaskId = document.getElementById('sheet-task-id');
const sheetTitle = document.getElementById('sheet-title');
const sheetDesc = document.getElementById('sheet-description');

// ボトムシートを開く
function openBottomSheet(slot = '未分類', task = null) {
    if (task) {
        // 編集モード
        sheetTaskId.value = task.id;
        sheetTitle.value = task.title;
        sheetDesc.value = task.description || '';
        document.querySelector(`input[name="sheet-slot"][value="${task.time_slot}"]`).checked = true;
    } else {
        // 追加モード
        sheetTaskId.value = '';
        sheetTitle.value = '';
        sheetDesc.value = '';
        document.querySelector(`input[name="sheet-slot"][value="${slot}"]`).checked = true;
    }
    
    sheetOverlay.classList.add('active');
    bottomSheet.classList.add('active');
    setTimeout(() => sheetTitle.focus(), 300);
}

// ボトムシートを閉じる
function closeBottomSheet() {
    sheetOverlay.classList.remove('active');
    bottomSheet.classList.remove('active');
    sheetTitle.blur();
    sheetDesc.blur();
}

sheetOverlay.addEventListener('click', closeBottomSheet);
document.querySelector('.bottom-sheet-handle').addEventListener('click', closeBottomSheet);

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

// フォーム送信
sheetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = sheetTitle.value.trim();
    if (!title) return;
    
    const todoData = {
        title,
        description: sheetDesc.value.trim(),
        time_slot: document.querySelector('input[name="sheet-slot"]:checked').value
    };
    
    if (sheetTaskId.value) {
        todoData.id = sheetTaskId.value;
    }
    
    const savedTodo = await saveTodo(todoData);
    
    if (sheetTaskId.value) {
        // 既存の要素を削除して再描画
        const existingEl = document.querySelector(`.task-item[data-id="${savedTodo.id}"]`);
        if (existingEl) existingEl.remove();
    }
    
    renderTask(savedTodo);
    closeBottomSheet();
});

// タスクの描画
function renderTask(todo) {
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";
    taskItem.dataset.id = todo.id;
    taskItem.dataset.slot = todo.time_slot;

    // スワイプ背景（移動・削除）
    const swipeBg = document.createElement("div");
    swipeBg.className = "task-swipe-bg";
    
    const moveBtn = document.createElement("div");
    moveBtn.className = "swipe-action-move";
    moveBtn.textContent = "移動";
    
    const deleteBtn = document.createElement("div");
    deleteBtn.className = "swipe-action-delete";
    deleteBtn.textContent = "削除";
    
    swipeBg.append(moveBtn, deleteBtn);
    taskItem.append(swipeBg);

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

    // スワイプ処理
    addSwipeMenu(taskItem, content, moveBtn, deleteBtn, todo);

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

// スワイプメニュー機能
function addSwipeMenu(taskItem, content, moveBtn, deleteBtn, todo) {
    let startX = 0;
    let startY = 0;
    let isSwiping = false;
    let isVerticalScroll = false;
    let currentX = 0;
    const maxSwipe = -160; // 移動(80px) + 削除(80px)

    taskItem.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
        isVerticalScroll = false;
        taskItem.classList.add('swiping');
        content.style.transition = 'none';
    }, { passive: true });

    taskItem.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const diffX = touchX - startX;
        const diffY = touchY - startY;

        if (!isVerticalScroll && Math.abs(diffY) > Math.abs(diffX)) {
            isVerticalScroll = true;
            isSwiping = false;
            content.style.transform = '';
            return;
        }

        if (!isVerticalScroll && diffX < 0) {
            currentX = Math.max(diffX, maxSwipe - 20); // 少しゴムっぽく
            content.style.transform = `translateX(${currentX}px)`;
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    taskItem.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        taskItem.classList.remove('swiping');
        content.style.transition = 'transform 0.3s ease-out';
        
        if (!isVerticalScroll) {
            if (currentX < -80) {
                // メニューを開いたままにする
                content.style.transform = `translateX(${maxSwipe}px)`;
            } else {
                // 元に戻す
                content.style.transform = '';
            }
        }
    });

    // メニュー外をタップしたら閉じる
    document.addEventListener('touchstart', (e) => {
        if (!taskItem.contains(e.target) && content.style.transform !== '') {
            content.style.transform = '';
        }
    });

    // 削除ボタン
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        taskItem.classList.add('swipe-delete');
        await deleteTodoApi(todo.id);
        setTimeout(() => taskItem.remove(), 300);
    });

    // 移動ボタン
    moveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        content.style.transform = '';
        openBottomSheet(todo.time_slot, todo);
    });
}

// スロット内の並び替え（ドラッグ）
const slotSortableOptions = {
    animation: 150,
    handle: ".task-item-content",
    draggable: ".task-item",
    delay: 200,
    delayOnTouchOnly: true,
    touchStartThreshold: 3,
    onEnd: async function (evt) {
        const itemEl = evt.item;
        const todoId = itemEl.dataset.id;
        
        // 移動先のリストからスロットを判定
        const listId = evt.to.id;
        let newSlot = "未分類";
        if (listId === "morningList") newSlot = "朝";
        if (listId === "afternoonList") newSlot = "昼";
        if (listId === "nightList") newSlot = "夜";
        
        if (itemEl.dataset.slot !== newSlot) {
            itemEl.dataset.slot = newSlot;
            await saveTodo({ id: todoId, time_slot: newSlot });
        }
    }
};

for (const selector of ["#taskList", "#morningList", "#afternoonList", "#nightList"]) {
    new Sortable(document.querySelector(selector), {
        ...slotSortableOptions,
        group: "shared",
    });
}

// 初期読み込み
fetchTodos();