import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // New state for Remember Me

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e, isLogin) => {
    e.preventDefault();
    try {
      // Set persistence BEFORE logging in
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      const action = isLogin ? signInWithEmailAndPassword : createUserWithEmailAndPassword;
      await action(auth, email, password);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-200 font-sans">
      <nav className="bg-purple-900 p-4 shadow-lg flex justify-between items-center text-white border-b border-purple-700">
        <h1 className="text-2xl font-bold tracking-wider text-yellow-500">🏛️ PROJECT STOICISM</h1>
        {user && <button onClick={() => signOut(auth)} className="bg-red-600 px-4 py-2 rounded font-bold hover:bg-red-700 transition">Logout</button>}
      </nav>

      <main className="container mx-auto p-4 mt-6">
        {user ? (
          <Dashboard user={user} />
        ) : (
          <div className="max-w-md mx-auto bg-zinc-900 p-8 rounded-xl shadow-2xl mt-10 border border-purple-800">
            <h2 className="text-3xl font-bold mb-6 text-center text-purple-400">Enter the Arena</h2>
            <form className="flex flex-col gap-4">
              <input 
                type="email" placeholder="Email" 
                className="border border-zinc-700 bg-zinc-800 text-white p-3 rounded focus:outline-none focus:border-purple-500" 
                onChange={e => setEmail(e.target.value)} 
              />
              
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} placeholder="Password" 
                  className="w-full border border-zinc-700 bg-zinc-800 text-white p-3 rounded focus:outline-none focus:border-purple-500" 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* REMEMBER ME CHECKBOX */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-purple-600 w-4 h-4"
                />
                <label htmlFor="remember" className="cursor-pointer">Remember me</label>
              </div>

              <div className="flex gap-4 mt-2">
                <button onClick={(e) => handleAuth(e, true)} className="flex-1 bg-purple-700 text-white p-3 rounded font-bold hover:bg-purple-600 transition">Login</button>
                <button onClick={(e) => handleAuth(e, false)} className="flex-1 bg-zinc-700 text-white p-3 rounded font-bold hover:bg-zinc-600 transition">Sign Up</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;