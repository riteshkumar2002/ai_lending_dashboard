// LAP (Loan Against Property) application data
// Generic shape: each app carries eligibility / documents / parameters / scorecard sub-objects
// consumed by the four generic panel components.

/* ── helpers ─────────────────────────────────────────────────────── */
function fmtINR(n) {
  if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2).replace(/\.?0+$/, "") + " Cr";
  if (n >= 100000)   return "₹" + (n / 100000).toFixed(0) + "L";
  return "₹" + n.toLocaleString("en-IN");
}

const LAP_STATUS_META = {
  in_review:    { label: "NCM Review",   dot: "var(--c-amber)" },
  approved:     { label: "Approved",     dot: "var(--c-green)" },
  pending:      { label: "Pending",      dot: "var(--c-amber)" },
  rejected:     { label: "Rejected",     dot: "var(--c-red)"   },
  under_review: { label: "Under Review", dot: "var(--c-amber)" },
};

function lapScoreBand(s) {
  if (s >= 90) return "Excellent";
  if (s >= 80) return "Good";
  if (s >= 70) return "Moderate";
  if (s >= 60) return "Below Average";
  return "Poor";
}
function lapNstpLevel(s) {
  if (s >= 90) return "L_2 — Regional Credit Manager";
  if (s >= 80) return "L_4 — National Credit Manager (NCM)";
  if (s >= 70) return "L_6 — Credit Committee";
  return "DECLINE";
}
function lapRiskProfile(s) {
  if (s >= 85) return "LOW-MODERATE";
  if (s >= 75) return "MODERATE";
  if (s >= 65) return "MODERATE-HIGH";
  return "HIGH";
}
function cibilColor(score) {
  if (score >= 750) return "var(--c-green)";
  if (score >= 650) return "var(--c-amber)";
  return "var(--c-red)";
}

/* ── shared parameter groups for App 1 (Arjun Mehta — SEP, 57 yrs, CIBIL 684) ─ */
const LAP_PARAM_GROUPS = {
  identity: {
    label: "Applicant Identity",
    subGroups: [
      { label: "Demographics", rows: [
        { name: "Age", value: "57 years", source: "Application form" },
        { name: "Date of Birth", value: "15-Mar-1969", source: "KYC document" },
        { name: "Customer Segment", value: "SELF_EMPLOYED_PROFESSIONAL", source: "Application" },
        { name: "Applicant Type", value: "PRIMARY", source: "Application" },
        { name: "Constitution", value: "HINDU_UNDIVIDED_FAMILY (HUF)", source: "Application" },
      ]},
      { label: "KYC", rows: [
        { name: "PAN Number", value: "ARZAM7251K", source: "Application" },
        { name: "PAN NSDL Status", value: "TRUE (Verified)", source: "NSDL API" },
        { name: "Aadhaar Number", value: "XXXX XXXX 7842 (masked)", source: "Application" },
        { name: "Nationality", value: "INDIAN (Resident)", source: "Application" },
      ]},
      { label: "Residence", rows: [
        { name: "Resident Type", value: "Indian Resident", source: "Application" },
        { name: "Current Address", value: "Bandra West, Mumbai – 400050", source: "Application" },
      ]},
    ],
  },
  employment: {
    label: "Employment & Business",
    subGroups: [
      { label: "Self-Employed Professional", rows: [
        { name: "Segment", value: "SELF_EMPLOYED_PROFESSIONAL", source: "Application" },
        { name: "Constitution", value: "HINDU_UNDIVIDED_FAMILY (HUF)", source: "Application" },
        { name: "Company Category", value: "TGE (Top Gross Entity)", source: "Application" },
        { name: "Business Vintage", value: "13.98 years", source: "ITR / Financials" },
        { name: "Total Work Experience", value: "30 months (on record)", source: "Application" },
        { name: "Current Year Turnover", value: "₹1.90 Crore", source: "ITR / Financials" },
        { name: "Previous Year Turnover", value: "₹2.65 Crore", source: "ITR / Financials" },
        { name: "Financials Audited", value: "YES", source: "Audit report" },
        { name: "GST Turnover (Reported)", value: "₹2.33 Crore", source: "GSTN API" },
      ]},
      { label: "Salaried", rows: [
        { name: "Employer Name", value: "N/A — Self-Employed Applicant", source: "—" },
        { name: "Employer Category", value: "N/A", source: "—" },
      ]},
    ],
  },
  income: {
    label: "Income & Financials",
    subGroups: [
      { label: "Income Assessment", rows: [
        { name: "Net Monthly Income (NMI)", value: "₹81,449 / month", source: "P&L / ITR" },
        { name: "Total Eligible Income (Annual)", value: "₹9,77,389", source: "System (rule engine)" },
        { name: "Income Multiplier Applied", value: "25x (SEP category)", source: "Product policy" },
        { name: "Income Program Applied", value: "CROSS_SELL_BT", source: "System (rule engine)" },
        { name: "Total Monthly Obligation", value: "₹1,02,600 / month", source: "CIBIL + Application" },
        { name: "DBR / DTI Ratio", value: "42.0%", source: "Computed" },
        { name: "Final EMI (Proposed)", value: "₹34,234", source: "Computed" },
      ]},
      { label: "Banking", rows: [
        { name: "Avg Monthly Credits (AMC)", value: "₹1,02,451 / month", source: "Bank statements" },
        { name: "Number of Bank Accounts", value: "3", source: "Bank statements" },
        { name: "Cheque Returns (L6M)", value: "5", source: "Bank statements" },
        { name: "Bounce / NSF Count (L6M)", value: "2", source: "Bank statements" },
      ]},
    ],
  },
  bureau: {
    label: "Bureau & Credit",
    subGroups: [
      { label: "CIBIL", rows: [
        { name: "CIBIL Score", value: "684", source: "CIBIL API" },
        { name: "CMR Rank", value: "9 (HUF entity)", source: "CIBIL API" },
        { name: "Max DPD (Last 12M — Live Accounts)", value: "5 days", source: "CIBIL API" },
        { name: "Overdue Amount CC / KCC", value: "₹35,000", source: "CIBIL API" },
        { name: "Overdue Amount Non-CC", value: "₹20,000", source: "CIBIL API" },
        { name: "Enquiry Count (L6M)", value: "1", source: "CIBIL API" },
        { name: "Derogatory / Written-Off Status", value: "NONE (Code: 0)", source: "CIBIL API" },
        { name: "Suit Filed / Wilful Default", value: "0", source: "CIBIL API" },
      ]},
      { label: "Diff Last Payment", rows: [
        { name: "Days Since Last Payment", value: "2.92 years", source: "CIBIL API" },
      ]},
    ],
  },
  property: {
    label: "Property Details",
    subGroups: [
      { label: "Property", rows: [
        { name: "Property Type", value: "Residential", source: "Valuation report" },
        { name: "Property Sub-Type", value: "Rented-out (Investment Property)", source: "Application" },
        { name: "Tier Location", value: "C (Tier 2 City)", source: "Valuation report" },
        { name: "Min Market Value", value: "₹57.4L", source: "Valuation report" },
        { name: "Loan Amount", value: "₹37.3L", source: "Application" },
        { name: "LTV Ratio (Policy)", value: "65%", source: "Product policy" },
        { name: "Max Loan by LTV (₹57.4L × 65%)", value: "₹37.3L", source: "Computed" },
      ]},
    ],
  },
  collateral: {
    label: "Collateral & Legal",
    subGroups: [
      { label: "Title & Legal", rows: [
        { name: "Legal Report Processing Days", value: "307 days", source: "Panel lawyer" },
        { name: "Technical Report Processing Days", value: "476 days", source: "Valuation agency" },
        { name: "Hunter Match (Fraud Ring Detection)", value: "No Match (isMatch=FALSE)", source: "KARZA API" },
        { name: "External Dedupe (additional_match)", value: "No Match (FALSE)", source: "System" },
        { name: "EMI Paid Count", value: "42", source: "Bureau / Loan records" },
        { name: "Bounce Count (L6M)", value: "2", source: "Bank statements" },
      ]},
    ],
  },
};

