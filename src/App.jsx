import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithCustomToken, 
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { 
  Users, 
  Calendar as CalendarIcon, 
  CreditCard, 
  Settings, 
  LogOut, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Palette,
  Type,
  Image as ImageIcon,
  LogIn,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  Edit2,
  Save,
  Trash2
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAetDJOflz9cQVuE3ywIfnOgEWXpd2jOPI",
  authDomain: "trainerflow-87fc9.firebaseapp.com",
  projectId: "trainerflow-87fc9",
  storageBucket: "trainerflow-87fc9.firebasestorage.app",
  messagingSenderId: "458763590114",
  appId: "1:458763590114:web:4f8c164935be1a25e4c1bb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'trainer-flow-pro';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({
    appName: 'TrainerFlow',
    logoUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100&h=100&fit=crop',
    primaryColor: '#3b82f6',
    accentColor: '#10b981'
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) { console.error("Error Auth:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const baseRef = doc(db, 'artifacts', appId, 'users', user.uid, 'config', 'settings');
    const unsubS = onSnapshot(baseRef, d => d.exists() && setSettings(d.data()));
    const unsubSt = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'students'), s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubCl = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), s => setClasses(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPy = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'payments'), s => setPayments(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubS(); unsubSt(); unsubCl(); unsubPy(); };
  }, [user]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-white"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div></div>;

  // PANTALLA DE LOGIN LIMPIA
  if (!user || user.isAnonymous) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 shadow-2xl">
          <div className="flex justify-center mb-8 text-blue-500">
            <Users size={80} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-black text-white mb-10 tracking-tighter uppercase">{settings.appName}</h1>
          <button 
            onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} 
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-black py-5 rounded-2xl hover:bg-slate-200 transition active:scale-95 shadow-xl uppercase text-sm"
          >
            <LogIn size={18} /> Ingresar con Google
          </button>
        </div>
      </div>
    );
  }

  const views = {
    dashboard: <DashboardView students={students} classes={classes} settings={settings} payments={payments} />,
    students: <StudentsView students={students} user={user} />,
    calendar: <CalendarView classes={classes} students={students} user={user} />,
    payments: <PaymentsView students={students} payments={payments} user={user} />,
    settings: <SettingsView settings={settings} user={user} />
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <aside className="w-20 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all">
        <div className="p-6 flex items-center gap-3">
          <img src={settings.logoUrl} className="w-10 h-10 rounded-xl object-cover shadow-lg" alt="Logo" />
          <span className="hidden md:block font-black text-xl tracking-tighter uppercase" style={{color: settings.primaryColor}}>{settings.appName}</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem Icon={Users} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem Icon={Users} label="Alumnos" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
          <NavItem Icon={CalendarIcon} label="Agenda" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <NavItem Icon={CreditCard} label="Pagos" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
          <NavItem Icon={Settings} label="Ajustes" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={() => signOut(auth)} className="flex items-center gap-3 w-full p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition">
            <LogOut size={20} /> <span className="hidden md:block font-bold">Salir</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {views[activeTab]}
      </main>
    </div>
  );
};

