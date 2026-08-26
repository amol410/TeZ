import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('lms_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('lms_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (course) => {
    setCart(prev => {
      if (prev.find(c => c.id === course.id)) return prev;
      return [...prev, course];
    });
  };

  const removeFromCart = (courseId) => {
    setCart(prev => prev.filter(c => c.id !== courseId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, course) => total + Number(course.price || 0), 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      cartCount: cart.length
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
