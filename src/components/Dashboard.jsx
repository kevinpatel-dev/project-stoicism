import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import TaskForm from './TaskForm';

const Dashboard = ({ user, isDarkMode, setIsDarkMode, activeModal, setActiveModal }) => {
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [heroNameInput, setHeroNameInput] = useState('');
  
  // Level Up Overlay State
  const [levelUpData, setLevelUpData] = useState(null);

  const classTiers = [
    { name: "Novice", minLevel: 1, maxLevel: 5 },
    { name: "Initiate", minLevel: 6, maxLevel: 10 },
    { name: "Practitioner", minLevel: 11, maxLevel: 20 },
    { name: "Scholar", minLevel: 21, maxLevel: 35 },
    { name: "Philosopher", minLevel: 36, maxLevel: 50 },
    { name: "Sage", minLevel: 51, maxLevel: '∞' },
  ];

  const getHeroClass = (level) => {
    const tier = classTiers.find(t => level >= t.minLevel && (t.maxLevel === '∞' || level <= t.maxLevel));
    return tier ? tier.name : "Novice";
  };

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        if (!data.name || data.name.trim() === '') setShowOnboarding(true);
        checkStreakReset(data);
      } else {
        setDoc(userRef, { xp: 0, level: 1, streak: 0, name: '', age: '', bio: '', hardMode: false });
      }
    });

    const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
    const unsubTasks = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub(); unsubTasks(); };
  }, [user]);

  const saveOnboardingName = async () => {
    if (!heroNameInput.trim()) return;
    await updateDoc(doc(db, "users", user.uid), { name: heroNameInput });
    setShowOnboarding(false);
  };

  const checkStreakReset = async (data) => {
    if (!data.lastCompletionDate) return;
    const hoursSinceLast = (new Date() - new Date(data.lastCompletionDate)) / (1000 * 60 * 60);
    
    if (hoursSinceLast > 48 && data.streak > 0) { 
      await updateDoc(doc(db, "users", user.uid), {
        streak: 0,
        xp: data.hardMode ? Math.max(0, data.xp - 50) : data.xp 
      });
    }
  };

  const completeTask = async (task) => {
    const diffXp = { easy: 10, medium: 25, hard: 50 }[task.difficulty] || 10;
    const priXp = { low: 0, medium: 5, high: 10 }[task.priority] || 0;
    const baseReward = diffXp + priXp;
    
    const multiplier = userData.hardMode ? 1.5 : 1.0;
    const totalReward = Math.floor(baseReward * multiplier);

    let newXp = userData.xp + totalReward;
    let newLevel = userData.level;
    const xpToNext = Math.pow(newLevel, 2) * 100;

    let leveledUp = false;
    let oldRank = getHeroClass(userData.level);

    if (newXp >= xpToNext) {
      newXp -= xpToNext;
      newLevel += 1;
      leveledUp = true;
    }

    let newRank = getHeroClass(newLevel);

    if (leveledUp) {
      setLevelUpData({ 
        level: newLevel, 
        rank: newRank, 
        isNewRank: newRank !== oldRank 
      });
    }

    await updateDoc(doc(db, "tasks", task.id), { completed: true });
    await updateDoc(doc(db, "users", user.uid), { 
      xp: newXp, 
      level: newLevel, 
      streak: userData.streak + 1,
      lastCompletionDate: new Date().toISOString()
    });
  };

  const deleteTask = async (id) => {
    if (window.confirm("Abandon this quest?")) {
      await deleteDoc(doc(db, "tasks", id));
    }
  };

  const resetAllProgress = async () => {
    const confirmMsg = "Are you sure? This will wipe your Level, XP, Streak, AND ALL QUESTS forever.";
    if (window.confirm(confirmMsg)) {
      const taskQuery = query(collection(db, "tasks"), where("userId", "==", user.uid));
      const taskSnap = await getDocs(taskQuery);
      taskSnap.forEach((d) => deleteDoc(d.ref));

      await updateDoc(doc(db, "users", user.uid), {
        xp: 0, level: 1, streak: 0, hardMode: false
      });
      setActiveModal(null);
    }
  };

  // 🌟 FIX: The properly formatted deleteAccount function
  const deleteAccount = async () => {
    const confirmMsg = "CRITICAL WARNING: This will permanently delete your entire account, all quests, and all progress. This action CANNOT be undone. Are you absolutely sure?";
    if (window.confirm(confirmMsg)) {
      try {
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(user);
      } catch (error) {
        console.error("Account deletion failed:", error);
        if (error.code === 'auth/requires-recent-login') {
          alert("For your security, please log out and log back in right now before deleting your account.");
        } else {
          alert("Failed to delete account: " + error.message);
        }
      }
    }
  };

  if (!userData) return null;

  const displayedTasks = [...tasks]
    .filter(t => activeTab === 'active' ? !t.completed : t.completed)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const xpToNextLevel = Math.pow(userData.level, 2) * 100;
  
  const currentTierIndex = classTiers.findIndex(t => userData.level >= t.minLevel && (t.maxLevel === '∞' || userData.level <= t.maxLevel));
  const nextTier = classTiers[currentTierIndex + 1];
  const levelsToNextClass = nextTier ? nextTier.minLevel - userData.level : 0;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* LEVEL UP OVERLAY */}
      {levelUpData && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-zinc-950/95 backdrop-blur-2xl animate-in zoom-in duration-300">
          <div className="text-center">
             <h2 className="text-6xl sm:text-8xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-fuchsia-600 animate-pulse drop-shadow-2xl">
               LEVEL UP!
             </h2>
             <p className="text-2xl sm:text-3xl font-black text-zinc-300 mb-2">You are now Level {levelUpData.level}</p>
             
             {levelUpData.isNewRank && (
               <div className="mt-8 mb-4 p-8 rounded-[2rem] bg-purple-600/10 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-in slide-in-from-bottom-4">
                 <p className="text-xs sm:text-sm font-black text-purple-400 uppercase tracking-[0.4em] mb-3">New Title Unlocked</p>
                 <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">{levelUpData.rank}</p>
               </div>
             )}

             <button onClick={() => setLevelUpData(null)} className="mt-10 bg-white text-zinc-900 px-12 py-5 rounded-full font-black tracking-widest text-sm hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95">
               CONTINUE
             </button>
          </div>
        </div>
      )}

      {/* ONBOARDING */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-zinc-950/98 backdrop-blur-xl animate-in zoom-in duration-500">
          <div className="text-center max-w-sm">
            <h2 className="text-4xl font-black mb-4 text-white">Welcome, Hero.</h2>
            <p className="text-zinc-500 mb-10 font-bold uppercase tracking-widest text-xs">What should we call you?</p>
            <input 
              autoFocus className="w-full bg-transparent border-b-2 border-purple-600 p-4 text-3xl text-center text-white outline-none focus:border-white transition-all mb-10" 
              placeholder="Name" value={heroNameInput} 
              onChange={(e) => setHeroNameInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && saveOnboardingName()} 
            />
            <button onClick={saveOnboardingName} className="bg-purple-600 text-white px-12 py-4 rounded-full font-black hover:bg-purple-700 transition-all shadow-2xl shadow-purple-500/40 active:scale-95">BEGIN JOURNEY</button>
          </div>
        </div>
      )}

      <TaskForm userId={user.uid} hardMode={userData.hardMode} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20">
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <section className="dark:bg-zinc-900 bg-white p-8 rounded-[2rem] border dark:border-zinc-800 border-gray-100 shadow-xl relative overflow-hidden">
            <div className="mb-8 relative z-10">
              <h3 className="text-4xl font-black truncate tracking-tight">{userData.name || "Hero"}</h3>
              <button 
                onClick={() => setActiveModal('progression')}
                className="inline-block mt-3 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] border border-purple-500/20 hover:bg-purple-500/20 hover:scale-105 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {getHeroClass(userData.level)} <span>ℹ️</span>
              </button>
            </div>
            
            <div className="space-y-10 relative z-10">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-2xl font-black tracking-tighter">Level {userData.level}</span>
                  <span className="text-xs font-bold text-zinc-500">{userData.xp} / {xpToNextLevel} XP</span>
                </div>
                <div className="h-4 w-full bg-gray-100 dark:bg-zinc-950 rounded-full overflow-hidden p-1 border dark:border-zinc-800 border-gray-200">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full transition-all duration-1000" style={{ width: `${(userData.xp / xpToNextLevel) * 100}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-[1.5rem] dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-800 border-gray-200 text-center shadow-inner">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block mb-2 tracking-widest">Streak</span>
                  <span className="text-3xl font-black text-orange-500">🔥 {userData.streak}</span>
                </div>
                <div className="p-5 rounded-[1.5rem] dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-800 border-gray-200 text-center shadow-inner">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block mb-2 tracking-widest">Mode</span>
                  <span className={`text-sm font-black ${userData.hardMode ? 'text-red-500' : 'text-green-500'}`}>
                    {userData.hardMode ? 'HARD CORE' : 'NORMAL'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="flex gap-8 border-b dark:border-zinc-800 border-gray-200">
            <button onClick={() => setActiveTab('active')} className={`pb-4 font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'active' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}>Active Quests</button>
            <button onClick={() => setActiveTab('history')} className={`pb-4 font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}>Logbook</button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {displayedTasks.length === 0 ? (
              <div className="text-center py-24 dark:bg-zinc-900/40 bg-gray-50 rounded-[2rem] border-2 border-dashed dark:border-zinc-800 border-gray-300">
                <p className="dark:text-zinc-600 text-gray-400 font-bold uppercase tracking-widest text-xs">No entries found in this scroll</p>
              </div>
            ) : (
              displayedTasks.map(task => (
                <div key={task.id} className="group flex items-center justify-between p-7 dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-gray-100 rounded-[2rem] hover:shadow-xl transition-all animate-in slide-in-from-bottom-2">
                  <div className="flex flex-col gap-2 w-full pr-4">
                    <h3 className={`font-bold text-xl ${task.completed ? 'text-gray-400 dark:text-zinc-600 line-through' : 'dark:text-zinc-100 text-zinc-900'}`}>{task.title}</h3>
                    
                    {task.description && (
                      <p className={`text-sm font-medium leading-relaxed line-clamp-2 ${task.completed ? 'text-gray-400/50 dark:text-zinc-700' : 'text-gray-500 dark:text-zinc-400'}`}>
                        {task.description}
                      </p>
                    )}

                    <div className="flex gap-3 items-center mt-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg dark:bg-zinc-800 bg-gray-100 dark:text-zinc-400 text-gray-500 border dark:border-zinc-700 border-gray-200">{task.difficulty}</span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg dark:bg-zinc-800 bg-gray-100 dark:text-zinc-500 text-gray-400 border dark:border-zinc-700 border-gray-200">PRI: {task.priority}</span>
                      {task.dueDate && <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase ml-2">📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-4 flex-shrink-0">
                    {!task.completed && (
                      <button onClick={() => completeTask(task)} className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95">CHECK</button>
                    )}
                    <button onClick={() => deleteTask(task.id)} className="p-3 rounded-2xl dark:bg-zinc-800 bg-gray-100 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-500/10">🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {activeModal === 'progression' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl border dark:border-zinc-800 border-gray-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black mb-2 tracking-tighter">The Hero's Path</h2>
            <p className="text-zinc-500 text-sm font-bold mb-8">Rise through the ranks with daily discipline.</p>

            <div className="space-y-3">
              {classTiers.map((tier) => {
                const isCurrent = userData.level >= tier.minLevel && (tier.maxLevel === '∞' || userData.level <= tier.maxLevel);
                const isPassed = userData.level > (tier.maxLevel === '∞' ? 999 : tier.maxLevel);
                
                return (
                  <div key={tier.name} className={`p-5 rounded-[1.5rem] border flex items-center justify-between transition-all ${isCurrent ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10' : isPassed ? 'dark:bg-zinc-950 bg-gray-50 border-green-500/20' : 'dark:bg-zinc-950/40 bg-gray-50/50 border-gray-200 dark:border-zinc-800 opacity-60'}`}>
                    <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${isCurrent ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : isPassed ? 'bg-green-500/20 text-green-500' : 'bg-gray-200 dark:bg-zinc-800 text-gray-400'}`}>
                          {isPassed ? '✓' : tier.minLevel}
                        </div>
                        <div>
                          <h4 className={`font-black text-lg ${isCurrent ? 'text-purple-600 dark:text-purple-400' : isPassed ? 'text-green-600 dark:text-green-500' : 'text-gray-500 dark:text-zinc-500'}`}>{tier.name}</h4>
                          <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
                            {tier.maxLevel === '∞' ? `Level ${tier.minLevel}+` : `Levels ${tier.minLevel} - ${tier.maxLevel}`}
                          </span>
                        </div>
                    </div>
                    {isCurrent && (
                        <div className="text-right">
                          <span className="block text-[10px] tracking-widest font-black text-purple-500 uppercase animate-pulse">Current</span>
                        </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-8 p-6 rounded-[1.5rem] dark:bg-zinc-950 bg-purple-50 border dark:border-zinc-800 border-purple-100 text-center shadow-inner">
               <p className="text-sm font-bold dark:text-zinc-300 text-zinc-700 leading-relaxed">
                 You need <span className="text-purple-600 dark:text-purple-400 font-black">{xpToNextLevel - userData.xp} XP</span> to reach Level {userData.level + 1}.
               </p>
               {nextTier && (
                 <p className="text-xs font-bold text-zinc-500 mt-2">
                   Only <span className="text-zinc-800 dark:text-zinc-200 font-black">{levelsToNextClass} levels</span> until you become an {nextTier.name}!
                 </p>
               )}
            </div>

            <button onClick={() => setActiveModal(null)} className="w-full dark:bg-zinc-800 bg-gray-200 dark:text-white text-zinc-800 p-5 rounded-[1.5rem] font-black mt-8 hover:dark:bg-zinc-700 hover:bg-gray-300 transition-all active:scale-95">CLOSE MAP</button>
          </div>
        </div>
      )}

      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl border dark:border-zinc-800 border-gray-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black mb-8 tracking-tighter">Your Profile</h2>
            <div className="space-y-6">
               <div>
                 <label className="text-[11px] font-black uppercase text-zinc-500 block mb-3 ml-1 tracking-widest">Hero Name</label>
                 <input className="w-full p-5 rounded-2xl dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-800 border-gray-200 outline-none focus:ring-2 focus:ring-purple-500/50 text-lg font-bold" value={userData.name} onChange={async e => await updateDoc(doc(db, "users", user.uid), { name: e.target.value })} />
               </div>
               <div>
                 <label className="text-[11px] font-black uppercase text-zinc-500 block mb-3 ml-1 tracking-widest">Hero Age</label>
                 <input type="number" className="w-full p-5 rounded-2xl dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-800 border-gray-200 outline-none focus:ring-2 focus:ring-purple-500/50 text-lg font-bold" value={userData.age} onChange={async e => await updateDoc(doc(db, "users", user.uid), { age: e.target.value })} />
               </div>
               <div>
                 <label className="text-[11px] font-black uppercase text-zinc-500 block mb-3 ml-1 tracking-widest">Hero Bio</label>
                 <textarea className="w-full p-5 rounded-2xl dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-800 border-gray-200 outline-none focus:ring-2 focus:ring-purple-500/50 h-32 resize-none text-base font-medium" value={userData.bio} onChange={async e => await updateDoc(doc(db, "users", user.uid), { bio: e.target.value })} />
               </div>
            </div>
            <button onClick={() => setActiveModal(null)} className="w-full bg-purple-600 text-white p-5 rounded-[1.5rem] font-black mt-10 hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20 active:scale-95">SAVE JOURNEY</button>
          </div>
        </div>
      )}

      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl border dark:border-zinc-800 border-gray-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-black mb-10 tracking-tighter">Account Settings</h2>
            
            <div className="space-y-6">
              <div className="p-7 dark:bg-zinc-950 bg-gray-50 rounded-[2rem] border dark:border-zinc-800 border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="font-black text-lg block tracking-tight">Hard Mode</span>
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">High Stakes Discipline</span>
                  </div>
                  <button 
                    onClick={async () => await updateDoc(doc(db, "users", user.uid), { hardMode: !userData.hardMode })}
                    className={`w-16 h-8 rounded-full transition-all flex-shrink-0 relative ${userData.hardMode ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'dark:bg-zinc-700 bg-gray-300'}`}
                  >
                    <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all ${userData.hardMode ? 'left-9' : 'left-1.5'}`}></div>
                  </button>
                </div>
                
                <div className="text-[14px] leading-relaxed dark:text-zinc-400 text-gray-600 space-y-4 border-t dark:border-zinc-800 border-gray-200 pt-6 font-medium">
                  <p>🟢 <strong className="dark:text-zinc-200 text-zinc-900">Normal:</strong> Standard XP rewards. No penalties.</p>
                  <p>🔴 <strong className="dark:text-zinc-200 text-zinc-900 font-black">Hard Mode:</strong> Earn <span className="text-green-500 font-black">1.5x XP</span>. If you go 48hrs without a quest, your <span className="text-red-500 font-black">streak resets</span> and you <span className="text-red-500 font-black">lose 50 XP</span>.</p>
                </div>
              </div>
              
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full p-6 rounded-[1.5rem] dark:bg-zinc-950 bg-gray-50 border dark:border-zinc-800 border-gray-200 font-black text-left flex justify-between items-center text-lg hover:dark:bg-zinc-800 hover:bg-gray-100 transition-all">
                <span>Visual Theme</span>
                <span>{isDarkMode ? '🌙' : '☀️'}</span>
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={resetAllProgress} className="w-full p-4 rounded-2xl border dark:border-orange-500/30 border-orange-200 text-orange-500 font-black text-center text-xs hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all">
                  Reset Progress
                </button>
                <button onClick={deleteAccount} className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 font-black text-center text-xs hover:bg-red-500/20 transition-all">
                  💀 Delete Account
                </button>
              </div>

            </div>
            
            <button onClick={() => setActiveModal(null)} className="w-full dark:bg-zinc-800 bg-gray-200 dark:text-white text-zinc-800 p-5 rounded-[1.5rem] font-black mt-8 hover:dark:bg-zinc-700 hover:bg-gray-300 transition-all active:scale-95">CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;