/* ── Arjun Mehta — SEP, 57 yrs, CIBIL 684, NSTP L_4 (from CSV row 0) ── */
const PRIYA_ELIGIBILITY = {
  kpis: [
    { label: "Overall Decision", value: "GO — Eligible", subValue: "Eligible for Approval via NSTP", tone: "good" },
    { label: "Composite Score", value: "75 / 100", subValue: "Band: 70–79 → APPROVE via NCM NSTP", tone: "warn" },
    { label: "NSTP Authority", value: "L_4 — NCM", subValue: "APPLICANT_CIBIL_002 triggered", tone: "warn" },
    { label: "Risk Profile", value: "MODERATE", subValue: "CIBIL + DPD + CC overdue deviations", tone: "info" },
  ],
  sections: [
    {
      id: "eligibility_rules",
      title: "Eligibility Rules",
      subtitle: "Hard KO rules + policy parameters — any FAIL = automatic decline",
      tag: "3 DEVIATIONS",
      tagTone: "warn",
      rows: [
        { name: "Age Minimum (Legal Contract)",    value: "57 years",                     status: "PASS" },
        { name: "PAN NSDL Identity Verification",  value: "TRUE (Verified)",               status: "PASS" },
        { name: "Derogatory / Written-Off Status", value: "NONE (Code: 0)",               status: "PASS" },
        { name: "Suit Filed / Wilful Default",      value: "0",                            status: "PASS" },
        { name: "CIBIL Score",                      value: "684 (band: 650–700)",          status: "DEVIATION", reason: "Score of 684 falls in the 650–700 band; policy minimum is 750. Triggers NSTP rule APPLICANT_CIBIL_002 — requires L_4 National Credit Manager sign-off before approval." },
        { name: "Max DPD Last 12M (Live Accounts)", value: "5 days",                      status: "DEVIATION", reason: "Policy requires 0 DPD on all live accounts in the last 12 months. A 5-day delay was observed — triggers NCM deviation flag requiring additional sign-off." },
        { name: "Overdue — CC / KCC Accounts",      value: "₹35,000",                     status: "DEVIATION", reason: "Zero overdue balance required at the time of sanction. ₹35,000 outstanding on CC/KCC accounts must be fully cleared and confirmed before disbursement." },
        { name: "Overdue — Non-CC Accounts",        value: "₹20,000",                     status: "PASS" },
        { name: "DBR / DTI Ratio",                  value: "42.0%",                        status: "PASS" },
        { name: "Final LTV Ratio",                  value: "65.0%",                        status: "PASS" },
        { name: "Applicant Age",                    value: "57 years",                     status: "PASS" },
        { name: "Age at Loan Maturity",             value: "71.8 years (178M tenor)",      status: "PASS" },
        { name: "Business Vintage (SEP)",           value: "13.98 years",                  status: "PASS" },
        { name: "Property Type Eligibility",        value: "Residential (Rented-out)",     status: "PASS" },
        { name: "Enquiries L6M",                    value: "1",                            status: "PASS" },
      ],
    },
  ],
  decision: {
    tone: "go",
    items: [
      { label: "Overall Decision",    value: "GO — Eligible for Approval via NSTP", tone: "good" },
      { label: "Composite Score",     value: "75 / 100 — Band: 70–79 → APPROVE via NCM", tone: "warn" },
      { label: "NSTP Authority Level", value: "L_4 — National Credit Manager (NCM)", tone: "warn" },
      { label: "NSTP Trigger",        value: "CIBIL 684 in 650–700 band → Rule APPLICANT_CIBIL_002", tone: "warn" },
      { label: "Risk Profile",        value: "MODERATE | CIBIL deviation + DPD 5d + CC overdue ₹35K", tone: "info" },
      { label: "Recommended Action",  value: "Route to NCM queue. Verify CC overdue closure before disbursement.", tone: "neutral" },
    ],
  },
};

