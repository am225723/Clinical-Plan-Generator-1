import { Timer, Flag, ShieldCheck } from 'lucide-react';

interface StatCard {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  unit: string;
  badge: string;
  badgeColor: string;
}

export function PracticeStats() {
  const stats: StatCard[] = [
    {
      icon: <Timer className="h-5 w-5" />,
      iconBg: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400',
      label: 'Time Saved',
      value: '16.5',
      unit: 'hrs',
      badge: '+4h',
      badgeColor: 'text-teal-700 dark:text-teal-400 bg-teal-100/50 dark:bg-teal-500/10',
    },
    {
      icon: <Flag className="h-5 w-5" />,
      iconBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400',
      label: 'Risk Flagged',
      value: '5',
      unit: 'Cases',
      badge: 'Action Req',
      badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-500/10',
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      label: 'Compliance',
      value: '99.2',
      unit: '%',
      badge: 'Perfect',
      badgeColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-500/10',
    },
  ];

  return (
    <section className="flex flex-col gap-4 px-6 pt-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-foreground text-lg font-bold tracking-tight">Practice Overview</h3>
        <span className="text-primary text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1">
          View Report
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
      
      <div className="flex overflow-x-auto gap-4 no-scrollbar -mx-6 px-6 pb-6 pt-1">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="glass-panel min-w-[160px] flex-1 flex flex-col gap-4 rounded-2xl p-5 group transition-all hover:-translate-y-1"
          >
            <div className="flex justify-between items-start">
              <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                {stat.icon}
              </div>
              <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${stat.badgeColor}`}>
                {stat.badge}
              </span>
            </div>
            <div>
              <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-foreground text-2xl font-bold mt-1">
                {stat.value}
                <span className="text-sm font-medium text-muted-foreground ml-1">{stat.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
