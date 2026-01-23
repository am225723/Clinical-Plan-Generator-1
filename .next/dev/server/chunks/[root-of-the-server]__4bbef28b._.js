module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/supabase.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createBrowserClient",
    ()=>createBrowserClient,
    "createServerClient",
    ()=>createServerClient,
    "getAppSettings",
    ()=>getAppSettings,
    "getDoctorSettings",
    ()=>getDoctorSettings,
    "getUserProfile",
    ()=>getUserProfile
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$supabase$2f$ssr__$5b$external$5d$__$2840$supabase$2f$ssr$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$29$__ = __turbopack_context__.i("[externals]/@supabase/ssr [external] (@supabase/ssr, cjs, [project]/node_modules/@supabase/ssr)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$cookie__$5b$external$5d$__$28$cookie$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$cookie$29$__ = __turbopack_context__.i("[externals]/cookie [external] (cookie, cjs, [project]/node_modules/cookie)");
;
;
const getSupabaseUrl = ()=>{
    const url = ("TURBOPACK compile-time value", "https://hqlqtnjnyhafdnfetjac.supabase.co") || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return url;
};
const getSupabaseAnonKey = ()=>{
    const key = ("TURBOPACK compile-time value", "sb_publishable_WpJVJ9yZADuI2bx9CTquWQ_Wyd6dZjM") || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return key;
};
const createBrowserClient = ()=>{
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$supabase$2f$ssr__$5b$external$5d$__$2840$supabase$2f$ssr$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$29$__["createBrowserClient"])(getSupabaseUrl(), getSupabaseAnonKey());
};
const createServerClient = (ctx)=>{
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$supabase$2f$ssr__$5b$external$5d$__$2840$supabase$2f$ssr$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$29$__["createServerClient"])(getSupabaseUrl(), getSupabaseAnonKey(), {
        cookies: {
            getAll () {
                const cookies = [];
                if (ctx.req.cookies && typeof ctx.req.cookies === 'object') {
                    Object.entries(ctx.req.cookies).forEach(([name, value])=>{
                        cookies.push({
                            name,
                            value: value || ''
                        });
                    });
                } else {
                    const cookieHeader = ctx.req.headers.cookie || '';
                    const parsed = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$cookie__$5b$external$5d$__$28$cookie$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$cookie$29$__["parse"])(cookieHeader);
                    Object.entries(parsed).forEach(([name, value])=>{
                        cookies.push({
                            name,
                            value: value || ''
                        });
                    });
                }
                return cookies;
            },
            setAll (cookiesToSet) {
                const existingCookies = ctx.res.getHeader('Set-Cookie') || [];
                const existingArray = Array.isArray(existingCookies) ? existingCookies : typeof existingCookies === 'string' ? [
                    existingCookies
                ] : [];
                const newCookies = cookiesToSet.map(({ name, value, options })=>{
                    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$cookie__$5b$external$5d$__$28$cookie$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$cookie$29$__["serialize"])(name, value, options);
                });
                ctx.res.setHeader('Set-Cookie', [
                    ...existingArray,
                    ...newCookies
                ]);
            }
        }
    });
};
async function getUserProfile(supabase, userId) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}
async function getAppSettings(supabase) {
    const { data, error } = await supabase.from('app_settings').select('*').limit(1).single();
    if (error) {
        console.error('Error fetching app settings:', error);
        return null;
    }
    return data;
}
async function getDoctorSettings(supabase, doctorId) {
    const { data, error } = await supabase.from('doctor_document_settings').select('*').eq('doctor_id', doctorId).single();
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching doctor settings:', error);
        return null;
    }
    return data;
}
}),
"[project]/pages/api/documents/index.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [api] (ecmascript)");
;
async function handler(req, res) {
    const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$api$5d$__$28$ecmascript$29$__["createServerClient"])({
        req,
        res
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return res.status(401).json({
            error: 'Unauthorized'
        });
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (!profile || profile.role !== 'doctor' && profile.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden'
        });
    }
    try {
        if (req.method === 'GET') {
            const { search, limit = '50', offset = '0' } = req.query;
            let query = supabase.from('saved_documents').select('*', {
                count: 'exact'
            }).eq('doctor_id', session.user.id).order('created_at', {
                ascending: false
            }).range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
            if (search && typeof search === 'string' && search.trim()) {
                query = query.ilike('patient_name', `%${search.trim()}%`);
            }
            const { data: documents, error, count } = await query;
            if (error) throw error;
            return res.status(200).json({
                documents: documents || [],
                total: count || 0
            });
        }
        if (req.method === 'POST') {
            const { template_id, template_type, patient_name, client_id, date_of_service, patient_data, clinical_inputs, generated_content, pdf_html, status = 'draft' } = req.body;
            if (!template_type || !patient_name || !date_of_service || !patient_data || !generated_content) {
                return res.status(400).json({
                    error: 'Missing required fields'
                });
            }
            const { data: document, error } = await supabase.from('saved_documents').insert({
                doctor_id: session.user.id,
                template_id: template_id || null,
                template_type,
                patient_name,
                client_id: client_id || null,
                date_of_service,
                patient_data,
                clinical_inputs: clinical_inputs || null,
                generated_content,
                pdf_html: pdf_html || null,
                status
            }).select().single();
            if (error) throw error;
            return res.status(201).json(document);
        }
        return res.status(405).json({
            error: 'Method not allowed'
        });
    } catch (error) {
        console.error('Documents API error:', error);
        return res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4bbef28b._.js.map