const PRIYA_DOCUMENTS = {
  summary: { total: 24, required: 18, received: 12, missing: 5, notApplicable: 5, conditional: 1, completionPct: 67 },
  groups: [
    {
      label: "KYC",
      items: [
        { sr: 1, name: "PAN Card Copy", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "—" },
        { sr: 2, name: "Aadhaar Card Copy", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "—" },
        { sr: 3, name: "Passport Size Photographs (2 nos.)", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "—" },
        { sr: 4, name: "Signed Application Form", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "—" },
        { sr: 5, name: "Residence Proof", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "—" },
      ],
    },
    {
      label: "Income — Salaried",
      items: [
        { sr: 6, name: "Salary Slips — Last 3 Months", mandatory: true, status: "Not Applicable", dateReceived: "—", remarks: "N/A — Self-Employed Professional applicant" },
        { sr: 7, name: "Form 16 / TDS Certificate", mandatory: true, status: "Not Applicable", dateReceived: "—", remarks: "N/A — Self-Employed applicant" },
        { sr: 8, name: "Employment / Appointment Letter", mandatory: true, status: "Not Applicable", dateReceived: "—", remarks: "N/A — Self-Employed applicant" },
      ],
    },
    {
      label: "Income — Self-Employed Professional",
      items: [
        { sr: 9,  name: "ITR with Computation — Last 3 Years", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "Verified via KARZA ITR API" },
        { sr: 10, name: "Audited P&L and Balance Sheet — Last 2 Years", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "Financials audited: YES" },
        { sr: 11, name: "GST Returns — Last 12 Months", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "GST turnover: ₹2.33Cr" },
        { sr: 12, name: "Bank Statements — Last 6 Months (All 3 accounts)", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "3 accounts; avg monthly credits ₹1,02,451" },
        { sr: 13, name: "HUF Deed / PAN of HUF", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "Constitution verified as HUF" },
        { sr: 14, name: "Business Registration / Shop Act Licence", mandatory: false, status: "Missing", dateReceived: "—", remarks: "Awaiting from applicant; TGE category requires proof" },
      ],
    },
    {
      label: "Property",
      items: [
        { sr: 15, name: "Sale Deed / Title Document", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "—" },
        { sr: 16, name: "Property Tax Receipts — Last 3 Years", mandatory: true, status: "Missing", dateReceived: "—", remarks: "Obtain from applicant — required for encumbrance check" },
        { sr: 17, name: "Valuation Report (Govt-approved valuer)", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "Technical report: 476 days processing" },
        { sr: 18, name: "Occupancy Certificate / Completion Certificate", mandatory: false, status: "Conditional", dateReceived: "—", remarks: "Required if property > 5 years old" },
        { sr: 19, name: "Encumbrance Certificate", mandatory: true, status: "Missing", dateReceived: "—", remarks: "Pending Sub-Registrar office; SLA: 5 working days" },
      ],
    },
    {
      label: "Banking",
      items: [
        { sr: 20, name: "Bank Account Statements — Last 12 Months", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "3 accounts covered" },
        { sr: 21, name: "Existing Loan Sanction Letters", mandatory: false, status: "Received", dateReceived: "29-Apr-2026", remarks: "EMI paid count: 42" },
      ],
    },
    {
      label: "Legal & Title",
      items: [
        { sr: 22, name: "Legal Search Report (Panel Lawyer)", mandatory: true, status: "Missing", dateReceived: "—", remarks: "Assigned to panel advocate; legal report: 307d processing" },
        { sr: 23, name: "Title Clearance Certificate", mandatory: true, status: "Missing", dateReceived: "—", remarks: "Pending legal search completion" },
        { sr: 24, name: "CIBIL / Credit Report Consent Form", mandatory: true, status: "Received", dateReceived: "29-Apr-2026", remarks: "—" },
      ],
    },
  ],
};

