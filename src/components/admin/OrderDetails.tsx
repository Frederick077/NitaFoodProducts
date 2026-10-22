import { useEffect, useState } from 'react';
import { Order } from '../../types';
import { formatTZS } from '../../utils';
import SafeImage from '../SafeImage';
export default function OrderDetails({id,token,onClose}:{id:string;token:string;onClose:()=>void}) {
  const [order,setOrder]=useState<Order|null>(null),[error,setError]=useState('');
  useEffect(()=>{ const controller=new AbortController(); fetch(`/api/admin/orders/${id}`,{headers:{Authorization:`Bearer ${token}`},signal:controller.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);setOrder(data);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}); return ()=>controller.abort(); },[id,token]);
  const money=(value: number|string|null|undefined)=>value==null?'Unknown (legacy order)':formatTZS(Number(value));
  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}><div role="dialog" aria-modal="true" aria-label="Order details" className="bg-white p-6 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4" onClick={e=>e.stopPropagation()}>
    <button onClick={onClose} className="float-right" aria-label="Close order details">✕</button><h2 className="text-xl font-bold">Order details</h2>
    {error?<p role="alert">{error}</p>:!order?<p>Loading…</p>:<><p className="font-bold break-all">{order.orderNumber||order.id}</p><p>{new Date(order.createdAt).toLocaleString()} · {order.status}</p>
    <div><h3 className="font-bold">Customer</h3><p>{order.customerName}</p><p>{order.phone}</p>{order.email&&<p>{order.email}</p>}{order.address&&<p className="whitespace-pre-wrap">{order.address}</p>}{order.notes&&<p className="whitespace-pre-wrap">Notes: {order.notes}</p>}</div>
    <h3 className="font-bold">Order items</h3>{order.items.map(item=><div key={item.id} className="flex flex-wrap gap-4 border-t py-4"><SafeImage src={item.imageUrl} alt={item.productName} className="w-16 h-16 rounded-xl object-cover"/><div className="flex-1"><strong>{item.productName}</strong><p>{item.variantName?.trim() || 'Standard'}</p><p>Quantity: {item.quantity}</p><p>Unit price: {money(item.unitPrice)}</p><p>Subtotal: {money(item.subtotal)}</p></div></div>)}
    {!order.items.length&&<p>Legacy order awaiting item migration. Product reference: {order.productId}; size: {order.size}; quantity: {order.quantity}.</p>}
    <div className="border-t pt-4"><p>Subtotal: {money(order.subtotal)}</p><strong>Total: {money(order.total)}</strong></div></>}
  </div></div>;
}
