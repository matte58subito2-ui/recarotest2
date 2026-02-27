'use client';

import Navbar from '@/components/Navbar';
import { useState } from 'react';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <>
            <Navbar />
            <main className="container page animate-fade">
                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 0' }}>
                    <h1 style={{ fontSize: '36px', marginBottom: '16px' }}>
                        Contact <span style={{ color: 'var(--red-light)' }}>RECARO</span>
                    </h1>
                    <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>
                        Need help with a B2B order or finding the perfect seat? Send us a message and our team will get back to you shortly.
                    </p>

                    {sent ? (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
                            <h2 style={{ marginBottom: '8px' }}>Message Sent</h2>
                            <p style={{ color: 'var(--text2)' }}>Thank you for reaching out. We will reply to {email} as soon as possible.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="card" style={{ padding: '32px' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="john@company.com"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Message</label>
                                <textarea
                                    className="form-input"
                                    required
                                    rows={5}
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="How can we help you today?"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '16px' }}>
                                Send Message
                            </button>
                        </form>
                    )}

                    <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', textAlign: 'center' }}>
                        <div className="card">
                            <h3>Sales Support</h3>
                            <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '8px' }}>b2b-sales@recaro.com</p>
                            <p style={{ color: 'var(--text3)', fontSize: '12px' }}>Mon - Fri, 9am - 5pm</p>
                        </div>
                        <div className="card">
                            <h3>Technical Help</h3>
                            <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '8px' }}>tech@recaro.com</p>
                            <p style={{ color: 'var(--text3)', fontSize: '12px' }}>24/7 Support for Partners</p>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