const NavItem = ({ Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all active:scale-95 ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
    <Icon size={22} />
    <span className="hidden md:block font-semibold">{label}</span>
  </button>
);

const DashboardView = ({ students, classes, settings, payments }) => {
  const today = new Date().toISOString().split('T')[0];
  const stats = [
    { label: 'Alumnos Activos', val: students.length, color: 'bg-blue-500', Icon: Users },
    { label: 'Clases para hoy', val: classes.filter(c => c.date === today).length, color: 'bg-purple-500', Icon: Clock },
    { label: 'Ingresos Mensuales', val: `$${payments.reduce((a, b) => a + Number(b.amount || 0), 0)}`, color: 'bg-emerald-500', Icon: CreditCard }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4">
      <header>
        <h1 className="text-4xl font-black tracking-tighter uppercase">Panel de Control</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gestión integral de {settings.appName}.</p>
      </header>
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:scale-[1.02] transition-all">
            <div className={`${s.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg`}><s.Icon size={24} /></div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{s.label}</p>
            <p className="text-3xl font-black mt-1">{s.val}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-xl mb-4 flex items-center gap-2 tracking-tight uppercase"><ClipboardList className="text-blue-500" /> Próximas Clases</h3>
        <div className="space-y-3">
          {classes.filter(c => c.date >= today).slice(0, 5).map(c => {
            const s = students.find(st => st.id === c.studentId);
            return (
              <div key={c.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black uppercase">{s?.name?.[0] || '?'}</div>
                   <div>
                     <p className="font-bold">{s?.name || 'Alumno sin nombre'}</p>
                     <p className="text-xs text-slate-500 font-bold uppercase">{c.date} • {c.time} hs</p>
                   </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'attended' ? 'bg-green-100 text-green-600' : c.status === 'missed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {c.status || 'pendiente'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StudentsView = ({ students, user }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', objective: '', height: '', weight: '', disability: '', notes: '' });

  const save = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    
    if (editingId) {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'students', editingId), form);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'students'), { ...form, createdAt: new Date().toISOString() });
    }
    
    setForm({ name: '', phone: '', objective: '', height: '', weight: '', disability: '', notes: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (student) => {
    setForm(student);
    setEditingId(student.id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase">Mis Alumnos</h2>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition">
            <Plus size={20} /> NUEVO ALUMNO
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={save} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-blue-500/20 shadow-xl space-y-4 animate-in zoom-in-95">
          <h3 className="font-black text-xl uppercase tracking-tighter">{editingId ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input required placeholder="Nombre Completo" className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl outline-none focus:ring-2 ring-blue-500 transition-all font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input placeholder="Objetivo (ej: Hipertrofia)" className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl outline-none focus:ring-2 ring-blue-500 transition-all" value={form.objective} onChange={e => setForm({...form, objective: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Altura (cm)" className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl outline-none" value={form.height} onChange={e => setForm({...form, height: e.target.value})} />
              <input type="number" placeholder="Peso (kg)" className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl outline-none" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} />
            </div>
            <input placeholder="Discapacidad / Alergias" className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl outline-none" value={form.disability} onChange={e => setForm({...form, disability: e.target.value})} />
          </div>
          <textarea placeholder="Notas adicionales..." className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-xl outline-none h-24" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          <div className="flex gap-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black uppercase shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"><Save size={20} /> {editingId ? 'Actualizar' : 'Guardar'}</button>
            <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); setForm({ name: '', phone: '', objective: '', height: '', weight: '', disability: '', notes: '' }); }} className="px-8 py-4 text-slate-500 font-bold uppercase hover:text-slate-700">Cancelar</button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map(s => (
          <div key={s.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-slate-100 dark:bg-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-blue-500 uppercase">{s.name[0]}</div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(s)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'students', s.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">{s.name}</h3>
            <p className="text-blue-500 font-bold text-sm mb-4 uppercase tracking-tighter">{s.objective || 'Sin objetivo'}</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center border border-slate-100 dark:border-slate-800">📏 {s.height || '--'} cm</div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-center border border-slate-100 dark:border-slate-800">⚖️ {s.weight || '--'} kg</div>
            </div>
            {s.disability && (
              <div className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-950/30 text-red-500 p-2 rounded-lg mb-4 font-bold border border-red-100 dark:border-red-900/50"><AlertCircle size={14} /> {s.disability}</div>
            )}
            <p className="text-sm text-slate-500 italic leading-relaxed">"{s.notes || 'Sin notas.'}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const CalendarView = ({ classes, students, user }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ studentId: '', time: '09:00' });

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const changeMonth = (offset) => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + offset);
    setViewDate(d);
  };

  const addClass = async () => {
    if (!form.studentId) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'classes'), { ...form, date: selectedDay, status: 'pending' });
    setShowAdd(false);
  };

  const setAttendance = async (id, status) => {
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', id), { status });
  };

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const firstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const days = [];
  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  for (let i = 0; i < firstDayOfMonth(y, m); i++) days.push(null);
  for (let i = 1; i <= daysInMonth(y, m); i++) days.push(i);

  const classesOfDay = classes.filter(c => c.date === selectedDay);

  return (
    <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto animate-in fade-in">
      <div className="lg:col-span-3 space-y-6">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">{monthNames[m]} {y}</h2>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90"><ChevronLeft /></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90"><ChevronRight /></button>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-7 mb-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              if (day === null) return <div key={idx} />;
              const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDay === dateStr;
              const hasClasses = classes.some(c => c.date === dateStr);
              return (
                <button 
                  key={idx} 
                  onClick={() => setSelectedDay(dateStr)}
                  className={`relative h-14 rounded-xl flex flex-col items-center justify-center font-bold transition-all active:scale-90 ${
                    isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {day}
                  {hasClasses && !isSelected && <div className="absolute bottom-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl h-full border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Día seleccionado</p>
              <h3 className="text-2xl font-black">{selectedDay.split('-').reverse().join('/')}</h3>
            </div>
            <button onClick={() => setShowAdd(true)} className="p-3 bg-blue-600 rounded-2xl hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-500/20"><Plus size={24}/></button>
          </div>
          {showAdd && (
            <div className="bg-slate-800 p-6 rounded-2xl mb-6 space-y-4 animate-in zoom-in-95 border border-slate-700">
              <select className="w-full bg-slate-700 p-3 rounded-xl outline-none" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})}>
                <option value="">Elegir Alumno</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="time" className="w-full bg-slate-700 p-3 rounded-xl outline-none font-bold" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={addClass} className="flex-1 bg-blue-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Agendar</button>
                <button onClick={() => setShowAdd(false)} className="px-4 py-3 text-slate-400 text-[10px] font-black uppercase hover:text-white transition-colors">Cerrar</button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {classesOfDay.sort((a,b) => a.time.localeCompare(b.time)).map(c => {
              const s = students.find(st => st.id === c.studentId);
              return (
                <div key={c.id} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-blue-400 font-black flex items-center gap-1 text-sm tracking-widest"><Clock size={14}/> {c.time} hs</span>
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'classes', c.id))} className="text-slate-600 hover:text-red-400 transition-colors"><XCircle size={16}/></button>
                  </div>
                  <p className="font-bold text-lg mb-4">{s?.name || '---'}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setAttendance(c.id, 'attended')} className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 ${c.status === 'attended' ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400'}`}>Vino</button>
                    <button onClick={() => setAttendance(c.id, 'missed')} className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 ${c.status === 'missed' ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-700 text-slate-400'}`}>Faltó</button>
                  </div>
                </div>
              );
            })}
            {classesOfDay.length === 0 && <p className="text-slate-500 italic text-center py-20 font-medium tracking-tight">No hay clases registradas.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentsView = ({ students, payments, user }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({ studentId: '', amount: '', status: 'paid', month: currentMonth, year: currentYear });
  
  const add = async (e) => {
    e.preventDefault();
    if (!form.studentId) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'payments'), { ...form, date: new Date().toISOString() });
    setForm({ ...form, amount: '', studentId: '' });
  };
  
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in">
      <h2 className="text-3xl font-black italic tracking-tighter uppercase">Gestión de Pagos</h2>
      <form onSubmit={add} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 grid md:grid-cols-5 gap-4 items-end shadow-sm">
        <div className="col-span-2 md:col-span-1">
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Periodo</label>
          <div className="flex gap-2">
            <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none text-xs font-bold" value={form.month} onChange={e => setForm({...form, month: Number(e.target.value)})}>
              {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none text-xs font-bold" value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Alumno</label>
          <select required className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none font-bold" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})}>
            <option value="">Elegir alumno</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Monto ($)</label>
          <input required type="number" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none font-bold" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Estado</label>
          <select className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl outline-none font-bold" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="paid">Pagado</option>
            <option value="pending">Adeudado</option>
          </select>
        </div>
        <button type="submit" className="bg-emerald-600 text-white py-3.5 rounded-xl font-black uppercase text-sm shadow-lg hover:bg-emerald-700 transition active:scale-95 shadow-emerald-500/20 tracking-widest">Registrar</button>
      </form>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Mes / Año</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Alumno</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Monto</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.sort((a,b) => b.date.localeCompare(a.date)).map(p => {
                const s = students.find(st => st.id === p.studentId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-black text-xs uppercase tracking-tighter text-slate-500">{months[(p.month || 1) - 1]} {p.year}</td>
                    <td className="p-4 font-black uppercase tracking-tight">{s?.name || '---'}</td>
                    <td className="p-4 font-black text-emerald-600 text-lg">${p.amount}</td>
                    <td className="p-4"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${p.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{p.status === 'paid' ? 'Cobrado' : 'Adeuda'}</span></td>
                    <td className="p-4 text-right">
                      <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'payments', p.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ settings, user }) => {
  const [temp, setTemp] = useState(settings);
  const save = async () => {
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'config', 'settings'), temp);
  };
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in">
      <h2 className="text-3xl font-black italic uppercase tracking-tighter">Personalización</h2>
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest"><Type size={14}/> Nombre Comercial</label>
          <input className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none font-black ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all uppercase tracking-tighter" value={temp.appName} onChange={e => setTemp({...temp, appName: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest"><ImageIcon size={14}/> URL del Logo</label>
          <input className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-blue-500 transition-all" value={temp.logoUrl} onChange={e => setTemp({...temp, logoUrl: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest"><Palette size={14}/> Color Primario</label>
            <div className="flex gap-2 items-center">
              <input type="color" className="w-full h-12 rounded-xl cursor-pointer bg-transparent border-none" value={temp.primaryColor} onChange={e => setTemp({...temp, primaryColor: e.target.value})} />
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase">{temp.primaryColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest"><Palette size={14}/> Color Acento</label>
            <div className="flex gap-2 items-center">
              <input type="color" className="w-full h-12 rounded-xl cursor-pointer bg-transparent border-none" value={temp.accentColor} onChange={e => setTemp({...temp, accentColor: e.target.value})} />
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase">{temp.accentColor}</span>
            </div>
          </div>
        </div>
        <button onClick={save} className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2">
          <Save size={20} /> Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default App;