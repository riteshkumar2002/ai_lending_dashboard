"""
AI Credit Underwriting Dashboard -- Section Reference Report
Generates a professional PDF using fpdf2.
"""

from fpdf import FPDF
import os
import unicodedata

def _a(text):
    """Convert any string to pure latin-1 safe ASCII."""
    if not isinstance(text, str):
        return str(text)
    # manual replacements first
    _MAP = {
        '—': '--', '–': '-', '‒': '-',
        '→': '->', '←': '<-',
        '▼': 'v',  '▲': '^',
        '₹': 'Rs.','£': 'GBP','€': 'EUR',
        '≥': '>=', '≤': '<=',
        '≠': '!=', '×': 'x',
        '·': '-',  '•': '-',
        '‘': "'",  '’': "'",
        '“': '"',  '”': '"',
        '…': '...',
    }
    for k, v in _MAP.items():
        text = text.replace(k, v)
    # normalise and strip anything remaining outside latin-1
    text = unicodedata.normalize('NFKD', text)
    return text.encode('latin-1', errors='replace').decode('latin-1')

# ── colour palette (RGB) ──────────────────────────────────────────
BG_PAGE      = (15,  17,  27)   # near-black page
BG_CARD      = (26,  30,  46)   # card surface
BG_ACCENT    = (22,  38,  80)   # accent strip
C_ACCENT     = (99,  120, 220)  # indigo
C_GREEN      = (34,  197,  94)
C_AMBER      = (234, 179,   8)
C_RED        = (239,  68,  68)
C_WHITE      = (245, 247, 255)
C_MUTED      = (130, 140, 170)
C_DIVIDER    = (45,  52,  78)
C_SECTION_BG = (32,  38,  58)

OUTPUT = os.path.join(os.path.dirname(__file__),
                      "AI_Credit_Underwriting_Dashboard_Report.pdf")

