import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { db, auth } from './firebase';

// --- Import Icons ---
import { IoMdAdd } from "react-icons/io";
import { RiDeleteBin6Line } from "react-icons/ri";

function App() {
  
  const openModal = (todo) => {setSelectedTodo(todo);setIsModalOpen(true);};
  const closeModal = () => {setIsModalOpen(false);setSelectedTodo(null);};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [reminderTime, setReminderTime] = useState('');
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // --- Loading State ---

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // The loading state related to data will be handled in the next useEffect
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const getTodos = async () => {
      setLoading(true); // Set loading true when user changes
      if (!user) {
        setTodos([]);
        setLoading(false);
        return;
      }
      const q = query(collection(db, "todos"), where("userId", "==", user.uid));
      const data = await getDocs(q);
      setTodos(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      setLoading(false); // Set loading false after fetch
    };

    getTodos();
  }, [user]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };


  // A new component for the Modal
  const TodoModal = ({ todo, onClose, onToggleComplete, onDelete }) => {
  if (!todo) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>{todo.text}</h2>
        <p><strong>Status:</strong> {todo.completed ? "Completed" : "Pending"}</p>
        <p><strong>Created:</strong> {todo.createdAt?.toDate().toLocaleString()}</p>
        {todo.reminderTime && (
          <p><strong>Reminder:</strong> {todo.reminderTime?.toDate().toLocaleString()}</p>
        )}
        <div className="modal-actions">
          <button className="modal-button" onClick={() => onToggleComplete(todo.id, todo.completed)}>
            {todo.completed ? "Mark as Pending" : "Mark as Complete"}
          </button>
          <button className="modal-button delete" onClick={() => onDelete(todo.id)}>
            Delete Task
          </button>
        </div>
      </div>
    </div>
  );
};
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (inputValue.trim() === '' || !user) return;
    const newTodoData={
      text: inputValue,
      completed: false,
      userId: user.uid,
      reminderTime: reminderTime ? new Date(reminderTime) : null, // Save as a proper Date object
      reminderSent: false };

    const newTodoRef = await addDoc(collection(db, "todos"), newTodoData);
    // Optimistically update UI
    setTodos([...todos, { id: newTodoRef.id, text: inputValue, completed: false, userId: user.uid, reminderTime,newTodoData: reminderTime ? new Date(reminderTime) : null, reminderSent: false }]);
    setInputValue('');
    setReminderTime('')
  };

  const handleDeleteTask = async (id) => {
    const todoDoc = doc(db, "todos", id);
    await deleteDoc(todoDoc);
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleToggleComplete = async (id, currentStatus) => {
    const todoDoc = doc(db, "todos", id);
    await updateDoc(todoDoc, { completed: !currentStatus });
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // --- Loading State Component ---
  const LoadingSpinner = () => (
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="app-container">
      {!user ? (
        <div className="sign-in-container">
          <h1>Welcome to Your To-Do List</h1>
          <p>Sign in to get started.</p>
          <button onClick={signInWithGoogle} className="auth-button google">
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          <div className="header">
            <h1>{user.displayName.split(' ')[0]}'s Tasks</h1>
            <button onClick={handleSignOut} className="auth-button">Sign Out</button>
          </div>
          <form className="form-container" onSubmit={handleAddTask}>
            <input
              type="text"
              className="todo-input"
              placeholder="Add a new task..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <input
                  type="datetime-local"
                  className="reminder-input"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
            />
            <button type="submit" className="add-button">
              <IoMdAdd />
            </button>
          </form>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <ul className="todo-list">
              {!loading && todos.length === 0 && (
                <li className="empty-state">No tasks yet. Add one above!</li>
              )}
              {todos.map(todo => (
                <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`} onClick={() => openModal(todo)}><span>{todo.text}</span>
                  <span onClick={() => handleToggleComplete(todo.id, todo.completed)}>
                    {todo.text}
                  </span>
                  <button className="delete-button" onClick={() => handleDeleteTask(todo.id)}>
                    <RiDeleteBin6Line />
                  </button>
                </li>
                
              ))}
            </ul>
          )}
        </>
      )}
      <TodoModal
  todo={selectedTodo}
  onClose={closeModal}
  onToggleComplete={handleToggleComplete}
  onDelete={(id) => {
    handleDeleteTask(id);
    closeModal(); // Close modal after deleting
  }}
/>
    </div>
  );
}

export default App;