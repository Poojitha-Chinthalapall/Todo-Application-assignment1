const express = require("express");
const path = require ("path");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const format = require("date-fns/format");

const dbpath= path.join(__dirname, "todoApplication.db");

let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
    try {
        db = await open ({
            filename:dbpath,
            driver:sqlite3.Database,
        });
        app.listen(3000, () => 
            console.log("Server is Running at http://localhost:3000/");
        );
    } catch (e) {
        console.log(`DB Error:${e.message}`);
        process.exit(1);
    }
};

initializeDbAndServer();


const convertObject = (dbObject) => {
    return {
        id:dbObject.id,
        todo:dbObject.todo,
        priority:dbObject.priority,
        status:dbObject.status,
        category:dbObject.category,
        dueDate:dbObject.due_date,
    };
};

const hasStatus = (status) => {
    return status !== undefined;
};

const hasPriority = (priority) => {
    return priority !== undefined;
};

const hasStatusAndPriority = (status, priority) => {
    return status !== undefined && priority !== undefined;
};

const hasCategoryAndStatus = (category, status) => {
    return category !== undefined && status !== undefined;
};
const hasCategory = (category) => {
    return category !== undefined;
};

const hasCategoryAndPriority = (category, priority) => {
    return category !== undefined && priority !==undefined;
};

const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const categoryArray = ["WORK", "HOME", "LEARNING"];

app.get("/todos", async (request, response) => {
    let {priority, status, category, search_q=""} = request.query;
    let getTodosQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%"`;
    if (hasStatusAndPriority(status, priority) === true) {
        if (statusArray.includes(status) && priorityArray.includes(priority)) {
            getTodosQuery = `SELECT * FROM todo WHERE status = "${status}" AND priority = "${priority}" AND todo LIKE "%${search_q}%"`;
            const todos = await db.all(getTodosQuery);
            response.send(todos.map((todo) => convertObject(todo)));
        } else if (
            statusArray.includes(status) && 
            !priorityArray.includes(priority)
        ) {
            response.status(400);
            response.send("Invalid Todo Status");
        } else if (
            !statusArray.includes(status) &&
            priorityArray.includes(priority)
        ) {
            response.status(400);
            response.send("Invalid Todo Priority");
        } else {
            response.send("Invalid Todo Status and Priority");
        }
    } else if (hasCategoryAndStatus(category, status) === true) {
        if (categoryArray.includes(category) && statusArray.includes(status)) {
            getTodosQuery = `
            SELECT * FROM todo WHERE status = "${status}" AND category = "${category}" AND todo LIKE "%${search_q}%"`;
            const todos = await db.all(getTodosQuery);
            response.send(todos.map((todo) => convertObject(todo)));
        } else if (
            categoryArray.includes(category) && 
            !statusArray.includes(status)
        ) {
            response.status(400);
            response.send("Invalid Todo Category");
        } else if (
            !categoryArray.includes(category) &&
            statusArray.includes(status)
        ) {
            response.status(400);
            response.send("Invalid Todo Status");
        } else{
            response.status(400);
            response.send("Invalid Status and Category");
        }
    } else if (hasCategoryAndPriority(category, priority) === true) {
        if (categoryArray.includes(category) && priorityArray.includes(priority)) {
            getTodosQuery = `SELECT * FROM todo WHERE category = "${category}" AND priority = "${priority}" AND todo LIKE "%${search_q}%"`;
            const todos = await db.all(getTodosQuery);
            response.send(todos.map((todo) => convertObject(todo)));
        }  else if (
            categoryArray.includes(category) && 
            !priorityArray.includes(priority)
        ) {
            response.status(400);
            response.send("Invalid Todo Priority");
        } else if (
            !categoryArray.includes(category) &&
            priorityArray.includes(priority)
        ) {
            response.status(400);
            response.send("Invalid Todo Category");
        } else{
            response.status(400);
            response.send("Invalid Todo Category and Priority");
        }
    } else if (hasCategory(category) === true) {
        if (categoryArray.includes(category)) {
            getTodosQuery = `SELECT * FROM todo WHERE category = "${category}" AND todo LIKE "%${search_q}%"`;
            const todos = await db.all(getTodosQuery);
            response.send(todos.map((todo) => convertObject(todo)));
        } else {
            response.status(400);
            response.send("Invalid Todo Category");
        }
    } else if (hasPriority(priority) === true) {
        if (priorityArray.includes(priority)){
            getTodosQuery = `SELECT * FROM todo WHERE priority = "${priority}" AND todo LIKE "%${search_q}%"`;
            const todos = await db.all(getTodosQuery);
            response.send(todos.map((todo) => convertObject(todo)));
        } else {
            response.status(400);
            response.send("Invalid Todo Priority");
        }
    }  else if (hasStatus(status) === true) {
        if (statusArray.includes(status)){
            getTodosQuery = `SELECT * FROM todo WHERE status = "${status}" AND todo LIKE "%${search_q}%"`;
            const todos = await db.all(getTodosQuery);
            response.send(todos.map((todo) => convertObject(todo)));
        } else {
            response.status(400);
            response.send("Invalid Todo Status");
        }
    } else {
        const todos = await db.all(getTodosQuery);
            response.send(todos.map((todo) => convertObject(todo)));
    }   
});

