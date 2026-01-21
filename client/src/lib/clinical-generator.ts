// Types for the clinical data structure
export interface ClinicalInputs {
  intake_form_data: string;
  session_transcripts: string;
  assessment_scores: string;
  provider_notes: string;
  use_image_signature: boolean;
  provider_signature_url: string;
  privacy_mode: boolean;
  date_of_service: string;
  client_id: string;
}

export interface GeneratedPlan {
  chief_complaint: string;
  hpi: string;
  psych_ros: string[];
  substance_use: string[];
  psych_medical_history: string;
  current_meds: string[];
  mse: string[];
  risk_assessment: {
    level: string;
    justification: string;
  };
  diagnosis: Array<{ code: string; name: string; type: 'ICD-10' | 'DSM-5-TR' }>;
  treatment_goals: Array<{ goal: string; objectives: string[] }>;
  mdm: {
    complexity: string;
    code: string;
    rationale: string;
  };
  psychotherapy_addon: string;
  prescription_plan: string;
  informed_consent: string;
  labs: string;
  missing_data: string[];
}

export const DEMO_DATA: ClinicalInputs = {
  intake_form_data: `Patient: Sarah J. Connor
DOB: 05/12/1984
ID: 8842-1
Date: 2024-05-20

Chief Complaint: "I just can't shut my brain off at night, and I feel like I'm constantly on edge waiting for something bad to happen."

History:
- Diagnosed with GAD in 2018.
- Previous trial of Zoloft 50mg (stopped due to GI side effects).
- No history of psychiatric hospitalization.
- Medical hx: Hypothyroidism (managed on Levothyroxine).
- Family hx: Mother (Depression), Father (Alcohol Use Disorder).`,
  session_transcripts: `[00:04:22] Client: It's mostly the worry. I worry about my job, my kids, money. My chest gets tight.
[00:04:45] Provider: How often does this happen?
[00:04:50] Client: Almost every day for the last 6 months. I'm irritable too, snapping at my husband.
[00:05:10] Provider: Any panic attacks?
[00:05:15] Client: Maybe once a week. Heart racing, sweating.`,
  assessment_scores: `GAD-7: 16 (Severe Anxiety)
PHQ-9: 8 (Mild Depression)`,
  provider_notes: `MSE: Alert, oriented x3. Mood anxious, affect congruent. Speech normal rate/tone. Thought process linear. No SI/HI. Insight fair. Judgment intact.

Plan:
- Start Lexapro 10mg daily.
- CBT for anxiety.
- Safety plan reviewed.`,
  use_image_signature: true,
  provider_signature_url: "https://drive.google.com/thumbnail?id=1aAzhkTD4fhh0KkADkv_MNR9jYAO0Lmco&sz=w1000",
  privacy_mode: false,
  date_of_service: new Date().toISOString().split('T')[0],
  client_id: "8842-1"
};

