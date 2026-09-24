import React, { useState } from 'react';
import { 
  Database, 
  Sparkles, 
  Minimize2, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Download, 
  Trash2, 
  FileCode, 
  Check 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

const SQL_DIALECTS = [
  { id: 'standard', name: 'Standard SQL (ANSI)' },
  { id: 'mysql', name: 'MySQL 8.x' },
  { id: 'postgres', name: 'PostgreSQL' },
  { id: 'tsql', name: 'SQL Server (T-SQL)' },
  { id: 'oracle', name: 'Oracle PL/SQL' },
  { id: 'sqlite', name: 'SQLite 3' },
  { id: 'bigquery', name: 'Google BigQuery' },
  { id: 'snowflake', name: 'Snowflake' },
  { id: 'redshift', name: 'Amazon Redshift' },
  { id: 'db2', name: 'IBM DB2' },
  { id: 'mariadb', name: 'MariaDB' },
  { id: 'cockroach', name: 'CockroachDB' },
  { id: 'couchbase', name: 'Couchbase N1QL' },
  { id: 'spark', name: 'Apache Spark SQL' },
  { id: 'trino', name: 'Trino / Presto' }
];

const SAMPLE_QUERY = `select p.id as project_id, p.name as project_name, count(t.id) as total_tasks, sum(case when t.status = 2 then 1 else 0 end) as completed_tasks, round(avg(t.progress), 2) as avg_progress, coalesce(sum(s.duration), 0) as total_seconds_spent from projects p left join tasks t on t.project_id = p.id left join sessions s on s.task_id = t.id where p.status = 0 and p.created_at >= '2026-01-01' group by p.id, p.name having count(t.id) > 0 order by avg_progress desc, total_seconds_spent desc limit 20;`;

export default function SqlToolsPage() {
  const [dialect, setDialect] = useState('mysql');
  const [inputSql, setInputSql] = useState(SAMPLE_QUERY);
  const [outputSql, setOutputSql] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFormat = async () => {
    if (!inputSql.trim()) return;
    setLoading(true);
    setValidationResult(null);
    try {
      const res = await axiosClient.post('/api/sqltools/format', {
        sql: inputSql,
        dialect,
        uppercaseKeywords: true,
        indentSpaces: 4
      });
      if (res.data?.data) {
        setOutputSql(res.data.data.formattedSql);
      }
    } catch (err) {
      console.error('Format failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMinify = async () => {
    if (!inputSql.trim()) return;
    setLoading(true);
    setValidationResult(null);
    try {
      const res = await axiosClient.post('/api/sqltools/minify', {
        sql: inputSql
      });
      if (res.data?.data?.minifiedSql) {
        setOutputSql(res.data.data.minifiedSql);
      }
    } catch (err) {
      console.error('Minify failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!inputSql.trim()) return;
    setLoading(true);
    try {
      const res = await axiosClient.post('/api/sqltools/validate', {
        sql: inputSql,
        dialect
      });
      if (res.data?.data) {
        setValidationResult(res.data.data);
      }
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = outputSql || inputSql;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = outputSql || inputSql;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_${dialect}_${new Date().toISOString().split('T')[0]}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = () => {
    setInputSql(SAMPLE_QUERY);
    setOutputSql('');
    setValidationResult(null);
  };

  const handleClear = () => {
    setInputSql('');
    setOutputSql('');
    setValidationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              SQL Beautifier & Query Tools
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600">
              15+ Dialek Database
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Format kueri SQL terstruktur, kompresi minifikasi, dan validator sintaks kueri (FSD 5.15).
          </p>
        </div>

        {/* Dialect Selector */}
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-indigo-500" />
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value)}
            className="px-3.5 py-2 rounded-xl border text-xs font-bold"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            {SQL_DIALECTS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div 
        className="p-3.5 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFormat}
            disabled={loading || !inputSql.trim()}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Beautify / Format</span>
          </button>

          <button
            onClick={handleMinify}
            disabled={loading || !inputSql.trim()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Minify</span>
          </button>

          <button
            onClick={handleValidate}
            disabled={loading || !inputSql.trim()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Validasi Sintaks</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleLoadSample}
            className="px-3 py-1.5 rounded-xl border text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            title="Muat Contoh Kueri SQL Kompleks"
          >
            Sample Query
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
            title="Unduh File .sql"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            className="p-2 rounded-xl border hover:bg-rose-500/10 text-rose-500 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
            title="Kosongkan Buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation Alert Result (if checked) */}
      {validationResult && (
        <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-fade-in ${
          validationResult.isValid 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
        }`}>
          <div className="flex items-center space-x-2 font-bold text-sm">
            {validationResult.isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{validationResult.message}</span>
          </div>

          {validationResult.errors?.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">
              {validationResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          {validationResult.warnings?.length > 0 && (
            <div className="pt-1 text-amber-600 dark:text-amber-400">
              {validationResult.warnings.map((warn, i) => (
                <div key={i} className="flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editors Grid (Left: Raw / Input, Right: Formatted / Output) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input Panel */}
        <div 
          className="rounded-3xl border shadow-sm flex flex-col overflow-hidden"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div 
            className="px-5 py-3 border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <span>Kueri SQL Masukan (Raw Input)</span>
            <span className="font-mono">{inputSql.length} Karakter</span>
          </div>
          <textarea
            value={inputSql}
            onChange={(e) => setInputSql(e.target.value)}
            placeholder="Tuliskan atau tempelkan kueri SQL di sini..."
            className="w-full h-80 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none transition-colors"
            style={{ 
              backgroundColor: 'transparent', 
              color: 'var(--text-primary)' 
            }}
          />
        </div>

        {/* Output Panel */}
        <div 
          className="rounded-3xl border shadow-sm flex flex-col overflow-hidden"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <div 
            className="px-5 py-3 border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <span>Hasil Format ({SQL_DIALECTS.find(d => d.id === dialect)?.name})</span>
            <span className="font-mono">{outputSql.length || 0} Karakter</span>
          </div>
          <textarea
            readOnly
            value={outputSql || 'Klik tombol "Beautify / Format" untuk melihat hasil kueri terstruktur.'}
            className="w-full h-80 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none transition-colors"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              color: outputSql ? 'var(--text-primary)' : 'var(--text-secondary)' 
            }}
          />
        </div>
      </div>
    </div>
  );
}
