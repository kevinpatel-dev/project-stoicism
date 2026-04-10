import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
// 🌟 Import the new DatePicker and its default CSS
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TaskForm = ({ userId }) => {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [priority, setPriority] = useState('low');
  const [dueDate, setDueDate] = useState(null); // Now starts as null instead of empty string

  const calculateReward = () => {
    const diffXp = { easy: 10, medium: 25, hard: 50 }[difficulty] || 10;
    const priXp = { low: 0, medium: 5, high: 10 }[priority] || 0;
    return diffXp + priXp;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addDoc(collection(db, "tasks"), {
      userId,
      title,
      difficulty,
      priority,
      // Convert Date object to string so it saves nicely in Firebase
      dueDate: dueDate ? dueDate.toISOString() : null, 
      completed: false,
      createdAt: new Date().getTime() 
    });
    
    setTitle(''); 
    setDueDate(null);
  };

  return (
    <form onSubmit={handleSubmit} className="dark:bg-zinc-900 bg-white p-6 sm:p-8 rounded-xl shadow-lg border dark:border-purple-900/50 border-purple-200 mb-8 relative overflow-hidden">
      
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 relative z-10">
        <div className="md:col-span-4">
          <label className="block text-sm font-bold text-purple-600 dark:text-purple-400 mb-1">New Quest</label>
          <input 
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border dark:border-zinc-700 border-gray-300 p-3 rounded dark:bg-zinc-800 bg-gray-50 dark:text-white text-black focus:outline-none focus:border-purple-500 transition-colors" 
            placeholder="Quest description..."
          />
        </div>
        
        <div className="md:col-span-4">
          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">
            Due Date <span className="dark:text-zinc-500 text-gray-400 font-normal text-xs">(optional)</span>
          </label>
          {/* 🌟 The New Modern DatePicker */}
          <DatePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            showTimeSelect
            timeFormat="h:mm aa"
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="MMMM d, yyyy h:mm aa"
            placeholderText="Select date & time"
            className="w-full border dark:border-zinc-700 border-gray-300 p-3 rounded dark:bg-zinc-800 bg-gray-50 dark:text-white text-black focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
            wrapperClassName="w-full"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full border dark:border-zinc-700 border-gray-300 p-3 rounded dark:bg-zinc-800 bg-gray-50 dark:text-white text-black focus:outline-none focus:border-purple-500 transition-colors">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border dark:border-zinc-700 border-gray-300 p-3 rounded dark:bg-zinc-800 bg-gray-50 dark:text-white text-black focus:outline-none focus:border-purple-500 transition-colors">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        className="relative z-10 w-full bg-purple-700 text-yellow-400 text-lg tracking-wide py-4 rounded-lg font-extrabold shadow-[0_0_15px_rgba(126,34,206,0.3)] hover:shadow-[0_0_25px_rgba(126,34,206,0.6)] hover:bg-purple-600 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
      >
        <span>ADD QUEST</span>
        <span className="bg-purple-900/50 px-3 py-1 rounded-full text-sm border border-purple-500/50 text-yellow-300">
          +{calculateReward()} XP
        </span>
      </button>
    </form>
  );
};

export default TaskForm;