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
  
  // 🌟 Loading State Added
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
      setIsLoading(false); // Stop loading if auth state changes successfully
    });
    return () => unsubscribe();
  }, []);

  const handleEmailAuth = async (e, isLogin) => {
    e.preventDefault();
    setIsLoading(true); // Start loading
    try {
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      const action = isLogin ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
      await action(auth, email, password);
    } catch (err) {
      alert(err.message);
      setIsLoading(false); // Stop loading if there's an error
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
    <div className="min-h-screen transition-colors duration-300 dark:bg-zinc-950 dark:text-gray-200 bg-gray-50 text-zinc-900 font-sans">
      <nav className="dark:bg-purple-900 bg-purple-700 p-4 shadow-lg flex justify-between items-center text-white border-b dark:border-purple-700 border-purple-800">
        <h1 className="text-2xl font-bold tracking-wider text-yellow-400">🏛️ PROJECT STOICISM</h1>
        {user && <button onClick={() => signOut(auth)} className="bg-red-600 px-4 py-2 rounded font-bold hover:bg-red-700 transition">Logout</button>}
      </nav>

      <main className="container mx-auto p-4 mt-6">
        {user ? (
          <Dashboard user={user} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        ) : (
          <div className="max-w-md mx-auto dark:bg-zinc-900 bg-white p-8 rounded-xl shadow-2xl mt-10 border dark:border-purple-800 border-purple-200">
            <h2 className="text-3xl font-bold mb-6 text-center text-purple-600 dark:text-purple-400">Enter the Arena</h2>
            
            <form className="flex flex-col gap-4">
              <input 
                type="email" placeholder="Email" 
                disabled={isLoading}
                className="border dark:border-zinc-700 border-gray-300 dark:bg-zinc-800 bg-gray-50 dark:text-white text-black p-3 rounded focus:outline-none focus:border-purple-500 disabled:opacity-50" 
                onChange={e => setEmail(e.target.value)} 
              />
              
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} placeholder="Password" 
                  disabled={isLoading}
                  className="w-full border dark:border-zinc-700 border-gray-300 dark:bg-zinc-800 bg-gray-50 dark:text-white text-black p-3 rounded focus:outline-none focus:border-purple-500 disabled:opacity-50" 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm dark:text-gray-400 text-gray-600 mt-1">
                <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-purple-600 w-4 h-4" />
                <label htmlFor="remember" className="cursor-pointer">Remember me</label>
              </div>

              {/* 🌟 Added Disabled states and loading text to buttons */}
              <div className="flex gap-4 mt-2">
                <button onClick={(e) => handleEmailAuth(e, true)} disabled={isLoading} className="flex-1 bg-purple-700 text-white p-3 rounded font-bold hover:bg-purple-600 transition disabled:opacity-70 flex justify-center items-center">
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
                <button onClick={(e) => handleEmailAuth(e, false)} disabled={isLoading} className="flex-1 dark:bg-zinc-700 bg-gray-200 dark:text-white text-zinc-800 p-3 rounded font-bold hover:bg-gray-300 dark:hover:bg-zinc-600 transition disabled:opacity-70">
                  {isLoading ? 'Wait...' : 'Sign Up'}
                </button>
              </div>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t dark:border-zinc-700 border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 dark:text-gray-500 text-gray-400 text-sm">OR</span>
                <div className="flex-grow border-t dark:border-zinc-700 border-gray-300"></div>
              </div>

              <button onClick={handleGoogleLogin} disabled={isLoading} className="w-full bg-white text-gray-800 border border-gray-300 p-3 rounded font-bold hover:bg-gray-100 transition flex justify-center items-center gap-2 disabled:opacity-70">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                {isLoading ? 'Authenticating...' : 'Continue with Google'}
              </button>
              
              <button onClick={handleGuestLogin} disabled={isLoading} className="w-full dark:bg-zinc-800 bg-gray-800 text-white p-3 rounded font-bold hover:bg-gray-700 transition disabled:opacity-70">
                {isLoading ? 'Entering Arena...' : 'Play as Guest'}
              </button>
            </form>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;