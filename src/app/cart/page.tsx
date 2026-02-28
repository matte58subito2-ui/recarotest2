'use client';

import { useCartStore } from '@/store/useCartStore';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
    const { items, removeItem, clearCart, updateQuantity } = useCartStore();
    const [saving, setSaving] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
    const router = useRouter();

    const hasMediaPartnership = items.some(item => item.partnershipLevel === 'Logo e Media');

    const total = items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);

    const handleCheckout = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCart: true, items, totalPrice: total })
            });
            const result = await res.json();
            if (res.ok) {
                setOrderSuccess(true);
                clearCart();
                setTimeout(() => {
                    router.push(`/order/${result.id}/confirmation`);
                }, 2500);
            } else {
                alert(result.error);
                setSaving(false);
            }
        } catch {
            alert("Errore nell'elaborazione dell'ordine.");
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-500 selection:text-white">
            <Navbar />
            <div className="container max-w-5xl mx-auto py-20 px-4">
                <h1 className="text-4xl font-semibold tracking-tighter mb-10" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>
                    Il Tuo Carrello
                </h1>

                {items.length === 0 ? (
                    <div className="text-zinc-500 py-10">
                        <p className="mb-6">Il carrello è vuoto. Configura un sedile per iniziare.</p>
                        <Link href="/catalog" className="px-6 py-3 bg-white text-black font-bold uppercase tracking-wider text-sm rounded hover:bg-zinc-200">
                            Vai al Catalogo
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {items.map((item) => {
                            const qty = item.quantity ?? 1;
                            const lineTotal = item.price * qty;
                            return (
                                <div key={item.id} className="bg-zinc-900 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="absolute top-4 right-4 text-zinc-500 hover:text-red-500 transition-colors"
                                        title="Rimuovi"
                                    >
                                        ✕
                                    </button>

                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">{item.categoryId}</div>
                                        <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-rajdhani)' }}>{item.productName}</h2>

                                        <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
                                            <div><span className="text-white">Materiale:</span> {item.material || 'N/A'}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white">Colore:</span>
                                                <span className="w-4 h-4 rounded-full border border-white/20 inline-block" style={{ backgroundColor: item.colorHex }}></span>
                                            </div>
                                            {item.heating && <div><span className="text-white">Optional:</span> Riscaldamento Interno</div>}
                                            {item.accessories && item.accessories.length > 0 && (
                                                <div className="col-span-2">
                                                    <span className="text-white">Accessori:</span> {item.accessories.join(', ')}
                                                </div>
                                            )}
                                        </div>

                                        {item.logoBlob && (
                                            <div className="mt-4 p-4 bg-black/50 rounded-xl border border-white/5 flex items-center gap-4">
                                                <div className="w-16 h-16 relative">
                                                    <Image src={item.logoBlob} alt="Logo" fill style={{ objectFit: 'contain' }} />
                                                </div>
                                                <div>
                                                    <div className="text-white font-semibold text-sm">Logo Personalizzato</div>
                                                    <div className="text-xs text-zinc-500">Posizione: {item.logoPosition}</div>
                                                </div>
                                            </div>
                                        )}

                                        {item.partnershipLevel && item.partnershipLevel !== 'Nessuna' && (
                                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                                                <div className="text-[10px] font-black text-red-500 uppercase tracking-widest">{item.partnershipLevel} (-{(item.discountRate! * 100)}%)</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity & Price */}
                                    <div className="flex flex-col justify-between items-end shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 min-w-[160px]">
                                        {/* Quantity Selector */}
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Quantità</div>
                                            <div className="flex items-center gap-3 bg-zinc-800 border border-white/10 rounded-xl px-3 py-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, qty - 1)}
                                                    disabled={qty <= 1}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white font-bold text-lg hover:bg-zinc-700 transition-colors disabled:opacity-30"
                                                >
                                                    −
                                                </button>
                                                <span className="text-white font-bold text-lg w-8 text-center">{qty}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, qty + 1)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white font-bold text-lg hover:bg-zinc-700 transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Line Total */}
                                        <div className="text-right mt-4">
                                            {qty > 1 && (
                                                <div className="text-xs text-zinc-500 mb-1">
                                                    € {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} × {qty}
                                                </div>
                                            )}
                                            <div className="text-2xl font-bold tracking-tighter">
                                                € {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="mt-8 p-8 bg-zinc-950 border border-white/20 rounded-2xl flex flex-col items-end">
                            <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-2">Totale Ordine</div>
                            <div className="text-4xl font-bold tracking-tighter text-red-500 mb-6">
                                € {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={clearCart} className="px-6 py-4 rounded-xl border border-white/20 font-bold uppercase tracking-wider text-sm hover:bg-white/10 transition-colors">
                                    Svuota Carrello
                                </button>
                                <button
                                    onClick={handleCheckout}
                                    disabled={saving || items.length === 0}
                                    className="px-8 py-4 rounded-xl bg-red-600 font-bold uppercase tracking-wider text-sm hover:bg-red-700 transition-colors text-white shadow-lg shadow-red-600/20 disabled:opacity-50"
                                >
                                    {saving ? 'Elaborazione...' : "Procedi all'Ordine"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Overlay */}
            {orderSuccess && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md transition-opacity duration-500 animate-in fade-in">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.4)] animate-bounce">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tighter text-white mb-4 uppercase" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                        Ordine Ricevuto
                    </h2>
                    <p className="text-zinc-400 text-lg font-medium">
                        Reindirizzamento al riepilogo in corso...
                    </p>
                </div>
            )}
        </div>
    );
}
