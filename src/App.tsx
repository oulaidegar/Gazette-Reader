import { useState, useEffect, useRef } from 'react';
import logsData from './data/logs_db.json';
import scraperData from './data/scraper_convs_db.json';
import geminiChatData from './data/gemini_chat_logs_db.json';
import thesisData from './data/thesis_db.json';
import vibecoderData from './data/vibecoder_db.json';
import LebanonOverview from './components/LebanonOverview';
import whatsappChatsData from './data/whatsapp_chats_db.json';


// ASCII art & background assets
import asciiArt1 from '../ascii/ascii-art (1).txt?raw';
import asciiArt2 from '../ascii/ascii-art (2).txt?raw';
import horizontalImage from '../ascii/gazette_years_stitched_horizontal.jpg';

interface ScraperInteraction {
  index: number;
  timestamp: string;
  prompt: string;
  opening_remarks: string;
  code_block: string;
  closing_remarks: string;
}

interface ThesisCitation {
  key: string;
  citation: string;
  anchor: string;
}

interface ThesisManuscriptSection {
  id: string;
  title: string;
  text: string;
  citations: string[];
}

interface CriterionPillar {
  id: string;
  number: number;
  title: string;
  definition: string;
  empirical: string;
  pillarText: string;
}

interface LebanonContextPoint {
  type: string;
  role: string;
  barriers: string;
}

interface LebanonContext {
  title: string;
  description: string;
  points: LebanonContextPoint[];
}

interface ThesisDatabase {
  criteria: CriterionPillar[];
  lebanon_context: LebanonContext;
  manuscript: ThesisManuscriptSection[];
  bibliography: ThesisCitation[];
}

interface Task {
  id: number;
  text: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface Failure {
  category: string;
  code: string;
  title: string;
  message: string;
  file: string;
}

interface Step {
  index: number;
  role: 'user' | 'assistant' | 'tool';
  name: string;
  timestamp: string;
  content: string;
  exit_code?: number;
  status?: string;
  command?: string;
  file_path?: string;
  margin_note: string | null;
  task_state: Task[];
  failure: Failure | null;
  is_rescue?: boolean;
}

interface Cascade {
  id: string;
  name: string;
  steps_count: number;
  status: string;
  created_at: string;
  autonomy_level: number;
  human_code_split: { human: number; agent: number };
  steps: Step[];
}

function highlightPython(code: string) {
  if (!code) return null;
  const lines = code.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    let className = 'code-base';
    
    if (trimmed.startsWith('#')) {
      className = 'code-comment';
    } else if (
      trimmed.includes('ThreadPool') || 
      trimmed.includes('concurrent') || 
      trimmed.includes('executor') || 
      trimmed.includes('thread') ||
      trimmed.includes('workers') ||
      trimmed.includes('multi-worker') ||
      trimmed.includes('Session') ||
      trimmed.includes('headers')
    ) {
      className = 'code-add-v2';
    } else if (
      trimmed.includes('try:') || 
      trimmed.includes('except') || 
      trimmed.includes('backoff') || 
      trimmed.includes('sleep') || 
      trimmed.includes('retry') || 
      trimmed.includes('attempt') || 
      trimmed.includes('timeout') ||
      trimmed.includes('5000') ||
      trimmed.includes('status_code == 200') ||
      trimmed.includes('ensurepip')
    ) {
      className = 'code-add-v3';
    }
    
    return (
      <div key={idx} className={className} style={{ whiteSpace: 'pre', minHeight: '1.2em' }}>
        {line}
      </div>
    );
  });
}

const getOriginalFileName = (name: string): string => {
  if (name === 'Launching Local Host') {
    return 'Launching Local Host_2.md';
  }
  if (name.startsWith("cool now let's focus on the year 2019")) {
    return 'cool now let_s focus on the year 2019 only with this range 8.md';
  }
  return `${name}.md`;
};

const parseAssistantContent = (content: string) => {
  const thinkingRegex = /<details><summary>.*?Thinking.*?<\/summary>([\s\S]*?)<\/details>/i;
  const match = content.match(thinkingRegex);
  if (match) {
    const thinking = match[1].trim();
    const answer = content.replace(thinkingRegex, '').trim();
    return { thinking, answer };
  }
  return { thinking: null, answer: content };
};

