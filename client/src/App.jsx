import { useEffect, useState } from "react";
import { getTodos, createTodo, updateTodo, deleteTodo } from "./api";
import { FILTERS } from "./filters";
import Sidebar from "./components/Sidebar";
import TodoForm from "./components/TodoForm";
import TodoItem from "./components/TodoItem";

const TODOS_PER_PAGE = 7;

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Runs an API action and shows its error in the banner if it fails
  const run = async (action) => {
    try {
      setError("");
      await action();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    run(async () => setTodos(await getTodos())).finally(() =>
      setLoading(false)
    );
  }, []);

  const handleAdd = (title) =>
    run(async () => {
      const newTodo = await createTodo(title);
      setTodos((prev) => [newTodo, ...prev]);
    });

  const handleUpdate = (id, data) =>
    run(async () => {
      const updated = await updateTodo(id, data);
      setTodos((prev) => prev.map((todo) => (todo._id === id ? updated : todo)));
    });

  const handleDelete = (id) =>
    run(async () => {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
    });

  const handleClearDone = () =>
    run(async () => {
      const done = todos.filter(FILTERS.done.test);
      await Promise.all(done.map((t) => deleteTodo(t._id)));
      setTodos((prev) => prev.filter((t) => !t.completed));
    });

  const filteredTodos = todos.filter(FILTERS[filter].test);
  const totalPages = Math.max(1, Math.ceil(filteredTodos.length / TODOS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visibleTodos = filteredTodos.slice(
    (currentPage - 1) * TODOS_PER_PAGE,
    currentPage * TODOS_PER_PAGE
  );

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const changePage = (nextPage) => {
    setPage(Math.max(1, Math.min(nextPage, totalPages)));
  };

  return (
    <div className="layout">
      <Sidebar
        todos={todos}
        filter={filter}
        onFilter={changeFilter}
        onClearDone={handleClearDone}
      />

      <main className="panel content">
        <header className="content-header">
          <h2>{FILTERS[filter].label}</h2>
          <span className="content-count">
            {filteredTodos.length} {filteredTodos.length === 1 ? "task" : "tasks"}
          </span>
        </header>

        <TodoForm onAdd={handleAdd} />

        {error && (
          <div className="error" role="alert">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        {loading ? (
          <p className="empty">Loading...</p>
        ) : filteredTodos.length === 0 ? (
          <div className="empty">
            <img src="/logo.png" alt="" />
            <p>
              {filter === "done"
                ? "Nothing completed yet"
                : "You're all caught up. Add a task above."}
            </p>
          </div>
        ) : (
          <ul className="todo-list">
            {visibleTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav className="pagination" aria-label="Todo pages">
            <button
              onClick={() => changePage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  className={pageNumber === currentPage ? "active" : ""}
                  onClick={() => changePage(pageNumber)}
                  aria-current={pageNumber === currentPage ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              )
            )}
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              &gt;
            </button>
            <button
              onClick={() => changePage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              &gt;&gt;
            </button>
          </nav>
        )}
      </main>
    </div>
  );
}

export default App;
