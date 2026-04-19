import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: '50 50 70 50',
    color: '#1A1612',
    backgroundColor: '#ffffff',
  },
  pageLetter: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A1612',
    backgroundColor: '#ffffff',
  },
  colorBar: {
    height: 3,
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 18,
    borderBottom: '1 solid #DDD0BB',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    height: 36,
    objectFit: 'contain',
    marginLeft: 12,
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1612',
    marginBottom: 2,
  },
  agentLine: {
    fontSize: 8.5,
    color: '#4F443C',
    marginBottom: 1,
  },
  docTitle: {
    fontSize: 9,
    color: '#9C9088',
    marginTop: 3,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1612',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#4F443C',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    borderBottom: '0.5 solid #DDD0BB',
    paddingBottom: 3,
  },
  text: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: '#2D2520',
  },
  textSmall: {
    fontSize: 8.5,
    lineHeight: 1.5,
    color: '#4F443C',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  col2: {
    width: '50%',
  },
  metricBox: {
    backgroundColor: '#F5F0E8',
    border: '0.5 solid #DDD0BB',
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 8,
    color: '#4F443C',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1612',
  },
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: '5 8',
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '4 8',
    borderBottom: '0.5 solid #EDE4D3',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '4 8',
    backgroundColor: '#FAF7F2',
    borderBottom: '0.5 solid #EDE4D3',
  },
  tableCell: {
    fontSize: 8.5,
    flex: 1,
    textAlign: 'center',
    color: '#2D2520',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '0.5 solid #DDD0BB',
    paddingTop: 5,
  },
  footerText: {
    fontSize: 7.5,
    color: '#4F443C',
  },
  pageNumber: {
    fontSize: 7.5,
    color: '#4F443C',
  },
  aiSummaryBox: {
    backgroundColor: '#FFF8F6',
    borderRadius: 4,
    padding: 10,
    marginTop: 10,
  },
  aiLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  // Lease-specific
  coverPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60 60',
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1612',
    marginBottom: 8,
    textAlign: 'center',
  },
  coverSub: {
    fontSize: 11,
    color: '#4F443C',
    marginBottom: 4,
    textAlign: 'center',
  },
  leaseSectionHead: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1A1612',
    marginTop: 14,
    marginBottom: 4,
  },
  leaseBody: {
    fontSize: 9.5,
    lineHeight: 1.6,
    color: '#2D2520',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottom: '0.75 solid #1A1612',
    marginBottom: 4,
    marginTop: 4,
    width: '70%',
  },
  signatureLabel: {
    fontSize: 8,
    color: '#4F443C',
    marginBottom: 12,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BrandedHeader({ settings, logoUrl, docTitle, docSubtitle }) {
  const color = settings?.primaryColor || '#C8472A';
  const hasCompany = settings?.companyName;
  const hasAgent = settings?.agentName;
  const hasLicense = settings?.licenseNumber;

  return (
    <>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {hasCompany && (
            <Text style={styles.companyName}>{settings.companyName}</Text>
          )}
          {(hasAgent || hasLicense) && (
            <Text style={styles.agentLine}>
              {[hasAgent && settings.agentName, hasLicense && `Lic. ${settings.licenseNumber}`].filter(Boolean).join('  |  ')}
            </Text>
          )}
          <Text style={[styles.docTitle, { color }]}>
            {docTitle}{docSubtitle ? ` — ${docSubtitle}` : ''}
          </Text>
        </View>
        {logoUrl && (
          <Image src={logoUrl} style={styles.logo} />
        )}
      </View>
    </>
  );
}

function BrandedFooter({ settings }) {
  const contact = [settings?.phone, settings?.email].filter(Boolean).join('  |  ');
  const company = settings?.companyName || 'CRE Suite';
  const tagline = settings?.tagline;

  return (
    <View style={styles.footer} fixed>
      <View style={{ flex: 1 }}>
        <Text style={styles.footerText}>
          {company}{tagline ? ` — ${tagline}` : ' — Confidential'}
        </Text>
        {contact && <Text style={[styles.footerText, { marginTop: 1 }]}>{contact}</Text>}
      </View>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

// ─── Sanitize helper — strips asterisks and markdown artifacts ────────────────

const sanitize = (str) => (str || '').replace(/\*+/g, '').replace(/#+/g, '').trim();

// ─── LOI Structured PDF ───────────────────────────────────────────────────────

const loiStyles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    padding: '72 72 80 72',
    color: '#1A1612',
    backgroundColor: '#ffffff',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateText: { fontSize: 10, color: '#4F443C' },
  title: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Times-Bold',
    marginBottom: 16,
    letterSpacing: 1,
  },
  re: {
    fontSize: 10.5,
    fontFamily: 'Times-Bold',
    marginBottom: 12,
  },
  salutation: { fontSize: 10.5, marginBottom: 12 },
  intro: { fontSize: 10.5, lineHeight: 1.6, marginBottom: 14 },
  sectionNum: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    marginTop: 14,
    marginBottom: 4,
  },
  sectionBody: { fontSize: 10.5, lineHeight: 1.6, marginBottom: 4 },
  subsectionNum: {
    fontSize: 10.5,
    fontFamily: 'Times-Bold',
    marginLeft: 16,
    marginTop: 6,
    marginBottom: 2,
  },
  subsectionBody: { fontSize: 10.5, lineHeight: 1.6, marginLeft: 16, marginBottom: 3 },
  closingText: { fontSize: 10.5, lineHeight: 1.6, marginTop: 16, marginBottom: 24 },
  sigBlock: { marginTop: 10 },
  sigParty: { fontSize: 10.5, fontFamily: 'Times-Bold', marginBottom: 16 },
  sigLine: { borderBottom: '0.75 solid #1A1612', width: '60%', marginBottom: 4 },
  sigLabel: { fontSize: 9, color: '#4F443C', marginBottom: 14 },
  notaryBox: {
    marginTop: 24,
    border: '0.5 solid #DDD0BB',
    borderRadius: 3,
    padding: '10 12',
  },
  notaryTitle: { fontSize: 10, fontFamily: 'Times-Bold', marginBottom: 6 },
  notaryText: { fontSize: 9.5, lineHeight: 1.55, color: '#2D2520' },
  logoRight: { height: 36, objectFit: 'contain' },
  headerLogo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottom: '0.5 solid #DDD0BB',
  },
});

