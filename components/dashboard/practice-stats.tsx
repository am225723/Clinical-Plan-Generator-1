import { useState, useEffect } from 'react';
import { FileText, AlertCircle, Activity, TrendingUp } from 'lucide-react';

interface IcdCode {
  code: string;
  description: string;
  count: number;
}

interface DashboardStats {
  pendingNotesCount: number;
  documentsThisWeek: number;
  documentsThisMonth: number;
  topIcdCodes: IcdCode[];
}

export function PracticeStats() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingNotesCount: 0,
    documentsThisWeek: 0,
    documentsThisMonth: 0,
    topIcdCodes: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dashboard/summary');
        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        setStats({
          pendingNotesCount: data.pendingNotesCount ?? 0,
          documentsThisWeek: data.documentsThisWeek ?? 0,
          documentsThisMonth: data.documentsThisMonth ?? 0,
          topIcdCodes: data.topIcdCodes ?? [],
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  const statCards = [
    {
      icon: <AlertCircle className="h-5 w-5" />,
      iconBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400',
      label: 'Notes Pending',
      value: stats.pendingNotesCount.toString(),
      unit: 'Patients',
      badge: stats.pendingNotesCount > 5 ? 'Urgent' : 'Action',
      badgeColor: stats.pendingNotesCount > 5 
        ? 'text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-500/10'
        : 'text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/10',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      iconBg: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400',
      label: 'This Week',
      value: stats.documentsThisWeek.toString(),
      unit: 'Docs',
      badge: '+' + Math.round(stats.documentsThisWeek * 0.2),
      badgeColor: 'text-teal-700 dark:text-teal-400 bg-teal-100/50 dark:bg-teal-500/10',
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      label: 'This Month',
      value: stats.documentsThisMonth.toString(),
      unit: 'Docs',
      badge: 'On Track',
      badgeColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-500/10',
    },
  ];

  return (
    <section className="flex flex-col gap-4 px-6 pt-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-foreground text-lg font-bold tracking-tight">Practice Overview</h3>
        <span className="text-primary text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1">
          {loading ? 'Loading...' : 'View Report'}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
      
      <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-6 px-6 pb-2 pt-1">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="glass-panel min-w-[140px] flex-1 flex flex-col gap-3 rounded-2xl p-4 group transition-all hover:-translate-y-1"
            data-testid={`stat-card-${index}`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl ${stat.iconBg}`}>
                {stat.icon}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-foreground text-xl font-bold mt-0.5">
                {stat.value}
                <span className="text-xs font-medium text-muted-foreground ml-1">{stat.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-2xl p-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <h4 className="text-sm font-semibold">Top ICD-10 Codes</h4>
          </div>
          <span className="text-[10px] text-muted-foreground uppercase font-medium">Last 30 Days</span>
        </div>
        <div className="space-y-2">
          {stats.topIcdCodes.slice(0, 5).map((icd, index) => (
            <div 
              key={icd.code} 
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
              data-testid={`icd-code-${icd.code}`}
            >
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg min-w-[60px] text-center">
                {icd.code}
              </span>
              <span className="flex-1 text-xs text-muted-foreground truncate">
                {icd.description}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 bg-muted rounded-full w-16 overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(icd.count / stats.topIcdCodes[0].count) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground min-w-[24px] text-right">
                  {icd.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
