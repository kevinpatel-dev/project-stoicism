import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, collection, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import TaskForm from './TaskForm';

const Dashboard = ({ user, isDarkMode, setIsDarkMode }) => {
  const [userData, setUserData] = useState({ xp: 0, level: 1, streak: 0, name: '', age: '', heroClass: 'Novice', bio: '' });
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); 
  const [sortBy, setSortBy] = useState('newest');
  const [showSettings, setShowSettings] = useState(false);
  const [editProfile, setEditProfile] = useState({ name: '', age: '', heroClass: '', bio: '' });

  const xpToNextLevel = Math.pow(userData.level, 2) * 100;
  const progressPercentage = Math.min((userData.xp / xpToNextLevel) * 100, 100);

  useEffect(() => {
    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setEditProfile({ 
          name: data.name || '', 
          age: data.age || '', 
          heroClass: data.heroClass || 'Novice', 
          bio: data.bio || '' 
        });
      } else {
        setDoc(userRef, { xp: 0, level: 1, streak: 0, name: '', age: '', heroClass: 'Novice', bio: '' }); 
      }
    });

    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const unsubTasks = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubTasks(); };
  }, [user.uid]);

  const completeTask = async (task) => {
    const totalReward = ({ easy: 10, medium: 25, hard: 50 }[task.difficulty] || 10) + ({ low: 0, medium: 5, high: 10 }[task.priority] || 0);
    let newXp = userData.xp + totalReward;
    let newLevel = userData.level;

    if (newXp >= xpToNextLevel) {
      newXp = newXp - xpToNextLevel; 
      newLevel += 1;
    }

    await updateDoc(doc(db, "tasks", task.id), { completed: true });
    await updateDoc(doc(db, "users", user.uid), { xp: newXp, level: newLevel, streak: userData.streak + 1 });
  };

  const deleteTask = async (id) => await deleteDoc(doc(db, "tasks", id));
  const saveSettings = async () => {
    await updateDoc(doc(db, "users", user.uid), { ...editProfile });
    setShowSettings(false);
  };

  const displayedTasks = [...tasks]
    .filter(t => activeTab === 'active' ? !t.completed : t.completed)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <TaskForm userId={user.uid} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- HERO PROFILE CARD (Points 1, 2, 3, 6, 7) --- */}
        <section className="lg:col-span-4 dark:bg-zinc-900 bg-white p-8 rounded-2xl shadow-xl border dark:border-zinc-800 border-gray-100 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="text-8xl select-none">🏛️</span>
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black dark:text-white text-zinc-900 leading-tight">
                  {userData.name || "Nameless Hero"}
                </h2>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-widest border border-purple-200 dark:border-purple-800">
                  {userData.heroClass}
                </span>
              </div>
              <button 
                onClick={() => setShowSettings(true)} 
                className="p-2 rounded-xl dark:bg-zinc-800 bg-gray-100 dark:text-zinc-400 text-gray-500 hover:text-purple-600 transition-colors"
              >
                ⚙️
              </button>
            </div>

            {userData.bio && (
              <p className="text-sm dark:text-zinc-400 text-gray-600 italic mb-8 border-l-2 border-purple-500 pl-4 leading-relaxed">
                "{userData.bio}"
              </p>
            )}

            <div className="space-y-8">
              {/* XP & Level Section */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold dark:text-zinc-500 text-gray-400 uppercase tracking-tighter">Current Progress</span>
                    <span className="text-xl font-black dark:text-white text-zinc-900">Level {userData.level}</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    {userData.xp} <span className="dark:text-zinc-600 text-gray-300">/</span> {xpToNextLevel} XP
                  </span>
                </div>
                
                {/* Modernized Progress Bar */}
                <div className="h-4 w-full bg-gray-100 dark:bg-zinc-950 rounded-full overflow-hidden border dark:border-zinc-800 border-gray-200 shadow-inner p-0.5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 via-purple-400 to-fuchsia-400 transition-all duration-1000 ease-out relative"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Streak Section (Point 6) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="dark:bg-zinc-950 bg-gray-50 p-4 rounded-2xl border dark:border-zinc-800 border-gray-100 text-center">
                  <span className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-1 tracking-widest">Global Streak</span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black text-orange-500">🔥 {userData.streak}</span>
                  </div>
                </div>
                <div className="dark:bg-zinc-950 bg-gray-50 p-4 rounded-2xl border dark:border-zinc-800 border-gray-100 text-center">
                  <span className="block text-[10px] font-black dark:text-zinc-500 text-gray-400 uppercase mb-1 tracking-widest">Hero Age</span>
                  <span className="text-2xl font-black dark:text-white text-zinc-900">{userData.age || "--"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- TASK LIST SECTION --- */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex gap-4 border-b dark:border-zinc-800 border-gray-200">
            <button 
              onClick={() => setActiveTab('active')} 
              className={`pb-4 px-2 font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'active' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'}`}
            >
              Active Quests
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`pb-4 px-2 font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 border-b-2 border-transparent hover:text-gray-600'}`}
            >
              Logbook
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {displayedTasks.length === 0 ? (
              <div className="text-center py-20 dark:bg-zinc-900/50 bg-gray-50 rounded-2xl border-2 border-dashed dark:border-zinc-800 border-gray-200">
                <p className="dark:text-zinc-500 text-gray-400 font-bold">No quests found in this scroll.</p>
              </div>
            ) : (
              displayedTasks.map(task => (
                <div key={task.id} className="group flex items-center justify-between p-6 dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col gap-2">
                    <h3 className={`font-bold text-lg ${task.completed ? 'text-gray-400 line-through' : 'dark:text-zinc-100 text-zinc-900'}`}>{task.title}</h3>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md dark:bg-zinc-800 bg-gray-100 dark:text-zinc-400 text-gray-500 border dark:border-zinc-700 border-gray-200">
                        {task.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {!task.completed && (
                      <button 
                        onClick={() => completeTask(task)} 
                        className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-purple-700 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                      >
                        CHECK
                      </button>
                    )}
                    <button onClick={() => deleteTask(task.id)} className="p-2.5 rounded-xl dark:bg-zinc-800 bg-gray-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* --- REFINED SETTINGS MODAL --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex justify-center items-center z-50 p-6">
          <div className="dark:bg-zinc-900 bg-white p-8 rounded-3xl shadow-2xl border dark:border-zinc-800 border-gray-100 w-full max-w-md animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black dark:text-white text-zinc-900 mb-6">Profile Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black dark:text-zinc-500 text-gray-400 uppercase tracking-widest block mb-2">Hero Identity</label>
                <input 
                  value={editProfile.name} 
                  onChange={e => setEditProfile({...editProfile, name: e.target.value})} 
                  placeholder="Hero Name"
                  className="w-full dark:bg-zinc-950 bg-gray-50 p-4 rounded-xl dark:text-white text-zinc-900 border dark:border-zinc-800 border-gray-200 focus:ring-2 focus:ring-purple-500/40 outline-none transition-all" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" 
                  value={editProfile.age} 
                  onChange={e => setEditProfile({...editProfile, age: e.target.value})} 
                  placeholder="Age"
                  className="w-full dark:bg-zinc-950 bg-gray-50 p-4 rounded-xl dark:text-white text-zinc-900 border dark:border-zinc-800 border-gray-200 focus:ring-2 focus:ring-purple-500/40 outline-none transition-all" 
                />
                <select 
                  value={editProfile.heroClass} 
                  onChange={e => setEditProfile({...editProfile, heroClass: e.target.value})} 
                  className="w-full dark:bg-zinc-950 bg-gray-50 p-4 rounded-xl dark:text-white text-zinc-900 border dark:border-zinc-800 border-gray-200 focus:ring-2 focus:ring-purple-500/40 outline-none transition-all"
                >
                  <option value="Novice">Novice</option>
                  <option value="Warrior">Warrior</option>
                  <option value="Scholar">Scholar</option>
                  <option value="Stoic">Stoic</option>
                </select>
              </div>

              <textarea 
                value={editProfile.bio} 
                onChange={e => setEditProfile({...editProfile, bio: e.target.value})} 
                placeholder="Personal Bio / Moto"
                className="w-full dark:bg-zinc-950 bg-gray-50 p-4 rounded-xl dark:text-white text-zinc-900 border dark:border-zinc-800 border-gray-200 focus:ring-2 focus:ring-purple-500/40 outline-none transition-all h-28 resize-none"
              ></textarea>

              <div className="flex items-center justify-between p-4 dark:bg-zinc-950 bg-gray-50 rounded-xl border dark:border-zinc-800 border-gray-200">
                <span className="text-sm font-bold dark:text-zinc-400 text-gray-600">Visual Theme</span>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-xl px-4 py-1">{isDarkMode ? "☀️" : "🌙"}</button>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowSettings(false)} className="flex-1 px-6 py-3 rounded-xl dark:text-zinc-400 text-gray-500 font-bold hover:dark:bg-zinc-800 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={saveSettings} className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-xl font-black hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;