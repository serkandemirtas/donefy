/**
 * useTasks.js
 * -----------
 * Custom React hook that manages all task state and API calls.
 * Provides CRUD operations plus undo-delete functionality.
 *
 * Undo delete works by keeping the deleted task in memory for 5 seconds.
 * If the user clicks "Undo" within that window, the task is re-created
 * on the backend and restored in the UI instantly.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api.js";

export function useTasks(onToast) {
  // Main task list state
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Stores recently deleted tasks so they can be undone.
  // Each entry: { task: <full task object>, timer: <timeout id> }
  const undoStackRef = useRef({});

  // ── Load all tasks on first render ──────────────────────────────────────────
  useEffect(() => {
    api.getTasks()
      .then(setTasks)
      .catch(() => onToast("Failed to load tasks", "error"))
      .finally(() => setLoading(false));
  }, []);

  // ── Add a single new task ────────────────────────────────────────────────────
  const addTask = useCallback(async (body) => {
    try {
      const t = await api.createTask(body);
      setTasks(prev => [t, ...prev]); // prepend to show at top
    } catch (e) {
      onToast(e.message, "error");
    }
  }, []);

  // ── Toggle done / undone ─────────────────────────────────────────────────────
  const toggleDone = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    try {
      const updated = await api.updateTask(id, { done: task.done ? 0 : 1 });
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (e) {
      onToast(e.message, "error");
    }
  }, [tasks]);

  // ── Update specific fields of a task ────────────────────────────────────────
  const updateTask = useCallback(async (id, fields) => {
    try {
      const updated = await api.updateTask(id, fields);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (e) {
      onToast(e.message, "error");
    }
  }, []);

  /**
   * deleteTask
   * ----------
   * Deletes a task from the UI immediately (optimistic), then calls the API.
   * Saves the deleted task to undoStackRef so undoDelete() can restore it.
   * After 5 seconds the undo window expires automatically.
   *
   * Returns the deleted task id so callers can show an undo toast.
   */
  const deleteTask = useCallback(async (id) => {
    // Find and save the task before removing it from state
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Remove from UI immediately (optimistic update)
    setTasks(prev => prev.filter(t => t.id !== id));

    // Call the API to delete from database
    try {
      await api.deleteTask(id);
    } catch (e) {
      // If API fails, restore the task in the UI
      setTasks(prev => [task, ...prev]);
      onToast(e.message, "error");
      return;
    }

    // Store deleted task for potential undo (5-second window)
    const timer = setTimeout(() => {
      // Undo window expired — clean up
      delete undoStackRef.current[id];
    }, 5000);

    undoStackRef.current[id] = { task, timer };

    // Return the task so App.jsx can show an undo toast
    return task;
  }, [tasks]);

  /**
   * undoDelete
   * ----------
   * Restores a previously deleted task if called within the 5-second undo window.
   * Re-creates the task on the backend with the same data.
   */
  const undoDelete = useCallback(async (id) => {
    const entry = undoStackRef.current[id];
    if (!entry) return; // undo window has expired

    // Cancel the expiry timer
    clearTimeout(entry.timer);
    delete undoStackRef.current[id];

    const { task } = entry;

    try {
      // Re-create the task on the backend
      const restored = await api.createTask({
        text:           task.text,
        priority:       task.priority,
        due_date:       task.due_date       || null,
        reminder_time:  task.reminder_time  || null,
        reminder_email: task.reminder_email || null,
        image_path:     task.image_path     || null,
        notes:          task.notes          || null,
      });
      // Restore in the UI
      setTasks(prev => [restored, ...prev]);
    } catch (e) {
      onToast("Failed to restore task.", "error");
    }
  }, []);

  // ── Delete all completed tasks ───────────────────────────────────────────────
  const deleteDone = useCallback(async () => {
    try {
      const { deleted } = await api.deleteDone();
      setTasks(prev => prev.filter(t => !t.done));
      return deleted;
    } catch (e) {
      onToast(e.message, "error");
      return 0;
    }
  }, []);

  /**
   * addMany
   * -------
   * Creates multiple tasks at once (used by AI Capture).
   * Accepts either plain strings or full task objects.
   * Returns the count of successfully created tasks.
   */
  const addMany = useCallback(async (items) => {
    const created = [];
    for (const item of items) {
      try {
        const body = typeof item === "string"
          ? { text: item, priority: "medium" }
          : {
              text:     item.text,
              priority: item.priority || "medium",
              due_date: item.due_date || null,
              notes:    item.notes    || null,
            };
        const t = await api.createTask(body);
        created.push(t);
      } catch {} // skip failed items silently
    }
    // Prepend all new tasks to the top of the list
    setTasks(prev => [...created.reverse(), ...prev]);
    return created.length;
  }, []);

  return {
    tasks,
    loading,
    addTask,
    toggleDone,
    updateTask,
    deleteTask,   // returns the deleted task object
    undoDelete,   // call with task id to restore within 5s
    deleteDone,
    addMany,
  };
}