# ── section data ──────────────────────────────────────────────────
SECTIONS = [
    {
        "num":   "01",
        "badge": "SECTION 01",
        "title": "Applicant Identity",
        "sub":   "KYC - Demographics - Residence",
        "color": C_ACCENT,
        "icon":  "👤",
        "overview": (
            "The Applicant Identity section forms the foundational layer of the underwriting "
            "process. It captures the verified personal profile of the borrower -- who they are, "
            "where they live, and whether their identity documents are authentic and consistent."
        ),
        "fields": [
            ("Age & Date of Birth",    "Determines eligibility windows, loan tenor limits (e.g. repayment before age 70), and regulatory age floors (typically 21–65 years)."),
            ("Customer Segment",       "Classifies the applicant as SELF_EMPLOYED_PROFESSIONAL, SALARIED, or HUF. This drives income assessment method, multiplier tables, and NSTP routing."),
            ("Applicant Type",         "PRIMARY / CO-APPLICANT / GUARANTOR. Affects liability structure and credit weight assigned to each party's profile."),
            ("PAN & PAN NSDL Status",  "Primary tax identifier. NSDL real-time verification confirms the PAN is active, name-matched, and not flagged. A FALSE status is an automatic KO."),
            ("Aadhaar (masked)",       "Biometric-linked identity. Confirms residential address and enables de-duplication across bureau databases."),
            ("Nationality & Resident Type", "NRI/RNOR applicants attract different LTV caps, income recognition rules, and repatriation compliance requirements."),
            ("Constitution",           "HUF, Proprietorship, Individual, or Partnership. Determines legal entity structure, signing authority, and applicable KYC norms."),
            ("Current Address",        "Geo-coded for branch/region mapping, property proximity check, and bureau address consistency validation."),
        ],
        "ai_role": (
            "AI models ingest identity signals as categorical features. Name-match fuzzy scoring "
            "across PAN/Aadhaar/bureau headers flags synthetic identities. Segment classification "
            "feeds the income model selector. Age at origination and age at maturity are "
            "continuous features in the eligibility neural network. NSDL status is a binary "
            "hard-gate -- a single FALSE halts the pipeline regardless of score."
        ),
        "risk_flags": [
            "PAN NSDL status = FALSE -> automatic decline",
            "Age at maturity > 70 years -> tenor capped or guarantor required",
            "Address mismatch between Aadhaar and bureau -> manual KYC review",
            "HUF constitution -> additional Karta consent and coparcener NOC required",
        ],
    },
    {
        "num":   "02",
        "badge": "SECTION 02",
        "title": "Employment & Business",
        "sub":   "Self-Employed - Vintage - Turnover",
        "color": C_GREEN,
        "icon":  "💼",
        "overview": (
            "This section assesses the economic stability and income-generating capacity of the "
            "borrower's primary occupation. For Self-Employed Professionals (SEP) it analyses "
            "business maturity, financial audits, and turnover trends. For salaried applicants it "
            "evaluates employer quality and employment continuity."
        ),
        "fields": [
            ("Business Vintage",        "Years of active operation. A minimum of 3 years is typically required; 5+ years signals established stability. The animated progress bar benchmarks against a 20-year sector median."),
            ("GST Turnover (Reported)", "Revenue declared in GST returns. Used as the base for income computation under the ITR + GST method for SEP applicants."),
            ("Turnover Trend (YoY)",    "Year-over-year change in top-line revenue. A declining trend (v) triggers cashflow stress analysis and may require additional collateral or lower LTV."),
            ("TGE (Top Gross Entity)",  "Flags whether the entity being assessed is the primary income source. Prevents income double-counting across group structures."),
            ("Financials Audited",      "Confirms CA-certified books. Unaudited financials may be discounted by 20–30% in income computation."),
            ("Employer / Entity Name",  "For salaried: employer quality tier (Public Sector, MNC, Listed, Unlisted Private). For SEP: legal entity name cross-referenced with GST and MCA filings."),
            ("Total Work Experience",   "Continuous employment history. Gaps > 3 months in the last 2 years flag income instability risk."),
            ("Income Multiplier",       "Applied to Net Monthly Income to compute maximum loan eligibility. SEP category attracts 25x; Salaried may receive up to 36x depending on employer tier."),
        ],
        "ai_role": (
            "The AI income engine branches on the Segment feature: SEP applicants are routed to "
            "the turnover-based model; Salaried to the payslip model. The YoY trend is a gradient "
            "feature -- negative slope exceeding 15% triggers a stress-test on repayment capacity "
            "under revenue contraction scenarios. Business vintage is log-transformed and combined "
            "with turnover volatility to produce a 'Business Stability Score' (0–100). Audit "
            "certification status is a binary multiplier on computed income."
        ),
        "risk_flags": [
            "Turnover decline > 25% YoY -> income haircut applied, LTV reduced",
            "Business vintage < 3 years -> sub-prime bracket, NSTP required",
            "Unaudited financials -> income discounted 25%",
            "TGE flag absent -> income verification escalated to credit ops",
        ],
    },
    {
        "num":   "03",
        "badge": "SECTION 03",
        "title": "Income & Financials",
        "sub":   "Repayment Capacity - DBR - Banking Behaviour",
        "color": C_AMBER,
        "icon":  "Rs.",
        "overview": (
            "The Income & Financials section quantifies the borrower's repayment capacity -- the "
            "single most critical variable in credit decisioning. It combines verified income, "
            "debt obligations, and banking behaviour into a holistic affordability picture."
        ),
        "fields": [
            ("Net Monthly Income (NMI)", "Eligible income after professional tax, existing EMI obligations, and any haircuts. The foundational input for EMI affordability computation."),
            ("Total Eligible Income (Annual)", "Annualised NMI. Used for tax bracket verification and macro-level sanity checks against declared ITR."),
            ("Income Program Applied", "The underwriting program (e.g. CROSS_SELL_BT, STANDARD_LAP). Each program has distinct income recognition rules, LTV caps, and NSTP thresholds."),
            ("DBR / DTI Ratio",        "Debt Burden Ratio -- total monthly EMI obligations as a percentage of NMI. Policy threshold is 50%; above 40% triggers review. The circular gauge provides instant visual risk classification."),
            ("Total Monthly Obligation","Sum of all active EMIs including proposed EMI. An elevated obligation relative to income is the most common trigger for application decline."),
            ("Avg Monthly Credits (AMC)", "Average monthly inflows across all bank accounts over 6–12 months. Serves as an independent income proxy to cross-validate declared NMI."),
            ("AMC vs Proposed EMI",    "Coverage ratio = AMC ÷ Proposed EMI. A ratio >= 3.0x signals strong cashflow buffer. Below 1.5x indicates cashflow stress."),
            ("Cheque Returns / Bounces", "Count of dishonoured instruments in the last 6 months. A proxy for liquidity stress and payment discipline. More than 3 triggers mandatory review."),
        ],
        "ai_role": (
            "DBR is the primary continuous feature in the repayment capacity model. The AI model "
            "combines NMI, AMC, obligation stack, and cheque bounce frequency into a multi-variate "
            "'Cashflow Health Score'. The AMC/EMI coverage ratio feeds a time-series model trained "
            "on historical default rates segmented by income program. Bounce count is a non-linear "
            "risk amplifier -- the marginal default probability per additional bounce increases "
            "exponentially beyond 2 events. The DBR gauge colour-codes risk at four thresholds: "
            "<30% Healthy, 30–40% Moderate, 40–50% Elevated, >50% High Risk."
        ),
        "risk_flags": [
            "DBR > 50% -> automatic decline in most programs",
            "AMC/EMI coverage < 1.5x -> escalation to credit manager",
            "Bounces L6M >= 3 -> NSTP required; >= 5 -> decline",
            "NMI/ITR variance > 20% -> income verification flag",
        ],
    },
    {
        "num":   "04",
        "badge": "SECTION 04",
        "title": "Bureau & Credit (CIBIL)",
        "sub":   "CIBIL Score - DPD - Delinquency - Overdue",
        "color": C_RED,
        "icon":  "🛡",
        "overview": (
            "The Bureau & Credit section is the external credit intelligence layer. It translates "
            "the borrower's entire credit history -- spanning all lenders -- into standardised risk "
            "signals. CIBIL score, delinquency depth, overdue balances, and enquiry patterns "
            "collectively determine creditworthiness and NSTP authority level."
        ),
        "fields": [
            ("CIBIL Score",            "Ranges 300–900. The animated semicircular gauge positions the score within Poor/Fair/Excellent bands. Policy minimum is 750; 650–749 triggers NSTP; below 650 is a decline KO in most programs."),
            ("CMR Rank",               "Company/Credit Management Rank for non-individual entities (HUF, firms). Ranks 1–10 where 1 is best. Rank >= 7 triggers review; used alongside CIBIL score for SEP applicants."),
            ("Max DPD (Last 12M)",     "Maximum Days Past Due across all live accounts in the past 12 months. Policy requires 0 DPD; any DPD > 0 is a deviation. DPD > 30 is typically a hard KO."),
            ("Enquiry Count (L6M)",    "Number of credit bureau enquiries in the last 6 months. High enquiry count signals credit-seeking behaviour and potential overleveraging. >5 triggers risk review."),
            ("Overdue Amount CC/KCC",  "Outstanding overdue on credit card and Kisan Credit Card accounts. Must be Rs.0 at disbursement. Any overdue triggers a pre-disbursement clearance condition."),
            ("Overdue Amount Non-CC",  "Overdue on non-revolving credit facilities. Same zero-tolerance policy applies."),
            ("Derogatory Status",      "Indicates written-off, settled, or willful default accounts. A non-zero derogatory code is an immediate decline trigger in virtually all programs."),
            ("Suit Filed / Wilful Default", "Legal proceedings or RBI willful defaulter list inclusion. Hard KO -- no exception or NSTP authority can override this flag."),
            ("Days Since Last Payment","Recency of credit activity. Very old last payment (>3 years) may indicate dormant credit profile, complicating score interpretation."),
        ],
        "ai_role": (
            "CIBIL score is the single most predictive feature in the default model -- contributing "
            "approximately 28% of feature importance in gradient boosted tree models. The AI system "
            "uses the score band (not raw score) as a categorical routing variable: >=750 routes to "
            "standard processing; 650–749 to NSTP L_3/L_4; <650 triggers pre-decline review. "
            "DPD is modelled as a severity x recency interaction term. The enquiry velocity "
            "(enquiries per month trend) is a derived feature that detects credit desperation "
            "patterns not visible in the raw count. Derogatory and suit flags are hard Boolean "
            "gates applied before the ML score is computed -- they short-circuit the entire pipeline."
        ),
        "risk_flags": [
            "CIBIL < 650 -> decline in standard program; review in special programs",
            "CIBIL 650–749 -> NSTP required (L_3 NCM or higher)",
            "Any DPD > 0 in L12M -> deviation; DPD > 30 -> decline",
            "Derogatory code != 0 -> hard KO",
            "Suit Filed / Wilful Default -> hard KO, no override",
            "Overdue > Rs.0 -> pre-disbursement clearance condition",
        ],
    },
    {
        "num":   "05",
        "badge": "SECTION 05",
        "title": "Property Details",
        "sub":   "Collateral - LTV - Valuation - Risk Tier",
        "color": (100, 160, 240),
        "icon":  "🏠",
        "overview": (
            "The Property Details section evaluates the collateral underpinning the Loan Against "
            "Property. In LAP underwriting, the property is both the source of security and a "
            "key risk variable -- its type, location tier, market value, and LTV determine "
            "the maximum sanctionable loan amount and influence the risk premium."
        ),
        "fields": [
            ("Property Type",          "Residential, Commercial, or Industrial. Each type has distinct LTV caps (Residential: up to 70%; Commercial: up to 60%; Industrial: up to 55%) and liquidity risk profiles."),
            ("Property Sub-Type",      "Further classifies into Self-Occupied, Rented-out, Vacant, etc. A rented investment property introduces tenancy risk and affects forced-sale value assumptions."),
            ("Tier Location",          "Tier 1 (metros), Tier 2, or Tier 3 cities. Location tier directly impacts liquidity discount applied to market value. Tier 3 properties may attract 20–30% additional haircut."),
            ("Min Market Value",       "Lower bound of the bank-empanelled valuer's assessment. Loan computation uses the minimum -- not average -- to build in a conservative buffer."),
            ("Loan Amount",            "Proposed disbursement amount. Must satisfy: Loan Amount ≤ Market Value x LTV Cap."),
            ("LTV Ratio (Policy)",     "Loan-to-Value ratio. The animated donut gauge provides immediate visual classification: <50% Strong (green), 50–65% Moderate (amber), >65% High Risk (red). RBI caps LAP LTV at 70%."),
            ("Max Loan by LTV",        "Computed ceiling: Market Value x Policy LTV%. The proposed loan must not exceed this figure. Breaches require RBI exception or valuer re-assessment."),
        ],
        "ai_role": (
            "The property risk model is a geo-spatial ML model trained on historical property "
            "liquidation data, title dispute rates, and forced-sale-value/market-value ratios "
            "across pin codes. Location tier is encoded using target-encoded district-level default "
            "rates. LTV ratio is the strongest collateral feature -- a 10% increase in LTV above "
            "60% is associated with a 34% increase in loss-given-default in historical LAP "
            "portfolios. Property sub-type interacts with location tier: a Tier 2 commercial "
            "property has significantly lower liquidity than a Tier 1 residential property at the "
            "same LTV. The AI model computes a 'Collateral Adequacy Score' (0–100) combining "
            "all property signals."
        ),
        "risk_flags": [
            "LTV > 65% -> amber risk; LTV > 70% -> RBI ceiling breach",
            "Tier 3 location -> additional 15% value haircut in model",
            "Commercial/Industrial type -> lower LTV cap applied",
            "Rented-out property -> tenancy risk flag, legal opinion mandatory",
            "Market value < Rs.30L -> minimum loan size constraint may apply",
        ],
    },
    {
        "num":   "06",
        "badge": "SECTION 06",
        "title": "Collateral & Legal",
        "sub":   "Fraud Prevention - Legal Status - Processing Delays",
        "color": (180, 100, 220),
        "icon":  "🔒",
        "overview": (
            "The Collateral & Legal section consolidates fraud detection signals, legal due "
            "diligence status, and operational processing metrics. It is the final compliance "
            "gate before sanction -- ensuring the property title is clear, the applicant has no "
            "fraud ring linkages, and all legal instruments are in order."
        ),
        "fields": [
            ("Hunter / Fraud Ring Detection", "KARZA API real-time check against known fraud ring databases. A 'Match' result is a hard KO. 'No Match' (isMatch=FALSE) is required to proceed."),
            ("External Dedupe",        "Cross-checks the applicant against all active and historical loan applications within the lending institution and partner network. Prevents concurrent application fraud."),
            ("Legal Report Processing Days", "Calendar days elapsed since the legal search report was commissioned to the panel advocate. Benchmark is <90 days; >200 days signals systemic delay and may require re-commissioning."),
            ("Technical Report Processing Days", "Days elapsed for the panel valuer's technical/valuation report. >300 days indicates a stale valuation that may not reflect current market conditions."),
            ("EMI Paid Count",         "Number of EMIs paid on record across existing loan accounts. A high count (>24) signals consistent payment history; used as a positive signal in the repayment model."),
            ("Bounce Count (L6M)",     "As in the Income section, ECS/NACH bounce count on existing loan EMIs. A direct measure of payment discipline on current obligations."),
            ("Title Clearance",        "Certificate confirming the property has a clean, marketable title -- no encumbrances, disputes, or litigation. Mandatory for disbursement."),
            ("Encumbrance Certificate","Confirms the property has no registered charges, mortgages, or legal liabilities for the requested search period. Required from the sub-registrar's office."),
        ],
        "ai_role": (
            "Fraud detection is a rule-based pre-filter applied before ML scoring. Hunter match "
            "and dedupe flags are Boolean hard gates. The AI system then applies a 'Legal Risk "
            "Score' computed from report processing delays (used as proxies for document "
            "quality issues), title clearance status, and encumbrance certificate recency. "
            "Processing delays > 300 days are treated as a missing data signal -- the model "
            "assigns higher uncertainty to the collateral valuation and may recommend a "
            "conditional sanction pending fresh reports. EMI paid count and bounce count from "
            "existing loans are recycled as payment behaviour features, reinforcing signals "
            "already captured in the Bureau section but sourced from internal loan management "
            "systems rather than the external bureau."
        ),
        "risk_flags": [
            "Hunter match = TRUE -> hard KO, fraud alert raised",
            "External dedupe match -> investigation required before processing",
            "Legal report > 300 days -> re-commission required",
            "Technical report > 300 days -> fresh valuation mandatory",
            "Title clearance pending -> conditional sanction only",
            "Encumbrance cert pending -> disbursement blocked",
        ],
    },
]

