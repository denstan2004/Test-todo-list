import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type { BoardState, BoardAction } from "../types";
import { boardReducer } from "./boardReducer";
import { loadBoardState, saveBoardState } from "./persistence";

interface BoardContextValue {
  state: BoardState;
  dispatch: React.Dispatch<BoardAction>;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, undefined, () =>
    loadBoardState(),
  );

  useEffect(() => {
    saveBoardState(state);
  }, [state]);

  return (
    <BoardContext.Provider value={{ state, dispatch }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext(): BoardContextValue {
  const context = useContext(BoardContext);
  if (context === null) {
    throw new Error("useBoardContext must be used within a BoardProvider");
  }
  return context;
}
