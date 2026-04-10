import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously
} from 'firebase/auth';
import Dashboard from './components/Dashboard';

function App() {
  // Authentication & Settings States
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(true); 
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') !== 'light');

  // Global Navigation States (Lifted from Dashboard)
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  const handleEmailAuth = async (e, isLogin) => {
    e.preventDefault();
    setIsLoading(true); 
    try {
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      const action = isLogin ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
      await action(auth, email, password);
    } catch (err) {
      alert(err.message);
      setIsLoading(false); 
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      alert(err.message);
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      alert(err.message);
      setIsLoading(false);
    }
  };

  // Loading Screen prevents flash of content
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-zinc-950 bg-gray-50 dark:text-purple-400 text-purple-600 font-black tracking-widest text-sm">
        ENTERING ARENA...
      </div>
    );
  }

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-zinc-950 dark:text-gray-200 bg-gray-50 text-zinc-900 font-sans selection:bg-purple-500/30">
      
      {/* 🌟 UNIFIED TOP NAVIGATION BAR */}
      <nav className="dark:bg-zinc-900 bg-white p-4 shadow-sm flex justify-between items-center border-b dark:border-zinc-800 border-gray-200 sticky top-0 z-[100]">
        <h1 className="text-lg font-black tracking-wider dark:text-white text-zinc-900 flex items-center gap-2">
          <span className="text-purple-600 dark:text-purple-500">🏛️</span> PROJECT STOICISM
        </h1>
        
        {user && (
          <div className="flex items-center gap-6">
            <button onClick={() => signOut(auth)} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">Log out</button>
            
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-xl font-bold"
              >
                ☰
              </button>
              
              {/* DROPDOWN MENU */}
              {menuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-zinc-900 border dark:border-zinc-800 border-gray-100 rounded-2xl shadow-2xl z-[110] py-2 animate-in slide-in-from-top-2">
                  <button 
                    onClick={() => { setActiveModal('profile'); setMenuOpen(false); }} 
                    className="w-full text-left px-5 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold text-sm flex items-center gap-3 transition-colors"
                  >
                    👤 Your Profile
                  </button>
                  <button 
                    onClick={() => { setActiveModal('settings'); setMenuOpen(false); }} 
                    className="w-full text-left px-5 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-bold text-sm flex items-center gap-3 transition-colors"
                  >
                    ⚙️ Account Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="container mx-auto p-4 sm:p-6 mt-4">
        {user ? (
          /* 🌟 PASSING STATES DOWN TO DASHBOARD */
          <Dashboard 
            user={user} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode} 
            activeModal={activeModal} 
            setActiveModal={setActiveModal} 
          />
        ) : (
          /* LOGIN SCREEN */
          <div className="max-w-sm mx-auto dark:bg-zinc-900 bg-white p-8 rounded-[2rem] shadow-xl mt-12 border dark:border-zinc-800 border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black dark:text-white text-zinc-900 tracking-tight">Enter the Arena</h2>
              <p className="text-sm dark:text-zinc-400 text-gray-500 mt-2">Log in to track your disciplines.</p>
            </div>
            
            <form className="flex flex-col gap-4">
              <input 
                type="email" placeholder="Email address" 
                className="w-full border dark:border-zinc-700 border-gray-300 dark:bg-zinc-950/50 bg-gray-50 dark:text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium" 
                onChange={e => setEmail(e.target.value)} 
              />
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} placeholder="Password" 
                  className="w-full border dark:border-zinc-700 border-gray-300 dark:bg-zinc-950/50 bg-gray-50 dark:text-white p-4 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium" 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm dark:text-zinc-400 text-gray-600 mt-1 pl-1">
                <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-purple-600 w-4 h-4 rounded cursor-pointer" />
                <label htmlFor="remember" className="cursor-pointer font-bold">Remember me</label>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={(e) => handleEmailAuth(e, true)} className="flex-1 bg-purple-600 text-white p-4 rounded-2xl font-black hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 active:scale-95">Log in</button>
                <button onClick={(e) => handleEmailAuth(e, false)} className="flex-1 dark:bg-zinc-800 bg-gray-100 dark:text-zinc-300 text-zinc-700 p-4 rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all border dark:border-zinc-700 active:scale-95">Sign up</button>
              </div>

              <div className="relative flex items-center py-5">
                <div className="flex-grow border-t dark:border-zinc-800 border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 dark:text-zinc-500 text-gray-400 text-[10px] font-black uppercase tracking-widest">Or continue with</span>
                <div className="flex-grow border-t dark:border-zinc-800 border-gray-200"></div>
              </div>

              <button onClick={handleGoogleLogin} className="w-full dark:bg-zinc-950 bg-white dark:text-zinc-200 border dark:border-zinc-800 p-4 rounded-2xl font-black hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all flex justify-center items-center gap-3 shadow-sm active:scale-95">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> Google
              </button>
              
              <button onClick={handleGuestLogin} className="w-full text-xs font-bold text-gray-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors mt-2 underline underline-offset-4 decoration-gray-300 dark:decoration-zinc-700">
                Play as guest instead
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;