AI_FRAMEWORK = """
HOW AI TRANSFORMS CREDIT UNDERWRITING

Traditional credit underwriting relied on rule-based scorecards, manual income verification,
and subjective judgement. AI-powered underwriting replaces and augments each layer:

1. DATA INGESTION LAYER
   Bureau data, bank statements, GST returns, property valuations, and KYC documents are
   parsed by OCR + NLP models. Structured features are extracted automatically, reducing
   processing time from days to minutes.

2. FEATURE ENGINEERING
   Raw data is transformed into predictive signals: YoY revenue trend (velocity), DPD x
   recency interaction (severity-adjusted delinquency), enquiry velocity (credit-seeking
   behaviour), AMC/NMI ratio (income verification proxy), LTV x property tier (collateral
   risk), and 200+ additional derived features.

3. RISK SCORING MODEL
   A gradient boosted ensemble (XGBoost + LightGBM) trained on 5+ years of LAP portfolio
   data produces a Composite Credit Score (0–100). Each of the six dashboard sections
   contributes a weighted sub-score. Approximate feature importance by section:
     -- Bureau & Credit (CIBIL):  28%
     -- Income & Financials:      22%
     -- Employment & Business:    18%
     -- Property Details:         16%
     -- Collateral & Legal:        9%
     -- Applicant Identity:        7%

4. DECISION ENGINE
   Score bands map to decision outcomes:
     80–100: Auto-Approve (no human intervention)
     70–79:  Approve via NCM NSTP (L_4 sign-off)
     60–69:  Approve via ZCM NSTP (L_3 sign-off)
     50–59:  Counter-offer (reduced loan amount/LTV)
     0–49:   Decline

5. NSTP ROUTING
   Non-Standard Terms Processing triggers when individual parameter deviations are detected
   (e.g. CIBIL 684 -> NSTP rule APPLICANT_CIBIL_002). The AI system identifies the
   applicable NSTP authority level and auto-routes the file to the correct approver queue.

6. EXPLAINABILITY (XAI)
   SHAP (SHapley Additive exPlanations) values are computed for every decision, providing
   regulators and credit officers with a human-readable explanation: "CIBIL score of 684
   reduced approval probability by 18 points; business vintage of 13.98 years added 12 points."

7. CONTINUOUS LEARNING
   The model is retrained quarterly on new originations and 12-month default outcomes.
   Portfolio drift is monitored via PSI (Population Stability Index) and CSI (Characteristic
   Stability Index) on all 200+ features.
"""


