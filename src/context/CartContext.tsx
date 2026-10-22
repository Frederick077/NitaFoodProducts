import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { Product } from '../types';
import { CartItem, addCartItem, cartKey, restoreCart, updateCartQuantity } from './cartState';
interface CartValue { isCartOpen: boolean; openCart: () => void; closeCart: () => void; cartItems: CartItem[]; itemCount: number; subtotal: number; addItem: (p: Product, variant: string, quantity: number) => void; removeItem: (key: string) => void; updateQuantity: (key: string, quantity: number) => void; clearCart: () => void; }
const CartContext = createContext<CartValue | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setItems] = useState<CartItem[]>(() => { try { return restoreCart(localStorage.getItem('nita-cart-v1')); } catch { return []; } });
  const [isCartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const current = useRef(cartItems);
  const save = (items: CartItem[]) => { current.current = items; setItems(items); try { localStorage.setItem('nita-cart-v1', JSON.stringify(items)); } catch { /* Cart remains usable when storage is blocked. */ } };
  const value: CartValue = { isCartOpen, openCart, closeCart, cartItems, itemCount: cartItems.reduce((s,i) => s+i.quantity,0), subtotal: cartItems.reduce((s,i) => s+Math.round(i.unitPrice*100)*i.quantity,0)/100, addItem: (p,v,q) => save(addCartItem(current.current,p,v,q)), removeItem: key => save(current.current.filter(i => cartKey(i) !== key)), updateQuantity: (key,q) => save(updateCartQuantity(current.current,key,q)), clearCart: () => save([]) };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const cart = useContext(CartContext); if (!cart) throw new Error('CartProvider is required'); return cart; }
