import { BoardProvider } from "./state/BoardContext";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { Board } from "./components/Board/Board";
import "./App.css";

function App() {
  return (
    <BoardProvider>
      <div className="app">
        <header className="app-header">
          <h1>Kanban Board</h1>
        </header>
        <Toolbar />
        <main className="app-main">
          <Board />
        </main>
      </div>
    </BoardProvider>
  );
}

export default App;
