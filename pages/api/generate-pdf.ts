import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase';

interface PatientData {
  patient_name: string;
  client_id: string;
  date_of_birth: string;
  appointment_type: string;
  date_of_service: string;
  provider_name: string;
}

interface TreatmentPlan {
  chief_complaint?: string;
  hpi?: string;
  diagnosis?: Array<{ code: string; name: string }>;
  treatment_goals?: Array<{ goal: string; objectives?: string[] }>;
  recommendations?: string;
  medical_decision_making?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerClient({ req, res } as any);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { patientData, treatmentPlan, doctorSettings } = req.body as {
      patientData: PatientData;
      treatmentPlan: TreatmentPlan;
      doctorSettings: any;
    };

    const requiredFields: (keyof PatientData)[] = [
      'patient_name', 'client_id', 'date_of_birth', 
      'appointment_type', 'date_of_service', 'provider_name'
    ];
    
    const missingFields = requiredFields.filter(field => !patientData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missing_fields: missingFields
      });
    }

    const html = generatePdfHtml(patientData, treatmentPlan, doctorSettings);
    
    return res.status(200).json({ 
      html,
      message: 'PDF HTML generated successfully. Use browser print or a PDF service to convert.'
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate PDF' });
  }
}

function generatePdfHtml(
  patientData: PatientData, 
  treatmentPlan: TreatmentPlan, 
  doctorSettings: any
): string {
  const headerConfig = doctorSettings?.header_config || { text: '', alignment: 'center' };
  const footerConfig = doctorSettings?.footer_config || { text: '', alignment: 'center' };
  const pdfStyle = doctorSettings?.pdf_style || { font_size: 12, font_family: 'Arial' };
  const logoUrl = doctorSettings?.logo_url || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Treatment Plan - ${patientData.patient_name}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: ${pdfStyle.font_family}, sans-serif;
      font-size: ${pdfStyle.font_size}pt;
      line-height: 1.5;
      margin: 0;
      padding: 20px 40px;
      color: #333;
    }
    .header {
      text-align: ${headerConfig.alignment};
      padding-bottom: 20px;
      border-bottom: 2px solid #2563eb;
      margin-bottom: 20px;
    }
    .logo {
      max-height: 60px;
      margin-bottom: 10px;
    }
    .header-text {
      font-size: 14pt;
      font-weight: bold;
      color: #1e3a8a;
    }
    .patient-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .patient-info-item {
      display: flex;
      flex-direction: column;
    }
    .patient-info-label {
      font-size: 10pt;
      color: #64748b;
      text-transform: uppercase;
    }
    .patient-info-value {
      font-weight: 600;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #1e3a8a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .diagnosis-list {
      list-style: none;
      padding: 0;
    }
    .diagnosis-item {
      padding: 8px 12px;
      background: #f1f5f9;
      margin-bottom: 5px;
      border-radius: 4px;
    }
    .diagnosis-code {
      font-weight: bold;
      color: #2563eb;
    }
    .goal-card {
      background: #f8fafc;
      padding: 15px;
      border-left: 4px solid #2563eb;
      margin-bottom: 10px;
    }
    .goal-title {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .objectives-list {
      margin: 0;
      padding-left: 20px;
    }
    .footer {
      text-align: ${footerConfig.alignment};
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      margin-top: 40px;
      font-size: 10pt;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : ''}
    ${headerConfig.text ? `<div class="header-text">${headerConfig.text}</div>` : ''}
  </div>

  <h1 style="margin: 0 0 20px 0; font-size: 18pt;">Mental Health Treatment Plan</h1>

  <div class="patient-info">
    <div class="patient-info-item">
      <span class="patient-info-label">Patient Name</span>
      <span class="patient-info-value">${patientData.patient_name}</span>
    </div>
    <div class="patient-info-item">
      <span class="patient-info-label">Client ID</span>
      <span class="patient-info-value">${patientData.client_id}</span>
    </div>
    <div class="patient-info-item">
      <span class="patient-info-label">Date of Birth</span>
      <span class="patient-info-value">${patientData.date_of_birth}</span>
    </div>
    <div class="patient-info-item">
      <span class="patient-info-label">Appointment Type</span>
      <span class="patient-info-value">${patientData.appointment_type}</span>
    </div>
    <div class="patient-info-item">
      <span class="patient-info-label">Date of Service</span>
      <span class="patient-info-value">${patientData.date_of_service}</span>
    </div>
    <div class="patient-info-item">
      <span class="patient-info-label">Provider</span>
      <span class="patient-info-value">${patientData.provider_name}</span>
    </div>
  </div>

  ${treatmentPlan.chief_complaint ? `
  <div class="section">
    <div class="section-title">Chief Complaint</div>
    <p>${treatmentPlan.chief_complaint}</p>
  </div>
  ` : ''}

  ${treatmentPlan.hpi ? `
  <div class="section">
    <div class="section-title">History of Present Illness</div>
    <p>${treatmentPlan.hpi}</p>
  </div>
  ` : ''}

  ${treatmentPlan.diagnosis && treatmentPlan.diagnosis.length > 0 ? `
  <div class="section">
    <div class="section-title">Diagnosis</div>
    <ul class="diagnosis-list">
      ${treatmentPlan.diagnosis.map(d => `
        <li class="diagnosis-item">
          <span class="diagnosis-code">${d.code}</span> - ${d.name}
        </li>
      `).join('')}
    </ul>
  </div>
  ` : ''}

  ${treatmentPlan.treatment_goals && treatmentPlan.treatment_goals.length > 0 ? `
  <div class="section">
    <div class="section-title">Treatment Goals</div>
    ${treatmentPlan.treatment_goals.map((g, i) => `
      <div class="goal-card">
        <div class="goal-title">Goal ${i + 1}: ${g.goal}</div>
        ${g.objectives && g.objectives.length > 0 ? `
          <ul class="objectives-list">
            ${g.objectives.map(o => `<li>${o}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${treatmentPlan.recommendations ? `
  <div class="section">
    <div class="section-title">Recommendations</div>
    <p>${treatmentPlan.recommendations}</p>
  </div>
  ` : ''}

  ${treatmentPlan.medical_decision_making ? `
  <div class="section">
    <div class="section-title">Medical Decision Making</div>
    <p>${treatmentPlan.medical_decision_making}</p>
  </div>
  ` : ''}

  <div class="footer">
    ${footerConfig.text || `Generated on ${new Date().toLocaleDateString()}`}
  </div>
</body>
</html>
  `;
}
