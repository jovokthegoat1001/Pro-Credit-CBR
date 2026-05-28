// Sample CBR data — Project Duo (demo)
window.SAMPLE_REPORT = {
  meta: {
    borrower: "PROJECT DUO EVENTS AND MARKETING CORP.",
    reportDate: "May 05-06, 2026",
    estAnnRev: "P388,457,855",
    riskRating: 4,
    riskTier: "HIGH",
    riskLine: "Multiple material findings within the last 24 months + adverse media",
  },

  nfis: [
    {
      name: "VON AARON MAULEON",
      role: "PRESIDENT",
      hit: true,
      items: [
        { provider: "PNB | ALLIED", amount: "P55,264", remarks: "CCD W-OFF CC – DEC '10", conclusion: "W-OFF", conclusionType: "red" },
        { provider: "PNB | ABC", amount: "P50,000 (CL)", remarks: "CANCELLED CARD – MAR '11", conclusion: "—", conclusionType: "slate" },
      ],
    },
    {
      name: "ROBBIE BOY ARCILLA",
      role: "VICE PRESIDENT",
      hit: true,
      items: [
        { provider: "CITI | UBP (via Collectius)", amount: "P47,335", remarks: "CANCELLED CC – Jan '09; Fully Paid Apr '24", conclusion: "CLOSED", conclusionType: "slate" },
        { provider: "HSBC", amount: "P43,500", remarks: "CANCELLED CC – Nov '08; Fully Settled Dec '23", conclusion: "CLOSED", conclusionType: "slate" },
      ],
    },
  ],

  cic: [
    {
      name: "PROJECT DUO",
      role: "CORPORATE",
      hit: true,
      items: [
        { provider: "RURAL BANK OF CARDONA", amount: "P5,000,000", remarks: "DEC '25 – 1 CYCLE LATE", conclusion: "CURRENT", conclusionType: "amber" },
        { provider: "BDO UNIBANK", amount: "P471,800", remarks: "SEP '20 – 2 CYCLES (CLOSED)", conclusion: "CLOSED", conclusionType: "slate" },
      ],
    },
    {
      name: "VON AARON MAULEON",
      role: "PRESIDENT",
      hit: true,
      items: [
        { provider: "GLOBAL DOMINION", amount: "P298,098", remarks: "MAR '24 – >1 YEAR DELAY (CLOSED)", conclusion: "CLOSED", conclusionType: "slate" },
        { provider: "METROBANK CARD", amount: "P1,000,000", remarks: "JAN '26 – 1 CYCLE LATE (CC)", conclusion: "PAST DUE", conclusionType: "red" },
        { provider: "BDO UNIBANK", amount: "P1,000,000", remarks: "AUG '25 – 1 CYCLE (CC)", conclusion: "PAST DUE", conclusionType: "red" },
        { provider: "BDO UNIBANK", amount: "P830,000", remarks: "FEB '26 – 1 CYCLE (CC)", conclusion: "PAST DUE", conclusionType: "red" },
        { provider: "BPI", amount: "P120,000", remarks: "DEC '25 – 1 CYCLE (CC CLOSED)", conclusion: "CLOSED", conclusionType: "slate" },
        { provider: "METROBANK CARD", amount: "P1,000,000", remarks: "OCT '25 – 1 CYCLE (CC CLOSED)", conclusion: "CLOSED", conclusionType: "slate" },
      ],
    },
    {
      name: "ROBBIE BOY ARCILLA",
      role: "VICE PRESIDENT",
      hit: true,
      items: [
        { provider: "BDO UNIBANK (CC)", amount: "P1,000,000", remarks: "JUL '25 – 1 CYCLE LATE", conclusion: "PAST DUE", conclusionType: "red" },
        { provider: "BDO UNIBANK (CC)", amount: "P1,000,000", remarks: "MAR '26 – 1 CYCLE LATE", conclusion: "PAST DUE", conclusionType: "red" },
        { provider: "BDO UNIBANK (CC)", amount: "P1,000,000", remarks: "JUL '25 – 1 CYCLE LATE", conclusion: "PAST DUE", conclusionType: "red" },
        { provider: "BDO UNIBANK (CC)", amount: "P100,000", remarks: "AUG '25 – 1 CYCLE LATE", conclusion: "PAST DUE", conclusionType: "red" },
      ],
    },
  ],

  crif: {
    issued: "13-May-2026",
    litigation: "NEGATIVE",
    company: "PROJECT DUO INTEGRATED COMMUNICATIONS CORP.",
    secReg: "CS201415536 (11-Aug-2014)",
    legalForm: "Corporation",
    status: "ACTIVE",
    tin: "008-838-668-000",
    paidUpCapital: "P6,875,004.00",
    employees: 85,
    lineOfBusiness: "Events Marketing Management Services (Code 8742-0300)",
    activityStart: 2014,
    principal: "Von Aaron T. Mauleon – CEO",
    fin2024: [
      { label: "Total Revenue", val: "P388,457,855" },
      { label: "Net Worth", val: "P79,909,756" },
      { label: "Total Assets", val: "P191,654,428" },
    ],
    shareholders: [
      { name: "Von Aaron T. Mauleon", gisRole: "President / CEO / Chairman (Board: C)", crifRole: "Chairman / CEO / President", shares: "P3,437,497", pct: "49.9999%", tin: "302-131-775-000" },
      { name: "Robbie Boy G. Arcilla", gisRole: "Vice President / COO (Board: M)", crifRole: "COO / Vice President / Director", shares: "P3,437,497", pct: "49.9999%", tin: "305-598-161-000" },
      { name: "Anneth Viviene T. Mauleon", gisRole: "Director (Board: M)", crifRole: "Director", shares: "P3", pct: "0.00004%", tin: "217-232-326-000" },
      { name: "Charmine Christine C. Arcilla", gisRole: "Treasurer / Director (Board: M)", crifRole: "Treasurer / Director", shares: "P2", pct: "0.00003%", tin: "261-422-799-000" },
      { name: "Rina G. Arcilla", gisRole: "Director (Board: M)", crifRole: "Director", shares: "P2", pct: "0.00003%", tin: "430-124-305-000" },
      { name: "Fe A. De Guzman", gisRole: "Director (Board: M)", crifRole: "Director", shares: "P1", pct: "0.00001%", tin: "441-079-286-000" },
      { name: "Alma Vida M. Gerado", gisRole: "Corporate Secretary (Board: M)", crifRole: "Company Secretary / Director", shares: "P1", pct: "0.00001%", tin: "204-472-499-000" },
      { name: "Victor Alvin T. Mauleon", gisRole: "Director (Board: M)", crifRole: "Director", shares: "P1", pct: "0.00001%", tin: "251-731-283-000" },
    ],
  },

  threeWay: [
    { dp: "Legal Company Name", gis: "PROJECT DUO INTEGRATED COMMUNICATIONS CORP.", crif: "PROJECT DUO INTEGRATED COMMUNICATIONS CORP.", cbr: "PROJECT DUO EVENTS AND MARKETING CORP.", verdict: "CBR NAME MISMATCH", verdictType: "red" },
    { dp: "Tradestyle / DBA", gis: "PROJECT DUO", crif: "PROJECT DUO", cbr: "PROJECT DUO", verdict: "MATCH", verdictType: "green" },
    { dp: "SEC Registration No.", gis: "CS201415536", crif: "CS201415536", cbr: "CS201415536", verdict: "MATCH", verdictType: "green" },
    { dp: "Von Mauleon – Role", gis: "President / CEO (Chairman)", crif: "Chairman / CEO / President", cbr: "PRESIDENT", verdict: "MATCH", verdictType: "green" },
    { dp: "Robbie Arcilla – Role", gis: "Vice President / COO", crif: "COO / VP / Director", cbr: "VICE PRESIDENT", verdict: "MATCH", verdictType: "green" },
    { dp: "Total Shareholders", gis: "8 (all Filipino; 0% foreign)", crif: "8", cbr: "Not in template", verdict: "CONSISTENT", verdictType: "green" },
    { dp: "Paid-up Capital", gis: "P6,875,004", crif: "P6,875,004", cbr: "Not in template", verdict: "CONSISTENT", verdictType: "green" },
    { dp: "Total Assets", gis: "P191,654,427 (audited)", crif: "P191,654,428", cbr: "Not in template", verdict: "CONSISTENT", verdictType: "green" },
    { dp: "Litigation / Legal", gis: "N/A", crif: "NEGATIVE (13-May-2026)", cbr: "NAMESCAN: PEP/Sanctions CLEAR; Adverse Media HIT", verdict: "ADVERSE MEDIA", verdictType: "red" },
    { dp: "Von Mauleon – NFIS", gis: "N/A", crif: "N/A", cbr: "TRUE – PNB W-OFF P55K (2010)", verdict: "OLD NFIS HIT", verdictType: "amber" },
    { dp: "Robbie Arcilla – NFIS", gis: "N/A", crif: "N/A", cbr: "TRUE – Cancelled (settled)", verdict: "SETTLED / OLD", verdictType: "green" },
  ],

  namescan: [
    { subject: "PROJECT DUO EVENTS AND MARKETING CORP.", scanId: "S2440293", date: "05-May-2026", sanctionsPep: "FALSE — 0 matches", adverse: "HIT — SEC advisory (Feb–Mar 2026)", verdict: "ADVERSE MEDIA — VERIFY", verdictType: "red" },
    { subject: "ARCILLA, ROBBIE BOY DE GUZMAN", scanId: "S2442817", date: "07-May-2026", sanctionsPep: "FALSE — 0 matches", adverse: "CLEAR — 0 results", verdict: "CLEAR", verdictType: "green" },
    { subject: "MAULEON, VON AARON TORRES", scanId: "S2442818", date: "07-May-2026", sanctionsPep: "FALSE — 0 matches", adverse: "CLEAR — 0 results", verdict: "CLEAR", verdictType: "green" },
  ],

  adverseMedia: [
    { source: "SEC Philippines / GMA Network", finding: "Company name appears on SEC list of UNAUTHORIZED ONLINE LENDING PLATFORMS", date: "Feb–Mar '26", assessment: "MATERIAL — follow-up required", assessmentType: "red" },
    { source: "Reddit / BitPinas", finding: "Company name cited in PH SEC Investment Scam Watchlist articles", date: "Mar '26", assessment: "MATERIAL — follow-up required", assessmentType: "red" },
    { source: "Facebook / Instagram", finding: "Company name linked to SEC advisory posts on social media", date: "Mar '26", assessment: "CORROBORATING", assessmentType: "amber" },
  ],

  summaryFindings: [
    "PROJECT DUO (Corporate): NAMESCAN PEP/Sanctions CLEAR; Google Adverse Media linked the corporate name to the PH SEC's list of UNAUTHORIZED ONLINE LENDING PLATFORMS (GMA, Reddit, BitPinas, social media, Feb–Mar 2026). Rural Bank of Cardona term loan (P5M) shows 1-cycle delays in Dec 2025 and Aug 2025 but otherwise current.",
    "VON AARON MAULEON (President / 50%): NAMESCAN CLEAR. NFIS shows old PNB CC write-off (P55K, Dec 2010). CIC reveals Global Dominion personal loan (P298K) >1 year delay, closed Apr 2024. Three active BDO/Metrobank credit cards with 1-cycle delinquencies as recent as Feb 2026.",
    "ROBBIE BOY ARCILLA (VP / 50%): NAMESCAN CLEAR. NFIS shows two old cancelled cards (both fully settled by 2024). CIC shows four BDO credit card accounts with 1-cycle delays between Jul 2025 and Mar 2026.",
  ],

  actionPlan: [
    "PRIORITY — ADVERSE MEDIA: Credit Ops to request written clarification from borrower on the NAMESCAN adverse media finding. Borrower must explain the basis of inclusion on the SEC unauthorized online lending platform list and provide documentary evidence of resolution or non-involvement.",
    "DELINQUENCY: Request loan agreements, SOA, and/or clearance certificates for the Rural Bank of Cardona term loan and all flagged credit card accounts (Von Mauleon and Robbie Arcilla).",
    "Request clarification on all CC delinquencies within the last 24 months for both principals.",
    "Confirm current registered legal name — GIS and CRIF show 'PROJECT DUO INTEGRATED COMMUNICATIONS CORP.' while the CBR template reflects the former name 'EVENTS AND MARKETING CORP.' Update records accordingly.",
  ],

  rationale: [
    "NAMESCAN adverse media hit — company linked to SEC unauthorized lending platform advisory (Feb–Mar 2026, multiple credible sources)",
    "3 active past-due CC accounts (Von Mauleon, Jan–Feb 2026)",
    "4 past-due CC instances (Robbie Arcilla, Jul 2025–Mar 2026)",
    "Corporate 1-cycle delinquency — Rural Bank term loan (Dec 2025)",
    "Old NFIS write-off — Von Mauleon PNB (2010)",
  ],

  signoff: [
    { role: "Written by", who: "Monica Arango", title: "Mngt Assoc" },
    { role: "Follow-up by", who: "—", title: "Credit Ops Assoc" },
    { role: "Approved by", who: "Adnan Agha", title: "President" },
  ],

  facilities: {
    installments: [
      { subject: "PROJECT DUO", lender: "RURAL BANK OF CARDONA", contract: "TERM LOAN", amount: "P5,000,000", start: "MAY '25", end: "JUN '30", status: "CURRENT", settled: "—" },
      { subject: "PROJECT DUO", lender: "FIRST CIRCLE", contract: "BUSINESS LOAN", amount: "P2,828,600", start: "NOV '25", end: "FEB '26", status: "CURRENT", settled: "—" },
      { subject: "PROJECT DUO", lender: "FIRST CIRCLE", contract: "BUSINESS LOAN", amount: "P3,190,464", start: "OCT '25", end: "JAN '26", status: "CURRENT", settled: "—" },
      { subject: "PROJECT DUO", lender: "DISCOVERY", contract: "BUSINESS LOAN", amount: "P10,000,000", start: "JUL '25", end: "JAN '26", status: "CURRENT", settled: "—" },
      { subject: "PROJECT DUO", lender: "FIRST CIRCLE", contract: "BUSINESS LOAN", amount: "P4,172,784", start: "JUL '25", end: "OCT '25", status: "CURRENT", settled: "—" },
      { subject: "PROJECT DUO", lender: "FIRST CIRCLE", contract: "BUSINESS LOAN", amount: "P3,557,808", start: "SEP '25", end: "NOV '25", status: "CURRENT", settled: "—" },
      { subject: "PROJECT DUO", lender: "FIRST CIRCLE", contract: "BUSINESS LOAN", amount: "P4,800,015", start: "APR '25", end: "JUL '25", status: "CLOSED", settled: "JUL '25" },
      { subject: "PROJECT DUO", lender: "DISCOVERY", contract: "BUSINESS LOAN", amount: "P10,000,000", start: "MAR '25", end: "JUL '25", status: "CLOSED IN ADV.", settled: "JUL '25" },
      { subject: "PROJECT DUO", lender: "FIRST CIRCLE", contract: "BUSINESS LOAN", amount: "P3,505,000", start: "FEB '25", end: "MAY '25", status: "CLOSED", settled: "MAY '25" },
      { subject: "PROJECT DUO", lender: "FIRST CIRCLE", contract: "BUSINESS LOAN", amount: "P3,692,925", start: "JAN '25", end: "APR '25", status: "CLOSED", settled: "APR '25" },
      { subject: "PROJECT DUO", lender: "DISCOVERY", contract: "BUSINESS LOAN", amount: "P8,000,000", start: "NOV '24", end: "MAR '25", status: "CLOSED IN ADV.", settled: "MAR '25" },
      { subject: "PROJECT DUO", lender: "FIRST CIRCLE", contract: "BUSINESS LOAN", amount: "P4,522,668", start: "NOV '24", end: "FEB '25", status: "CLOSED", settled: "FEB '25" },
      { subject: "PROJECT DUO", lender: "BDO UNIBANK", contract: "VEHICLE LOAN", amount: "P471,800", start: "AUG '18", end: "AUG '21", status: "CLOSED", settled: "AUG '21" },
      { subject: "VON AARON MAULEON", lender: "BDO UNIBANK", contract: "MORT/REAL ESTATE", amount: "P3,064,000", start: "SEP '16", end: "SEP '26", status: "CURRENT", settled: "—" },
      { subject: "VON AARON MAULEON", lender: "BDO UNIBANK", contract: "VEHICLE LOAN", amount: "P700,000", start: "AUG '19", end: "DEC '24", status: "CURRENT", settled: "—" },
      { subject: "VON AARON MAULEON", lender: "GLOBAL DOMINION", contract: "PERSONAL LOAN", amount: "P298,098", start: "AUG '21", end: "JUN '23", status: "CLOSED", settled: "APR '24" },
      { subject: "VON AARON MAULEON", lender: "GLOBAL DOMINION", contract: "PERSONAL LOAN", amount: "P2,123,968", start: "JAN '23", end: "JAN '24", status: "CLOSED", settled: "JAN '24" },
      { subject: "VON AARON MAULEON", lender: "BDO UNIBANK", contract: "MORT/REAL ESTATE", amount: "P507,092", start: "JAN '18", end: "JAN '24", status: "CLOSED", settled: "JAN '24" },
      { subject: "ROBBIE ARCILLA", lender: "NEURONCREDIT", contract: "TERM LOAN", amount: "P241", start: "FEB '26", end: "MAR '26", status: "CURRENT", settled: "—" },
      { subject: "ROBBIE ARCILLA", lender: "BDO UNIBANK", contract: "VEHICLE LOAN", amount: "P1,111,600", start: "OCT '24", end: "SEP '27", status: "CURRENT", settled: "—" },
      { subject: "ROBBIE ARCILLA", lender: "BDO UNIBANK", contract: "VEHICLE LOAN", amount: "P1,755,200", start: "AUG '24", end: "AUG '28", status: "CURRENT", settled: "—" },
      { subject: "ROBBIE ARCILLA", lender: "BDO UNIBANK", contract: "VEHICLE LOAN", amount: "P583,200", start: "NOV '23", end: "NOV '26", status: "CURRENT", settled: "—" },
      { subject: "ROBBIE ARCILLA", lender: "BDO UNIBANK", contract: "VEHICLE LOAN", amount: "P1,048,000", start: "SEP '22", end: "SEP '25", status: "CURRENT", settled: "—" },
    ],
    nonInstallments: [
      { subject: "PROJECT DUO", lender: "BDO UNIBANK", contract: "L/C (STANDBY DOM.)", limit: "P500,000", start: "MAY '25", end: "MAY '26", status: "CURRENT", settled: "—" },
      { subject: "ROBBIE ARCILLA", lender: "CIMB BANK PH", contract: "CREDIT LINE", limit: "P44,800", start: "AUG '20", end: "FEB '26", status: "CURRENT", settled: "—" },
    ],
    creditCards: [
      { subject: "ROBBIE ARCILLA", lender: "COLLECTIUS FISTC-AMC", contract: "CREDIT CARD", limit: "P35,000", start: "APR '24", end: "APR '24", status: "CLOSED IN ADV.", settled: "APR '24" },
      { subject: "ROBBIE ARCILLA", lender: "RCBC BANKARD", contract: "CREDIT CARD", limit: "P224,000", start: "FEB '24", end: "—", status: "CURRENT", settled: "—" },
      { subject: "ROBBIE ARCILLA", lender: "BDO UNIBANK", contract: "CREDIT CARD", limit: "P1,000,000", start: "AUG '22", end: "AUG '27", status: "CURRENT", settled: "—" },
      { subject: "ROBBIE ARCILLA", lender: "BDO UNIBANK", contract: "CREDIT CARD", limit: "P1,000,000", start: "APR '23", end: "APR '28", status: "CURRENT", settled: "—" },
      { subject: "ROBBIE ARCILLA", lender: "BDO UNIBANK", contract: "CREDIT CARD", limit: "P1,000,000", start: "AUG '22", end: "AUG '27", status: "CURRENT", settled: "—" },
      { subject: "ROBBIE ARCILLA", lender: "BDO UNIBANK", contract: "CREDIT CARD", limit: "P100,000", start: "AUG '21", end: "AUG '26", status: "CURRENT", settled: "—" },
      { subject: "VON MAULEON", lender: "BPI", contract: "CREDIT CARD", limit: "P120,000", start: "SEP '13", end: "OCT '20", status: "CLOSED", settled: "FEB '26" },
      { subject: "VON MAULEON", lender: "METROBANK CARD", contract: "CREDIT CARD", limit: "P1,000,000", start: "NOV '23", end: "DEC '25", status: "CLOSED", settled: "DEC '25" },
      { subject: "VON MAULEON", lender: "METROBANK CARD", contract: "CREDIT CARD", limit: "P1,000,000", start: "NOV '23", end: "—", status: "CURRENT", settled: "—" },
      { subject: "VON MAULEON", lender: "BDO UNIBANK", contract: "CREDIT CARD", limit: "P1,000,000", start: "SEP '17", end: "SEP '27", status: "CURRENT", settled: "—" },
      { subject: "VON MAULEON", lender: "BDO UNIBANK", contract: "CREDIT CARD", limit: "P830,000", start: "SEP '17", end: "SEP '27", status: "CURRENT", settled: "—" },
    ],
  },
};