export function LOIPDF({ structured, settings, logoUrl }) {
  const color = settings?.primaryColor || '#C8472A';
  const d = structured || {};

  return (
    <Document>
      <Page size="LETTER" style={loiStyles.page}>
        {/* Header with logo */}
        <View style={loiStyles.headerLogo}>
          <View>
            {settings?.companyName && (
              <Text style={{ fontSize: 10, fontFamily: 'Times-Bold', color: '#1A1612' }}>
                {settings.companyName}
              </Text>
            )}
            {settings?.agentName && (
              <Text style={{ fontSize: 9, color: '#4F443C', marginTop: 2 }}>
                {settings.agentName}{settings?.licenseNumber ? ` · Lic. ${settings.licenseNumber}` : ''}
              </Text>
            )}
          </View>
          {logoUrl && <Image src={logoUrl} style={loiStyles.logoRight} />}
        </View>

        {/* Date + delivery method */}
        <View style={loiStyles.dateRow}>
          <Text style={loiStyles.dateText}>{d.date || ''}</Text>
          {d.methodOfDelivery && (
            <Text style={loiStyles.dateText}>{d.methodOfDelivery}</Text>
          )}
        </View>

        {/* Seller address block */}
        {(d.sellerName || d.sellerAddress) && (
          <View style={{ marginBottom: 16 }}>
            {d.sellerName && <Text style={{ fontSize: 10.5 }}>{sanitize(d.sellerName)}</Text>}
            {d.sellerContact && <Text style={{ fontSize: 10.5 }}>Attn: {sanitize(d.sellerContact)}</Text>}
            {d.sellerAddress && <Text style={{ fontSize: 10.5 }}>{sanitize(d.sellerAddress)}</Text>}
          </View>
        )}

        {/* Title */}
        <Text style={[loiStyles.title, { color }]}>LETTER OF INTENT</Text>

        {/* RE line */}
        {d.re && <Text style={loiStyles.re}>{sanitize(d.re)}</Text>}

        {/* Salutation */}
        {d.salutation && <Text style={loiStyles.salutation}>{sanitize(d.salutation)}</Text>}

        {/* Intro paragraph */}
        {d.intro && <Text style={loiStyles.intro}>{sanitize(d.intro)}</Text>}

        {/* Sections */}
        {(d.sections || []).map((sec) => (
          <View key={sec.number} wrap={false}>
            <Text style={[loiStyles.sectionNum, { color: '#1A1612' }]}>
              {sec.number}. {sanitize(sec.title)}
            </Text>
            {sec.body ? <Text style={loiStyles.sectionBody}>{sanitize(sec.body)}</Text> : null}
            {(sec.subsections || []).map((sub) => (
              <View key={sub.number}>
                <Text style={loiStyles.subsectionNum}>{sub.number} {sanitize(sub.title)}</Text>
                {sub.body ? <Text style={loiStyles.subsectionBody}>{sanitize(sub.body)}</Text> : null}
              </View>
            ))}
          </View>
        ))}

        {/* Closing text */}
        {d.closingText && <Text style={loiStyles.closingText}>{sanitize(d.closingText)}</Text>}

        {/* Signature block */}
        <View style={loiStyles.sigBlock} wrap={false}>
          <View style={{ flexDirection: 'row', gap: 32 }}>
            <View style={{ flex: 1 }}>
              <Text style={loiStyles.sigParty}>BUYER:</Text>
              {d.buyerAddress && <Text style={{ fontSize: 9, color: '#4F443C', marginBottom: 8 }}>{sanitize(d.buyerAddress)}</Text>}
              <View style={loiStyles.sigLine} />
              <Text style={loiStyles.sigLabel}>Signature</Text>
              <View style={loiStyles.sigLine} />
              <Text style={loiStyles.sigLabel}>Printed Name: {sanitize(d.buyerName || '')}</Text>
              <View style={[loiStyles.sigLine, { width: '40%' }]} />
              <Text style={loiStyles.sigLabel}>Date</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={loiStyles.sigParty}>SELLER:</Text>
              {d.sellerAddress && <Text style={{ fontSize: 9, color: '#4F443C', marginBottom: 8 }}>{sanitize(d.sellerAddress)}</Text>}
              <View style={loiStyles.sigLine} />
              <Text style={loiStyles.sigLabel}>Signature</Text>
              <View style={loiStyles.sigLine} />
              <Text style={loiStyles.sigLabel}>Printed Name: {sanitize(d.sellerName || '')}</Text>
              <View style={[loiStyles.sigLine, { width: '40%' }]} />
              <Text style={loiStyles.sigLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Notary block — conditional */}
        {d.includeNotary && (
          <View style={loiStyles.notaryBox} wrap={false}>
            <Text style={loiStyles.notaryTitle}>NOTARY ACKNOWLEDGMENT</Text>
            <Text style={loiStyles.notaryText}>
              State of _____________________, County of _____________________
            </Text>
            <Text style={[loiStyles.notaryText, { marginTop: 6 }]}>
              On this _____ day of _____________________, 20____, before me appeared ___________________________________,
              personally known to me to be the person whose name is subscribed to this instrument and acknowledged to me
              that they executed the same in their authorized capacity.
            </Text>
            <View style={{ marginTop: 10 }}>
              <View style={[loiStyles.sigLine, { width: '50%' }]} />
              <Text style={loiStyles.sigLabel}>Notary Public · My Commission Expires: ______________</Text>
              <Text style={[loiStyles.notaryText, { marginTop: 2 }]}>[NOTARY SEAL]</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {settings?.companyName || 'CRE Suite'} — CONFIDENTIAL
            {settings?.phone ? `  |  ${settings.phone}` : ''}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

// ─── Text Document PDF (LOI fallback) ─────────────────────────────────────────

export function TextDocumentPDF({ title, subtitle, content, date, settings, logoUrl }) {
  const color = settings?.primaryColor || '#C8472A';
  const paragraphs = (content || '').split('\n').filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <BrandedHeader settings={settings} logoUrl={logoUrl} docTitle={title} docSubtitle={subtitle} />

        {paragraphs.map((para, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.text}>{para}</Text>
          </View>
        ))}

        <BrandedFooter settings={settings} />
      </Page>
    </Document>
  );
}

// ─── Lease PDF ─────────────────────────────────────────────────────────────────

function parseLeaseContent(content) {
  const lines = sanitize(content).split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Section header: "1. PARTIES", "SECTION 2.", all-caps line, etc.
    const isSection = /^(\d+[.)]\s+\S|SECTION\s+\d+|ARTICLE\s+\d+)/.test(trimmed)
      || (trimmed === trimmed.toUpperCase() && trimmed.length > 4 && /[A-Z]{3}/.test(trimmed) && !/^\d+$/.test(trimmed));

    if (isSection) {
      if (current) sections.push(current);
      current = { heading: trimmed, body: [] };
    } else {
      if (!current) current = { heading: null, body: [] };
      current.body.push(trimmed);
    }
  }
  if (current) sections.push(current);
  return sections;
}