const PRIYA_SCORECARD = {
  score: 75,
  maxScore: 100,
  decisionLabel: "APPROVE – NCM NSTP (L_4)",
  decisionTone: "warn",
  meta: [
    { label: "SCORE", value: "75 / 100" },
    { label: "SCORE BAND", value: "70–79" },
    { label: "NSTP LEVEL", value: "L_4 – National Credit Manager (NCM)", tone: "warn" },
    { label: "RISK PROFILE", value: "MODERATE", tone: "info" },
  ],
  categories: [
    {
      id: "bureau", label: "Bureau & Credit History", weight: "25%", maxPts: 25, achieved: 16, pct: 64,
      panelId: "param_bureau",
      color: "#00C8FF",
      items: [
        {
          label: "Credit Score Assessment",
          items: [
            { label: "CIBIL Score (Individual)", value: "684", benchmark: "650 ≤ score < 700 → deviation", points: 4, maxPoints: 10, pct: 40 },
            { label: "Score Band Classification", value: "Mid-range (650–700)", benchmark: "Deviation flag for NSTP", points: 0, maxPoints: 2, pct: 0 },
          ],
        },
        {
          label: "Payment & Delinquency History",
          items: [
            { label: "Max DPD Last 12M (Live Accounts)", value: "5 days", benchmark: "DPD = 0", points: 1, maxPoints: 3, pct: 33 },
            { label: "Derogatory / Written-Off Status", value: "NONE", benchmark: "No derog / suit filed", points: 3, maxPoints: 3, pct: 100 },
          ],
        },
        {
          label: "Overdue & Obligations",
          items: [
            { label: "Overdue — CC / KCC", value: "₹35,000", benchmark: "Zero overdue", points: 1, maxPoints: 3, pct: 33 },
            { label: "Overdue — Non-CC", value: "₹20,000", benchmark: "Zero overdue", points: 2, maxPoints: 3, pct: 67 },
          ],
        },
        {
          label: "Credit Inquiry & Enquiry Activity",
          items: [
            { label: "Enquiry Count (L6M)", value: "1", benchmark: "Count ≤ 3", points: 3, maxPoints: 3, pct: 100 },
            { label: "Recent Credit Applications", value: "1 enquiry in last 6 months", benchmark: "≤ 3 indicates moderate risk", points: 2, maxPoints: 2, pct: 100 },
          ],
        },
      ],
    },
    {
      id: "income", label: "Income & Repayment Capacity", weight: "25%", maxPts: 25, achieved: 18, pct: 72,
      panelId: "param_income",
      color: "#FF3EA5",
      items: [
        {
          label: "Income Stability & Verification",
          items: [
            { label: "Income Program Quality", value: "CROSS_SELL_BT (SEP)", benchmark: "Verified income program", points: 4, maxPoints: 5, pct: 80 },
            { label: "Business Vintage (SEP)", value: "13.98 years", benchmark: "SEP >= 3 years", points: 6, maxPoints: 6, pct: 100 },
          ],
        },
        {
          label: "Debt Service & Affordability",
          items: [
            { label: "Final DBR / DTI Ratio", value: "42.0%", benchmark: "40% < DBR ≤ 50%", points: 5, maxPoints: 8, pct: 63 },
            { label: "Monthly Obligation Viability", value: "₹1,02,600 per month", benchmark: "Coverage ratio: 3.0x", points: 3, maxPoints: 3, pct: 100 },
          ],
        },
        {
          label: "Income Trend Analysis",
          items: [
            { label: "Financial Trend Dip (Turnover)", value: "28.3% dip in turnover", benchmark: "Dip < 20%", points: 1, maxPoints: 3, pct: 33 },
            { label: "Cashflow Consistency", value: "Average ₹1,02,451/month", benchmark: "Stable over 6 months", points: 2, maxPoints: 3, pct: 67 },
          ],
        },
      ],
    },
    {
      id: "property", label: "Property & Collateral Quality", weight: "20%", maxPts: 20, achieved: 14, pct: 70,
      panelId: "param_property",
      color: "#00DDB0",
      items: [
        {
          label: "Loan-to-Value & Leverage",
          items: [
            { label: "LTV Ratio (Loan-to-Value)", value: "65.0%", benchmark: "60% < LTV ≤ 70%", points: 5, maxPoints: 8, pct: 63 },
            { label: "Valuation Risk Assessment", value: "Conservative valuation applied", benchmark: "Within policy limits", points: 2, maxPoints: 2, pct: 100 },
          ],
        },
        {
          label: "Property Characteristics",
          items: [
            { label: "Property Type Risk Class", value: "Residential (Rented-out)", benchmark: "Residential property", points: 5, maxPoints: 6, pct: 83 },
            { label: "Tier Location", value: "C (Tier 2 City)", benchmark: "Tier A/B preferred", points: 2, maxPoints: 3, pct: 67 },
          ],
        },
        {
          label: "Tenure & Loan Maturity",
          items: [
            { label: "Age at Loan Maturity", value: "71.8 yrs (178M tenor)", benchmark: "Maturity ≤ 75 years", points: 2, maxPoints: 3, pct: 67 },
            { label: "Loan Tenure Risk", value: "240 months (20 years)", benchmark: "Standard for LAP", points: 1, maxPoints: 1, pct: 100 },
          ],
        },
      ],
    },
    {
      id: "stability", label: "Applicant Stability & Profile", weight: "15%", maxPts: 15, achieved: 13, pct: 87,
      panelId: "param_employment",
      color: "#3A55FF",
      items: [
        {
          label: "Employment & Business Stability",
          items: [
            { label: "Business / Employment Vintage", value: "13.98 years (SEP)", benchmark: "SEP >= 5 years", points: 5, maxPoints: 5, pct: 100 },
            { label: "Occupation / Borrower Profile Risk", value: "Self-Employed Professional", benchmark: "Not in risk-flagged list", points: 4, maxPoints: 4, pct: 100 },
          ],
        },
        {
          label: "Demographics & Age Compliance",
          items: [
            { label: "Age Norms Compliance", value: "57 yrs (Maturity: 71.8 yrs)", benchmark: "Age >= 23; Maturity ≤ 75", points: 3, maxPoints: 3, pct: 100 },
            { label: "Constitution Risk", value: "HUF (Hindu Undivided Family)", benchmark: "Not in prohibited list", points: 1, maxPoints: 3, pct: 33 },
          ],
        },
      ],
    },
    {
      id: "banking", label: "Banking & Cashflow", weight: "10%", maxPts: 10, achieved: 9, pct: 90,
      panelId: "param_collateral",
      color: "#9060EE",
      items: [
        {
          label: "Monthly Cashflow Analysis",
          items: [
            { label: "Avg Monthly Credits vs Final EMI", value: "₹1,02,451 (3.0x EMI)", benchmark: "AMC >= 3x EMI", points: 4, maxPoints: 4, pct: 100 },
            { label: "Minimum Balance Trend", value: "Average balance maintained", benchmark: "Healthy account management", points: 2, maxPoints: 2, pct: 100 },
          ],
        },
        {
          label: "Bounce & Return Analysis",
          items: [
            { label: "Cheque Returns (L6M)", value: "5 returns", benchmark: "Returns < 6", points: 3, maxPoints: 4, pct: 75 },
            { label: "Bounce / NSF Count (L6M)", value: "2 bounces", benchmark: "Bounces < 3", points: 2, maxPoints: 2, pct: 100 },
          ],
        },
      ],
    },
    {
      id: "kyc", label: "KYC & Fraud Prevention", weight: "5%", maxPts: 5, achieved: 5, pct: 100,
      panelId: "param_identity",
      color: "#6DCAFF",
      items: [
        {
          label: "Identity Verification",
          items: [
            { label: "PAN NSDL Verification", value: "TRUE (Verified)", benchmark: "panNsdlStatus = TRUE", points: 2, maxPoints: 2, pct: 100 },
            { label: "Aadhaar Authentication", value: "XXXX XXXX 7842 (masked)", benchmark: "Authenticated via API", points: 1, maxPoints: 1, pct: 100 },
          ],
        },
        {
          label: "Fraud & Duplicate Check",
          items: [
            { label: "Hunter / Fraud Ring Match", value: "No Match (isMatch=FALSE)", benchmark: "isMatch = FALSE", points: 2, maxPoints: 2, pct: 100 },
            { label: "External Dedupe (additional_match)", value: "No Match (FALSE)", benchmark: "No match found", points: 1, maxPoints: 1, pct: 100 },
          ],
        },
      ],
    },
  ],
  decisionSummary: [
    { label: "DECISION", value: "APPROVE – NCM NSTP (Score: 75 / 100 | Band: 70–79)" },
    { label: "NSTP AUTHORITY", value: "L_4 – National Credit Manager (NCM) sign-off required" },
    { label: "NSTP TRIGGER", value: "CIBIL 684 → 650–700 band → Rule APPLICANT_CIBIL_002 → NCM required" },
    { label: "RISK PROFILE", value: "MODERATE | 3 deviations: CIBIL band, DPD 5d, CC overdue ₹35K; strong business vintage 14yrs" },
  ],
};

