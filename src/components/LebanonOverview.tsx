import { useState } from 'react';

export default function LebanonOverview() {
  const [activeTab, setActiveTab] = useState<string>('demographics');

  // Demographic States
  const [refugeeCount, setRefugeeCount] = useState<number>(1.67); // Millions
  const [diasporaCount, setDiasporaCount] = useState<number>(12); // Millions
  const citizenCount = 4.6; // Millions

  // Calculated Demographics
  const totalPop = citizenCount + refugeeCount;
  const density = (totalPop * 1000000) / 10230; // 10,230 sq km land area
  const utilityStrain = Math.min(100 + ((refugeeCount - 1) / 1.5) * 80, 200);

  // Cabinet State
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  // Economic State
  const [selectedPartner, setSelectedPartner] = useState<string>('UAE');

  // Network Simulation States
  const [edlOff, setEdlOff] = useState<boolean>(false);
  const [fuelShortage, setFuelShortage] = useState<boolean>(false);
  const [copperTheft, setCopperTheft] = useState<boolean>(false);
  const [starlinkBypass, setStarlinkBypass] = useState<boolean>(false);

  // Jurisprudence Case State
  const [selectedCase, setSelectedCase] = useState<string>('whatsapp');

  // Data Definitions
  const cabinetSeats = [
    { id: 1, name: "Nawaf Salam", portfolio: "Prime Minister", bloc: "Prime Minister Share", confession: "Sunni Muslim", type: "Independent" },
    { id: 2, name: "Tarek Mitri", portfolio: "Deputy Prime Minister", bloc: "Prime Minister Share", confession: "Greek Orthodox Christian", type: "Independent" },
    { id: 3, name: "Ahmad al-Hajjar", portfolio: "Interior & Municipalities", bloc: "Prime Minister Share", confession: "Sunni Muslim", type: "Independent" },
    { id: 4, name: "Hanine Sayyed", portfolio: "Social Affairs", bloc: "Prime Minister Share", confession: "Greek Catholic Christian", type: "Independent" },
    { id: 5, name: "Rima Karami", portfolio: "Education & Higher Education", bloc: "Prime Minister Share", confession: "Sunni Muslim", type: "Independent" },
    { id: 6, name: "Amer Bisat", portfolio: "Economy & Trade", bloc: "Prime Minister Share", confession: "Sunni Muslim", type: "Independent" },
    { id: 7, name: "Ghassan Salame", portfolio: "Culture", bloc: "Prime Minister Share", confession: "Greek Catholic Christian", type: "Independent" },
    { id: 8, name: "Michel Menassa", portfolio: "National Defense", bloc: "Presidential Share", confession: "Greek Orthodox Christian", type: "Independent" },
    { id: 9, name: "Paul Morcos", portfolio: "Information", bloc: "Presidential Share", confession: "Greek Catholic Christian", type: "Independent" },
    { id: 10, name: "Laura Khazen Lahoud", portfolio: "Tourism", bloc: "Presidential Share", confession: "Maronite Christian", type: "Independent" },
    { id: 11, name: "Charles el-Hage", portfolio: "Telecommunications", bloc: "Presidential Share", confession: "Maronite Christian", type: "Independent" },
    { id: 12, name: "Fadi Makki", portfolio: "State for Administrative Development", bloc: "Presidential Share", confession: "Shia Muslim", type: "Independent" },
    { id: 13, name: "Joe Raggi", portfolio: "Foreign Affairs & Emigrants", bloc: "Strong Republic Bloc", confession: "Maronite Christian", type: "Lebanese Forces Party" },
    { id: 14, name: "Joe Issa el-Khoury", portfolio: "Industry", bloc: "Strong Republic Bloc", confession: "Greek Orthodox Christian", type: "Lebanese Forces Party" },
    { id: 15, name: "Joe Saddi", portfolio: "Energy & Water", bloc: "Strong Republic Bloc", confession: "Maronite Christian", type: "Lebanese Forces Party" },
    { id: 16, name: "Kamal Shehadi", portfolio: "State for Displaced / IT & AI", bloc: "Strong Republic Bloc", confession: "Protestant Christian", type: "Lebanese Forces Party" },
    { id: 17, name: "Fayez Rasamny", portfolio: "Public Works & Transportation", bloc: "Democratic Gathering", confession: "Druze", type: "Progressive Socialist Party" },
    { id: 18, name: "Nizar Hani", portfolio: "Agriculture", bloc: "Democratic Gathering", confession: "Druze", type: "Progressive Socialist Party" },
    { id: 19, name: "Adel Nassar", portfolio: "Justice", bloc: "Kataeb Bloc", confession: "Maronite Christian", type: "Kataeb Party" },
    { id: 20, name: "Nora Bayrakdarian", portfolio: "Youth & Sports", bloc: "Tashnag Bloc", confession: "Armenian Orthodox Christian", type: "Tashnag Party" },
    { id: 21, name: "Yassine Jaber", portfolio: "Finance", bloc: "Development & Liberation", confession: "Shia Muslim", type: "Amal Movement" },
    { id: 22, name: "Tamara el-Zein", portfolio: "Environment", bloc: "Development & Liberation", confession: "Shia Muslim", type: "Amal Movement" },
    { id: 23, name: "Rakan Nasreddine", portfolio: "Public Health", bloc: "Loyalty to Resistance", confession: "Shia Muslim", type: "Hezbollah" },
    { id: 24, name: "Mohammad Haidar", portfolio: "Labour", bloc: "Loyalty to Resistance", confession: "Shia Muslim", type: "Hezbollah" }
  ];

  const tradePartners = {
    UAE: { val: 2.59, pct: 22, comm: "Jewelry, gold, precious stones, diamond re-exports", notes: "Primary trade pipeline for luxury merchandise and gold bullion refining." },
    Syria: { val: 0.94, pct: 8, comm: "Plastics, chemical compounds, agricultural harvest re-exports", notes: "Direct overland corridor heavily impacted by Ba'athist regime transition and regional conflicts." },
    Egypt: { val: 0.59, pct: 5, comm: "Scrap metals, canned foodstuffs, raw minerals", notes: "Strong maritime trade relations linking Levantine and North African ports." },
    USA: { val: 0.59, pct: 5, comm: "Prepared foods, commercial consumer products, technology gear", notes: "Represents steady import-export relation; subject to strict banking sanctions clearance." },
    Turkey: { val: 0.47, pct: 4, comm: "Raw fabrics, chemicals, building hardware", notes: "Main import partner for retail apparel and industrial raw inputs." }
  };

  const caseStudies = {
    whatsapp: {
      year: "2019 (October)",
      title: "The VoIP 'WhatsApp Tax' Protests",
      charge: "Proposed $6/month flat tax on cellular VoIP internet data transmissions",
      bureau: "Ministry of Telecommunications & Cabinet",
      outcome: "Withdrawn immediately following nation-wide mass civil demonstrations, demonstrating how digital service policies serve as absolute societal flashpoints."
    },
    shibani: {
      year: "2019 (November)",
      title: "The Interrogation of Amer Shibani",
      charge: "Publishing online speech alleging local commercial bank branches ceased US dollar dispensing operations",
      bureau: "ISF Anti-Cybercrime & IP Bureau",
      outcome: "Detained for three hours of questioning and pressured to remove the social media tweet under threat of prosecution."
    },
    sadek: {
      year: "2023 (July)",
      title: "Slander Sentencing of Dima Sadek",
      charge: "Libel, slander, and intentional incitement of sectarian strife via critical social media posts",
      bureau: "Criminal Court of Beirut",
      outcome: "Sentenced to one full year of imprisonment alongside a substantial financial fine, highlighting the application of criminal code to digital speech."
    },
    sgbl: {
      year: "2024–2025",
      title: "SGBL Bank Lawsuits vs. Daraj Journalists",
      charge: "Defamation and undermining national banking confidence under Penal Code provisions",
      bureau: "ISF Cybercrime Bureau & Public Prosecution",
      outcome: "Antoun Sehnaoui (SGBL CEO) filed lawsuits against editor Hazem al-Amin and reporter Jana Barakat following investigative videos on bank asset movements."
    },
    centralbank: {
      year: "2025 (April)",
      title: "Central Bank Appointment Corruption Summons",
      charge: "Undermining state financial standing and destabilizing confidence in the national currency",
      bureau: "Public Prosecution (ISF Cybercrime)",
      outcome: "Summoned journalists from Daraj, Megaphone, and the director of Kulluna Irada. Done in violation of Publications Court jurisdiction and proper Code of Criminal Procedure summons protocols."
    }
  };

  // Stress test calculators
  const getTerrestrialSpeed = () => {
    let speed = 17.27; // Base fixed DSL speed (Mbps)
    if (edlOff) speed -= 5.5;
    if (fuelShortage) speed -= 6.8;
    if (copperTheft) speed -= 3.2;
    return Math.max(0.5, Number(speed.toFixed(2)));
  };

  const getMobileSpeed = () => {
    let speed = 45.74; // Base mobile data speed (Mbps)
    if (edlOff) speed -= 12.0;
    if (fuelShortage) speed -= 18.5;
    if (copperTheft) speed -= 7.4;
    return Math.max(1.2, Number(speed.toFixed(2)));
  };

  const getNodeStatus = (node: string) => {
    if (copperTheft && (node === 'Tyre' || node === 'Barouk')) return 'VANDALIZED';
    if (fuelShortage && (node === 'Halba' || node === 'Hermel' || node === 'Tyre')) return 'NO_DIESEL';
    if (edlOff && (node === 'Jounieh' || node === 'Hermel' || node === 'Barouk')) return 'NO_POWER';
    return 'ONLINE';
  };

  return (
    <div style={{ padding: '15px', background: '#f6f6f0', border: '3px double #777', fontFamily: 'monospace', color: '#111' }}>
      {/* Title block */}
      <div style={{ borderBottom: '3px double #333', paddingBottom: '10px', marginBottom: '15px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0', color: 'black', textTransform: 'uppercase', textAlign: 'center' }}>
          Interactive Lebanon Geopolitical & Network Audit Portal
        </h2>
        <p style={{ margin: '0', fontSize: '11px', color: '#555', textAlign: 'center' }}>
          Gopher Database Node: gopher://gazette.audit.lab/thesis/context | System Time: 2026-06-18
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '15px', overflowX: 'auto', borderBottom: '2px solid #555', paddingBottom: '2px' }}>
        {[
          { id: 'demographics', label: '[1] Demographics' },
          { id: 'governance', label: '[2] Governance' },
          { id: 'economy', label: '[3] Trade & GDP' },
          { id: 'network', label: '[4] Network Stress' },
          { id: 'legal', label: '[5] Legal Cases' },
          { id: 'recs', label: '[6] Recs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '4px 8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#1e3d59' : '#e1e1d7',
              color: activeTab === tab.id ? 'white' : '#111',
              border: '1px solid #777',
              borderBottom: activeTab === tab.id ? 'none' : '1px solid #777',
              marginBottom: activeTab === tab.id ? '-2px' : '0px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div style={{ background: '#fcfcfc', border: '1px solid #777', padding: '15px', minHeight: '450px' }}>
        
        {/* TAB 1: DEMOGRAPHICS */}
        {activeTab === 'demographics' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '3px', color: '#1e3d59' }}>
              I. Geographic, Historical, and Social Foundations
            </h3>
            <p style={{ fontSize: '12px', lineHeight: '1.5', margin: '0 0 12px 0' }}>
              Lebanon is a Levant nation located on the eastern shore of the Mediterranean Sea (10,400 sq km: 10,230 sq km land, 170 sq km water). Encompasses a Mediterranean climate. Crucially, Lebanon acts as a water-surplus state within a water-deficit region. The historical origins trace back to ancient Semitic civilizations, most notably the Phoenicians, who established prominent maritime city-states (Tyre, Sidon, Byblos) around 3000 BC.
            </p>

            {/* Interactive sliders */}
            <div style={{ background: '#f0f0e8', border: '1px dashed #777', padding: '12px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                🎛️ Dynamic Population & Utility Network Stress Model
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Refugee Population Load: <strong>{refugeeCount.toFixed(2)}M people</strong></span>
                    <span style={{ color: '#777' }}>(Registered & Unregistered)</span>
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="2.5"
                    step="0.05"
                    value={refugeeCount}
                    onChange={(e) => setRefugeeCount(parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Global Diaspora Waves: <strong>{diasporaCount.toFixed(1)}M people</strong></span>
                    <span style={{ color: '#777' }}>(Worldwide Lebanese descent)</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="18"
                    step="0.5"
                    value={diasporaCount}
                    onChange={(e) => setDiasporaCount(parseFloat(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Calculations telemetry */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div style={{ border: '1px solid #777', padding: '8px', textAlign: 'center', background: '#fcfcfc' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#555', display: 'block' }}>Total Domestic Pop</span>
                <strong style={{ fontSize: '14px', color: 'black' }}>{totalPop.toFixed(2)} Million</strong>
              </div>
              <div style={{ border: '1px solid #777', padding: '8px', textAlign: 'center', background: '#fcfcfc' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#555', display: 'block' }}>Calculated Pop Density</span>
                <strong style={{ fontSize: '14px', color: 'black' }}>{density.toFixed(2)} / sq km</strong>
              </div>
              <div style={{
                border: '1px solid #777',
                padding: '8px',
                textAlign: 'center',
                background: utilityStrain > 140 ? '#fde8e8' : '#eafaf1',
                borderColor: utilityStrain > 140 ? '#e0b0b0' : '#b0e0c0'
              }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#555', display: 'block' }}>Utility Network Strain</span>
                <strong style={{ fontSize: '14px', color: utilityStrain > 140 ? '#c0392b' : '#27ae60' }}>
                  {utilityStrain.toFixed(0)}% {utilityStrain > 150 ? '⚠️ OVERLOAD' : utilityStrain > 120 ? '⚡ HIGH' : '✅ NORMAL'}
                </strong>
              </div>
            </div>

            {/* Demographic table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #555', background: '#fcfcf8', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#d4d4d4', borderBottom: '1px solid #555' }}>
                  <th style={{ padding: '5px', textAlign: 'left', borderRight: '1px solid #777' }}>Demographic Group</th>
                  <th style={{ padding: '5px', textAlign: 'left', borderRight: '1px solid #777' }}>Sectarian / Global Share</th>
                  <th style={{ padding: '5px', textAlign: 'left' }}>Primary Concentration Centers</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #aaa' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777', fontWeight: 'bold' }}>Shia Muslim</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777' }}>32.2% of domestic pop</td>
                  <td style={{ padding: '4px 6px' }}>Beqaa Valley, Southern Lebanon, Beirut Dahieh</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #aaa' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777', fontWeight: 'bold' }}>Sunni Muslim</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777' }}>31.2% of domestic pop</td>
                  <td style={{ padding: '4px 6px' }}>West Beirut, Tripoli, Sidon, Akkar district, West Beqaa</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #aaa' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777', fontWeight: 'bold' }}>Christian (All Sects)</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777' }}>32.4% of domestic pop</td>
                  <td style={{ padding: '4px 6px' }}>Mount Lebanon (Maronite largest, Greek Orthodox second)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #aaa' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777', fontWeight: 'bold' }}>Druze</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777' }}>4.5% to 5.5% of domestic pop</td>
                  <td style={{ padding: '4px 6px' }}>Chouf, Aley, Hasbaya, Rashaya</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777', fontWeight: 'bold' }}>Global Diaspora</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #777' }}>Est. {diasporaCount.toFixed(1)} Million</td>
                  <td style={{ padding: '4px 6px' }}>Brazil, USA, France, Canada, Gulf (No automatic citizenship return)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: GOVERNANCE */}
        {activeTab === 'governance' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '3px', color: '#1e3d59' }}>
              II. Governance, Constitutional Mechanics, and the 2025 Transition
            </h3>
            <p style={{ fontSize: '12px', lineHeight: '1.5', margin: '0 0 10px 0' }}>
              Lebanon operates a power-sharing system known as <strong>confessionalism</strong>, allocating posts among religious communities (President: Maronite Christian, Prime Minister: Sunni Muslim, Speaker of Parliament: Shia Muslim). Following a 2-year presidential vacancy (October 2022 – January 2025), General Joseph Aoun was elected as the 14th President of Lebanon on January 9, 2025 (securing 99/128 votes). Nawaf Salam was appointed Prime Minister on January 13, 2025, forming a caretaker government of independent experts alongside traditional factions to stabilize public systems before the May 2026 elections.
            </p>

            <div style={{ border: '2px solid #555', background: '#fcfcf8', padding: '10px', marginBottom: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px dotted #777', paddingBottom: '3px' }}>
                🏛️ Cabinet Seat Configuration Grid (24-Seat Dashboard)
              </h4>
              <p style={{ fontSize: '10px', color: '#555', margin: '0 0 10px 0' }}>
                Select a seat below to query ministerial profiles, portfolios, and sectarian allocations:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginBottom: '12px' }}>
                {cabinetSeats.map(seat => {
                  let bgColor = '#e1e1d7';
                  if (seat.bloc === 'Prime Minister Share') bgColor = '#bbd4e8';
                  else if (seat.bloc === 'Presidential Share') bgColor = '#cde7d0';
                  else if (seat.bloc === 'Strong Republic Bloc') bgColor = '#e3c6d6';
                  else if (seat.bloc === 'Loyalty to Resistance' || seat.bloc === 'Development & Liberation') bgColor = '#f7e4be';
                  else bgColor = '#fadbd8';

                  const isSelected = selectedSeat === seat.id;

                  return (
                    <button
                      key={seat.id}
                      onClick={() => setSelectedSeat(isSelected ? null : seat.id)}
                      style={{
                        padding: '6px 2px',
                        background: bgColor,
                        color: '#000',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        border: isSelected ? '2px solid #000' : '1px solid #777',
                        cursor: 'pointer',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        boxShadow: isSelected ? 'none' : '1px 1px 0 #fff'
                      }}
                    >
                      SEAT {seat.id}
                      <span style={{ display: 'block', fontSize: '8px', fontWeight: 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {seat.name.split(' ').pop()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Seat Metadata display */}
              <div style={{
                background: '#000',
                color: '#2ecc71',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '11px',
                border: '1px solid #555',
                minHeight: '85px',
                textShadow: '0 0 2px #2ecc71'
              }}>
                {selectedSeat ? (
                  <div>
                    {(() => {
                      const s = cabinetSeats.find(x => x.id === selectedSeat);
                      if (!s) return null;
                      return (
                        <>
                          <div style={{ borderBottom: '1px dashed #2ecc71', paddingBottom: '3px', marginBottom: '5px', fontWeight: 'bold' }}>
                            [CABINET PORTAL QUERY] SEAT #{s.id} - ACTIVE
                          </div>
                          <div>MINISTER   : {s.name}</div>
                          <div>PORTFOLIO  : {s.portfolio}</div>
                          <div>BLOC/ALLIANCE: {s.bloc} ({s.type})</div>
                          <div>CONFESSION  : {s.confession}</div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ color: '#888', fontStyle: 'italic', textShadow: 'none', textAlign: 'center', paddingTop: '20px' }}>
                    [CABINET GRID IDLE: CLICK ANY SEAT TO QUERY DIAGNOSTIC FIELD DATA]
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ECONOMY & GDP */}
        {activeTab === 'economy' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '3px', color: '#1e3d59' }}>
              III. Economic Assessment: Contraction, Rebound, and Trade Dynamics
            </h3>
            <p style={{ fontSize: '12px', lineHeight: '1.5', margin: '0 0 10px 0' }}>
              Since 2019, Lebanon has experienced an economic crisis characterized by currency depreciation (depreciating over 98% from the 1,515 LBP/USD peg), hyperinflation, and a major default on its public debt (estimated at 164.1% debt-to-GDP ratio in 2024). In late 2024, regional escalations caused a real GDP contraction of 5.7% to 7.1% (a $4.2 billion loss). 2025 GDP projects a fragile 3.5% to 4.7% recovery, with inflation expected to drop from 45.2% down to 15.2%, supported by dollarization and remittances.
            </p>

            {/* Interactive Trade Visualizer */}
            <div style={{ background: '#f5f5f0', border: '1px solid #555', padding: '12px', marginBottom: '10px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                📊 Interactive Export Partner Flow (2023 base)
              </h4>
              <p style={{ fontSize: '10px', color: '#555', margin: '0 0 8px 0' }}>
                Select an export partner to audit trade commodities and relative shares:
              </p>
              
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                {Object.keys(tradePartners).map(p => (
                  <button
                    key={p}
                    onClick={() => setSelectedPartner(p)}
                    style={{
                      padding: '4px 10px',
                      background: selectedPartner === p ? '#2c3e50' : '#d4d4d4',
                      color: selectedPartner === p ? 'white' : '#000',
                      border: '1px solid #555',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >
                    {p} ({tradePartners[p as keyof typeof tradePartners].pct}%)
                  </button>
                ))}
              </div>

              {/* Trade Details Output */}
              <div style={{ background: '#fff', border: '1px solid #777', padding: '8px', fontSize: '11px' }}>
                {(() => {
                  const partner = tradePartners[selectedPartner as keyof typeof tradePartners];
                  // Draw ASCII bar
                  const barLength = Math.round(partner.pct * 1.5);
                  const barStr = '█'.repeat(barLength) + '░'.repeat(33 - barLength);
                  
                  return (
                    <div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Partner:</strong> {selectedPartner} | <strong>Export Value:</strong> ${partner.val} Billion
                      </div>
                      <div style={{ marginBottom: '6px', color: '#16a085', fontFamily: 'monospace' }}>
                        [{barStr}] {partner.pct}% of total exports
                      </div>
                      <div style={{ fontSize: '10px', color: '#333' }}>
                        <strong>Commodities:</strong> {partner.comm}<br />
                        <strong>Notes:</strong> {partner.notes}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <p style={{ fontSize: '10px', color: '#555', margin: '5px 0 0 0' }}>
              *Note: Lebanon suffers from a severe structural trade deficit, imports stood at $23.313B vs. exports of $11.77B (Trade Deficit: -$11.543B). Productive sectors are depressed, with the industrial sector accounting for just 2.4% of GDP.
            </p>
          </div>
        )}

        {/* TAB 4: NETWORK SIMULATION */}
        {activeTab === 'network' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '3px', color: '#1e3d59' }}>
              IV. Digital Infrastructure: Centralization and Operational Vulnerability
            </h3>
            <p style={{ fontSize: '12px', lineHeight: '1.5', margin: '0 0 10px 0' }}>
              Lebanon's telecommunications sector is a state-controlled monopoly. Ogero acts as the national operator for fixed-line and data transit, while Alfa and Touch operate mobile systems under the Ministry. Structural upgrades (2018 Fiber Vision) halted in 2019. The system suffers major vulnerability to the national electricity grid collapse, requiring cell sites to rely on diesel generators.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
              
              {/* Stress controls */}
              <div style={{ background: '#f4f4f4', border: '1px solid #777', padding: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', borderBottom: '1px solid #777' }}>
                  ⚙️ Systemic Risk Injection Panel
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={edlOff}
                      onChange={(e) => setEdlOff(e.target.checked)}
                    />
                    <span> EDL Power Grid Collapse</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={fuelShortage}
                      onChange={(e) => setFuelShortage(e.target.checked)}
                    />
                    <span> Diesel Fuel Supply Withheld</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={copperTheft}
                      onChange={(e) => setCopperTheft(e.target.checked)}
                    />
                    <span> Copper Vandalism & Equipment Theft</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', borderTop: '1px dashed #aaa', paddingTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={starlinkBypass}
                      onChange={(e) => setStarlinkBypass(e.target.checked)}
                    />
                    <span> Enable Starlink Satellite (Oct 2025)</span>
                  </label>
                </div>
              </div>

              {/* Stress Telemetry */}
              <div style={{ background: '#0f172a', color: '#38bdf8', border: '1px solid #555', padding: '10px', fontFamily: 'monospace', fontSize: '10px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '10px', textTransform: 'uppercase', color: '#f8fafc', borderBottom: '1px solid #38bdf8', paddingBottom: '3px' }}>
                  📡 Live Network Telemetry
                </h4>
                
                <div style={{ marginBottom: '6px' }}>
                  TERRESTRIAL FIXED DSL SPEED:<br />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: getTerrestrialSpeed() < 10 ? '#ef4444' : '#34d399' }}>
                    {getTerrestrialSpeed()} Mbps
                  </span> (Base: 17.27)
                </div>

                <div style={{ marginBottom: '6px' }}>
                  MOBILE 3G/4G/LTE CELL SPEED:<br />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: getMobileSpeed() < 20 ? '#ef4444' : '#34d399' }}>
                    {getMobileSpeed()} Mbps
                  </span> (Base: 45.74)
                </div>

                <div style={{ borderTop: '1px dotted #38bdf8', paddingTop: '4px', marginTop: '4px' }}>
                  REGIONAL STATUS LIGHTS:<br />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginTop: '3px' }}>
                    {['Jounieh', 'Tyre', 'Halba', 'Hermel', 'Barouk'].map(node => {
                      const stat = getNodeStatus(node);
                      let sColor = '#34d399';
                      if (stat === 'NO_POWER') sColor = '#fbbf24';
                      if (stat === 'NO_DIESEL') sColor = '#fb923c';
                      if (stat === 'VANDALIZED') sColor = '#ef4444';

                      return (
                        <div key={node}>
                          {node}: <strong style={{ color: sColor }}>{stat}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {starlinkBypass && (
                  <div style={{ borderTop: '1px dashed #ef4444', color: '#ef4444', marginTop: '6px', paddingTop: '4px', fontSize: '9px', fontWeight: 'bold' }}>
                    🚨 TREASURY WARNING: Satellites bypass national gateways (150K data lines). Est. -$18M treasury revenue loss within 5 years. Communications exposed to foreign surveillance.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: LEGAL CASES */}
        {activeTab === 'legal' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '3px', color: '#1e3d59' }}>
              V. Digital Jurisprudence, Data Privacy, and Freedom of Expression
            </h3>
            <p style={{ fontSize: '12px', lineHeight: '1.5', margin: '0 0 10px 0' }}>
              Lebanon's digital legal framework is governed by <strong>Law No. 81 of 2018</strong> (Electronic Transactions and Personal Data). Criticized as outdated, it lacks an independent Data Protection Authority (supervision resides inside the Ministry of Economy), leaving citizen data exposed. Concurrently, the state utilizes outdated <strong>Law No. 140 of 1999</strong> for interception, and the ISF Anti-Cybercrime Bureau to crack down on digital speech.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '15px' }}>
              
              {/* Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#555', textTransform: 'uppercase' }}>Audited Dossiers:</span>
                {[
                  { id: 'whatsapp', label: 'VoIP Protest (\'19)' },
                  { id: 'shibani', label: 'Amer Shibani (\'19)' },
                  { id: 'sadek', label: 'Dima Sadek (\'23)' },
                  { id: 'sgbl', label: 'SGBL Lawsuits (\'24-\'25)' },
                  { id: 'centralbank', label: 'CB Corruption (\'25)' }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCase(c.id)}
                    style={{
                      padding: '4px',
                      background: selectedCase === c.id ? '#1e293b' : '#e2e8f0',
                      color: selectedCase === c.id ? 'white' : 'black',
                      border: '1px solid #94a3b8',
                      textAlign: 'left',
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    📂 {c.label}
                  </button>
                ))}
              </div>

              {/* CRT Output */}
              <div style={{
                background: '#070b05',
                color: '#39ff14',
                border: '2px solid #555',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '11px',
                minHeight: '180px',
                boxShadow: 'inset 0 0 5px rgba(0,0,0,0.8)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* CRT Scanline Overlay */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                  backgroundSize: '100% 4px, 6px 100%',
                  pointerEvents: 'none'
                }}></div>

                {(() => {
                  const cs = caseStudies[selectedCase as keyof typeof caseStudies];
                  return (
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ borderBottom: '1px solid #39ff14', paddingBottom: '3px', marginBottom: '8px', fontWeight: 'bold' }}>
                        DOSSIER: {cs.title.toUpperCase()}
                      </div>
                      <div>DATE / PERIOD   : {cs.year}</div>
                      <div>CHARGES RECORDED: {cs.charge}</div>
                      <div>INVESTIGATING   : {cs.bureau}</div>
                      <div style={{ borderTop: '1px dotted #39ff14', marginTop: '8px', paddingTop: '6px', color: '#adff2f' }}>
                        OUTCOME SUMMARY  : {cs.outcome}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: RECOMMENDATIONS */}
        {activeTab === 'recs' && (
          <div>
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #555', paddingBottom: '3px', color: '#1e3d59' }}>
              VI. Strategic Recommendations
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div style={{ borderLeft: '3px solid #1e3d59', paddingLeft: '10px' }}>
                <strong style={{ textTransform: 'uppercase', color: '#1e3d59' }}>1. Robust Operational Redundancy</strong>
                <p style={{ margin: '3px 0 0 0', lineHeight: '1.4' }}>
                  Organizations must avoid single reliance on state utilities. Implement solar/hybrid off-grid generators and multi-channel communication (terrestrial landlines + satellite backup).
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #16a085', paddingLeft: '10px' }}>
                <strong style={{ textTransform: 'uppercase', color: '#16a085' }}>2. Data Localization & Encryption</strong>
                <p style={{ margin: '3px 0 0 0', lineHeight: '1.4' }}>
                  Due to weaknesses in Law No. 81/2018 and active intercept networks, store sensitive client/financial data on cloud servers hosted outside of Lebanon. Encrypt corporate messaging end-to-end.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #d35400', paddingLeft: '10px' }}>
                <strong style={{ textTransform: 'uppercase', color: '#d35400' }}>3. Independent Legal Counsel</strong>
                <p style={{ margin: '3px 0 0 0', lineHeight: '1.4' }}>
                  Keep legal representation ready for disputes. The Cybercrime Bureau frequently summons journalists, which violates proper Publications Court jurisdiction and procedures.
                </p>
              </div>

              <div style={{ borderLeft: '3px solid #8e44ad', paddingLeft: '10px' }}>
                <strong style={{ textTransform: 'uppercase', color: '#8e44ad' }}>4. Security Crisis Planning</strong>
                <p style={{ margin: '3px 0 0 0', lineHeight: '1.4' }}>
                  Though geopolitical stabilization has improved under President Joseph Aoun, maintaining contingency evacuation plans remains mandatory due to regional threats and "Homeland Shield" expansion.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
