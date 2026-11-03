import type { PriceChange } from '../types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { cartKey } from '../context/cartState';
import { formatTZS } from '../utils';
import SafeImage from '../components/SafeImage';
export default function Cart() {
  const cart = useCart();
  const [error,setError] = useState(''), [success,setSuccess] = useState(''), [busy,setBusy] = useState(false);
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const change = (key: string, quantity: number) => { try { setPriceChanges([]); cart.updateQuantity(key,quantity); setError(''); } catch(e) { setError((e as Error).message); } };
  return <div className="nita-page nita-checkout nita-page-inner" id="checkout-page"><h1 className="text-3xl font-bold text-emerald-950">Checkout</h1>
    {success && <p role="status" className="p-4 bg-emerald-100 rounded-xl">Thank you! Your order {success} has been received for review. NITA will verify availability before confirming.</p>}
    {priceChanges.length > 0 && <div role="alert" className="border p-4 space-y-3"><p>Prices have changed. Your cart total has not been changed yet.</p><ul>{priceChanges.map(c => <li key={cartKey(c)}>{cart.cartItems.find(i => cartKey(i) === cartKey(c))?.productName}: {formatTZS(c.previousPrice)} to {formatTZS(c.currentPrice)} each</li>)}</ul><button className="nita-contact-action" onClick={() => { try { cart.acceptPrices(priceChanges); setPriceChanges([]); setError('Updated prices accepted. Review the total and place your order again.'); } catch(e) { setError((e as Error).message); setPriceChanges([]); } }}>Accept updated prices</button></div>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!cart.cartItems.length ? <p>Your cart is empty.</p> : <>
      <div className="nita-checkout-items">{cart.cartItems.map(item => <div key={cartKey(item)} className="nita-checkout-item">
        <SafeImage src={item.imageUrl} alt={item.productName} className="nita-checkout-photo" />
        <div className="flex-1"><Link to={`/products/${item.productId}`} className="font-bold">{item.productName}</Link><p>{item.variantName?.trim() || 'Standard'}</p><p>{formatTZS(item.unitPrice)} each</p></div>
        <label>Quantity <input aria-label={`Quantity for ${item.productName} ${item.variantName?.trim() || 'Standard'}`} type="number" min="1" max={100000} disabled={busy} value={item.quantity} onChange={e=>change(cartKey(item),Number(e.target.value))} className="w-20 border rounded-lg p-2" /></label>
        <strong>{formatTZS(Math.round(item.unitPrice*100)*item.quantity/100)}</strong><button disabled={busy} onClick={()=>{ setPriceChanges([]); cart.removeItem(cartKey(item)); }} className="text-red-700">Remove</button>
      </div>)}</div>
      <p className="text-xl font-bold">Subtotal: {formatTZS(cart.subtotal)} · Total: {formatTZS(cart.subtotal)}</p>
      <form className="nita-checkout-form" onSubmit={async e => {
        e.preventDefault(); if(busy || priceChanges.length) return; const data = new FormData(e.currentTarget); setBusy(true); setError('');
        try {
          const response = await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerName:data.get('customerName'),phone:data.get('phone'),email:data.get('email'),address:data.get('address'),notes:data.get('notes'),items:cart.cartItems.map(({productId,variantId,quantity,unitPrice})=>({productId,variantId,quantity,expectedUnitPrice:unitPrice}))})});
          const result = await response.json(); if(response.status === 409 && Array.isArray(result.priceChanges)) setPriceChanges(result.priceChanges); if(!response.ok) throw new Error(result.error || 'Order could not be saved.');
          setSuccess(result.orderNumber || result.id); cart.clearCart();
        } catch(e) { setError(e instanceof Error ? e.message : 'Order could not be saved.'); } finally { setBusy(false); }
      }}><h2 className="text-xl font-bold">Your details</h2><p>Submitting sends an order request. NITA will verify availability before confirming.</p>
        {(['customerName','phone','email','address'] as const).map(name=><label key={name} className="block">{{customerName:'Name',phone:'Phone',email:'Email (optional)',address:'Delivery address (optional)'}[name]}<input name={name} type={name==='email'?'email':name==='phone'?'tel':'text'} required={name==='customerName'||name==='phone'} maxLength={2000} disabled={busy} className="block w-full border rounded-lg p-2" /></label>)}
        <label className="block">Notes (optional)<textarea name="notes" maxLength={2000} disabled={busy} className="block w-full border rounded-lg p-2" /></label>
        <button disabled={busy || !!priceChanges.length} className="bg-emerald-700 text-white px-6 py-3 rounded-xl disabled:opacity-50">{busy?'Placing order…':'Place order'}</button>
      </form></>}
    <Link className="inline-block font-bold text-emerald-800" to="/products">Continue shopping</Link>
  </div>;
}
