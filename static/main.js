/*
//朝ボタンを押したとき
function morning(task){
    const morning_event = document.querySelector("#morning");
    const morningTasks = document.createElement("ul");
    morningTasks.textContent = task;
    morning_event.append(morningTasks);
}

//昼ボタンを押したとき
function afternoon(task){
    const afternoon_event = document.querySelector("#afternoon");
    const afternoonTasks = document.createElement("ul");
    afternoonTasks.textContent = task;
    afternoon_event.append(afternoonTasks);
}

//夜ボタンを押したとき
function night(task){
    const night_event = document.querySelector("#night");
    const nightTasks = document.createElement("ul");
    nightTasks.textContent = task;
    night_event.append(nightTasks);
}
*/

function makeTaskTextEditable(taskText) {
    const startEdit = () => {
        const originalText = taskText.textContent;
        const input = document.createElement("input");
        input.type = "text";
        input.value = originalText;
        input.className = "task-edit-input";

        taskText.replaceWith(input);
        input.focus();
        input.select();

        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            const newText = document.createElement("p");
            newText.className = "task-text";
            newText.textContent = input.value.trim() || originalText;
            input.replaceWith(newText);
            makeTaskTextEditable(newText);
        };

        input.addEventListener("blur", finish, { once: true });
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                finish();
            }
            if (e.key === "Escape") {
                input.value = originalText;
                finish();
            }
        });
    };

    taskText.addEventListener("dblclick", startEdit);

    let pressTimer;
    taskText.addEventListener("touchstart", (e) => {
        pressTimer = setTimeout(() => {
            e.preventDefault();
            startEdit();
        }, 500);
    }, { passive: false });
    taskText.addEventListener("touchend", () => clearTimeout(pressTimer));
    taskText.addEventListener("touchmove", () => clearTimeout(pressTimer));
}

function createTaskText(text) {
    const taskText = document.createElement("p");
    taskText.className = "task-text";
    taskText.textContent = text;
    makeTaskTextEditable(taskText);
    return taskText;
}

// 朝昼夜ボタンの追加
function timeboxingButtons(container, taskItem) {
    const slots = [
        { label: "☀️", listSelector: "#morningList" },
        { label: "🕛", listSelector: "#afternoonList" },
        { label: "🌙", listSelector: "#nightList" },
    ];

    for (const { label, listSelector } of slots) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "slot-btn";
        btn.textContent = label;
        btn.addEventListener("click", () => {
            document.querySelector(listSelector).append(taskItem);
        });
        container.append(btn);
    }
}

// 完了ボタンと削除ボタンの追加
function OrganizationButtons(container, taskItem){
    // 完了ボタンを作って追加する
    const doneCheckbox = document.createElement("input");
    doneCheckbox.type = "checkbox";
    doneCheckbox.className = "task-done";

    doneCheckbox.addEventListener("change", ()=>{
        if(doneCheckbox.checked){
            document.querySelector("#doneList").append(taskItem);
        }else{
            document.querySelector("#taskList").append(taskItem);
        }
    });
    container.prepend(doneCheckbox);

    // 削除ボタンを作って追加する
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "🗑";
    deleteButton.addEventListener("click", ()=>{
        taskItem.remove();
    })
    container.append(deleteButton);
}

// スワイプ削除機能の追加
function addSwipeToDelete(taskItem, content) {
    let startX = 0;
    let startY = 0;
    let isSwiping = false;
    let isVerticalScroll = false;
    const threshold = 80;

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
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        if (!isVerticalScroll && Math.abs(diffY) > Math.abs(diffX)) {
            isVerticalScroll = true;
            isSwiping = false;
            content.style.transform = '';
            return;
        }

        if (!isVerticalScroll && diffX < 0) {
            content.style.transform = `translateX(${diffX}px)`;
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    taskItem.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        taskItem.classList.remove('swiping');
        content.style.transition = 'transform 0.3s ease-out';
        
        const diffX = e.changedTouches[0].clientX - startX;
        if (!isVerticalScroll && diffX < -threshold) {
            taskItem.classList.add('swipe-delete');
            setTimeout(() => {
                taskItem.remove();
            }, 300);
        } else {
            content.style.transform = '';
        }
    });
}

function createTaskElement(text) {
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";

    const swipeBg = document.createElement("div");
    swipeBg.className = "task-swipe-bg";
    swipeBg.textContent = "削除";
    taskItem.append(swipeBg);

    const content = document.createElement("div");
    content.className = "task-item-content";
    taskItem.append(content);

    content.append(createTaskText(text));

    timeboxingButtons(content, taskItem);
    OrganizationButtons(content, taskItem);
    
    addSwipeToDelete(taskItem, content);

    return taskItem;
}

// フォーム送信時（Add クリック・Enter）
function addTask(event) {
    // フォーム送信時のページがリロードするのを防ぐ
    event.preventDefault();

    // 入力内容の取得
    const input_element = document.querySelector("#title");
    const text = input_element.value.trim();
    if (text === "") {
        return;
    }
    
    const taskItem = createTaskElement(text);

    // 作った要素を宿題リストに追加する
    const taskList = document.querySelector("#taskList");
    taskList.append(taskItem);

    input_element.value = "";
}


// +ボタン（時間帯直接追加）
function addTaskToSlot(listSelector){
    const list = document.querySelector(listSelector);

    // 入力欄が開いていたら閉じる
    const existing = list.querySelector(".inline-add-form");
    if(existing){
        existing.remove();
        return;
    }

    // インライン入力フォームを入力
    const formItem = document.createElement("li");
    formItem.className = "task-item inline-add-form";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "タスクを入力";
    input.className = "inline-add-input";

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.textContent = "Add";
    submitBtn.className = "inline-add-btn";

    // タスク追加処理
    const handleAdd = () => {
        const text = input.value.trim();
        if(text === "") return;

        const taskItem = createTaskElement(text);

        list.insertBefore(taskItem, formItem); // 入力欄の直前に挿入
        formItem.remove();
    };

    submitBtn.addEventListener("click", handleAdd);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleAdd();
        if (e.key === "Escape") formItem.remove(); // Escで閉じる
    });

    formItem.append(input, submitBtn);
    list.append(formItem);
    input.focus();
}


// 各＋ボタンにイベント登録
document.querySelector("#morning-add-task")
    .addEventListener("click", () => addTaskToSlot("#morningList"));
document.querySelector("#afternoon-add-task")
    .addEventListener("click", () => addTaskToSlot("#afternoonList"));
document.querySelector("#night-add-task")
    .addEventListener("click", () => addTaskToSlot("#nightList"));
const addForm = document.querySelector("#add-form");
addForm.addEventListener("submit", addTask);

// スロット内の並び替え（ドラッグ）
const slotSortableOptions = {
    animation: 150,
    handle: ".task-text",
    draggable: ".task-item",
    filter: ".inline-add-form",
    delay: 200,
    delayOnTouchOnly: true,
    touchStartThreshold: 3,
};

for (const [selector, group] of [
    ["#morningList", "morning"],
    ["#afternoonList", "afternoon"],
    ["#nightList", "night"],
]) {
    new Sortable(document.querySelector(selector), {
        ...slotSortableOptions,
        group,
    });
}