app.get("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const getTodoQuery = `
    SELECT *
    FROM
    todo
    WHERE
    id = ${todoId};`;
    const todo = await db.get(getTodoQuery);
    response.send(convertObject(todo));
});

app.get("/agenda/", async(request, response) => {
    try {
        const {date} = request.query;

        if (date !== undefined) {
            const newDate = new Date(date);
            const formatDate = format(newDate, "YYYY-MM-DD");
            const getDueDateTodo = `
            SELECT * 
            FROM
            todo
            WHERE
            due_date = "${formattedDate}";`;
            const todos = await db.all(getDueDateTodo);
            response.send(todos.map((todo) => convertObject(todo)));
        } else {
            response.status(400);
            response.send("Invalid Due Date");
        }
    } catch (e) {
        response.status(400);
            response.send("Invalid Due Date");
    }
});

app.post("/todos/", async(request, response) => {
    const {id, todo, priority, status, category, dueDate} = request.body;
    try{
        if (!statusArray.includes(status)) {
            response.status(400);
            response.send("Invalid Todo Status");
        } else if (!priorityArray.includes(priority)) {
            response.status(400);
            response.send("Invalid Todo Priority");
        } else if (!categoryArray.includes(category)) {
            response.status(400);
            response.send("Invalid Todo Category");
        } else if (dueDate === undefined) {
            response.status(400);
            response.send("Invalid Due Date");
        } else if (dueDate !== undefined) {
            const newDate = new Date(dueDate);
            const formattedDate = format(newDate, "YYYY-MM-DD");
            const postTodoQuery = `
            INSERT INTO
            todo (id, todo, priority, status, category, due_date)
            VALUES
            (${id}, "${todo}", "${priority}", "${status}", "${category}", "${formattedDate}");`;
            await db.run(postTodoQuery);
            response.send("Todo Successfully Added");
        }
    } catch (e) {
        response.status(400);
        response.send("Invalid Due Date");
    }
});

app.put("/todo/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    let updateColumn ;
    const requestBody = request.body;

    switch (true) {
        case requestBody.todo !== undefined:
        updateColumn = "Todo";
        break;
        case requestBody.status !== undefined:
        if (!statusArray.includes(requestBody.status)) {
            response.status(400);
        response.send("Invalid Todo Status");
        } else {
            updateColumn = "Status";
        }
        break;
        case requestBody.priority !== undefined:
        if (!priorityArray.includes(requestBody.priority)) {
            response.status(400);
        response.send("Invalid Todo Priority");
        } else {
            updateColumn = "Priority";
        }
        break;
        case requestBody.category !== undefined:
        if (!categoryArray.includes(requestBody.category)) {
            response.status(400);
        response.send("Invalid Todo Category");
        } else {
            updateColumn = "Category";
        }
        break;
        case requestBody.dueDate !== undefined:
        try {
            const newDate = new Date(requestBody.dueDate);
            const formattedDate = format(newDate, "YYYY-MM-DD");
            if (requestBody.dueDate !== formattedDate) {
                response.status(400);
                response.send("Invalid Due Date");
            } else {
            updateColumn = "Due Date";
            }
        } catch (e) {
            response.status(400);
                response.send("Invalid Due Date");
        }
        break;
    }

    if (updateColumn !== undefined) {
        const previousTodoQuery = `
        SELECT *
        FROM
        todo
        WHERE
        id = ${todoId};`;
        const previousTodo = await db.get(previousTodoQuery);
        const {
            todo = previousTodo.todo,
            status = previousTodo.status,
            priority = previousTodo.priority,
            category = previousTodo.category,
            dueDate = previousTodo.dueDate,
        } = request.body;

        const updateTodoQuery = `
        UPDATE 
        todo
        SET 
        todo = "${todo}",
        ststus = "${status}",
        priority = "${priority}",
        category = "${category}",
        due_date = "${dueDate}"`;
        await db.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);

    }
});

app.delete("/todos/:todoId/", async (request, response) => {
    const {todoId} = request.params;
    const deleteTodoQuery = `
    DELETE FROM
    todo
    WHERE
    id = ${todoId};`;
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
});

module.exports = app;

