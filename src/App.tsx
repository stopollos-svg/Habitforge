import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  Trophy, 
  Plus, 
  CheckCircle2, 
  Target, 
  Users, 
  Settings, 
  Zap,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Sparkles,
  Trash2,
  Calendar as CalendarIcon,
  X,
  ArrowLeft,
  Shield,
  Leaf,
  Sprout,
  TreePine
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  subDays,
  startOfDay,
  parseISO,
  addMonths,
  subMonths,
  getDay,
  startOfWeek
} from 'date-fns';
import { User, Habit, Quest, Guild, LeaderboardEntry } from './types';
import { getHabitSuggestions, getPersonalizedHabitSuggestion } from './services/gemini';

function CommunityScreen({ user }: { user: User }) {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userGuild, setUserGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [gRes, lRes, ugRes] = await Promise.all([
      fetch('/api/guilds'),
      fetch('/api/leaderboard'),
      fetch('/api/user/guild')
    ]);
    const [gData, lData, ugData] = await Promise.all([
      gRes.json(),
      lRes.json(),
      ugRes.json()
    ]);
    setGuilds(gData);
    setLeaderboard(lData);
    setUserGuild(ugData);
    setLoading(false);
  };

  const joinGuild = async (id: number) => {
    const res = await fetch(`/api/guilds/${id}/join`, { method: 'POST' });
    if (res.ok) {
      fetchData();
    }
  };

  if (loading) return <div className="p-8 text-center text-white/40">Loading Community...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8 pb-24"
    >
      {/* User Guild Status */}
      <section className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20">
        <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
          <Users className="text-blue-400" /> Your Guild
        </h2>
        {userGuild ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{userGuild.icon}</div>
              <div>
                <h3 className="font-bold text-lg">{userGuild.name}</h3>
                <p className="text-sm text-white/60">{userGuild.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-400">{userGuild.member_count}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Members</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-white/40 italic">
            You haven't joined a guild yet. Choose one below!
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section className="p-6 rounded-3xl bg-forge-card border border-white/5">
        <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
          <Trophy className="text-yellow-400" /> Global Leaderboard
        </h2>
        <div className="space-y-3">
          {leaderboard.map((entry, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                entry.username === user.username ? 'bg-forge-primary/20 border border-forge-primary/30' : 'bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-6 text-center font-bold ${idx < 3 ? 'text-yellow-400' : 'text-white/20'}`}>
                  {idx + 1}
                </span>
                <div>
                  <div className="font-bold">{entry.username}</div>
                  <div className="text-[10px] text-white/40 uppercase">Level {entry.level}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-forge-primary">{entry.forge_points} FP</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Joinable Guilds */}
      <section>
        <h2 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
          <ChevronRight className="text-blue-400" /> Discover Guilds
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guilds.map(guild => (
            <div 
              key={guild.id} 
              className={`p-6 rounded-3xl bg-forge-card border transition-all ${
                userGuild?.id === guild.id ? 'border-blue-500/50' : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl">{guild.icon}</div>
                <div>
                  <h3 className="font-bold">{guild.name}</h3>
                  <div className="text-[10px] text-white/40 uppercase">{guild.member_count} Members</div>
                </div>
              </div>
              <p className="text-sm text-white/60 mb-6 h-10 line-clamp-2">{guild.description}</p>
              <button 
                onClick={() => joinGuild(guild.id)}
                disabled={userGuild?.id === guild.id}
                className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${
                  userGuild?.id === guild.id 
                    ? 'bg-blue-500/20 text-blue-400 cursor-default' 
                    : 'bg-white/5 hover:bg-white/10 text-white'
                }`}
              >
                {userGuild?.id === guild.id ? 'MEMBER' : 'JOIN GUILD'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function HabitPlant({ habit }: { habit: Habit }) {
  const growthStage = Math.min(Math.floor(habit.streak / 5), 3);
  
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div 
        animate={{ 
          scale: [1, 1.05, 1],
          rotate: habit.streak > 0 ? [-2, 2, -2] : 0
        }}
        transition={{ repeat: Infinity, duration: 3 }}
        className={`relative w-16 h-16 flex items-center justify-center rounded-full bg-white/5 border border-white/10 ${habit.streak > 0 ? 'text-emerald-400' : 'text-white/20'}`}
      >
        {growthStage === 0 && <Sprout size={24} />}
        {growthStage === 1 && <Leaf size={28} />}
        {growthStage === 2 && <TreePine size={32} />}
        {growthStage >= 3 && (
          <div className="relative">
            <TreePine size={40} className="text-emerald-500" />
            <Sparkles size={16} className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" />
          </div>
        )}
        {habit.shield_active === 1 && (
          <div className="absolute -top-1 -left-1 text-blue-400 bg-forge-bg rounded-full p-1 border border-blue-400/30">
            <Shield size={12} fill="currentColor" />
          </div>
        )}
      </motion.div>
      <span className="text-[10px] font-bold uppercase tracking-tighter text-white/40 truncate w-16 text-center">
        {habit.name}
      </span>
    </div>
  );
}

function HabitDetail({ habit, allHabits, quests, onClose, onUpdate, user }: { habit: Habit, allHabits: Habit[], quests: Quest[], onClose: () => void, onUpdate: () => void, user: User }) {
  const [history, setHistory] = useState<{ date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [suggestion, setSuggestion] = useState<{ suggestion: string, reason: string } | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const fetchAISuggestion = async () => {
    setLoadingSuggestion(true);
    const data = await getPersonalizedHabitSuggestion(habit, allHabits, user, quests);
    setSuggestion(data);
    setLoadingSuggestion(false);
  };

  useEffect(() => {
    fetch(`/api/habits/${habit.id}/history`)
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setLoading(false);
      });
  }, [habit.id]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add padding days for the start of the week
    const firstDayOfWeek = getDay(start);
    const padding = Array.from({ length: firstDayOfWeek }).map((_, i) => subDays(start, firstDayOfWeek - i));
    
    return [...padding.map(d => ({ date: d, isPadding: true })), ...days.map(d => ({ date: d, isPadding: false }))];
  }, [currentMonth]);

  const monthStats = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start, end }).length;
    const completionsInMonth = history.filter(h => {
      const d = parseISO(h.date);
      return d >= start && d <= end;
    }).length;
    const rate = daysInMonth > 0 ? Math.round((completionsInMonth / daysInMonth) * 100) : 0;
    return { count: completionsInMonth, rate };
  }, [history, currentMonth]);

  const streakGrowthData = useMemo(() => {
    // Calculate streak growth over the last 30 days
    let currentStreak = 0;
    const data = [];
    const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));
    
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const completed = sortedHistory.some(h => h.date === dateStr);
      
      if (completed) {
        currentStreak++;
      } else {
        currentStreak = 0;
      }
      
      data.push({
        name: format(date, 'MMM dd'),
        streak: currentStreak,
      });
    }
    return data;
  }, [history]);

  const chartData = useMemo(() => {
    // Generate last 14 days of completion data
    return Array.from({ length: 14 }).map((_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const completed = history.some(h => h.date === dateStr);
      return {
        name: format(date, 'MMM dd'),
        completed: completed ? 1 : 0,
      };
    });
  }, [history]);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-[110] bg-forge-bg flex flex-col"
    >
      <header className="p-4 glass border-b border-white/10 flex items-center justify-between">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-xl">{habit.name}</h2>
          <button 
            onClick={fetchAISuggestion}
            disabled={loadingSuggestion}
            className={`p-1.5 rounded-lg bg-forge-primary/20 text-forge-primary hover:bg-forge-primary/30 transition-all ${loadingSuggestion ? 'animate-pulse' : ''}`}
            title="Get AI Suggestion"
          >
            <Sparkles size={16} />
          </button>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* AI Suggestion Display */}
        <AnimatePresence>
          {suggestion && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-forge-primary/10 border border-forge-primary/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                <Sparkles size={40} className="text-forge-primary" />
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-forge-primary text-white">
                  <Zap size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-forge-primary mb-1">AI Suggestion</p>
                  <p className="text-sm text-white/90 font-medium leading-relaxed">{suggestion.suggestion}</p>
                  <p className="text-[10px] text-white/40 mt-2 italic">{suggestion.reason}</p>
                </div>
              </div>
              <button 
                onClick={() => setSuggestion(null)}
                className="absolute top-2 right-2 p-1 text-white/20 hover:text-white/60"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-3xl bg-forge-card border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-forge-primary/10 flex items-center justify-center text-forge-primary">
              <Flame size={24} fill="currentColor" />
            </div>
            <div>
              <div className="text-2xl font-bold">{habit.streak}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Current Streak</div>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-forge-card border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center text-blue-400">
              <Target size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{history.length}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total Forge</div>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-forge-card border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{monthStats.count}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Month Count</div>
            </div>
          </div>
          <div className="p-4 rounded-3xl bg-forge-card border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-400/10 flex items-center justify-center text-purple-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{monthStats.rate}%</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Month Rate</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={async () => {
              if (user.streak_shields > 0) {
                await fetch(`/api/habits/${habit.id}/shield`, { method: 'POST' });
                onUpdate();
              }
            }}
            disabled={user.streak_shields === 0 || habit.shield_active === 1}
            className={`p-4 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all ${
              habit.shield_active === 1 
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' 
                : user.streak_shields > 0 
                  ? 'bg-forge-card border-white/5 hover:border-blue-500/30 text-white/60 hover:text-blue-400' 
                  : 'bg-forge-card border-white/5 opacity-30 grayscale'
            }`}
          >
            <Shield size={20} fill={habit.shield_active === 1 ? "currentColor" : "none"} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {habit.shield_active === 1 ? 'Shield Active' : `Use Shield (${user.streak_shields})`}
            </span>
          </button>
          <button 
            onClick={async () => {
              if (confirm('Are you sure you want to delete this habit?')) {
                await fetch(`/api/habits/${habit.id}`, { method: 'DELETE' });
                onClose();
                onUpdate();
              }
            }}
            className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex flex-col items-center justify-center gap-2"
          >
            <Trash2 size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Delete Habit</span>
          </button>
        </div>

        {/* Streak Visualization */}
        <section>
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-forge-primary" /> Completion Consistency (14d)
          </h3>
          <div className="h-48 w-full bg-forge-card rounded-2xl border border-white/5 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F27D26" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F27D26" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151619', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#F27D26' }}
                />
                <Area 
                  type="stepAfter" 
                  dataKey="completed" 
                  stroke="#F27D26" 
                  fillOpacity={1} 
                  fill="url(#colorCompleted)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Streak Growth Visualization */}
        <section>
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <Flame size={18} className="text-forge-primary" /> Streak Growth (30d)
          </h3>
          <div className="h-48 w-full bg-forge-card rounded-2xl border border-white/5 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={streakGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151619', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#F27D26' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="streak" 
                  stroke="#F27D26" 
                  strokeWidth={3}
                  dot={{ r: 2, fill: '#F27D26', strokeWidth: 0 }}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Calendar View */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-400" /> Completion History
            </h3>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
            >
              Jump to Today
            </button>
          </div>
          <div className="p-6 rounded-3xl bg-forge-card border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="font-display font-bold text-lg text-white/80">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <button 
                onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={`${d}-${i}`} className="text-center text-[10px] font-bold text-white/20">{d}</div>
              ))}
              {calendarDays.map((item, idx) => {
                const day = item.date;
                const dateStr = format(day, 'yyyy-MM-dd');
                const isCompleted = !item.isPadding && history.some(h => h.date === dateStr);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={idx}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all ${
                      item.isPadding 
                        ? 'opacity-0 pointer-events-none'
                        : isCompleted 
                          ? 'bg-forge-primary text-white font-bold shadow-lg shadow-forge-primary/20' 
                          : isToday 
                            ? 'border border-forge-primary text-forge-primary' 
                            : 'bg-white/5 text-white/20'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'community'>('dashboard');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState({ name: '', category: 'Health' });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchHabits();
    fetchQuests();
  }, []);

  const fetchUserData = async () => {
    const res = await fetch('/api/user');
    const data = await res.json();
    setUser(data);
  };

  const fetchHabits = async () => {
    const res = await fetch('/api/habits');
    const data = await res.json();
    setHabits(data);
  };

  const fetchQuests = async () => {
    const res = await fetch('/api/quests');
    const data = await res.json();
    setQuests(data);
  };

  const completeQuest = async (id: number) => {
    const res = await fetch(`/api/quests/${id}/complete`, { method: 'POST' });
    if (res.ok) {
      fetchQuests();
      fetchUserData();
    }
  };

  const buyShield = async () => {
    const res = await fetch('/api/users/buy-shield', { method: 'POST' });
    if (res.ok) {
      fetchUserData();
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name) return;

    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHabit),
    });

    setNewHabit({ name: '', category: 'Health' });
    setIsAddingHabit(false);
    fetchHabits();
  };

  const completeHabit = async (id: number) => {
    const res = await fetch(`/api/habits/${id}/complete`, { method: 'POST' });
    if (res.ok) {
      fetchHabits();
      fetchUserData();
    }
  };

  const deleteHabit = async (id: number) => {
    await fetch(`/api/habits/${id}`, { method: 'DELETE' });
    fetchHabits();
  };

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    const habitNames = habits.map(h => h.name);
    const data = await getHabitSuggestions(habitNames);
    setSuggestions(data);
    setLoadingSuggestions(false);
  };

  if (!user) return <div className="flex items-center justify-center h-screen">Loading Forge...</div>;

  const xpProgress = (user.xp / (user.level * 100)) * 100;

  return (
    <div className="min-h-screen pb-24">
      {/* Header / XP Bar */}
      <header className="sticky top-0 z-50 p-4 glass border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full forge-gradient flex items-center justify-center font-display font-bold text-lg">
              {user.username[0]}
            </div>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight">HabitForge</h1>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span>LVL {user.level}</span>
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    className="h-full forge-gradient"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-forge-primary">
              <Zap size={18} fill="currentColor" />
              <span className="font-bold">{user.forge_points}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-8">
        {activeTab === 'dashboard' ? (
          <>
            {/* Habit Garden Section */}
            <section className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl flex items-center gap-2">
                  <Leaf className="text-emerald-400" /> Habit Garden
                </h2>
                <div className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest">
                  {habits.length} Plants Growing
                </div>
              </div>
              <div className="flex flex-wrap gap-6 justify-center">
                {habits.map(habit => (
                  <button key={habit.id} onClick={() => setSelectedHabit(habit)}>
                    <HabitPlant habit={habit} />
                  </button>
                ))}
                {habits.length === 0 && (
                  <div className="py-8 text-white/20 italic text-sm">Your garden is empty. Forge a habit to plant a seed.</div>
                )}
              </div>
            </section>

            {/* Daily Forge Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-2xl flex items-center gap-2">
                  <Flame className="text-forge-primary" /> The Daily Forge
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={buyShield}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-colors"
                  >
                    <Shield size={14} /> Buy Shield (50 FP)
                  </button>
                  <button 
                    onClick={() => setIsAddingHabit(true)}
                    className="p-2 rounded-full bg-forge-primary text-white hover:scale-105 transition-transform"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {habits.map((habit) => {
                    const isCompletedToday = habit.last_completed === new Date().toISOString().split('T')[0];
                    return (
                      <motion.div
                        key={habit.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => setSelectedHabit(habit)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                          isCompletedToday 
                            ? 'bg-forge-primary/10 border-forge-primary/30' 
                            : 'bg-forge-card border-white/5 hover:border-white/20'
                        }`}
                      >
                        {habit.shield_active === 1 && (
                          <div className="absolute top-0 right-0 p-1 bg-blue-500/20 text-blue-400 rounded-bl-lg">
                            <Shield size={12} fill="currentColor" />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isCompletedToday ? 'bg-forge-primary text-white' : 'bg-white/5 text-white/40'}`}>
                              <Target size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold group-hover:text-forge-primary transition-colors">{habit.name}</h3>
                              <p className="text-xs text-white/40 uppercase tracking-wider">{habit.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-forge-primary font-bold">
                              <Flame size={14} fill="currentColor" />
                              <span>{habit.streak}</span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                completeHabit(habit.id);
                              }}
                              disabled={isCompletedToday}
                              className={`p-2 rounded-xl transition-colors ${
                                isCompletedToday 
                                  ? 'text-forge-primary' 
                                  : 'text-white/20 hover:text-white/60'
                              }`}
                            >
                              <CheckCircle2 size={28} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHabit(habit.id);
                              }}
                              className="p-2 text-white/10 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </section>

            {/* Daily Quests Section */}
            <section>
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-400" /> Daily Quests
              </h2>
              <div className="space-y-3">
                {quests.map(quest => (
                  <div 
                    key={quest.id} 
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      quest.completed 
                        ? 'bg-yellow-400/5 border-yellow-400/20 opacity-60' 
                        : 'bg-forge-card border-white/5'
                    }`}
                  >
                    <div>
                      <h4 className={`font-bold ${quest.completed ? 'text-yellow-400/60 line-through' : 'text-white'}`}>
                        {quest.title}
                      </h4>
                      <p className="text-xs text-white/40">{quest.description}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] font-bold text-forge-primary">+{quest.reward_xp} XP</span>
                        <span className="text-[10px] font-bold text-yellow-500">+{quest.reward_fp} FP</span>
                      </div>
                    </div>
                    {!quest.completed && (
                      <button 
                        onClick={() => completeQuest(quest.id)}
                        className="px-4 py-2 rounded-xl bg-yellow-400/10 text-yellow-400 text-xs font-bold hover:bg-yellow-400/20 transition-colors"
                      >
                        CLAIM
                      </button>
                    )}
                    {quest.completed === 1 && (
                      <div className="text-yellow-400"><CheckCircle2 size={20} /></div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* AI Suggestions */}
            <section className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display font-bold text-xl flex items-center gap-2">
                    <Sparkles className="text-indigo-400" /> AI Personalization
                  </h2>
                  <p className="text-sm text-white/60">Tailored habits to optimize your lifestyle</p>
                </div>
                <button 
                  onClick={fetchSuggestions}
                  disabled={loadingSuggestions}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loadingSuggestions ? 'Analyzing...' : 'Refresh Suggestions'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suggestions.length > 0 ? (
                  suggestions.map((s, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{s.category}</div>
                      <h4 className="font-bold">{s.name}</h4>
                      <p className="text-xs text-white/60 leading-relaxed">{s.reason}</p>
                      <button 
                        onClick={() => {
                          setNewHabit({ name: s.name, category: s.category });
                          setIsAddingHabit(true);
                        }}
                        className="w-full mt-2 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold hover:bg-indigo-500/30 transition-colors"
                      >
                        ADD HABIT
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-white/40 italic">
                    Tap refresh to get AI-powered habit suggestions based on your profile.
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <CommunityScreen user={user} />
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md glass rounded-full p-2 flex items-center justify-around shadow-2xl">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`p-3 transition-colors ${activeTab === 'dashboard' ? 'text-forge-primary' : 'text-white/40 hover:text-white'}`}
        >
          <TrendingUp size={24} />
        </button>
        <button className="p-3 text-white/40 hover:text-white transition-colors"><Target size={24} /></button>
        <button 
          onClick={() => setIsAddingHabit(true)}
          className="p-4 rounded-full forge-gradient text-white shadow-lg -translate-y-4"
        >
          <Plus size={28} />
        </button>
        <button 
          onClick={() => setActiveTab('community')}
          className={`p-3 transition-colors ${activeTab === 'community' ? 'text-forge-primary' : 'text-white/40 hover:text-white'}`}
        >
          <Users size={24} />
        </button>
        <button className="p-3 text-white/40 hover:text-white transition-colors"><Settings size={24} /></button>
      </nav>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {isAddingHabit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingHabit(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-forge-card border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="font-display font-bold text-2xl mb-6">Forge New Habit</h2>
              <form onSubmit={handleAddHabit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Habit Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    placeholder="e.g., Morning Run"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-forge-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Health', 'Growth', 'Mindfulness', 'Work'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewHabit({ ...newHabit, category: cat })}
                        className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                          newHabit.category === cat 
                            ? 'bg-forge-primary border-forge-primary text-white' 
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 rounded-2xl forge-gradient font-display font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform"
                >
                  FORGE HABIT
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Habit Detail Modal */}
      <AnimatePresence>
        {selectedHabit && (
          <HabitDetail 
            habit={selectedHabit} 
            allHabits={habits}
            quests={quests}
            user={user}
            onClose={() => setSelectedHabit(null)} 
            onUpdate={() => {
              fetchHabits();
              fetchUserData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
