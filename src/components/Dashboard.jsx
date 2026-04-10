import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, collection, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import TaskForm from './TaskForm';

const Dashboard = ({ user, isDarkMode, setIsDarkMode }) => {
  // Added heroClass and bio to the user profile
  const [userData, setUserData] = useState({ xp: 0, level: 1, streak: 0, name: '', age: '', heroClass: 'Novice', bio: '' });
  const [tasks, setTasks] = useState([]);
  
  const [activeTab, setActiveTab] = useState('active'); 
  const [sortBy, setSortBy] = useState('newest');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editData, setEditData] = useState({ title: '', difficulty: '', priority: '', dueDate: '' });
  
  // Settings Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [editProfile, setEditProfile] = useState({ name: '', age: '', heroClass: '', bio: '' });

  const xpToNextLevel = Math.pow(userData.level, 2) * 100;

  const getStreakMessage = (streak) => {
    if (streak === 0) return "The hardest step is the first one.";
    if (streak < 3) return "Keeping the fire alive!";
    if (streak < 7) return "You're on a roll!";
    if (streak < 14) return "Unstoppable momentum!";
    return "Legendary discipline!";
  };

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
      alert(`🎉 LEVEL UP! You reached Level ${newLevel}!`);
    }

    await updateDoc(doc(db, "tasks", task.id), { completed: true });
    await updateDoc(doc(db, "users", user.uid), { xp: newXp, level: newLevel, streak: userData.streak + 1 });
  };

  const deleteTask = async (id) => await deleteDoc(doc(db, "tasks", id));

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditData({ title: task.title, difficulty: task.difficulty, priority: task.priority, dueDate: task.dueDate || '' });
  };

  const saveEdit = async () => {
    await updateDoc(doc(db, "tasks", editingTaskId), { ...editData });
    setEditingTaskId(null);
  };

  const saveSettings = async () => {
    await updateDoc(doc(db, "users", user.uid), { ...editProfile });
    setShowSettings(false);
  };

  const resetData = async () => {
    if (window.confirm("Are you sure? This will reset your Level, XP, and Streak to zero.")) {
      await updateDoc(doc(db, "users", user.uid), { xp: 0, level: 1, streak: 0 });
      setShowSettings(false);
    }
  };

  const getXpVal = (diff) => ({ easy: 10, medium: 25, hard: 50 }[diff] || 0);
  const getPriVal = (pri) => ({ low: 1, medium: 2, high: 3 }[pri] || 0);

  const displayedTasks = [...tasks]
    .filter(t => activeTab === 'active' ? !t.completed : t.completed)
    .sort((a, b) => {
      if (sortBy === 'xp') return getXpVal(b.difficulty) - getXpVal(a.difficulty);
      if (sortBy === 'priority') return getPriVal(b.priority) - getPriVal(a.priority);
      return (b.createdAt || 0) - (a.createdAt || 0); 
    });

  return (
    <div className="flex flex-col relative">
      <TaskForm userId={user.uid} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* HERO PROFILE CARD */}
        <section className="dark:bg-zinc-900 bg-white p-6 rounded-xl shadow-lg border dark:border-purple-900/30 border-purple-200 h-fit">
          <div className="flex justify-between items-center border-b dark:border-zinc-700 border-gray-200 pb-2 mb-4">
            <h2 className="text-xl font-extrabold text-purple-600 dark:text-purple-400">Hero Profile</h2>
            <button onClick={() => setShowSettings(true)} className="text-sm dark:bg-zinc-800 bg-gray-100 px-3 py-1 rounded dark:text-gray-300 text-gray-700 hover:bg-purple-100 dark:hover:bg-zinc-700 transition font-bold">
              ⚙️ Settings
            </button>
          </div>

          <div className="mb-6 text-center sm:text-left">
            <h3 className="text-2xl font-black dark:text-white text-zinc-900">{userData.name || "Unknown Hero"}</h3>
            <p className="text-sm font-bold text-purple-500 uppercase tracking-widest mt-1">{userData.heroClass}</p>
            {userData.bio && <p className="text-sm dark:text-gray-400 text-gray-600 mt-3 italic">"{userData.bio}"</p>}
          </div>

          <div className="space-y-4">
            <p className="text-lg dark:text-gray-300 text-gray-700 font-bold">Level: <span className="font-mono text-yellow-500 text-2xl">{userData.level}</span></p>
            <div>
              <div className="flex justify-between text-sm dark:text-gray-400 text-gray-600 mb-1 font-bold">
                <span>XP</span><span className="text-yellow-500">{userData.xp} / {xpToNextLevel}</span>
              </div>
              <div className="w-full dark:bg-zinc-800 bg-gray-200 rounded-full h-4 overflow-hidden border dark:border-zinc-700 border-gray-300">
                <div className="h-4 transition-all duration-1000 ease-out bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-300" style={{ width: `${(userData.xp / xpToNextLevel) * 100}%` }}></div>
              </div>
            </div>
            
            <div className="dark:bg-zinc-950 bg-orange-50 p-3 rounded border dark:border-zinc-800 border-orange-200 flex flex-col items-start">
              <p className="text-lg font-semibold text-orange-500 flex items-center gap-2">🔥 Streak: {userData.streak}</p>
              <p className="text-xs dark:text-zinc-400 text-orange-600/80 italic mt-1 font-medium">{getStreakMessage(userData.streak)}</p>
            </div>
          </div>
        </section>

        {/* TASK LIST (Light/Dark mode supported) */}
        <section className="md:col-span-2">
          <div className="dark:bg-zinc-900 bg-white p-6 rounded-xl shadow-lg border dark:border-purple-900/30 border-purple-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('active')} className={`px-4 py-2 font-bold rounded transition ${activeTab === 'active' ? 'bg-purple-700 text-yellow-400' : 'dark:bg-zinc-800 bg-gray-100 dark:text-gray-400 text-gray-600'}`}>Active Quests</button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 font-bold rounded transition ${activeTab === 'history' ? 'bg-purple-700 text-yellow-400' : 'dark:bg-zinc-800 bg-gray-100 dark:text-gray-400 text-gray-600'}`}>History Log</button>
              </div>
            </div>

            <div className="space-y-3">
              {displayedTasks.map(task => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 dark:bg-zinc-800 bg-gray-50 border dark:border-zinc-700 border-gray-200 rounded-lg shadow-sm">
                  <div className="mb-3 sm:mb-0">
                    <h3 className={`font-bold text-lg ${task.completed ? 'text-gray-400 line-through' : 'dark:text-gray-100 text-zinc-900'}`}>{task.title}</h3>
                    <div className="mt-2 space-x-2 flex flex-wrap gap-y-2">
                      <span className="text-xs dark:bg-zinc-900 bg-purple-100 text-purple-600 dark:text-purple-300 px-2 py-1 rounded font-bold uppercase border border-purple-200 dark:border-purple-900/50">{task.difficulty}</span>
                      <span className="text-xs dark:bg-zinc-900 bg-yellow-100 text-yellow-700 dark:text-yellow-500 px-2 py-1 rounded uppercase font-bold border border-yellow-200 dark:border-yellow-900/50">Pri: {task.priority}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!task.completed && <button onClick={() => completeTask(task)} className="bg-purple-700 text-yellow-400 px-5 py-2 rounded font-bold hover:bg-purple-600 transition shadow-md">Complete</button>}
                    <button onClick={() => deleteTask(task.id)} className="dark:bg-zinc-900 bg-white border dark:border-zinc-700 border-red-200 text-red-500 px-3 py-2 rounded font-bold hover:bg-red-50 dark:hover:bg-zinc-800 transition">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 🌟 SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
          <div className="dark:bg-zinc-900 bg-white p-8 rounded-xl shadow-2xl border dark:border-purple-500 border-purple-300 w-full max-w-md">
            <div className="flex justify-between items-center mb-6 border-b dark:border-zinc-700 border-gray-200 pb-3">
              <h2 className="text-2xl font-black text-purple-600 dark:text-purple-400">Profile Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-red-500 font-bold text-xl">✕</button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-bold dark:text-gray-400 text-gray-700 mb-1">Hero Name</label>
                <input value={editProfile.name} onChange={e => setEditProfile({...editProfile, name: e.target.value})} className="w-full dark:bg-zinc-800 bg-gray-50 p-2 rounded dark:text-white text-zinc-900 border dark:border-zinc-700 border-gray-300" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold dark:text-gray-400 text-gray-700 mb-1">Age</label>
                  <input type="number" value={editProfile.age} onChange={e => setEditProfile({...editProfile, age: e.target.value})} className="w-full dark:bg-zinc-800 bg-gray-50 p-2 rounded dark:text-white text-zinc-900 border dark:border-zinc-700 border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold dark:text-gray-400 text-gray-700 mb-1">Class</label>
                  <select value={editProfile.heroClass} onChange={e => setEditProfile({...editProfile, heroClass: e.target.value})} className="w-full dark:bg-zinc-800 bg-gray-50 p-2 rounded dark:text-white text-zinc-900 border dark:border-zinc-700 border-gray-300">
                    <option value="Novice">Novice</option>
                    <option value="Warrior">Warrior</option>
                    <option value="Scholar">Scholar</option>
                    <option value="Stoic">Stoic</option>
                    <option value="Mage">Mage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold dark:text-gray-400 text-gray-700 mb-1">Bio / Quote</label>
                <textarea value={editProfile.bio} onChange={e => setEditProfile({...editProfile, bio: e.target.value})} placeholder="Amor Fati..." className="w-full dark:bg-zinc-800 bg-gray-50 p-2 rounded dark:text-white text-zinc-900 border dark:border-zinc-700 border-gray-300 h-20 resize-none"></textarea>
              </div>

              <div className="border-t dark:border-zinc-700 border-gray-200 py-4 mt-4 flex items-center justify-between">
                <span className="font-bold dark:text-gray-300 text-gray-700">App Theme</span>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className={`px-4 py-2 rounded font-bold transition-all ${isDarkMode ? 'bg-yellow-500 text-zinc-900' : 'bg-zinc-800 text-white'}`}
                >
                  {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
              </div>

              <div className="border-t border-red-900/50 pt-4">
                <button onClick={resetData} className="w-full bg-red-100 text-red-600 dark:bg-zinc-900 dark:text-red-500 border border-red-300 dark:border-red-900 py-2 rounded hover:bg-red-200 dark:hover:bg-red-950 transition font-bold">
                  ⚠️ Hard Reset Stats
                </button>
              </div>
            </div>

            <button onClick={saveSettings} className="w-full bg-green-600 text-white py-3 mt-6 rounded-lg font-black text-lg hover:bg-green-700 shadow-lg">Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;