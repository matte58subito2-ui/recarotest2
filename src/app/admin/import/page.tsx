'use client';
import { useState } from 'react';

export default function ImportPage() {
    const [csvContent, setCsvContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ ok?: boolean; error?: string; imported?: number } | null>(null);

    const handleImport = async () => {
        if (!csvContent) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/admin/import', {
                method: 'POST',
                headers: { 'Content-Type': 'text/csv' },
                body: csvContent,
            });
            const data = await res.json();
            setResult(data);
        } catch {
            setResult({ error: 'Connection error' });
        }
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setCsvContent(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <h1 style={{ marginBottom: '8px' }}>Upload Warehouse <span style={{ color: 'var(--red)' }}>CSV</span></h1>
            <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>Import seat records via CSV file.</p>

            <div className="card" style={{ marginBottom: '40px' }}>
                <h3 style={{ marginBottom: '16px' }}>Record Layout Instructions</h3>
                <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '16px' }}>
                    The file must be a <strong>CSV (Comma Separated Values)</strong> and the first row must contain the exact column headers:
                </p>
                <div style={{ background: 'var(--bg)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#a0a0a0', marginBottom: '24px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    model_name, description, category, base_price<br />
                    Sports Seat 1, Breathable technical fabric seat, Sport, 850.00
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label">Choose CSV or text file</label>
                    <input type="file" accept=".csv, text/csv" onChange={handleFileChange} className="form-input" style={{ padding: '12px' }} />
                </div>

                {csvContent && (
                    <div style={{ marginBottom: '24px' }}>
                        <label className="form-label">Content Preview</label>
                        <textarea
                            className="form-input"
                            value={csvContent}
                            onChange={e => setCsvContent(e.target.value)}
                            rows={8}
                            style={{ width: '100%', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                        />
                    </div>
                )}

                <button
                    className="btn btn-primary btn-lg"
                    onClick={handleImport}
                    disabled={!csvContent || loading}
                >
                    {loading ? 'Processing...' : 'Process and Import Catalogue'}
                </button>

                {result && (
                    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', background: result.ok ? 'rgba(34,197,94,0.1)' : 'rgba(196,30,30,0.1)', border: `1px solid ${result.ok ? 'rgba(34,197,94,0.3)' : 'rgba(196,30,30,0.3)'}` }}>
                        {result.ok ? (
                            <span style={{ color: 'var(--success)' }}>✅ Catalogue updated successfully: <strong>{result.imported}</strong> records imported/updated.</span>
                        ) : (
                            <span style={{ color: 'var(--red-light)' }}>❌ Error during import: {result.error}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
