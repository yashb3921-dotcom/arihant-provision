import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, X, Store, Package, CreditCard, 
  Menu, Trash2, User, Settings, LogOut, LayoutDashboard, TrendingUp, 
  Clock, MapPin, Phone, ArrowLeft, Edit, Save, LogIn, Eye, EyeOff,
  ChevronRight, CheckCircle, AlertCircle, Loader, Scale, Truck,
  Lock, Printer
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
// Using hardcoded values to ensure compatibility with the preview environment
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
                  <button onClick={() => setDeliveryType('takeaway')} className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${deliveryType === 'takeaway' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-100 bg-white text-slate-400'}`}><ShoppingBag size={24} /><span className="font-bold text-sm">Takeaway</span></button>
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

export default App;
