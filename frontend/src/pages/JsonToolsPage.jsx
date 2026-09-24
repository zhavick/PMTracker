import React, { useState } from 'react';
import { 
  Code, 
  Sparkles, 
  Minimize2, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Download, 
  Trash2, 
  Check 
} from 'lucide-react';

const SAMPLE_JSON = `{
  "status": "success",
  "statusCode": 200,
  "message": "Operasi Work Tracker Pro berhasil dieksekusi",
  "data": {
    "project": {
      "id": 1,
      "name": "Pengembangan Work Tracker Pro v3.6",
      "status": "Active",
      "color": "#6366F1",
      "progress": 75,
      "features": [
        "Interactive Grid Table & Kanban Toggle",
        "Multi-Timer Concurrent Sessions",
        "ClosedXML Personal Timesheet .xlsx",
        "SQL Beautifier 15+ Dialects",
        "Dual Auth & 40 Dynamic Theme Engine"
      ]
    },
    "meta": {
      "timestamp": "2026-09-24T12:00:00Z",
      "environment": "Production-Ready"
    }
  }
}`;

export default function JsonToolsPage() {
  const [inputJson, setInputJson] = useState(SAMPLE_JSON);
  const [outputJson, setOutputJson] = useState('');
  const [indent, setIndent] = useState(2);
  const [validationResult, setValidationResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    if (!inputJson.trim()) return;
    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutputJson(formatted);
      setValidationResult({
        isValid: true,
        message: 'JSON valid dan berhasil diformat terstruktur.',
        keyCount: countKeys(parsed)
      });
    } catch (err) {
      setValidationResult({
        isValid: false,
        message: `Sintaks JSON tidak valid: ${err.message}`
      });
    }
  };

  const handleMinify = () => {
    if (!inputJson.trim()) return;
    try {
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setOutputJson(minified);
      setValidationResult({
        isValid: true,
        message: 'JSON berhasil dikompresi (minified).'
      });
    } catch (err) {
      setValidationResult({
        isValid: false,
        message: `Sintaks JSON tidak valid: ${err.message}`
      });
    }
  };

  const handleValidate = () => {
    if (!inputJson.trim()) return;
    try {
      const parsed = JSON.parse(inputJson);
      setValidationResult({
        isValid: true,
        message: 'JSON valid dan sesuai dengan spesifikasi RFC 8259.',
        keyCount: countKeys(parsed)
      });
    } catch (err) {
      setValidationResult({
        isValid: false,
        message: `Sintaks JSON tidak valid: ${err.message}`
      });
    }
  };

  const countKeys = (obj) => {
    if (typeof obj !== 'object' || obj === null) return 0;
    let count = Object.keys(obj).length;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += countKeys(obj[key]);
      }
    }
    return count;
  };

  const handleCopy = () => {
    const text = outputJson || inputJson;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = outputJson || inputJson;
    if (!text) return;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payload_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            JSON Payload & API Tools
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Format, validasi sintaks skema, dan kompresi payload JSON untuk integrasi REST API.
          </p>
        </div>

        {/* Indent Selector */}
        <div className="flex items-center space-x-2 text-xs font-bold">
          <span style={{ color: 'var(--text-secondary)' }}>Indentasi:</span>
          <div className="flex p-1 rounded-xl border bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => setIndent(2)}
              className={`px-3 py-1 rounded-lg transition-all ${indent === 2 ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'}`}
            >
              2 Spasi
            </button>
            <button
              onClick={() => setIndent(4)}
              className={`px-3 py-1 rounded-lg transition-all ${indent === 4 ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'}`}
            >
              4 Spasi
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div 
        className="p-3.5 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFormat}
            disabled={!inputJson.trim()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Format / Prettify</span>
          </button>

          <button
            onClick={handleMinify}
            disabled={!inputJson.trim()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Minify</span>
          </button>

          <button
            onClick={handleValidate}
            disabled={!inputJson.trim()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Validasi JSON</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setInputJson(SAMPLE_JSON);
              setOutputJson('');
              setValidationResult(null);
            }}
            className="px-3 py-1.5 rounded-xl border text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Sample JSON
          </button>

          <button
            onClick={handleCopy}
            className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            title="Salin ke Clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            title="Unduh File .json"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setInputJson('');
              setOutputJson('');
              setValidationResult(null);
            }}
            className="p-2 rounded-xl border hover:bg-rose-500/10 text-rose-500 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
            title="Kosongkan Buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation Result Alert */}
      {validationResult && (
        <div className={`p-4 rounded-2xl border text-xs space-y-1 animate-fade-in ${
          validationResult.isValid 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
        }`}>
          <div className="flex items-center space-x-2 font-bold text-sm">
            {validationResult.isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{validationResult.message}</span>
          </div>
          {validationResult.keyCount !== undefined && (
            <div className="text-[11px] text-gray-500 pt-0.5">
              Total Node / Keys Terdeteksi: <strong>{validationResult.keyCount}</strong>
            </div>
          )}
        </div>
      )}

      {/* Split Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <div 
          className="rounded-3xl border shadow-sm flex flex-col overflow-hidden"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div 
            className="px-5 py-3 border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <span>Payload Masukan (JSON Input)</span>
            <span className="font-mono">{inputJson.length} Karakter</span>
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="Tempelkan atau ketik JSON di sini..."
            className="w-full h-80 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none"
            style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Output */}
        <div 
          className="rounded-3xl border shadow-sm flex flex-col overflow-hidden"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div 
            className="px-5 py-3 border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <span>Hasil Format / Minify</span>
            <span className="font-mono">{outputJson.length || 0} Karakter</span>
          </div>
          <textarea
            readOnly
            value={outputJson || 'Klik "Format / Prettify" atau "Minify" untuk melihat hasil.'}
            className="w-full h-80 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              color: outputJson ? 'var(--text-primary)' : 'var(--text-secondary)' 
            }}
          />
        </div>
      </div>
    </div>
  );
}
