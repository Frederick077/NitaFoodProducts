import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { cartKey } from '../context/cartState';
import { formatTZS } from '../utils';
import SafeImage from '../components/SafeImage';
export default function Cart() {
  const cart = useCart();
  const [error,setError] = useState(''), [success,setSuccess] = useState(''), [busy,setBusy] = useState(false);
  const change = (key: string, quantity: number) => { try { cart.updateQuantity(key,quantity); setError(''); } catch(e) { setError((e as Error).message); } };
  return <div className="max-w-5xl mx-auto px-4 py-16 space-y-6"><h1 className="text-3xl font-bold text-emerald-950">Checkout</h1>
    {success && <p role="status" className="p-4 bg-emerald-100 rounded-xl">Thank you! Your order {success} has been received.</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!cart.cartItems.length ? <p>Your cart is empty.</p> : <>
      <div className="space-y-4">{cart.cartItems.map(item => <div key={cartKey(item)} className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl border border-emerald-100">
        <SafeImage src={item.imageUrl} alt={item.productName} className="w-20 h-20 object-cover rounded-xl" />
        <div className="flex-1"><Link to={`/products/${item.productId}`} className="font-bold">{item.productName}</Link><p>{item.variantName?.trim() || 'Standard'}</p><p>{formatTZS(item.unitPrice)} each</p></div>
        <label>Quantity <input aria-label={`Quantity for ${item.productName} ${item.variantName?.trim() || 'Standard'}`} type="number" min="1" max={item.stock} disabled={busy} value={item.quantity} onChange={e=>change(cartKey(item),Number(e.target.value))} className="w-20 border rounded-lg p-2" /></label>
        <strong>{formatTZS(Math.round(item.unitPrice*100)*item.quantity/100)}</strong><button disabled={busy} onClick={()=>cart.removeItem(cartKey(item))} className="text-red-700">Remove</button>
      </div>)}</div>
      <p className="text-xl font-bold">Subtotal: {formatTZS(cart.subtotal)} · Total: {formatTZS(cart.subtotal)}</p>
      <form className="bg-white p-6 rounded-2xl space-y-4" onSubmit={async e => {
        e.preventDefault(); if(busy) return; const data = new FormData(e.currentTarget); setBusy(true); setError('');
        try {
          const response = await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerName:data.get('customerName'),phone:data.get('phone'),email:data.get('email'),address:data.get('address'),notes:data.get('notes'),items:cart.cartItems.map(({productId,variantId,quantity})=>({productId,variantId,quantity}))})});
          const result = await response.json(); if(!response.ok) throw new Error(result.error || 'Order could not be saved.');
          setSuccess(result.orderNumber || result.id); cart.clearCart();
        } catch(e) { setError(e instanceof Error ? e.message : 'Order could not be saved.'); } finally { setBusy(false); }
      }}><h2 className="text-xl font-bold">Checkout</h2>
        {(['customerName','phone','email','address'] as const).map(name=><label key={name} className="block">{{customerName:'Name',phone:'Phone',email:'Email (optional)',address:'Delivery address (optional)'}[name]}<input name={name} type={name==='email'?'email':name==='phone'?'tel':'text'} required={name==='customerName'||name==='phone'} maxLength={2000} disabled={busy} className="block w-full border rounded-lg p-2" /></label>)}
        <label className="block">Notes (optional)<textarea name="notes" maxLength={2000} disabled={busy} className="block w-full border rounded-lg p-2" /></label>
        <button disabled={busy} className="bg-emerald-700 text-white px-6 py-3 rounded-xl disabled:opacity-50">{busy?'Placing order…':'Place order'}</button>
      </form></>}
    <Link className="inline-block font-bold text-emerald-800" to="/products">Continue shopping</Link>
  </div>;
}
