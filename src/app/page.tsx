'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function HomePage() {
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();

    // Parallax effect for the hero image (moves slower than scroll)
    const yBg = useTransform(scrollY, [0, 1000], [0, 300]);
    // Fade out hero text on scroll
    const opacityHeroText = useTransform(scrollY, [0, 400], [1, 0]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fadeUpVariant = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-red-500 selection:text-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
                <motion.div
                    className="absolute inset-0 z-0"
                    style={{ y: yBg }}
                >
                    <Image
                        src="/factory.png"
                        alt="RECARO Factory"
                        fill
                        style={{ objectFit: 'cover', opacity: 0.6 }}
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
                </motion.div>

                <motion.div
                    className="container relative z-10 text-center max-w-5xl mx-auto pt-20"
                    style={{ opacity: opacityHeroText }}
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="text-6xl md:text-8xl font-semibold tracking-tighter text-white mb-6 !leading-[1.1]"
                    >
                        The Art of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
                            Perfect Seating.
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10 font-medium tracking-tight"
                    >
                        Engineering excellence since 1906. Experience the pinnacle of automotive and lifestyle ergonomics.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link href="/catalog" className="btn btn-primary btn-lg rounded-full px-12 shadow-lg hover:scale-105 transition-transform duration-300" style={{ fontFamily: 'var(--font-rajdhani)', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Explore Catalogue
                        </Link>
                        <Link href="/contact" className="btn btn-secondary btn-lg rounded-full px-12 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors duration-300 backdrop-blur-md" style={{ fontFamily: 'var(--font-rajdhani)', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Get in Touch
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* Heritage Section (Company Profile) */}
            <section className="py-32 bg-slate-50 overflow-hidden">
                <div className="container max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <motion.div
                            className="order-2 md:order-1"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={fadeUpVariant}
                        >
                            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-slate-900" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>
                                A Legacy of <br /> Innovation.
                            </h2>
                            <p className="text-slate-500 text-lg sm:text-xl mb-6 leading-relaxed font-medium">
                                From the first Stuttgarter Karosseriewerk Reutter & Co. in 1906, RECARO has defined what it means to sit perfectly.
                            </p>
                            <p className="text-slate-500 text-lg sm:text-xl mb-12 leading-relaxed font-medium">
                                Our journey is one of obsession with ergonomics, safety, and performance. Every stitch is designed for the ultimate connection between human and machine.
                            </p>
                            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200">
                                <div>
                                    <div className="text-4xl font-bold text-slate-900 tracking-tighter mb-1" style={{ fontFamily: 'var(--font-rajdhani)' }}>115+</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Years of History</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-slate-900 tracking-tighter mb-1" style={{ fontFamily: 'var(--font-rajdhani)' }}>50+</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Racing Titles</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-slate-900 tracking-tighter mb-1" style={{ fontFamily: 'var(--font-rajdhani)' }}>0.5s</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Reaction Timing</div>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            className="order-1 md:order-2 relative h-[600px] w-full rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            viewport={{ once: true }}
                        >
                            <Image
                                src="/heritage.png"
                                alt="RECARO Heritage"
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Categories Grid */}
            <section className="py-32 bg-white">
                <div className="container max-w-7xl">
                    <motion.div
                        className="text-center mb-20"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUpVariant}
                    >
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>
                            Master Your Environment.
                        </h2>
                        <p className="text-xl font-medium text-slate-500">Discover zero compromise across every category.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: 'Motorsport', desc: 'Born for the track.', img: '/seats/recaro-podium-cf.png' },
                            { name: 'Stadium', desc: 'VIP venue excellence.', img: '/seats/recaro-stadium-seat-player-.jpg' },
                            { name: 'Comfort', desc: 'Ergonomics for life.', img: '/seats/recaro-ergomed-e.png' },
                            { name: 'Nautic', desc: 'Master the elements.', img: '/seats/recaro-maritime-bridge-seat.jpg' }
                        ].map((cat, idx) => (
                            <motion.div
                                key={cat.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Link
                                    href={`/catalog?cat=${cat.name}`}
                                    className="group block relative h-[450px] rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/5 hover:bg-zinc-800 hover:border-white/10 transition-colors duration-500"
                                >
                                    <div className="absolute top-10 left-0 right-0 z-10 text-center px-6">
                                        <h3 className="text-2xl font-semibold text-white tracking-tight mb-1" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>{cat.name}</h3>
                                        <p className="text-sm font-medium text-slate-400">{cat.desc}</p>
                                    </div>
                                    <div className="absolute inset-0 mt-20 p-8 flex items-center justify-center">
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={cat.img}
                                                alt={cat.name}
                                                fill
                                                className="object-contain group-hover:scale-105 transition-transform duration-700 ease-out drop-shadow-2xl"
                                                sizes="(max-width: 768px) 100vw, 25vw"
                                            />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-32 bg-black border-t border-white/10">
                <div className="container max-w-6xl text-center">
                    <motion.h2
                        className="text-4xl md:text-5xl font-semibold tracking-tight mb-20 text-white"
                        style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeUpVariant}
                    >
                        The RECARO Difference.
                    </motion.h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: '🛡️', title: 'Uncompromising Safety', text: 'Exceeding international FIA and automotive standards to ensure your protection in every condition.' },
                            { icon: '🧘', title: 'Human Ergonomics', text: 'Designed around the human spine to minimize fatigue and maximize concentration during long hours.' },
                            { icon: '💎', title: 'Premium Materials', text: 'Only the finest Nappa leather, Alcantara, and carbon-fiber composites make it into a RECARO seat.' }
                        ].map((val, idx) => (
                            <motion.div
                                key={val.title}
                                className="bg-zinc-900 rounded-[2rem] p-10 border border-white/5 hover:border-white/10 transition-colors duration-300"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: idx * 0.15 }}
                                viewport={{ once: true }}
                            >
                                <div className="text-4xl mb-6 bg-zinc-800 w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-white/5">{val.icon}</div>
                                <h3 className="text-xl font-semibold tracking-tight mb-3 text-white" style={{ fontFamily: 'var(--font-rajdhani)', textTransform: 'uppercase' }}>{val.title}</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">{val.text}</p>
                            </motion.div>
                        ))}
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
