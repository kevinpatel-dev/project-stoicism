import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, updateDoc, collection, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import TaskForm from './TaskForm';

const Dashboard = ({ user }) => {
  const [userData, setUserData] = useState({ xp: 0, level: 1, streak: 0, name: '', age: '' });
  const [tasks, setTasks] = useState([]);
  
  const [activeTab, setActiveTab] = useState('active'); 
  const [sortBy, setSortBy] = useState('newest');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editData, setEditData] = useState({ title: '', difficulty: '', priority: '', dueDate: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');

  const xpToNextLevel = Math.pow(userData.level, 2) * 100;

  // 🌟 DYNAMIC STREAK MESSAGES
  const getStreakMessage = (streak) => {
    if (streak === 0) return "The hardest step is the first one.";
    if (streak < 3) return "Keeping the fire alive!";
    if (streak < 7) return "You're on a roll!";
    if (streak < 14) return "Unstoppable momentum!";
    if (streak < 30) return "A true Stoic master.";
    return "Legendary discipline!";
  };

  const playCompleteSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/ui/beep_short.ogg');
    audio.play().catch(e => console.log("Audio blocked"));
  };

  const playLevelUpSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/human_voices/crowd_cheer.ogg');
    audio.play().catch(e => console.log("Audio blocked"));
  };

  useEffect(() => {
    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
        setEditName(docSnap.data().name || '');
        setEditAge(docSnap.data().age || '');
      } else {
        setDoc(userRef, { xp: 0, level: 1, streak: 0, name: '', age: '' }); 
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

    playCompleteSound(); 

    if (newXp >= xpToNextLevel) {
      newXp = newXp - xpToNextLevel; 
      newLevel += 1;
      setTimeout(playLevelUpSound, 500); 
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

  const saveProfile = async () => {
    await updateDoc(doc(db, "users", user.uid), { name: editName, age: editAge });
    setIsEditing(false);
  };

  const resetData = async () => {
    if (window.confirm("Are you sure? This will reset your Level, XP, and Streak to zero.")) {
      await updateDoc(doc(db, "users", user.uid), { xp: 0, level: 1, streak: 0 });
    }
  };

  const getXpVal = (diff) => ({ easy: 10, medium: 25, hard: 50 }[diff] || 0);
  const getPriVal = (pri) => ({ low: 1, medium: 2, high: 3 }[pri] || 0);

  const displayedTasks = [...tasks]
    .filter(t => activeTab === 'active' ? !t.completed : t.completed)
    .sort((a, b) => {
      if (sortBy === 'xp') return getXpVal(b.difficulty) - getXpVal(a.difficulty);
      if (sortBy === 'priority') return getPriVal(b.priority) - getPriVal(a.priority);
      if (sortBy === 'deadline') {
        if (!a.dueDate) return 1; 
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return (b.createdAt || 0) - (a.createdAt || 0); 
    });

  return (
    <div className="flex flex-col">
      <TaskForm userId={user.uid} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-purple-900/30 h-fit">
          <div className="flex justify-between items-center border-b border-zinc-700 pb-2 mb-4">
            <h2 className="text-xl font-extrabold text-purple-400">Hero Profile</h2>
            <button onClick={() => setIsEditing(!isEditing)} className="text-xs bg-zinc-800 px-2 py-1 rounded text-gray-400 hover:text-white">{isEditing ? "Cancel" : "Edit"}</button>
          </div>

          {isEditing ? (
            <div className="space-y-3 mb-6">
              <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Hero Name" className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700" />
              <input value={editAge} onChange={e => setEditAge(e.target.value)} placeholder="Age" type="number" className="w-full bg-zinc-800 p-2 rounded text-white border border-zinc-700" />
              <button onClick={saveProfile} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Save Profile</button>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-lg text-white font-bold">{userData.name || "Unknown Hero"}</p>
              <p className="text-sm text-gray-400">Age: {userData.age || "?"}</p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-lg text-gray-300">Level: <span className="font-mono text-yellow-500 font-bold text-2xl">{userData.level}</span></p>
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>XP</span><span className="text-yellow-500">{userData.xp} / {xpToNextLevel}</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden border border-zinc-700">
                {/* 🌟 UPGRADED GRADIENT PROGRESS BAR */}
                <div 
                  className="h-4 transition-all duration-1000 ease-out bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                  style={{ width: `${(userData.xp / xpToNextLevel) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 flex flex-col items-start">
              <p className="text-lg font-semibold text-orange-500 flex items-center gap-2">
                🔥 Streak: {userData.streak}
              </p>
              {/* 🌟 DYNAMIC STREAK MESSAGE */}
              <p className="text-xs text-zinc-400 italic mt-1">{getStreakMessage(userData.streak)}</p>
            </div>

            <button onClick={resetData} className="w-full mt-4 bg-zinc-800 text-red-500 border border-red-900 py-2 rounded hover:bg-red-950 transition text-sm">Reset Stats</button>
          </div>
        </section>

        <section className="md:col-span-2">
          <div className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-purple-900/30">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('active')} className={`px-4 py-2 font-bold rounded transition ${activeTab === 'active' ? 'bg-purple-700 text-yellow-400' : 'bg-zinc-800 text-gray-400'}`}>Active Quests</button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 font-bold rounded transition ${activeTab === 'history' ? 'bg-purple-700 text-yellow-400' : 'bg-zinc-800 text-gray-400'}`}>History Log</button>
              </div>
              {activeTab === 'active' && (
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-zinc-800 text-gray-300 border border-zinc-700 p-2 rounded focus:outline-none">
                  <option value="newest">Sort by: Newest</option>
                  <option value="priority">Sort by: Highest Priority</option>
                  <option value="xp">Sort by: Highest XP</option>
                  <option value="deadline">Sort by: Urgent (Due Date)</option>
                </select>
              )}
            </div>

            <div className="space-y-3">
              {displayedTasks.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-lg mb-2">The arena is currently empty.</p>
                  {activeTab === 'active' && <p className="text-purple-400 font-bold">Create your first quest above to begin leveling up!</p>}
                </div>
              )}

              {displayedTasks.map(task => (
                <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-purple-500 transition shadow-sm">
                  {editingTaskId === task.id ? (
                    <div className="flex-1 flex flex-col gap-2 mr-0 sm:mr-4 mb-4 sm:mb-0">
                      <input value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} className="bg-zinc-900 border border-purple-500 p-2 rounded text-white w-full" />
                      <div className="flex gap-2 text-sm">
                        <input type="datetime-local" value={editData.dueDate} onChange={e => setEditData({...editData, dueDate: e.target.value})} className="bg-zinc-900 border border-zinc-600 p-1 rounded text-gray-300 color-scheme-dark" />
                        <select value={editData.difficulty} onChange={e => setEditData({...editData, difficulty: e.target.value})} className="bg-zinc-900 border border-zinc-600 p-1 rounded text-gray-300"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
                        <select value={editData.priority} onChange={e => setEditData({...editData, priority: e.target.value})} className="bg-zinc-900 border border-zinc-600 p-1 rounded text-gray-300"><option value="low">Low Pri</option><option value="medium">Med Pri</option><option value="high">High Pri</option></select>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 sm:mb-0">
                      <h3 className={`font-bold text-lg ${task.completed ? 'text-gray-500 line-through' : 'text-gray-100'}`}>{task.title}</h3>
                      <div className="mt-2 space-x-2 flex flex-wrap gap-y-2">
                        <span className="text-xs bg-zinc-900 text-purple-300 px-2 py-1 rounded font-bold uppercase border border-purple-900/50">{task.difficulty}</span>
                        <span className="text-xs bg-zinc-900 text-yellow-500 px-2 py-1 rounded uppercase font-bold border border-yellow-900/50">Pri: {task.priority}</span>
                        {task.dueDate && (
                          <span className="text-xs bg-zinc-900 text-red-400 px-2 py-1 rounded border border-red-900/50">
                            ⏳ Due: {new Date(task.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {editingTaskId === task.id ? (
                      <><button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700">Save</button><button onClick={() => setEditingTaskId(null)} className="bg-zinc-600 text-white px-3 py-2 rounded font-bold hover:bg-zinc-500">Cancel</button></>
                    ) : (
                      <>
                        {!task.completed && (
                          <><button onClick={() => startEditing(task)} className="bg-zinc-700 text-gray-300 px-3 py-2 rounded font-bold hover:bg-zinc-600">Edit</button><button onClick={() => completeTask(task)} className="bg-purple-700 text-yellow-400 px-5 py-2 rounded font-bold hover:bg-purple-600 transition shadow-md">Complete</button></>
                        )}
                        <button onClick={() => deleteTask(task.id)} className="bg-zinc-900 border border-zinc-700 text-red-400 px-3 py-2 rounded font-bold hover:bg-zinc-800 transition">Delete</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;