import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, X, Store, Package, CreditCard, 
  Menu, Trash2, User, Settings, LogOut, LayoutDashboard, TrendingUp, 
  Clock, MapPin, Phone, ArrowLeft, Edit, Save, LogIn, Eye, EyeOff,
  ChevronRight, CheckCircle, AlertCircle, Loader, Scale, Truck, ShoppingBasket,
  Lock, Printer, KeyRound, Smartphone
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

// --- Configuration & Constants ---
const STORE_INFO = {
  name: "Arihant Provision Stores",
  phone: "+91 9881469046",
  address: "Behind K.K. Hospital, Markal Road, Alandi Devachi, Pune",
  owner: "Devichand"
};

const INITIAL_PRODUCTS = [
  { id: '1', name: "Premium Basmati Rice", price: 120, category: "Grains", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400", unit: "1 kg", stock: 50, description: "Aromatic, long-grain basmati rice perfect for biryani and pulao." },
  { id: '2', name: "Organic Turmeric Powder", price: 220, category: "Spices", image: "https://images.unsplash.com/photo-1615485290382-441e4d0c9cb5?w=400", unit: "1 kg", stock: 100, description: "Pure organic turmeric with high curcumin content." },
  { id: '3', name: "Pure Cow Ghee", price: 650, category: "Dairy", image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400", unit: "1 ltr", stock: 25, description: "Homemade style pure cow ghee." },
  { id: '4', name: "Moong Dal (Yellow)", price: 110, category: "Pulses", image: "https://images.unsplash.com/photo-1585994192561-9a994f245517?w=400", unit: "1 kg", stock: 40, description: "Polished yellow moong dal, rich in protein." },
  { id: '5', name: "Whole Black Pepper", price: 800, category: "Spices", image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400", unit: "1 kg", stock: 60, description: "Spicy and aromatic whole black peppercorns." },
  { id: '6', name: "Sugar (S-30)", price: 42, category: "Essentials", image: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400", unit: "1 kg", stock: 200, description: "Refined white sugar for daily use." },
];

const CATEGORIES = ["All", "Grains", "Spices", "Pulses", "Dairy", "Essentials", "Snacks"];
const WEIGHT_VARIANTS = [
  { label: '250g', multiplier: 0.25 },
  { label: '500g', multiplier: 0.5 },
  { label: '1 kg', multiplier: 1 },
  { label: 'Custom', multiplier: null } 
];

const ORDER_STATUSES = ["Pending", "Accepted", "Packed", "Out for Delivery", "Ready for Pickup", "Completed", "Cancelled"];

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyB-yMrlMnPcEYJrg38qH_XQjJBpN69Eqyk",
  authDomain: "arihant-provision-stores.firebaseapp.com",
  projectId: "arihant-provision-stores",
  storageBucket: "arihant-provision-stores.firebasestorage.app",
  messagingSenderId: "376012889023",
  appId: "1:376012889023:web:01fcdff59448e9ea399f0a"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase init failed:", e);
}

const appId = 'arihant-store-main'; 

// --- Sub-Components ---

const LandingView = ({ onLoginClick, onGuestClick }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 -right-24 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
    </div>
    <div className="relative z-10 w-full max-w-md text-center">
      <div className="mb-8 flex justify-center">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-2xl"><Store size={64} className="text-orange-500" /></div>
      </div>
      <h1 className="text-5xl font-black text-white mb-2 tracking-tight">Arihant <span className="text-orange-500">Store</span></h1>
      <p className="text-slate-400 text-lg mb-10 font-medium">Fresh groceries & essentials delivered to your doorstep in Alandi Devachi.</p>
      <div className="space-y-4">
        <button onClick={onLoginClick} className="w-full group relative bg-orange-600 hover:bg-orange-500 text-white p-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-orange-900/20"><div className="flex items-center justify-center gap-2"><span>Login / Sign Up</span><ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform" size={20} /></div></button>
        <button onClick={onGuestClick} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-2xl font-bold text-lg transition-all border border-slate-700 hover:border-slate-600">Browse as Guest</button>
      </div>
    </div>
  </div>
);

const ProductCard = ({ product, onClick }) => (
  <div onClick={() => onClick(product)} className="bg-white rounded-xl border border-slate-100 overflow-hidden group hover:shadow-lg transition-all cursor-pointer flex flex-col h-full">
    <div className="relative aspect-square bg-slate-50 overflow-hidden">
      <img src={product.image} alt={product.name} onError={(e) => {e.target.src='https://placehold.co/400?text=No+Image'}} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-slate-700 shadow-sm uppercase">{product.unit}</span>
    </div>
    <div className="p-3 flex flex-col flex-1">
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{product.category}</p>
      <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">₹{product.price}</span>
        <button className="bg-slate-100 text-orange-700 border border-orange-200 text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-600 hover:text-white transition-colors uppercase">Add</button>
      </div>
    </div>
  </div>
);

const ProductDetailView = ({ selectedProduct, onClose, addToCart, user, setView }) => {
  if (!selectedProduct) return null;
  const unit = selectedProduct.unit || '';
  const isWeighable = unit.includes('kg') || unit.includes('ltr') || unit.includes('g');
  const [selectedVariant, setSelectedVariant] = useState(isWeighable ? WEIGHT_VARIANTS[2] : null);
  const [customGrams, setCustomGrams] = useState('');
  
  const currentPrice = useMemo(() => {
    if (!isWeighable) return selectedProduct.price;
    if (selectedVariant?.label === 'Custom') {
      if (!customGrams) return 0;
      return Math.ceil((selectedProduct.price / 1000) * parseInt(customGrams || 0)); // Safety check for NaN
    }
    return Math.ceil(selectedProduct.price * (selectedVariant?.multiplier || 1));
  }, [selectedVariant, customGrams, selectedProduct]);

  const handleAddToCart = () => {
    if (currentPrice <= 0) return;
    const label = selectedVariant?.label === 'Custom' ? `${customGrams}g` : (selectedVariant?.label || selectedProduct.unit);
    addToCart(selectedProduct, { price: currentPrice, label });
    if(user) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-200">
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col">
        <div className="relative aspect-video bg-slate-100">
          <button onClick={onClose} className="absolute top-4 left-4 bg-white/80 p-2 rounded-full backdrop-blur-sm z-10 shadow-sm hover:bg-white"><ArrowLeft size={24} /></button>
          <img src={selectedProduct.image} onError={(e) => {e.target.src='https://placehold.co/600?text=No+Image'}} className="w-full h-full object-cover" />
        </div>
        <div className="p-6 flex-1 bg-white -mt-6 rounded-t-3xl relative">
          <div className="w-16 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{selectedProduct.name}</h1>
          <p className="text-slate-500 text-sm mb-4">{selectedProduct.description}</p>
          {isWeighable && (
            <div className="mb-6">
              <h3 className="font-bold text-sm mb-3 text-slate-700">Select Quantity</h3>
              <div className="flex flex-wrap gap-2">{WEIGHT_VARIANTS.map(v => <button key={v.label} onClick={() => setSelectedVariant(v)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${selectedVariant?.label === v.label ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-400'}`}>{v.label}</button>)}</div>
              {selectedVariant?.label === 'Custom' && (
                <div className="mt-4 animate-in slide-in-from-top-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Enter Quantity (in grams)</label><div className="flex items-center gap-2"><input type="number" value={customGrams} onChange={(e) => setCustomGrams(e.target.value)} placeholder="e.g. 750" className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-orange-500" /><span className="font-bold text-slate-400">grams</span></div></div>
              )}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-white p-4 border-t border-slate-100 shadow-lg"><button onClick={handleAddToCart} disabled={currentPrice <= 0} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-orange-200 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-8"><span>Add to Cart</span><span>₹{currentPrice}</span></button></div>
      </div>
    </div>
  );
};

const CustomerProfile = ({ user, myOrders, onLogout, onClose }) => (
  <div className="max-w-3xl mx-auto p-4 pb-20">
    <div className="flex items-center gap-4 mb-8">
      <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full"><ArrowLeft size={20} /></button>
      <h1 className="text-2xl font-bold">My Profile</h1>
    </div>
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-2xl">{user?.name?.[0]?.toUpperCase()}</div>
        <div><h2 className="text-xl font-bold">{user?.name}</h2><p className="text-slate-500">{user?.email}</p></div>
      </div>
      <button onClick={onLogout} className="text-red-500 font-bold text-sm bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">Logout</button>
    </div>
    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock size={18} /> Order History</h3>
    <div className="space-y-4">
      {myOrders.length === 0 ? <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200"><ShoppingBag className="mx-auto text-slate-300 mb-2" /><p className="text-slate-500 font-medium">No previous orders</p></div> : myOrders.map(order => (
        <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-orange-200 transition-colors">
          <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Order ID: #{order.shortId}</span>
              <div className="flex items-center gap-2 mt-1"><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${order.orderType === 'delivery' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{order.orderType === 'delivery' ? 'Home Delivery' : 'Store Takeaway'}</span><span className="text-xs text-slate-500">{new Date(order.timestamp).toLocaleDateString()}</span></div>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</span>
          </div>
          <div className="space-y-1 mb-3">{order.items.map((item, idx) => <div key={idx} className="flex justify-between text-sm"><span className="text-slate-700">{item.name} <span className="text-slate-400 text-xs">({item.unit})</span> x {item.quantity}</span><span className="font-medium">₹{item.price * item.quantity}</span></div>)}</div>
          <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200"><span className="text-sm text-slate-500">Total Paid</span><span className="font-black text-slate-900">₹{order.total}</span></div>
        </div>
      ))}
    </div>
  </div>
);

const CheckoutView = ({ user, cart, onClose, placeOrder, cartTotal }) => {
  const [step, setStep] = useState(1);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [details, setDetails] = useState({ name: user?.name || '', phone: user?.email || '', address: '' });
  
  useEffect(() => {
      if (user) {
          setDetails(prev => ({ 
              ...prev, 
              name: prev.name || user.name || '', 
              phone: prev.phone || user.email || '' 
          }));
      }
  }, [user]);

  const isNextEnabled = useMemo(() => {
    if (!details.name || !details.phone || details.phone.length < 10) return false;
    if (deliveryType === 'delivery' && !details.address) return false;
    return true;
  }, [details, deliveryType]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white sticky top-0 z-10">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft /></button>
          <h2 className="text-lg font-bold">Checkout</h2>
        </div>
        <div className="flex-1 p-6 space-y-8">
          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div>
                <h3 className="text-xl font-bold mb-4">Order Type</h3>
                <div className="flex gap-4">
                  <button onClick={() => setDeliveryType('delivery')} className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${deliveryType === 'delivery' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-100 bg-white text-slate-400'}`}><Truck size={24} /><span className="font-bold text-sm">Delivery</span></button>
                  <button onClick={() => setDeliveryType('takeaway')} className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${deliveryType === 'takeaway' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-100 bg-white text-slate-400'}`}><ShoppingBasket size={24} /><span className="font-bold text-sm">Takeaway</span></button>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Details</h3>
                <input type="text" value={details.name} onChange={e => setDetails({...details, name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-orange-500" placeholder="Full Name" />
                <input type="tel" value={details.phone} onChange={e => setDetails({...details, phone: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-orange-500" placeholder="Phone Number" />
                {deliveryType === 'delivery' ? <textarea value={details.address} onChange={e => setDetails({...details, address: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[100px] outline-none focus:border-orange-500" placeholder="Full Delivery Address" /> : <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-800"><p className="font-bold mb-1">Pickup Location:</p><p>{STORE_INFO.address}</p></div>}
              </div>
              <button disabled={!isNextEnabled} onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed">Next: Review & Pay</button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <h3 className="text-xl font-bold">Order Summary</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                {cart.map(item => <div key={item.cartId} className="flex justify-between text-sm"><span className="text-slate-600">{item.name} ({item.unit}) x {item.quantity}</span><span className="font-bold">₹{item.price * item.quantity}</span></div>)}
                <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between font-bold text-lg"><span>Total Amount</span><span>₹{cartTotal}</span></div>
              </div>
              {deliveryType === 'delivery' && <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-3 rounded-lg"><AlertCircle size={16} className="shrink-0 mt-0.5" /><p>Note: Delivery charges may vary depending on distance and will be collected at the time of delivery.</p></div>}
              <button onClick={() => placeOrder(details, deliveryType)} className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200 mt-4">{deliveryType === 'delivery' ? 'Place Delivery Order (COD)' : 'Confirm Takeaway Order'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SuccessView = ({ successData, onClose }) => (
  <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce"><CheckCircle className="text-green-600 w-12 h-12" /></div>
    <h2 className="text-3xl font-black text-slate-900 mb-6">Order Confirmed!</h2>
    
    <div className="bg-slate-50 p-6 rounded-2xl w-full max-w-sm text-left border border-slate-200 shadow-sm mb-8">
       {successData.orderType === 'delivery' ? (
         <div className="space-y-3">
            <p className="text-slate-900 font-medium">Thank you for ordering from <span className="text-orange-600 font-bold">Arihant Provision Stores</span> 🙏</p>
            <div className="py-2 border-t border-b border-slate-200 my-2">
              <p className="text-sm font-bold text-slate-700">Order ID: <span className="text-lg text-black">#{successData.shortId}</span></p>
            </div>
            <p className="text-xs text-slate-500">Delivery Address:<br/><span className="text-slate-800 font-medium">{successData.address}</span></p>
            <p className="text-xs text-blue-600 font-medium bg-blue-50 p-2 rounded-lg">Your order is being prepared and will be delivered soon.</p>
            <p className="text-xs text-slate-400 mt-2">Please show this Order ID to the delivery person.</p>
         </div>
       ) : (
         <div className="space-y-3">
            <p className="text-slate-900 font-medium">Thank you for ordering from <span className="text-orange-600 font-bold">Arihant Provision Stores</span> 🙏</p>
            <div className="py-2 border-t border-b border-slate-200 my-2">
               <p className="text-sm font-bold text-slate-700">Order ID: <span className="text-lg text-black">#{successData.shortId}</span></p>
            </div>
            <p className="text-xs text-purple-600 font-bold bg-purple-50 p-2 rounded-lg text-center uppercase">Confirmed for TAKEAWAY</p>
            <div className="text-xs text-slate-500 mt-2">
               <p className="font-bold">Pickup Address:</p>
               <p className="text-slate-800">{STORE_INFO.address}</p>
            </div>
            <p className="text-xs text-slate-400 mt-2">Please show this Order ID at the counter.</p>
         </div>
       )}
       <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-center">
         <p className="text-xs text-slate-400">For help, call <a href={`tel:${STORE_INFO.phone}`} className="text-orange-600 font-bold underline">{STORE_INFO.phone}</a></p>
       </div>
    </div>

    <div className="flex gap-4 w-full max-w-sm">
      <button onClick={() => window.print()} className="flex-1 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"><Printer size={18} /> Print</button>
      <button onClick={onClose} className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors">Done</button>
    </div>
  </div>
);

const AdminPanel = ({ 
  toggleShopStatus, isShopOpen, handleLogout, orders, updateOrderStatus,
  products, saveProduct, deleteProduct 
}) => {
  const [adminView, setAdminView] = useState('orders'); 
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Essentials', stock: 10, unit: '1 kg', image: '' });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        price: editingProduct.price || '',
        category: editingProduct.category || 'Essentials',
        stock: editingProduct.stock || 0,
        unit: editingProduct.unit || '',
        image: editingProduct.image || '',
        description: editingProduct.description || ''
      });
    } else {
      setFormData({ name: '', price: '', category: 'Essentials', stock: 10, unit: '1 kg', image: '' });
    }
  }, [editingProduct]);

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    await saveProduct(formData, !!editingProduct, editingProduct?.id);
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: 'Essentials', stock: 10, unit: '1 kg', image: '' });
  };

  const filteredInventory = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
        <div><h2 className="text-2xl font-bold">Admin Dashboard</h2><div className="flex items-center gap-2 mt-2"><span className="text-sm opacity-80">Shop Status:</span><button onClick={toggleShopStatus} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${isShopOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{isShopOpen ? <div className="flex items-center gap-1"><CheckCircle size={14}/> OPEN</div> : <div className="flex items-center gap-1"><X size={14}/> CLOSED</div>}</button></div></div>
        <button onClick={handleLogout} className="bg-white/10 p-2 rounded-lg hover:bg-white/20"><LogOut /></button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 pb-4">
        <button onClick={() => setAdminView('orders')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${adminView === 'orders' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Orders</button>
        <button onClick={() => setAdminView('inventory')} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${adminView === 'inventory' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>Inventory</button>
      </div>

      {adminView === 'inventory' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
            <h3 className="font-bold text-lg mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Name</label><input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (₹)</label><input type="number" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" value={formData.price || ''} onChange={e => setFormData({...formData, price: e.target.value})} required /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit</label><input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} required /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label><select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" value={formData.category || 'Essentials'} onChange={e => setFormData({...formData, category: e.target.value})}>{CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image URL</label><div className="flex gap-2"><input className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200" placeholder="https://..." value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} required />{formData.image && <img src={formData.image} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200" onError={(e) => {e.target.src='https://placehold.co/100'}} />}</div></div>
              <div className="flex gap-2 pt-2">
                {editingProduct && <button type="button" onClick={() => { setEditingProduct(null); setFormData({ name: '', price: '', category: 'Essentials', stock: 10, unit: '1 kg', image: '' }); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Cancel</button>}
                <button className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">{editingProduct ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-lg">Inventory ({products.length})</h3><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm outline-none focus:border-orange-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]"><tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{filteredInventory.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 flex items-center gap-3"><img src={p.image} onError={(e) => {e.target.src='https://placehold.co/100'}} className="w-10 h-10 rounded-lg object-cover bg-slate-100" /><div><p className="font-bold text-slate-900">{p.name}</p><p className="text-xs text-slate-500">{p.unit}</p></div></td>
                      <td className="p-4"><span className="bg-orange-50 text-orange-700 px-2 py-1 rounded-md text-xs font-bold uppercase">{p.category}</span></td>
                      <td className="p-4 font-bold">₹{p.price}</td>
                      <td className="p-4 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => setEditingProduct(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button><button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}</tbody>
                </table>
                {filteredInventory.length === 0 && <div className="p-8 text-center text-slate-400">No products found</div>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Orders</h3>
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold">{order.name} <span className="text-slate-400 font-normal">({order.phone})</span></h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">ID: #{order.shortId || '---'}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${order.orderType === 'delivery' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}</span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">{new Date(order.timestamp).toLocaleDateString()}</span>
                  </div>
                  <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)} className={`text-xs font-bold px-2 py-1.5 rounded outline-none cursor-pointer ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                </div>
                <div className="text-sm text-slate-600 mt-2">{order.items.map(i => `${i.name} (${i.unit})`).join(', ')}</div>
                {order.orderType === 'delivery' && <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded"><span className="font-bold">Address:</span> {order.address}</div>}
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-100"><span className="text-xs text-slate-400">Total</span><span className="font-bold">₹{order.total}</span></div>
              </div>
            ))}
            {orders.length === 0 && <div className="text-center py-10 text-slate-400">No orders received yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  // State
  const [user, setUser] = useState(null); 
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [view, setView] = useState('landing'); 
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [lastOrderData, setLastOrderData] = useState(null); 
  
  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Auth Form State
  const [authSection, setAuthSection] = useState('customer'); 
  const [isSignup, setIsSignup] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [resetSent, setResetSent] = useState(false); 

  // --- Effects ---

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setProducts(INITIAL_PRODUCTS);
      return;
    }

    const initAuth = async () => {
      if (auth.currentUser) return;
      try {
        await signInAnonymously(auth);
      } catch (err) {
        // Silently fail if anonymous auth is disabled
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      
      if (currentUser && !currentUser.isAnonymous) {
         const isAdmin = currentUser.email === 'bhandari.devichand9@gmail.com';
         const identifier = currentUser.email ? currentUser.email.split('@')[0] : 'User';
         
         setUser(prev => {
            if (prev?.uid === currentUser.uid) return prev;
            if (prev?.role === 'admin') return prev;

            return { 
                uid: currentUser.uid, 
                email: identifier, 
                name: currentUser.displayName || localStorage.getItem('arihant_user_name') || fullName || (isAdmin ? 'Admin' : 'Customer'), 
                role: isAdmin ? 'admin' : 'customer' 
            };
         });
         
         if (view === 'auth' || view === 'landing') {
            setView(isAdmin ? 'admin-dash' : 'shop');
         }
      } else if (!currentUser || currentUser.isAnonymous) {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []); 

  useEffect(() => {
    if (!db || !firebaseUser) return;
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (prods.length > 0) setProducts(prods);
      else setProducts(INITIAL_PRODUCTS);
    }, (error) => {
      if (products.length === 0) setProducts(INITIAL_PRODUCTS);
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!db || !firebaseUser) return;
    const docRef = doc(db, 'settings', 'store');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsShopOpen(docSnap.data().isOpen);
      }
    }, (error) => {});
    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!db || !firebaseUser || !user || user.role !== 'admin') return;
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Admin order fetch error", error));
    return () => unsubscribe();
  }, [user, firebaseUser]);

  useEffect(() => {
    if (!db || !firebaseUser || !user || user.role !== 'customer') return;
    const q = collection(db, 'orders');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const myUserOrders = allOrders.filter(o => o.userId === user.uid).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
      setMyOrders(myUserOrders);
    }, (error) => console.error("Customer order fetch error", error));
    return () => unsubscribe();
  }, [user, firebaseUser]);

  // --- Actions ---

  const handleGuestLogin = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      await signInAnonymously(auth);
      setView('shop');
    } catch (err) {
      alert("Guest browsing not enabled in Firebase. Please Login.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if ((phoneNumber.toLowerCase() === 'devichand' || phoneNumber === 'bhandari.devichand9@gmail.com') && password === 'Yashraj@123') {
      try {
        await signInWithEmailAndPassword(auth, 'bhandari.devichand9@gmail.com', 'Yashraj@123');
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
           setAuthError("Setup Error: Create 'bhandari.devichand9@gmail.com' in Firebase Console.");
        } else {
           setAuthError("Login failed: " + err.code);
        }
      }
    } else {
      setAuthError("Invalid Admin Credentials");
    }
  };

  const handleCustomerAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setAuthError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    if (!auth) { setAuthError("Backend not connected."); return; }

    const fakeEmail = `${cleanPhone}@arihant.store`;

    try {
      if (isSignup) {
        if (!fullName) { setAuthError("Name is required for signup."); return; }
        localStorage.setItem('arihant_user_name', fullName);
        await createUserWithEmailAndPassword(auth, fakeEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, fakeEmail, password);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setAuthError("Number already registered. Please login.");
      } else if (err.code === 'auth/invalid-credential') {
        setAuthError("Invalid mobile number or password.");
      } else {
        setAuthError(err.message.replace('Firebase: ', ''));
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!phoneNumber) {
       setAuthError("Enter your registered mobile number or email.");
       return;
    }

    if (phoneNumber === 'bhandari.devichand9@gmail.com') {
      try {
        await sendPasswordResetEmail(auth, 'bhandari.devichand9@gmail.com');
        alert("Password reset link sent to bhandari.devichand9@gmail.com");
        setResetSent(true);
        return;
      } catch (e) {
        console.error(e);
        setAuthError("Failed to send reset email: " + e.message);
        return;
      }
    }
    
    const fakeEmail = `${phoneNumber.replace(/\D/g, '')}@arihant.store`;
    setResetSent(true); 
  };

  const handleLogout = async () => {
    if (auth) {
        try {
            await signOut(auth);
        } catch(e) { console.error(e); }
    }
    setUser(null);
    localStorage.removeItem('arihant_user_name');
    setView('landing');
    setCart([]);
    setPhoneNumber('');
    setPassword('');
    setResetSent(false);
  };

  const toggleShopStatus = async () => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'settings', 'store'), { isOpen: !isShopOpen });
      setIsShopOpen(!isShopOpen);
    } catch (e) {
      alert("Failed to update status. Only Admins can do this.");
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (e) {
      alert("Failed to update order status");
    }
  };

  const deleteProduct = async (productId) => {
    if (!db) return;
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (e) {
        alert("Failed to delete product");
      }
    }
  };

  const addToCart = (product, variantDetails = null, e) => {
    if (e) e.stopPropagation();
    if (!user) { 
      alert("Please Login to add items to cart.");
      setAuthSection('customer');
      setView('auth'); 
      return; 
    }

    const finalPrice = variantDetails ? variantDetails.price : product.price;
    const finalUnit = variantDetails ? variantDetails.label : product.unit;
    const cartId = variantDetails ? `${product.id}-${finalUnit}` : product.id;

    setCart(prev => {
      const existing = prev.find(item => item.cartId === cartId);
      if (existing) {
        return prev.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, cartId, price: finalPrice, unit: finalUnit, quantity: 1 }];
    });
    if(!isCartOpen) setIsCartOpen(true);
  };

  const updateQuantity = (cartId, delta, e) => {
    if (e) e.stopPropagation();
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const placeOrder = async (orderDetails, type) => {
    if (!db || !firebaseUser) { alert("Connecting... try again."); return; }
    
    const uid = user?.uid || firebaseUser?.uid;
    if (!uid) { alert("User not identified. Please login again."); return; }

    const shortId = Math.floor(100000 + Math.random() * 900000).toString(); 
    
    const newOrder = {
      shortId: shortId, 
      name: orderDetails.name,
      phone: orderDetails.phone,
      address: orderDetails.address || '',
      items: cart, 
      total: cartTotal,
      userId: uid, 
      orderType: type, 
      status: 'Pending', 
      timestamp: new Date().toISOString()
    };

    setLastOrderData(newOrder); 

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      setCart([]); 
      setView('success');
    } catch (err) { 
      console.error(err);
      if (err.code === 'permission-denied') {
        alert("Permission Denied: Please check your Firestore Security Rules in Firebase Console.");
      } else {
        alert("Failed to place order: " + err.message);
      }
    }
  };

  const saveProduct = async (productData, isEdit = false, id = null) => {
    if (!db || !firebaseUser) return;
    try {
      const data = {
        name: productData.name,
        price: Number(productData.price),
        category: productData.category,
        stock: Number(productData.stock),
        unit: productData.unit,
        image: productData.image,
        description: productData.description || ''
      };

      if (isEdit && id) {
        await updateDoc(doc(db, 'products', id), data);
        alert("Product Updated Successfully!");
      } else {
        await addDoc(collection(db, 'products'), data);
        alert("Product Added Successfully!");
      }
    } catch (e) { 
      console.error(e); 
      alert("Failed to save product"); 
    }
  };

  // --- Computed ---
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const filteredProducts = useMemo(() => products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (selectedCategory === "All" || p.category === selectedCategory)
  ), [products, searchTerm, selectedCategory]);

  // --- Main Render ---
  if (loading) return <div className="min-h-screen flex items-center justify-center text-orange-600"><Loader className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {view === 'landing' && <LandingView onLoginClick={() => { setAuthSection('customer'); setView('auth'); }} onGuestClick={handleGuestLogin} />}

      {view === 'product-detail' && <ProductDetailView selectedProduct={selectedProduct} onClose={() => setView('shop')} addToCart={addToCart} user={user} setView={setView} />}
      
      {view === 'checkout' && <CheckoutView user={user} cart={cart} onClose={() => setView('shop')} placeOrder={placeOrder} cartTotal={cartTotal} />}
      
      {view === 'success' && lastOrderData && <SuccessView successData={lastOrderData} onClose={() => setView('shop')} />}
      
      {view === 'auth' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => { setView(user ? 'shop' : 'landing'); setAuthSection('customer'); setPhoneNumber(''); setPassword(''); setResetSent(false); }} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{authSection === 'customer' ? 'Customer Access' : 'Admin Login'}</h2>
              <p className="text-slate-500 text-sm mt-1">{authSection === 'customer' ? 'Login with mobile number to order' : 'Restricted access'}</p>
            </div>

            {authSection === 'customer' ? (
              <form onSubmit={handleCustomerAuth} className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                  <button type="button" onClick={() => { setIsSignup(false); setAuthError(''); setResetSent(false); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${!isSignup ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>Login</button>
                  <button type="button" onClick={() => { setIsSignup(true); setAuthError(''); setResetSent(false); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${isSignup ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}>Create Account</button>
                </div>

                {isSignup && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-orange-500" placeholder="Enter your name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number</label>
                  <div className="flex">
                    <span className="p-4 bg-slate-100 rounded-l-xl border border-r-0 border-slate-200 text-slate-500 font-bold">+91</span>
                    <input type="tel" className="w-full p-4 bg-slate-50 rounded-r-xl border border-slate-200 outline-none focus:border-orange-500" placeholder="98XXXXXXXX" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} maxLength={10} required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-orange-500" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  </div>
                </div>

                {authError && <p className="text-red-500 text-xs text-center bg-red-50 p-2 rounded-lg font-medium">{authError}</p>}
                
                {resetSent ? (
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                     <p className="font-bold mb-1">Password Reset Instructions:</p>
                     <p>For security, please contact the store owner at <strong>{STORE_INFO.phone}</strong> to verify your identity and reset your password manually.</p>
                   </div>
                ) : (
                   <div className="flex items-center justify-end">
                      <button type="button" onClick={handleForgotPassword} className="text-xs text-orange-600 font-bold hover:underline">Forgot Password?</button>
                   </div>
                )}

                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors">{isSignup ? 'Create Account' : 'Login'}</button>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input type="text" placeholder="Username" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-orange-500" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-orange-500" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
                {authError && <p className="text-red-500 text-xs text-center bg-red-50 p-2 rounded-lg font-medium">{authError}</p>}
                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors">Login as Admin</button>
                
                {!resetSent ? (
                   <div className="text-center mt-2">
                      <button type="button" onClick={handleForgotPassword} className="text-xs text-orange-600 font-bold hover:underline">Forgot Admin Password?</button>
                   </div>
                ) : (
                   <p className="text-xs text-green-600 text-center mt-2">Reset link sent to registered email.</p>
                )}
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button 
                onClick={() => { setAuthSection(authSection === 'customer' ? 'admin' : 'customer'); setAuthError(''); setPhoneNumber(''); setPassword(''); setResetSent(false); }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto"
              >
                {authSection === 'customer' ? <><KeyRound size={12} /> Admin Login</> : <><Smartphone size={12} /> Customer Login</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {(view === 'shop' || view === 'admin-dash' || view === 'profile') && (
        <>
          <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3" onClick={() => setView('landing')}>
                <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg"><Store size={24} /></div>
                <div><h1 className="font-black text-xl tracking-tight leading-none text-slate-900">Arihant</h1><p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Provision Store</p></div>
              </div>
              <div className="hidden md:block flex-1 max-w-md mx-8"><div className="relative group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search products..." className="w-full bg-slate-100 rounded-full py-2.5 pl-10 pr-4 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 pr-4 cursor-pointer" onClick={() => setView(user.role === 'admin' ? 'admin-dash' : 'profile')}>
                    <div className="bg-white p-1.5 rounded-full shadow-sm text-orange-600 font-bold w-8 h-8 flex items-center justify-center">{user.name[0]}</div>
                    <span className="text-xs font-bold hover:text-orange-600">{user.role === 'admin' ? 'Admin' : 'Profile'}</span>
                  </div>
                ) : <button onClick={() => { setAuthSection('customer'); setView('auth'); }} className="text-sm font-bold text-slate-600 hover:text-orange-600 px-3 py-2">Login</button>}
                <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 bg-slate-900 text-white rounded-full hover:bg-orange-600 transition-all shadow-lg"><ShoppingBag size={20} />{cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white animate-bounce">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}</button>
              </div>
            </div>
          </nav>

          {!isShopOpen && user?.role !== 'admin' && (
            <div className="bg-red-500 text-white text-center py-2 px-4 font-bold text-sm">
              Current Status: Shop is closed. We are not accepting new orders at this moment.
            </div>
          )}

          {view === 'admin-dash' ? (
            <AdminPanel 
              toggleShopStatus={toggleShopStatus}
              isShopOpen={isShopOpen}
              handleLogout={handleLogout}
              orders={orders}
              updateOrderStatus={updateOrderStatus}
              products={products}
              saveProduct={saveProduct}
              deleteProduct={deleteProduct}
            />
          ) : view === 'profile' ? (
            <CustomerProfile 
              user={user}
              myOrders={myOrders}
              onLogout={handleLogout}
              onClose={() => setView('shop')}
            />
          ) : (
            <main className="max-w-7xl mx-auto px-4 py-6">
              <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide no-scrollbar">{CATEGORIES.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${selectedCategory === cat ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200"}`}>{cat}</button>)}</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => <ProductCard key={product.id} product={product} onClick={(p) => { setSelectedProduct(p); setView('product-detail'); }} />)}
              </div>
              {filteredProducts.length === 0 && <div className="text-center py-20"><Search className="text-slate-400 w-12 h-12 mx-auto mb-4" /><h3 className="text-xl font-bold">No items found</h3></div>}
            </main>
          )}

          {isCartOpen && (
            <div className="fixed inset-0 z-50 overflow-hidden">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
              <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                  <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag className="text-orange-600" /> My Basket</h2>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400"><ShoppingBag size={64} className="mb-4 opacity-10" /><p className="font-bold">Basket is empty</p></div>
                  ) : (
                    cart.map(item => (
                      <div key={item.cartId} className="flex gap-4 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <img src={item.image} className="w-16 h-16 object-cover rounded-lg bg-slate-100" />
                        <div className="flex-1">
                          <div className="flex justify-between"><h4 className="font-bold text-sm line-clamp-1">{item.name}</h4><span className="font-bold text-sm">₹{item.price * item.quantity}</span></div>
                          <p className="text-xs text-slate-500 mb-2">{item.unit}</p>
                          <div className="flex items-center gap-3">
                             <div className="flex items-center bg-orange-50 border border-orange-100 rounded-lg">
                               <button onClick={() => updateQuantity(item.cartId, -1)} className="px-2 py-1 text-orange-700"><Minus size={12} /></button>
                               <span className="text-xs font-bold w-6 text-center text-orange-700">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.cartId, 1)} className="px-2 py-1 text-orange-700"><Plus size={12} /></button>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex justify-between font-bold text-xl mb-4 text-orange-800"><span>Total</span><span>₹{cartTotal}</span></div>
                    {isShopOpen ? (
                      <button onClick={() => { setIsCartOpen(false); setView('checkout'); }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">Proceed to Checkout <ChevronRight size={16} /></button>
                    ) : (
                       <button disabled className="w-full bg-slate-300 text-slate-500 py-4 rounded-xl font-bold cursor-not-allowed">Shop Closed</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
