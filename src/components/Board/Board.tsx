import { useEffect, useRef } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useBoardContext } from "../../state/BoardContext";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import { Column } from "../Column/Column";
import styles from "./Board.module.css";

export function Board() {
  const { state, dispatch } = useBoardContext();
  const boardRef = useRef<HTMLDivElement>(null);

  // Central drag-and-drop monitor for handling all drops
  useDragAndDrop(state, dispatch);

  // Register board as a Pragmatic DnD drop target for column reordering
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ type: "board" }),
      canDrop: ({ source }) => source.data.type === "column",
    });
  }, []);

  function handleAddColumn() {
    dispatch({ type: "ADD_COLUMN" });
  }

  return (
    <div ref={boardRef} className={styles.board} data-board>
      {state.columnOrder.map((columnId) => {
        const column = state.columns[columnId];
        if (!column) return null;
        return <Column key={columnId} column={column} />;
      })}
      <button
        className={styles.addColumnBtn}
        onClick={handleAddColumn}
        type="button"
        aria-label="Add column"
      >
        + Add Column
      </button>
    </div>
  );
}