/* ── synthetic detail generator for non-primary applicants ─────────── */
function synthLapDetail(app) {
  const s = app.compositeScore;
  const f = s / 85;
  const cibil = app.cibilScore;
  const ltv = app.ltv > 0 ? app.ltv : 0.55;
  const decision = s >= 60 ? "GO" : "NO-GO";
  const decisionTone = s >= 60 ? "go" : "nogo";
  const isKnockout = app.flags && app.flags.some(f => f.startsWith("KO:"));

  return {
    eligibility: {
      kpis: [
        { label: "Overall Decision", value: decision === "GO" ? "GO — Eligible" : "NO-GO — Declined", subValue: decision === "GO" ? "Eligible for Approval" : "Does not meet policy", tone: decision === "GO" ? "good" : "bad" },
        { label: "Composite Score", value: s + " / 100", subValue: "Band: " + lapScoreBand(s), tone: s >= 80 ? "good" : s >= 65 ? "warn" : "bad" },
        { label: "NSTP Authority", value: lapNstpLevel(s), subValue: "", tone: s >= 90 ? "info" : "warn" },
        { label: "Risk Profile", value: lapRiskProfile(s), subValue: "", tone: "info" },
      ],
      sections: [
        {
          id: "eligibility_rules",
          title: "Eligibility Rules",
          subtitle: "Hard KO rules + policy parameters — any FAIL = automatic decline",
          tag: isKnockout ? "KNOCKOUT" : (app.dbr > 0.55 || ltv > 0.75) ? "FAIL" : cibil < 750 ? (cibil < 650 ? "2 DEVIATIONS" : "1 DEVIATION") : "ALL PASS",
          tagTone: isKnockout ? "bad" : (app.dbr > 0.55 || ltv > 0.75) ? "bad" : cibil < 750 ? "warn" : "good",
          rows: [
            { name: "Age Minimum (Legal Contract)",    value: (app.age || "35") + " years",             status: "PASS" },
            { name: "PAN NSDL Identity Verification",  value: isKnockout ? "FAILED (Not Verified)" : "TRUE (Verified)", status: isKnockout ? "FAIL" : "PASS", reason: isKnockout ? "PAN NSDL verification failed — applicant identity could not be confirmed via NSDL API. This is a hard knockout rule; the application cannot proceed until identity is verified." : undefined },
            { name: "Derogatory / Written-Off Status", value: "NONE",                                   status: "PASS" },
            { name: "CIBIL Score",                     value: String(cibil),                            status: cibil >= 700 ? "PASS" : "DEVIATION", reason: cibil < 700 ? `CIBIL score of ${cibil} is below the 700 policy threshold. Deviation requires NCM sign-off before approval can be granted.` : undefined },
            { name: "DBR / DTI Ratio",                 value: Math.round(app.dbr * 100) + "%",          status: app.dbr <= 0.55 ? "PASS" : "FAIL",  reason: app.dbr > 0.55 ? `DBR of ${Math.round(app.dbr * 100)}% exceeds the 55% policy cap. At this debt level the EMI burden is unsustainable — loan amount must be reduced or co-applicant income included.` : undefined },
            { name: "Final LTV Ratio",                 value: Math.round(ltv * 100) + "%",              status: ltv <= 0.70 ? "PASS" : "FAIL",       reason: ltv > 0.70 ? `LTV of ${Math.round(ltv * 100)}% exceeds the 70% policy limit. Loan amount must be reduced or property value independently re-assessed to bring LTV within permissible bounds.` : undefined },
            { name: "Employment / Business Vintage",   value: app.employment || "4 years",              status: "PASS" },
            { name: "Property Type Eligibility",       value: app.product.replace("LAP – ", ""),        status: "PASS" },
          ],
        },
      ],
      decision: {
        tone: decisionTone,
        items: [
          { label: "Overall Decision", value: decision === "GO" ? "GO — Eligible for Approval" : "NO-GO — Application Declined", tone: decision === "GO" ? "good" : "bad" },
          { label: "Composite Score", value: s + " / 100 — Band: " + lapScoreBand(s), tone: s >= 80 ? "good" : s >= 65 ? "warn" : "bad" },
          { label: "NSTP Authority Level", value: lapNstpLevel(s), tone: "warn" },
          { label: "Risk Profile", value: lapRiskProfile(s), tone: "info" },
        ],
      },
    },

    documents: {
      summary: {
        total: 22,
        required: 18,
        received: Math.min(18, Math.round(18 * f)),
        missing: Math.max(0, Math.round(18 * (1 - f))),
        notApplicable: 4,
        conditional: 0,
        completionPct: Math.min(100, Math.round(f * 100)),
      },
      groups: [
        {
          label: "KYC",
          items: [
            { sr: 1, name: "PAN Card Copy", mandatory: true, status: "Received", dateReceived: app.submitted, remarks: "—" },
            { sr: 2, name: "Aadhaar Card Copy", mandatory: true, status: "Received", dateReceived: app.submitted, remarks: "—" },
            { sr: 3, name: "Signed Application Form", mandatory: true, status: "Received", dateReceived: app.submitted, remarks: "—" },
            { sr: 4, name: "Residence Proof", mandatory: true, status: "Received", dateReceived: app.submitted, remarks: "—" },
          ],
        },
        {
          label: "Income",
          items: [
            { sr: 5, name: "Salary Slips — Last 3 Months", mandatory: true, status: f >= 0.9 ? "Received" : "Missing", dateReceived: f >= 0.9 ? app.submitted : "—", remarks: f >= 0.9 ? "—" : "Pending from applicant" },
            { sr: 6, name: "Form 16 / ITR — Last 2 Years", mandatory: true, status: f >= 0.8 ? "Received" : "Missing", dateReceived: f >= 0.8 ? app.submitted : "—", remarks: f >= 0.8 ? "—" : "Pending KARZA verification" },
            { sr: 7, name: "Bank Statements — Last 6 Months", mandatory: true, status: "Received", dateReceived: app.submitted, remarks: "—" },
          ],
        },
        {
          label: "Property",
          items: [
            { sr: 8, name: "Sale Deed / Title Document", mandatory: true, status: f >= 0.85 ? "Received" : "Missing", dateReceived: f >= 0.85 ? app.submitted : "—", remarks: f >= 0.85 ? "—" : "Pending from applicant" },
            { sr: 9, name: "Valuation Report", mandatory: true, status: "Received", dateReceived: app.submitted, remarks: "—" },
            { sr: 10, name: "Encumbrance Certificate", mandatory: true, status: f >= 0.95 ? "Received" : "Missing", dateReceived: f >= 0.95 ? app.submitted : "—", remarks: f >= 0.95 ? "—" : "Pending Sub-Registrar office" },
          ],
        },
        {
          label: "Legal",
          items: [
            { sr: 11, name: "Legal Search Report", mandatory: true, status: f >= 0.9 ? "Received" : "Missing", dateReceived: f >= 0.9 ? app.submitted : "—", remarks: f >= 0.9 ? "—" : "Assigned to panel advocate" },
          ],
        },
      ],
    },

    param_identity: LAP_PARAM_GROUPS.identity,
    param_employment: LAP_PARAM_GROUPS.employment,
    param_income: {
      label: LAP_PARAM_GROUPS.income.label,
      subGroups: [
        { label: "Income Assessment", rows: [
          { name: "Net Monthly Income (NMI)", value: "—", source: "Salary slip" },
          { name: "Gross Monthly Income", value: "—", source: "Form 16" },
          { name: "Income Program Applied", value: "NIP_SAL", source: "System (rule engine)" },
          { name: "DBR / DTI Ratio", value: Math.round(app.dbr * 100) + "%", source: "Computed" },
          { name: "Final EMI", value: "—", source: "Computed" },
        ]},
        { label: "Banking", rows: [
          { name: "Avg Monthly Credits (AMC)", value: "—", source: "Bank statements" },
          { name: "Average Bank Balance (ABB)", value: "—", source: "Bank statements" },
          { name: "Bounce / NSF Count", value: "0", source: "Bank statements" },
        ]},
      ],
    },
    param_bureau: {
      label: LAP_PARAM_GROUPS.bureau.label,
      subGroups: [
        { label: "CIBIL", rows: [
          { name: "CIBIL Score", value: String(cibil), source: "CIBIL API" },
          { name: "DPD > 0 in Last 6M", value: cibil >= 750 ? "FALSE" : "TRUE", source: "CIBIL API" },
          { name: "Max DPD Last 12M (Live Accounts)", value: cibil >= 750 ? "0 days" : "30 days", source: "CIBIL API" },
          { name: "Overdue Amount CC / Gold", value: "₹0", source: "CIBIL API" },
          { name: "Enquiry Count (Post-Proceed Date)", value: "2", source: "CIBIL API" },
        ]},
        { label: "CMR", rows: [
          { name: "CMR Rank", value: "N/A (Individual borrower)", source: "CIBIL API" },
        ]},
      ],
    },
    param_property: {
      label: LAP_PARAM_GROUPS.property.label,
      subGroups: [
        { label: "Property", rows: [
          { name: "Property Type", value: app.product.replace("LAP – ", ""), source: "Valuation report" },
          { name: "Market Value (Est.)", value: fmtINR(Math.round(app.amount / ltv)), source: "Valuation report" },
          { name: "LTV Ratio (Policy)", value: Math.round(ltv * 100) + "%", source: "Computed" },
          { name: "Loan Amount", value: fmtINR(app.amount), source: "Application" },
        ]},
      ],
    },
    param_collateral: LAP_PARAM_GROUPS.collateral,

    scorecard: {
      score: s,
      maxScore: 100,
      decisionLabel: decision === "GO" ? "APPROVE – " + lapScoreBand(s) : "DECLINE",
      decisionTone: decision === "GO" ? "good" : "bad",
      meta: [
        { label: "SCORE", value: s + " / 100" },
        { label: "SCORE BAND", value: lapScoreBand(s) },
        { label: "NSTP LEVEL", value: lapNstpLevel(s), tone: "warn" },
        { label: "RISK PROFILE", value: lapRiskProfile(s), tone: "info" },
      ],
      categories: [
        {
          id: "bureau", label: "Bureau & Credit History", weight: "25%", maxPts: 25,
          achieved: Math.round(25 * Math.min(1, (cibil - 600) / 200)),
          pct: Math.round(100 * Math.min(1, (cibil - 600) / 200)),
          color: "#00C8FF",
          panelId: "param_bureau",
          items: [
            {
              label: "Credit Score Assessment",
              items: [
                { label: "CIBIL Score", value: String(cibil), benchmark: "Score trend analysis", points: Math.round(10 * Math.min(1, (cibil - 600) / 200)), maxPoints: 10, pct: Math.round(100 * Math.min(1, (cibil - 600) / 200)) },
              ],
            },
            {
              label: "Payment History",
              items: [
                { label: "Max DPD Last 12M", value: cibil >= 750 ? "0 days" : "30 days", benchmark: "No delinquency preferred", points: cibil >= 750 ? 5 : 0, maxPoints: 5, pct: cibil >= 750 ? 100 : 0 },
              ],
            },
          ],
        },
        {
          id: "income", label: "Income & Repayment Capacity", weight: "25%", maxPts: 25,
          achieved: Math.round(25 * Math.min(1, (0.55 - app.dbr) / 0.35 + 0.5)),
          pct: Math.round(100 * Math.min(1, (0.55 - app.dbr) / 0.35 + 0.5)),
          color: "#FF3EA5",
          panelId: "param_income",
          items: [
            {
              label: "Debt Service Ratio",
              items: [
                { label: "DBR / DTI Ratio", value: Math.round(app.dbr * 100) + "%", benchmark: "40% < DBR ≤ 50%", points: Math.round(15 * Math.min(1, (0.55 - app.dbr) / 0.35 + 0.5)), maxPoints: 15, pct: Math.round(100 * Math.min(1, (0.55 - app.dbr) / 0.35 + 0.5)) },
              ],
            },
            {
              label: "Income Stability",
              items: [
                { label: "Income Program Quality", value: "Verified income", benchmark: "Documented & verified", points: 5, maxPoints: 5, pct: 100 },
              ],
            },
          ],
        },
        {
          id: "property", label: "Property & Collateral Quality", weight: "20%", maxPts: 20,
          achieved: Math.round(20 * Math.min(1, (0.75 - ltv) / 0.4 + 0.6)),
          pct: Math.round(100 * Math.min(1, (0.75 - ltv) / 0.4 + 0.6)),
          color: "#00DDB0",
          panelId: "param_property",
          items: [
            {
              label: "Loan-to-Value Analysis",
              items: [
                { label: "LTV Ratio", value: Math.round(ltv * 100) + "%", benchmark: "60% < LTV ≤ 70%", points: Math.round(20 * Math.min(1, (0.75 - ltv) / 0.4 + 0.6)), maxPoints: 20, pct: Math.round(100 * Math.min(1, (0.75 - ltv) / 0.4 + 0.6)) },
              ],
            },
          ],
        },
        {
          id: "stability", label: "Applicant Stability & Profile", weight: "15%", maxPts: 15,
          achieved: Math.min(15, Math.round(15 * f)),
          pct: Math.min(100, Math.round(f * 100)),
          color: "#3A55FF",
          panelId: "param_employment",
          items: [
            {
              label: "Employment Profile",
              items: [
                { label: "Employment / Business Vintage", value: app.employment || "4 years", benchmark: "Minimum 3 years", points: Math.min(8, Math.round(8 * f)), maxPoints: 8, pct: Math.min(100, Math.round(f * 100)) },
              ],
            },
            {
              label: "Age & Tenure Compliance",
              items: [
                { label: "Age at Maturity", value: "Compliant", benchmark: "Maturity ≤ 75 years", points: Math.min(7, Math.round(7 * f)), maxPoints: 7, pct: Math.min(100, Math.round(f * 100)) },
              ],
            },
          ],
        },
        {
          id: "banking", label: "Banking & Cashflow", weight: "10%", maxPts: 10,
          achieved: Math.min(10, Math.round(10 * f)),
          pct: Math.min(100, Math.round(f * 100)),
          color: "#9060EE",
          panelId: "param_collateral",
          items: [
            {
              label: "Monthly Cashflow",
              items: [
                { label: "Avg Monthly Credits", value: "Verified", benchmark: "Coverage ≥ 3x EMI", points: Math.min(5, Math.round(5 * f)), maxPoints: 5, pct: Math.min(100, Math.round(f * 100)) },
              ],
            },
            {
              label: "Account Health",
              items: [
                { label: "Cheque Returns / Bounces", value: "Acceptable", benchmark: "< 6 returns in L6M", points: Math.min(5, Math.round(5 * f)), maxPoints: 5, pct: Math.min(100, Math.round(f * 100)) },
              ],
            },
          ],
        },
        {
          id: "kyc", label: "KYC & Fraud Prevention", weight: "5%", maxPts: 5,
          achieved: 5,
          pct: 100,
          color: "#6DCAFF",
          panelId: "param_identity",
          items: [
            {
              label: "Identity Verification",
              items: [
                { label: "PAN NSDL Verification", value: "Verified", benchmark: "TRUE (Verified)", points: 3, maxPoints: 3, pct: 100 },
              ],
            },
            {
              label: "Fraud Check",
              items: [
                { label: "Fraud Ring Detection", value: "No Match", benchmark: "No match found", points: 2, maxPoints: 2, pct: 100 },
              ],
            },
          ],
        },
      ],
      decisionSummary: [
        { label: "DECISION", value: decision === "GO" ? "APPROVE – " + lapScoreBand(s) + " (Score: " + s + " / 100)" : "DECLINE – Does not meet minimum policy requirements" },
        { label: "NSTP AUTHORITY", value: lapNstpLevel(s) },
        { label: "RISK PROFILE", value: lapRiskProfile(s) },
      ],
    },
  };
}

