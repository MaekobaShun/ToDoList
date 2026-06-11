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
    // タスクを追加する枠を作る
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";

    taskItem.append(createTaskText(text));

    // 朝昼夜ボタンの追加
    timeboxingButtons(taskItem);
    // 完了ボタンと削除ボタンの追加
    OrganizationButtons(taskItem);

    // 作った要素を宿題リストに追加する
    const taskList = document.querySelector("#taskList");
    taskList.append(taskItem);

    input_element.value = "";
}

// 朝昼夜ボタンの追加
function timeboxingButtons(taskItem) {
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
        taskItem.append(btn);
    }
}

// 完了ボタンと削除ボタンの追加
function OrganizationButtons(taskItem){
    // 完了ボタンを作って追加する
    const doneCheckbox = document.createElement("input");
    doneCheckbox.type = "checkbox";
    doneCheckbox.className = "task-done";

    doneCheckbox.addEventListener("change", ()=>{
        if(doneCheckbox.checked){
            doneList = document.querySelector("#doneList");
            doneList.append(taskItem);
        }else{
            taskList = document.querySelector("#taskList");
            taskList.append(taskItem);
        }
    });
    taskItem.prepend(doneCheckbox);

    // 削除ボタンを作って追加する
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "🗑";
    deleteButton.addEventListener("click", (event)=>{
        const taskItem =event.target.parentElement;
        taskItem.remove();
    })
    taskItem.append(deleteButton);
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

        const taskItem = document.createElement("li");
        taskItem.className = "task-item";

        taskItem.append(createTaskText(text));

        timeboxingButtons(taskItem);
        OrganizationButtons(taskItem);

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