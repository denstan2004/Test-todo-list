import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskCard } from "./TaskCard";
import type { Task, SearchResult } from "../../types";

// Mock Pragmatic DnD
vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  draggable: () => () => {},
  dropTargetForElements: () => () => {},
}));

vi.mock("@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge", () => ({
  attachClosestEdge: (data: Record<string, unknown>) => data,
  extractClosestEdge: () => null,
}));

// Mock useBoardContext
const mockDispatch = vi.fn();
vi.mock("../../state/BoardContext", () => ({
  useBoardContext: () => ({ dispatch: mockDispatch }),
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    name: "Test Task",
    completed: false,
    ...overrides,
  };
}

describe("TaskCard", () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it("renders task name, checkboxes, and action buttons", () => {
    render(<TaskCard task={makeTask()} isSelected={false} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByLabelText("Mark as complete")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Select task for bulk operation"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Edit task")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete task")).toBeInTheDocument();
    expect(screen.getByLabelText("Drag handle")).toBeInTheDocument();
  });

  it("toggles completion on checkbox click", () => {
    render(<TaskCard task={makeTask()} isSelected={false} />);
    fireEvent.click(screen.getByLabelText("Mark as complete"));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "TOGGLE_TASK",
      taskId: "task-1",
    });
  });

  it("shows 'Mark as incomplete' label when task is completed", () => {
    render(
      <TaskCard task={makeTask({ completed: true })} isSelected={false} />,
    );
    expect(screen.getByLabelText("Mark as incomplete")).toBeInTheDocument();
  });

  it("dispatches TOGGLE_BULK_SELECT on bulk checkbox click", () => {
    render(<TaskCard task={makeTask()} isSelected={false} />);
    fireEvent.click(screen.getByLabelText("Select task for bulk operation"));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "TOGGLE_BULK_SELECT",
      taskId: "task-1",
    });
  });

  it("dispatches REMOVE_TASK on delete button click", () => {
    render(<TaskCard task={makeTask()} isSelected={false} />);
    fireEvent.click(screen.getByLabelText("Delete task"));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "REMOVE_TASK",
      taskId: "task-1",
    });
  });

  it("enters edit mode and shows input pre-filled with task name", () => {
    render(<TaskCard task={makeTask()} isSelected={false} />);
    fireEvent.click(screen.getByLabelText("Edit task"));
    const input = screen.getByLabelText("Edit task name") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("Test Task");
  });

  it("dispatches EDIT_TASK on Enter with non-empty value", () => {
    render(<TaskCard task={makeTask()} isSelected={false} />);
    fireEvent.click(screen.getByLabelText("Edit task"));
    const input = screen.getByLabelText("Edit task name");
    fireEvent.change(input, { target: { value: "Updated Task" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "EDIT_TASK",
      taskId: "task-1",
      newName: "Updated Task",
    });
  });

  it("exits edit mode without dispatch on empty value confirm", () => {
    render(<TaskCard task={makeTask()} isSelected={false} />);
    fireEvent.click(screen.getByLabelText("Edit task"));
    const input = screen.getByLabelText("Edit task name");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "EDIT_TASK" }),
    );
    // Should exit edit mode
    expect(screen.queryByLabelText("Edit task name")).not.toBeInTheDocument();
  });

  it("exits edit mode on Escape without dispatching", () => {
    render(<TaskCard task={makeTask()} isSelected={false} />);
    fireEvent.click(screen.getByLabelText("Edit task"));
    const input = screen.getByLabelText("Edit task name");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Edit task name")).not.toBeInTheDocument();
  });

  it("highlights search match in task name", () => {
    const searchResult: SearchResult = {
      taskId: "task-1",
      matchType: "exact",
      matchStart: 5,
      matchEnd: 9,
      score: 0,
    };
    render(
      <TaskCard
        task={makeTask()}
        searchResult={searchResult}
        isSelected={false}
      />,
    );
    const mark = screen.getByText("Task");
    expect(mark.tagName).toBe("MARK");
  });

  it("applies completed styling class for completed tasks", () => {
    render(
      <TaskCard task={makeTask({ completed: true })} isSelected={false} />,
    );
    const nameEl = screen.getByText("Test Task");
    expect(nameEl.className).toContain("taskNameCompleted");
  });

  it("sets data-task-id attribute on the card", () => {
    const { container } = render(
      <TaskCard task={makeTask()} isSelected={false} />,
    );
    const card = container.querySelector("[data-task-id='task-1']");
    expect(card).toBeInTheDocument();
  });

  it("reflects isSelected state on bulk checkbox", () => {
    render(<TaskCard task={makeTask()} isSelected={true} />);
    const checkbox = screen.getByLabelText(
      "Select task for bulk operation",
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});
