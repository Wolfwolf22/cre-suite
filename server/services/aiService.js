import OpenAI from 'openai';

const MODEL = 'gpt-4o-mini';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Add it to your environment before using AI routes.');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── LOI Generator ───────────────────────────────────────────────────────────

export async function generateLOI(inputs) {
  const openai = getOpenAIClient();
  const {
    buyerName, buyerAddress = '', sellerName, sellerAddress = '', sellerContact = '',
    propertyAddress, purchasePrice, earnestMoney,
    dueDiligencePeriod, closingPeriod, financingContingency, specialConditions,
    includeNotary = false,
  } = inputs;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const propState = propertyAddress.match(/,\s*([A-Z]{2})\s+\d{5}/)
    ? propertyAddress.match(/,\s*([A-Z]{2})\s+\d{5}/)[1]
    : 'the state in which the Property is located';

  const systemPrompt = `You are a commercial real estate attorney. Generate a complete, professional Letter of Intent for the purchase of commercial real estate. Use formal legal language. Use the exact document structure provided. Do not use asterisks, stars, pound signs, or markdown formatting of any kind. Do not use *** or ** or # anywhere. Return plain text only with section numbers and clean formatting. All placeholder fields must be filled with the provided inputs. Never leave a bracket placeholder unfilled. Return ONLY valid JSON, no markdown, no code blocks.`;

  const userPrompt = `Generate a complete LOI JSON for this transaction:

Buyer: ${buyerName}${buyerAddress ? ` — ${buyerAddress}` : ''}
Seller: ${sellerName}${sellerAddress ? ` — ${sellerAddress}` : ''}${sellerContact ? ` — Attn: ${sellerContact}` : ''}
Property: ${propertyAddress}
Purchase Price: $${Number(purchasePrice).toLocaleString()}
Earnest Money: $${Number(earnestMoney).toLocaleString()}
Due Diligence: ${dueDiligencePeriod} days
Closing: ${closingPeriod} days after due diligence
Financing: ${financingContingency ? 'Subject to financing contingency' : 'All-cash or pre-approved — no financing contingency'}
Special Conditions: ${specialConditions || 'None'}
Date: ${today}
Include Notary Block: ${includeNotary ? 'Yes' : 'No'}

Return this exact JSON (write full professional legal text for every body field — no placeholders, no asterisks):
{
  "date": "${today}",
  "methodOfDelivery": "Via Electronic Mail",
  "sellerName": "${sellerName}",
  "sellerAddress": "${sellerAddress || '[Seller Address]'}",
  "sellerContact": "${sellerContact || 'Principal'}",
  "re": "LETTER OF INTENT FOR PURCHASE OF ${propertyAddress.toUpperCase()}",
  "salutation": "Dear ${sellerContact || sellerName}:",
  "intro": "This Letter of Intent sets forth the general terms and conditions upon which ${buyerName} (Buyer), with offices at ${buyerAddress || '[Buyer Address]'}, proposes to purchase certain real property from ${sellerName} (Seller). The property is located at ${propertyAddress} (the Property). Buyer and Seller are sometimes referred to herein individually as a Party and collectively as the Parties. The proposed transaction is referred to herein as the Transaction.",
  "sections": [
    { "number": "1", "title": "NON-BINDING STATUS", "body": "", "subsections": [
      { "number": "1.1", "title": "Non-Binding Letter", "body": "This Letter of Intent is non-binding and is intended solely to outline the general terms and conditions of the proposed Transaction. Neither Party shall have any legal obligation to the other with respect to the Transaction until a definitive purchase and sale agreement (Purchase Agreement) has been fully negotiated, executed, and delivered by both Parties." },
      { "number": "1.2", "title": "Binding Provisions", "body": "Notwithstanding the foregoing, Sections 9 (Confidentiality) and 10 (Governing Law) shall be binding on the Parties from the date of execution of this Letter of Intent." }
    ]},
    { "number": "2", "title": "PURCHASE AND SALE", "body": "Subject to the terms and conditions set forth herein and in the Purchase Agreement, Seller agrees to sell and Buyer agrees to purchase the Property, together with all improvements, fixtures, and appurtenances thereto, free and clear of all liens and encumbrances except those approved by Buyer during the Due Diligence Period.", "subsections": [] },
    { "number": "3", "title": "TERM AND TERMINATION", "body": "", "subsections": [
      { "number": "3.1", "title": "Exclusivity", "body": "From the date of execution of this Letter of Intent, Seller agrees not to solicit, negotiate, or enter into any agreement with any other party regarding the sale of the Property for a period of thirty (30) days, unless extended by mutual written agreement of the Parties." }
    ]},
    { "number": "4", "title": "PURCHASE PRICE", "body": "The purchase price for the Property shall be $${Number(purchasePrice).toLocaleString()} (the Purchase Price), payable in cash at Closing, subject to any prorations and adjustments as set forth in the Purchase Agreement.", "subsections": [] },
    { "number": "5", "title": "EARNEST MONEY DEPOSIT", "body": "Within three (3) business days following the execution of the Purchase Agreement, Buyer shall deposit the sum of $${Number(earnestMoney).toLocaleString()} (the Earnest Money Deposit) with a mutually agreed upon title company (Escrow Agent). The Earnest Money Deposit shall be applied to the Purchase Price at Closing or disbursed in accordance with the terms of the Purchase Agreement.", "subsections": [] },
    { "number": "6", "title": "DUE DILIGENCE PERIOD", "body": "Buyer shall have a period of ${dueDiligencePeriod} days following the execution of the Purchase Agreement (the Due Diligence Period) to conduct all physical, environmental, financial, legal, and other inspections of the Property as Buyer deems appropriate. Seller shall provide Buyer with reasonable access to the Property and all relevant documents during the Due Diligence Period. If Buyer is not satisfied with the results of its due diligence, in its sole and absolute discretion, Buyer may terminate the Purchase Agreement by written notice to Seller prior to the expiration of the Due Diligence Period, and the Earnest Money Deposit shall be returned to Buyer.", "subsections": [] },
    { "number": "7", "title": "CLOSING", "body": "The closing of the Transaction (Closing) shall occur within ${closingPeriod} days following the expiration of the Due Diligence Period, or such other date as mutually agreed upon by the Parties. At Closing, Seller shall deliver to Buyer a properly executed grant deed conveying good and marketable fee simple title to the Property, free and clear of all liens and encumbrances except those approved by Buyer.", "subsections": [] },
    { "number": "8", "title": "${financingContingency ? 'FINANCING CONTINGENCY' : 'NO FINANCING CONTINGENCY'}", "body": "${financingContingency ? "Buyer's obligation to close the Transaction is contingent upon Buyer obtaining financing from an institutional lender on terms acceptable to Buyer in its sole discretion. Buyer shall use commercially reasonable efforts to obtain financing approval. If Buyer is unable to obtain satisfactory financing within the Due Diligence Period, Buyer may terminate the Purchase Agreement and receive a full refund of the Earnest Money Deposit." : "This Transaction is not subject to any financing contingency. Buyer represents that it has or will have sufficient cash funds available to close the Transaction on the Closing Date without the need for any mortgage or other financing."}", "subsections": [] },
    { "number": "9", "title": "CONFIDENTIALITY", "body": "Each Party agrees to keep the existence and terms of this Letter of Intent and the proposed Transaction strictly confidential and shall not disclose any information relating thereto to any third party without the prior written consent of the other Party, except to each Party's respective attorneys, accountants, lenders, and other advisors who have a need to know such information and who agree to be bound by the terms of this confidentiality provision.", "subsections": [] },
    { "number": "10", "title": "GOVERNING LAW", "body": "This Letter of Intent shall be governed by and construed in accordance with the laws of ${propState}, without regard to its conflict of laws principles. Any disputes arising hereunder shall be resolved in the state and federal courts located in ${propState}.", "subsections": [] },
    { "number": "11", "title": "SPECIAL CONDITIONS", "body": "${specialConditions || 'None. The Parties acknowledge that no additional special conditions apply to this transaction beyond those set forth herein.'}", "subsections": [] }
  ],
  "closingText": "This Letter of Intent is submitted in good faith and is subject to the negotiation and execution of a definitive Purchase Agreement. This Letter of Intent expires five (5) business days from the date hereof unless executed by both Parties. We look forward to working with you on this transaction.",
  "buyerName": "${buyerName}",
  "buyerAddress": "${buyerAddress || ''}",
  "sellerName": "${sellerName}",
  "sellerAddress": "${sellerAddress || ''}",
  "includeNotary": ${includeNotary}
}`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content;
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { error: 'Failed to parse LOI', raw };
  }
}

