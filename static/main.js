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

// フォーム送信時（Add クリック・Enter）
function addTask(event) {
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

    // 入力内容のテキストを表示する場所を追加
    const taskText = document.createElement("p");
    taskText.className = "task-text";
    taskText.textContent = text;
    taskItem.append(taskText);

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

const addForm = document.querySelector("#add-form");
addForm.addEventListener("submit", addTask);