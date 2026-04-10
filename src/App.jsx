import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously
} from 'firebase/auth';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

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

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-zinc-950 dark:text-gray-200 bg-gray-50 text-zinc-900 font-sans selection:bg-purple-500/30">
      <nav className="dark:bg-zinc-900 bg-white p-4 shadow-sm flex justify-between items-center border-b dark:border-zinc-800 border-gray-200 sticky top-0 z-40">
        <h1 className="text-xl font-black tracking-wider dark:text-white text-zinc-900 flex items-center gap-2">
          <span className="text-purple-600 dark:text-purple-500">🏛️</span> PROJECT STOICISM
        </h1>
        {user && <button onClick={() => signOut(auth)} className="text-sm font-bold text-gray-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition">Log out</button>}
      </nav>

      <main className="container mx-auto p-4 sm:p-6 mt-4">
        {user ? (
          <Dashboard user={user} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        ) : (
          <div className="max-w-sm mx-auto dark:bg-zinc-900 bg-white p-8 rounded-2xl shadow-xl mt-12 border dark:border-zinc-800 border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black dark:text-white text-zinc-900 tracking-tight">Enter the Arena</h2>
              <p className="text-sm dark:text-zinc-400 text-gray-500 mt-2">Log in to track your disciplines.</p>
            </div>
            
            <form className="flex flex-col gap-4">
              {/* Point 4: Input UX & Focus States */}
              <div>
                <input 
                  type="email" placeholder="Email address" 
                  disabled={isLoading}
                  className="w-full border dark:border-zinc-700 border-gray-300 dark:bg-zinc-950/50 bg-gray-50 dark:text-white text-zinc-900 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all disabled:opacity-50 placeholder:text-gray-400 dark:placeholder:text-zinc-500" 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} placeholder="Password" 
                  disabled={isLoading}
                  className="w-full border dark:border-zinc-700 border-gray-300 dark:bg-zinc-950/50 bg-gray-50 dark:text-white text-zinc-900 p-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all disabled:opacity-50 placeholder:text-gray-400 dark:placeholder:text-zinc-500" 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm dark:text-zinc-400 text-gray-600 mt-1">
                <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-purple-600 w-4 h-4 rounded cursor-pointer" />
                <label htmlFor="remember" className="cursor-pointer select-none">Remember me</label>
              </div>

              {/* Point 1 & 5: Visual Hierarchy of Buttons */}
              <div className="flex gap-3 mt-4">
                <button onClick={(e) => handleEmailAuth(e, true)} disabled={isLoading} className="flex-1 bg-purple-600 text-white p-3.5 rounded-xl font-bold hover:bg-purple-700 active:scale-[0.98] transition-all disabled:opacity-70 shadow-sm flex justify-center items-center">
                  {isLoading ? 'Logging in...' : 'Log in'}
                </button>
                <button onClick={(e) => handleEmailAuth(e, false)} disabled={isLoading} className="flex-1 dark:bg-zinc-800 bg-gray-100 dark:text-zinc-300 text-zinc-700 p-3.5 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all disabled:opacity-70 border dark:border-zinc-700 border-gray-200">
                  {isLoading ? 'Wait...' : 'Sign up'}
                </button>
              </div>

              {/* Point 8: Better Divider */}
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t dark:border-zinc-800 border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 dark:text-zinc-500 text-gray-400 text-xs font-bold uppercase tracking-widest">Or continue with</span>
                <div className="flex-grow border-t dark:border-zinc-800 border-gray-200"></div>
              </div>

              {/* Point 8: Refined Google Button */}
              <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full dark:bg-zinc-950 bg-white dark:text-zinc-200 text-gray-800 border dark:border-zinc-800 border-gray-200 p-3.5 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all flex justify-center items-center gap-3 disabled:opacity-70 shadow-sm">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                {isLoading ? 'Authenticating...' : 'Google'}
              </button>
              
              {/* Point 1: De-emphasized Guest Login */}
              <button onClick={handleGuestLogin} disabled={isLoading} className="w-full text-sm font-medium text-gray-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors mt-2 underline underline-offset-4 decoration-gray-300 dark:decoration-zinc-700">
                {isLoading ? 'Entering Arena...' : 'Play as guest instead'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;