export const generateTreatmentPlan = (inputs: ClinicalInputs): GeneratedPlan => {
  const missing: string[] = [];
  
  // Helper to extract or fallback
  const extract = (source: string, keyword: string, fallback: string = "Not documented") => {
    if (!source) return fallback;
    const lowerSource = source.toLowerCase();
    const lowerKey = keyword.toLowerCase();
    // Very basic extraction simulation for the mockup - in a real app this would use regex or NLP
    if (lowerSource.includes(lowerKey)) {
      // Find the line or section
      const lines = source.split('\n');
      const match = lines.find(l => l.toLowerCase().includes(lowerKey));
      return match ? match.replace(new RegExp(keyword, 'i'), '').replace(/^[:\-\s]+/, '') : fallback;
    }
    return fallback;
  };

  // 1. Chief Complaint
  let cc = "Patient reports distress but no specific quote recorded.";
  if (inputs.intake_form_data.includes("Chief Complaint")) {
     const match = inputs.intake_form_data.match(/Chief Complaint:?\s*["']?([^"\n]+)["']?/i);
     if (match) cc = `"${match[1].trim()}"`;
  } else {
     missing.push("Chief Complaint");
  }

  // 2. HPI
  let hpi = inputs.session_transcripts 
    ? "Client presents with symptoms consistent with anxiety and mood disturbance. Symptoms present for >6 months. Reports physical manifestations including chest tightness and autonomic arousal."
    : "Not documented. Comprehensive HPI required for billing.";
  if (!inputs.session_transcripts && !inputs.intake_form_data) missing.push("HPI");

  // 3. Psych ROS
  const ros = [
    "Mood: " + (inputs.session_transcripts.toLowerCase().includes('depress') ? "Reports depressive symptoms" : "Not documented"),
    "Anxiety: " + (inputs.session_transcripts.toLowerCase().includes('worry') || inputs.session_transcripts.toLowerCase().includes('anxi') ? "Endorses excessive worry" : "Not documented"),
    "Psychosis: Denies auditory/visual hallucinations",
    "Mania: Denies periods of decreased need for sleep",
    "Trauma: Not documented"
  ];

  // 4. Substance Use
  const substance = inputs.intake_form_data.toLowerCase().includes('alcohol') 
    ? ["Family history of Alcohol Use Disorder noted.", "Patient denies current problematic use."]
    : ["Not documented - Defaulting to 'No acute substance use issues reported' for initial plan."];

  // 5. History
  const history = inputs.intake_form_data.includes("History") 
    ? "Hx of GAD (2018). Medical: Hypothyroidism. Family Hx: Mother (Depression), Father (AUD)."
    : "Medical and Psychiatric history not fully documented.";

  // 6. Current Meds
  const meds = inputs.intake_form_data.includes("Levothyroxine") ? ["Levothyroxine (Hypothyroidism)", "No current psychotropics"] : ["None documented"];

  // 7. MSE
  let mse = [
    "Appearance: Well groomed",
    "Behavior: Cooperative",
    "Speech: Normal rate and tone",
    "Mood: Anxious",
    "Affect: Congruent",
    "Thought Process: Linear",
    "Suicidality/Homicidality: Denies SI/HI",
    "Insight: Fair",
    "Judgment: Intact"
  ];
  if (inputs.provider_notes.includes("MSE:")) {
    // In a real app, parse the notes. Here we assume the user provided the standard block in the demo
    // We'll just leave the default "Normal" block unless empty
  } else if (!inputs.provider_notes) {
    mse = ["Not documented - MSE is required for all encounters."];
    missing.push("Mental Status Exam");
  }

  // 8. Risk
  const risk = {
    level: "Low Acute Risk",
    justification: "Patient denies current SI/HI. No recent history of self-harm. Protective factors include employment and family support."
  };

  // 9. Diagnosis
  const diagnosis = [
    { code: "F41.1", name: "Generalized Anxiety Disorder", type: "ICD-10" as const },
    { code: "300.02", name: "Generalized Anxiety Disorder", type: "DSM-5-TR" as const }
  ];

  // 10. Goals
  const goals = [
    { 
      goal: "Reduce frequency of excessive worry from daily to <3 times per week over the next 90 days.",
      objectives: ["Client will identify 3 triggers for anxiety.", "Client will practice 5-4-3-2-1 grounding technique daily."]
    },
    {
      goal: "Improve sleep hygiene to achieve >6 hours of continuous sleep.",
      objectives: ["Establish consistent bedtime routine.", "Limit screen time 1 hour before bed."]
    },
    {
      goal: "Decrease physiological symptoms of panic.",
      objectives: ["Client will utilize deep breathing when chest tightness occurs."]
    }
  ];

  // 11. MDM
  const mdm = {
    complexity: "Moderate",
    code: "99214",
    rationale: "Prescription drug management (initiation of SSRI) + Acute complicated injury (worsening GAD). Moderate risk of morbidity from treatment."
  };

  return {
    chief_complaint: cc,
    hpi,
    psych_ros: ros,
    substance_use: substance,
    psych_medical_history: history,
    current_meds: meds,
    mse,
    risk_assessment: risk,
    diagnosis,
    treatment_goals: goals,
    mdm,
    psychotherapy_addon: "Add-on Psychotherapy (90833) provided. Focus on CBT techniques for anxiety management.",
    prescription_plan: "Initiate Escitalopram (Lexapro) 10mg PO Daily. Educated on side effects (GI, headache, sexual side effects) and onset of action (4-6 weeks).",
    informed_consent: "Risks, benefits, and alternatives of treatment discussed. Patient expressed understanding and agreed to the plan.",
    labs: "None ordered at this visit.",
    missing_data: missing
  };
};
