const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv')
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

const filePath = path.join(__dirname, 'todo.json');

const readTodos = async () => {
  try {
    const todos = await fs.readJson(filePath);
    return todos;
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeJson(filePath , []);
      return [];
    }
    console.error('Error reading todo.json:', error.message);
    throw error;
  }
};

const writeTodos = async (todos) => {
  try {
    await fs.writeJson(filePath, todos);
  } catch (error) {
    console.error('Error writing to todo.json:', error.message);
    throw error;
  }
};


app.get('/tasks', async (req, res) => {
    try {
        const todos = await readTodos();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
    
        const paginatedTodos = todos.slice(startIndex, endIndex);
    
        res.json({
          total: todos.length,
          page: page,
          limit: limit,
          todos: paginatedTodos
        });
      } catch (error) {
        res.status(500).send('An error occurred while retrieving todos.');
      }
});


app.get('/tasks/:id', async (req, res) => {
  try {
    const todos = await readTodos();
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    if (!todo) {
        return res.status(404).send('The todo with the given ID was not found.');
    }
    res.json(todo);
  } catch (error) {
    res.status(500).send('An error occurred while retrieving the todo.');
  }
});


app.post('/tasks', async (req, res) => {
  try {
    const todos = await readTodos();
    console.log(todos.length)

    if(req.body.title && req.body.description){
        const newTodo = {
            id: todos.length + 1, 
            title: req.body.title,
            description : req.body.description,
            completed: req.body.completed
          };
          todos.push(newTodo);
          await writeTodos(todos);
          res.status(201).json(newTodo);
    }else {
        res.status(500).send('Please enter both title and description of the Todo');
    }
    
  } catch (error) {
    res.status(500).send('An error occurred while creating the todo.');
  }
});


app.put('/tasks/:id', async (req, res) => {
  try {
    const todos = await readTodos();
    const todo = todos.find(t => t.id === parseInt(req.params.id));
    if (!todo) {
        return res.status(404).send('The todo with the given ID was not found.');
    }

    todo.title = req.body.title;
    todo.description = req.body.description
    todo.completed = req.body.completed;
    await writeTodos(todos);
    res.json(todo);
  } catch (error) {
    res.status(500).send('An error occurred while updating the todo.');
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const todos = await readTodos();
    const todoIndex = todos.findIndex(t => t.id === parseInt(req.params.id));
    if (todoIndex === -1) return res.status(404).send('The todo with the given ID was not found.');

    const [deletedTodo] = todos.splice(todoIndex, 1);
    await writeTodos(todos);
    res.json(deletedTodo);
  } catch (error) {
    res.status(500).send('An error occurred while deleting the todo.');
  }
});

app.listen(port, () => {
  console.log(`server started at port ${port}`);
});
