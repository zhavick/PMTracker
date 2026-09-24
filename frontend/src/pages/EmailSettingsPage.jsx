import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Server, 
  FileText, 
  Send, 
  Save, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Eye, 
  EyeOff, 
  Code, 
  CheckCircle2,
  Info
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState('smtp'); // 'smtp' | 'templates'
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // SMTP Form State
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    enableSsl: true,
    senderEmail: 'noreply@trackerkerja.com',
    senderName: 'Work Tracker Pro'
  });
  const [showPassword, setShowPassword] = useState(false);

  // Email Templates State
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    subject: '',
    bodyHtml: '',
    isActive: true
  });

  useEffect(() => {
    fetchSmtpConfig();
    fetchTemplates();
  }, []);

  const fetchSmtpConfig = async () => {
    try {
      const res = await axiosClient.get('/api/email-settings/smtp');
      if (res.data?.data) {
        setSmtpConfig(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (err) {
      console.error('Failed to load SMTP settings', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await axiosClient.get('/api/email-settings/templates');
      if (res.data?.data) {
        setTemplates(res.data.data);
        if (res.data.data.length > 0 && !selectedTemplate) {
          selectTemplate(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load email templates', err);
    }
  };

  const selectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    setTemplateForm({
      subject: tmpl.subject || '',
      bodyHtml: tmpl.bodyHtml || '',
      isActive: tmpl.isActive !== false
    });
  };

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage(null);
    try {
      await axiosClient.post('/api/email-settings/smtp', {
        Host: smtpConfig.host,
        Port: smtpConfig.port.toString(),
        Username: smtpConfig.username,
        Password: smtpConfig.password,
        EnableSsl: smtpConfig.enableSsl.toString(),
        SenderEmail: smtpConfig.senderEmail,
        SenderName: smtpConfig.senderName
      });
      setMessage({ type: 'success', text: 'Konfigurasi SMTP berhasil disimpan ke basis data sistem.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan pengaturan SMTP.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setMessage(null);
    try {
      const res = await axiosClient.post('/api/email-settings/test-connection', {
        host: smtpConfig.host,
        port: smtpConfig.port.toString(),
        username: smtpConfig.username,
        password: smtpConfig.password,
        enableSsl: smtpConfig.enableSsl.toString()
      });
      setMessage({ type: 'success', text: res.data?.message || 'Koneksi ke host server SMTP berhasil diverifikasi!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal tersambung ke server SMTP. Periksa host, port, atau kredensial.' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setSaveLoading(true);
    setMessage(null);
    try {
      await axiosClient.put(`/api/email-settings/templates/${selectedTemplate.id}`, {
        ...selectedTemplate,
        subject: templateForm.subject,
        bodyHtml: templateForm.bodyHtml,
        isActive: templateForm.isActive
      });
      setMessage({ type: 'success', text: `Template "${selectedTemplate.name}" berhasil diperbarui.` });
      fetchTemplates();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Gagal menyimpan template email.' });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <Mail className="w-7 h-7 text-indigo-500" />
            Integrasi Server Email (SMTP)
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Konfigurasi koneksi email keluar (outgoing SMTP) dan personalisasi 7 template email notifikasi
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('smtp')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'smtp'
              ? 'text-white shadow-sm'
              : 'hover:bg-slate-500/10'
          }`}
          style={{
            backgroundColor: activeTab === 'smtp' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'smtp' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          <Server className="w-4 h-4" />
          Konfigurasi SMTP
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'templates'
              ? 'text-white shadow-sm'
              : 'hover:bg-slate-500/10'
          }`}
          style={{
            backgroundColor: activeTab === 'templates' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'templates' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          <FileText className="w-4 h-4" />
          7 Template Notifikasi
        </button>
      </div>

      {/* Alerts */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-medium ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: SMTP Config */}
      {activeTab === 'smtp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div 
            className="lg:col-span-2 rounded-2xl border p-6 shadow-sm space-y-6"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Server className="w-4 h-4 text-indigo-500" />
              Parameter Server Mail Outbound
            </h2>

            <form onSubmit={handleSaveSmtp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Host Server SMTP *
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    placeholder="Contoh: smtp.gmail.com atau mail.domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Port *
                  </label>
                  <input
                    type="number"
                    required
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Username / Akun SMTP
                  </label>
                  <input
                    type="text"
                    value={smtpConfig.username}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                    placeholder="user@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Password / App Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={smtpConfig.password}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Alamat Email Pengirim (From)
                  </label>
                  <input
                    type="email"
                    required
                    value={smtpConfig.senderEmail}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, senderEmail: e.target.value })}
                    placeholder="noreply@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nama Pengirim (Display Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpConfig.senderName}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, senderName: e.target.value })}
                    placeholder="Work Tracker Pro Support"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="enableSsl"
                  checked={smtpConfig.enableSsl}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, enableSsl: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="enableSsl" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Gunakan Enkripsi TLS / SSL Aman (Direkomendasikan untuk Port 587 dan 465)
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold hover:bg-slate-500/10 transition-colors disabled:opacity-50"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <Send className={`w-4 h-4 ${testLoading ? 'animate-pulse' : ''}`} />
                  {testLoading ? 'Menguji Koneksi...' : 'Uji Koneksi Soket'}
                </button>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Save className="w-4 h-4" />
                  {saveLoading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
              </div>
            </form>
          </div>

          {/* Guide Card */}
          <div 
            className="rounded-2xl border p-6 shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Info className="w-4 h-4 text-indigo-500" />
              Panduan Konfigurasi SMTP
            </h3>

            <div className="text-xs space-y-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Work Tracker Pro menggunakan <strong>MailKit MimeKit</strong> untuk pengiriman email transaksional dengan protokol TLS 1.3 modern.
              </p>
              
              <div className="p-3 rounded-xl bg-slate-500/10 space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-slate-300">Port Standar:</div>
                <div>• <strong>587</strong>: STARTTLS (Gmail, Office 365)</div>
                <div>• <strong>465</strong>: SMTPS / SSL Murni</div>
                <div>• <strong>25</strong>: Relay lokal internal tanpa autentikasi</div>
              </div>

              <p>
                Jika menggunakan <strong>Gmail</strong>, pastikan menggunakan <em>App Password 16 Digit</em> dari menu Google Account Security.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div 
            className="rounded-2xl border p-4 shadow-sm space-y-2 overflow-y-auto max-h-[600px]"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider px-2 py-1 text-slate-400">
              Daftar 7 Template Sistem
            </h3>

            {templates.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => selectTemplate(tmpl)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 ${
                  selectedTemplate?.id === tmpl.id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'hover:bg-slate-500/5'
                }`}
                style={{
                  backgroundColor: selectedTemplate?.id === tmpl.id ? 'var(--bg-tertiary, rgba(99,102,241,0.08))' : 'var(--bg-primary)',
                  borderColor: selectedTemplate?.id === tmpl.id ? 'var(--accent-primary)' : 'var(--border-color)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    {tmpl.name}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    tmpl.isActive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-500/15 text-slate-500'
                  }`}>
                    {tmpl.isActive ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>
                <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                  {tmpl.subject || 'Subjek belum diisi'}
                </p>
              </button>
            ))}
          </div>

          {/* Template Editor */}
          <div 
            className="lg:col-span-2 rounded-2xl border p-6 shadow-sm space-y-5"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            {selectedTemplate ? (
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                      Editor: {selectedTemplate.name}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-500/10 text-slate-400">
                      Code: {selectedTemplate.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="templateActive"
                      checked={templateForm.isActive}
                      onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="templateActive" className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Status Aktif
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Subjek Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)' }}>
                      Konten Body HTML *
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Tag: {"{{FullName}}"}, {"{{TaskTitle}}"}, {"{{DueDate}}"}, {"{{AppUrl}}"}
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    required
                    value={templateForm.bodyHtml}
                    onChange={(e) => setTemplateForm({ ...templateForm, bodyHtml: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <Save className="w-4 h-4" />
                    {saveLoading ? 'Menyimpan...' : 'Perbarui Template'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                Pilih salah satu template dari daftar sebelah kiri untuk mulai mengedit.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
