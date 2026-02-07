import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, X, Store, Package, CreditCard, 
  Menu, Trash2, User, Settings, LogOut, LayoutDashboard, TrendingUp, 
  Clock, MapPin, Phone, ArrowLeft, Edit, Save, LogIn, Eye, EyeOff,
  ChevronRight, CheckCircle, AlertCircle, Loader, Scale, Truck, ShoppingBasket,
  Smartphone, Lock, Printer
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, setDoc,
  deleteDoc, onSnapshot, query, orderBy, where, serverTimestamp 
} from 'firebase/firestore';

// --- DIRECT FIREBASE CONFIGURATION (NO ENV VARS) ---
const firebaseConfig = {
  apiKey: "AIzaSyB-yMrlMnPcEYJrg38qH_XQjJBpN69Eqyk",
  authDomain: "arihant-provision-stores.firebaseapp.com",
  projectId: "arihant-provision-stores",
  storageBucket: "arihant-provision-stores.firebasestorage.app",
  messagingSenderId: "376012889023",
  appId: "1:376012889023:web:01fcdff59448e9ea399f0a"
};

// Initialize Firebase safely
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

const STORE_INFO = {
  name: "Arihant Provision Stores",
  phone: "+91 9881469046",
  address: "Behind K.K. Hospital, Markal Road, Alandi Devachi, Pune",
  owner: "Devichand"
};