class UnderwritingPDF(FPDF):

    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=18)

    # Intercept text output to guarantee latin-1 safety
    def cell(self, w=0, h=0, txt='', **kw):
        return super().cell(w, h, _a(txt), **kw)

    def multi_cell(self, w, h=0, txt='', **kw):
        return super().multi_cell(w, h, _a(txt), **kw)

    # ── background fill ──────────────────────────────────────────
    def _fill_bg(self):
        self.set_fill_color(*BG_PAGE)
        self.rect(0, 0, 210, 297, "F")

    # ── page header ──────────────────────────────────────────────
    def header(self):
        self._fill_bg()
        # top accent bar
        self.set_fill_color(*C_ACCENT)
        self.rect(0, 0, 210, 1.2, "F")

    # ── cover page ───────────────────────────────────────────────
    def cover(self):
        self.add_page()
        self._fill_bg()
        self.set_fill_color(*C_ACCENT)
        self.rect(0, 0, 210, 1.5, "F")

        # large title block
        self.set_fill_color(*BG_ACCENT)
        self.rect(14, 60, 182, 90, "F")

        self.set_xy(14, 72)
        self.set_text_color(*C_MUTED)
        self.set_font("Helvetica", "B", 8)
        self.cell(182, 6, "CONFIDENTIAL -- CREDIT INTELLIGENCE REPORT", align="C", ln=True)

        self.set_xy(14, 85)
        self.set_text_color(*C_WHITE)
        self.set_font("Helvetica", "B", 22)
        self.multi_cell(182, 10, "AI-Powered Credit Underwriting", align="C")

        self.set_xy(14, 110)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*C_ACCENT)
        self.multi_cell(182, 8, "Dashboard Section Reference Guide", align="C")

        self.set_xy(14, 128)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*C_MUTED)
        self.multi_cell(182, 5,
            "A complete explanation of every underwriting parameter section, "
            "its data fields, AI model interactions, and risk flag interpretations.",
            align="C")

        # meta row
        self.set_xy(14, 165)
        self.set_fill_color(*C_SECTION_BG)
        self.rect(14, 165, 182, 28, "F")
        for i, (k, v) in enumerate([
            ("Document Type", "Section Reference & AI Framework"),
            ("Product",       "Loan Against Property (LAP)"),
            ("Audience",      "Credit Officers - Risk Analysts - AI/ML Teams"),
            ("Classification","Internal -- Restricted Distribution"),
        ]):
            self.set_xy(18, 168 + i * 6)
            self.set_font("Helvetica", "B", 8)
            self.set_text_color(*C_MUTED)
            self.cell(45, 5, k + ":", ln=False)
            self.set_font("Helvetica", "", 8)
            self.set_text_color(*C_WHITE)
            self.cell(130, 5, v, ln=True)

        # section count badges
        self.set_xy(14, 210)
        colors = [C_ACCENT, C_GREEN, C_AMBER, C_RED, (100,160,240), (180,100,220)]
        labels = ["Identity", "Employment", "Income", "Bureau", "Property", "Collateral"]
        bw = 29
        for i, (lbl, col) in enumerate(zip(labels, colors)):
            x = 14 + i * (bw + 1.5)
            self.set_fill_color(*col)
            self.rect(x, 210, bw, 14, "F")
            self.set_xy(x, 212)
            self.set_font("Helvetica", "B", 7)
            self.set_text_color(*BG_PAGE)
            self.cell(bw, 4, f"0{i+1}", align="C", ln=True)
            self.set_xy(x, 216)
            self.set_font("Helvetica", "", 6)
            self.cell(bw, 4, lbl, align="C")

        self.set_xy(14, 248)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*C_MUTED)
        self.cell(182, 5, "Generated from the Underwriting Workbench Dashboard - Ritesh Kumar - 2026", align="C")

    # ── table of contents ────────────────────────────────────────
    def toc_page(self):
        self.add_page()
        self._page_title("Table of Contents")
        self.ln(4)

        entries = [
            ("1.", "How to Use This Report",             "3"),
            ("2.", "AI Framework Overview",              "4"),
            ("3.", "Section 01 -- Applicant Identity",    "5"),
            ("4.", "Section 02 -- Employment & Business", "7"),
            ("5.", "Section 03 -- Income & Financials",   "9"),
            ("6.", "Section 04 -- Bureau & Credit (CIBIL)","11"),
            ("7.", "Section 05 -- Property Details",      "13"),
            ("8.", "Section 06 -- Collateral & Legal",    "15"),
            ("9.", "Quick Reference Risk Flag Matrix",   "17"),
        ]
        for num, title, pg in entries:
            self.set_fill_color(*C_SECTION_BG)
            self.rect(14, self.get_y(), 182, 9, "F")
            self.set_xy(18, self.get_y() + 1.5)
            self.set_font("Helvetica", "B", 9)
            self.set_text_color(*C_ACCENT)
            self.cell(8, 6, num, ln=False)
            self.set_font("Helvetica", "", 9)
            self.set_text_color(*C_WHITE)
            self.cell(158, 6, title, ln=False)
            self.set_font("Helvetica", "B", 9)
            self.set_text_color(*C_MUTED)
            self.cell(12, 6, pg, align="R", ln=True)
            self.ln(1.5)

    # ── how to use ───────────────────────────────────────────────
    def how_to_use(self):
        self.add_page()
        self._page_title("How to Use This Report")
        self.ln(3)

        paras = [
            ("Purpose",
             "This document is the authoritative field-level reference for the AI-Powered "
             "Credit Underwriting Dashboard used in Loan Against Property (LAP) origination. "
             "Each section of the dashboard corresponds to a chapter here, explaining what "
             "the data means, how the AI model uses it, and what risk flags to watch for."),
            ("Dashboard Architecture",
             "The dashboard is organised into six analytics cards rendered in a 3-column "
             "responsive grid. Each card corresponds to a distinct underwriting risk dimension. "
             "Cards are colour-coded by risk severity and contain animated gauges, progress "
             "bars, and KV metric grids designed for rapid visual triage by credit officers."),
            ("AI Integration",
             "Every field described in this report is either a direct model feature or a "
             "source from which features are derived. Fields marked with risk flags are "
             "either hard gates (Boolean KO rules applied before ML scoring) or high-weight "
             "continuous features in the gradient boosted ensemble model."),
            ("NSTP System",
             "Non-Standard Terms Processing (NSTP) is the deviation management framework. "
             "When any parameter falls outside policy norms, the AI system identifies the "
             "applicable NSTP rule code, determines the minimum authority level required, "
             "and routes the application to the appropriate approver queue automatically."),
        ]
        for heading, body in paras:
            self.set_fill_color(*BG_ACCENT)
            self.rect(14, self.get_y(), 4, 8, "F")
            self.set_xy(20, self.get_y())
            self.set_font("Helvetica", "B", 10)
            self.set_text_color(*C_WHITE)
            self.cell(170, 8, heading, ln=True)
            self.set_xy(14, self.get_y())
            self.set_font("Helvetica", "", 9)
            self.set_text_color(*C_MUTED)
            self.multi_cell(182, 5.5, body)
            self.ln(5)

    # ── AI framework page ────────────────────────────────────────
    def ai_framework_page(self):
        self.add_page()
        self._page_title("AI Framework Overview")
        self.ln(3)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*C_MUTED)

        lines = AI_FRAMEWORK.strip().split("\n")
        for line in lines:
            stripped = line.strip()
            if not stripped:
                self.ln(2)
            elif stripped == stripped.upper() and len(stripped) > 8 and not stripped.startswith("--"):
                # section heading
                self.ln(2)
                self.set_fill_color(*BG_ACCENT)
                self.rect(14, self.get_y(), 182, 8, "F")
                self.set_xy(16, self.get_y() + 1)
                self.set_font("Helvetica", "B", 9)
                self.set_text_color(*C_ACCENT)
                self.cell(178, 6, stripped, ln=True)
                self.set_font("Helvetica", "", 9)
                self.set_text_color(*C_MUTED)
            elif stripped.startswith("--"):
                self.set_xy(20, self.get_y())
                self.set_fill_color(*C_SECTION_BG)
                self.rect(18, self.get_y(), 178, 5.5, "F")
                self.set_xy(22, self.get_y() + 0.5)
                self.set_font("Helvetica", "", 8.5)
                self.set_text_color(*C_WHITE)
                self.cell(174, 4.5, stripped, ln=True)
                self.set_font("Helvetica", "", 9)
                self.set_text_color(*C_MUTED)
            else:
                self.set_xy(14, self.get_y())
                self.multi_cell(182, 5, stripped)

    # ── section page ─────────────────────────────────────────────
    def section_page(self, sec):
        self.add_page()
        col = sec["color"]

        # Section header banner
        self.set_fill_color(*col)
        self.rect(0, 10, 210, 18, "F")
        self.set_xy(14, 13)
        self.set_font("Helvetica", "B", 7)
        self.set_text_color(*BG_PAGE)
        self.cell(30, 5, sec["badge"], ln=False)
        self.set_font("Helvetica", "B", 14)
        self.cell(120, 5, sec["title"], ln=False)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*BG_PAGE)
        self.set_xy(14, 21)
        self.cell(182, 5, sec["sub"])

        self.set_y(32)

        # Overview
        self._sub_heading("Overview", col)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*C_MUTED)
        self.set_x(14)
        self.multi_cell(182, 5.5, sec["overview"])
        self.ln(4)

        # Fields table
        self._sub_heading("Data Fields & Underwriting Significance", col)
        for i, (field, desc) in enumerate(sec["fields"]):
            bg = BG_CARD if i % 2 == 0 else C_SECTION_BG
            row_h = max(9, self._estimate_rows(desc) * 4.5 + 3)
            if self.get_y() + row_h > 272:
                self.add_page()
                self._fill_bg()
                self.set_fill_color(*col)
                self.rect(0, 10, 210, 4, "F")
                self.set_y(18)

            self.set_fill_color(*bg)
            self.rect(14, self.get_y(), 182, row_h, "F")
            # left accent bar
            self.set_fill_color(*col)
            self.rect(14, self.get_y(), 2, row_h, "F")
            y_row = self.get_y()
            # field name
            self.set_xy(18, y_row + 1.5)
            self.set_font("Helvetica", "B", 8.5)
            self.set_text_color(*C_WHITE)
            self.cell(55, 5, field, ln=False)
            # description
            self.set_xy(75, y_row + 1.5)
            self.set_font("Helvetica", "", 8)
            self.set_text_color(*C_MUTED)
            self.multi_cell(119, 4.5, desc)
            self.set_y(y_row + row_h + 1)

        self.ln(4)

        # AI role
        if self.get_y() > 235:
            self.add_page()
            self._fill_bg()
            self.set_fill_color(*col)
            self.rect(0, 10, 210, 4, "F")
            self.set_y(18)

        self._sub_heading("How AI Uses This Section", col)
        self.set_fill_color(*BG_CARD)
        ai_text = sec["ai_role"]
        ai_h = self._estimate_rows(ai_text) * 5 + 8
        self.rect(14, self.get_y(), 182, ai_h, "F")
        self.set_fill_color(*col)
        self.rect(14, self.get_y(), 2, ai_h, "F")
        self.set_xy(18, self.get_y() + 3)
        self.set_font("Helvetica", "I", 8.5)
        self.set_text_color(*C_WHITE)
        self.multi_cell(176, 5, ai_text)
        self.set_y(self.get_y() + 3)
        self.ln(4)

        # Risk flags
        if self.get_y() > 235:
            self.add_page()
            self._fill_bg()
            self.set_fill_color(*col)
            self.rect(0, 10, 210, 4, "F")
            self.set_y(18)

        self._sub_heading("Risk Flags & Triggers", col)
        for flag in sec["risk_flags"]:
            # parse severity from flag text
            sev_color = C_RED if ("KO" in flag or "decline" in flag.lower() or "block" in flag.lower()) \
                       else C_AMBER if ("required" in flag.lower() or "flag" in flag.lower() or "condition" in flag.lower()) \
                       else C_GREEN
            self.set_fill_color(*C_SECTION_BG)
            self.rect(14, self.get_y(), 182, 7, "F")
            self.set_fill_color(*sev_color)
            self.rect(14, self.get_y(), 2, 7, "F")
            self.set_xy(18, self.get_y() + 1.2)
            self.set_font("Helvetica", "", 8.5)
            self.set_text_color(*C_WHITE)
            # split on ->
            if "->" in flag:
                trigger, action = flag.split("->", 1)
                self.set_font("Helvetica", "B", 8.5)
                self.cell(80, 5, trigger.strip(), ln=False)
                self.set_font("Helvetica", "", 8.5)
                self.set_text_color(*sev_color)
                self.cell(5, 5, "->", ln=False)
                self.set_text_color(*C_WHITE)
                self.cell(90, 5, action.strip(), ln=True)
            else:
                self.cell(176, 5, flag, ln=True)
            self.ln(1.5)

    # ── risk matrix page ─────────────────────────────────────────
    def risk_matrix(self):
        self.add_page()
        self._page_title("Quick Reference Risk Flag Matrix")
        self.ln(4)

        # header row
        self.set_fill_color(*BG_ACCENT)
        self.rect(14, self.get_y(), 182, 8, "F")
        self.set_xy(14, self.get_y() + 1.5)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*C_ACCENT)
        for col_label, col_w in [("Section", 38), ("Parameter", 50), ("Threshold", 48), ("Action", 44)]:
            self.cell(col_w, 5, col_label, ln=False)
        self.ln()

        all_flags = [
            ("Identity",    "PAN NSDL Status",       "= FALSE",                   "Hard KO -- Decline"),
            ("Identity",    "Age at Maturity",        "> 70 years",                "Tenor cap / Guarantor"),
            ("Employment",  "Business Vintage",       "< 3 years",                 "NSTP required"),
            ("Employment",  "Turnover Trend YoY",     "Decline > 25%",             "Income haircut + LTV cut"),
            ("Employment",  "Financials Audited",     "= No",                      "Income discounted 25%"),
            ("Income",      "DBR / DTI",              "> 50%",                     "Hard KO -- Decline"),
            ("Income",      "DBR / DTI",              "40–50%",                    "NSTP required"),
            ("Income",      "AMC / EMI Coverage",     "< 1.5x",                    "Escalate to CM"),
            ("Income",      "Bounces L6M",            ">= 3",                       "NSTP; >= 5 -> Decline"),
            ("Bureau",      "CIBIL Score",            "< 650",                     "Hard KO -- Decline"),
            ("Bureau",      "CIBIL Score",            "650–749",                   "NSTP L_3/L_4 required"),
            ("Bureau",      "Max DPD L12M",           "> 30 days",                 "Hard KO -- Decline"),
            ("Bureau",      "Derogatory Code",        "!= 0",                       "Hard KO -- Decline"),
            ("Bureau",      "Suit Filed",             "= Yes",                     "Hard KO -- No override"),
            ("Bureau",      "Overdue Amount",         "> Rs.0",                      "Pre-disbursement clear"),
            ("Property",    "LTV Ratio",              "> 70%",                     "RBI ceiling breach"),
            ("Property",    "LTV Ratio",              "65–70%",                    "High risk review"),
            ("Property",    "Location Tier",          "= Tier 3",                  "Haircut 15% on value"),
            ("Collateral",  "Hunter Match",           "= TRUE",                    "Hard KO -- Fraud alert"),
            ("Collateral",  "Dedupe Match",           "= Match",                   "Investigation required"),
            ("Collateral",  "Legal Report Age",       "> 300 days",                "Re-commission required"),
            ("Collateral",  "Title Clearance",        "= Pending",                 "Conditional sanction"),
            ("Collateral",  "Encumbrance Cert",       "= Pending",                 "Disbursement blocked"),
        ]

        action_color = lambda a: (
            C_RED   if "KO" in a or "Decline" in a or "blocked" in a or "alert" in a
            else C_AMBER if "required" in a or "Escalate" in a or "haircut" in a or "cap" in a
            else C_GREEN
        )

        for i, (sec, param, threshold, action) in enumerate(all_flags):
            bg = BG_CARD if i % 2 == 0 else C_SECTION_BG
            self.set_fill_color(*bg)
            self.rect(14, self.get_y(), 182, 7, "F")
            self.set_xy(14, self.get_y() + 1)
            self.set_font("Helvetica", "B", 7.5)
            self.set_text_color(*C_MUTED)
            self.cell(38, 5, sec, ln=False)
            self.set_font("Helvetica", "", 7.5)
            self.set_text_color(*C_WHITE)
            self.cell(50, 5, param, ln=False)
            self.set_text_color(*C_AMBER)
            self.cell(48, 5, threshold, ln=False)
            self.set_text_color(*action_color(action))
            self.set_font("Helvetica", "B", 7.5)
            self.cell(44, 5, action, ln=True)
            self.ln(1)

    # ── helpers ──────────────────────────────────────────────────
    def _page_title(self, text):
        self.set_fill_color(*BG_ACCENT)
        self.rect(14, self.get_y(), 182, 12, "F")
        self.set_xy(18, self.get_y() + 3)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(*C_WHITE)
        self.cell(174, 7, text, ln=True)

    def _sub_heading(self, text, col=None):
        c = col or C_ACCENT
        self.set_fill_color(*c)
        self.rect(14, self.get_y(), 2, 7, "F")
        self.set_xy(18, self.get_y() + 0.5)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*C_WHITE)
        self.cell(176, 6, text, ln=True)
        self.ln(1)

    def _estimate_rows(self, text, width_chars=72):
        import math
        words = text.split()
        lines, cur = 1, 0
        for w in words:
            if cur + len(w) + 1 > width_chars:
                lines += 1; cur = len(w)
            else:
                cur += len(w) + 1
        return lines

    def footer(self):
        self.set_y(-12)
        self.set_fill_color(*C_DIVIDER)
        self.rect(14, self.get_y(), 182, 0.4, "F")
        self.set_y(-10)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*C_MUTED)
        self.cell(91, 5, "AI Credit Underwriting Dashboard -- Section Reference", ln=False)
        self.cell(91, 5, f"Page {self.page_no()}", align="R")


# ── Build PDF ─────────────────────────────────────────────────────
pdf = UnderwritingPDF()
pdf.set_title("AI Credit Underwriting Dashboard -- Section Reference Guide")
pdf.set_author("Underwriting Workbench")

pdf.cover()
pdf.toc_page()
pdf.how_to_use()
pdf.ai_framework_page()
for sec in SECTIONS:
    pdf.section_page(sec)
pdf.risk_matrix()

pdf.output(OUTPUT)
print(f"PDF saved -> {OUTPUT}")
