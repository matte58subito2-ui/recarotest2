'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';

export default function HomePage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-500 selection:text-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/factory.png"
                        alt="RECARO Factory"
                        fill
                        style={{ objectFit: 'cover', opacity: 0.5 }}
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
                </div>

                <div className="container relative z-10 text-center animate-fade-in max-w-5xl mx-auto pt-20">
                    <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter text-white mb-6 !leading-[1.1]">
                        The Art of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
                            Perfect Seating.
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 font-medium tracking-tight">
                        Engineering excellence since 1906. Experience the pinnacle of automotive and lifestyle ergonomics.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/catalog" className="btn btn-primary btn-lg rounded-full px-12 shadow-lg hover:scale-105 transition-transform duration-300">
                            Explore Catalogue
                        </Link>
                        <Link href="/contact" className="btn btn-secondary btn-lg rounded-full px-12 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors duration-300 backdrop-blur-md">
                            Get in Touch
                        </Link>
                    </div>
                </div>
            </section>

            {/* Heritage Section */}
            <section className="py-32 bg-slate-50">
                <div className="container max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <div className="order-2 md:order-1">
                            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-slate-900">
                                A Legacy of <br /> Innovation.
                            </h2>
                            <p className="text-slate-500 text-lg sm:text-xl mb-6 leading-relaxed font-medium">
                                From the first Stuttgarter Karosseriewerk Reutter & Co. in 1906, RECARO has defined what it means to sit perfectly.
                            </p>
                            <p className="text-slate-500 text-lg sm:text-xl mb-12 leading-relaxed font-medium">
                                Our journey is one of obsession with ergonomics, safety, and performance. Every stitch is designed for the ultimate connection.
                            </p>
                            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200">
                                <div>
                                    <div className="text-4xl font-bold text-slate-900 tracking-tighter mb-1">115+</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Years of History</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-slate-900 tracking-tighter mb-1">50+</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Racing Titles</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-slate-900 tracking-tighter mb-1">0.5s</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Reaction Timing</div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2 relative h-[600px] w-full rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50">
                            <Image
                                src="/heritage.png"
                                alt="RECARO Heritage"
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="py-32 bg-white">
                <div className="container max-w-7xl">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
                            Master Your Environment.
                        </h2>
                        <p className="text-xl font-medium text-slate-400">Discover zero compromise across every category.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: 'Motorsport', desc: 'Born for the track.', img: '/seats/recaro-podium-cf.png' },
                            { name: 'Stadium', desc: 'VIP venue excellence.', img: '/seats/recaro-stadium-seat-player-.jpg' },
                            { name: 'Comfort', desc: 'Ergonomics for life.', img: '/seats/recaro-ergomed-e.png' },
                            { name: 'Nautic', desc: 'Master the elements.', img: '/seats/recaro-maritime-bridge-seat.jpg' }
                        ].map((cat) => (
                            <Link
                                key={cat.name}
                                href={`/catalog?cat=${cat.name}`}
                                className="group block relative h-[450px] rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/5 hover:bg-zinc-800 hover:border-white/10 transition-colors duration-500"
                            >
                                <div className="absolute top-10 left-0 right-0 z-10 text-center px-6">
                                    <h3 className="text-2xl font-semibold text-white tracking-tight mb-1">{cat.name}</h3>
                                    <p className="text-sm font-medium text-slate-400">{cat.desc}</p>
                                </div>
                                <div className="absolute inset-0 mt-20 p-8 flex items-center justify-center">
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={cat.img}
                                            alt={cat.name}
                                            fill
                                            className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-2xl"
                                        />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-32 bg-black border-t border-white/10">
                <div className="container max-w-6xl text-center">
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-20 text-white">
                        The RECARO Difference.
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-zinc-900 rounded-[2rem] p-10 border border-white/5 hover:border-white/10 transition-colors duration-300">
                            <div className="text-4xl mb-6 bg-zinc-800 w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-white/5">🛡️</div>
                            <h3 className="text-xl font-semibold tracking-tight mb-3 text-white">Uncompromising Safety</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">Exceeding international FIA and automotive standards to ensure your protection in every condition.</p>
                        </div>
                        <div className="bg-zinc-900 rounded-[2rem] p-10 border border-white/5 hover:border-white/10 transition-colors duration-300">
                            <div className="text-4xl mb-6 bg-zinc-800 w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-white/5">🧘</div>
                            <h3 className="text-xl font-semibold tracking-tight mb-3 text-white">Human Ergonomics</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">Designed around the human spine to minimize fatigue and maximize concentration during long hours.</p>
                        </div>
                        <div className="bg-zinc-900 rounded-[2rem] p-10 border border-white/5 hover:border-white/10 transition-colors duration-300">
                            <div className="text-4xl mb-6 bg-zinc-800 w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-white/5">💎</div>
                            <h3 className="text-xl font-semibold tracking-tight mb-3 text-white">Premium Materials</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">Only the finest Nappa leather, Alcantara, and carbon-fiber composites make it into a RECARO seat.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 bg-black border-t border-white/10 text-center">
                <div className="container">
                    <Image src="/recaro_logo.png" alt="RECARO" width={120} height={30} className="mx-auto select-none opacity-40 hover:opacity-100 transition-all duration-300 mb-6" />
                    <p className="text-slate-500 font-medium text-sm">© 2024 RECARO B2B Platform. Internal Use Only.</p>
                </div>
            </footer>
        </div>
    );
}
