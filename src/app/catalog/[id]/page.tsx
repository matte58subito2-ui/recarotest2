'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import '@google/model-viewer';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': any;
        }
    }
}

interface SeatData {
    id: number;
    model_name: string;
    category: string;
    description: string;
    base_price: number;
    image_url?: string;
    materials: { id: number; material: string; colors: string; price_delta: number }[];
    accessories: { id: number; name: string; description: string; price: number }[];
}

const COLOR_MAP: Record<string, string> = {
    'Nero': '#111111',
    'Grigio Antracite': '#333333',
    'Grigio': '#7f8c8d',
    'Grigio Melange': '#95a5a6',
    'Rosso Fuoco': '#c0392b',
    'Rosso Sport': '#e74c3c',
    'Marrone Cognac': '#d35400',
    'Beige Sabbia': '#f5deb3',
    'Blu Notte': '#2c3e50',
    'Blu Racing': '#2980b9',
    'Verde Militare': '#556b2f',
    'Bianco Perlato': '#fdfbf7',
    'Arancione Fluo': '#e67e22',
};

const STADIUM_COLORS = [
    { name: 'Rosso Fuoco', hex: '#c0392b', rgb: [0.75, 0.22, 0.17] },
    { name: 'Nero', hex: '#111111', rgb: [0.07, 0.07, 0.07] },
    { name: 'Bianco Perlato', hex: '#fdfbf7', rgb: [0.99, 0.98, 0.97] },
];

