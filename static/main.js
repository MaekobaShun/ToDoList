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

// addボタンを押したとき
function addTask(event){
    event.preventDefault();
    const input_element = document.querySelector("#title");
    const text = input_element.value.trim();
    const taskList = document.querySelector("#inbox");

    // テキストが空の場合は何もしない
    if (text === ""){
        return;
    }

    const newList = document.createElement("li");
    newList.textContent = text;

    taskList.append(newList);
    input_element.value = "";
}

let add_button = document.querySelector("button");
add_button.addEventListener("click", addTask);