export function LeasePDF({ form, content, customClauses = [], settings, logoUrl }) {
  const color = settings?.primaryColor || '#C8472A';
  const sections = parseLeaseContent(content || '');
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const company = settings?.companyName || '';
  const agent = settings?.agentName || '';

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={{ ...styles.pageLetter, padding: '60 60' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {logoUrl && (
            <Image src={logoUrl} style={{ height: 48, objectFit: 'contain', marginBottom: 32 }} />
          )}
          <View style={{ width: 60, height: 3, backgroundColor: color, marginBottom: 32 }} />
          <Text style={styles.coverTitle}>COMMERCIAL LEASE AGREEMENT</Text>
          <View style={{ width: 60, height: 1, backgroundColor: '#DDD0BB', marginTop: 20, marginBottom: 24 }} />
          <Text style={[styles.coverSub, { fontFamily: 'Helvetica-Bold' }]}>
            {form.propertyAddress}{form.suiteNumber ? `, ${form.suiteNumber}` : ''}
          </Text>
          <Text style={styles.coverSub}>{form.leaseType} Lease</Text>
          <View style={{ marginTop: 32 }}>
            <Text style={styles.coverSub}>Landlord: {form.landlordName}</Text>
            <Text style={styles.coverSub}>Tenant: {form.tenantName}</Text>
            <Text style={[styles.coverSub, { marginTop: 8 }]}>Effective Date: {date}</Text>
          </View>
          {(company || agent) && (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              {company && <Text style={[styles.coverSub, { color: '#9C9088', fontSize: 9 }]}>{company}</Text>}
              {agent && <Text style={[styles.coverSub, { color: '#9C9088', fontSize: 9 }]}>{agent}{settings?.licenseNumber ? ` | Lic. ${settings.licenseNumber}` : ''}</Text>}
            </View>
          )}
        </View>
        <View style={{ position: 'absolute', bottom: 40, left: 60, right: 60, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[styles.textSmall, { color: '#9C9088' }]}>CONFIDENTIAL</Text>
          <Text style={[styles.textSmall, { color: '#9C9088' }]}>{date}</Text>
        </View>
      </Page>

      {/* Content Pages */}
      <Page size="LETTER" style={{ ...styles.page, padding: '50 50 70 50' }}>
        <BrandedHeader
          settings={settings}
          logoUrl={logoUrl}
          docTitle="Commercial Lease Agreement"
          docSubtitle={form.leaseType}
        />

        {sections.map((sec, i) => (
          <View key={i} wrap={false}>
            {sec.heading && (
              <Text style={[styles.leaseSectionHead, { color: sec.heading.match(/^\d/) ? '#1A1612' : color }]}>
                {sec.heading}
              </Text>
            )}
            {sec.body.map((line, j) => (
              <Text key={j} style={styles.leaseBody}>{line}</Text>
            ))}
          </View>
        ))}

        {/* Signature Block */}
        <View style={{ marginTop: 28 }} wrap={false}>
          <Text style={[styles.leaseSectionHead, { color }]}>SIGNATURE PAGE</Text>
          <Text style={[styles.leaseBody, { marginBottom: 16 }]}>
            IN WITNESS WHEREOF, the parties have executed this Lease Agreement as of the date first written above.
          </Text>

          <View style={styles.row}>
            <View style={[styles.col2, { paddingRight: 12 }]}>
              <Text style={[styles.bold, { fontSize: 9, marginBottom: 20 }]}>LANDLORD:</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Printed Name: {form.landlordName}</Text>
              <View style={[styles.signatureLine, { width: '50%' }]} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
            <View style={[styles.col2, { paddingLeft: 12 }]}>
              <Text style={[styles.bold, { fontSize: 9, marginBottom: 20 }]}>TENANT:</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Printed Name: {form.tenantName}</Text>
              <View style={[styles.signatureLine, { width: '50%' }]} />
              <Text style={styles.signatureLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* Custom Clauses */}
        {customClauses.filter(c => c.title || c.body).map((clause, i) => (
          <View key={i} style={{ marginTop: 14 }} wrap={false}>
            <Text style={[styles.leaseSectionHead, { color }]}>
              {sanitize(clause.title || `Custom Clause ${i + 1}`).toUpperCase()}
            </Text>
            {clause.body && <Text style={styles.leaseBody}>{sanitize(clause.body)}</Text>}
          </View>
        ))}

        {/* Notary Block */}
        <View style={{ marginTop: 24, padding: 12, border: '0.5 solid #DDD0BB', borderRadius: 4 }} wrap={false}>
          <Text style={[styles.bold, { fontSize: 9, marginBottom: 6 }]}>NOTARY ACKNOWLEDGMENT</Text>
          <Text style={styles.leaseBody}>
            State of _____________________, County of _____________________
          </Text>
          <Text style={styles.leaseBody}>
            On this _____ day of _____________________, 20____, before me appeared ___________________________________,
            personally known to me (or proved to me on the basis of satisfactory evidence) to be the person whose name
            is subscribed to the within instrument and acknowledged to me that they executed the same in their authorized
            capacity, and that by their signature on the instrument the person, or the entity upon behalf of which the
            person acted, executed the instrument.
          </Text>
          <View style={{ marginTop: 12 }}>
            <View style={[styles.signatureLine, { width: '55%' }]} />
            <Text style={styles.signatureLabel}>Notary Public</Text>
            <View style={[styles.signatureLine, { width: '40%' }]} />
            <Text style={styles.signatureLabel}>My Commission Expires</Text>
            <Text style={[styles.textSmall, { marginTop: 4 }]}>[NOTARY SEAL]</Text>
          </View>
        </View>

        <BrandedFooter settings={settings} />
      </Page>
    </Document>
  );
}

// ─── Cash Flow PDF ─────────────────────────────────────────────────────────────

export function CashFlowPDF({ inputs, outputs, aiSummary, settings, logoUrl }) {
  const color = settings?.primaryColor || '#C8472A';
  const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : 'N/A';
  const fmtPct = (n) => n != null ? `${n}%` : 'N/A';

  const metrics = [
    ['NOI', fmt(outputs.noi)],
    ['Cap Rate', fmtPct(outputs.capRate)],
    ['Cash-on-Cash', fmtPct(outputs.cashOnCash)],
    ['DSCR', outputs.dscr],
    ['GRM', outputs.grm],
    ['5-Yr IRR', fmtPct(outputs.irr)],
    ['Equity Multiple', `${outputs.equityMultiple}x`],
    ['Annual Debt Service', fmt(outputs.annualDebtService)],
  ];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <BrandedHeader
          settings={settings}
          logoUrl={logoUrl}
          docTitle="Cash Flow Analysis"
          docSubtitle={`${inputs.propertyType || 'Commercial'} — ${new Date().toLocaleDateString()}`}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color }]}>Key Assumptions</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.text}>Purchase Price: {fmt(inputs.purchasePrice)}</Text>
              <Text style={styles.text}>Down Payment: {inputs.downPaymentPercent}%</Text>
              <Text style={styles.text}>Loan Amount: {fmt(outputs.loanAmount)}</Text>
              <Text style={styles.text}>Interest Rate: {inputs.interestRate}%</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.text}>Gross Rental Income: {fmt(inputs.grossRentalIncome)}</Text>
              <Text style={styles.text}>Vacancy Rate: {inputs.vacancyRate}%</Text>
              <Text style={styles.text}>Total Op. Expenses: {fmt(outputs.totalOperatingExpenses)}</Text>
              <Text style={styles.text}>Loan Term: {inputs.loanTerm} years</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color }]}>Investment Metrics</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {metrics.map(([label, value]) => (
              <View key={label} style={[styles.metricBox, { width: '23%' }]}>
                <Text style={styles.metricLabel}>{label}</Text>
                <Text style={[styles.metricValue, { fontSize: 11 }]}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color }]}>5-Year Projection</Text>
          <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: color }]}>
              {['Year', 'Gross Income', 'EGI', 'NOI', 'Debt Service', 'Cash Flow', 'CoC'].map(h => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {(outputs.yearlyProjections || []).map((yr, i) => (
              <View key={yr.year} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.tableCell}>Year {yr.year}</Text>
                <Text style={styles.tableCell}>{fmt(yr.grossRentalIncome)}</Text>
                <Text style={styles.tableCell}>{fmt(yr.effectiveGrossIncome)}</Text>
                <Text style={styles.tableCell}>{fmt(yr.noi)}</Text>
                <Text style={styles.tableCell}>{fmt(yr.debtService)}</Text>
                <Text style={styles.tableCell}>{fmt(yr.cashFlowAfterDebt)}</Text>
                <Text style={styles.tableCell}>{yr.cashOnCash}%</Text>
              </View>
            ))}
          </View>
        </View>

        {aiSummary && (
          <View style={[styles.aiSummaryBox, { borderLeft: `3 solid ${color}` }]}>
            <Text style={[styles.aiLabel, { color }]}>AI DEAL SUMMARY</Text>
            <Text style={styles.text}>{aiSummary}</Text>
          </View>
        )}

        <BrandedFooter settings={settings} />
      </Page>
    </Document>
  );
}

