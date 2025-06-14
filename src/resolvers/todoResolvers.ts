import { UUID, randomUUID } from "node:crypto"

interface TodoUser {
  id: UUID,
  name: string
}

interface Todo {
  id: UUID,
  text: string,
  done: boolean,
  user: UUID
}

export { TodoUser, Todo }

const users: TodoUser[] = [
  {
    id: randomUUID(),
    name: "Heromil",
  }
]

const todos: Todo[] = [
    {
        id: randomUUID(),
        text: "Do homework",
        done: false,
        user: users[0].id,
    }
];

const todosResolver = () => {
  return todos.map(todo => (
    {
      ...todo,
      user: users.find(user => user.id === todo.user)
    }
  ));
}

const createTodo = (text: string, name: string) => {
  
  const existentUser = users.find(user => user.name === name);

  let newUserUUID = null;
  if (!existentUser) {
    newUserUUID = randomUUID();
    users.push(
      {
        id: newUserUUID,
        name,
      }
    ) 
  }  

  const todo = {
    id: randomUUID(),
    text,
    done: false,
    user: newUserUUID ?? existentUser.id
  };

  todos.push(todo);
  return {
    ...todo,
    user: users.find(user => user.id === todo.user), 
  };
}

export { todosResolver, createTodo }