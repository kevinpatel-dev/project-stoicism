import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TaskForm = ({ userId, hardMode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // 🌟 NEW: Description state
  const [difficulty, setDifficulty] = useState('easy');
  const [priority, setPriority] = useState('low');
  const [dueDate, setDueDate] = useState(null); 

  const calculateReward = () => {
    const diffXp = { easy: 10, medium: 25, hard: 50 }[difficulty] || 10;
    const priXp = { low: 0, medium: 5, high: 10 }[priority] || 0;
    const baseTotal = diffXp + priXp;
    // 🌟 FIX 1: Reflect Hard Mode multiplier in the UI
    return Math.floor(baseTotal * (hardMode ? 1.5 : 1.0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // 🌟 FIX 4: Prevent past deadlines
    if (dueDate && dueDate < new Date()) {
      alert("A Stoic focuses on the present and future. You cannot set a deadline in the past.");
      return;
    }

    await addDoc(collection(db, "tasks"), {
      userId,
      title,
      description, // 🌟 NEW: Save description
      difficulty,
      priority,
      dueDate: dueDate ? dueDate.toISOString() : null, 
      completed: false,
      createdAt: new Date().getTime() 
    });
    
    setTitle(''); 
    setDescription('');
    setDueDate(null);
  };

  return (
    <form onSubmit={handleSubmit} className="dark:bg-zinc-900 bg-white p-10 rounded-[2.5rem] shadow-2xl border dark:border-zinc-800 border-gray-100 mb-10 relative overflow-visible">
      
      <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
        <div className="absolute -top-10 -right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10">
        <header className="mb-8">
          <h3 className="text-xs font-black dark:text-purple-400 text-purple-600 uppercase tracking-[0.3em]">New Quest</h3>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className="md:col-span-8">
            <label className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-3 ml-1 tracking-widest">Quest Title</label>
            <input 
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border dark:border-zinc-800 border-gray-200 p-5 rounded-2xl dark:bg-zinc-950 bg-gray-50 dark:text-white text-zinc-900 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all placeholder:text-gray-400 font-bold text-lg" 
              placeholder="e.g., Read Meditations"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-3 ml-1 tracking-widest">Target Time</label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              showTimeSelect
              timeFormat="h:mm aa"
              timeIntervals={15}
              dateFormat="MMM d, h:mm aa"
              placeholderText="Optional"
              minDate={new Date()} // 🌟 FIX 4: Block past days in calendar
              className="w-full border dark:border-zinc-800 border-gray-200 p-5 rounded-2xl dark:bg-zinc-950 bg-gray-50 dark:text-white text-zinc-900 focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all cursor-pointer font-bold text-lg"
              wrapperClassName="w-full"
            />
          </div>

          {/* 🌟 FIX 3: Quest Notes Area */}
          <div className="md:col-span-12">
            <label className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-3 ml-1 tracking-widest">Quest Notes (Optional)</label>
            <textarea 
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full border dark:border-zinc-800 border-gray-200 p-5 rounded-2xl dark:bg-zinc-950 bg-gray-50 dark:text-white text-zinc-900 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all placeholder:text-gray-400 font-medium text-sm h-24 resize-none" 
              placeholder="Add specific details, links, or sub-tasks here..."
            />
          </div>

          <div className="md:col-span-6">
            <label className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-3 ml-1 tracking-widest">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full border dark:border-zinc-800 border-gray-200 p-5 rounded-2xl dark:bg-zinc-950 bg-gray-50 dark:text-white text-zinc-900 outline-none focus:ring-4 focus:ring-purple-500/10 font-bold text-lg appearance-none cursor-pointer">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div className="md:col-span-6">
            <label className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-3 ml-1 tracking-widest">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border dark:border-zinc-800 border-gray-200 p-5 rounded-2xl dark:bg-zinc-950 bg-gray-50 dark:text-white text-zinc-900 outline-none focus:ring-4 focus:ring-purple-500/10 font-bold text-lg appearance-none cursor-pointer">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <button type="submit" className="group w-full bg-purple-600 hover:bg-purple-700 text-white py-5 rounded-[1.5rem] font-black text-sm tracking-[0.2em] transition-all shadow-2xl shadow-purple-500/30 flex items-center justify-center gap-6 active:scale-[0.98]">
          <span className="flex items-center gap-3">⚔️ COMMENCE QUEST</span>
          <div className="h-8 w-[1px] bg-white/20"></div>
          <span className="bg-zinc-950/40 px-5 py-1.5 rounded-full text-purple-200 border border-white/10 group-hover:bg-zinc-950/60 transition-all font-black">
            +{calculateReward()} XP
          </span>
        </button>
      </div>
    </form>
  );
};

export default TaskForm;