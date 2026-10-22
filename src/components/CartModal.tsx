import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { cartKey } from '../context/cartState';
import { formatTZS } from '../utils';
import SafeImage from './SafeImage';

export default function CartModal() {
  const { isCartOpen } = useCart();
  return isCartOpen ? <OpenCartModal /> : null;
}

function OpenCartModal() {
  const { cartItems, itemCount, subtotal, updateQuantity, removeItem, closeCart } = useCart();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollX = window.scrollX, scrollY = window.scrollY;
    const body = document.body;
    const originalStyle = body.getAttribute('style');
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const paddingRight = parseFloat(getComputedStyle(body).paddingRight) || 0;
    Object.assign(body.style, {
      position: 'fixed', top: `-${scrollY}px`, left: `-${scrollX}px`, width: '100%',
      overflow: 'hidden', paddingRight: `${paddingRight + scrollbarWidth}px`,
    });
    dialog.showModal();
    return () => {
      dialog.close();
      if (originalStyle === null) body.removeAttribute('style');
      else body.setAttribute('style', originalStyle);
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const changeQuantity = (key: string, quantity: number) => {
    try { updateQuantity(key, quantity); setError(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update quantity.'); }
  };

  return (
    <dialog ref={dialogRef} aria-labelledby="cart-modal-title" aria-modal="true" className="nita-cart-dialog"
      onCancel={event => { event.preventDefault(); closeCart(); }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = Array.from<HTMLElement>((dialogRef.current as HTMLDialogElement).querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeCart();
      }}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <ShoppingBag aria-hidden="true" className="h-6 w-6 text-emerald-700" />
          <div><h2 id="cart-modal-title" className="text-lg font-bold text-emerald-950">Shopping Cart</h2>
            <p className="text-xs text-gray-500" aria-live="polite">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
          </div>
        </div>
        <button type="button" autoFocus onClick={closeCart} aria-label="Close shopping cart" className="rounded-full p-2.5 text-gray-500 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-700"><X className="h-5 w-5" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6">
        {error && <p role="alert" className="pt-4 text-sm text-red-700">{error}</p>}
        {cartItems.length ? <ul className="divide-y divide-emerald-100">
          {cartItems.map(item => <li key={cartKey(item)} className="py-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <SafeImage src={item.imageUrl} alt={item.productName} className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-bold text-emerald-950">{item.productName}</p>
                <p className="mt-1 break-words text-xs text-gray-500">{item.variantName?.trim() || 'Standard'}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-800">{formatTZS(item.unitPrice)} each</p>
              </div>
              <button type="button" aria-label={`Remove ${item.productName}, ${item.variantName?.trim() || 'Standard'}`} onClick={() => { removeItem(cartKey(item)); setError(''); }} className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-orange-50 hover:text-orange-700"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center rounded-xl border border-emerald-100">
                <button type="button" aria-label={`Decrease quantity for ${item.productName}, ${item.variantName?.trim() || 'Standard'}`} disabled={item.quantity <= 1} onClick={() => changeQuantity(cartKey(item), item.quantity - 1)} className="rounded-l-xl p-3 text-emerald-800 hover:bg-emerald-50 disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                <span className="min-w-8 text-center text-sm font-bold text-emerald-950" aria-label="Quantity">{item.quantity}</span>
                <button type="button" aria-label={`Increase quantity for ${item.productName}, ${item.variantName?.trim() || 'Standard'}`} disabled={item.quantity >= item.stock} onClick={() => changeQuantity(cartKey(item), item.quantity + 1)} className="rounded-r-xl p-3 text-emerald-800 hover:bg-emerald-50 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
              </div>
              <p className="text-xs text-gray-500">Subtotal: <strong className="text-emerald-950">{formatTZS(Math.round(item.unitPrice * 100) * item.quantity / 100)}</strong></p>
            </div>
          </li>)}
        </ul> : <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"><ShoppingBag className="h-8 w-8 text-emerald-700" /></div>
          <h3 className="font-bold text-emerald-950">Your cart is empty</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-gray-500">Discover your favourite NITA products and add them to your cart.</p>
        </div>}
      </div>

      <footer className="shrink-0 border-t border-emerald-100 bg-emerald-50/40 px-5 py-4 sm:px-6">
        {!!cartItems.length && <div className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatTZS(subtotal)}</span></div>
          <div className="flex justify-between font-bold text-emerald-950"><span>Total</span><span>{formatTZS(subtotal)}</span></div>
        </div>}
        <div className={`grid gap-3 ${cartItems.length ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button type="button" onClick={closeCart} className="rounded-xl border border-emerald-200 bg-white px-3 py-3 text-xs font-bold text-emerald-800 hover:bg-emerald-50">CONTINUE SHOPPING</button>
          {!!cartItems.length && <Link to="/checkout" onClick={closeCart} className="flex items-center justify-center rounded-xl bg-emerald-700 px-3 py-3 text-xs font-bold text-white hover:bg-emerald-800">CHECKOUT</Link>}
        </div>
      </footer>
    </dialog>
  );
}
