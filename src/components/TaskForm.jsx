import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TaskForm = ({ userId }) => {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [priority, setPriority] = useState('low');
  const [dueDate, setDueDate] = useState(null); 

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
      dueDate: dueDate ? dueDate.toISOString() : null, 
      completed: false,
      createdAt: new Date().getTime() 
    });
    
    setTitle(''); 
    setDueDate(null);
  };

  return (
    <form onSubmit={handleSubmit} className="dark:bg-zinc-900 bg-white p-8 rounded-2xl shadow-xl border dark:border-zinc-800 border-gray-100 mb-8 relative">
      
      {/* Containerized Background Orb (Prevents clipping the calendar) */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <header className="mb-6">
          <h3 className="text-sm font-black dark:text-purple-400 text-purple-600 uppercase tracking-widest">New Discipline</h3>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          
          {/* Quest Title */}
          <div className="md:col-span-5">
            <label className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-2 tracking-widest">Quest Description</label>
            <input 
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border dark:border-zinc-800 border-gray-200 p-3.5 rounded-xl dark:bg-zinc-950 bg-gray-50 dark:text-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600" 
              placeholder="e.g., Read 20 pages of Meditations"
            />
          </div>

          {/* Date Picker */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-2 tracking-widest">Target Time</label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={15}
              dateFormat="MMM d, h:mm aa"
              placeholderText="Optional deadline"
              className="w-full border dark:border-zinc-800 border-gray-200 p-3.5 rounded-xl dark:bg-zinc-950 bg-gray-50 dark:text-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all cursor-pointer"
              wrapperClassName="w-full"
            />
          </div>

          {/* Difficulty Select */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-2 tracking-widest">Difficulty</label>
            <select 
              value={difficulty} 
              onChange={(e) => setDifficulty(e.target.value)} 
              className="w-full border dark:border-zinc-800 border-gray-200 p-3.5 rounded-xl dark:bg-zinc-950 bg-gray-50 dark:text-white text-zinc-900 focus:ring-2 focus:ring-purple-500/40 transition-all cursor-pointer"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          {/* Priority Select */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-2 tracking-widest">Priority</label>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)} 
              className="w-full border dark:border-zinc-800 border-gray-200 p-3.5 rounded-xl dark:bg-zinc-950 bg-gray-50 dark:text-white text-zinc-900 focus:ring-2 focus:ring-purple-500/40 transition-all cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Refined Submit Button (Points 1, 5, 7) */}
        <button 
          type="submit" 
          className="group w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-black text-sm tracking-widest transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-4 active:scale-[0.99]"
        >
          <span className="flex items-center gap-2">
            ⚔️ COMMENCE QUEST
          </span>
          <div className="h-6 w-[1px] bg-white/20"></div>
          <span className="bg-zinc-950/30 px-3 py-1 rounded-full text-purple-200 border border-white/10 group-hover:bg-zinc-950/50 transition-colors">
            +{calculateReward()} XP
          </span>
        </button>
      </div>
    </form>
  );
};

export default TaskForm;