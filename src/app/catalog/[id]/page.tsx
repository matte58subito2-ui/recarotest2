'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { useCartStore } from '@/store/useCartStore';
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
    'Black': '#1a1a1a', // Premium black leather
    'Anthracite Grey': '#363636', // Alcantara Grey
    'Grey': '#71717a',
    'Melange Grey': '#8c8c8c',
    'Fire Red': '#c41e1e', // Classic RECARO Red
    'Sport Red': '#ff3b3b',
    'Cognac Brown': '#9a5c32', // Luxury Cognac
    'Sand Beige': '#e6d5c3',
    'Midnight Blue': '#1e293b',
    'Racing Blue': '#2563eb',
    'Military Green': '#4d5c48',
    'Pearl White': '#f8fafc',
    'Fluo Orange': '#f97316',
};

const STADIUM_COLORS = [
    { name: 'Classico RECARO Red', hex: '#c41e1e', rgb: [0.77, 0.12, 0.12] },
    { name: 'Carbon Black', hex: '#111111', rgb: [0.07, 0.07, 0.07] },
    { name: 'Pure White', hex: '#fdfbf7', rgb: [0.99, 0.98, 0.97] },
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
    const [mediaAgreed, setMediaAgreed] = useState(false);

    // Partnership Selection
    const [partnershipLevel, setPartnershipLevel] = useState<'Nessuna' | 'Logo' | 'Logo e Media'>('Nessuna');
    const [discountRate, setDiscountRate] = useState(0);

    // Logo Upload
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoPosition, setLogoPosition] = useState<'Headrest' | 'Backrest' | 'Rear Shell'>('Headrest');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addItem = useCartStore((state) => state.addItem);
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
        if (partnershipLevel === 'Nessuna') setDiscountRate(0);
        else if (partnershipLevel === 'Logo') setDiscountRate(0.15);
        else if (partnershipLevel === 'Logo e Media') setDiscountRate(0.30);
    }, [partnershipLevel]);

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

        const discounted = t * (1 - discountRate);
        return { original: t, final: discounted };
    };

    const handleAddToCart = () => {
        const finalColorHex = data.category === 'Stadium' ? stadiumColor.hex : (COLOR_MAP[color] || '#000000');

        const { original, final } = calcTotal();

        addItem({
            categoryId: data.category,
            productName: data.model_name,
            colorHex: finalColorHex,
            logoBlob: logoPreview,
            logoPosition: logoPreview ? logoPosition : null,
            price: final,
            originalPrice: original,
            partnershipLevel,
            discountRate,
            material: material?.name,
            heating,
            accessories: Object.entries(accessories)
                .filter(([_, sel]) => sel)
                .map(([id]) => data.accessories.find(a => a.id === Number(id))?.name)
                .filter(Boolean) as string[],
        });

        alert('Prodotto Configurato aggiunto al carrello!');
        router.push('/catalog');
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 6));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-500 selection:text-white flex flex-col">
            <Navbar />
            <main className="flex-1 flex flex-col lg:flex-row w-full max-w-[1920px] mx-auto overflow-hidden h-[calc(100vh-80px)]">

                {/* Left Side: Canvas (70%) */}
                <div className="w-full lg:w-[70%] bg-[#0a0a0a] relative flex flex-col border-r border-white/10">
                    <div className="absolute top-8 left-8 z-10">
                        <Link href="/catalog" className="text-white/50 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Catalogue
                        </Link>
                    </div>

                    <div className="absolute top-8 right-8 z-10 text-right">
                        <div className="inline-block px-3 py-1 bg-red-600/20 text-red-500 text-xs font-bold uppercase tracking-widest rounded-full border border-red-500/30 mb-2">
                            {data.category}
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tighter" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>{data.model_name}</h1>
                    </div>

                    <div className="flex-1 w-full h-full flex items-center justify-center p-12">
                        {data.category === 'Stadium' ? (
                            <div className="w-full h-full max-w-4xl max-h-[70vh] relative">
                                <model-viewer
                                    ref={modelRef}
                                    src="/models/stadium/slitta.glb"
                                    alt="Stadium Seat 3D"
                                    auto-rotate
                                    camera-controls
                                    style={{ width: '100%', height: '100%', outline: 'none' }}
                                    shadow-intensity="1.5"
                                    exposure="1.2"
                                    environment-image="neutral"
                                ></model-viewer>

                                {/* Logo Overlay for Stadium 3D View */}
                                {logoPreview && (
                                    <div
                                        className="absolute z-20 pointer-events-none transition-all duration-500 ease-in-out"
                                        style={{
                                            top: logoPosition === 'Headrest' ? '15%' : logoPosition === 'Backrest' ? '40%' : '15%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: logoPosition === 'Rear Shell' ? '0px' : '100px',
                                            height: logoPosition === 'Rear Shell' ? '0px' : 'auto',
                                            opacity: logoPosition === 'Rear Shell' ? 0 : 0.8,
                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                                        }}
                                    >
                                        <Image src={logoPreview} alt="Custom Logo" width={100} height={100} style={{ objectFit: 'contain' }} />
                                    </div>
                                )}

                                {/* Mandatory RECARO Branding for Partnership Levels */}
                                {partnershipLevel !== 'Nessuna' && (
                                    <div
                                        className="absolute z-30 pointer-events-none transition-all duration-500"
                                        style={{
                                            top: '12%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '120px',
                                            opacity: 0.9,
                                            filter: 'brightness(0) invert(1)' // Force white logo on dark seat
                                        }}
                                    >
                                        <Image src="https://it.recaro-automotive.com/typo3conf/ext/wc_recaro_site/Resources/Public/img/recaro_logo.png" alt="RECARO Branding" width={120} height={30} style={{ objectFit: 'contain' }} />
                                    </div>
                                )}
                            </div>
                        ) : data.image_url ? (
                            <div className="w-full h-full max-w-4xl max-h-[70vh] relative flex items-center justify-center drop-shadow-2xl">
                                <Image src={data.image_url} alt={data.model_name} fill style={{ objectFit: 'contain' }} priority />

                                {/* Logo Overlay */}
                                {logoPreview && (
                                    <div
                                        className="absolute z-20 pointer-events-none transition-all duration-500 ease-in-out"
                                        style={{
                                            top: logoPosition === 'Headrest' ? '15%' : logoPosition === 'Backrest' ? '40%' : '15%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: logoPosition === 'Rear Shell' ? '0px' : '100px', // Hide on front view if Rear Shell
                                            height: logoPosition === 'Rear Shell' ? '0px' : 'auto',
                                            opacity: logoPosition === 'Rear Shell' ? 0 : 0.8,
                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                                        }}
                                    >
                                        <Image src={logoPreview} alt="Custom Logo" width={100} height={100} style={{ objectFit: 'contain' }} />
                                    </div>
                                )}

                                {/* Mandatory RECARO Branding for Partnership Levels */}
                                {partnershipLevel !== 'Nessuna' && (
                                    <div
                                        className="absolute z-30 pointer-events-none transition-all duration-500"
                                        style={{
                                            top: '12%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '120px',
                                            opacity: 0.9
                                        }}
                                    >
                                        <Image src="https://it.recaro-automotive.com/typo3conf/ext/wc_recaro_site/Resources/Public/img/recaro_logo.png" alt="RECARO Branding" width={120} height={30} style={{ objectFit: 'contain' }} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-white/30 text-xl font-medium">No 3D Model Available</div>
                        )}
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 z-10">
                        <div className="flex items-center gap-2 mb-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className={`h-1 flex-1 rounded-full bg-white/10 overflow-hidden`}>
                                    <div className={`h-full bg-red-600 transition-all duration-500 ${step >= i ? 'w-full' : 'w-0'}`} />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center text-xs font-medium uppercase tracking-widest text-white/50" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                            <span>01 / Material</span>
                            <span>02 / Color</span>
                            <span>03 / Core</span>
                            <span>04 / Branding</span>
                            <span>05 / Add-ons</span>
                            <span>06 / Partner</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Sidebar (30%) */}
                <div className="w-full lg:w-[30%] bg-zinc-950 flex flex-col h-full overflow-hidden">

                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">

                        {step === 1 && (
                            <div className="animate-fade-in">
                                <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>01. Material</h2>
                                <p className="text-zinc-500 text-sm mb-8 font-medium">Select the primary material for the seat cover.</p>

                                <div className="flex flex-col gap-4">
                                    {data.materials.map(m => (
                                        <div
                                            key={m.id}
                                            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${material?.name === m.material ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-zinc-900/50 hover:border-white/20'}`}
                                            onClick={() => { setMaterial({ name: m.material, price: m.price_delta }); setColor(''); }}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-semibold text-lg">{m.material}</div>
                                                <div className={`text-sm font-bold ${material?.name === m.material ? 'text-red-500' : 'text-zinc-400'}`}>
                                                    {m.price_delta > 0 ? `+ € ${m.price_delta}` : 'Included'}
                                                </div>
                                            </div>
                                            <div className="text-xs text-zinc-500 leading-relaxed">High-performance technical fabric designed for maximum grip and durability under extreme conditions.</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fade-in">
                                <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>02. Color</h2>
                                <p className="text-zinc-500 text-sm mb-8 font-medium">Available colors for {material?.name || 'selected material'}.</p>

                                <div className="grid grid-cols-3 gap-4">
                                    {data.category === 'Stadium' ? (
                                        STADIUM_COLORS.map(c => (
                                            <div key={c.name} className="flex flex-col items-center gap-3">
                                                <div
                                                    className={`w-16 h-16 rounded-full cursor-pointer transition-transform hover:scale-110 shadow-lg ${stadiumColor.name === c.name ? 'ring-2 ring-red-600 ring-offset-4 ring-offset-zinc-950 scale-110' : 'ring-1 ring-white/10'}`}
                                                    style={{ background: c.hex }}
                                                    title={c.name}
                                                    onClick={() => setStadiumColor(c)}
                                                />
                                                <div className="text-xs font-medium text-center text-zinc-400">{c.name}</div>
                                            </div>
                                        ))
                                    ) : (
                                        getAvailableColors().map(c => (
                                            <div key={c} className="flex flex-col items-center gap-3">
                                                <div
                                                    className={`w-16 h-16 rounded-full cursor-pointer transition-transform hover:scale-110 shadow-lg ${color === c ? 'ring-2 ring-red-600 ring-offset-4 ring-offset-zinc-950 scale-110' : 'ring-1 ring-white/10'}`}
                                                    style={{ background: COLOR_MAP[c] || '#ccc' }}
                                                    title={c}
                                                    onClick={() => setColor(c)}
                                                />
                                                <div className="text-xs font-medium text-center text-zinc-400">{c}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-fade-in">
                                <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>03. Core</h2>
                                <p className="text-zinc-500 text-sm mb-8 font-medium">Configure internal structural and comfort elements.</p>

                                <div
                                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${heating ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-zinc-900/50 hover:border-white/20'}`}
                                    onClick={() => setHeating(!heating)}
                                >
                                    <div>
                                        <div className="font-semibold text-lg mb-1">3-Zone Climate Heating</div>
                                        <div className="text-sm text-zinc-400">Integrated carbon-fiber heating pads.</div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-3">
                                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${heating ? 'bg-red-600' : 'bg-zinc-700'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${heating ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                        <div className={`text-sm font-bold ${heating ? 'text-red-500' : 'text-zinc-500'}`}>+ € 150.00</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-fade-in">
                                <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>04. Branding</h2>
                                <p className="text-zinc-500 text-sm mb-8 font-medium">Upload a custom logo (.png) to be embroidered on the seat.</p>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/png, image/jpeg"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => setLogoPreview(event.target?.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />

                                {!logoPreview ? (
                                    <div
                                        className="border-2 border-dashed border-white/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        </div>
                                        <div className="font-semibold text-lg mb-2">Upload Custom Logo</div>
                                        <div className="text-sm text-zinc-500 max-w-[200px]">Click to select a transparent PNG file.</div>
                                        <div className="mt-6 px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-colors">Browse Files</div>
                                    </div>
                                ) : (
                                    <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/10">
                                        <div className="flex items-center gap-6 mb-8">
                                            <div className="w-24 h-24 rounded-2xl bg-black/50 border border-white/5 p-2 flex items-center justify-center relative group">
                                                <Image src={logoPreview} alt="Logo Preview" width={80} height={80} style={{ objectFit: 'contain' }} />
                                                <button
                                                    className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-white transition-colors opacity-0 group-hover:opacity-100"
                                                    onClick={(e) => { e.stopPropagation(); setLogoPreview(null); }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-lg mb-1">Logo Uploaded</div>
                                                <div className="text-sm text-zinc-500">Vector embroidery ready.</div>
                                            </div>
                                        </div>

                                        <div className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4" style={{ fontFamily: 'var(--font-rajdhani)' }}>Select Position</div>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Headrest', 'Backrest', 'Rear Shell'].map(pos => (
                                                <div
                                                    key={pos}
                                                    className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-colors ${logoPosition === pos ? 'border-red-600 bg-red-600/10 text-white' : 'border-white/5 bg-zinc-900/50 text-zinc-500 hover:border-white/20 hover:text-white'}`}
                                                    onClick={() => setLogoPosition(pos as any)}
                                                >
                                                    <div className="text-xs font-bold uppercase tracking-wider">{pos}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 5 && (
                            <div className="animate-fade-in">
                                <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>05. Add-ons</h2>
                                <p className="text-zinc-500 text-sm mb-8 font-medium">Select final accessories and structural mounts.</p>

                                <div className="flex flex-col gap-4">
                                    {data.accessories.map(a => (
                                        <div
                                            key={a.id}
                                            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${accessories[a.id] ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-zinc-900/50 hover:border-white/20'}`}
                                            onClick={() => setAccessories({ ...accessories, [a.id]: !accessories[a.id] })}
                                        >
                                            <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${accessories[a.id] ? 'border-red-500 bg-red-500 text-white' : 'border-zinc-600 text-transparent'}`}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-lg">{a.name}</div>
                                                <div className="text-sm text-zinc-400">{a.description}</div>
                                            </div>
                                            <div className={`text-sm font-bold ${accessories[a.id] ? 'text-red-500' : 'text-zinc-500'}`}>
                                                + € {a.price.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 6 && (
                            <div className="animate-fade-in">
                                <h2 className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>06. Partnership</h2>
                                <p className="text-zinc-500 text-sm mb-8 font-medium">Define your collaboration tier and unlock exclusive benefits.</p>

                                <div className="flex flex-col gap-4">
                                    {[
                                        {
                                            id: 'Nessuna',
                                            title: 'Nessuna Partnership',
                                            desc: 'Full privacy and clean aesthetics. No RECARO branding is visible on the final product.',
                                            details: 'Ideal for private collections or projects where minimal branding is a requirement.',
                                            discount: 0
                                        },
                                        {
                                            id: 'Logo',
                                            title: 'Branding Logo',
                                            desc: 'RECARO logo visible. Strategic brand placement for premium exposure.',
                                            details: 'Product features the signature white RECARO logo in a prominent position, ideal for showroom displays or prestige projects.',
                                            discount: 15
                                        },
                                        {
                                            id: 'Logo e Media',
                                            title: 'Logo e Media Partnership',
                                            desc: 'Full Marketing Collaboration. Deep discount for high-quality content sharing.',
                                            details: 'RECARO logo visible. Requires providing professional photo/video assets of the product in its final environment for RECARO marketing.',
                                            discount: 30
                                        },
                                    ].map(opt => (
                                        <div
                                            key={opt.id}
                                            className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${partnershipLevel === opt.id ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-zinc-900/50 hover:border-white/20'}`}
                                            onClick={() => setPartnershipLevel(opt.id as any)}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-semibold text-lg uppercase tracking-tight" style={{ fontFamily: 'var(--font-rajdhani)' }}>{opt.title}</div>
                                                {opt.discount > 0 && (
                                                    <div className="px-2 py-0.5 bg-red-600 text-[10px] font-black uppercase text-white rounded">-{opt.discount}%</div>
                                                )}
                                            </div>
                                            <div className="text-xs text-zinc-400 leading-relaxed font-medium mb-2">{opt.desc}</div>
                                            <div className="text-[10px] text-zinc-600 leading-relaxed">{opt.details}</div>
                                        </div>
                                    ))}
                                </div>

                                {partnershipLevel === 'Logo e Media' && (
                                    <div className="mt-8 p-6 bg-red-600/5 border border-red-600/20 rounded-2xl animate-fade-in">
                                        <label className="flex gap-4 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={mediaAgreed}
                                                onChange={() => setMediaAgreed(!mediaAgreed)}
                                            />
                                            <div className={`min-w-[24px] h-6 rounded border-2 flex items-center justify-center transition-colors mt-1 ${mediaAgreed ? 'bg-red-600 border-red-600' : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-500'}`}>
                                                {mediaAgreed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <div className="text-sm">
                                                <div className="text-white font-bold uppercase tracking-tight mb-1" style={{ fontFamily: 'var(--font-rajdhani)' }}>Media Partnership Agreement</div>
                                                <div className="text-zinc-500 text-xs leading-relaxed">
                                                    I agree to provide high-quality photo/video assets of the product in its final installation environment within 30 days of delivery. I understand that RECARO reserves the right to use these assets for global marketing.
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-8 border-t border-white/10 bg-zinc-950 shrink-0">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-rajdhani)' }}>Total Configuration</div>
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl font-bold tracking-tighter text-white">€ {calcTotal().final.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                    {discountRate > 0 && (
                                        <div className="text-xl text-zinc-600 line-through decoration-red-600/50">€ {calcTotal().original.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                    )}
                                </div>
                            </div>
                            {discountRate > 0 && (
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5">Sconto Partnership</div>
                                    <div className="text-sm font-bold text-red-500">- € {(calcTotal().original - calcTotal().final).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            {step > 1 && (
                                <button
                                    onClick={prevStep}
                                    className="px-6 py-4 rounded-xl border border-white/20 font-semibold text-white hover:bg-white/10 transition-colors uppercase tracking-wider text-sm flex-shrink-0"
                                    style={{ fontFamily: 'var(--font-rajdhani)' }}
                                >
                                    Back
                                </button>
                            )}

                            {step < 6 ? (
                                <button
                                    onClick={nextStep}
                                    className="flex-1 px-6 py-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors uppercase tracking-wider text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ fontFamily: 'var(--font-rajdhani)' }}
                                    disabled={
                                        (step === 1 && !material) ||
                                        (step === 2 && !color && data.category !== 'Stadium')
                                    }
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 px-6 py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors uppercase tracking-wider text-sm shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-30 disabled:grayscale transition-all"
                                    style={{ fontFamily: 'var(--font-rajdhani)' }}
                                    disabled={!material || (!color && data.category !== 'Stadium') || (partnershipLevel === 'Logo e Media' && !mediaAgreed)}
                                >
                                    {partnershipLevel === 'Logo e Media' && !mediaAgreed ? 'Accetta Accordo per Procedere' : 'Aggiungi al Carrello'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
