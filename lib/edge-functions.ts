import type { SupabaseClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL 
    || process.env.VITE_SUPABASE_URL 
    || process.env.SUPABASE_URL 
    || '';
};

export async function callEdgeFunction<T = any>(
  supabase: SupabaseClient,
  functionName: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = getSupabaseUrl();
  let url = `${supabaseUrl}/functions/v1/${functionName}`;
  
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
    },
    ...(options.body && { body: JSON.stringify(options.body) }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Edge function ${functionName} failed`);
  }

  return data;
}

export async function callEdgeFunctionSafe<T = any>(
  supabase: SupabaseClient,
  functionName: string,
  defaultValue: T,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, string>;
  } = {}
): Promise<T> {
  try {
    return await callEdgeFunction<T>(supabase, functionName, options);
  } catch (error) {
    console.warn(`Edge function ${functionName} unavailable:`, error);
    return defaultValue;
  }
}

export const edgeFunctions = {
  admin: {
    createUser: (supabase: SupabaseClient, data: { email: string; password?: string; full_name: string }) =>
      callEdgeFunction(supabase, 'admin-create-user', { method: 'POST', body: data }),
    updateUser: (supabase: SupabaseClient, data: { user_id: string; full_name?: string; disabled?: boolean }) =>
      callEdgeFunction(supabase, 'admin-update-user', { method: 'POST', body: data }),
  },
  settings: {
    get: (supabase: SupabaseClient) => callEdgeFunctionSafe(supabase, 'settings-get', { treatment_plan_prompt: '' }),
    set: (supabase: SupabaseClient, data: { treatment_plan_prompt: string }) =>
      callEdgeFunction(supabase, 'settings-set', { method: 'POST', body: data }),
  },
  templates: {
    list: (supabase: SupabaseClient) => callEdgeFunctionSafe(supabase, 'templates', []),
    get: (supabase: SupabaseClient, id: string) =>
      callEdgeFunction(supabase, 'templates', { params: { id } }),
    create: (supabase: SupabaseClient, data: any) =>
      callEdgeFunction(supabase, 'templates', { method: 'POST', body: data }),
    update: (supabase: SupabaseClient, id: string, data: any) =>
      callEdgeFunction(supabase, 'templates', { method: 'PUT', params: { id }, body: data }),
    delete: (supabase: SupabaseClient, id: string) =>
      callEdgeFunction(supabase, 'templates', { method: 'DELETE', params: { id } }),
  },
  documents: {
    list: (supabase: SupabaseClient, params?: { search?: string; limit?: number; offset?: number }) =>
      callEdgeFunctionSafe(supabase, 'documents', [], { params: params as any }),
    get: (supabase: SupabaseClient, id: string) =>
      callEdgeFunction(supabase, 'documents', { params: { id } }),
    create: (supabase: SupabaseClient, data: any) =>
      callEdgeFunction(supabase, 'documents', { method: 'POST', body: data }),
    update: (supabase: SupabaseClient, id: string, data: any) =>
      callEdgeFunction(supabase, 'documents', { method: 'PUT', params: { id }, body: data }),
    delete: (supabase: SupabaseClient, id: string) =>
      callEdgeFunction(supabase, 'documents', { method: 'DELETE', params: { id } }),
  },
  dashboard: {
    summary: (supabase: SupabaseClient) => callEdgeFunctionSafe(supabase, 'dashboard-summary', {
      total_documents: 0,
      time_saved_hours: 0,
      compliance_rate: 0,
      risk_flagged: 0,
    }),
    appointments: (supabase: SupabaseClient, date?: string) =>
      callEdgeFunctionSafe(supabase, 'dashboard-appointments', [], { params: date ? { date } : undefined }),
    calendarImports: (supabase: SupabaseClient) => callEdgeFunctionSafe(supabase, 'dashboard-calendar-imports', []),
    importCalendar: (supabase: SupabaseClient, events: any[]) =>
      callEdgeFunction(supabase, 'dashboard-calendar-imports', { method: 'POST', body: events }),
  },
  generate: {
    treatmentPlan: (supabase: SupabaseClient, data: any) =>
      callEdgeFunction(supabase, 'generate-treatment-plan', { method: 'POST', body: data }),
    pdf: (supabase: SupabaseClient, data: any) =>
      callEdgeFunction(supabase, 'pdf-generate', { method: 'POST', body: data }),
    refineNote: (supabase: SupabaseClient, data: { messages: any[]; noteContent: string }) =>
      callEdgeFunction(supabase, 'refine-note', { method: 'POST', body: data }),
  },
  transcriptions: {
    get: (supabase: SupabaseClient, id: string) =>
      callEdgeFunction(supabase, 'transcriptions', { params: { id } }),
    create: (supabase: SupabaseClient, data: { fileName: string; fileType: string; contentType?: string; data: string }) =>
      callEdgeFunction(supabase, 'transcriptions', { method: 'POST', body: data }),
  },
  googleDriveImport: (supabase: SupabaseClient, fileId: string) =>
    callEdgeFunction(supabase, 'google-drive-import', { method: 'POST', body: { fileId } }),
  uploadLogo: (supabase: SupabaseClient, data: { filename: string; contentType?: string }) =>
    callEdgeFunction(supabase, 'logo-upload-sign', { method: 'POST', body: data }),
};