function App() {
  const cascades = logsData as Cascade[];
  const scraperConvs = scraperData as ScraperInteraction[];
  const totalScraperSteps = scraperConvs.length;
  const geminiChatConvs = geminiChatData as ScraperInteraction[];
  const totalGeminiChatSteps = geminiChatConvs.length;
  // Screen routing states
  const [screenState, setScreenState] = useState<'intro' | 'loading' | 'gopher' | 'app'>('intro');
  const [gopherPath, setGopherPath] = useState<string>('gopher://gazette.audit.lab/');
  const [pathHistory, setPathHistory] = useState<string[]>(['gopher://gazette.audit.lab/']);
  const [gopherLoading, setGopherLoading] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [loadLogs, setLoadLogs] = useState<string[]>([]);
  const [downloadFileState, setDownloadFileState] = useState<{ name: string; size: string; progress: number } | null>(null);

  // Thesis visual methodology & scroll navigator states
  const [activePillarIndex, setActivePillarIndex] = useState<number>(0);
  const [activeBibKey, setActiveBibKey] = useState<string | null>(null);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

  // Gopher Collapsible Directories State
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});
  const toggleDir = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedDirs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const thesisDb = thesisData as ThesisDatabase;
  const thesisChapters = [
    { id: 'context', title: 'Chapter 1: Geopolitical, Socio-Economic & Digital Infrastructure Overview', icon: '📁', summary: 'Geopolitical framework, demographic profiles, and network infrastructure of Lebanon' },
    { id: 'translation', title: 'Special Exhibit 1: Arabic Linguistic Shifts & Diglossia Translation Case Study', icon: '🗣️', summary: 'Colloquial Lebanese, MSA, and Classical Arabic Styles' },
    { id: 'criteria', title: 'Chapter 2: Visual Methodology - The 4 Auditing Pillars', icon: '🏛️', summary: 'Accountability and Oversight, Linguistic Sovereignty, Market Dependency vs Public Value, and Information Asymmetry Mitigation' },
    { id: 'manuscript', title: 'Chapter 3: Interactive Manuscript & Bibliography Navigator', icon: '📖', summary: 'Full Research Text with Dual-Pane Scroll Citation Syncer' },
    { id: 'gource', title: 'Special Exhibit 2: Gource Repository Evolution Visualizer', icon: '☄️', summary: 'Live HTML5 Canvas simulation of repository commits & git instructions' },
    { id: 'materials', title: 'Chapter 4: Theoretical Framework Materials & Downloads', icon: '💾', summary: 'Academic preprints, data manifests, and core log files' },
    { id: 'vibecoder', title: 'Special Exhibit 3: The Way of Code - The Vibe Coder', icon: '📁', summary: 'The Timeless Art of Vibe Coding (Adapted from Lao Tzu by Rick Rubin)' },
    { id: 'invoices', title: 'Special Exhibit 4: Accumulative Audit Invoices & Financial Costs', icon: '📁', summary: 'Financial receipts and costs accumulated during the thesis auditing project' },
    { id: 'sample_issue', title: 'Special Exhibit 5: 2025 Official Gazette Sample Issue Reader', icon: '📖', summary: 'Interactive page-by-page reader of the late 2025 Gazette issue with zoom and download capabilities' }
  ];


  // BIOS boot simulation
  useEffect(() => {
    if (screenState === 'loading') {
      const logs = [
        "AMIBIOS (C) 1995 American Megatrends, Inc.",
        "BIOS Version 1.04.09 - Retro Edition",
        "CPU: Gemini AI Processor @ 4.80GHz",
        "Memory Test: 65536KB OK",
        "",
        "Detecting storage devices...",
        "  IDE Primary Master : GAZETTE_DOCUMENTS_HDD (1.2GB)",
        "  IDE Primary Slave  : THESIS_DATABASE_CDROM (650MB)",
        "",
        "Loading system drivers...",
        "  Loading LOGS_DB.SYS.......... OK",
        "  Loading SCRAPER_CONVS.SYS.... OK",
        "  Loading THESIS_DB.SYS........ OK",
        "  Loading NETSCAPE_2_0.EXE..... OK",
        "",
        "Boot sequence successful. Launching Netscape Navigator..."
      ];
      
      let logIdx = 0;
      const logInterval = setInterval(() => {
        if (logIdx < logs.length) {
          setLoadLogs(prev => [...prev, logs[logIdx]]);
          logIdx++;
        }
      }, 100);
      
      const progressInterval = setInterval(() => {
        setLoadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            clearInterval(logInterval);
            setTimeout(() => {
              setScreenState('gopher');
            }, 400);
            return 100;
          }
          return prev + 5;
        });
      }, 60);

      const handleSkip = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          clearInterval(progressInterval);
          clearInterval(logInterval);
          setScreenState('gopher');
        }
      };
      window.addEventListener('keydown', handleSkip);

      return () => {
        clearInterval(progressInterval);
        clearInterval(logInterval);
        window.removeEventListener('keydown', handleSkip);
      };
    }
  }, [screenState]);

  const handleGopherNavigate = (newPath: string) => {
    setGopherLoading(true);
    setPathHistory(prev => [...prev, newPath]);
    setGopherPath(newPath);
    
    setTimeout(() => {
      setGopherLoading(false);
    }, 450);
  };

  const handleGopherBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      newHistory.pop();
      const prevPath = newHistory[newHistory.length - 1];
      
      setGopherLoading(true);
      setPathHistory(newHistory);
      setGopherPath(prevPath);
      
      setTimeout(() => {
        setGopherLoading(false);
      }, 350);
    }
  };

  const jumpToCascadeStep = (cascadeId: string, stepIndex: number) => {
    setScreenState('app');
    setActiveTab('timeline');
    setSelectedCascadeId(cascadeId);
    setPlaybackIndex(stepIndex);
  };

  const jumpToChatStep = (stepIndex: number) => {
    setScreenState('app');
    setActiveTab('gemini_chat');
    setGeminiChatVersion(stepIndex);
  };

  const triggerDownloadDialog = (name: string, size: string) => {
    setDownloadFileState({ name, size, progress: 0 });
    
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setDownloadFileState(prev => {
        if (!prev) {
          clearInterval(interval);
          return null;
        }
        if (prog >= 100) {
          clearInterval(interval);
          return { ...prev, progress: 100 };
        }
        return { ...prev, progress: prog };
      });
    }, 150);
  };



  const handleManuscriptScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const sections = container.querySelectorAll('section');
    let currentSectionId = '';
    
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top;
      
      if (relativeTop <= 80 && relativeTop > -rect.height + 40) {
        currentSectionId = sec.id;
      }
    });

    if (currentSectionId) {
      const activeSecObj = thesisDb.manuscript.find(s => s.id === currentSectionId);
      if (activeSecObj && activeSecObj.citations.length > 0) {
        setActiveBibKey(activeSecObj.citations[0]);
      }
    }
  };

  const handleBibliographyClick = (anchorId: string, citationKey: string) => {
    setActiveBibKey(citationKey);
    setHighlightedSectionId(anchorId);
    
    const element = document.getElementById(anchorId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    setTimeout(() => {
      setHighlightedSectionId(null);
    }, 1500);
  };

  const renderThesisChapters = (indentPrefix: string = '') => {
    return (
      <div className="gopher-list" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
        {thesisChapters.map((chapter, index) => {
          const isLast = index === thesisChapters.length - 1;
          const branchChar = isLast ? '└── ' : '├── ';
          const pipeChar = isLast ? '    ' : '│   ';
          const isExpanded = !!expandedDirs[`thesis_${chapter.id}`];
          const fullKey = `thesis_${chapter.id}`;

          return (
            <div key={chapter.id} className="gopher-item-container" style={{ margin: '4px 0' }}>
              <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#666', marginRight: '4px' }}>{indentPrefix}{branchChar}</span>
                <span 
                  className="gopher-collapse-toggle" 
                  onClick={(e) => toggleDir(fullKey, e)}
                  style={{ cursor: 'pointer', fontWeight: 'bold', color: 'blue', marginRight: '6px', userSelect: 'none' }}
                >
                  {isExpanded ? '[-]' : '[+]'}
                </span>
                <span className="gopher-icon" style={{ marginRight: '6px' }}>{chapter.icon}</span>
                <button 
                  className="gopher-link"
                  onClick={() => handleGopherNavigate(`gopher://gazette.audit.lab/thesis/${chapter.id}`)}
                  style={{ fontWeight: 'bold' }}
                >
                  {chapter.title}
                </button>
              </div>

              {isExpanded && (
                <div className="gopher-subtree" style={{ paddingLeft: '4px' }}>
                  {/* Sub-item 1: Navigate option */}
                  <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0' }}>
                    <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 📖 </span>
                    <button 
                      className="gopher-link"
                      onClick={() => handleGopherNavigate(`gopher://gazette.audit.lab/thesis/${chapter.id}`)}
                      style={{ fontSize: '13px', marginLeft: '6px' }}
                    >
                      [DOC] View Full Chapter Page
                    </button>
                  </div>

                  {chapter.id === 'context' && (
                    <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                      <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 📁 </span>
                      <button 
                        className="gopher-link"
                        onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis/context/evolution')}
                        style={{ fontSize: '13px', marginLeft: '6px', fontWeight: 'bold' }}
                      >
                        [DIR] Historical and Legislative Evolution of the Gazette/
                      </button>
                    </div>
                  )}

                  {/* Sub-item 2: Summary text */}
                  <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'flex-start', margin: '2px 0', fontSize: '12px', color: '#555' }}>
                    <span style={{ color: '#666', whiteSpace: 'pre' }}>{indentPrefix}{pipeChar}{chapter.id === 'materials' ? '├── ' : '└── '}📝 </span>
                    <span style={{ marginLeft: '6px' }}>[TXT] Summary: {chapter.summary}</span>
                  </div>

                  {/* Sub-items 3+: Special content if materials or context */}
                  {chapter.id === 'materials' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 📕 </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>Thesis_Booklet_Complete_Draft.pdf (1.8 MB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('Thesis_Booklet_Complete_Draft.pdf', '1.8 MB')}>
                          [Download]
                        </button>
                      </div>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 📕 </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>Chapter_2_ANT_Theoretical_Framework.pdf (512 KB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('Chapter_2_ANT_Theoretical_Framework.pdf', '512 KB')}>
                          [Download]
                        </button>
                      </div>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 📄 </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>scraper_convs_db.json (65 KB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('scraper_convs_db.json', '65 KB')}>
                          [Download]
                        </button>
                      </div>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}└── 📄 </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>official_gazette_2025_manifest.json (34 KB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('official_gazette_2025_manifest.json', '34 KB')}>
                          [Download]
                        </button>
                      </div>
                    </div>
                  )}

                  {chapter.id === 'translation' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'flex-start', margin: '2px 0', fontSize: '12px', color: '#222' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}└── 🗣️ </span>
                        <span style={{ marginLeft: '6px', fontStyle: 'italic' }}>
                          Showcases different versions of the Lebanon Gazette project mission statement: English, spoken Lebanese Arabic, Modern Standard Arabic (MSA), and elevated Quranic/Classical styles.
                        </span>
                      </div>
                    </div>
                  )}

                  {chapter.id === 'gource' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'flex-start', margin: '2px 0', fontSize: '12px', color: '#222' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}└── ☄️ </span>
                        <span style={{ marginLeft: '6px', fontStyle: 'italic' }}>
                          Simulates commit history and git trees using a live interactive 2D Canvas engine. Also lists instructions on how to install and run Gource locally.
                        </span>
                      </div>
                    </div>
                  )}

                  {chapter.id === 'invoices' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 🖼️ </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>Activation Card Receipt.jpeg (156 KB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('Activation Card Receipt.jpeg', '156 KB')}>
                          [Download]
                        </button>
                      </div>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 📕 </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>Cohere Invoice.pdf (36 KB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('Cohere Invoice.pdf', '36 KB')}>
                          [Download]
                        </button>
                      </div>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 🖼️ </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>Cohere Usage.png (183 KB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('Cohere Usage.png', '183 KB')}>
                          [Download]
                        </button>
                      </div>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 📕 </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>Google Cloud Console.pdf (37 KB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('Google Cloud Console.pdf', '37 KB')}>
                          [Download]
                        </button>
                      </div>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}├── 📕 </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>Supabase Receipt 1.pdf (115 KB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('Supabase Receipt 1.pdf', '115 KB')}>
                          [Download]
                        </button>
                      </div>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0', fontSize: '12px' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}└── 📕 </span>
                        <span style={{ marginLeft: '6px', color: '#222' }}>Supabase Recipet 2 .pdf (109 KB)</span>
                        <button className="netscape-download-btn" style={{ marginLeft: '10px', padding: '1px 6px', fontSize: '10px' }} onClick={() => triggerDownloadDialog('Supabase Recipet 2 .pdf', '109 KB')}>
                          [Download]
                        </button>
                      </div>
                    </div>
                  )}

                  {chapter.id === 'sample_issue' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'flex-start', margin: '2px 0', fontSize: '12px', color: '#222' }}>
                        <span style={{ color: '#666' }}>{indentPrefix}{pipeChar}└── 📖 </span>
                        <span style={{ marginLeft: '6px', fontStyle: 'italic' }}>
                          Opens an interactive page-by-page reader of Gazette Issue #9234 with pagination, zoom, and individual page downloads.
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };


  // Navigation tab states: 'timeline' | 'scraper' | 'gemini_chat' | 'failures' | 'autonomy' | 'pipeline' | 'whatsapp_chats'
  const [activeTab, setActiveTab] = useState<'timeline' | 'scraper' | 'gemini_chat' | 'failures' | 'autonomy' | 'pipeline' | 'whatsapp_chats'>('timeline');
  const [activeWhatsappChat, setActiveWhatsappChat] = useState<'uncle' | 'gazette'>('uncle');
  const [whatsappImagePreview, setWhatsappImagePreview] = useState<string | null>(null);
  const [scraperVersion, setScraperVersion] = useState<number>(1);
  const [geminiChatVersion, setGeminiChatVersion] = useState<number>(1);

  const activeScraperConv = scraperConvs[scraperVersion - 1] || scraperConvs[0];
  const activeGeminiConv = geminiChatConvs[geminiChatVersion - 1] || geminiChatConvs[0];


  // Cascade Selection States
  const [selectedCascadeId, setSelectedCascadeId] = useState<string>(cascades[0]?.id || '');
  const activeCascade = cascades.find(c => c.id === selectedCascadeId) || cascades[0];

  // Playback States
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // steps per second
  const timerRef = useRef<any>(null);

  // Toggle expanded output blocks
  const [expandedOutputs, setExpandedOutputs] = useState<Record<number, boolean>>({});

  // Autonomy slider state: 1, 3, or 5
  const [sliderVal, setSliderVal] = useState<number>(3);

  // Multilingual Accordion levels
  const [pipelineOpen, setPipelineOpen] = useState<Record<number, boolean>>({ 1: true, 2: false, 3: false });

  // Custom retro popup modals
  const [showAboutDialog, setShowAboutDialog] = useState<boolean>(false);
  const [showManifestoDialog, setShowManifestoDialog] = useState<boolean>(false);
  const [showSearchDialog, setShowSearchDialog] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [samplePage, setSamplePage] = useState<number>(1);
  const [sampleZoom, setSampleZoom] = useState<number>(1.0);

  interface SearchResult {
    category: 'gopher' | 'timeline' | 'scraper' | 'gemini_chat' | 'whatsapp';
    title: string;
    snippet: string;
    action: () => void;
  }

  const getSearchResults = (): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // 1. Gopher pages
    thesisChapters.forEach((ch) => {
      const matchTitle = ch.title.toLowerCase().includes(query);
      const matchSummary = ch.summary.toLowerCase().includes(query);
      
      let matchCriteriaText = '';
      if (ch.id === 'criteria') {
        thesisDb.criteria.forEach((crit) => {
          if (crit.title.toLowerCase().includes(query) || crit.definition.toLowerCase().includes(query) || crit.empirical.toLowerCase().includes(query)) {
            matchCriteriaText += ` ${crit.title} ${crit.definition} ${crit.empirical}`;
          }
        });
      }

      let matchVibecoderText = '';
      if (ch.id === 'vibecoder') {
        (vibecoderData as any[]).forEach((item) => {
          if (item.text.toLowerCase().includes(query)) {
            matchVibecoderText += ` ${item.text}`;
          }
        });
      }

      if (matchTitle || matchSummary || matchCriteriaText || matchVibecoderText) {
        let snippet = ch.summary;
        if (matchCriteriaText) snippet = `Matches criteria text: ...${matchCriteriaText.substring(0, 100)}...`;
        else if (matchVibecoderText) {
          const idx = matchVibecoderText.toLowerCase().indexOf(query);
          snippet = `Matches text: ...${matchVibecoderText.substring(Math.max(0, idx - 40), Math.min(matchVibecoderText.length, idx + 60))}...`;
        }

        results.push({
          category: 'gopher',
          title: `Gopher: ${ch.title}`,
          snippet,
          action: () => {
            setScreenState('gopher');
            setGopherPath(`gopher://gazette.audit.lab/thesis/${ch.id}`);
            setPathHistory(prev => [...prev, `gopher://gazette.audit.lab/thesis/${ch.id}`]);
            setExpandedDirs(prev => ({
              ...prev,
              'root_thesis': true,
              [`thesis_${ch.id}`]: true
            }));
            if (ch.id === 'criteria' && matchCriteriaText) {
              const matchedCritIdx = thesisDb.criteria.findIndex(crit => 
                crit.title.toLowerCase().includes(query) || 
                crit.definition.toLowerCase().includes(query) || 
                crit.empirical.toLowerCase().includes(query)
              );
              if (matchedCritIdx !== -1) {
                setActivePillarIndex(matchedCritIdx);
              }
            }
            setShowSearchDialog(false);
          }
        });
      }
    });

    const evolutionTimelineText = `
19th Century Publications
1864 (or 1867): The first official newspaper, the "Lebanon Official Gazette," was published in four pages in Arabic and French during the Mutasarrifate period under Mutasarrif Daoud Pasha.
1888: The official "Beirut Province Gazette" was issued in Arabic and Turkish by the city's governor, Ali Pasha, to publish the news and orders of the Ottoman authorities.
1891: The newspaper "Lebanon" was adopted by Wassa Pasha to publish Mutasarrifate government news, making it a semi-official publication.
French Mandate & The Lebanese Republic
1921: The "Official Gazette of Greater Lebanon" was launched in Arabic and French following General Gouraud's 1920 proclamation creating Greater Lebanon.
1926: Following the adoption of the constitution and Lebanon's transformation into a republic, the publication's name was officially changed to the "Official Gazette of the Lebanese Republic".
Regulation and Pricing Decrees
December 28, 1959 (Decree No. 2870): Issued during Fouad Chehab's presidency, this decree defined the functions of the Official Gazette. Specifically, Paragraph (d) of Article 7 authorized the Directorate General of the Prime Minister's Office to manage the Gazette, publish its texts, and handle printing, distribution, and archiving.
1975: A structural change occurred when the Official Gazette was transformed into a department strictly under the Prime Minister's Office.
October 14, 1997 (Decree No. 1147): Article 2 of this decree governed the pricing of the Gazette, officially setting the annual subscription fee for the printed issues at 240,000 Lebanese pounds within Lebanon.
The Digital Transition
2004 (France): The French official gazette began publishing online for free.
2005 (Lebanon): The Prime Minister's Office website began publishing the Official Gazette. By the end of the year, all issues were made available online for free.
2015 / January 1, 2016 (France): The French government passed a law authorizing the complete elimination of their print version, making the French official gazette exclusively electronic and entirely free starting January 1, 2016.
February 23, 2018 (Decree No. 2420): This decree officially ended free electronic publishing in Lebanon. The first article stipulated that the subscription fee for the electronic Official Gazette was set at 550,000 Lebanese pounds. As a result, the free section of the website was removed and replaced with a paywall requiring a prepaid card for access.
General Laws Mentioned
Right to Access Information Law (Undated): The text cites the first paragraph of Article 18 of this law, which explicitly states that "access to administrative documents is free of charge at their location, unless physical preservation of the document prevents it". The author uses this law to argue against the paid electronic subscription model.
    `.toLowerCase();

    if (
      'historical and legislative evolution of the gazette'.includes(query) ||
      'historical & legislative evolution of the gazette'.includes(query) ||
      evolutionTimelineText.includes(query)
    ) {
      const idx = evolutionTimelineText.indexOf(query);
      const start = Math.max(0, idx - 45);
      const end = Math.min(evolutionTimelineText.length, idx + 55);
      const snippetText = idx !== -1
        ? `...${evolutionTimelineText.substring(start, end).replace(/\s+/g, ' ').trim()}...`
        : 'Historical & Legislative Evolution of the Gazette (Chapter 1 Subfolder)';
      results.push({
        category: 'gopher',
        title: 'Gopher: Historical & Legislative Evolution of the Gazette',
        snippet: snippetText,
        action: () => {
          setScreenState('gopher');
          setGopherPath('gopher://gazette.audit.lab/thesis/context/evolution');
          setPathHistory(prev => [...prev, 'gopher://gazette.audit.lab/thesis/context/evolution']);
          setExpandedDirs(prev => ({
            ...prev,
            'root_thesis': true,
            'thesis_context': true
          }));
          setShowSearchDialog(false);
        }
      });
    }

    if ('you need to absolutely readme before going into the website'.includes(query)) {
      results.push({
        category: 'gopher',
        title: 'Gopher: README Warning Folder',
        snippet: 'You need to absolutely Readme before going into the website',
        action: () => {
          setScreenState('gopher');
          setGopherPath('gopher://gazette.audit.lab/readme');
          setPathHistory(prev => [...prev, 'gopher://gazette.audit.lab/readme']);
          setExpandedDirs(prev => ({ ...prev, 'root_readme': true }));
          setShowSearchDialog(false);
        }
      });
    }

    // 2. Dev Timeline (logsData/cascades)
    cascades.forEach((cascade) => {
      cascade.steps.forEach((step) => {
        const matchName = step.name.toLowerCase().includes(query);
        const matchContent = step.content?.toLowerCase().includes(query);
        const matchCommand = step.command?.toLowerCase().includes(query);
        const matchNote = step.margin_note?.toLowerCase().includes(query);

        if (matchName || matchContent || matchCommand || matchNote) {
          let snippet = '';
          if (matchCommand) snippet = `Command: \`${step.command}\``;
          else if (matchNote) snippet = `Note: "${step.margin_note}"`;
          else if (matchContent && step.content) {
            const idx = step.content.toLowerCase().indexOf(query);
            snippet = `Code: ...${step.content.substring(Math.max(0, idx - 30), Math.min(step.content.length, idx + 50)).replace(/\n/g, ' ')}...`;
          } else {
            snippet = `Step: ${step.name}`;
          }

          results.push({
            category: 'timeline',
            title: `Timeline: ${cascade.name} (Step ${step.index + 1})`,
            snippet,
            action: () => {
              setScreenState('app');
              setActiveTab('timeline');
              setSelectedCascadeId(cascade.id);
              setTimeout(() => {
                setPlaybackIndex(step.index);
              }, 100);
              setShowSearchDialog(false);
            }
          });
        }
      });
    });

    // 3. Scraper Evolution
    scraperConvs.forEach((conv, index) => {
      const matchPrompt = conv.prompt.toLowerCase().includes(query);
      const matchCode = conv.code_block.toLowerCase().includes(query);
      const matchOpen = conv.opening_remarks.toLowerCase().includes(query);
      const matchClose = conv.closing_remarks.toLowerCase().includes(query);

      if (matchPrompt || matchCode || matchOpen || matchClose) {
        let snippet = '';
        if (matchPrompt) snippet = `Prompt: "${conv.prompt.substring(0, 80)}..."`;
        else if (matchCode) {
          const idx = conv.code_block.toLowerCase().indexOf(query);
          snippet = `Code: ...${conv.code_block.substring(Math.max(0, idx - 30), Math.min(conv.code_block.length, idx + 50)).replace(/\n/g, ' ')}...`;
        } else {
          snippet = `Remarks: "${(conv.opening_remarks || conv.closing_remarks).substring(0, 80)}..."`;
        }

        results.push({
          category: 'scraper',
          title: `Scraper Interaction v${index + 1} (${conv.timestamp})`,
          snippet,
          action: () => {
            setScreenState('app');
            setActiveTab('scraper');
            setScraperVersion(index + 1);
            setShowSearchDialog(false);
          }
        });
      }
    });

    // 4. Gemini Chat
    geminiChatConvs.forEach((conv, index) => {
      const matchPrompt = conv.prompt.toLowerCase().includes(query);
      const matchCode = conv.code_block.toLowerCase().includes(query);
      const matchOpen = conv.opening_remarks.toLowerCase().includes(query);
      const matchClose = conv.closing_remarks.toLowerCase().includes(query);

      if (matchPrompt || matchCode || matchOpen || matchClose) {
        let snippet = '';
        if (matchPrompt) snippet = `Prompt: "${conv.prompt.substring(0, 80)}..."`;
        else if (matchCode) {
          const idx = conv.code_block.toLowerCase().indexOf(query);
          snippet = `Code: ...${conv.code_block.substring(Math.max(0, idx - 30), Math.min(conv.code_block.length, idx + 50)).replace(/\n/g, ' ')}...`;
        } else {
          snippet = `Remarks: "${(conv.opening_remarks || conv.closing_remarks).substring(0, 80)}..."`;
        }

        results.push({
          category: 'gemini_chat',
          title: `Gemini Chat Interaction v${index + 1} (${conv.timestamp})`,
          snippet,
          action: () => {
            setScreenState('app');
            setActiveTab('gemini_chat');
            setGeminiChatVersion(index + 1);
            setShowSearchDialog(false);
          }
        });
      }
    });

    // 5. WhatsApp Chats
    const chats = ['uncle', 'gazette'];
    chats.forEach((chatId) => {
      const msgs = (whatsappChatsData as any)[chatId] || [];
      msgs.forEach((msg: any) => {
        if (msg.content?.toLowerCase().includes(query) || msg.sender?.toLowerCase().includes(query)) {
          results.push({
            category: 'whatsapp',
            title: `WhatsApp [${chatId === 'uncle' ? 'Uncle Chat' : 'Gazette Chat'}]: ${msg.sender} (${msg.time})`,
            snippet: msg.content,
            action: () => {
              setScreenState('app');
              setActiveTab('whatsapp_chats');
              setActiveWhatsappChat(chatId as any);
              setShowSearchDialog(false);
            }
          });
        }
      });
    });

    return results.slice(0, 50);
  };

  // Handle URL deep linking for thesis supervisor
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const cascadeId = params.get('cascade') || params.get('file');
    const step = params.get('step');
    const chat = params.get('chat');
    const gopher = params.get('gopher');

    if (tab || cascadeId || chat || gopher) {
      // Direct deep link detected! Skip boot sequence.
      if (gopher) {
        setScreenState('gopher');
        setGopherPath(gopher);
        setPathHistory([gopher]);
        
        // Auto-expand directory depending on path
        if (gopher.startsWith('gopher://gazette.audit.lab/thesis')) {
          const parts = gopher.split('/');
          let subId = parts[parts.length - 1]; // e.g. 'invoices', 'context', etc.
          if (subId === 'evolution') {
            subId = 'context';
          }
          setExpandedDirs(prev => ({
            ...prev,
            'root_thesis': true,
            [`thesis_${subId}`]: true
          }));
        } else if (gopher === 'gopher://gazette.audit.lab/readme') {
          setExpandedDirs(prev => ({
            ...prev,
            'root_readme': true
          }));
        }
      } else {
        setScreenState('app');
        
        if (tab) {
          setActiveTab(tab as any);
        }
        
        if (cascadeId) {
          const found = cascades.find(c => 
            c.id === cascadeId || 
            getOriginalFileName(c.name) === cascadeId || 
            getOriginalFileName(c.name) === `${cascadeId}.md` ||
            c.name === cascadeId
          );
          if (found) {
            setSelectedCascadeId(found.id);
            
            if (step) {
              const stepIdx = parseInt(step) - 1; // 1-indexed from user link, 0-indexed in code
              if (!isNaN(stepIdx) && stepIdx >= 0 && stepIdx < found.steps.length) {
                // Defer step indexing slightly to allow reset useEffect to run first
                setTimeout(() => {
                  setPlaybackIndex(stepIdx);
                }, 100);
              }
            }
          }
        }
        
        if (tab === 'scraper' && step) {
          const val = parseInt(step);
          if (!isNaN(val) && val >= 1 && val <= totalScraperSteps) {
            setScraperVersion(val);
          }
        }
        if (tab === 'gemini_chat' && step) {
          const val = parseInt(step);
          if (!isNaN(val) && val >= 1 && val <= totalGeminiChatSteps) {
            setGeminiChatVersion(val);
          }
        }
        
        if (chat && (chat === 'uncle' || chat === 'gazette')) {
          setActiveWhatsappChat(chat);
        }
      }
    }
  }, [cascades, totalScraperSteps, totalGeminiChatSteps]);

  // Synchronize app state back to the URL query parameters dynamically
  useEffect(() => {
    if (screenState !== 'app' && screenState !== 'gopher') return;

    const params = new URLSearchParams();
    
    if (screenState === 'app') {
      params.set('tab', activeTab);
      
      if (activeTab === 'timeline' && activeCascade) {
        params.set('file', getOriginalFileName(activeCascade.name));
        params.set('step', String(playbackIndex + 1));
      } else if (activeTab === 'scraper') {
        params.set('step', String(scraperVersion));
      } else if (activeTab === 'gemini_chat') {
        params.set('step', String(geminiChatVersion));
      } else if (activeTab === 'whatsapp_chats') {
        params.set('chat', activeWhatsappChat);
      }
    } else if (screenState === 'gopher') {
      params.set('gopher', gopherPath);
    }
    
    const newRelativePathQuery = window.location.pathname + '?' + params.toString();
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [screenState, activeTab, selectedCascadeId, playbackIndex, scraperVersion, geminiChatVersion, activeWhatsappChat, gopherPath]);

  // Reset indices on cascade switch
  useEffect(() => {
    setPlaybackIndex(0);
    setIsPlaying(false);
    setExpandedOutputs({});
  }, [selectedCascadeId]);

  // Playback interval logic
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1000 / playbackSpeed;
      timerRef.current = setInterval(() => {
        setPlaybackIndex(prev => {
          if (activeCascade && prev < activeCascade.steps.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, activeCascade]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const stepForward = () => {
    if (activeCascade && playbackIndex < activeCascade.steps.length - 1) {
      setPlaybackIndex(playbackIndex + 1);
    }
  };

  const stepBackward = () => {
    if (playbackIndex > 0) {
      setPlaybackIndex(playbackIndex - 1);
    }
  };

  const jumpToFailureStep = (cascadeId: string, stepIdx: number) => {
    setSelectedCascadeId(cascadeId);
    setPlaybackIndex(stepIdx);
    setActiveTab('timeline');
    setIsPlaying(false);
  };

  const toggleOutput = (idx: number) => {
    setExpandedOutputs(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const togglePipelineSection = (num: number) => {
    setPipelineOpen(prev => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

  // Autonomy mappings
  const autonomyLevelDetails: Record<number, {
    title: string;
    description: string;
    metrics: string[];
    c_split: { human: number; agent: number };
  }> = {
    1: {
      title: "Level 1: Pure Dictation (Sequential Operator)",
      description: "Direct linear operator control. The AI agent functions strictly as an action compiler. It does not construct mental graphs, write plans, or retry on execution errors without direct human instruction input.",
      metrics: [
        "Human controls shell workspace commits and handles dependencies.",
        "Agent performs 1-to-1 CLI translations.",
        "Action outcomes: Direct shell copy of git folders."
      ],
      c_split: { human: 30, agent: 70 }
    },
    3: {
      title: "Level 3: Guided Synthesis (Blueprint Architect)",
      description: "Collaborative developer iteration. The human establishes the system blueprints, API specifications, and directory structure guidelines. The agent compiles task checklists (task.md) and edits code modules autonomously.",
      metrics: [
        "Human directs system schema and validates FastAPI endpoints.",
        "Agent constructs internal checklists and resolves file mutations.",
        "Agent loops through NPM installs and resolves packages."
      ],
      c_split: { human: 15, agent: 85 }
    },
    5: {
      title: "Level 5: Deep Autonomy (Agentic Audit Monitor)",
      description: "Fully autonomous loop execution. The human sets a target goal ('align RAG retrieval database structure'). The agent generates implementation plans, spins background tests, parses logs, handles compilation errors, and resolves import path circular locks.",
      metrics: [
        "Human inputs high-level goal; agent maps task checklists dynamically.",
        "Agent handles complex cross-file imports and path resolutions.",
        "Self-repair: Agent reads exit failures and runs compiler checks."
      ],
      c_split: { human: 3, agent: 97 }
    }
  };

  const activeAutonomyConfig = autonomyLevelDetails[sliderVal] || autonomyLevelDetails[3];

  // SVG pie chart properties
  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  const agentOffset = circumference - (activeAutonomyConfig.c_split.agent / 100) * circumference;
  const humanOffset = circumference - (activeAutonomyConfig.c_split.human / 100) * circumference;

  // Global counts
  const totalSteps = cascades.reduce((acc, c) => acc + c.steps_count, 0);
  const totalRescues = 1;
  const totalFailures = 3;

  if (screenState === 'intro') {
    return (
      <div className="intro-screen" style={{ backgroundImage: `url(${horizontalImage})` }}>
        {/* Dark overlay for contrast and readability */}
        <div className="intro-dark-overlay"></div>

        {/* ASCII Art Content Container */}
        <div className="intro-content-container">
          {/* Main Title / Header */}
          <div className="intro-header-group">
            <h1 className="intro-main-title">
              OFFICIAL GAZETTE AUDITING LABORATORY
            </h1>
            <p className="intro-sub-title">
              Democratic Ingestion, Algorithmic Agency, and Linguistic Sovereignty in Lebanese Legal Archives
            </p>
          </div>

          {/* ASCII Columns */}
          <div className="intro-ascii-container crt-effect">
            {/* Column 1: Arabic Gazette Calligraphy ASCII */}
            <div className="intro-ascii-col first-col">
              <pre className="intro-ascii-pre amber-glow">
                {asciiArt1}
              </pre>
            </div>

            {/* Column 2: Binary Audit Map ASCII */}
            <div className="intro-ascii-col second-col">
              <pre className="intro-ascii-pre green-glow">
                {asciiArt2}
              </pre>
            </div>
          </div>

          {/* Entry Button */}
          <button 
            onClick={() => setScreenState('loading')}
            className="retro-entry-btn"
          >
            INITIALIZE AUDITING LABORATORY
          </button>
        </div>
      </div>
    );
  }

  if (screenState === 'loading') {
    return (
      <div className="bios-screen" onClick={() => setScreenState('gopher')}>
        <div className="bios-header">
          <span>AMIBIOS (C) 1995 American Megatrends, Inc.</span>
          <span style={{ float: 'right' }}>Vite-OS v5.4.11</span>
        </div>
        <div className="bios-log">
          {loadLogs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
          <div className="bios-cursor"></div>
        </div>
        <div className="bios-footer">
          <div className="bios-progress-container">
            <span style={{ marginRight: '8px', fontSize: '11px', fontWeight: 'bold' }}>STARTING SYSTEM:</span>
            <div className="bios-progress-bar">
              <div className="bios-progress-fill" style={{ width: `${loadProgress}%` }}></div>
            </div>
            <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 'bold' }}>{loadProgress}%</span>
          </div>
          <div style={{ marginTop: '8px', color: '#888', fontSize: '11px' }}>
            Press [ESC] or click anywhere to skip boot sequence immediately.
          </div>
        </div>
      </div>
    );
  }

  if (screenState === 'gopher') {
    return (
      <div className="netscape-window">
        {/* Netscape Title Bar (Purple) */}
        <div className="netscape-title-bar">
          <div className="title-text-group" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>🕸️</span>
            <span>Netscape - [{gopherPath}]</span>
          </div>
          <div className="win-window-controls">
            <button className="win-sys-btn">_</button>
            <button className="win-sys-btn">■</button>
            <button className="win-sys-btn" onClick={() => { if(confirm("Close Netscape Navigator?")) window.close(); }}>X</button>
          </div>
        </div>

        {/* Netscape Menu Bar */}
        <div className="netscape-menu-bar">
          <button className="menu-item-btn" onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/')}><span>F</span>ile</button>
          <button className="menu-item-btn" onClick={() => alert("Netscape Edit Menu")}><span>E</span>dit</button>
          <button className="menu-item-btn" onClick={() => alert("Gopher views are plain text & links")}><span>V</span>iew</button>
          <button className="menu-item-btn" onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/')}><span>G</span>o</button>
          <button className="menu-item-btn" onClick={() => alert("Chapters & portal bookmarked!")}><span>B</span>ookmarks</button>
          <button className="menu-item-btn" onClick={() => alert("Network Connections: DNS Resolved")}><span>O</span>ptions</button>
          <button className="menu-item-btn" onClick={() => alert("Auditing Directory Active")}><span>D</span>irectory</button>
          <button className="menu-item-btn" onClick={() => setShowSearchDialog(true)}><span>S</span>earch</button>
          <button className="menu-item-btn" onClick={() => alert("Netscape Navigator v2.0 - Gopher Portal Client")}><span>H</span>elp</button>
        </div>

        {/* Netscape Toolbar */}
        <div className="netscape-toolbar">
          <button 
            className="netscape-btn" 
            disabled={pathHistory.length <= 1}
            onClick={handleGopherBack}
          >
            <span style={{ fontSize: '14px' }}>◀</span>
            Back
          </button>
          <button className="netscape-btn" disabled>
            Forward
            <span style={{ fontSize: '14px' }}>▶</span>
          </button>
          <button 
            className="netscape-btn" 
            onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/')}
          >
            🏠
            Home
          </button>
          <button 
            className="netscape-btn" 
            onClick={() => {
              setGopherLoading(true);
              setTimeout(() => setGopherLoading(false), 400);
            }}
          >
            🔄
            Reload
          </button>
          <button className="netscape-btn" onClick={() => alert(`Address: ${gopherPath}`)}>
            📂
            Open
          </button>
          <button className="netscape-btn" onClick={() => window.print()}>
            🖨️
            Print
          </button>
          <button className="netscape-btn" onClick={() => setShowSearchDialog(true)}>
            🔍
            Find
          </button>
          <button 
            className="netscape-btn" 
            onClick={() => setGopherLoading(false)}
            disabled={!gopherLoading}
          >
            🛑
            Stop
          </button>
        </div>

        {/* Address Input Bar */}
        <div className="netscape-address-bar">
          <span className="address-label">Location:</span>
          <div className="address-input-wrapper">
            <input 
              type="text" 
              className="netscape-address-input" 
              value={gopherPath} 
              readOnly 
            />
          </div>
          {/* Netscape animated N logo */}
          <div 
            className={`netscape-n-logo ${gopherLoading ? 'loading' : ''}`}
            onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/')}
            title="Go to main Gopher portal"
          >
            N
          </div>
        </div>

        {/* Netscape Body / Gopher Document */}
        <div className="netscape-body">
          <h1 className="gopher-title">Gopher Menu</h1>
          
          {gopherLoading ? (
            <div style={{ fontFamily: 'monospace', padding: '20px', fontSize: '13px' }}>
              Receiving Gopher data stream... [15.2Kbps resolved]
              <div className="bios-cursor" style={{ display: 'inline-block', marginLeft: '4px' }}></div>
            </div>
          ) : (
            <div className="gopher-content">
              {/* Root Gopher Directory */}
              {gopherPath === 'gopher://gazette.audit.lab/' && (
                <div className="gopher-list" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  {/* Item 0: README Folder */}
                  <div className="gopher-item-container" style={{ margin: '4px 0 12px 0' }}>
                    <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center' }}>
                      <span 
                        className="gopher-collapse-toggle" 
                        onClick={(e) => toggleDir('root_readme', e)}
                        style={{ cursor: 'pointer', fontWeight: 'bold', color: 'blue', marginRight: '6px', userSelect: 'none' }}
                      >
                        {expandedDirs['root_readme'] ? '[-]' : '[+]'}
                      </span>
                      <span className="gopher-icon" style={{ marginRight: '6px' }}>📁</span>
                      <button 
                        className="gopher-link"
                        onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/readme')}
                        style={{ fontWeight: 'bold', color: '#b22222' }}
                      >
                        You need to absolutely Readme before going into the website/
                      </button>
                    </div>
                    {expandedDirs['root_readme'] && (
                      <div className="gopher-subtree" style={{ paddingLeft: '4px' }}>
                        <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0' }}>
                          <span style={{ color: '#666' }}>├── 📄 </span>
                          <button className="gopher-link" onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/readme')} style={{ fontSize: '13px', marginLeft: '6px' }}>
                            [TXT] View README Document
                          </button>
                        </div>
                        <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'flex-start', margin: '2px 0', fontSize: '12px', color: '#555' }}>
                          <span style={{ color: '#666' }}>└── 📝 </span>
                          <span style={{ marginLeft: '6px' }}>[TXT] Context: An explanation of UI/UX choices, late 90s aesthetic, and thesis appendices.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Item 1: App */}
                  <div className="gopher-item-container" style={{ margin: '4px 0' }}>
                    <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center' }}>
                      <span 
                        className="gopher-collapse-toggle" 
                        onClick={(e) => toggleDir('root_app', e)}
                        style={{ cursor: 'pointer', fontWeight: 'bold', color: 'blue', marginRight: '6px', userSelect: 'none' }}
                      >
                        {expandedDirs['root_app'] ? '[-]' : '[+]'}
                      </span>
                      <span className="gopher-icon" style={{ marginRight: '6px' }}>📁</span>
                      <button 
                        className="gopher-link"
                        onClick={() => setScreenState('app')}
                        style={{ fontWeight: 'bold' }}
                      >
                        Auditing Laboratory (Interactive Data Visualizer)
                      </button>
                    </div>
                    {expandedDirs['root_app'] && (
                      <div className="gopher-subtree" style={{ paddingLeft: '4px' }}>
                        <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center', margin: '2px 0' }}>
                          <span style={{ color: '#666' }}>├── ⚙️ </span>
                          <button className="gopher-link" onClick={() => setScreenState('app')} style={{ fontSize: '13px', marginLeft: '6px' }}>
                            [EXE] Run Auditing Lab Player
                          </button>
                        </div>
                        <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'flex-start', margin: '2px 0', fontSize: '12px', color: '#555' }}>
                          <span style={{ color: '#666' }}>└── 📄 </span>
                          <span style={{ marginLeft: '6px' }}>[TXT] Lab Description: Playback control panel, data transform viewer, and failure taxonomy.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Item 2: Thesis */}
                  <div className="gopher-item-container" style={{ margin: '8px 0' }}>
                    <div className="gopher-item-row" style={{ display: 'flex', alignItems: 'center' }}>
                      <span 
                        className="gopher-collapse-toggle" 
                        onClick={(e) => toggleDir('root_thesis', e)}
                        style={{ cursor: 'pointer', fontWeight: 'bold', color: 'blue', marginRight: '6px', userSelect: 'none' }}
                      >
                        {expandedDirs['root_thesis'] ? '[-]' : '[+]'}
                      </span>
                      <span className="gopher-icon" style={{ marginRight: '6px' }}>📁</span>
                      <button 
                        className="gopher-link"
                        onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                        style={{ fontWeight: 'bold' }}
                      >
                        Thesis Appendix Directory/
                      </button>
                    </div>
                    {expandedDirs['root_thesis'] && (
                      <div className="gopher-subtree" style={{ paddingLeft: '4px' }}>
                        {renderThesisChapters('│   ')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Thesis Sub-Directory */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis' && (
                <div className="gopher-list">
                  {/* Back to root option */}
                  <div className="gopher-item-row" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                    <span className="gopher-icon" style={{ marginRight: '6px' }}>📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>
                  {renderThesisChapters('')}
                </div>
              )}

              {/* Chapter 1: Lebanon Context Subpage */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/context' && (
                <div className="gopher-document-view" style={{ maxWidth: '850px' }}>
                  <div className="gopher-item-row" style={{ marginBottom: '16px', display: 'flex', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="gopher-icon" style={{ marginRight: '6px' }}>📁</span>
                      <button 
                        className="gopher-link parent-dir"
                        onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                      >
                        .. (Up to higher level directory)
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="gopher-icon" style={{ marginRight: '6px' }}>📁</span>
                      <button 
                        className="gopher-link"
                        onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis/context/evolution')}
                        style={{ fontWeight: 'bold' }}
                      >
                        Historical and Legislative Evolution of the Gazette/
                      </button>
                    </div>
                  </div>
                  <LebanonOverview />
                </div>
              )}

              {/* Chapter 1 Subfolder: Historical & Legislative Evolution of the Gazette */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/context/evolution' && (
                <div className="gopher-document-view" style={{ maxWidth: '850px' }}>
                  <div className="gopher-item-row" style={{ marginBottom: '16px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis/context')}
                    >
                      .. (Up to Chapter 1 directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">Historical &amp; Legislative Evolution of the Gazette</h2>
                  <p style={{ fontStyle: 'italic', marginBottom: '16px', fontSize: '13px', color: '#444' }}>
                    A chronological breakdown of every law, decree, and significant change regarding the Official Gazette.
                  </p>

                  <div className="outset-panel" style={{ 
                    padding: '24px', 
                    background: '#f8f9fa', 
                    border: '2px solid #555', 
                    boxShadow: 'inset 2px 2px 0 #fff, 3px 3px 0 rgba(0,0,0,0.15)',
                    lineHeight: '1.6', 
                    fontFamily: '"Courier New", Courier, monospace', 
                    fontSize: '14.5px', 
                    color: '#000' 
                  }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '2px dashed #777', paddingBottom: '8px', marginBottom: '16px', color: 'var(--win-blue)' }}>
                      === CHRONOLOGICAL LEGISLATIVE TIMELINE ===
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      <div>
                        <strong style={{ color: 'var(--win-blue)', fontSize: '15px', textTransform: 'uppercase', display: 'block', borderBottom: '1px solid #ddd', paddingBottom: '2px', marginBottom: '6px' }}>19th Century Publications</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <strong>• 1864 (or 1867):</strong> The first official newspaper, the "Lebanon Official Gazette," was published in four pages in Arabic and French during the Mutasarrifate period under Mutasarrif Daoud Pasha.
                          </div>
                          <div>
                            <strong>• 1888:</strong> The official "Beirut Province Gazette" was issued in Arabic and Turkish by the city's governor, Ali Pasha, to publish the news and orders of the Ottoman authorities.
                          </div>
                          <div>
                            <strong>• 1891:</strong> The newspaper "Lebanon" was adopted by Wassa Pasha to publish Mutasarrifate government news, making it a semi-official publication.
                          </div>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: 'var(--win-blue)', fontSize: '15px', textTransform: 'uppercase', display: 'block', borderBottom: '1px solid #ddd', paddingBottom: '2px', marginBottom: '6px' }}>French Mandate &amp; The Lebanese Republic</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <strong>• 1921:</strong> The "Official Gazette of Greater Lebanon" was launched in Arabic and French following General Gouraud's 1920 proclamation creating Greater Lebanon.
                          </div>
                          <div>
                            <strong>• 1926:</strong> Following the adoption of the constitution and Lebanon's transformation into a republic, the publication's name was officially changed to the "Official Gazette of the Lebanese Republic".
                          </div>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: 'var(--win-blue)', fontSize: '15px', textTransform: 'uppercase', display: 'block', borderBottom: '1px solid #ddd', paddingBottom: '2px', marginBottom: '6px' }}>Regulation and Pricing Decrees</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <strong>• December 28, 1959 (Decree No. 2870):</strong> Issued during Fouad Chehab's presidency, this decree defined the functions of the Official Gazette. Specifically, Paragraph (d) of Article 7 authorized the Directorate General of the Prime Minister's Office to manage the Gazette, publish its texts, and handle printing, distribution, and archiving.
                          </div>
                          <div>
                            <strong>• 1975:</strong> A structural change occurred when the Official Gazette was transformed into a department strictly under the Prime Minister's Office.
                          </div>
                          <div>
                            <strong>• October 14, 1997 (Decree No. 1147):</strong> Article 2 of this decree governed the pricing of the Gazette, officially setting the annual subscription fee for the printed issues at 240,000 Lebanese pounds within Lebanon.
                          </div>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: 'var(--win-blue)', fontSize: '15px', textTransform: 'uppercase', display: 'block', borderBottom: '1px solid #ddd', paddingBottom: '2px', marginBottom: '6px' }}>The Digital Transition</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <strong>• 2004 (France):</strong> The French official gazette began publishing online for free.
                          </div>
                          <div>
                            <strong>• 2005 (Lebanon):</strong> The Prime Minister's Office website began publishing the Official Gazette. By the end of the year, all issues were made available online for free.
                          </div>
                          <div>
                            <strong>• 2015 / January 1, 2016 (France):</strong> The French government passed a law authorizing the complete elimination of their print version, making the French official gazette exclusively electronic and entirely free starting January 1, 2016.
                          </div>
                          <div>
                            <strong>• February 23, 2018 (Decree No. 2420):</strong> This decree officially ended free electronic publishing in Lebanon. The first article stipulated that the subscription fee for the electronic Official Gazette was set at 550,000 Lebanese pounds. As a result, the free section of the website was removed and replaced with a paywall requiring a prepaid card for access.
                          </div>
                        </div>
                      </div>

                      <div>
                        <strong style={{ color: 'var(--win-blue)', fontSize: '15px', textTransform: 'uppercase', display: 'block', borderBottom: '1px solid #ddd', paddingBottom: '2px', marginBottom: '6px' }}>General Laws Mentioned</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <strong>• Right to Access Information Law (Undated):</strong> The text cites the first paragraph of Article 18 of this law, which explicitly states that <em>"access to administrative documents is free of charge at their location, unless physical preservation of the document prevents it"</em>. The author uses this law to argue against the paid electronic subscription model.
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Special Exhibit: Arabic Linguistic Shifts & Diglossia Translation Case Study */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/translation' && (
                <div className="gopher-document-view" style={{ maxWidth: '850px' }}>
                  <div className="gopher-item-row" style={{ marginBottom: '16px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">Special Exhibit: Arabic Linguistic Shifts & Diglossia</h2>
                  <p style={{ fontStyle: 'italic', marginBottom: '16px', fontSize: '14px', color: '#444' }}>
                    A comparative case study exploring morphological and stylistic translation shifts in modern civic legal archiving.
                  </p>

                  <div className="gopher-text-content" style={{ padding: '16px', background: '#f5f5f0', border: '1px solid #aaa', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #777', paddingBottom: '4px', marginBottom: '12px', color: 'black' }}>
                      📋 Project Mission Statement (English baseline)
                    </h3>
                    <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#111', fontWeight: 'bold', fontStyle: 'italic', background: '#fff', padding: '10px', borderLeft: '4px solid var(--win-blue)' }}>
                      "Rebuilding the Lebanese Official Gazette to guarantee transparency, preserve national memory, and make the law accessible to every citizen."
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    {/* Variant 1: Lebanese Dialect */}
                    <div style={{ background: '#f9f9f9', border: '1px solid #ccc', padding: '14px', borderRadius: '4px' }}>
                      <h4 style={{ color: 'var(--win-blue)', fontWeight: 'bold', fontSize: '13px', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        1. Lebanese Arabic (Spoken / Ammiya Dialect)
                      </h4>
                      <p style={{ fontSize: '18px', color: '#000', margin: '0 0 8px 0', direction: 'rtl', fontFamily: 'serif', fontWeight: 'bold', lineHeight: '1.6' }}>
                        "عم نرجع نعمّر الجريدة الرسمية اللبنانية لنضمن الشفافية، ونحفظ الذاكرة الوطنية، ونخلّي القانون بمتناول كل مواطن."
                      </p>
                      <p style={{ fontSize: '11px', color: '#555', margin: '0 0 10px 0', fontStyle: 'italic' }}>
                        <strong>Pronunciation hint:</strong> ‘Am nirja’ n’ammir el-jaride el-rasmiye el-lebnaniye lanidman el-shafafiye, w-nihfaz el-zakira el-wataniye, w-nkhalle el-qanoun bi-mtenawil kill mwatin.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ece9d8', border: '1px solid #7f9db9', padding: '6px', width: 'fit-content', boxShadow: 'inset 1px 1px 0 #fff' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#000' }}>🔊 Dialect Audio:</span>
                        <audio src="/voice/Lebanese.mp3" controls style={{ height: '26px', width: '220px' }} />
                      </div>
                    </div>

                    {/* Variant 2: MSA */}
                    <div style={{ background: '#f9f9f9', border: '1px solid #ccc', padding: '14px', borderRadius: '4px' }}>
                      <h4 style={{ color: 'var(--win-blue)', fontWeight: 'bold', fontSize: '13px', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        2. Modern Standard Arabic (MSA / Fusha)
                      </h4>
                      <p style={{ fontSize: '18px', color: '#000', margin: '0 0 8px 0', direction: 'rtl', fontFamily: 'serif', fontWeight: 'bold', lineHeight: '1.6' }}>
                        "إعادة بناء الجريدة الرسمية اللبنانية لضمان الشفافية، وحفظ الذاكرة الوطنية، وإتاحة القانون لكل مواطن."
                      </p>
                      <p style={{ fontSize: '11px', color: '#555', margin: '0 0 10px 0' }}>
                        <strong>Note:</strong> Standard language used in state laws, administrative decrees, and gazette archives.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ece9d8', border: '1px solid #7f9db9', padding: '6px', width: 'fit-content', boxShadow: 'inset 1px 1px 0 #fff' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#000' }}>🔊 MSA Audio:</span>
                        <audio src="/voice/MSA.mp3" controls style={{ height: '26px', width: '220px' }} />
                      </div>
                    </div>

                    {/* Variant 3: Quranic / Classical Arabic */}
                    <div style={{ background: '#f9f9f9', border: '1px solid #ccc', padding: '14px', borderRadius: '4px' }}>
                      <h4 style={{ color: 'var(--win-blue)', fontWeight: 'bold', fontSize: '13px', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        3. Quranic / Classical Arabic Style (Fusha al-Turath)
                      </h4>
                      <p style={{ fontSize: '20px', color: '#000', margin: '0 0 8px 0', direction: 'rtl', fontFamily: 'serif', fontWeight: 'bold', lineHeight: '1.8' }}>
                        "إِحْيَاءُ الصَّحِيفَةِ الرَّسْمِيَّةِ اللُّبْنَانِيَّةِ إِقَامَةً لِلشَّفَافِيَّةِ، وَحِفْظاً لِذَاكِرَةِ الوَطَنِ، وَتَيْسِيراً لِبُلُوغِ المَعْرِفَةِ بِالقَانُونِ لِكُلِّ ذِي حَقٍّ."
                      </p>
                      <p style={{ fontSize: '11px', color: '#65a30d', margin: '0 0 10px 0', fontStyle: 'italic', background: '#f0fdf4', padding: '8px', borderLeft: '3px solid #84cc16' }}>
                        <strong>Stylistic analysis:</strong> While the exact concept of a state legal gazette is modern, this version uses elevated Classical (Fusha al-Turath) grammar structure, balance (saj'), and vocabulary reminiscent of high-eloquence scriptural or classical prose.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ece9d8', border: '1px solid #7f9db9', padding: '6px', width: 'fit-content', boxShadow: 'inset 1px 1px 0 #fff' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#000' }}>🔊 Classical Audio:</span>
                        <audio src="/voice/Quranic.mp3" controls style={{ height: '26px', width: '220px' }} />
                      </div>
                    </div>
                  </div>

                  <div className="gopher-citations-section">
                    <h3>📚 Related Bibliographical Context</h3>
                    <p style={{ fontSize: '12px', margin: '0 0 8px 0' }}>
                      This translation shift demonstrates the challenge of indexing legal documents. In Chapter 1, we audit how these differences affect search retrieval.
                    </p>
                    <ul>
                      {thesisDb.bibliography.filter(b => b.anchor === 'sec-lebanon').map((b, idx) => (
                        <li key={idx}>{b.citation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Special Exhibit 2: Gource Repository Evolution Subpage */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/gource' && (
                <div className="gopher-document-view" style={{ maxWidth: '850px' }}>
                  <div className="gopher-item-row" style={{ marginBottom: '16px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">Special Exhibit 2: Repository Network Evolution (Gource)</h2>
                  <p style={{ fontStyle: 'italic', marginBottom: '16px', fontSize: '14px', color: '#444' }}>
                    Visualizing Git repository development as a dynamic force-directed tree where directories are branches, files are leaves, and developers (actants) perform modifications over time.
                  </p>

                  {/* Flashing Retro Alert Banner */}
                  <div className="retro-flash-ad">
                    ⚠️ ATTENTION! THIS VIDEO WOULD HAVE BEEN WAY LONGER AND COOLER HAD I NOT MISTAKENLY LET MY AI CODING ASSISTANT DELETE MY .GIT HISTORY FILE SO MUCH FOR CRITERION 1 💀 ⚠️
                  </div>

                  {/* Real Rendered Evolution Video */}
                  <div style={{ background: '#0a0a0f', padding: '10px', border: '2px inset #555', borderRadius: '4px', textAlign: 'center' }}>
                    <video 
                      src="/la_gazette_evolution.mp4" 
                      controls 
                      autoPlay 
                      loop 
                      style={{ width: '100%', maxWidth: '640px', border: '1px solid #3b82f6', display: 'block', margin: '0 auto', background: '#020205' }}
                    />
                    <p style={{ color: '#888', fontSize: '11px', marginTop: '8px', fontFamily: 'monospace' }}>
                      la_gazette_evolution.mp4 (Rendered locally using Gource and FFmpeg at 3.5s/day)
                    </p>
                  </div>

                  {/* How to run locally instructions */}
                  <div className="gopher-text-content" style={{ marginTop: '20px', padding: '16px', background: '#f5f5f0', border: '1px solid #aaa' }}>
                    <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #777', paddingBottom: '4px', marginBottom: '10px', color: 'black' }}>
                      🛠️ Running Gource on the La Gazette Repository
                    </h3>
                    <p style={{ fontSize: '12.5px', lineHeight: '1.4', color: '#333' }}>
                      Gource is installed on your machine! A helper script has been created in your project folder to easily run Gource against your external <strong>La Gazette</strong> repository located at <code>/Users/louaimroueh/Desktop/La Gazette</code>.
                    </p>
                    <div style={{ marginTop: '10px', background: '#1e1e1e', color: '#00ff00', padding: '10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px', lineHeight: '1.5' }}>
                      # Option A: Run via the pre-configured script in the workspace root<br />
                      <span style={{ color: '#aaa' }}>$</span> ./run_gource.sh<br /><br />
                      # Option B: Run the command manually in your terminal<br />
                      <span style={{ color: '#aaa' }}>$</span> gource "../La Gazette" --seconds-per-day 1.5 --auto-skip-seconds 0.5 --camera-mode track --background-colour 0a0a0a --font-size 16 --title "La Gazette Ingestion Inquest" --key<br /><br />
                      # Option C: Render the repository evolution directly to an MP4 video file<br />
                      <span style={{ color: '#aaa' }}>$</span> gource "../La Gazette" --seconds-per-day 1 --auto-skip-seconds 1 --stop-at-end --output-ppm-stream - | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset fast -pix_fmt yuv420p -crf 18 la_gazette_evolution.mp4
                    </div>
                  </div>
                </div>
              )}

              {/* Chapter 2: Visual Methodology Criteria Pillars Subpage */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/criteria' && (
                <div className="gopher-document-view">
                  <div className="gopher-item-row" style={{ marginBottom: '16px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">Methodology: The Four Auditing Criteria</h2>
                  <p style={{ fontStyle: 'italic', marginBottom: '16px', fontSize: '13px', color: '#444' }}>
                    The algorithmic audit is built on four core criteria evaluating AI agency, market dependency, and civic equity. Click on any pillar to inspect its definition and empirical findings.
                  </p>

                  <div className="outset-panel" style={{ 
                    padding: '12px', 
                    background: '#ffffd0', 
                    border: '1px dashed #555', 
                    fontFamily: '"Courier New", Courier, monospace', 
                    fontSize: '12.5px', 
                    lineHeight: '1.5',
                    color: '#000',
                    marginBottom: '16px' 
                  }}>
                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', color: 'var(--win-blue)', textTransform: 'uppercase' }}>
                      📋 Methodological Frame: The Oscillating Method
                    </span>
                    <strong>Broadly</strong>, the oscillating method is an <strong>autoethnographic, practice-based approach</strong> grounded in Donald Schön’s epistemology of the "reflective practitioner," designed to capture the lived, material experience of building civic infrastructure with AI from the inside.
                    <br /><br />
                    <strong>Narrowly</strong>, it functions as a diagnostic tool that leverages your dual identity by requiring you to <strong>constantly shift back and forth between two distinct personas: the applied "vibe-coder"</strong> who executes technical tasks to keep the build moving, <strong>and the "critical researcher"</strong> who pauses to document friction and interrogate what those technical failures reveal about algorithmic biases, structural dependencies, and corporate monopolies.
                    <br /><br />
                    By deliberately treating this split identity as an analytical instrument rather than a conflict of interest, the method captures the exact moments when your technical ambitions hit structural or material ceilings, effectively turning your subjective coding frustrations into rigorous, objective data.
                  </div>

                  {/* Greek Pillar Chamber */}
                  <div className="pillar-chamber">
                    {thesisDb.criteria.map((crit, idx) => (
                      <div 
                        key={crit.id} 
                        className={`greek-pillar ${activePillarIndex === idx ? 'active' : ''}`}
                        onClick={() => setActivePillarIndex(idx)}
                      >
                        <div className="pillar-capital">PILLAR {crit.number}</div>
                        <div className="pillar-shaft">
                          <span className="pillar-title-vertical">{crit.pillarText}</span>
                        </div>
                        <div className="pillar-base">CRIT {crit.number}</div>
                      </div>
                    ))}
                  </div>

                  {/* Outset Panel displaying active Criterion details */}
                  <div className="outset-panel" style={{ padding: '12px', background: 'var(--win-light-gray)', border: '2px solid var(--win-dark-gray)' }}>
                    <h3 style={{ color: 'var(--win-blue)', fontWeight: 'bold', fontSize: '14px', borderBottom: '1px solid #777', paddingBottom: '4px', marginBottom: '8px' }}>
                      Pillar {thesisDb.criteria[activePillarIndex].number}: {thesisDb.criteria[activePillarIndex].title}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'black', marginBottom: '10px', lineHeight: '1.4' }}>
                      <strong>Theoretical Definition:</strong><br />
                      {thesisDb.criteria[activePillarIndex].definition}
                    </p>
                    <p style={{ fontSize: '12px', color: '#27272a', lineHeight: '1.4', background: '#e4e4e7', padding: '8px', borderLeft: '3px solid #71717a', marginBottom: activePillarIndex === 0 ? '12px' : '0px' }}>
                      <strong>Empirical Findings:</strong><br />
                      {thesisDb.criteria[activePillarIndex].empirical}
                    </p>
                  </div>

                  {activePillarIndex === 0 && (
                    <div className="outset-panel" style={{ marginTop: '12px', padding: '12px', background: '#f6f6f6', border: '2px solid var(--win-dark-gray)' }}>
                      <h4 style={{ color: 'var(--win-blue)', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #999', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', fontFamily: '"Courier New", monospace' }}>
                        🏛️ Empirical Instantiations & Friction Logs (Pillar 1 Auditing Map)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>1. The Search Architecture Mismatch (The Silent Crash)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> March 21, 2026, at 12:21 (Background crash traced to February 16, 2026, at 21:45:28)
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment Files:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToCascadeStep('e2f11cb5-18ce-49ec-a31f-bc04b88c777d', 0)}
                            >
                              Investigating Search Data Mismatch.md
                            </button>
                            {' '} &amp; {' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToCascadeStep('36d823b9-69c1-471c-b768-5647760014e8', 806)}
                            >
                              Debugging Search Integration.md (Step 806)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            The backend crashed silently trying to query a non-existent `similarity` column, masking the failure with a "200 OK" status returning an empty array. This demonstrates how opaque systems perform normalcy while failing silently, hiding malfunctions until forced investigation.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>2. The Five-Minute Backend Hang (Performance-Layer Opacity)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> February 17, 2026, at 14:50 (AI diagnosis at 14:52)
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToCascadeStep('36d823b9-69c1-471c-b768-5647760014e8', 1190)}
                            >
                              Debugging Search Integration.md (Step 1190)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            The system synchronously pulled 50,000+ records from Supabase without throwing any error or warning, causing extreme timeouts. This is "quiet misdirection," where performance degradation masks failure and hides under normal execution.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>3. The Forced Interruption ("Don't Code Anything, Just Think")</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> February 19, 2026, at 10:01
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToCascadeStep('c87b4c56-ddcd-4e9c-a528-955f37b0131b', 59)}
                            >
                              Getting La Gazette Running.md (Step 59)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            The AI repeatedly struggled with semantic search accuracy, defaulting to rapid unreflective iteration. The developer forcefully halted it: <em>"don'tcode anything just think and answer"</em>, proving accountability must be actively imposed by limiting agentic operational power.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>4. Regional AI Sovereignty (The GCC Models Geopolitical Risk)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> N/A (Theoretical Framework, Section 6.3)
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            Shifting to regional hegemonies' models (ALLaM/Falcon-H1) for Arabic processing trades Western corporate dependencies for regional state dependencies, introducing compromised oversight and digital surveillance risks.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePillarIndex === 1 && (
                    <div className="outset-panel" style={{ marginTop: '12px', padding: '12px', background: '#f6f6f6', border: '2px solid var(--win-dark-gray)' }}>
                      <h4 style={{ color: 'var(--win-blue)', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #999', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', fontFamily: '"Courier New", monospace' }}>
                        🗣️ Empirical Instantiations & Friction Logs (Pillar 2 Auditing Map)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>1. The OCR Pipeline and Arabic Ligatures (Linguistic Opacity)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> February 6, 2026, at 10:56:33
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToChatStep(25)}
                            >
                              Gemini Chat Logs.pdf (Step 25)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            Standard open-source OCR tools often fail on connected Arabic ligatures and dense legal layouts, imposing a "linguistic tax" on non-Western contexts. Lack of native Arabic fluency leaves legal terminology validation structurally opaque.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>2. The Cohere Decision (Outsourcing Linguistic Sovereignty)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> February 6, 2026, at 11:20:57
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToChatStep(30)}
                            >
                              Gemini Chat Logs.pdf (Step 30)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            Standard English-trained models fail to capture root-based Arabic legal register morphology. The project was forced to outsource its linguistic sovereignty to Cohere Multilingual v3, tying linguistic survival to a Western corporate provider.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>3. "The Arabic Problem" and Normalization Requirements</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> February 6, 2026, at 11:20:57
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToChatStep(30)}
                            >
                              Gemini Chat Logs.pdf (Step 30 - "The Arabic Problem")
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            The AI flagged "The Arabic Problem", detailing that the backend pipeline must execute manual normalization (e.g. unifying Alef, stripping Tashkeel) before embedding. This highlights the custom engineering overhead needed to make Western tools process Arabic.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>4. The Cohere 402 Billing Cascade (Semantic Degradation)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> March 21, 2026, at 15:52:52
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToCascadeStep('e2f11cb5-18ce-49ec-a31f-bc04b88c777d', 66)}
                            >
                              Investigating Search Data Mismatch.md (Step 66)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            When Cohere billing failed, the search silently fell back to keyword matching. In Arabic, keyword match behaves significantly worse due to root morphologic variants, demonstrating that Global South linguistic sovereignty depends directly on corporate billing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePillarIndex === 2 && (
                    <div className="outset-panel" style={{ marginTop: '12px', padding: '12px', background: '#f6f6f6', border: '2px solid var(--win-dark-gray)' }}>
                      <h4 style={{ color: 'var(--win-blue)', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #999', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', fontFamily: '"Courier New", monospace' }}>
                        🔌 Empirical Instantiations & Friction Logs (Pillar 3 Auditing Map)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>1. Predatory Complexity and the Extraction of Free Labor (The Google Drive API Entanglement)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> February 2, 2026, at 12:42:45
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToChatStep(12)}
                            >
                              Gemini Chat Logs.pdf (Step 12)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            The AI suggested a complex Google Drive API setup (OAuth, `credentials.json`) rather than simple free scripting. This represents "predatory complexity," where free API credits act as acquisition costs to extract developer labor and structure regional datasets for Western LLM refinement.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>2. The Cohere Decision (Structural Outsourcing)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> February 6, 2026, at 11:20:57
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToChatStep(30)}
                            >
                              Gemini Chat Logs.pdf (Step 30)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            Achieving Arabic legal search capabilities required embedding tools with complex root morphology. The project had to outsource its core NLP process to Cohere's commercial infrastructure, structurally merging Arabic linguistic sovereignty with corporate dependency.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>3. The Supabase $25 Payment (Dependency by Accumulation)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> Mid-build (Theoretical sections 5.4 / 6.3)
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Invoices Exhibit:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis/invoices')}
                            >
                              Special Exhibit 4: Accumulative Audit Invoices &amp; Financial Costs
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            Processing the 15GB archive generated tens of thousands of database rows, passively exceeding free limits and demanding a paid $25 Supabase subscription. This illustrates "dependency by accumulation," proving public data scale drives linear commercial costs.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>4. The Metered Developer (IDE Rate Limits)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> Spanning the build (Section 5.5)
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            Development was routinely paused for hours when agentic programming prompts hit provider rate limits, proving that software "democratization" remains strictly metered by corporate bandwidth, imposing material limits on developer agency.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>5. The Cohere 402 Billing Wall (The Commercial Failure Cascade)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> March 21, 2026, at 15:52:52
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToCascadeStep('e2f11cb5-18ce-49ec-a31f-bc04b88c777d', 64)}
                            >
                              Investigating Search Data Mismatch.md (Step 64)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            The search tool failed completely due to consecutive "402 Payment Required" errors when a Cohere API billing threshold was crossed. The semantic search layer was suspended entirely by a commercial bug, demonstrating complete dependence on a commercial relationship.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>6. The GitHub Size Limit and the Clean Push (The Completeness Impossibility)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> April 2, 2026, at 10:58:45
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToCascadeStep('e5432998-2d3d-4e37-b6cc-9ef1855d4194', 67)}
                            >
                              Pushing Specific Folders To GitHub.md (Step 67)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            GitHub's free hosting limits threw 500 errors and rejected the 13GB repository, forcing a clean push that deleted the 15GB of raw OCR data. To deploy without enterprise capital, the repository had to be left architecturally incomplete.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePillarIndex === 3 && (
                    <div className="outset-panel" style={{ marginTop: '12px', padding: '12px', background: '#f6f6f6', border: '2px solid var(--win-dark-gray)' }}>
                      <h4 style={{ color: 'var(--win-blue)', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #999', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase', fontFamily: '"Courier New", monospace' }}>
                        ⚖️ Empirical Instantiations & Friction Logs (Pillar 4 Auditing Map)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>1. The Active Contradiction (Technical Friction as Policy)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> January 16, 2026, at 18:02 (Proxy chain from January 8)
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToChatStep(2)}
                            >
                              Gemini Chat Logs.pdf (Step 2)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            A 2021 law mandates free digital access to official state documents, yet the portal gates access behind physical activation cards (with no international shipping) and returns "incorrect" errors. This technical friction actively enforces data hoarding, exposing a massive divide between legal transparency decrees and reality.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>2. The Double Enclosure (The Data Extraction Layer)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> February 2, 2026, at 14:17
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToChatStep(20)}
                            >
                              Gemini Chat Logs.pdf (Step 20)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            The state chose to serve the Gazette as unsearchable individual PNG images via a custom JavaScript viewer to prevent bulk copying. Extracting this required writing a "blind loop" script incorporating User-Agent spoofing and randomized jitter delays, proving that prying public law open demands heavy computational labor.
                          </p>
                        </div>

                        <div style={{ fontSize: '12px', color: '#111', lineHeight: '1.4', borderTop: '1px dotted #888', paddingTop: '8px' }}>
                          <strong style={{ color: '#000', fontSize: '12.5px' }}>3. The Completeness Impossibility (The Clean Push)</strong>
                          <div style={{ fontSize: '11px', color: '#555', margin: '2px 0 4px 0' }}>
                            <strong>Date/Time:</strong> April 2, 2026, at 10:58:45
                          </div>
                          <div style={{ fontSize: '11.5px', margin: '4px 0' }}>
                            <strong>Audited Moment File:</strong>{' '}
                            <button 
                              className="gopher-link" 
                              style={{ display: 'inline', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', color: 'var(--win-blue)', cursor: 'pointer', font: 'inherit', fontWeight: 'bold' }}
                              onClick={() => jumpToCascadeStep('e5432998-2d3d-4e37-b6cc-9ef1855d4194', 67)}
                            >
                              Pushing Specific Folders To GitHub.md (Step 67)
                            </button>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                            The state's data hoarding was reproduced in the tool's own deployment: the raw OCR output had to be completely deleted from Git to bypass free-tier size limits. This illustrates the hard ceiling of mitigating information asymmetry, as civic utilities remain architecturally incomplete without institutional capital.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chapter 3: Interactive Manuscript & Bibliography Subpage */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/manuscript' && (
                <div className="gopher-document-view" style={{ maxWidth: '950px' }}>
                  <div className="gopher-item-row" style={{ marginBottom: '12px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">Thesis Manuscript & Bibliography Navigator</h2>
                  <p style={{ fontStyle: 'italic', marginBottom: '12px', fontSize: '11px', color: '#555' }}>
                    * Dual-Pane View: Scroll the text on the left to highlight the matching references on the right, or click a reference to scroll to its citation.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: '12px', height: '480px', overflow: 'hidden' }}>
                    {/* Left Pane: Scrollable Manuscript */}
                    <div 
                      className="manuscript-scroll-pane" 
                      onScroll={handleManuscriptScroll}
                      style={{ 
                        background: '#fcfcf9', 
                        border: '2px inset var(--win-dark-gray)', 
                        padding: '12px', 
                        overflowY: 'auto', 
                        height: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {thesisDb.manuscript.map((sec) => (
                        <section 
                          key={sec.id} 
                          id={sec.id} 
                          className={`manuscript-section ${highlightedSectionId === sec.id ? 'flash-highlight' : ''}`}
                          style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px dotted #ccc' }}
                        >
                          <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--win-blue)', marginBottom: '6px' }}>
                            {sec.title}
                          </h3>
                          <p style={{ fontSize: '12.5px', lineHeight: '1.5', color: '#111' }}>
                            {sec.text}
                          </p>
                          <div style={{ marginTop: '6px', fontSize: '11px', color: '#666' }}>
                            <strong>Citations: </strong>
                            {sec.citations.map(cKey => {
                              const bib = thesisDb.bibliography.find(b => b.key === cKey);
                              return (
                                <span 
                                  key={cKey} 
                                  onClick={() => handleBibliographyClick(sec.id, cKey)}
                                  style={{ color: '#0000ee', textDecoration: 'underline', cursor: 'pointer', marginRight: '8px' }}
                                >
                                  {bib ? bib.citation.split('(')[0].trim() : cKey}
                                </span>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>

                    {/* Right Pane: Bibliography List */}
                    <div 
                      style={{ 
                        background: 'var(--win-light-gray)', 
                        border: '2px inset var(--win-dark-gray)', 
                        padding: '10px', 
                        overflowY: 'auto',
                        height: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <h4 style={{ fontWeight: 'bold', fontSize: '11px', color: 'black', borderBottom: '1px solid #888', paddingBottom: '4px', marginBottom: '8px', textTransform: 'uppercase' }}>
                        📚 Bibliography & Works Cited
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {thesisDb.bibliography.map((bib) => {
                          const isHighlighted = activeBibKey === bib.key;
                          return (
                            <div 
                              key={bib.key}
                              onClick={() => handleBibliographyClick(bib.anchor, bib.key)}
                              style={{ 
                                fontSize: '11px', 
                                padding: '6px', 
                                border: '1px solid',
                                borderColor: isHighlighted ? '#eab308' : 'transparent',
                                background: isHighlighted ? '#fef08a' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                color: 'black',
                                borderRadius: '2px',
                                boxShadow: isHighlighted ? '1px 1px 2px rgba(0,0,0,0.1)' : 'none'
                              }}
                            >
                              {bib.citation}
                              <div style={{ fontSize: '9px', color: '#777', marginTop: '2px', textDecoration: 'underline' }}>
                                Click to scroll to context
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chapter 4: Theoretical Framework Materials & Downloads Subpage */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/materials' && (
                <div className="gopher-document-view">
                  <div className="gopher-item-row" style={{ marginBottom: '16px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">Theoretical Framework Materials & Downloads</h2>
                  <p style={{ fontStyle: 'italic', marginBottom: '16px', fontSize: '13px', color: '#444' }}>
                    Click on any of the academic preprints, data manifests, or core log files below to trigger a local file download via Netscape's saving interface.
                  </p>

                  <div className="gopher-materials-section" style={{ background: '#dcdcdc', border: '1px solid #999' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '10px' }}>
                      📂 Available Archive Files
                    </h3>
                    <div className="gopher-materials-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>📕</span>
                        <div className="material-info">
                          <span className="material-name">Thesis_Booklet_Complete_Draft.pdf</span>
                          <span className="material-size">(1.8 MB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('Thesis_Booklet_Complete_Draft.pdf', '1.8 MB')}>
                          Download File
                        </button>
                      </div>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>📕</span>
                        <div className="material-info">
                          <span className="material-name">Chapter_2_ANT_Theoretical_Framework.pdf</span>
                          <span className="material-size">(512 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('Chapter_2_ANT_Theoretical_Framework.pdf', '512 KB')}>
                          Download File
                        </button>
                      </div>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>📄</span>
                        <div className="material-info">
                          <span className="material-name">scraper_convs_db.json</span>
                          <span className="material-size">(65 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('scraper_convs_db.json', '65 KB')}>
                          Download File
                        </button>
                      </div>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>📄</span>
                        <div className="material-info">
                          <span className="material-name">official_gazette_2025_manifest.json</span>
                          <span className="material-size">(34 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('official_gazette_2025_manifest.json', '34 KB')}>
                          Download File
                        </button>
                      </div>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>📄</span>
                        <div className="material-info">
                          <span className="material-name">cohere_402_billing_crash.log</span>
                          <span className="material-size">(112 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('cohere_402_billing_crash.log', '112 KB')}>
                          Download File
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Exhibit 3: The Way of Code - The Vibe Coder Subpage */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/vibecoder' && (
                <div className="gopher-document-view" style={{ maxWidth: '1100px' }}>
                  <div className="gopher-item-row" style={{ marginBottom: '16px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">THE WAY OF CODE</h2>
                  <p style={{ fontStyle: 'italic', marginBottom: '4px', fontSize: '14px', color: '#111', fontWeight: 'bold' }}>
                    The Timeless Art of Vibe Coding
                  </p>
                  <p style={{ fontStyle: 'italic', marginBottom: '16px', fontSize: '12px', color: '#555' }}>
                    Based on Lao Tzu. Adapted by Rick Rubin
                  </p>

                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Left Column: The Way of Code Text */}
                    <div style={{ flex: '1.2', minWidth: '320px' }}>
                      <div className="gopher-text-content" style={{ padding: '20px', background: '#fcfcf8', border: '1px dashed #777', overflowY: 'auto', maxHeight: '550px', lineHeight: '1.6', fontFamily: '"Courier New", Courier, monospace', fontSize: '13px', color: '#111' }}>
                        <p style={{ fontStyle: 'italic', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
                          Each encounter I’ve had with Lao Tzu has pointed me to something new. Almost as if the book changes with every reading. I first picked up Stephen Mitchell’s translation 40 years ago at the Bodhi Tree bookstore in Los Angeles and my life has never been quite the same.<br />
                          — Rick Rubin
                        </p>

                        {(vibecoderData as { chapter: number; text: string }[]).map((ch) => (
                          <div key={ch.chapter} style={{ marginBottom: '30px' }}>
                            <h4 style={{ margin: '0 0 8px 0', borderBottom: '1px dotted #888', paddingBottom: '2px', fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                              Chapter {ch.chapter}
                            </h4>
                            <div style={{ whiteSpace: 'pre-line' }}>
                              {ch.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Karpathy Tweet Card */}
                    <div style={{ flex: '0.8', minWidth: '320px' }}>
                      <div style={{
                        padding: '16px',
                        background: '#fcfcf8',
                        border: '2px solid #555',
                        borderRadius: '4px',
                        boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
                        fontFamily: 'monospace',
                        color: '#000',
                        fontSize: '12px',
                        lineHeight: '1.4'
                      }}>
                        {/* Tweet Header */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <img 
                            src="/karpathy_profile.jpg" 
                            alt="Andrej Karpathy" 
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              border: '1px solid #777',
                              marginRight: '10px',
                              objectFit: 'cover'
                            }} 
                          />
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                              Andrej Karpathy
                              <span style={{ marginLeft: '4px', color: '#1d9bf0', fontSize: '12px' }} title="Verified">✓</span>
                            </div>
                            <div style={{ color: '#555', fontSize: '11px' }}>@karpathy</div>
                          </div>
                        </div>

                        {/* Tweet Body */}
                        <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#111' }}>
                          There's a new kind of coding I call "vibe coding", where you fully give in to the vibes, embrace exponentials, and forget that the code even exists. It's possible because the LLMs (e.g. Cursor Composer w Sonnet) are getting too good. Also I just talk to Composer with SuperWhisper so I barely even touch the keyboard. I ask for the dumbest things like "decrease the padding on the sidebar by half" because I'm too lazy to find it. I "Accept All" always, I don't read the diffs anymore. When I get error messages I just copy paste them in with no comment, usually that fixes it. The code grows beyond my usual comprehension, I'd have to really read through it for a while. Sometimes the LLMs can't fix a bug so I just work around it or ask for random changes until it goes away. It's not too bad for throwaway weekend projects, but still quite amusing. I'm building a project or webapp, but it's not really coding - I just see stuff, say stuff, run stuff, and copy paste stuff, and it mostly works.
                        </p>

                        {/* Tweet Footer Info */}
                        <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '8px 0', margin: '12px 0', color: '#555', fontSize: '10px' }}>
                          12:17 AM · Feb 3, 2025 · <strong style={{ color: '#000' }}>7.2M</strong> Views
                        </div>

                        {/* Tweet Action Mock Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 10px', color: '#555', fontSize: '10px' }}>
                          <span>💬 1.8K</span>
                          <span>🔁 9.4K</span>
                          <span>❤️ 42K</span>
                          <span>🔖 3.1K</span>
                        </div>
                      </div>

                      {/* Rick Rubin Photo Card */}
                      <div style={{
                        marginTop: '12px',
                        padding: '10px 10px 14px 10px',
                        background: '#fff',
                        border: '1px solid #777',
                        boxShadow: '2px 2px 0 rgba(0,0,0,0.15)',
                        textAlign: 'center'
                      }}>
                        <img 
                          src="/rick_rubin_vibe.png" 
                          alt="Rick Rubin vibe coding" 
                          style={{
                            width: '100%',
                            height: 'auto',
                            border: '1px solid #999',
                            display: 'block',
                            marginBottom: '8px'
                          }} 
                        />
                        <span style={{ fontSize: '10px', fontStyle: 'italic', color: '#555', fontFamily: 'monospace' }}>
                          Fig 3.1: Rick Rubin demonstrating "Vibe Coding" — fully giving in to the vibes.
                        </span>
                      </div>

                      {/* Descriptive Caption */}
                      <div style={{ marginTop: '12px', background: '#f5f5f0', border: '1px solid #777', padding: '10px', fontSize: '11px', lineHeight: '1.4' }}>
                        <span style={{ fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '4px', color: 'var(--win-blue)' }}>
                          📝 Historical Footnote:
                        </span>
                        This February 2025 tweet by Andrej Karpathy (former Director of AI at Tesla and OpenAI co-founder) formally coined the term <strong>"Vibe Coding"</strong>, describing the paradigm shift from mechanical syntax drafting to prompt-driven high-level direction.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* README: You need to absolutely Readme before going into the website */}
              {gopherPath === 'gopher://gazette.audit.lab/readme' && (
                <div className="gopher-document-view" style={{ maxWidth: '900px' }}>
                  <div className="gopher-item-row" style={{ marginBottom: '16px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">SYSTEM README & AUDITING STATEMENT</h2>
                  
                  <div className="gopher-text-content" style={{ 
                    padding: '24px', 
                    background: '#f8f9fa', 
                    border: '2px solid #555', 
                    boxShadow: 'inset 2px 2px 0 #fff, 3px 3px 0 rgba(0,0,0,0.15)',
                    lineHeight: '1.6', 
                    fontFamily: '"Courier New", Courier, monospace', 
                    fontSize: '14px', 
                    color: '#000' 
                  }}>
                    <div style={{ borderBottom: '2px dashed #777', paddingBottom: '12px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
                      === ATTENTION OPERATOR: SYSTEM OVERVIEW ===
                    </div>

                    <p style={{ marginBottom: '16px' }}>
                      <strong>1. EMULATION OF FRUSTRATION (UI/UX DESIGN PHILOSOPHY)</strong><br />
                      The user interface (UI) and user experience (UX) of this web application deliberately emulate the intense frustration and systemic clunkiness experienced when attempting to navigate the official website of the <em>Official Lebanese Gazette</em>. It is designed to feel simultaneously antiquated, clunky, yet functionally intuitive to those willing to audit it.
                    </p>

                    <p style={{ marginBottom: '16px' }}>
                      <strong>2. PORTAL HISTORIOGRAPHY (THE LATE 90S / EARLY 2000S AESTHETIC)</strong><br />
                      The visual aesthetic, monospaced layout, netscape dialog boxes, and BIOS load sequences are reminiscent of the late 1990s and early 2000s web portals. This design choice is a direct critique and nod to the stagnant, unchanged nature of the Lebanese government's digital archive portals—maintaining a static time capsule of public administration tools that refuse to evolve.
                    </p>

                    <p style={{ marginBottom: '16px' }}>
                      <strong>3. THESIS CONTEXT & APPENDICES</strong><br />
                      This web application serves as the interactive <strong>appendices</strong> of my academic thesis auditing project. It compiles developer logs, translation case studies, git commits, WhatsApp dialogue history, and financial receipts to provide a complete, transparent, and multi-dimensional audit of the Official Gazette parsing and indexing architecture.
                    </p>

                    <div style={{ borderTop: '2px dashed #777', paddingTop: '12px', marginTop: '20px', marginBottom: '12px' }}>
                      <strong style={{ display: 'block', marginBottom: '10px', textTransform: 'uppercase', color: 'var(--win-blue)', fontFamily: 'monospace' }}>
                        4. Index of Auditing Appendix Materials &amp; Logs
                      </strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                        <div style={{ background: '#fff', padding: '8px', borderLeft: '3px solid var(--win-blue)' }}>
                          <strong style={{ color: '#000' }}>📄 Gemini Chat Logs.pdf</strong>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#333' }}>
                            <strong>Overview:</strong> This file contains the complete transcripts of your interactions with the Gemini AI assistant from January to February 2026. It covers the entire conceptual and strategic lifecycle of the project, including early troubleshooting for the activation card portal, strategies for scraping the Lebanese Official Gazette, deciding on the technical stack, selecting AI models, and brainstorming UI/UX architectures.
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                            <strong>Critical Point:</strong> This document captures the Naming Conversation (February 11), where both technical and humanities discourses failed to provide a vocabulary for "a citizen doing what the government should have done". It also documents the architecture decisions, specifically the recommendation to use Cohere Multilingual V3 and the decision to implement a Universal Citizen Agency design rather than a tiered access model.
                          </p>
                        </div>

                        <div style={{ background: '#fff', padding: '8px', borderLeft: '3px solid var(--win-blue)' }}>
                          <strong style={{ color: '#000' }}>📄 Investigating Search Data Mismatch.md</strong>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#333' }}>
                            <strong>Overview:</strong> An IDE cascade log from March 21, 2026, triggered when you noticed that search queries copied directly from the Gazette decrees were failing to return results.
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                            <strong>Critical Point:</strong> This file is the primary evidence for the Search Architecture Mismatch and the Cohere 402 Billing Wall. It reveals that the system's data architecture and search models had quietly diverged, querying a non-existent similarity column and returning empty arrays while appearing completely functional. It directly demonstrates Criterion 1 (Opacity and Accountability): the agentic system failed silently while performing normalcy, making the malfunction structurally undetectable until a deep investigation was forced.
                          </p>
                        </div>

                        <div style={{ background: '#fff', padding: '8px', borderLeft: '3px solid var(--win-blue)' }}>
                          <strong style={{ color: '#000' }}>📄 Getting La Gazette Running.md</strong>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#333' }}>
                            <strong>Overview:</strong> This log spans February 18–19, 2026, and documents the process of getting the application running locally and debugging search accuracy issues.
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                            <strong>Critical Point:</strong> It contains the "Don't code anything just think and answer" command issued on February 19 at 10:01 am. This is the clearest empirical demonstration of the oscillating method, where the researcher persona actively interrupted the AI's momentum to assert meaningful human oversight, proving that agentic systems default toward continuous execution rather than reflection.
                          </p>
                        </div>

                        <div style={{ background: '#fff', padding: '8px', borderLeft: '3px solid var(--win-blue)' }}>
                          <strong style={{ color: '#000' }}>📄 Debugging Search Integration.md</strong>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#333' }}>
                            <strong>Overview:</strong> A massive IDE log documenting over 5,800 steps taken between February 2 and February 17, 2026, to debug the semantic and keyword search integration, database constraints, and API routing.
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                            <strong>Critical Point:</strong> This file captures the "Five-Minute Backend Hang" on February 17, where the backend synchronously attempted to pull up to 100,000 records, causing a 5-minute latency without throwing any errors to the interface. It serves as a prime example of performance-layer opacity, where the system breaks in a way that looks like extreme slowness rather than a categorical failure.
                          </p>
                        </div>

                        <div style={{ background: '#fff', padding: '8px', borderLeft: '3px solid var(--win-blue)' }}>
                          <strong style={{ color: '#000' }}>📄 Pushing Gazette To Repository.md &amp; Pushing Specific Folders To GitHub.md</strong>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#333' }}>
                            <strong>Overview:</strong> These logs from April 2, 2026, record the deployment phase of the project, specifically the attempts to push the finished application to a public GitHub repository.
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                            <strong>Critical Point:</strong> These files document the "Clean Push" and the Completeness Impossibility. They show that the repository swelled to 13GB (including 4.5GB of Git history), causing 500 internal server errors and timeouts during transfer. To deploy the tool, you were forced to wipe the history and update the .gitignore to explicitly exclude the 15GB of OCR data. This means the tool built to search the Gazette does not actually contain the Gazette, highlighting the material and infrastructural ceilings of building civic tech without institutional resources.
                          </p>
                        </div>

                        <div style={{ background: '#fff', padding: '8px', borderLeft: '3px solid var(--win-blue)' }}>
                          <strong style={{ color: '#000' }}>📄 Creating Lebanon Data Visualization Page.md</strong>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#333' }}>
                            <strong>Overview:</strong> An IDE log from late February 2026 documenting the creation of the "Lebanon in Numbers" data visualization page, transforming socioeconomic, legal, digital, and ecological data into interactive charts (Recharts) and dashboards.
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                            <strong>Critical Point:</strong> It operationalizes the Universal Citizen Agency decision by building out the high-end intelligence interfaces (treemaps, radar charts, multi-layered maps) and making them accessible to all users, cementing the assumption that "citizens are capable analysts".
                          </p>
                        </div>

                        <div style={{ background: '#fff', padding: '8px', borderLeft: '3px solid var(--win-blue)' }}>
                          <strong style={{ color: '#000' }}>📄 Launching Local Host_2.md &amp; Running Local Gazette.md</strong>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#333' }}>
                            <strong>Overview:</strong> Logs from late February to mid-March 2026 detailing the day-to-day commands, environment troubleshooting, and task tracking required to launch the Next.js frontend and FastAPI backend locally.
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                            <strong>Critical Point:</strong> These logs reveal the continuous, granular frictions of agentic development, such as recurring database connection issues (Supabase URL failures), port conflicts, and hydration errors. They demonstrate the constant negotiation and labor required to maintain the local infrastructure supporting the build.
                          </p>
                        </div>

                        <div style={{ background: '#fff', padding: '8px', borderLeft: '3px solid var(--win-blue)' }}>
                          <strong style={{ color: '#000' }}>📄 cool now let_s focus on the year 2019 only with this range 8.md</strong>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#333' }}>
                            <strong>Overview:</strong> A very brief log from February 4, 2026, documenting a targeted scraping task for the year 2019, narrowing focus to issue IDs 8837 to 8763.
                          </p>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                            <strong>Critical Point:</strong> It showcases the manual range-setting workaround needed to bypass the Official Gazette portal's anti-scraping architecture. By explicitly giving the AI a targeted ID range, you grounded the scraper's blind loop in known parameters to systematically extract the hidden PNG files.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '2px dashed #777', paddingTop: '12px', marginTop: '20px', textAlign: 'center', fontSize: '11px', color: '#555' }}>
                      Gazette Audit Terminal v1.0.0 · All Rights Reserved
                    </div>
                  </div>
                </div>
              )}

              {/* Special Exhibit 4: Accumulative Audit Invoices & Financial Costs Subpage */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/invoices' && (
                <div className="gopher-document-view">
                  <div className="gopher-item-row" style={{ marginBottom: '16px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">Accumulative Audit Invoices & Financial Costs</h2>
                  <p style={{ fontStyle: 'italic', marginBottom: '16px', fontSize: '13px', color: '#444' }}>
                    This section catalogues the financial invoices and usage receipts accumulated during the processing, hosting, and API-based language model auditing phases of the Lebanese Official Gazette.
                  </p>

                  <div className="gopher-materials-section" style={{ background: '#dcdcdc', border: '1px solid #999', padding: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '10px' }}>
                      📂 Invoices & Receipts Index
                    </h3>
                    <div className="gopher-materials-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>🖼️</span>
                        <div className="material-info">
                          <span className="material-name">Activation Card Receipt.jpeg</span>
                          <span className="material-size">(156 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('Activation Card Receipt.jpeg', '156 KB')}>
                          Download File
                        </button>
                      </div>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>📕</span>
                        <div className="material-info">
                          <span className="material-name">Cohere Invoice.pdf</span>
                          <span className="material-size">(36 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('Cohere Invoice.pdf', '36 KB')}>
                          Download File
                        </button>
                      </div>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>🖼️</span>
                        <div className="material-info">
                          <span className="material-name">Cohere Usage.png</span>
                          <span className="material-size">(183 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('Cohere Usage.png', '183 KB')}>
                          Download File
                        </button>
                      </div>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>📕</span>
                        <div className="material-info">
                          <span className="material-name">Google Cloud Console.pdf</span>
                          <span className="material-size">(37 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('Google Cloud Console.pdf', '37 KB')}>
                          Download File
                        </button>
                      </div>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>📕</span>
                        <div className="material-info">
                          <span className="material-name">Supabase Receipt 1.pdf</span>
                          <span className="material-size">(115 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('Supabase Receipt 1.pdf', '115 KB')}>
                          Download File
                        </button>
                      </div>
                      <div className="gopher-material-item">
                        <span style={{ fontSize: '20px' }}>📕</span>
                        <div className="material-info">
                          <span className="material-name">Supabase Recipet 2 .pdf</span>
                          <span className="material-size">(109 KB)</span>
                        </div>
                        <button className="netscape-download-btn" onClick={() => triggerDownloadDialog('Supabase Recipet 2 .pdf', '109 KB')}>
                          Download File
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Exhibit 5: 2025 Official Gazette Sample Issue Reader */}
              {gopherPath === 'gopher://gazette.audit.lab/thesis/sample_issue' && (
                <div className="gopher-document-view" style={{ maxWidth: '1000px' }}>
                  <div className="gopher-item-row" style={{ marginBottom: '16px' }}>
                    <span className="gopher-icon">📁</span>
                    <button 
                      className="gopher-link parent-dir"
                      onClick={() => handleGopherNavigate('gopher://gazette.audit.lab/thesis')}
                    >
                      .. (Up to higher level directory)
                    </button>
                  </div>

                  <h2 className="gopher-doc-title">2025 Official Gazette Sample Issue Reader</h2>
                  <p style={{ fontStyle: 'italic', marginBottom: '16px', fontSize: '13px', color: '#444' }}>
                    Interactive document explorer for Gazette Issue #9234 (late 2025). Use the toolbar below to navigate page-by-page, adjust zoom, and download individual pages.
                  </p>

                  {/* Reader Toolbar (Windows 95 Outset style) */}
                  <div className="outset-panel" style={{ 
                    padding: '8px', 
                    background: 'var(--win-gray)', 
                    border: '2px solid var(--win-dark-gray)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                    fontFamily: 'monospace'
                  }}>
                    {/* Navigation controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        className="win-button" 
                        disabled={samplePage <= 1}
                        onClick={() => setSamplePage(prev => Math.max(1, prev - 1))}
                        style={{ minWidth: '70px', height: '24px', fontSize: '11px' }}
                      >
                        [◀ Prev]
                      </button>
                      <span style={{ fontSize: '12px', color: 'black', fontWeight: 'bold' }}>
                        Page {samplePage} of 280
                      </span>
                      <button 
                        className="win-button" 
                        disabled={samplePage >= 280}
                        onClick={() => setSamplePage(prev => Math.min(280, prev + 1))}
                        style={{ minWidth: '70px', height: '24px', fontSize: '11px' }}
                      >
                        [Next ▶]
                      </button>
                    </div>

                    {/* Zoom controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        className="win-button" 
                        disabled={sampleZoom <= 0.5}
                        onClick={() => setSampleZoom(prev => Math.max(0.5, prev - 0.25))}
                        style={{ width: '32px', height: '24px', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '12px', color: 'black', fontWeight: 'bold', width: '50px', textAlign: 'center' }}>
                        {Math.round(sampleZoom * 100)}%
                      </span>
                      <button 
                        className="win-button" 
                        disabled={sampleZoom >= 2.5}
                        onClick={() => setSampleZoom(prev => Math.min(2.5, prev + 0.25))}
                        style={{ width: '32px', height: '24px', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        +
                      </button>
                      <button 
                        className="win-button" 
                        onClick={() => setSampleZoom(1.0)}
                        style={{ height: '24px', fontSize: '11px' }}
                      >
                        100%
                      </button>
                    </div>

                    {/* Download control */}
                    <div>
                      <a 
                        href={`./gazette_sample/page-${String(samplePage).padStart(3, '0')}.jpg`} 
                        download={`Gazette_Issue_9234_Page_${String(samplePage).padStart(3, '0')}.jpg`}
                        style={{ textDecoration: 'none' }}
                      >
                        <button className="win-button" style={{ height: '24px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'green', fontWeight: 'bold' }}>
                          💾 Download Page
                        </button>
                      </a>
                    </div>
                  </div>

                  {/* Document Display Canvas */}
                  <div style={{ 
                    background: '#555', 
                    border: '2px solid black', 
                    padding: '20px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    overflow: 'auto',
                    maxHeight: '650px',
                    minHeight: '400px',
                    position: 'relative',
                    boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{
                      transform: `scale(${sampleZoom})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out',
                      display: 'inline-block'
                    }}>
                      <img 
                        src={`./gazette_sample/page-${String(samplePage).padStart(3, '0')}.jpg`} 
                        alt={`Gazette Page ${samplePage}`}
                        style={{ 
                          maxWidth: '100%', 
                          height: 'auto', 
                          border: '2px solid white',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                          display: 'block'
                        }} 
                      />
                    </div>
                  </div>
                </div>
              )}



            </div>
          )}
        </div>

        {/* Netscape footer / status bar */}
        <div className="netscape-status-bar">
          <span className="status-text">
            {gopherLoading ? "Connect: Contacting gazette.audit.lab..." : "Document: Done."}
          </span>
          <div className="status-progress-inset">
            <div className="status-progress-indicator" style={{ width: gopherLoading ? '60%' : '100%' }}></div>
          </div>
        </div>

        {/* Netscape Download Dialog Modal */}
        {downloadFileState && (
          <div className="netscape-dialog-overlay">
            <div className="netscape-dialog-box outset-panel" style={{ width: '320px', padding: '2px' }}>
              <div className="win-title-bar">
                <span>Saving File...</span>
                <button className="win-sys-btn" onClick={() => setDownloadFileState(null)}>X</button>
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '32px' }}>💾</span>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--win-black)' }}>Downloading from gazette.audit.lab</p>
                    <p style={{ fontSize: '11px', color: 'var(--win-blue)', fontWeight: 'bold' }}>{downloadFileState.name}</p>
                    <p style={{ fontSize: '10px', color: '#555' }}>Size: {downloadFileState.size}</p>
                  </div>
                </div>

                <div style={{ background: '#eee', border: '1px solid #777', padding: '6px', fontSize: '10px', marginBottom: '8px', fontFamily: 'monospace', color: 'black' }}>
                  {downloadFileState.progress < 100 ? (
                    <div>
                      <span>Saving to local disk directory...</span>
                      <div className="netscape-dialog-progress" style={{ marginTop: '4px' }}>
                        <div 
                          className="netscape-dialog-progress-fill" 
                          style={{ width: `${downloadFileState.progress}%` }}
                        ></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span>{downloadFileState.progress}% complete</span>
                        <span>Transfer rate: 28.8 Kbps</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'green', fontWeight: 'bold' }}>
                      ✓ Download complete! Saved to local directory.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  {downloadFileState.progress === 100 && (
                    <button 
                      className="win-button" 
                      onClick={() => {
                        const invoiceFiles = [
                          'Activation Card Receipt.jpeg',
                          'Cohere Invoice.pdf',
                          'Cohere Usage.png',
                          'Google Cloud Console.pdf',
                          'Supabase Receipt 1.pdf',
                          'Supabase Recipet 2 .pdf'
                        ];
                        if (invoiceFiles.includes(downloadFileState.name)) {
                          window.open(`./invoices/${downloadFileState.name}`, '_blank');
                        } else {
                          alert(`Simulated open: Displaying raw content of ${downloadFileState.name}`);
                        }
                      }}
                      style={{ width: '80px' }}
                    >
                      Open
                    </button>
                  )}
                  <button 
                    className="win-button" 
                    onClick={() => setDownloadFileState(null)} 
                    style={{ width: '80px' }}
                  >
                    {downloadFileState.progress < 100 ? 'Cancel' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 90s Title Bar */}
      <div className="win-title-bar">
        <div className="title-text-group" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span>💾</span>
          <span>GAZETTE_AUDIT_MONITOR.EXE - Auditing Laboratory</span>
          <button 
            className="win-sys-btn portal-back-btn" 
            onClick={() => setScreenState('gopher')}
            style={{ 
              marginLeft: '12px', 
              fontSize: '10px', 
              padding: '1px 6px', 
              background: 'var(--win-gray)', 
              color: 'var(--win-black)',
              border: '1px solid #777',
              cursor: 'pointer'
            }}
          >
            ◀ BACK TO PORTAL PORT
          </button>
        </div>
        <div className="win-window-controls">
          <button className="win-sys-btn" onClick={() => setShowAboutDialog(true)}>?</button>
          <button className="win-sys-btn">_</button>
          <button className="win-sys-btn">■</button>
          <button className="win-sys-btn" style={{ marginLeft: '2px' }} onClick={() => { if(confirm("Close laboratory session?")) window.close(); }}>X</button>
        </div>
      </div>

      {/* 90s Dropdown Menu Bar */}
      <div className="win-menu-bar">
        <button className="menu-item-btn" onClick={() => setSelectedCascadeId(cascades[0]?.id)}>
          <span>F</span>ile
        </button>
        <button className="menu-item-btn" onClick={() => alert("Clipboard options: Press Ctrl+C on timeline logs.")}>
          <span>E</span>dit
        </button>
        <button className="menu-item-btn" onClick={() => alert(`Active View Mode: 90s Terminal Environment\nPort Listening: 5173`)}>
          <span>V</span>iew
        </button>
        <button className="menu-item-btn" onClick={() => setActiveTab('failures')}>
          <span>A</span>uditing
        </button>
        <button className="menu-item-btn" onClick={() => setShowSearchDialog(true)} style={{ color: '#1d4ed8', fontWeight: 'bold' }}>
          🔍 <span>S</span>earch
        </button>
        <button className="menu-item-btn" onClick={() => setShowAboutDialog(true)}>
          <span>H</span>elp
        </button>
        <button className="menu-item-btn" onClick={() => setShowManifestoDialog(true)}>
          <span>M</span>anifesto
        </button>
      </div>

      {/* Retro OS Toolbar (Tab navigations) */}
      <div className="win-toolbar">
        <button 
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          📁 Step Playback Player
        </button>
        <button 
          className={`tab-btn ${activeTab === 'scraper' ? 'active' : ''}`}
          onClick={() => setActiveTab('scraper')}
        >
          📊 Scraper Evolution
        </button>
        <button 
          className={`tab-btn ${activeTab === 'gemini_chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('gemini_chat')}
        >
          💬 Gemini Conversations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'failures' ? 'active' : ''}`}
          onClick={() => setActiveTab('failures')}
        >
          🚨 Failure Taxonomy (Bug Graveyard)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'autonomy' ? 'active' : ''}`}
          onClick={() => setActiveTab('autonomy')}
        >
          🎚️ Autonomy Slider
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipeline')}
        >
          📖 Extraction Pipeline
        </button>
        <button 
          className={`tab-btn ${activeTab === 'whatsapp_chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('whatsapp_chats')}
        >
          💬 WhatsApp Audits
        </button>
      </div>

      {/* System Status Line Metrics */}
      <section className="metrics-bar">
        <div className="status-panel">
          <span>Status:</span>
          <strong>{isPlaying ? "RUNNING" : "READY"}</strong>
        </div>
        <div className="status-panel">
          <span>Cascades:</span>
          <strong>{cascades.length}</strong>
        </div>
        <div className="status-panel">
          <span>Total Log Steps:</span>
          <strong>{totalSteps}</strong>
        </div>
        <div className="status-panel">
          <span>Failed Steps:</span>
          <strong style={{ color: 'var(--accent-red)' }}>{totalFailures}</strong>
        </div>
        <div className="status-panel">
          <span>Human Interventions:</span>
          <strong style={{ color: 'var(--win-blue)' }}>{totalRescues}</strong>
        </div>
      </section>

      {/* Main OS Screen Panel */}
      {activeTab === 'timeline' && (
        <main className="dashboard-content">
          {/* Left Sidebar: Cascade Session Files */}
          <aside className="cascade-sidebar">
            <h2 className="section-title">Cascade Files</h2>
            <div className="cascade-list">
              {cascades.map(c => (
                <button
                  key={c.id}
                  className={`cascade-card ${c.id === selectedCascadeId ? 'active' : ''}`}
                  onClick={() => setSelectedCascadeId(c.id)}
                >
                  <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📄 {getOriginalFileName(c.name)}
                  </span>
                  <div className="cascade-meta">
                    <span className={`badge level-${c.autonomy_level}`}>
                      Level {c.autonomy_level}
                    </span>
                    <span>{c.steps_count} steps</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Center Column: Chronological Playback */}
          <section className="timeline-center">
            {/* Cassette / Tape Deck Player control Bar */}
            <div className="playback-bar">
              <div className="playback-controls">
                <button className="control-btn" onClick={() => setPlaybackIndex(0)} title="Reset to Step 1">
                  |&lt;
                </button>
                <button className="control-btn" onClick={stepBackward} disabled={playbackIndex === 0} title="Step Back">
                  &lt;&lt;
                </button>
                <button className="control-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                  {isPlaying ? "PAUSE" : "PLAY"}
                </button>
                <button 
                  className="control-btn" 
                  onClick={stepForward} 
                  disabled={playbackIndex === activeCascade.steps.length - 1}
                  title="Step Forward"
                >
                  &gt;&gt;
                </button>
                <button className="control-btn" onClick={() => setPlaybackIndex(activeCascade.steps.length - 1)} title="Jump to End">
                  &gt;|
                </button>
              </div>

              {/* Analog Look Slider */}
              <div className="playback-slider-container">
                <input 
                  type="range"
                  className="playback-slider"
                  min={0}
                  max={activeCascade.steps.length - 1}
                  value={playbackIndex}
                  onChange={(e) => {
                    setPlaybackIndex(parseInt(e.target.value));
                    setIsPlaying(false);
                  }}
                />
                <span className="step-counter">
                  STEP: {String(playbackIndex + 1).padStart(3, '0')} / {String(activeCascade.steps.length).padStart(3, '0')}
                </span>
              </div>

              <div className="speed-selector">
                <span style={{ fontSize: '11px' }}>Tape Speed:</span>
                <select 
                  className="speed-select"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                >
                  <option value="0.5">0.5 ips</option>
                  <option value="1">1.0 ips</option>
                  <option value="2">2.0 ips</option>
                  <option value="5">5.0 ips</option>
                </select>
              </div>
            </div>

            {/* Inset Screen containing raw scroll steps */}
            <div className="timeline-scroll">
              {activeCascade.steps.slice(0, playbackIndex + 1).map((step, idx) => {
                const isStepFailed = step.exit_code && step.exit_code !== 0;
                const isFailureStep = step.failure !== null;
                const isRescueStep = step.is_rescue === true;

                // Render based on step role to clearly divide prompts, tools/actions, and answers
                if (step.role === 'user') {
                  return (
                    <div key={idx} className="timeline-step-row">
                      <div className={`step-bubble ${idx === playbackIndex ? 'active' : ''}`} style={{
                        background: '#fffbeb', // Soft yellow Post-it
                        borderLeft: '4px solid #f59e0b',
                        padding: '10px 12px',
                        borderRadius: '2px',
                        boxShadow: '1px 1px 0px var(--win-white)'
                      }}>
                        <div className="step-header" style={{ borderBottom: '1px dashed #f59e0b', color: '#78350f', paddingBottom: '4px', marginBottom: '6px' }}>
                          <div className="step-meta-left">
                            <span style={{ fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              👤 USER PROMPT
                            </span>
                          </div>
                          <span className="step-timestamp" style={{ color: '#b45309' }}>{step.timestamp}</span>
                        </div>
                        <div className="step-body">
                          <p style={{ whiteSpace: 'pre-wrap', color: '#78350f', fontSize: '12px', fontFamily: 'var(--font-mono)', lineHeight: '1.4' }}>
                            {step.content}
                          </p>
                        </div>
                      </div>

                      {/* Margin note */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {step.margin_note && (
                          <div className="methodology-margin-note">
                            <div className="note-header">📖 ARCHITECT METHODOLOGY NOTE</div>
                            <p>{step.margin_note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (step.role === 'tool') {
                  return (
                    <div key={idx} className="timeline-step-row">
                      <div className={`step-bubble ${idx === playbackIndex ? 'active' : ''}`} style={{
                        background: '#f8fafc', // Light slate gray for tools
                        borderLeft: '4px solid #64748b',
                        padding: '10px 12px',
                        borderRadius: '2px',
                        boxShadow: '1px 1px 0px var(--win-white)'
                      }}>
                        <div className="step-header" style={{ borderBottom: '1px dashed #cbd5e1', color: '#334155', paddingBottom: '4px', marginBottom: '6px' }}>
                          <div className="step-meta-left">
                            <span style={{ fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              🔧 AGENT ACTION: Tool Execute ({step.name})
                            </span>
                          </div>
                          <span className="step-timestamp" style={{ color: '#64748b' }}>{step.timestamp}</span>
                        </div>
                        <div className="step-body">
                          <p style={{ fontSize: '11px', color: '#475569', marginBottom: '4px' }}>
                            Action Type: <strong>{step.name}</strong>
                          </p>
                          {step.command && (
                            <pre className="tool-command" style={{ background: '#0f172a', color: '#38bdf8', padding: '6px', borderRadius: '4px', overflowX: 'auto', fontSize: '10px', margin: '4px 0' }}>{step.command}</pre>
                          )}
                          {step.file_path && (
                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              File Target: <code>{step.file_path}</code>
                            </p>
                          )}
                          
                          <div className="tool-output-block" style={{ marginTop: '8px' }}>
                            <span 
                              className="tool-output-summary"
                              onClick={() => toggleOutput(step.index)}
                              style={{ cursor: 'pointer', color: '#0284c7', fontSize: '11px', textDecoration: 'underline' }}
                            >
                              {expandedOutputs[step.index] ? '[-] Hide Console Stream' : '[+] View Console Stream'}
                              {isStepFailed && <span style={{ color: 'var(--accent-red)' }}> (exit_code {step.exit_code})</span>}
                            </span>
                            
                            {expandedOutputs[step.index] && (
                              <pre className="tool-output-content" style={{ marginTop: '6px', background: '#090d16', color: '#22c55e', padding: '8px', overflow: 'auto', maxHeight: '200px', fontSize: '10px' }}>
                                {step.content || '(No response log details)'}
                              </pre>
                            )}
                          </div>

                          {/* Injected Failures */}
                          {isFailureStep && step.failure && (
                            <div className="failure-indicator-box" style={{ marginTop: '10px' }}>
                              <div className="failure-details">
                                <h4>🚨 SYSTEM CRASH: {step.failure.category}</h4>
                                <p><strong>[ERROR_{step.failure.code}] {step.failure.title}</strong></p>
                                <p style={{ marginTop: '4px', color: 'var(--accent-red)' }}>{step.failure.message}</p>
                                <p style={{ fontSize: '10px', color: 'var(--win-dark-gray)', marginTop: '2px' }}>
                                  Core file: {step.failure.file}
                                </p>
                              </div>
                            </div>
                          )}

                          {isRescueStep && (
                            <div className="failure-indicator-box warning" style={{ marginTop: '10px' }}>
                              <div className="failure-details">
                                <h4>⚠️ ARCHITECT PILOT RESCUE</h4>
                                <p>Circular resolution error detected. Human operator injected surgical correction payload.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Methodology Margin Ledger */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {step.margin_note && (
                          <div className="methodology-margin-note">
                            <div className="note-header">📖 ARCHITECT METHODOLOGY NOTE</div>
                            <p>{step.margin_note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (step.role === 'assistant') {
                  const { thinking, answer } = parseAssistantContent(step.content);
                  return (
                    <div key={idx} className="timeline-step-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      
                      {/* 1. THINKING PROCESS BLOCK (rendered separately if present) */}
                      {thinking && (
                        <div className={`step-bubble ${idx === playbackIndex ? 'active' : ''}`} style={{
                          background: '#fcfaff', // Soft purple/violet tint
                          borderLeft: '4px solid #a855f7',
                          padding: '8px 12px',
                          borderRadius: '2px',
                          boxShadow: '1px 1px 0px var(--win-white)'
                        }}>
                          <div className="step-header" style={{ borderBottom: '1px dashed #d8b4fe', color: '#6b21a8', paddingBottom: '3px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              💭 AGENT THINKING PROCESS
                            </span>
                            <span className="step-timestamp" style={{ color: '#a855f7' }}>{step.timestamp}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#581c87', fontFamily: 'var(--font-sans)', lineHeight: '1.4', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                            {thinking}
                          </div>
                        </div>
                      )}

                      {/* 2. AGENT ANSWER BLOCK */}
                      <div className={`step-bubble ${idx === playbackIndex ? 'active' : ''}`} style={{
                        background: '#f0fdf4', // Soft green tint
                        borderLeft: '4px solid #22c55e',
                        padding: '10px 12px',
                        borderRadius: '2px',
                        boxShadow: '1px 1px 0px var(--win-white)'
                      }}>
                        <div className="step-header" style={{ borderBottom: '1px dashed #bbf7d0', color: '#166534', paddingBottom: '4px', marginBottom: '6px' }}>
                          <div className="step-meta-left">
                            <span style={{ fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              🤖 AGENT RESPONSE
                            </span>
                          </div>
                          {!thinking && <span className="step-timestamp" style={{ color: '#22c55e' }}>{step.timestamp}</span>}
                        </div>
                        <div className="step-body">
                          <div className="answer-text" style={{ fontSize: '12px', lineHeight: '1.4', color: '#1f2937', whiteSpace: 'pre-wrap' }}>
                            {answer}
                          </div>

                          {/* Injected Failures */}
                          {isFailureStep && step.failure && (
                            <div className="failure-indicator-box" style={{ marginTop: '10px' }}>
                              <div className="failure-details">
                                <h4>🚨 SYSTEM CRASH: {step.failure.category}</h4>
                                <p><strong>[ERROR_{step.failure.code}] {step.failure.title}</strong></p>
                                <p style={{ marginTop: '4px', color: 'var(--accent-red)' }}>{step.failure.message}</p>
                                <p style={{ fontSize: '10px', color: 'var(--win-dark-gray)', marginTop: '2px' }}>
                                  Core file: {step.failure.file}
                                </p>
                              </div>
                            </div>
                          )}

                          {isRescueStep && (
                            <div className="failure-indicator-box warning" style={{ marginTop: '10px' }}>
                              <div className="failure-details">
                                <h4>⚠️ ARCHITECT PILOT RESCUE</h4>
                                <p>Circular resolution error detected. Human operator injected surgical correction payload.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Methodology Margin Ledger */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {step.margin_note && (
                          <div className="methodology-margin-note">
                            <div className="note-header">📖 ARCHITECT METHODOLOGY NOTE</div>
                            <p>{step.margin_note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Fallback default rendering (if any other role)
                return (
                  <div key={idx} className="timeline-step-row">
                    <div className={`step-bubble ${idx === playbackIndex ? 'active' : ''}`}>
                      <div className="step-header">
                        <div className="step-meta-left">
                          <span className={`step-avatar ${step.role as any}`}>
                            [{String(step.role).toUpperCase()}]
                          </span>
                          <span className="step-sender">{step.name}</span>
                        </div>
                        <span className="step-timestamp">{step.timestamp}</span>
                      </div>
                      <div className="step-body">
                        <p style={{ whiteSpace: 'pre-wrap' }}>{step.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Panel: Notepad task checklist */}
          <aside className="brain-sidebar">
            <div className="brain-header">
              <span>📝</span>
              <span>Notepad - task.txt</span>
            </div>
            
            <div className="brain-scroll">
              <div className="brain-section">
                <h3 className="brain-section-title">METACONTROL_CHECKLIST</h3>
                <div className="task-list">
                  {activeCascade.steps[playbackIndex]?.task_state?.map((task) => (
                    <div key={task.id} className={`task-item ${task.status}`}>
                      <span className="task-icon">
                        {task.status === 'completed' && '[X]'}
                        {task.status === 'in_progress' && '[>]'}
                        {task.status === 'pending' && '[ ]'}
                      </span>
                      <span>{task.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="brain-section">
                <h3 className="brain-section-title">AGENT_STATE_DUMP</h3>
                <div style={{ background: 'var(--win-light-gray)', padding: '6px', border: '1px solid var(--win-dark-gray)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <p>ACTIVE_BRANCH: main</p>
                  <p>WS_PATH: /La Gazette</p>
                  <p style={{ marginTop: '2px' }}>SCHEMA_PLAN: implementation_plan.md</p>
                  <p>WALKTHROUGH: walkthrough.md</p>
                </div>
              </div>
            </div>
          </aside>
        </main>
      )}

      {/* SCRAPER EVOLUTION VIEW */}
      {activeTab === 'scraper' && activeScraperConv && (
        <main className="notebook-container animate-fade-in">
          {/* Left Sidebar: Scraper Conversations Evolution */}
          <aside className="notebook-sidebar">
            <h2 className="section-title">Evolution Controls</h2>
            
            {/* Step Selection Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              <div style={{ background: 'var(--win-gray)', padding: '6px', border: '1px solid var(--win-dark-gray)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>STATE SELECTOR:</span>
                  <span style={{ color: 'var(--win-blue)' }}>STEP {scraperVersion} / {totalScraperSteps}</span>
                </div>
                <input 
                  type="range"
                  className="autonomy-range-input"
                  min={1}
                  max={totalScraperSteps}
                  step={1}
                  value={scraperVersion}
                  onChange={(e) => setScraperVersion(parseInt(e.target.value))}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button 
                    className="win-button" 
                    disabled={scraperVersion === 1}
                    onClick={() => setScraperVersion(prev => Math.max(1, prev - 1))}
                    style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                  >
                    ◀ Prev Step
                  </button>
                  <button 
                    className="win-button" 
                    disabled={scraperVersion === totalScraperSteps}
                    onClick={() => setScraperVersion(prev => Math.min(totalScraperSteps, prev + 1))}
                    style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                  >
                    Next Step ▶
                  </button>
                </div>
              </div>
            </div>

            <h2 className="section-title" style={{ marginTop: '4px' }}>Table of Contents</h2>
            {/* Scrollable list of all 20 interactions */}
            <div className="notebook-toc-list">
              {scraperConvs.map((conv) => {
                const shortPrompt = conv.prompt.length > 55 ? conv.prompt.substring(0, 55).replace(/\n/g, ' ') + '...' : conv.prompt;
                return (
                  <button
                    key={conv.index}
                    className={`notebook-toc-item ${scraperVersion === conv.index ? 'active' : ''}`}
                    onClick={() => setScraperVersion(conv.index)}
                  >
                    <div className="toc-item-header">
                      <span className="toc-item-index">Step {conv.index}</span>
                      <span className="toc-item-time">{conv.timestamp.split(' ')[1] || conv.timestamp}</span>
                    </div>
                    <div className="toc-item-prompt">{shortPrompt}</div>
                  </button>
                );
              })}
            </div>

            <h2 className="section-title" style={{ marginTop: '8px' }}>Scraper Auditing Stats</h2>
            <div style={{ padding: '6px', background: 'var(--win-light-gray)', border: '1px solid var(--win-dark-gray)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
              <p>Total Interactions: <strong>{totalScraperSteps} steps</strong></p>
              <p>Download Pool: <strong>79 PDFs (Range 9156-9236)</strong></p>
              <p>Target Year: <strong>2025 / 2026</strong></p>
              <p>Current Timestamp: <strong>{activeScraperConv.timestamp}</strong></p>
            </div>
          </aside>

          {/* Right Area: Coding Notebook Visual Sheet */}
          <div className="notebook-paper-wrapper">
            {/* Spiral binder rings simulation */}
            <div className="notebook-spiral-binder">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="spiral-ring" />
              ))}
            </div>

            {/* Notebook Lined Sheet */}
            <div className="notebook-sheet">
              {/* Force React remount of sheet content on version change to trigger CSS animation */}
              <div key={scraperVersion} className="notebook-sheet-content notebook-fade-in">
                <div className="notebook-header">
                  <div className="notebook-header-info">
                    <span className="notebook-title">📔 scraper_evolution_log.ipynb [Step {scraperVersion} of {totalScraperSteps}]</span>
                    <span className="notebook-version-badge">Timestamp: {activeScraperConv.timestamp}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--win-dark-gray)', marginTop: '4px', fontStyle: 'italic' }}>
                    Visual audit layer of the developer-agent interactive session for scraper construction.
                  </p>
                </div>

                {/* 1. Human Operator Prompt Box */}
                <div className="notebook-prompt-box">
                  <div className="prompt-header-new">
                    <span>🧑 HUMAN OPERATOR PROMPT (Step {scraperVersion})</span>
                    <span className="prompt-time-badge">{activeScraperConv.timestamp}</span>
                  </div>
                  <p className="prompt-text">{activeScraperConv.prompt}</p>
                </div>

                {/* 2. Gemini Answer Box (Opening Remarks) */}
                <div className="notebook-answer-box">
                  <div className="answer-header-new">🤖 GEMINI RESPONSE / METHODOLOGY EXPLANATION</div>
                  <div className="answer-text">
                    {activeScraperConv.opening_remarks.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx} style={{ marginBottom: '10px' }}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* 3. Generated Code (Conditional) */}
                {activeScraperConv.code_block ? (
                  <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                    <div className="code-header-new">💻 GENERATED SCRAPER SCRIPT</div>
                    <div className="notebook-code-block">
                      {highlightPython(activeScraperConv.code_block)}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', color: 'var(--win-dark-gray)', margin: '10px 0', fontSize: '11px' }}>
                    * No code output was generated in this interaction step.
                  </div>
                )}

                {/* 4. Gemini Closing Remarks (Conditional) */}
                {activeScraperConv.closing_remarks && (
                  <div className="notebook-closing-box">
                    <div className="closing-header-new">📝 GEMINI CLOSING REMARKS & GUIDELINES</div>
                    <div className="closing-text">
                      {activeScraperConv.closing_remarks.split('\n\n').map((para, pIdx) => (
                        <p key={pIdx} style={{ marginBottom: '8px' }}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* GEMINI CONVERSATIONS VIEW */}
      {activeTab === 'gemini_chat' && activeGeminiConv && (
        <main className="notebook-container animate-fade-in">
          {/* Left Sidebar: Gemini Conversations Evolution */}
          <aside className="notebook-sidebar">
            <h2 className="section-title">Evolution Controls</h2>
            
            {/* Step Selection Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
              <div style={{ background: 'var(--win-gray)', padding: '6px', border: '1px solid var(--win-dark-gray)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>STATE SELECTOR:</span>
                  <span style={{ color: 'var(--win-blue)' }}>STEP {geminiChatVersion} / {totalGeminiChatSteps}</span>
                </div>
                <input 
                  type="range"
                  className="autonomy-range-input"
                  min={1}
                  max={totalGeminiChatSteps}
                  step={1}
                  value={geminiChatVersion}
                  onChange={(e) => setGeminiChatVersion(parseInt(e.target.value))}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <button 
                    className="win-button" 
                    disabled={geminiChatVersion === 1}
                    onClick={() => setGeminiChatVersion(prev => Math.max(1, prev - 1))}
                    style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                  >
                    ◀ Prev Step
                  </button>
                  <button 
                    className="win-button" 
                    disabled={geminiChatVersion === totalGeminiChatSteps}
                    onClick={() => setGeminiChatVersion(prev => Math.min(totalGeminiChatSteps, prev + 1))}
                    style={{ flex: 1, padding: '4px', fontSize: '11px' }}
                  >
                    Next Step ▶
                  </button>
                </div>
              </div>
            </div>

            <h2 className="section-title" style={{ marginTop: '4px' }}>Table of Contents</h2>
            {/* Scrollable list of all 61 interactions */}
            <div className="notebook-toc-list">
              {geminiChatConvs.map((conv) => {
                const shortPrompt = conv.prompt.length > 55 ? conv.prompt.substring(0, 55).replace(/\n/g, ' ') + '...' : conv.prompt;
                return (
                  <button
                    key={conv.index}
                    className={`notebook-toc-item ${geminiChatVersion === conv.index ? 'active' : ''}`}
                    onClick={() => setGeminiChatVersion(conv.index)}
                  >
                    <div className="toc-item-header">
                      <span className="toc-item-index">Step {conv.index}</span>
                      <span className="toc-item-time">{conv.timestamp.split(' ')[1] || conv.timestamp}</span>
                    </div>
                    <div className="toc-item-prompt">{shortPrompt}</div>
                  </button>
                );
              })}
            </div>

            <h2 className="section-title" style={{ marginTop: '8px' }}>Auditing Stats</h2>
            <div style={{ padding: '6px', background: 'var(--win-light-gray)', border: '1px solid var(--win-dark-gray)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
              <p>Total Interactions: <strong>{totalGeminiChatSteps} steps</strong></p>
              <p>Source Archive: <strong>Gemini Chat Logs.pdf</strong></p>
              <p>Linguistic Coverage: <strong>Colloquial & Fusha</strong></p>
              <p>Current Timestamp: <strong>{activeGeminiConv.timestamp}</strong></p>
            </div>
          </aside>

          {/* Right Area: Coding Notebook Visual Sheet */}
          <div className="notebook-paper-wrapper">
            {/* Spiral binder rings simulation */}
            <div className="notebook-spiral-binder">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="spiral-ring" />
              ))}
            </div>

            {/* Notebook Lined Sheet */}
            <div className="notebook-sheet">
              {/* Force React remount of sheet content on version change to trigger CSS animation */}
              <div key={geminiChatVersion} className="notebook-sheet-content notebook-fade-in">
                <div className="notebook-header">
                  <div className="notebook-header-info">
                    <span className="notebook-title">📔 gemini_conversations_log.ipynb [Step {geminiChatVersion} of {totalGeminiChatSteps}]</span>
                    <span className="notebook-version-badge">Timestamp: {activeGeminiConv.timestamp}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--win-dark-gray)', marginTop: '4px', fontStyle: 'italic' }}>
                    Visual audit layer of the full Gemini chat history, mapping user inquiries to agent responses.
                  </p>
                </div>

                {/* 1. Human Operator Prompt Box */}
                <div className="notebook-prompt-box">
                  <div className="prompt-header-new">
                    <span>🧑 HUMAN OPERATOR PROMPT (Step {geminiChatVersion})</span>
                    <span className="prompt-time-badge">{activeGeminiConv.timestamp}</span>
                  </div>
                  <p className="prompt-text">{activeGeminiConv.prompt}</p>
                </div>

                {/* 2. Gemini Answer Box (Opening Remarks) */}
                <div className="notebook-answer-box">
                  <div className="answer-header-new">🤖 GEMINI RESPONSE / METHODOLOGY EXPLANATION</div>
                  <div className="answer-text">
                    {activeGeminiConv.opening_remarks.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx} style={{ marginBottom: '10px' }}>{para}</p>
                    ))}
                  </div>
                </div>

                {/* 3. Generated Code (Conditional) */}
                {activeGeminiConv.code_block ? (
                  <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                    <div className="code-header-new">💻 GENERATED SCRIPT / OUTPUT</div>
                    <div className="notebook-code-block">
                      {highlightPython(activeGeminiConv.code_block)}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', color: 'var(--win-dark-gray)', margin: '10px 0', fontSize: '11px' }}>
                    * No code output was generated in this interaction step.
                  </div>
                )}

                {/* 4. Gemini Closing Remarks (Conditional) */}
                {activeGeminiConv.closing_remarks && (
                  <div className="notebook-closing-box">
                    <div className="closing-header-new">📝 GEMINI CLOSING REMARKS & GUIDELINES</div>
                    <div className="closing-text">
                      {activeGeminiConv.closing_remarks.split('\n\n').map((para, pIdx) => (
                        <p key={pIdx} style={{ marginBottom: '8px' }}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* FAILURE TAXONOMY BSOD VIEW */}
      {activeTab === 'failures' && (
        <main className="failure-taxonomy-view">
          <h2>THE BUG GRAVEYARD - ERROR CODES TAXONOMY</h2>
          <p>
            A fatal error check was logged during autonomous execution. Below is the system diagnostic grid. 
            Select "JUMP_DEBUGGER" on any module panel to reload the player sequence at that crash timestamp.
          </p>

          <div className="taxonomy-grid">
            {/* OOM Card */}
            <div className="failure-card">
              <span className="failure-badge">FATAL_OOM_137</span>
              <h3>Memory Buffer Allocation Crash</h3>
              <p>
                Process terminated by OS (SIGKILL) due to heap limit overflow during OCR embedding generations.
              </p>
              <div className="failure-location">
                FILE: backend/app/services/semantic_search.py
              </div>
              <button 
                className="failure-jump-btn"
                onClick={() => jumpToFailureStep('36d823b9-69c1-471c-b768-5647760014e8', 15)}
              >
                JUMP_DEBUGGER &gt;
              </button>
            </div>

            {/* DNS Card */}
            <div className="failure-card">
              <span className="failure-badge">DNS_TIMEOUT_CRASH</span>
              <h3>Supabase Connection Handshake Failure</h3>
              <p>
                Network DNS resolution timed out on db.supabase.co. Highlights risk of external cloud vector dependencies.
              </p>
              <div className="failure-location">
                FILE: backend/app/db.py
              </div>
              <button 
                className="failure-jump-btn"
                onClick={() => jumpToFailureStep('36d823b9-69c1-471c-b768-5647760014e8', 30)}
              >
                JUMP_DEBUGGER &gt;
              </button>
            </div>

            {/* Dimension Mismatch Card */}
            <div className="failure-card">
              <span className="failure-badge">EMBED_DIM_MISMATCH</span>
              <h3>Vector Dimension Alignment Failure</h3>
              <p>
                Dimension mismatch detected: model returned 1024-dimensions but pgvector expected 768-dimensions.
              </p>
              <div className="failure-location">
                FILE: backend/app/services/semantic_search.py
              </div>
              <button 
                className="failure-jump-btn"
                onClick={() => jumpToFailureStep('36d823b9-69c1-471c-b768-5647760014e8', 45)}
              >
                JUMP_DEBUGGER &gt;
              </button>
            </div>

            {/* Case Loop Card */}
            <div className="failure-card warning">
              <span className="failure-badge">CASE_SENSITIVE_LOOP</span>
              <h3>Module Resolution Circular Dependency</h3>
              <p>
                Agent entered loop repeatedly editing components/layout/sidebar due to case mismatch circular references.
              </p>
              <div className="failure-location">
                FILE: src/app/information/page.tsx
              </div>
              <button 
                className="failure-jump-btn"
                onClick={() => jumpToFailureStep('c87b4c56-ddcd-4e9c-a528-955f37b0131b', 22)}
              >
                JUMP_DEBUGGER (RESCUE) &gt;
              </button>
            </div>
          </div>
        </main>
      )}

      {/* AUTONOMY SLIDER PROPERTIES VIEW */}
      {activeTab === 'autonomy' && (
        <main className="autonomy-panel-view">
          <div className="autonomy-slider-card">
            <div className="autonomy-header-info">
              <h2>System Properties: Autonomy Collaboration Levels</h2>
              <p>Explore the theoretical division of labour between human architecture and agent execution.</p>
            </div>

            {/* 90s slider box */}
            <div className="autonomy-slider-widget">
              <div className="autonomy-levels-labels">
                <div className={`level-label ${sliderVal === 1 ? 'active' : ''}`} onClick={() => setSliderVal(1)}>
                  <div className="level-number">1</div>
                  <span>DICTATION</span>
                </div>
                <div className={`level-label ${sliderVal === 3 ? 'active' : ''}`} onClick={() => setSliderVal(3)}>
                  <div className="level-number">3</div>
                  <span>SYNTHESIS</span>
                </div>
                <div className={`level-label ${sliderVal === 5 ? 'active' : ''}`} onClick={() => setSliderVal(5)}>
                  <div className="level-number">5</div>
                  <span>DEEP AUTONOMY</span>
                </div>
              </div>

              <div className="slider-bar-wrapper">
                <input 
                  type="range"
                  className="autonomy-range-input"
                  min={1}
                  max={5}
                  step={2}
                  value={sliderVal}
                  onChange={(e) => setSliderVal(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="autonomy-details-panel">
              {/* Left Column info */}
              <div className="level-details-info">
                <h3>{activeAutonomyConfig.title}</h3>
                <p style={{ marginTop: '4px', marginBottom: '8px', lineHeight: '1.4' }}>
                  {activeAutonomyConfig.description}
                </p>
                <h4 style={{ fontSize: '11px', color: 'var(--win-blue)', borderBottom: '1px dashed var(--win-dark-gray)', paddingBottom: '2px', marginBottom: '4px' }}>
                  KEY COLLABORATIVE PARAMETERS:
                </h4>
                <ul style={{ paddingLeft: '4px' }}>
                  {activeAutonomyConfig.metrics.map((m, idx) => (
                    <li key={idx} style={{ listStyleType: 'none', margin: '4px 0' }}>
                      <div className="bullet-dot" style={{ display: 'inline-block', marginRight: '6px' }} />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>

                <h4 style={{ fontSize: '11px', color: 'var(--win-blue)', marginTop: '12px', borderBottom: '1px dashed var(--win-dark-gray)', paddingBottom: '2px' }}>
                  CASCADES ASSOCIATED WITH Level {sliderVal}:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                  {cascades.filter(c => c.autonomy_level === sliderVal).map(c => (
                    <button 
                      key={c.id}
                      className="win-button"
                      style={{ justifyContent: 'space-between', padding: '3px 6px' }}
                      onClick={() => {
                        setSelectedCascadeId(c.id);
                        setActiveTab('timeline');
                      }}
                    >
                      <span>📄 {getOriginalFileName(c.name)}</span>
                      <span style={{ fontSize: '10px' }}>Seek Log &gt;</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Disk properties pie chart */}
              <div className="split-chart-card">
                <h4 style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>
                  CONTRIBUTION SPLIT MAP
                </h4>
                <div className="donut-chart-container">
                  <svg className="donut-chart-svg" width="120" height="120" viewBox="0 0 160 160">
                    <circle className="donut-circle-bg" cx="80" cy="80" r={circleRadius} />
                    <circle 
                      className="donut-circle-val" 
                      cx="80" 
                      cy="80" 
                      r={circleRadius} 
                      strokeDashoffset={agentOffset}
                    />
                    <circle 
                      className="donut-circle-human" 
                      cx="80" 
                      cy="80" 
                      r={circleRadius} 
                      strokeDashoffset={humanOffset}
                      strokeDasharray={`${circumference} ${circumference}`}
                      style={{
                        transform: `rotate(${(activeAutonomyConfig.c_split.agent / 100) * 360}deg)`,
                        transformOrigin: '80px 80px'
                      }}
                    />
                  </svg>
                  <div className="donut-center-text">
                    <h4 style={{ fontFamily: 'var(--font-mono)' }}>{activeAutonomyConfig.c_split.agent}%</h4>
                    <p style={{ fontSize: '8px' }}>Agent</p>
                  </div>
                </div>

                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-label-wrapper">
                      <div className="legend-color teal" />
                      <span>Agent Code Lines</span>
                    </div>
                    <span className="legend-pct">{activeAutonomyConfig.c_split.agent}%</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-label-wrapper">
                      <div className="legend-color blue" />
                      <span>Human Prompts</span>
                    </div>
                    <span className="legend-pct">{activeAutonomyConfig.c_split.human}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* MULTILINGUAL KNOWLEDGE EXTRACT PIPELINE */}
      {activeTab === 'pipeline' && (
        <main className="pipeline-view">
          <div className="pipeline-intro" style={{ marginBottom: '8px' }}>
            <h2 style={{ fontSize: '14px', color: 'var(--win-blue)' }}>Bilingual Ingestion & Extraction Directory</h2>
            <p>Inspection of structural pipelines resolving Arabic terminology into pgvector embeddings.</p>
          </div>

          <div className="pipeline-accordion">
            {/* Folder 1 */}
            <div className="pipeline-section-card">
              <div className="pipeline-header" onClick={() => togglePipelineSection(1)}>
                <div className="pipeline-title-wrapper">
                  <div className="pipeline-step-num">1</div>
                  <div className="pipeline-header-info">
                    <h3>Raw OCR Parallel Ingest Stream (batch_2025_parallel.txt)</h3>
                    <p>Multithreaded workers splitting raw PDF coordinates</p>
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {pipelineOpen[1] ? '[-] COLLAPSE' : '[+] EXPAND'}
                </span>
              </div>
              
              {pipelineOpen[1] && (
                <div className="pipeline-body">
                  <pre className="ingestion-terminal">
{`2026-02-14 12:22:13,488 - INFO - Found 79 PDFs for Year 2025
2026-02-14 12:22:13,488 - INFO - Processing 79 remaining PDFs with 5 parallel workers
2026-02-14 12:22:13,729 - INFO - Worker starting Issue 9236...
2026-02-14 12:22:13,758 - INFO -   Total Pages: 8
2026-02-14 12:22:13,758 - INFO -   Analysing Page 1/8...
2026-02-14 12:22:15,124 - INFO -   Page 1/8: OCR Completed. Confidence: 0.963
2026-02-14 12:22:15,125 - INFO -   Page 1/8: Extracted 3 legal blocks.`}
                  </pre>
                </div>
              )}
            </div>

            {/* Folder 2 */}
            <div className="pipeline-section-card">
              <div className="pipeline-header" onClick={() => togglePipelineSection(2)}>
                <div className="pipeline-title-wrapper">
                  <div className="pipeline-step-num">2</div>
                  <div className="pipeline-header-info">
                    <h3>LLM Schema Structural Alignment</h3>
                    <p>Isolating executive decree articles and structural indexing targets</p>
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {pipelineOpen[2] ? '[-] COLLAPSE' : '[+] EXPAND'}
                </span>
              </div>

              {pipelineOpen[2] && (
                <div className="pipeline-body">
                  <div className="structuring-split">
                    <div className="structured-panel">
                      <span className="panel-header-label">RAW ARABIC GAZETTE CHARACTERS</span>
                      <div className="raw-ocr-text">
{`الجمهورية اللبنانية
وزارة المالية
مرسوم رقم 12345
تعديل موازنة وزارة المالية لعام ٢٠٢٥
المادة ١: يضاف اعتماد بقيمة ٥٠٠,٠٠٠,٠٠٠ ل.ل إلى موازنة وزارة المالية لعام ٢٠٢٥.`}
                      </div>
                    </div>

                    <div className="structured-panel">
                      <span className="panel-header-label">PARSED STRUCTURED JSON MAP</span>
                      <pre className="structured-json">
{`{
  "entity_type": "Decree",
  "document_number": "12345",
  "issuer": "Ministry of Finance",
  "articles": [
    {
      "article_id": "1",
      "text": "Add a credit of 500k USD to Ministry of Finance budget."
    }
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Folder 3 */}
            <div className="pipeline-section-card">
              <div className="pipeline-header" onClick={() => togglePipelineSection(3)}>
                <div className="pipeline-title-wrapper">
                  <div className="pipeline-step-num">3</div>
                  <div className="pipeline-header-info">
                    <h3>Cross-Lingual pgvector Index Map</h3>
                    <p>Resolving Arabic terms (مرسوم) to French (Décret) / English (Decree) embeddings</p>
                  </div>
                </div>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {pipelineOpen[3] ? '[-] COLLAPSE' : '[+] EXPAND'}
                </span>
              </div>

              {pipelineOpen[3] && (
                <div className="pipeline-body">
                  <p style={{ fontSize: '11px', color: 'var(--win-black)', marginBottom: '8px' }}>
                    Visual cross-lingual alignment strength maps the vector distances:
                  </p>
                  
                  <div className="semantic-mapping-grid">
                    <div className="semantic-node">
                      <span className="node-lang-badge">ARABIC</span>
                      <span className="node-term">مرسوم</span>
                      <span className="node-desc">Legal executive order decree.</span>
                      <span className="node-vector">vec: [0.12, -0.45, 0.88, ...]</span>
                    </div>

                    <div className="semantic-node">
                      <span className="node-lang-badge">FRENCH</span>
                      <span className="node-term">Décret</span>
                      <span className="node-desc">Acte législatif ou exécutif.</span>
                      <span className="node-vector">vec: [0.14, -0.42, 0.85, ...]</span>
                    </div>

                    <div className="semantic-node">
                      <span className="node-lang-badge">ENGLISH</span>
                      <span className="node-term">Decree</span>
                      <span className="node-desc">An executive administrative order.</span>
                      <span className="node-vector">vec: [0.11, -0.46, 0.89, ...]</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--win-light-gray)', padding: '6px', border: '1px solid var(--win-dark-gray)', marginTop: '8px', fontSize: '11px' }}>
                    <p style={{ color: 'var(--win-blue)', fontWeight: 'bold' }}>
                      ⚡ Cross-Lingual Alignment Strength Summary:
                    </p>
                    <p style={{ marginTop: '2px' }}>
                      Cosine Similarity Score (مرسوم &lt;-&gt; Décret): <strong>0.924</strong>.
                      Resolves semantic search matches regardless of input query language.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* WHATSAPP AUDITING VIEW */}
      {activeTab === 'whatsapp_chats' && (
        <main className="notebook-container animate-fade-in">
          {/* Left Sidebar: Chats Selector */}
          <aside className="notebook-sidebar">
            <h2 className="section-title">Chat Registries</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px' }}>
              {/* Assil Chat Select */}
              <button 
                className={`sidebar-step-btn ${activeWhatsappChat === 'uncle' ? 'active' : ''}`}
                onClick={() => setActiveWhatsappChat('uncle')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '8px',
                  border: '1px solid var(--win-dark-gray)',
                  background: activeWhatsappChat === 'uncle' ? 'var(--win-blue)' : 'var(--win-gray)',
                  color: activeWhatsappChat === 'uncle' ? '#fff' : '#000',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>👤 Assil Mroueh (Uncle)</div>
                <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>Thursday 8 Jan - Monday 19 Jan 2026</div>
                <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '4px', borderTop: '1px dashed rgba(0,0,0,0.15)', width: '100%', paddingTop: '3px' }}>
                  Topic: Subscription & Serail Sourcing
                </div>
              </button>

              {/* Gazette Chat Select */}
              <button 
                className={`sidebar-step-btn ${activeWhatsappChat === 'gazette' ? 'active' : ''}`}
                onClick={() => setActiveWhatsappChat('gazette')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '8px',
                  border: '1px solid var(--win-dark-gray)',
                  background: activeWhatsappChat === 'gazette' ? 'var(--win-blue)' : 'var(--win-gray)',
                  color: activeWhatsappChat === 'gazette' ? '#fff' : '#000',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '12px' }}>🏢 Official Gazette Support</div>
                <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>Full Chat: 19 Jan - 20 Jan 2026</div>
                <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '4px', borderTop: '1px dashed rgba(0,0,0,0.15)', width: '100%', paddingTop: '3px' }}>
                  Topic: Account Portal Activation
                </div>
              </button>
            </div>

            {/* Explanatory notes */}
            <div style={{
              background: '#ece9d8',
              border: '1px solid #7f9db9',
              padding: '10px',
              fontSize: '11px',
              margin: '8px',
              color: '#333',
              lineHeight: '1.4'
            }}>
              <strong style={{ color: 'var(--win-blue)', display: 'block', marginBottom: '4px' }}>🛡️ AUDIT REPORT LOG:</strong>
              These transcripts document the offline administrative barriers encountered when requesting access to the digital gazette database: LibanPost payment, Serail office coordination, and phone support account generation.
            </div>
          </aside>

          {/* Right Main Pane: Chat Thread */}
          <div className="notebook-content-pane">
            <div className="notebook-page-shadow">
              <div className="notebook-page" style={{ padding: '0px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                
                {/* Chat Header */}
                <div className="win-title-bar" style={{ flexShrink: 0, padding: '6px 10px', background: 'var(--win-blue)', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
                  <span>
                    📱 WHATSAPP AUDIT: {activeWhatsappChat === 'uncle' ? 'Assil Mroueh (Uncle)' : 'Official Gazette Portal Support'}
                  </span>
                </div>

                {/* Message List */}
                <div style={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  background: '#e5ddd5', // WhatsApp background gray-tan
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {((whatsappChatsData as any)[activeWhatsappChat] || []).map((msg: any, idx: number) => {
                    const isLou = msg.sender === 'Lou';
                    const isSystem = msg.type === 'system';

                    if (isSystem) {
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                          <span style={{
                            background: '#dcf8c6',
                            color: '#444',
                            fontSize: '10px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            boxShadow: '0 1px 0.5px rgba(0,0,0,0.15)',
                            textAlign: 'center',
                            fontFamily: 'monospace'
                          }}>
                            ⚙️ {msg.content} ({msg.timestamp.split(', ')[1]})
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: isLou ? 'flex-end' : 'flex-start',
                          width: '100%' 
                        }}
                      >
                        <div style={{
                          background: isLou ? '#dcf8c6' : '#ffffff',
                          color: '#000',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          boxShadow: '0 1px 0.5px rgba(0,0,0,0.18)',
                          maxWidth: '75%',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          fontFamily: 'sans-serif'
                        }}>
                          {/* Sender name */}
                          <div style={{ fontWeight: 'bold', fontSize: '11px', color: isLou ? '#128c7e' : '#34b7f1' }}>
                            {msg.sender}
                          </div>

                          {/* Message Content */}
                          {msg.type === 'text' && (
                            <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                              {msg.content}
                            </div>
                          )}

                          {msg.type === 'link' && (
                            <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                              <a 
                                href={msg.content} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ color: '#075e54', textDecoration: 'underline', wordBreak: 'break-all' }}
                              >
                                {msg.content}
                              </a>
                            </div>
                          )}

                          {msg.type === 'image' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <img 
                                src={msg.mediaPath} 
                                alt={msg.content}
                                onClick={() => setWhatsappImagePreview(msg.mediaPath)}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '180px',
                                  borderRadius: '4px',
                                  border: '1px solid #ddd',
                                  cursor: 'pointer',
                                  objectFit: 'cover'
                                }}
                              />
                              <span style={{ fontSize: '11px', color: '#555', fontStyle: 'italic' }}>
                                {msg.content} (Click to zoom)
                              </span>
                            </div>
                          )}

                          {msg.type === 'video' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <video 
                                src={msg.mediaPath} 
                                controls 
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '200px',
                                  borderRadius: '4px',
                                  border: '1px solid #ddd'
                                }}
                              />
                              <span style={{ fontSize: '11px', color: '#555', fontStyle: 'italic' }}>
                                {msg.content}
                              </span>
                            </div>
                          )}

                          {msg.type === 'audio' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#f5f5f5', border: '1px solid #ddd', padding: '6px', borderRadius: '4px' }}>
                              <span style={{ fontSize: '10px', color: '#666', fontWeight: 'bold' }}>🔊 Voice Message:</span>
                              <audio 
                                src={msg.mediaPath} 
                                controls 
                                style={{
                                  width: '210px',
                                  height: '28px'
                                }}
                              />
                            </div>
                          )}

                          {/* Message Time */}
                          <div style={{ alignSelf: 'flex-end', fontSize: '9px', color: '#777', marginTop: '2px' }}>
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* WHATSAPP ZOOM PREVIEW MODAL */}
      {whatsappImagePreview && (
        <div 
          onClick={() => setWhatsappImagePreview(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={whatsappImagePreview} 
            alt="Preview" 
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              border: '2px solid white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}

      {/* ABOUT RETRO DIALOG MODAL */}
      {showAboutDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="outset-panel" style={{ width: '380px', padding: '2px' }}>
            <div className="win-title-bar">
              <span>About Gazette Audit Lab</span>
              <button className="win-sys-btn" onClick={() => setShowAboutDialog(false)}>X</button>
            </div>
            <div style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '32px' }}>💾</span>
              <div>
                <h3 style={{ color: 'var(--win-black)', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Gazette Auditing Laboratory
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--win-black)', lineHeight: '1.4' }}>
                  Version 1.0.4 Build (June 2026)<br />
                  For Algorithmic Auditing and Digital Humanities Thesis Verification.<br /><br />
                  Copyright © 1995-2026 Architect Inc. All Rights Reserved.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px', background: 'var(--win-gray)', borderTop: '1px solid var(--win-dark-gray)' }}>
              <button className="win-button" onClick={() => setShowAboutDialog(false)} style={{ width: '80px' }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDITING MANIFESTO RETRO DIALOG MODAL */}
      {showManifestoDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="outset-panel" style={{ width: '450px', padding: '2px' }}>
            <div className="win-title-bar">
              <span>Auditing Manifesto - manifesto.txt</span>
              <button className="win-sys-btn" onClick={() => setShowManifestoDialog(false)}>X</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '350px', overflowY: 'auto' }}>
              <h3 style={{ color: 'var(--win-black)', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--win-dark-gray)' }}>
                THE ALGORITHMIC AUDITING MANIFESTO
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--win-black)', lineHeight: '1.4', fontFamily: 'var(--font-mono)' }}>
                1. FAILURE AS DATA:<br />
                In digital humanities, documenting how and why a system crashes is more scientifically valuable than claiming smooth success. The Bug Graveyard records the operational boundaries of language models.<br /><br />
                2. THE DIRECTORIAL IMPERATIVE:<br />
                Autonomous agents are not independent actors; they are directed by human intent. The Human Rescue metric maps the surgical alignment prompts injected to guide the agent out of circular locks.<br /><br />
                3. DATA FIDELITY & PRESERVATION:<br />
                Bilingual archives (Arabic/French) require strict cross-lingual semantic vector mapping to guarantee that queries retrieve exact civil obligations, regardless of language mismatch.<br /><br />
                4. QUANTIFIED CO-CREATION:<br />
                The Autonomy Slider categorizes system development from simple dictation to deep autonomy, mapping lines of code against human intervention metrics.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px', background: 'var(--win-gray)', borderTop: '1px solid var(--win-dark-gray)' }}>
              <button className="win-button" onClick={() => setShowManifestoDialog(false)} style={{ width: '80px' }}>
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETRO SEARCH PORTAL MODAL */}
      {showSearchDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="outset-panel" style={{ width: '600px', padding: '2px', display: 'flex', flexDirection: 'column', maxHeight: '85%' }}>
            <div className="win-title-bar">
              <span>Find Files & Transcripts - Search Portal</span>
              <button className="win-sys-btn" onClick={() => setShowSearchDialog(false)}>X</button>
            </div>
            
            {/* Search Input Area */}
            <div style={{ padding: '12px', borderBottom: '1px solid var(--win-dark-gray)', background: 'var(--win-gray)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'black' }}>Named:</span>
                <input 
                  type="text" 
                  className="win-input" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type search query (e.g. 402, billing, Arabic, commit, Fusha)..."
                  style={{ flex: 1, padding: '4px 6px', fontSize: '12px', fontFamily: 'monospace' }}
                  autoFocus
                />
                <button className="win-button" onClick={() => setSearchQuery('')} style={{ width: '60px' }}>
                  Clear
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div style={{ 
              flex: 1, 
              padding: '12px', 
              overflowY: 'auto', 
              background: 'white', 
              color: 'black', 
              minHeight: '200px',
              maxHeight: '400px',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              {searchQuery.trim() === '' ? (
                <div style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>
                  <p style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</p>
                  Enter a query to search the Gazette Auditing Laboratory database.<br />
                  Indexes: Gopher pages, timeline steps, scraper logs, chats, and transcripts.
                </div>
              ) : (
                <div>
                  <div style={{ borderBottom: '1px dotted #999', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                    Search Results ({getSearchResults().length} matches found):
                  </div>
                  {getSearchResults().length === 0 ? (
                    <div style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
                      No matches found for "{searchQuery}".
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {getSearchResults().map((result, idx) => {
                        let catColor = '#1d4ed8'; // blue
                        let catLabel = 'Gopher';
                        if (result.category === 'timeline') {
                          catColor = '#15803d'; // green
                          catLabel = 'Timeline';
                        } else if (result.category === 'scraper') {
                          catColor = '#b45309'; // amber
                          catLabel = 'Scraper';
                        } else if (result.category === 'gemini_chat') {
                          catColor = '#6d28d9'; // purple
                          catLabel = 'Gemini';
                        } else if (result.category === 'whatsapp') {
                          catColor = '#be185d'; // pink
                          catLabel = 'WhatsApp';
                        }

                        return (
                          <div 
                            key={idx} 
                            onClick={result.action}
                            className="search-result-item"
                            style={{ 
                              padding: '8px', 
                              border: '1px solid #ccc', 
                              borderRadius: '2px', 
                              cursor: 'pointer',
                              background: '#f9f9f9',
                              transition: 'background 0.1s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#e0f2fe'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#f9f9f9'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 'bold', color: 'black' }}>{result.title}</span>
                              <span style={{ 
                                fontSize: '10px', 
                                background: catColor, 
                                color: 'white', 
                                padding: '1px 5px', 
                                borderRadius: '3px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold'
                              }}>
                                {catLabel}
                              </span>
                            </div>
                            <div style={{ color: '#444', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                              {result.snippet}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px', background: 'var(--win-gray)', borderTop: '1px solid var(--win-dark-gray)' }}>
              <button className="win-button" onClick={() => setShowSearchDialog(false)} style={{ width: '80px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