// ─── Deal Analysis PDF ────────────────────────────────────────────────────────

export function DealAnalysisPDF({ inputs, analysis, settings, logoUrl }) {
  const color = settings?.primaryColor || '#C8472A';
  const ratingColor = (r) => r === 'green' ? '#059669' : r === 'yellow' ? '#D97706' : '#DC2626';

  const SCORE_LABELS = {
    pricing: 'Pricing',
    marketStrength: 'Market Strength',
    incomeStability: 'Income Stability',
    upsidePotential: 'Upside Potential',
    locationQuality: 'Location Quality',
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <BrandedHeader
          settings={settings}
          logoUrl={logoUrl}
          docTitle="Deal Analysis Report"
          docSubtitle={`${inputs.propertyAddress} — ${new Date().toLocaleDateString()}`}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color }]}>Deal Overview</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.text}>Property Type: {inputs.propertyType}</Text>
              <Text style={styles.text}>Asking Price: ${Number(inputs.askingPrice).toLocaleString()}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.text}>Current NOI: ${Number(inputs.currentNoi).toLocaleString()}</Text>
              <Text style={styles.text}>Target Market: {inputs.targetMarket}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color }]}>Deal Score: {analysis.dealScore}/10</Text>
          {Object.entries(analysis.scores || {}).map(([key, score]) => (
            <View key={key} style={{ flexDirection: 'row', marginBottom: 5, alignItems: 'flex-start' }}>
              <Text style={[styles.text, styles.bold, { width: 110 }]}>
                {SCORE_LABELS[key] || key}:
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.text, { color: ratingColor(score.rating) }]}>
                  {score.score}/10
                </Text>
                <Text style={[styles.textSmall, { color: '#4F443C' }]}>{score.rationale}</Text>
              </View>
            </View>
          ))}
        </View>

        {analysis.marketCapRate && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color }]}>Market Cap Rate Range</Text>
            <Text style={styles.text}>
              {analysis.marketCapRate.low}% — {analysis.marketCapRate.high}%
              {analysis.marketCapRate.marketConsensus ? `  |  ${analysis.marketCapRate.marketConsensus}` : ''}
            </Text>
          </View>
        )}

        {analysis.comparableSales?.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color }]}>Comparable Sales</Text>
            {analysis.comparableSales.map((comp, i) => (
              <View key={i} style={{ marginBottom: 5, paddingLeft: 8, borderLeft: `2 solid ${color}` }}>
                <Text style={[styles.text, styles.bold]}>{i + 1}. {comp.description}</Text>
                <Text style={styles.textSmall}>
                  {[comp.capRate && `Cap Rate: ${comp.capRate}%`, comp.pricePerSF && `$/SF: $${comp.pricePerSF}`, comp.date].filter(Boolean).join('  |  ')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {analysis.dealSummary && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color }]}>Investment Summary</Text>
            <Text style={styles.text}>{analysis.dealSummary}</Text>
          </View>
        )}

        <BrandedFooter settings={settings} />
      </Page>
    </Document>
  );
}