const INITIAL_PRODUCTS = [
  { id: '1', name: "Premium Basmati Rice", price: 120, category: "Grains", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", unit: "1 kg", stock: 50 },
  { id: '2', name: "Organic Turmeric Powder", price: 220, category: "Spices", image: "https://images.unsplash.com/photo-1615485290382-441e4d0c9cb5?w=400", unit: "1 kg", stock: 100 },
  { id: '3', name: "Pure Cow Ghee", price: 650, category: "Dairy", image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400", unit: "1 ltr", stock: 25 },
  { id: '4', name: "Moong Dal (Yellow)", price: 110, category: "Pulses", image: "https://images.unsplash.com/photo-1585994192561-9a994f245517?w=400", unit: "1 kg", stock: 40 },
  { id: '5', name: "Whole Black Pepper", price: 800, category: "Spices", image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400", unit: "1 kg", stock: 60 },
  { id: '6', name: "Sugar (S-30)", price: 42, category: "Essentials", image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400", unit: "1 kg", stock: 200 }
];

const CATEGORIES = ["All", "Grains", "Spices", "Pulses", "Dairy", "Essentials", "Snacks"];
const WEIGHT_VARIANTS = [
  { label: '250g', multiplier: 0.25 }, { label: '500g', multiplier: 0.5 }, { label: '1 kg', multiplier: 1 }, { label: 'Custom', multiplier: null } 
];
const ORDER_STATUSES = ["Pending", "Accepted", "Packed", "Out for Delivery", "Ready for Pickup", "Completed", "Cancelled"];

// --- COMPONENTS ---

const LandingView = ({ onLoginClick, onGuestClick }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
    <div className="bg-white/10 p-6 rounded-3xl mb-8"><Store size={64} className="text-orange-500" /></div>
    <h1 className="text-4xl font-black text-white mb-2">Arihant Store</h1>
    <p className="text-slate-400 mb-10">Quality Groceries Delivered</p>
    <div className="space-y-4 w-full max-w-sm">
      <button onClick={onLoginClick} className="w-full bg-orange-600 text-white p-4 rounded-xl font-bold">Login / Sign Up</button>
      <button onClick={onGuestClick} className="w-full bg-slate-800 text-slate-300 p-4 rounded-xl font-bold">Browse as Guest</button>
    </div>
  </div>
);

const ProductCard = ({ product, onClick }) => (
  <div onClick={() => onClick(product)} className="bg-white rounded-xl border border-slate-100 overflow-hidden cursor-pointer shadow-sm">
    <img src={product.image} onError={(e) => e.target.src='https://placehold.co/400?text=No+Image'} className="w-full h-40 object-cover" />
    <div className="p-3">
      <p className="text-[10px] font-bold text-orange-600 uppercase">{product.category}</p>
      <h3 className="font-bold text-sm line-clamp-1">{product.name}</h3>
      <div className="flex justify-between items-center mt-2">
        <span className="font-bold">₹{product.price}</span>
        <button className="bg-slate-100 p-2 rounded text-orange-600 font-bold text-xs">ADD</button>
      </div>
    </div>
  </div>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('landing');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [authError, setAuthError] = useState('');

  // Admin State
  const [orders, setOrders] = useState([]);

  // --- INIT ---
  useEffect(() => {
    if (!auth) {
      setErrorMsg("Firebase failed to initialize. Check console.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !currentUser.isAnonymous) {
         const isAdmin = currentUser.email === 'bhandari.devichand9@gmail.com';
         setUser({
            uid: currentUser.uid,
            name: currentUser.displayName || localStorage.getItem('userName') || 'User',
            email: currentUser.email,
            role: isAdmin ? 'admin' : 'customer'
         });
         setView(isAdmin ? 'admin-dash' : 'shop');
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!db) { setProducts(INITIAL_PRODUCTS); return; }
    
    // Safely try to fetch products
    try {
      const unsub = onSnapshot(collection(db, 'products'), (snap) => {
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setProducts(data.length > 0 ? data : INITIAL_PRODUCTS);
      }, (err) => {
        console.warn("Firestore Read Error (Products):", err);
        setProducts(INITIAL_PRODUCTS); // Fallback if rules deny access
      });
      return () => unsub();
    } catch (e) {
      console.error(e);
      setProducts(INITIAL_PRODUCTS);
    }
  }, []);

  // --- HANDLERS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!phoneNumber || !password) return;
    
    const email = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@arihant.store`;
    
    try {
      if (isSignup) {
        localStorage.setItem('userName', fullName);
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleGuest = async () => {
    try { await signInAnonymously(auth); setView('shop'); } catch(e) { alert("Guest login failed"); }
  };

  const logout = async () => {
    await signOut(auth);
    setView('landing');
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-xl">Loading Arihant Store...</div>;
  if (errorMsg) return <div className="h-screen flex items-center justify-center text-red-600">{errorMsg}</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* LANDING */}
      {view === 'landing' && <LandingView onLoginClick={() => setView('auth')} onGuestClick={handleGuest} />}

      {/* AUTH */}
      {view === 'auth' && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
             <button onClick={() => setView('landing')} className="mb-4 text-slate-400">Back</button>
             <h2 className="text-3xl font-bold mb-6">{isSignup ? "Create Account" : "Welcome Back"}</h2>
             <form onSubmit={handleAuth} className="space-y-4">
                {isSignup && <input className="w-full p-4 bg-slate-100 rounded-xl" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />}
                <input className="w-full p-4 bg-slate-100 rounded-xl" placeholder="Mobile Number or Email" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                <input className="w-full p-4 bg-slate-100 rounded-xl" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                {authError && <p className="text-red-500 text-sm">{authError}</p>}
                <button className="w-full bg-orange-600 text-white p-4 rounded-xl font-bold">{isSignup ? "Sign Up" : "Login"}</button>
             </form>
             <button onClick={() => setIsSignup(!isSignup)} className="w-full mt-4 text-sm text-slate-500">
               {isSignup ? "Already have an account? Login" : "New here? Create Account"}
             </button>
          </div>
        </div>
      )}

      {/* SHOP (Simplified for stability check) */}
      {(view === 'shop' || view === 'admin-dash') && (
        <>
          <nav className="p-4 bg-white sticky top-0 z-10 shadow-sm flex justify-between items-center">
            <h1 className="font-bold text-xl">Arihant Store</h1>
            <div className="flex gap-2">
              {user?.role === 'admin' && <button onClick={() => setView('admin-dash')} className="text-xs bg-slate-900 text-white px-3 py-1 rounded">Admin</button>}
              <button onClick={logout} className="text-xs text-red-500">Logout</button>
            </div>
          </nav>

          <main className="p-4">
            {view === 'shop' && (
              <div className="grid grid-cols-2 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} onClick={() => alert("Product details not active in safe mode")} />)}
              </div>
            )}
            
            {view === 'admin-dash' && (
              <div className="text-center p-8">
                <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
                <p>Logged in as: {user?.email}</p>
                <div className="mt-4 p-4 bg-yellow-50 rounded border border-yellow-200">
                  <p>If you see this, the app is working correctly!</p>
                  <p>To restore full features, check Vercel logs.</p>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