// ─── Property Intelligence ────────────────────────────────────────────────────

export async function generatePropertySummary(propertyData) {
  const openai = getOpenAIClient();
  const systemPrompt = 'You are a senior commercial real estate analyst. Write clear, data-driven property narratives for investment memos.';

  const bridgeSnippet = propertyData.bridge ? `
BRIDGE DATA (Primary Source):
- Owner: ${propertyData.bridge.ownerName || 'N/A'}
- Assessed Value: ${propertyData.bridge.assessedValue ? `$${Number(propertyData.bridge.assessedValue).toLocaleString()}` : 'N/A'}
- Market Value: ${propertyData.bridge.marketValue ? `$${Number(propertyData.bridge.marketValue).toLocaleString()}` : 'N/A'}
- Year Built: ${propertyData.bridge.yearBuilt || 'N/A'}
- Building SF: ${propertyData.bridge.buildingSF ? Number(propertyData.bridge.buildingSF).toLocaleString() : 'N/A'}
- Lot SF: ${propertyData.bridge.lotSF ? Number(propertyData.bridge.lotSF).toLocaleString() : 'N/A'}
- Last Sale Price: ${propertyData.bridge.lastSalePrice ? `$${Number(propertyData.bridge.lastSalePrice).toLocaleString()}` : 'N/A'}
- Last Sale Date: ${propertyData.bridge.lastSaleDate || 'N/A'}
- Zoning: ${propertyData.bridge.zoning || 'N/A'}` : '';

  const bridgeMarketSnippet = propertyData.bridgeMarket ? `
BRIDGE MARKET DATA:
- Median Sale Price: ${propertyData.bridgeMarket.medianSalePrice ? `$${Number(propertyData.bridgeMarket.medianSalePrice).toLocaleString()}` : 'N/A'}
- Avg Price/SF: ${propertyData.bridgeMarket.avgPricePerSF ? `$${propertyData.bridgeMarket.avgPricePerSF}` : 'N/A'}
- Active Listings: ${propertyData.bridgeMarket.activeListings ?? 'N/A'}
- Market Heat: ${propertyData.bridgeMarket.heatLabel || 'N/A'}` : '';

  const userPrompt = `Based on the following property data, write a concise 1-paragraph professional property summary suitable for a commercial real estate investment memo:
${bridgeSnippet}
${bridgeMarketSnippet}

Additional Property Data:
${JSON.stringify({ address: propertyData.address, geocode: propertyData.geocode, attom: propertyData.attom, census: propertyData.census, flood: propertyData.flood, bridgeNeighborhood: propertyData.bridgeNeighborhood }, null, 2)}

Write a single, well-crafted paragraph (4-6 sentences) that synthesizes the key property characteristics including location, physical attributes, ownership history, assessed value relative to market, any notable flood or environmental considerations, and overall investment context. Use professional CRE language.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}

// ─── Cash Flow Analyzer ───────────────────────────────────────────────────────

export async function generateCashFlowSummary(inputs, outputs) {
  const openai = getOpenAIClient();
  const systemPrompt = 'You are a commercial real estate investment analyst. Provide concise, honest deal assessments.';

  const userPrompt = `Review the following commercial real estate cash flow analysis and write a 2-sentence deal summary:

INPUTS:
- Purchase Price: $${Number(inputs.purchasePrice).toLocaleString()}
- Property Type: ${inputs.propertyType || 'Commercial'}
- Gross Rental Income: $${Number(inputs.grossRentalIncome).toLocaleString()}/yr
- Vacancy Rate: ${inputs.vacancyRate}%
- Interest Rate: ${inputs.interestRate}%
- Loan Term: ${inputs.loanTerm} years

KEY METRICS:
- NOI: $${Number(outputs.noi).toLocaleString()}
- Cap Rate: ${outputs.capRate}%
- Cash-on-Cash Return: ${outputs.cashOnCash}%
- DSCR: ${outputs.dscr}
- 5-Year IRR: ${outputs.irr}%
- Equity Multiple: ${outputs.equityMultiple}x

Write exactly 2 sentences: (1) assess whether this is a strong or weak deal based on the metrics, (2) identify the most significant risk or opportunity. Be direct and data-driven.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}

