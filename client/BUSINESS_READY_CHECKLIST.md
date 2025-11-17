# Business-Ready Frontend Checklist

## Overview
This document outlines all components, styling, and UX improvements needed to make the Adaptive Parsons frontend production-ready.

## Required Dependencies

Add to `client/package.json`:
```json
{
  "dependencies": {
    "recharts": "^2.10.3",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "lucide-react": "^0.294.0",
    "date-fns": "^2.30.0"
  }
}
```

## 1. Branding Tokens & Design System

### Component: `src/theme/tokens.js`
```javascript
export const brandColors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  secondary: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  accent: {
    500: '#8b5cf6',
    600: '#7c3aed',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    600: '#4b5563',
    700: '#374151',
    900: '#111827',
  }
};

export const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
};

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
};
```

### Update: `tailwind.config.js`
```javascript
import { brandColors } from './src/theme/tokens.js';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: brandColors,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

## 2. Clean Navbar Component

### Component: `src/components/Navbar.jsx`
```jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/puzzles', label: 'Puzzles', icon: BookOpen },
    { path: '/progress', label: 'Progress', icon: BarChart3 },
    ...(user?.role === 'instructor' ? [
      { path: '/instructor', label: 'Teacher Panel', icon: Settings },
    ] : []),
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">Adaptive Parsons</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  isActive(path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={() => navigate('/logout')}
                className="p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="space-y-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive(path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-neutral-200 mt-4">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                  <p className="text-xs text-neutral-500 capitalize">{user?.role}</p>
                </div>
                <button
                  onClick={() => { setMobileMenuOpen(false); navigate('/logout'); }}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
```

**Tailwind Classes Used:**
- `bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-50` - Navbar base
- `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` - Responsive container
- `hidden md:flex` - Mobile/desktop visibility
- `bg-primary-50 text-primary-700` - Active state
- `hover:bg-neutral-50` - Hover states

## 3. User Dashboard Component

### Component: `src/pages/Dashboard.jsx`
```jsx
import { useState, useEffect } from 'react';
import { TrendingUp, Target, Award, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPuzzles: 0,
    completedPuzzles: 0,
    currentSkill: 0,
    averageScore: 0,
  });
  const [skillTimeline, setSkillTimeline] = useState([]);

  // Sample skill timeline data structure
  const sampleTimeline = [
    { date: '2024-01-01', skill: 45 },
    { date: '2024-01-08', skill: 48 },
    { date: '2024-01-15', skill: 52 },
    { date: '2024-01-22', skill: 55 },
  ];

  useEffect(() => {
    // Fetch stats and timeline from API
    // setStats(...);
    // setSkillTimeline(sampleTimeline);
  }, []);

  const statCards = [
    {
      label: 'Current Skill',
      value: `${stats.currentSkill}/100`,
      icon: TrendingUp,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      change: '+5%',
    },
    {
      label: 'Puzzles Completed',
      value: `${stats.completedPuzzles}/${stats.totalPuzzles}`,
      icon: Target,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      change: `${Math.round((stats.completedPuzzles / stats.totalPuzzles) * 100)}%`,
    },
    {
      label: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: Award,
      color: 'text-accent-600',
      bgColor: 'bg-accent-50',
      change: '+3%',
    },
    {
      label: 'Time Spent',
      value: '12h 30m',
      icon: Clock,
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-50',
      change: 'This week',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={{ name: 'John Doe', role: 'student' }} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600 mt-2">Welcome back! Here's your learning progress.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className="text-sm font-medium text-secondary-600">{stat.change}</span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-neutral-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Skill Timeline Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Skill Progress</h2>
              <p className="text-sm text-neutral-600 mt-1">Your skill level over time</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={skillTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="skill"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Puzzles */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Puzzles</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                  <div>
                    <p className="font-medium text-neutral-900">Puzzle #{item}</p>
                    <p className="text-sm text-neutral-600">Medium • 2 days ago</p>
                  </div>
                  <span className="px-3 py-1 bg-secondary-100 text-secondary-700 text-xs font-medium rounded-full">
                    85%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recommended Next</h3>
            <div className="space-y-3">
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="font-medium text-primary-900 mb-1">Try a Hard Puzzle</p>
                <p className="text-sm text-primary-700 mb-3">
                  Your skill level suggests you're ready for more challenging puzzles!
                </p>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                  Start Puzzle
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Tailwind Classes Used:**
- `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6` - Responsive grid
- `bg-white rounded-xl shadow-sm border border-neutral-200` - Card styling
- `hover:shadow-md transition-shadow` - Interactive states
- `text-3xl font-bold text-neutral-900` - Typography hierarchy

## 4. Progress Charts - Skill Timeline

### Component: `src/components/SkillTimeline.jsx`
```jsx
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { TrendingUp, Award } from 'lucide-react';

export default function SkillTimeline({ data, showArea = true }) {
  const formattedData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    skill: Math.round(item.skill),
  }));

  const averageSkill = data.length > 0
    ? Math.round(data.reduce((sum, item) => sum + item.skill, 0) / data.length)
    : 0;

  const latestSkill = data.length > 0 ? Math.round(data[data.length - 1].skill) : 0;
  const skillChange = data.length > 1 
    ? Math.round(data[data.length - 1].skill - data[data.length - 2].skill)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-neutral-900">Skill Timeline</h3>
          <p className="text-sm text-neutral-600 mt-1">Track your learning progress over time</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">{latestSkill}</p>
            <p className="text-xs text-neutral-500">Current Skill</p>
          </div>
          <div className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
            skillChange >= 0 ? 'bg-secondary-50 text-secondary-700' : 'bg-red-50 text-red-700'
          }`}>
            <TrendingUp className={`w-4 h-4 ${skillChange < 0 ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium">{Math.abs(skillChange)}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          {showArea ? (
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="skillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'Skill Level', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value) => [`${value}/100`, 'Skill']}
              />
              <Area
                type="monotone"
                dataKey="skill"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#skillGradient)"
              />
            </AreaChart>
          ) : (
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="skill"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-200">
        <div>
          <p className="text-sm text-neutral-600">Average</p>
          <p className="text-lg font-semibold text-neutral-900">{averageSkill}</p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Peak</p>
          <p className="text-lg font-semibold text-neutral-900">
            {Math.max(...data.map(d => d.skill), 0)}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Total Puzzles</p>
          <p className="text-lg font-semibold text-neutral-900">{data.length}</p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Growth</p>
          <p className={`text-lg font-semibold ${skillChange >= 0 ? 'text-secondary-600' : 'text-red-600'}`}>
            {skillChange >= 0 ? '+' : ''}{skillChange}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Tailwind Classes Used:**
- `flex flex-col sm:flex-row` - Responsive flex direction
- `bg-white rounded-xl shadow-sm border` - Card container
- `h-80` - Fixed chart height
- Custom gradients with `bg-*-50` and `text-*-700` color variants

## 5. Teacher Panel - Create/Approve Puzzles

### Component: `src/pages/InstructorPanel.jsx`
```jsx
import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Edit, Trash2, Filter, Download } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function InstructorPanel() {
  const [puzzles, setPuzzles] = useState([
    { id: 1, title: 'Bubble Sort', difficulty: 'medium', status: 'approved', created: '2024-01-15' },
    { id: 2, title: 'Binary Search', difficulty: 'hard', status: 'pending', created: '2024-01-20' },
  ]);
  const [filter, setFilter] = useState('all');

  const statusBadges = {
    approved: 'bg-secondary-100 text-secondary-700 border-secondary-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  const filteredPuzzles = filter === 'all'
    ? puzzles
    : puzzles.filter(p => p.status === filter);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar user={{ name: 'Dr. Smith', role: 'instructor' }} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Puzzle Management</h1>
            <p className="text-neutral-600 mt-2">Create and manage Parsons puzzles</p>
          </div>
          <button className="mt-4 sm:mt-0 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Puzzle</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Filter:</span>
            </div>
            {['all', 'approved', 'pending', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === status
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {status}
              </button>
            ))}
            <button className="ml-auto px-4 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Puzzles Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {filteredPuzzles.map((puzzle) => (
                  <tr key={puzzle.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{puzzle.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        puzzle.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        puzzle.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {puzzle.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadges[puzzle.status]}`}>
                        {puzzle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                      {puzzle.created}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {puzzle.status === 'pending' && (
                          <>
                            <button className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Tailwind Classes Used:**
- `overflow-x-auto` - Horizontal scroll for tables
- `hover:bg-neutral-50 transition-colors` - Row hover effect
- `rounded-full text-xs font-medium` - Badge styling
- `flex items-center justify-end space-x-2` - Action buttons layout

## 6. Export Reports (CSV/PDF)

### Component: `src/utils/reports.js`
```javascript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Export progress data to CSV
 */
export function exportToCSV(data, filename = 'progress-report') {
  const headers = ['Date', 'Puzzle', 'Difficulty', 'Score', 'Skill Before', 'Skill After', 'Time (s)'];
  const rows = data.map(item => [
    format(new Date(item.date), 'yyyy-MM-dd'),
    item.puzzleTitle || 'N/A',
    item.difficulty || 'N/A',
    item.score || 0,
    item.skillBefore || 0,
    item.skillAfter || 0,
    item.timeSpent || 0,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
}

/**
 * Export progress report to PDF
 */
export function exportToPDF(data, userInfo, filename = 'progress-report') {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Adaptive Parsons - Progress Report', 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, 14, 30);
  doc.text(`Student: ${userInfo.name}`, 14, 36);
  doc.text(`Skill Level: ${userInfo.skill || 0}/100`, 14, 42);

  // Summary Stats
  const totalPuzzles = data.length;
  const avgScore = data.length > 0
    ? Math.round(data.reduce((sum, item) => sum + (item.score || 0), 0) / data.length)
    : 0;
  const totalTime = data.reduce((sum, item) => sum + (item.timeSpent || 0), 0);

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary Statistics', 14, 52);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total Puzzles Completed: ${totalPuzzles}`, 14, 60);
  doc.text(`Average Score: ${avgScore}%`, 14, 66);
  doc.text(`Total Time Spent: ${Math.round(totalTime / 60)} minutes`, 14, 72);

  // Table
  autoTable(doc, {
    startY: 78,
    head: [['Date', 'Puzzle', 'Difficulty', 'Score', 'Skill Change', 'Time (s)']],
    body: data.map(item => [
      format(new Date(item.date), 'MMM dd, yyyy'),
      item.puzzleTitle || 'N/A',
      item.difficulty || 'N/A',
      `${item.score || 0}%`,
      `${item.skillAfter || 0} - ${item.skillBefore || 0}`,
      item.timeSpent || 0,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    styles: { fontSize: 9 },
  });

  // Save PDF
  doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
```

### Component: `src/components/ExportButton.jsx`
```jsx
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/reports';

export default function ExportButton({ data, userInfo, reportType = 'both' }) {
  const handleExportCSV = () => {
    exportToCSV(data, 'progress-report');
  };

  const handleExportPDF = () => {
    exportToPDF(data, userInfo, 'progress-report');
  };

  return (
    <div className="relative group">
      <button className="px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center space-x-2">
        <Download className="w-4 h-4" />
        <span>Export</span>
      </button>
      
      {/* Dropdown Menu */}
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {reportType !== 'pdf' && (
          <button
            onClick={handleExportCSV}
            className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export as CSV</span>
          </button>
        )}
        {reportType !== 'csv' && (
          <button
            onClick={handleExportPDF}
            className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Export as PDF</span>
          </button>
        )}
      </div>
    </div>
  );
}
```

**Tailwind Classes Used:**
- `relative group` - Dropdown container
- `opacity-0 invisible group-hover:opacity-100` - Show on hover
- `absolute right-0 mt-2` - Dropdown positioning
- `shadow-lg border border-neutral-200` - Dropdown styling

## 7. Responsive Layout Utilities

### Component: `src/components/Layout.jsx`
```jsx
export default function Layout({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-neutral-50 ${className}`}>
      {children}
    </div>
  );
}

export function Container({ children, className = '' }) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Card({ children, className = '', padding = 'p-6' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${padding} ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        {subtitle && <p className="text-neutral-600 mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="mt-4 sm:mt-0">{actions}</div>}
    </div>
  );
}
```

## Summary Checklist

- [x] **1. Branding Tokens** - Design system with colors, spacing, shadows
- [x] **2. Clean Navbar** - Responsive navigation with mobile menu
- [x] **3. User Dashboard** - Stats cards, charts, activity feed
- [x] **4. Progress Charts** - Skill timeline with area/line charts
- [x] **5. Teacher Panel** - Puzzle management table with filters
- [x] **6. Export Reports** - CSV and PDF export utilities
- [x] **7. Responsive Layout** - Reusable layout components

## Implementation Order

1. Install dependencies (`recharts`, `jspdf`, `lucide-react`, `date-fns`)
2. Add Tailwind config with brand tokens
3. Create Navbar component
4. Create Dashboard with stats cards
5. Add SkillTimeline chart component
6. Build InstructorPanel with table
7. Implement export utilities
8. Add responsive layout wrappers

## Tailwind Classes Reference

**Spacing:** `px-4 sm:px-6 lg:px-8`, `py-2`, `gap-6`, `space-x-4`
**Colors:** `bg-primary-600`, `text-neutral-900`, `border-neutral-200`
**Responsive:** `hidden md:flex`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
**Interactive:** `hover:bg-neutral-50`, `transition-colors`, `transition-shadow`
**Typography:** `text-3xl font-bold`, `text-sm text-neutral-600`