/* ── LAP_APPLICATIONS — 10 applicants from tcl_lap_synthetic_data.csv ── */
const _lapBase = [
  // CSV primary row 0: SEP, 57, CIBIL=684, LTV=0.65, loan=₹37.3L, APPROVE VIA NSTP L_4
  { id: "TCL-LAP-2026-00847", name: "Arjun Mehta",      initials: "AM",  age: 57, phone: "9876543210", product: "LAP – Residential", amount: 3732061,  cibilScore: 684, ltv: 0.65, dbr: 0.42, compositeScore: 75, status: "in_review", stage: "NCM Review",        flags: ["CIBIL Deviation", "DPD Flag"],   submitted: "29-Apr-2026", submittedAgo: "3d",  employment: "14 years (SEP)" },
  // CSV primary row 1: SALARIED, 29, CIBIL=789, loan=₹6.2L, APPROVE VIA NSTP L_4
  { id: "TCL-LAP-2026-00831", name: "Priya Sharma",     initials: "PS",  age: 29, phone: "9845012345", product: "LAP – Residential", amount: 615333,   cibilScore: 789, ltv: 0.55, dbr: 0.48, compositeScore: 79, status: "in_review", stage: "NCM Review",        flags: ["Income Deviation"],              submitted: "27-Apr-2026", submittedAgo: "5d",  employment: "3 years (SAL)" },
  // CSV primary row 4: SEP, 57, CIBIL=809, LTV=0.60, loan=₹2.67Cr, APPROVE VIA NSTP L_7, Commercial
  { id: "TCL-LAP-2026-00819", name: "Kavitha Pillai",   initials: "KPL", age: 57, phone: "9731122334", product: "LAP – Commercial",  amount: 26734358, cibilScore: 809, ltv: 0.60, dbr: 0.85, compositeScore: 68, status: "in_review", stage: "Credit Committee",  flags: ["High DBR", "NSTP L_7"],         submitted: "26-Apr-2026", submittedAgo: "6d",  employment: "6 years (SEP)" },
  // CSV SENP NSTP row 0: SENP, 56, CIBIL=694, loan=₹61.7L, APPROVE VIA NSTP L_5, Commercial
  { id: "TCL-LAP-2026-00804", name: "Sanjay Rao",       initials: "SR",  age: 56, phone: "9900887766", product: "LAP – Commercial",  amount: 6167707,  cibilScore: 694, ltv: 0.55, dbr: 0.43, compositeScore: 73, status: "in_review", stage: "Credit Committee",  flags: ["CIBIL Deviation"],              submitted: "24-Apr-2026", submittedAgo: "8d",  employment: "6 years (SENP)" },
  // CSV SEP 36 DPD=51 NSTP L6: SEP, 36, CIBIL=783, LTV=0.70, loan=₹2.03Cr, APPROVE VIA NSTP L6
  { id: "TCL-LAP-2026-00798", name: "Ritu Verma",       initials: "RV",  age: 36, phone: "8800554433", product: "LAP – SORP",        amount: 20314354, cibilScore: 783, ltv: 0.70, dbr: 0.52, compositeScore: 70, status: "in_review", stage: "Credit Committee",  flags: ["DPD Flag", "High LTV"],         submitted: "23-Apr-2026", submittedAgo: "9d",  employment: "9 years (SEP)" },
  // CSV RETIRED APPROVE row 0: RETIRED, 53, CIBIL=717, loan=₹51.3L, APPROVE clean
  { id: "TCL-LAP-2026-00785", name: "Geeta Iyer",       initials: "GI",  age: 53, phone: "9444123456", product: "LAP – Residential", amount: 5132192,  cibilScore: 717, ltv: 0.55, dbr: 0.32, compositeScore: 82, status: "approved",  stage: "Approved",         flags: [],                               submitted: "22-Apr-2026", submittedAgo: "10d", employment: "30 years (Retired)" },
  // CSV Industrial APPROVE row 0: SENP, 54, CIBIL=841, loan=₹1.95Cr, APPROVE clean, Industrial
  { id: "TCL-LAP-2026-00771", name: "Ramesh Gupta",     initials: "RG",  age: 54, phone: "9818765432", product: "LAP – Industrial",  amount: 19537465, cibilScore: 841, ltv: 0.55, dbr: 0.45, compositeScore: 90, status: "approved",  stage: "Approved",         flags: [],                               submitted: "20-Apr-2026", submittedAgo: "12d", employment: "16 years (SENP)" },
  // CSV RETIRED APPROVE row 1: RETIRED, 59, CIBIL=746, loan=₹4.4L, APPROVE clean
  { id: "TCL-LAP-2026-00762", name: "Kavitha Krishnan", initials: "KK",  age: 59, phone: "9567890123", product: "LAP – Commercial",  amount: 441035,   cibilScore: 746, ltv: 0.55, dbr: 0.38, compositeScore: 85, status: "approved",  stage: "Approved",         flags: [],                               submitted: "18-Apr-2026", submittedAgo: "14d", employment: "26 years (Retired)" },
  // CSV primary row 2: SALARIED, 35, CIBIL=705, LTV=0.70, loan=₹25.7L, DECLINE
  { id: "TCL-LAP-2026-00749", name: "Deepak Mishra",    initials: "DM",  age: 35, phone: "9312456789", product: "LAP – SORP",        amount: 2565731,  cibilScore: 705, ltv: 0.70, dbr: 0.58, compositeScore: 55, status: "rejected",  stage: "Rejected",         flags: ["High DBR", "LTV Exceeded"],     submitted: "16-Apr-2026", submittedAgo: "16d", employment: "7 years (SAL)" },
  // CSV KNOCKOUT row 0: SEP, 54, CIBIL=697, LTV=0.70, loan=₹66.5L, DECLINE — PAN NSDL=FALSE
  { id: "TCL-LAP-2026-00736", name: "Suresh Patel",     initials: "SPT", age: 54, phone: "9623344556", product: "LAP – SORP",        amount: 6647280,  cibilScore: 697, ltv: 0.70, dbr: 0.35, compositeScore: 42, status: "rejected",  stage: "Rejected",         flags: ["KO: PAN Verify Failed"],        submitted: "14-Apr-2026", submittedAgo: "18d", employment: "3 years (SEP)" },
];