// ─── Debt Sizing & Loan Screener (Basic) ─────────────────────────────────────

export async function generateDebtAnalysis(inputs, calculations) {
  const openai = getOpenAIClient();
  const systemPrompt = 'You are a commercial mortgage banker with expertise in all lending channels. Provide accurate lender qualification analysis in valid JSON format only.';

  const userPrompt = `Analyze this commercial real estate financing request and provide a lender qualification assessment:

PROPERTY & LOAN REQUEST:
- Property Type: ${inputs.propertyType}
- Purchase Price: $${Number(inputs.purchasePrice).toLocaleString()}
- NOI: $${Number(inputs.noi).toLocaleString()}
- Requested LTV: ${inputs.requestedLtv}%
- Loan Term: ${inputs.loanTerm} years
- Amortization: ${inputs.amortization} years

CALCULATED METRICS:
- Max Loan Amount: $${Number(calculations.maxLoanAmount).toLocaleString()}
- DSCR: ${calculations.dscr}
- Debt Yield: ${calculations.debtYield}%

Provide a JSON response with exactly this structure:
{
  "riskRating": "green" | "yellow" | "red",
  "riskRationale": "one sentence explaining the risk rating",
  "qualifyingLenders": ["Bridge", "Agency", "CMBS", "SBA 504", "Life Co", "Local Bank"],
  "disqualifiedLenders": ["lender type - reason"],
  "pitchBullets": ["bullet 1", "bullet 2", "bullet 3"],
  "strengthSummary": "2 sentence deal strength summary",
  "primaryConcern": "main underwriting concern"
}

Lender criteria: Agency DSCR>=1.25 LTV<=80% multifamily only; CMBS DSCR>=1.25 DebtYield>=8% loan>=$2M; Life Co DSCR>=1.30 LTV<=65%; SBA504 owner-occupied <=$5M DSCR>=1.15; Bridge DSCR can be below 1.0; Local Bank DSCR>=1.20 LTV<=75%. Return only valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2000,
  });

  const text = response.choices[0].message.content.trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse AI debt analysis response');
  }
}

// ─── Debt Sizing & Loan Screener (Advanced) ───────────────────────────────────

export async function generateAdvancedDebtAnalysis(inputs, calculations) {
  const openai = getOpenAIClient();
  const systemPrompt = 'You are a senior commercial mortgage banker who has closed thousands of CRE loans across all channels. Return ONLY valid JSON matching the exact schema provided, no markdown, no extra text.';

  const userPrompt = `Advanced lender qualification for this CRE financing request:

DEAL:
- Property Type: ${inputs.propertyType}
- Loan Purpose: ${inputs.loanPurpose || 'Acquisition'}
- Purchase Price: $${Number(inputs.purchasePrice).toLocaleString()}
- Current NOI: $${Number(inputs.noi).toLocaleString()}
- Stabilized NOI: $${Number(inputs.stabilizedNoi || inputs.noi).toLocaleString()}
- Renovation Budget: $${Number(inputs.renovationBudget || 0).toLocaleString()}
- Requested LTV: ${inputs.requestedLtv}%
- Loan Term: ${inputs.loanTerm} yrs | Amortization: ${inputs.amortization} yrs
- Recourse Preference: ${inputs.recourse || 'Non-Recourse'}

BORROWER:
- Net Worth: $${Number(inputs.borrowerNetWorth || 0).toLocaleString()}
- Liquidity: $${Number(inputs.borrowerLiquidity || 0).toLocaleString()}
- Credit Score Range: ${inputs.creditScore || 'Not provided'}
- Existing Bank Relationship: ${inputs.existingRelationship ? 'Yes' : 'No'}

CALCULATED:
- Max Loan: $${Number(calculations.maxLoanAmount).toLocaleString()}
- DSCR: ${calculations.dscr}
- Debt Yield: ${calculations.debtYield}%
- Cap Rate: ${calculations.capRate}%

Return JSON matching EXACTLY this schema:
{
  "riskRating": "green|yellow|red",
  "riskRationale": "string",
  "lenderMatrix": [
    {
      "lenderType": "Bridge",
      "qualification": "Strong Fit|Possible|Unlikely",
      "rateRange": "e.g. 7.5-9.0%",
      "typicalLTV": "e.g. 70-80%",
      "recourse": "Non-Recourse|Recourse|Negotiable",
      "timelineToClose": "e.g. 30-45 days",
      "keyRequirement": "string",
      "aiNote": "string"
    },
    { "lenderType": "Agency (Fannie Mae)", "qualification": "...", "rateRange": "...", "typicalLTV": "...", "recourse": "...", "timelineToClose": "...", "keyRequirement": "...", "aiNote": "..." },
    { "lenderType": "Agency (Freddie Mac)", "qualification": "...", "rateRange": "...", "typicalLTV": "...", "recourse": "...", "timelineToClose": "...", "keyRequirement": "...", "aiNote": "..." },
    { "lenderType": "CMBS", "qualification": "...", "rateRange": "...", "typicalLTV": "...", "recourse": "...", "timelineToClose": "...", "keyRequirement": "...", "aiNote": "..." },
    { "lenderType": "SBA 504", "qualification": "...", "rateRange": "...", "typicalLTV": "...", "recourse": "...", "timelineToClose": "...", "keyRequirement": "...", "aiNote": "..." },
    { "lenderType": "Life Company", "qualification": "...", "rateRange": "...", "typicalLTV": "...", "recourse": "...", "timelineToClose": "...", "keyRequirement": "...", "aiNote": "..." },
    { "lenderType": "Local Community Bank", "qualification": "...", "rateRange": "...", "typicalLTV": "...", "recourse": "...", "timelineToClose": "...", "keyRequirement": "...", "aiNote": "..." },
    { "lenderType": "Debt Fund", "qualification": "...", "rateRange": "...", "typicalLTV": "...", "recourse": "...", "timelineToClose": "...", "keyRequirement": "...", "aiNote": "..." },
    { "lenderType": "HUD / FHA", "qualification": "...", "rateRange": "...", "typicalLTV": "...", "recourse": "...", "timelineToClose": "...", "keyRequirement": "...", "aiNote": "..." }
  ],
  "approachStrategy": "2-3 paragraph lender approach strategy: which lender to call first, second, third, and exactly why. Written as actionable advice the borrower can use when making calls.",
  "pitchBullets": ["3 key selling points for this deal"],
  "primaryConcern": "string"
}`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2000,
  });

  const text = response.choices[0].message.content.trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse AI advanced debt analysis response');
  }
}

// ─── Lease Generator ─────────────────────────────────────────────────────────

export async function generateLease(inputs) {
  const openai = getOpenAIClient();
  const {
    landlordName, tenantName, propertyAddress, suiteNumber, leaseType,
    baseRent, leaseStartDate, leaseEndDate, rentEscalation, escalationValue,
    securityDeposit, permittedUse, camCap, renewalOptions, tiAllowance,
    personalGuarantee, customClauses = [],
  } = inputs;

  const systemPrompt = 'You are an experienced commercial real estate attorney specializing in landlord-tenant law. Generate complete, enforceable commercial lease agreements. Use precise legal language. Do NOT use asterisks (*), pound signs (#), markdown formatting, or bold/italic markers of any kind. Write clean plain text with numbered sections only.';

  const userPrompt = `Generate a complete, professional commercial lease agreement with the following terms:

PARTIES & PROPERTY:
- Landlord: ${landlordName}
- Tenant: ${tenantName}
- Property Address: ${propertyAddress}
- Suite/Unit: ${suiteNumber || 'Entire Premises'}
- Lease Type: ${leaseType}

FINANCIAL TERMS:
- Base Rent: $${Number(baseRent).toLocaleString()}/month
- Lease Term: ${leaseStartDate} to ${leaseEndDate}
- Rent Escalation: ${rentEscalation === 'fixed' ? `Fixed ${escalationValue}% annually` : `CPI-based (not to exceed ${escalationValue}%)`}
- Security Deposit: $${Number(securityDeposit).toLocaleString()}
- TI Allowance: ${tiAllowance ? `$${Number(tiAllowance).toLocaleString()}` : 'None'}
${leaseType === 'NNN' ? `- CAM Reconciliation Cap: ${camCap}% annually` : ''}

LEASE PROVISIONS:
- Permitted Use: ${permittedUse}
- Renewal Options: ${renewalOptions || 'None'}
- Personal Guarantee: ${personalGuarantee ? 'Required' : 'Not required'}

Generate a complete commercial lease agreement including all of these sections:
1. PARTIES AND PREMISES
2. TERM
3. BASE RENT AND RENT SCHEDULE (include full escalation schedule for the lease term)
4. ${leaseType === 'NNN' ? 'TRIPLE NET PROVISIONS - taxes, insurance, CAM with cap' : leaseType === 'Gross' ? 'GROSS LEASE - landlord expense responsibilities' : 'MODIFIED GROSS PROVISIONS'}
5. SECURITY DEPOSIT
6. USE OF PREMISES
7. CONDITION AND MAINTENANCE
8. ALTERATIONS AND IMPROVEMENTS${tiAllowance ? ` (including $${Number(tiAllowance).toLocaleString()} TI Allowance)` : ''}
9. ASSIGNMENT AND SUBLETTING
10. INSURANCE REQUIREMENTS
11. INDEMNIFICATION
12. DEFAULT AND REMEDIES
13. HOLDOVER
14. QUIET ENJOYMENT
15. SUBORDINATION, NON-DISTURBANCE AND ATTORNMENT
16. ESTOPPEL CERTIFICATES
17. DAMAGE AND DESTRUCTION
18. CONDEMNATION
19. RENEWAL OPTIONS${renewalOptions ? ` - ${renewalOptions}` : ': None'}
20. ${personalGuarantee ? 'PERSONAL GUARANTEE' : 'NO PERSONAL GUARANTEE PROVISION'}
21. NOTICES
22. GENERAL PROVISIONS (governing law, entire agreement, severability, waiver)
${customClauses.length > 0 ? customClauses.map((c, i) => `${23 + i}. ${c.title ? c.title.toUpperCase() : `CUSTOM CLAUSE ${i + 1}`}${c.body ? ` — ${c.body}` : ' — Draft a complete enforceable clause based on the title above.'}`).join('\n') : '23. (NO ADDITIONAL CUSTOM CLAUSES)'}
SIGNATURE BLOCKS

Format as a formal legal document with numbered sections. Do not use asterisks, pound signs, or any markdown formatting. Use plain text only.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}