// ─── Debt Analysis PDF ───────────────────────────────────────────────────────

export function DebtAnalysisPDF({ inputs, result, settings, logoUrl }) {
  const color = settings?.primaryColor || '#C8472A';
  const calc = result?.calculations;
  const ai = result?.aiAnalysis;
  const matrix = ai?.lenderMatrix;
  const fmt = (n) => n != null ? `$${Number(n).toLocaleString()}` : '—';
  const fmtPct = (n) => n != null ? `${n}%` : '—';

  const fitColor = (q) => q === 'Strong Fit' ? '#059669' : q === 'Possible' ? '#D97706' : '#DC2626';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <BrandedHeader
          settings={settings}
          logoUrl={logoUrl}
          docTitle="Debt Sizing & Lender Screen"
          docSubtitle={`${inputs.propertyType} — ${new Date().toLocaleDateString()}`}
        />

        {/* Deal Parameters */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color }]}>Deal Parameters</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.text}>Property Type: {inputs.propertyType}</Text>
              <Text style={styles.text}>NOI: {fmt(inputs.noi)}</Text>
              <Text style={styles.text}>Purchase Price: {fmt(inputs.purchasePrice)}</Text>
            </View>
            <View style={styles.col2}>
              <Text style={styles.text}>Requested LTV: {inputs.requestedLtv}%</Text>
              <Text style={styles.text}>Loan Term: {inputs.loanTerm} yrs</Text>
              <Text style={styles.text}>Amortization: {inputs.amortization} yrs</Text>
            </View>
          </View>
        </View>

        {/* Loan Sizing */}
        {calc && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color }]}>Loan Sizing Results</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[
                ['Max Loan', fmt(calc.maxLoanAmount)],
                ['Actual LTV', fmtPct(calc.actualLtv)],
                ['DSCR', calc.dscr],
                ['Debt Yield', fmtPct(calc.debtYield)],
                ['Cap Rate', fmtPct(calc.capRate)],
                ['Annual Debt Service', fmt(calc.annualDebtService)],
                ['Monthly Payment', fmt(calc.monthlyPayment)],
                ['Constrained By', calc.constrainedBy],
              ].map(([label, value]) => (
                <View key={label} style={[styles.metricBox, { width: '23%' }]}>
                  <Text style={styles.metricLabel}>{label}</Text>
                  <Text style={[styles.metricValue, { fontSize: 10 }]}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Lender Matrix */}
        {matrix?.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color }]}>9-Lender Matrix</Text>
            <View style={styles.table}>
              <View style={[styles.tableHeader, { backgroundColor: color }]}>
                {['Lender', 'Rate Range', 'Max LTV', 'Recourse', 'Timeline', 'Fit'].map(h => (
                  <Text key={h} style={[styles.tableHeaderCell, { fontSize: 7 }]}>{h}</Text>
                ))}
              </View>
              {matrix.map((lender, i) => (
                <View key={lender.lenderType} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold', textAlign: 'left', fontSize: 8 }]}>{lender.lenderType}</Text>
                  <Text style={styles.tableCell}>{lender.rateRange || '—'}</Text>
                  <Text style={styles.tableCell}>{lender.typicalLTV || lender.maxLtv || '—'}</Text>
                  <Text style={styles.tableCell}>{lender.recourse || '—'}</Text>
                  <Text style={styles.tableCell}>{lender.timelineToClose || lender.timeline || '—'}</Text>
                  <Text style={[styles.tableCell, { color: fitColor(lender.qualification), fontFamily: 'Helvetica-Bold' }]}>
                    {lender.qualification || '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Strategy */}
        {ai?.approachStrategy && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color }]}>Lender Approach Strategy</Text>
            {ai.riskRationale && <Text style={[styles.text, { marginBottom: 6, color: '#4F443C' }]}>{ai.riskRationale}</Text>}
            <Text style={styles.text}>{ai.approachStrategy}</Text>
          </View>
        )}

        {ai?.pitchBullets?.length > 0 && (
          <View style={[styles.aiSummaryBox, { borderLeft: `3 solid ${color}` }]}>
            <Text style={[styles.aiLabel, { color }]}>KEY TALKING POINTS</Text>
            {ai.pitchBullets.map((b, i) => (
              <Text key={i} style={[styles.text, { marginBottom: 3 }]}>→  {b}</Text>
            ))}
          </View>
        )}

        <BrandedFooter settings={settings} />
      </Page>
    </Document>
  );
}

// ─── Helper: trigger browser download ────────────────────────────────────────

export async function downloadPDF(DocumentComponent, filename) {
  const blob = await pdf(DocumentComponent).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
