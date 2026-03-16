import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import App from "./App";

// Mock Pragmatic DnD modules
vi.mock("@atlaskit/pragmatic-drag-and-drop/element/adapter", () => ({
  draggable: () => () => {},
  dropTargetForElements: () => () => {},
  monitorForElements: () => () => {},
}));
vi.mock("@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge", () => ({
  attachClosestEdge: (data: unknown) => data,
  extractClosestEdge: () => null,
}));

const STORAGE_KEY = "kanban-board-state";

beforeEach(() => {
  localStorage.clear();
});

describe("Integration: Add task flow", () => {
  it("adds a task to a column and persists to localStorage", () => {
    render(<App />);

    // Add a column first
    fireEvent.click(screen.getByRole("button", { name: /add column/i }));

    // Type a task name in the task input and submit
    const taskInput = screen.getByPlaceholderText("Add a task…");
    fireEvent.change(taskInput, { target: { value: "Buy groceries" } });
    fireEvent.submit(taskInput.closest("form")!);

    // Assert the task appears in the UI
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();

    // Assert localStorage contains the task
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const taskNames = Object.values(stored.tasks).map((t: any) => t.name);
    expect(taskNames).toContain("Buy groceries");
  });
});

describe("Integration: Search + filter combination", () => {
  it("shows only tasks matching both search query and filter", () => {
    // Seed localStorage with a column and multiple tasks
    const colId = "test-col-1";
    const seedState = {
      columns: {
        [colId]: {
          id: colId,
          title: "Work",
          taskIds: ["t1", "t2", "t3", "t4"],
        },
      },
      columnOrder: [colId],
      tasks: {
        t1: { id: "t1", name: "Write report", completed: false },
        t2: { id: "t2", name: "Write tests", completed: true },
        t3: { id: "t3", name: "Fix bug", completed: false },
        t4: { id: "t4", name: "Review PR", completed: true },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedState));

    render(<App />);

    // All 4 tasks should be visible initially
    expect(screen.getByText("Write report")).toBeInTheDocument();
    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(screen.getByText("Fix bug")).toBeInTheDocument();
    expect(screen.getByText("Review PR")).toBeInTheDocument();

    // Enter search query "Write"
    const searchInput = screen.getByPlaceholderText("Search tasks…");
    fireEvent.change(searchInput, { target: { value: "Write" } });

    // Only "Write report" and "Write tests" should be visible
    // Search highlighting splits text across <mark> elements, so query by data-task-id
    expect(document.querySelector('[data-task-id="t1"]')).toBeInTheDocument();
    expect(document.querySelector('[data-task-id="t2"]')).toBeInTheDocument();
    expect(
      document.querySelector('[data-task-id="t3"]'),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-task-id="t4"]'),
    ).not.toBeInTheDocument();

    // Now also apply "Completed" filter
    fireEvent.click(screen.getByRole("button", { name: /^Completed$/i }));

    // Only "Write tests" (t2: completed + matches "Write") should remain
    expect(document.querySelector('[data-task-id="t2"]')).toBeInTheDocument();
    expect(
      document.querySelector('[data-task-id="t1"]'),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-task-id="t3"]'),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-task-id="t4"]'),
    ).not.toBeInTheDocument();
  });
});

describe("Integration: Bulk select → bulk delete", () => {
  it("selects tasks via checkboxes and removes them with bulk delete", () => {
    // Seed localStorage with tasks
    const colId = "test-col-1";
    const seedState = {
      columns: {
        [colId]: {
          id: colId,
          title: "Tasks",
          taskIds: ["t1", "t2", "t3"],
        },
      },
      columnOrder: [colId],
      tasks: {
        t1: { id: "t1", name: "Task Alpha", completed: false },
        t2: { id: "t2", name: "Task Beta", completed: false },
        t3: { id: "t3", name: "Task Gamma", completed: false },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedState));

    render(<App />);

    // All 3 tasks should be visible
    expect(screen.getByText("Task Alpha")).toBeInTheDocument();
    expect(screen.getByText("Task Beta")).toBeInTheDocument();
    expect(screen.getByText("Task Gamma")).toBeInTheDocument();

    // Select Task Alpha and Task Gamma via bulk checkboxes
    const bulkCheckboxes = screen.getAllByLabelText(
      "Select task for bulk operation",
    );
    // Checkboxes correspond to tasks in order: t1, t2, t3
    fireEvent.click(bulkCheckboxes[0]); // Task Alpha
    fireEvent.click(bulkCheckboxes[2]); // Task Gamma

    // Bulk actions bar should appear with "2 selected"
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    // Click bulk delete
    const bulkBar = screen.getByRole("toolbar", { name: /bulk actions/i });
    fireEvent.click(within(bulkBar).getByText("Delete"));

    // Task Alpha and Task Gamma should be removed
    expect(screen.queryByText("Task Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Task Gamma")).not.toBeInTheDocument();

    // Task Beta should still be present
    expect(screen.getByText("Task Beta")).toBeInTheDocument();

    // Verify localStorage reflects the deletion
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const remainingNames = Object.values(stored.tasks).map((t: any) => t.name);
    expect(remainingNames).toEqual(["Task Beta"]);
  });
});