// ─── Deal Analyzer ────────────────────────────────────────────────────────────

export async function generateDealAnalysis(inputs, realData = {}) {
  const openai = getOpenAIClient();
  const { propertyAddress, askingPrice, propertyType, currentNoi, targetMarket } = inputs;
  const impliedCap = ((currentNoi / askingPrice) * 100).toFixed(2);

  const systemPrompt = 'You are a senior commercial real estate investment analyst. Synthesize real market data into a rigorous deal analysis. Cite specific data points in your rationale. Return valid JSON only — no markdown, no extra text.';

  const realDataSection = Object.keys(realData).length > 0 ? `
REAL MARKET DATA PULLED:
${realData.bridge ? `Bridge Parcel: address=${realData.bridge.address||'N/A'}, lotAcres=${realData.bridge.lotAcres??'N/A'}, lotSF=${realData.bridge.lotSizeSF??'N/A'}, landUse=${realData.bridge.landUseDescription||'N/A'}, assessmentsUrl=${realData.bridge.assessmentsUrl||'N/A'}` : ''}
${realData.bridgeMarket ? `Bridge Market Report: metric=${realData.bridgeMarket.metricTypeKey||'N/A'}, value=${realData.bridgeMarket.dataValue??'N/A'}, periodEnd=${realData.bridgeMarket.timePeriodEndDateTime||'N/A'}, regionCity=${realData.bridgeMarket.regionCity||'N/A'}, regionCounty=${realData.bridgeMarket.regionCounty||'N/A'}` : ''}
${realData.bridgeComps ? `Bridge Nearby Comps (${realData.bridgeComps.length}): ${JSON.stringify(realData.bridgeComps.slice(0,3)).slice(0,600)}` : ''}
${realData.bridgeTrends ? `Bridge 12-Month Trends: ${JSON.stringify(realData.bridgeTrends.slice(0,4)).slice(0,400)}` : ''}
${realData.bridgeNeighborhood ? `Bridge Neighborhood: ${JSON.stringify(realData.bridgeNeighborhood).slice(0,400)}` : ''}
${realData.attom ? `ATTOM Comps: ${JSON.stringify(realData.attom).slice(0, 500)}` : ''}
${realData.census ? `Census Demographics: ${JSON.stringify(realData.census).slice(0, 400)}` : ''}
Use this real data in your scoring rationale where available. Prioritize Bridge data as it is most current.` : '';

  const userPrompt = `Analyze this CRE deal:
- Address: ${propertyAddress}
- Type: ${propertyType}
- Asking Price: $${Number(askingPrice).toLocaleString()}
- Current NOI: $${Number(currentNoi).toLocaleString()}
- Implied Cap Rate: ${impliedCap}%
- Market: ${targetMarket}
${realDataSection}

Return JSON matching this EXACT schema (no markdown):
{
  "dealScore": <1-10>,
  "scores": {
    "pricing": { "score": <1-10>, "rating": "green|yellow|red", "rationale": "cite actual data point" },
    "marketStrength": { "score": <1-10>, "rating": "green|yellow|red", "rationale": "cite actual data point" },
    "incomeStability": { "score": <1-10>, "rating": "green|yellow|red", "rationale": "cite actual data point" },
    "upsidePotential": { "score": <1-10>, "rating": "green|yellow|red", "rationale": "cite actual data point" },
    "locationQuality": { "score": <1-10>, "rating": "green|yellow|red", "rationale": "cite actual data point" }
  },
  "marketCapRate": { "low": <num>, "high": <num>, "marketConsensus": "string" },
  "comparableSales": [
    { "description": "string", "capRate": <num>, "pricePerSF": <num|null>, "date": "string", "relevance": "string" }
  ],
  "vacancyTrends": "string",
  "dealSummary": "Senior broker quality narrative, 5-7 paragraphs: deal overview, market context, pricing vs comps, income analysis, risks, investment thesis and recommendation",
  "keyRisks": ["string","string","string"],
  "keyOpportunities": ["string","string","string"]
}`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2000,
  });

  const text = response.choices[0].message.content.trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse AI deal analysis response');
  }
}
