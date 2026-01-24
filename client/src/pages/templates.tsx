import React from "react";
import { Layout } from "@/components/layout/Layout";
import { TemplateConfig } from "@/components/templates/TemplateConfig";

export default function TemplatesPage() {
    return (
        <Layout>
            <header className="px-5 pt-12 pb-4">
                <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-primary tracking-wider uppercase block">Settings</span>
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                        Template Config
                    </h1>
                </div>
            </header>
            <TemplateConfig />
        </Layout>
    );
}
