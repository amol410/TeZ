import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import api from '../api/axios';
import { ShoppingCart, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function CartPage() {
  const { cart, cartTotal, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (user?.kycStatus !== 'APPROVED') {
      toast.error('KYC not approved. Please complete KYC on the mobile app before checking out.');
      return;
    }
    setCheckingOut(true);
    
    try {
      const courseIds = cart.map(c => c.id);
      const { data } = await api.post('/courses/checkout', { courseIds });
      
      if (data.success) {
        toast.success('Enrollment successful!');
        clearCart();
        navigate('/courses/my');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fade-in text-center">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Your cart is empty</h2>
        <p className="text-gray-400 mb-8">Keep exploring to find a course you'd like to learn.</p>
        <button onClick={() => navigate('/courses')} className="btn-primary inline-flex">
          Browse Courses
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-3xl font-black text-white mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-sm font-semibold text-gray-400 mb-2 border-b border-white/10 pb-2">
            {cart.length} Course{cart.length > 1 ? 's' : ''} in Cart
          </div>
          
          {cart.map((course) => (
            <div key={course.id} className="glass-card p-4 flex gap-4 border border-white/5">
              <div 
                className="w-32 h-24 bg-gray-800 rounded-lg flex-shrink-0 bg-cover bg-center cursor-pointer"
                style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : {}}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                {!course.thumbnailUrl && (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-700" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white cursor-pointer hover:text-indigo-400" onClick={() => navigate(`/courses/${course.id}`)}>
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-sm">By {course.instructorName}</p>
                </div>
                
                <div className="flex items-center gap-4 text-sm font-medium">
                  <button onClick={() => removeFromCart(course.id)} className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-indigo-400">
                  ₹{Number(course.price).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 border border-white/10 sticky top-28">
            <h2 className="text-xl font-bold text-white mb-6">Total:</h2>
            <div className="text-4xl font-black text-white mb-6">
              ₹{cartTotal.toFixed(2)}
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="btn-primary w-full flex justify-center py-4 text-lg mb-4"
            >
              {checkingOut ? 'Processing...' : 'Checkout'}
            </button>
            
            <p className="text-center text-xs text-gray-500">
              By completing your purchase you agree to our Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
