import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const TaskForm = ({ userId }) => {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [priority, setPriority] = useState('low');
  const [dueDate, setDueDate] = useState('');

  // 🌟 DYNAMIC XP CALCULATOR
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
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date().getTime() 
    });
    
    setTitle(''); 
    setDueDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 sm:p-8 rounded-xl shadow-lg border border-purple-900/50 mb-8 relative overflow-hidden">
      
      {/* Decorative gradient orb in the background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 relative z-10">
        <div className="md:col-span-5">
          <label className="block text-sm font-bold text-purple-400 mb-1">New Quest</label>
          <input 
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-zinc-700 p-3 rounded bg-zinc-800 text-white focus:outline-none focus:border-purple-500 transition-colors" 
            placeholder="Quest description..."
          />
        </div>
        
        <div className="md:col-span-3">
          <label className="block text-sm font-bold text-gray-400 mb-1">
            Due Date <span className="text-zinc-500 font-normal text-xs">(optional)</span>
          </label>
          <input 
            type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} 
            className="w-full border border-zinc-700 p-3 rounded bg-zinc-800 text-white focus:outline-none focus:border-purple-500 color-scheme-dark transition-colors"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-400 mb-1">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full border border-zinc-700 p-3 rounded bg-zinc-800 text-white focus:outline-none focus:border-purple-500 transition-colors">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-400 mb-1">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border border-zinc-700 p-3 rounded bg-zinc-800 text-white focus:outline-none focus:border-purple-500 transition-colors">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Button now shows dynamic XP reward */}
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