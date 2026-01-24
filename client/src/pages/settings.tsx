import React from 'react';
import { Layout } from '@/components/layout/Layout';

export default function SettingsPage() {
    return (
        <Layout>
             <header className="px-5 pt-12 pb-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
            </header>
            <div className="p-5 text-slate-500 dark:text-gray-400">
                Application settings will go here.
            </div>
        </Layout>
    );
}