const LAP_APPLICATIONS = _lapBase.map(app => {
  const isDetailed = app.id === "TCL-LAP-2026-00847";
  const detail = isDetailed
    ? { eligibility: PRIYA_ELIGIBILITY, documents: PRIYA_DOCUMENTS, scorecard: PRIYA_SCORECARD,
        param_identity: LAP_PARAM_GROUPS.identity,
        param_employment: LAP_PARAM_GROUPS.employment,
        param_income: LAP_PARAM_GROUPS.income,
        param_bureau: LAP_PARAM_GROUPS.bureau,
        param_property: LAP_PARAM_GROUPS.property,
        param_collateral: LAP_PARAM_GROUPS.collateral,
      }
    : synthLapDetail(app);

  const statusMeta = LAP_STATUS_META[app.status] || { label: app.status, dot: "var(--text-3)" };
  return {
    ...app,
    ...detail,
    headerFields: [
      { label: "LOAN AMOUNT", value: fmtINR(app.amount) },
      { label: "TENOR", value: "240 months (20 yr)" },
      { label: "PRODUCT", value: app.product },
      { label: "LTV", value: Math.round(app.ltv * 100) + "%" },
      { label: "DATE", value: app.submitted },
      { label: "STATUS", value: statusMeta.label, chip: true, tone: app.status === "approved" ? "good" : app.status === "rejected" ? "bad" : "warn" },
    ],
  };
});

window.LAP_APPLICATIONS = LAP_APPLICATIONS;
window.LAP_STATUS_META = LAP_STATUS_META;
window.fmtINR = fmtINR;