export default function ConfiguratorPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [data, setData] = useState<SeatData | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);

    // Selections
    const [material, setMaterial] = useState<{ name: string; price: number } | null>(null);
    const [color, setColor] = useState<string>('');
    const [stadiumColor, setStadiumColor] = useState(STADIUM_COLORS[0]);
    const [heating, setHeating] = useState(false);
    const [accessories, setAccessories] = useState<Record<number, boolean>>({});

    const [saving, setSaving] = useState(false);
    const modelRef = useRef<any>(null);

    // Apply color to the 3D model
    useEffect(() => {
        if (data?.category === 'Stadium' && modelRef.current) {
            const updateColor = async () => {
                if (modelRef.current.model) {
                    const material = modelRef.current.model.materials[0];
                    if (material) {
                        material.pbrMetallicRoughness.setBaseColorFactor([...stadiumColor.rgb, 1]);
                    }
                }
            };
            updateColor();
            modelRef.current.addEventListener('load', updateColor);
            return () => modelRef.current?.removeEventListener('load', updateColor);
        }
    }, [stadiumColor, data]);

    useEffect(() => {
        fetch(`/api/seats/${params.id}`)
            .then(r => r.json())
            .then(d => {
                if (d.error) router.push('/catalog');
                else setData(d);
                setLoading(false);
            });
    }, [params.id, router]);

    if (loading) return <div className="page container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading platform...</div>;
    if (!data) return null;

    const getAvailableColors = () => {
        if (!material) return [];
        const matData = data.materials.find(m => m.material === material.name);
        return matData ? JSON.parse(matData.colors) as string[] : [];
    };

    const calcTotal = () => {
        let t = data.base_price;
        if (material) t += material.price;
        if (heating) t += 150; // Costo fisso riscaldamento
        Object.entries(accessories).forEach(([id, selected]) => {
            if (selected) {
                const acc = data.accessories.find(a => a.id === Number(id));
                if (acc) t += acc.price;
            }
        });
        return t;
    };

    const handleGenerateOrder = async () => {
        setSaving(true);
        const orderData = {
            seatId: data.id,
            seatName: data.model_name,
            category: data.category,
            basePrice: data.base_price,
            material: material?.name,
            materialPriceDelta: material?.price,
            color: data.category === 'Stadium' ? stadiumColor.name : color,
            heating,
            heatingCost: heating ? 150 : 0,
            accessories: Object.entries(accessories)
                .filter(([_, sel]) => sel)
                .map(([id]) => data.accessories.find(a => a.id === Number(id))?.name)
                .filter(Boolean),
            accessoriesTotal: Object.entries(accessories)
                .filter(([_, sel]) => sel)
                .reduce((sum, [id]) => sum + (data.accessories.find(a => a.id === Number(id))?.price || 0), 0),
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            const result = await res.json();
            if (res.ok) {
                router.push(`/order/${result.id}/confirmation`);
            } else {
                alert(result.error);
                setSaving(false);
            }
        } catch {
            alert('Error generating order');
            setSaving(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="container page">
                <div style={{ marginBottom: '32px' }}>
                    <Link href="/catalog" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>← Back to Catalogue</Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        {data.category === 'Stadium' ? (
                            <div style={{ background: '#111', borderRadius: '12px', padding: '0px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '320px', height: '240px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <model-viewer
                                    ref={modelRef}
                                    src="/models/stadium/slitta.glb"
                                    alt="Stadium Seat 3D"
                                    auto-rotate
                                    camera-controls
                                    style={{ width: '100%', height: '100%' }}
                                    shadow-intensity="1"
                                    exposure="1.2"
                                    environment-image="neutral"
                                ></model-viewer>
                            </div>
                        ) : data.image_url && (
                            <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '200px', height: '160px' }}>
                                <Image src={data.image_url} alt={data.model_name} width={160} height={140} style={{ objectFit: 'contain' }} />
                            </div>
                        )}
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div className="badge badge-red" style={{ marginBottom: '8px' }}>{data.category}</div>
                                <h1 style={{ fontSize: '36px' }}>{data.model_name}</h1>
                                <div style={{ color: 'var(--text2)', marginTop: '8px', maxWidth: '500px', lineHeight: 1.5 }}>{data.description}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text3)' }}>Configuration Total</div>
                                <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--red-light)' }}>€ {calcTotal().toLocaleString('en-US')}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid-3">
                    <div style={{ gridColumn: 'span 2' }}>
                        {/* Stepper */}
                        <div className="steps">
                            <div className={`step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`} onClick={() => setStep(1)} style={{ cursor: 'pointer' }}>1. Material</div>
                            <div className={`step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`} onClick={() => material && setStep(2)} style={{ cursor: material ? 'pointer' : 'default' }}>2. Color</div>
                            <div className={`step ${step === 3 ? 'active' : step > 3 ? 'done' : ''}`} onClick={() => (color || data.category === 'Stadium') && setStep(3)} style={{ cursor: (color || data.category === 'Stadium') ? 'pointer' : 'default' }}>3. Options</div>
                            <div className={`step ${step === 4 ? 'active' : step > 4 ? 'done' : ''}`} onClick={() => (color || data.category === 'Stadium') && setStep(4)} style={{ cursor: (color || data.category === 'Stadium') ? 'pointer' : 'default' }}>4. Accessories</div>
                        </div>

                        <div className="card animate-fade" key={step}>
                            {step === 1 && (
                                <div>
                                    <h2 style={{ marginBottom: '24px' }}>Choose Material</h2>
                                    <div className="option-grid">
                                        {data.materials.map(m => (
                                            <div
                                                key={m.id}
                                                className={`option-card ${material?.name === m.material ? 'selected' : ''}`}
                                                onClick={() => { setMaterial({ name: m.material, price: m.price_delta }); setColor(''); setStep(2); }}
                                            >
                                                <div className="icon">🧵</div>
                                                <div className="label">{m.material}</div>
                                                <div className="sublabel">{m.price_delta > 0 ? `+ € ${m.price_delta}` : 'Included'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <h2 style={{ marginBottom: '8px' }}>Choose Color</h2>
                                    <p style={{ color: 'var(--text2)', marginBottom: '24px', fontSize: '14px' }}>Available colors for: {material?.name}</p>
                                    <div className="color-grid">
                                        {data.category === 'Stadium' ? (
                                            STADIUM_COLORS.map(c => (
                                                <div key={c.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div
                                                        className={`color-swatch ${stadiumColor.name === c.name ? 'selected' : ''}`}
                                                        style={{ background: c.hex }}
                                                        title={c.name}
                                                        onClick={() => { setStadiumColor(c); setStep(3); }}
                                                    />
                                                    <div className="color-name">{c.name}</div>
                                                </div>
                                            ))
                                        ) : (
                                            getAvailableColors().map(c => (
                                                <div key={c} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div
                                                        className={`color-swatch ${color === c ? 'selected' : ''}`}
                                                        style={{ background: COLOR_MAP[c] || '#ccc' }}
                                                        title={c}
                                                        onClick={() => { setColor(c); setStep(3); }}
                                                    />
                                                    <div className="color-name">{c}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div>
                                    <h2 style={{ marginBottom: '24px' }}>Internal Heating</h2>
                                    <div className="toggle-wrap card" style={{ padding: '24px' }}>
                                        <div className={`toggle ${heating ? 'on' : ''}`} onClick={() => setHeating(!heating)}>
                                            <div className="toggle-thumb" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '15px' }}>3-Zone Heating</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px' }}>+ € 150.00 — Includes wiring and control panel.</div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '32px', textAlign: 'right' }}>
                                        <button className="btn btn-primary" onClick={() => setStep(4)}>Continue →</button>
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div>
                                    <h2 style={{ marginBottom: '8px' }}>Optional Accessories</h2>
                                    <p style={{ color: 'var(--text2)', marginBottom: '24px', fontSize: '14px' }}>Select compatible accessories for this model.</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {data.accessories.map(a => (
                                            <div
                                                key={a.id}
                                                className={`accessory-item ${accessories[a.id] ? 'selected' : ''}`}
                                                onClick={() => setAccessories({ ...accessories, [a.id]: !accessories[a.id] })}
                                            >
                                                <div className="accessory-checkbox">
                                                    {accessories[a.id] && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{a.description}</div>
                                                </div>
                                                <div style={{ fontWeight: 700, color: 'var(--red-light)' }}>
                                                    + € {a.price.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="summary-box">
                            <h3 style={{ marginBottom: '20px', fontSize: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>Summary</h3>

                            <div className="summary-row">
                                <span style={{ color: 'var(--text2)' }}>Base model</span>
                                <span>€ {data.base_price.toFixed(2)}</span>
                            </div>

                            <div className="summary-row" style={{ opacity: material ? 1 : 0.5 }}>
                                <span style={{ color: 'var(--text2)' }}>Material {material && `(${material.name})`}</span>
                                <span>{material ? `€ ${material.price.toFixed(2)}` : '—'}</span>
                            </div>

                            <div className="summary-row" style={{ opacity: (color || data.category === 'Stadium') ? 1 : 0.5 }}>
                                <span style={{ color: 'var(--text2)' }}>Color</span>
                                <span>{data.category === 'Stadium' ? stadiumColor.name : (color || '—')}</span>
                            </div>

                            {Object.keys(accessories).some(k => accessories[Number(k)]) && (
                                <div className="summary-row">
                                    <span style={{ color: 'var(--text2)' }}>Accessories</span>
                                    <span>€ {Object.entries(accessories).filter(([_, sel]) => sel).reduce((sum, [id]) => sum + (data.accessories.find(a => a.id === Number(id))?.price || 0), 0).toFixed(2)}</span>
                                </div>
                            )}

                            <div className="summary-total">
                                <span>TOTAL</span>
                                <span>€ {calcTotal().toLocaleString('en-US')}</span>
                            </div>

                            <button
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%', marginTop: '24px' }}
                                disabled={!material || (!color && data.category !== 'Stadium') || saving}
                                onClick={handleGenerateOrder}
                            >
                                {saving ? 'Generating...' : 'Generate Order →'}
                            </button>
                            {(!material || (!color && data.category !== 'Stadium')) && (
                                <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'center', marginTop: '12px' }}>
                                    Select material and color to proceed
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
