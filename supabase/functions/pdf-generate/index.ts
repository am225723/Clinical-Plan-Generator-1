import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REQUIRED_FIELDS = [
  'patient_name',
  'client_id', 
  'date_of_birth',
  'appointment_type',
  'date_of_service',
  'provider_name'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const { patientData, treatmentPlan, doctorSettings, consentText } = await req.json()

    const missingFields: string[] = []
    for (const field of REQUIRED_FIELDS) {
      if (!patientData?.[field]) {
        missingFields.push(field)
      }
    }

    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ missing_fields: missingFields }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pdfStyle = doctorSettings?.pdf_style || { font_size: 12, font_family: 'Arial' }
    const headerConfig = doctorSettings?.header_config || {}
    const footerConfig = doctorSettings?.footer_config || {}
    const firstPageHeader = doctorSettings?.first_page_header_config || headerConfig
    const firstPageFooter = doctorSettings?.first_page_footer_config || footerConfig
    const logoUrl = doctorSettings?.logo_url

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 1in;
      @top-center { content: "${headerConfig.text || ''}"; }
      @bottom-center { content: "${footerConfig.text || ''} - Page " counter(page); }
    }
    @page :first {
      @top-center { content: "${firstPageHeader.text || ''}"; }
      @bottom-center { content: "${firstPageFooter.text || ''}"; }
    }
    body {
      font-family: ${pdfStyle.font_family || 'Arial'}, sans-serif;
      font-size: ${pdfStyle.font_size || 12}pt;
      line-height: 1.5;
      color: #333;
    }
    .header { text-align: center; margin-bottom: 20px; }
    .logo { max-height: 80px; margin-bottom: 10px; }
    .patient-info { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 10px; 
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .patient-field { }
    .patient-label { font-weight: bold; font-size: 0.9em; color: #666; }
    .patient-value { }
    h2 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .section { margin-bottom: 20px; }
    .diagnosis-item { margin-left: 20px; }
    .goal-section { margin-bottom: 15px; }
    .goal-title { font-weight: bold; }
    .objective { margin-left: 20px; }
    .consent-section {
      margin-top: 40px;
      padding: 15px;
      border: 1px solid #e5e7eb;
      background: #fafafa;
    }
    .signature-block {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .signature-line {
      border-top: 1px solid #333;
      padding-top: 5px;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo">` : ''}
    <h1>Mental Health Treatment Plan</h1>
  </div>

  <div class="patient-info">
    <div class="patient-field">
      <div class="patient-label">Patient Name</div>
      <div class="patient-value">${patientData.patient_name}</div>
    </div>
    <div class="patient-field">
      <div class="patient-label">Client ID</div>
      <div class="patient-value">${patientData.client_id}</div>
    </div>
    <div class="patient-field">
      <div class="patient-label">Date of Birth</div>
      <div class="patient-value">${patientData.date_of_birth}</div>
    </div>
    <div class="patient-field">
      <div class="patient-label">Date of Service</div>
      <div class="patient-value">${patientData.date_of_service}</div>
    </div>
    <div class="patient-field">
      <div class="patient-label">Appointment Type</div>
      <div class="patient-value">${patientData.appointment_type}</div>
    </div>
    <div class="patient-field">
      <div class="patient-label">Provider</div>
      <div class="patient-value">${patientData.provider_name}</div>
    </div>
  </div>

  ${treatmentPlan?.chief_complaint ? `
  <div class="section">
    <h2>Chief Complaint</h2>
    <p>${treatmentPlan.chief_complaint}</p>
  </div>
  ` : ''}

  ${treatmentPlan?.hpi ? `
  <div class="section">
    <h2>History of Present Illness</h2>
    <p>${treatmentPlan.hpi}</p>
  </div>
  ` : ''}

  ${treatmentPlan?.diagnosis?.length ? `
  <div class="section">
    <h2>Diagnosis</h2>
    ${treatmentPlan.diagnosis.map((d: any) => `
      <div class="diagnosis-item">
        <strong>${d.code}</strong> - ${d.name} (${d.type})
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${treatmentPlan?.treatment_goals?.length ? `
  <div class="section">
    <h2>Treatment Goals</h2>
    ${treatmentPlan.treatment_goals.map((g: any) => `
      <div class="goal-section">
        <div class="goal-title">${g.goal}</div>
        ${g.objectives?.map((o: string) => `
          <div class="objective">• ${o}</div>
        `).join('') || ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${treatmentPlan?.risk_assessment ? `
  <div class="section">
    <h2>Risk Assessment</h2>
    <p><strong>Level:</strong> ${treatmentPlan.risk_assessment.level}</p>
    <p>${treatmentPlan.risk_assessment.justification}</p>
  </div>
  ` : ''}

  ${treatmentPlan?.prescription_plan ? `
  <div class="section">
    <h2>Prescription Plan</h2>
    <p>${treatmentPlan.prescription_plan}</p>
  </div>
  ` : ''}

  <div class="consent-section">
    <h2>Informed Consent</h2>
    <p>${consentText || treatmentPlan?.informed_consent || 'I have been informed about my diagnosis, treatment options, potential risks and benefits, and I consent to the proposed treatment plan.'}</p>
  </div>

  <div class="signature-block">
    <div>
      <div class="signature-line">Patient/Guardian Signature</div>
      <div>Date: _______________</div>
    </div>
    <div>
      <div class="signature-line">Provider Signature</div>
      <div>Date: ${patientData.date_of_service}</div>
    </div>
  </div>
</body>
</html>
`

    return new Response(
      JSON.stringify({ 
        html: htmlContent,
        message: 'PDF HTML generated. Use browser print or a PDF service to convert.',
        note: 'For production, integrate with a PDF generation service like Puppeteer or Prince XML.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
