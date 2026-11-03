import { variantLabel } from '../variantLabel';
import { useEffect, useRef, useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { formatTZS } from '../utils';
export default function OrderModal({product,initialVariantId,onClose}:{product:Product;initialVariantId?:string;onClose:()=>void}) {
  const {addItem,openCart}=useCart(); const [variantId,setVariantId]=useState(initialVariantId || product.variants.find(v=>v.available&&Number.isFinite(v.price)&&v.price>=0)?.id || ''); const [quantity,setQuantity]=useState(1); const [feedback,setFeedback]=useState('');
  const variant=product.variants.find(v=>v.id===variantId);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="nita-order-dialog" role="dialog" aria-modal="true" aria-label="Add product to cart" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="nita-order-dialog-content">
    <button onClick={onClose} className="float-right" aria-label="Close">✕</button><h2 className="text-xl font-bold">{product.name}</h2>
    <label className="block">Variant<select className="block border rounded-lg p-2 w-full" value={variantId} onChange={e=>{setVariantId(e.target.value);setQuantity(1);}}>{!variantId&&<option value="">Select variant</option>}{product.variants.map(v=><option key={v.id} value={v.id} disabled={!v.available||!Number.isFinite(v.price)||v.price<0}>{variantLabel(v)} — {Number.isFinite(v.price) && v.price >= 0 ? formatTZS(v.price) : 'Price unavailable'}</option>)}</select></label>
    <label className="block">Quantity<input className="block border rounded-lg p-2" type="number" min={1} max={100000} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label>
    <p role="status">{feedback}</p><button className="bg-emerald-700 text-white rounded-xl px-5 py-3 disabled:opacity-50" disabled={!product.available||!variant?.available||!Number.isFinite(variant.price)||variant.price<0} onClick={()=>{try{addItem(product,variantId,quantity);setFeedback('Added to cart.');}catch(e){setFeedback((e as Error).message);}}}>Add to cart</button>
    <button type="button" onClick={() => { onClose(); openCart(); }} className="inline-block ml-4 text-emerald-800">View cart</button><button onClick={onClose} className="block">Continue shopping</button>
  </div></dialog>;
}
