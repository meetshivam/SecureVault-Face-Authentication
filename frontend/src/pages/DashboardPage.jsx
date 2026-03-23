import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, FileText, Activity, UserCircle, Plus, Trash2, Eye, EyeOff, Upload, Download, Shield, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

/* ─── Tab button ─── */
const Tab = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${active ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
    <Icon className="w-4 h-4" />{label}
  </button>
);

/* ─── Card wrapper ─── */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 ${className}`}>
    {children}
  </div>
);

/* ════════════════════════ VAULT TAB ════════════════════════ */
function VaultTab() {
  const [passwords, setPasswords] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ site: '', username: '', password: '', url: '', notes: '' });
  const [revealed, setRevealed] = useState({});
  const [revealedPass, setRevealedPass] = useState({});

  const load = async () => { try { const d = await api.getPasswords(); setPasswords(d.passwords || []); } catch {} };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try { await api.addPassword(form); setForm({ site: '', username: '', password: '', url: '', notes: '' }); setShowAdd(false); load(); } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this password?')) return;
    try { await api.deletePassword(id); load(); } catch {}
  };

  const handleReveal = async (id) => {
    if (revealed[id]) { setRevealed(p => ({ ...p, [id]: false })); return; }
    try { const d = await api.viewPassword(id); setRevealedPass(p => ({ ...p, [id]: d.password })); setRevealed(p => ({ ...p, [id]: true })); } catch {}
  };

  const inputClass = 'px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Password Vault</h2>
        <motion.button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-bold shadow-lg"
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
        >
          <Plus className="w-4 h-4" />Add
        </motion.button>
      </div>

      {showAdd && (
        <Card className="mb-6">
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Site name *" required value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} className={inputClass} />
            <input placeholder="Username *" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={inputClass} />
            <input placeholder="Password *" required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
            <input placeholder="URL" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className={inputClass} />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={`sm:col-span-2 ${inputClass}`} />
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-bold shadow-md">Save</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 border border-gray-200 text-gray-500 rounded-full text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      {passwords.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No passwords saved yet.</p>
      ) : (
        <div className="space-y-3">
          {passwords.map(p => (
            <Card key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{p.site}</h3>
                <p className="text-gray-500 text-xs truncate">{p.username}</p>
                {revealed[p.id] && <p className="text-blue-600 text-xs mt-1 font-mono break-all">{revealedPass[p.id]}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleReveal(p.id)} className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                  {revealed[p.id] ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-gray-50 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ PDF VAULT TAB ════════════════════════ */
function PdfVaultTab() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => { try { const d = await api.vaultList(); setDocs(d.documents || []); } catch {} };
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('auth_type', 'face');
      await api.vaultUpload(fd);
      load();
    } catch {} finally { setUploading(false); }
  };

  const handleAccess = async (doc) => {
    try {
      const d = await api.vaultAccess(doc._id, { auth_type: doc.auth_type });
      if (d.success && d.pdf_data) {
        const bytes = atob(d.pdf_data);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        const blob = new Blob([arr], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try { await api.vaultDelete(id); load(); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">PDF Vault</h2>
        <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform cursor-pointer">
          <Upload className="w-4 h-4" />{uploading ? 'Uploading…' : 'Upload PDF'}
          <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
        </label>
      </div>
      {docs.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No documents in vault.</p>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <Card key={doc._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{doc.filename || doc.original_name}</h3>
                  <p className="text-gray-400 text-xs">{doc.auth_type} auth · {new Date(doc.upload_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleAccess(doc)} className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4 text-blue-600" />
                </button>
                <button onClick={() => handleDelete(doc._id)} className="p-2 rounded-lg bg-gray-50 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ AUDIT TAB ════════════════════════ */
function AuditTab() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    (async () => { try { const d = await api.getAuditLogs(); setLogs(d.logs || []); } catch {} })();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Audit Logs</h2>
      {logs.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No activity recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <Card key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{log.action}</p>
                  <p className="text-gray-400 text-xs truncate">{log.details}</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs flex-shrink-0">{new Date(log.timestamp).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════ PROFILE TAB ════════════════════════ */
function ProfileTab() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editName, setEditName] = useState('');
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try { const d = await api.getProfile(); setProfile(d); setEditName(d.name); } catch {}
    })();
  }, []);

  const handleUpdateName = async () => {
    try { await api.updateProfile({ name: editName }); setMsg('Name updated!'); } catch {}
  };

  const handleResetPw = async (e) => {
    e.preventDefault();
    try { await api.resetPassword(pwForm); setMsg('Password changed!'); setPwForm({ old_password: '', new_password: '' }); }
    catch (err) { setMsg(err.error || 'Failed'); }
  };

  const handleLogout = async () => {
    try { await api.logout(); } catch {} finally { logout(); navigate('/'); }
  };

  const inputClass = 'px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all';

  if (!profile) return <p className="text-gray-400 text-center py-12">Loading profile…</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Profile</h2>
      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
            {profile.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile.name}</p>
            <p className="text-gray-500 text-sm">{profile.email}</p>
          </div>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Face enrolled: {profile.face_enrolled ? '✅ Yes' : '❌ No'}</p>
          <p>Joined: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3 text-sm text-gray-900">Update Name</h3>
        <div className="flex gap-2">
          <input value={editName} onChange={e => setEditName(e.target.value)} className={`flex-1 ${inputClass}`} />
          <button onClick={handleUpdateName} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-bold shadow-md">Save</button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3 text-sm text-gray-900">Change Password</h3>
        <form onSubmit={handleResetPw} className="space-y-3">
          <input type="password" placeholder="Current password" required value={pwForm.old_password}
            onChange={e => setPwForm({ ...pwForm, old_password: e.target.value })} className={`w-full ${inputClass}`} />
          <input type="password" placeholder="New password" required value={pwForm.new_password}
            onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} className={`w-full ${inputClass}`} />
          <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-bold shadow-md">Change Password</button>
        </form>
      </Card>

      {msg && <p className="text-blue-600 text-sm text-center font-medium">{msg}</p>}

      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 text-red-500 rounded-full font-bold text-sm hover:bg-red-50 transition-colors">
        <LogOut className="w-4 h-4" />Logout
      </button>
    </div>
  );
}

/* ════════════════════════ DASHBOARD PAGE ════════════════════════ */
export default function DashboardPage() {
  const [tab, setTab] = useState('vault');
  const { user } = useAuth();

  const tabs = [
    { id: 'vault', label: 'Vault', icon: KeyRound },
    { id: 'pdf', label: 'PDF Vault', icon: FileText },
    { id: 'audit', label: 'Audit Logs', icon: Activity },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Welcome, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name || 'User'}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your vault and security settings.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(t => <Tab key={t.id} icon={t.icon} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />)}
        </div>

        {/* Content */}
        <div className="max-w-4xl">
          {tab === 'vault' && <VaultTab />}
          {tab === 'pdf' && <PdfVaultTab />}
          {tab === 'audit' && <AuditTab />}
          {tab === 'profile' && <ProfileTab />}
        </div>
      </div>
    </div>
  );
}
