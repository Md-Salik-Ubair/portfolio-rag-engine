import React, { useState, useEffect, useRef } from 'react';

// Original Video & Image Assets Restored
import avatarImg from './assets/avatar.jpg';
import idleVideo from './assets/idle.mp4';
import speakingVideo from './assets/speaking.mp4';
import thinkingVideo from './assets/thinking.mp4';

// Backend URL (LIVE RENDER SERVER)
const API_BASE_URL = 'https://salik-portfolio-backend.onrender.com';

// ==========================================
// FULL CINEMATIC APP (VIRTUAL PRESENCE & LIVE CAPTIONS)
// ==========================================
function App() {
  const [currentView, setCurrentView] = useState('portfolio'); 
  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // AI Cinematic Interface States
  const speakingRef = useRef(null);
  const thinkingRef = useRef(null);
  const audioRef = useRef(null);
  const chatEndRef = useRef(null);
  
  const [aiState, setAiState] = useState('standby'); 
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]); 
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Upload, Edit & Modal States
  const [isUploadingDP, setIsUploadingDP] = useState(false);
  const [isUploadingItemImg, setIsUploadingItemImg] = useState(false);
  const [editingNode, setEditingNode] = useState(null); 
  const [viewingNode, setViewingNode] = useState(null); 

  // Admin Forms
  const [profileForm, setProfileForm] = useState({
    full_name: '', professional_title: '', location: '', profile_summary: '', current_status: '',
    skills_list: '', languages_known: '', phone_number: '', whatsapp_link: '', family_narrative: '',
    display_picture_url: '', master_cv_url: '', master_cv_text: ''
  });

  const [socialForm, setSocialForm] = useState({
    email: '', linkedin: '', github: '', instagram: ''
  });

  const [itemForm, setItemForm] = useState({
    category: 'projects', title: '', organization_or_issuer: '', duration_or_date: '',
    description: '', hidden_readme: '', tag_or_skills_mapped: '', smart_links: [], image_urls: [] 
  });
  const [tempLink, setTempLink] = useState({ label: '', url: '' });

  // ---------------------------------------------------------
  // CORE EVENT LISTENERS (Back Button Hardware Fix & Scroll)
  // ---------------------------------------------------------
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory.length, aiState]);

  // Fix hardware "Back" button closing the whole app when viewing a node
  useEffect(() => {
    const handlePopState = (e) => {
        if (viewingNode) {
            e.preventDefault();
            setViewingNode(null); 
        } else if (isChatOpen) {
            e.preventDefault();
            setIsChatOpen(false); 
        }
    };
    
    if (viewingNode || isChatOpen) {
        window.history.pushState(null, "", window.location.href);
    }
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewingNode, isChatOpen]);


  // ---------------------------------------------------------
  // CORE API FETCHING 
  // ---------------------------------------------------------
  const refreshPortfolioData = () => {
    fetch(`${API_BASE_URL}/api/portfolio/data`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setBackendData(data);
          setProfileForm({
            full_name: data.profile_core?.full_name || '',
            professional_title: data.profile_core?.professional_title || '',
            location: data.profile_core?.location || '',
            profile_summary: data.profile_core?.profile_summary || '',
            current_status: data.profile_core?.current_status || '',
            phone_number: data.profile_core?.phone_number || '',
            whatsapp_link: data.profile_core?.whatsapp_link || '',
            skills_list: data.profile_core?.skills_list || '',
            languages_known: data.profile_core?.languages_known || '',
            family_narrative: data.family_meta?.summary || '',
            display_picture_url: data.profile_core?.display_picture_url || '',
            master_cv_url: data.profile_core?.master_cv_url || '',
            master_cv_text: data.profile_core?.master_cv_text || ''
          });
          setSocialForm({
            email: data.social_channels?.email || '',
            linkedin: data.social_channels?.linkedin || '',
            github: data.social_channels?.github || '',
            instagram: data.social_channels?.instagram || ''
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Database connection failure.", err);
        setLoading(false);
      });
  };

  useEffect(() => { refreshPortfolioData(); }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(res => res.json()).then(data => {
      if (data.success) setIsAuthenticated(true);
      else alert("Login Failed: " + data.error);
    }).catch(() => alert("Server unreachable."));
  };

  // ---------------------------------------------------------
  // FORMS & DATA SUBMISSION 
  // ---------------------------------------------------------
  const handleImageUpload = async (e, type = 'dp') => {
    const file = e.target.files[0];
    if (!file) return;
    const IMGBB_API_KEY = "67a2f496c1625f298a33f240d8366100"; 
    
    if (type === 'dp') setIsUploadingDP(true);
    else setIsUploadingItemImg(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        if (type === 'dp') {
            setProfileForm({ ...profileForm, display_picture_url: data.data.url });
            alert("✅ Profile Photo Uploaded!");
        } else {
            setItemForm({ ...itemForm, image_urls: [...(itemForm.image_urls || []), data.data.url] });
        }
      } else { alert("Upload Failed."); }
    } catch (err) { alert("Network Error during upload."); }

    if (type === 'dp') setIsUploadingDP(false);
    else setIsUploadingItemImg(false);
  };

  const removeUploadedImage = (index) => {
      const newImages = [...(itemForm.image_urls || [])];
      newImages.splice(index, 1);
      setItemForm({ ...itemForm, image_urls: newImages });
  };
  
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/api/portfolio/update-core`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm)
    }).then(res => res.json()).then(resData => {
      if (resData.success) {
        fetch(`${API_BASE_URL}/api/portfolio/update-socials`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(socialForm)
        }).then(() => { 
            fetch(`${API_BASE_URL}/api/portfolio/update-family`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: profileForm.family_narrative })
            }).then(() => {
                alert("✅ Master Details & Family Data Saved! RAG Brain Updating..."); 
                refreshPortfolioData(); 
            });
        });
      }
    });
  };

  const addSmartLink = (e) => { e.preventDefault(); if (tempLink.label.trim() && tempLink.url.trim()) { setItemForm({ ...itemForm, smart_links: [...(itemForm.smart_links || []), tempLink] }); setTempLink({ label: '', url: '' }); } };
  const removeSmartLink = (index) => { const newLinks = [...(itemForm.smart_links || [])]; newLinks.splice(index, 1); setItemForm({ ...itemForm, smart_links: newLinks }); };
  
  const triggerEditNode = (category, node, e) => { 
    if(e) e.stopPropagation();
    let loadedSmartLinks = node.smart_links ? [...node.smart_links] : [];
    if (node.external_redirection_link && loadedSmartLinks.length === 0) { loadedSmartLinks.push({ label: 'Project Link', url: node.external_redirection_link }); }
    setEditingNode({ category, id: node.id }); 
    setItemForm({ 
        category: category, 
        title: node.title || '', 
        organization_or_issuer: node.organization_or_issuer || '', 
        duration_or_date: node.duration_or_date || '', 
        description: node.description || '', 
        hidden_readme: node.hidden_readme || '',
        tag_or_skills_mapped: node.tag_or_skills_mapped || '', 
        smart_links: loadedSmartLinks, 
        image_urls: node.image_urls || [] 
    }); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const cancelEdit = () => { setEditingNode(null); setItemForm({ category: 'projects', title: '', organization_or_issuer: '', duration_or_date: '', description: '', hidden_readme: '', tag_or_skills_mapped: '', smart_links: [], image_urls: [] }); };
  
  const handleItemSubmit = (e) => {
    e.preventDefault();
    const url = editingNode ? `${API_BASE_URL}/api/portfolio/item/${editingNode.category}/${editingNode.id}` : `${API_BASE_URL}/api/portfolio/item/${itemForm.category}`;
    fetch(url, { method: editingNode ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemForm) })
    .then(res => res.json()).then(resData => { if (resData.success) { alert(`Saved & Pushed to RAG Engine.`); cancelEdit(); refreshPortfolioData(); } });
  };

  const handleDeleteNode = (category, id, e) => {
    if(e) e.stopPropagation();
    if (!window.confirm("Delete this entry permanently?")) return;
    fetch(`${API_BASE_URL}/api/portfolio/item/${category}/${id}`, { method: 'DELETE' }).then(res => res.json()).then(resData => { if (resData.success) refreshPortfolioData(); });
  };

  // ==========================================
  // SMART UI: AUTO-SCROLL FUNCTION 
  // ==========================================
  const handleSmartScroll = (text) => {
      const lowerText = text.toLowerCase();
      if(lowerText.includes('project') || lowerText.includes('projects')) {
          const section = document.getElementById('section-projects');
          if(section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      } else if (lowerText.includes('experience') || lowerText.includes('worked')) {
          const section = document.getElementById('section-experiences');
          if(section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      } else if (lowerText.includes('education') || lowerText.includes('degree') || lowerText.includes('study')) {
          const section = document.getElementById('section-education');
          if(section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      } else if (lowerText.includes('certification') || lowerText.includes('award')) {
          const section = document.getElementById('section-certifications_and_achievements');
          if(section) {
              section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      }
  }

  // ==========================================
  // VIRTUAL PRESENCE ENGINE (Audio Flow Secured)
  // ==========================================
  const isMuted = !isAudioEnabled;

  const stopAllAudio = () => {
    if (audioRef.current) { 
        audioRef.current.pause(); 
        audioRef.current.removeAttribute('src'); 
        audioRef.current.load(); 
        audioRef.current = null;
    }
    if (speakingRef.current) { speakingRef.current.pause(); speakingRef.current.currentTime = 0; }
    if (thinkingRef.current) { thinkingRef.current.pause(); thinkingRef.current.currentTime = 0; }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(prev => {
        const nextState = !prev;
        if (audioRef.current) audioRef.current.muted = !nextState;
        if (speakingRef.current) speakingRef.current.muted = !nextState;
        if (thinkingRef.current) thinkingRef.current.muted = !nextState;

        if (nextState && aiState === 'answering' && speakingRef.current && speakingRef.current.paused) {
             speakingRef.current.play().catch(e => console.log("Video Play Blocked:", e));
        }
        return nextState;
    });
  };

  useEffect(() => {
      if (audioRef.current) audioRef.current.muted = isMuted;
      if (speakingRef.current) speakingRef.current.muted = isMuted;
      if (thinkingRef.current) thinkingRef.current.muted = isMuted;
  }, [isMuted]);

  const startIntroSequence = () => {
    stopAllAudio(); 
    setAiState('intro');
    const introText = "I am the digital twin of Md Salik Ubair. I can answer questions about his engineering portfolio.";
    setChatHistory([{ role: 'ai', text: introText }]);
    
    if (!isMuted && speakingRef.current) {
        speakingRef.current.currentTime = 0;
        speakingRef.current.play().catch(e => console.error("AutoPlay blocked:", e));
    } else {
        setTimeout(() => setAiState('idle'), 2500); 
    }
  };

  const handleSpeakingEnded = () => {
    if (aiState === 'intro') setAiState('idle');
  };

  const handleThinkingEnded = () => {
    if (aiState === 'thinking') setAiState('idle_waiting');
  };

  const playBackendStream = (data) => {
    stopAllAudio(); 

    const responseText = data.ai_response || "Connection established.";
    const audioUrl = data.audio_url;
    
    const cleanSub = responseText.replace(/[*#`]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
    setChatHistory(prev => [...prev, { role: 'ai', text: cleanSub }]);
    
    if (audioUrl) {
        setAiState('answering');
        
        const fullAudioUrl = `${API_BASE_URL}${audioUrl}?t=${new Date().getTime()}`; 
        
        const newAudio = new Audio(fullAudioUrl);
        audioRef.current = newAudio; 
        newAudio.muted = isMuted; 
        
        newAudio.onplay = () => {
            if (speakingRef.current && !isMuted) {
                speakingRef.current.currentTime = 0;
                speakingRef.current.play().catch(e => console.log("Video Play Blocked:", e));
            }
        };
        
        newAudio.onended = () => {
            setAiState('idle');
            if (speakingRef.current) speakingRef.current.pause();
            handleSmartScroll(cleanSub);
        };
        
        newAudio.onerror = (e) => {
            console.error("Audio Load Error:", e);
            setAiState('idle');
            handleSmartScroll(cleanSub);
        }
        
        newAudio.play().catch(e => { 
            console.error("Audio AutoPlay blocked:", e); 
            setAiState('idle'); 
            handleSmartScroll(cleanSub);
        });
    } else {
        setAiState('idle');
        handleSmartScroll(cleanSub);
    }
  };

  const triggerAiQuery = (e) => {
    e.preventDefault();
    if (!userQuery.trim() || ['intro', 'thinking', 'answering'].includes(aiState)) return;
    
    const questionToAsk = userQuery;
    setChatHistory(prev => [...prev, { role: 'user', text: questionToAsk }]);
    setUserQuery('');
    
    setAiState('thinking');
    stopAllAudio(); 

    if (thinkingRef.current && !isMuted) {
        thinkingRef.current.currentTime = 0;
        thinkingRef.current.play().catch(e => console.log(e));
    }

    fetch(`${API_BASE_URL}/api/rag/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: questionToAsk })
    })
    .then(res => res.json())
    .then(data => playBackendStream(data))
    .catch(() => {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Network dropout. Re-establishing connection..." }]);
      setAiState('idle');
    });
  };

  const showThinking = aiState === 'thinking' && !isMuted;
  const showSpeaking = ['intro', 'answering'].includes(aiState) && !isMuted;
  const showIdle = ['standby', 'idle', 'idle_waiting'].includes(aiState) || isMuted;

  // Render Navbar Links
  const navLinks = [
    { label: 'About', view: 'portfolio', section: 'top' },
    { label: 'Experience', view: 'portfolio', section: 'section-experiences' },
    { label: 'Projects', view: 'portfolio', section: 'section-projects' },
    { label: 'Education', view: 'portfolio', section: 'section-education' },
    { label: 'Certifications', view: 'portfolio', section: 'section-certifications_and_achievements' },
    { label: 'Admin Hub', view: 'admin-hub', section: null },
  ];

  const handleNavClick = (view, sectionId) => {
      setCurrentView(view);
      setIsMobileMenuOpen(false);
      if(sectionId && view === 'portfolio') {
          setTimeout(() => {
              if(sectionId === 'top') {
                  window.scrollTo({top: 0, behavior: 'smooth'});
              } else {
                  const element = document.getElementById(sectionId);
                  if(element) element.scrollIntoView({behavior: 'smooth', block: 'start'});
              }
          }, 100);
      }
  }

  return (
    <div className="min-h-screen bg-[#020202] text-slate-100 font-sans antialiased overflow-x-hidden relative selection:bg-sky-500/30 scroll-smooth">
      
      {/* Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>

      {/* 🚀 PREMIUM MSU MONOGRAM NAVBAR 🚀 */}
      <nav className="fixed w-full border-b border-white/5 bg-black/50 backdrop-blur-2xl z-50 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleNavClick('portfolio', 'top')}>
          {/* Abstract Caligraphy M-S-U Symbol */}
          <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-[#050505] border border-white/10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(14,165,233,0.15)] group-hover:shadow-[0_0_25px_rgba(14,165,233,0.4)] group-hover:border-sky-500/30 transition-all duration-500">
             <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent"></div>
             {/* The Interlocking Letters */}
             <span className="relative font-serif font-black italic tracking-tighter text-lg md:text-xl flex select-none">
                <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] z-20 translate-x-[2px]">M</span>
                <span className="text-sky-500 -ml-1 mt-[2px] drop-shadow-[0_2px_10px_rgba(14,165,233,0.6)] z-30">S</span>
                <span className="text-slate-400 -ml-[3px] flex items-end z-10 -mb-[1px]">U</span>
             </span>
          </div>
          
          {/* Brand Text */}
          <div className="flex flex-col justify-center">
            <span className="text-xs md:text-sm font-extrabold tracking-[0.2em] text-white leading-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] uppercase">
              Salik<span className="text-sky-400 font-light ml-1">Ubair</span>
            </span>
            <span className="text-[7px] md:text-[8px] text-slate-500 uppercase tracking-[0.3em] font-mono mt-0.5">
              Intelligence Portfolio
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link, idx) => (
                <button 
                    key={idx}
                    onClick={() => handleNavClick(link.view, link.section)}
                    className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:text-sky-400`}
                >
                    {link.label}
                </button>
            ))}
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="lg:hidden flex items-center">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white p-2 text-xl hover:text-sky-400 transition-colors">
                 {isMobileMenuOpen ? '✕' : '☰'}
             </button>
        </div>
      </nav>

      {/* FIXED: Premium Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
          <div className="fixed top-16 left-0 w-full bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 z-40 lg:hidden flex flex-col p-4 space-y-2 shadow-2xl animate-fadeIn">
              {navLinks.map((link, idx) => (
                  <button 
                      key={idx}
                      onClick={() => handleNavClick(link.view, link.section)}
                      className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300 hover:text-white hover:bg-white/5 w-full text-left py-4 px-4 rounded-xl transition-all border border-transparent hover:border-white/10"
                  >
                      {link.label}
                  </button>
              ))}
          </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 CINEMATIC MODAL POPUP FOR NODES (PREMIUM) 🚀 */}
      {/* ========================================================= */}
      {viewingNode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-10 bg-black/90 backdrop-blur-2xl animate-fadeIn" onClick={() => setViewingNode(null)}>
            <div className="bg-[#050505] border border-white/10 w-full h-full md:w-full md:max-w-4xl md:h-auto md:max-h-[90vh] md:rounded-3xl overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,1)] relative scrollbar-hide" onClick={e => e.stopPropagation()}>
                
                {/* Close Button */}
                <button onClick={() => setViewingNode(null)} className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center border border-white/20 transition-colors z-50 font-bold backdrop-blur-xl">✕</button>
                
                {/* Cinematic Header Image (DP Style) */}
                <div className="w-full h-56 md:h-80 relative bg-black flex items-end">
                    {viewingNode?.image_urls?.length > 0 && (
                        <img src={viewingNode.image_urls[0]} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-50 blur-[2px]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-10" />
                    
                    <div className="relative z-20 p-6 md:p-12 w-full translate-y-6">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                            <span className="bg-sky-500/20 text-sky-400 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-sky-500/30">{viewingNode._category?.replace(/_/g, ' ')}</span>
                            <span className="text-xs md:text-sm font-mono text-slate-400 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">{viewingNode.duration_or_date}</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">{viewingNode.title}</h2>
                        <p className="text-base md:text-xl text-indigo-300 font-medium mt-2">{viewingNode.organization_or_issuer}</p>
                    </div>
                </div>
                
                <div className="p-6 md:p-12 pt-10 md:pt-16 space-y-6 md:space-y-8 relative z-20">
                    {viewingNode.tag_or_skills_mapped && (
                        <div className="flex flex-wrap gap-2">
                            {viewingNode.tag_or_skills_mapped.split(',').map((skill, i) => (
                                <span key={i} className="bg-white/5 border border-white/10 text-slate-300 text-[10px] md:text-xs font-medium px-3 py-1.5 md:px-4 md:py-1.5 rounded-full">{skill.trim()}</span>
                            ))}
                        </div>
                    )}

                    <div className="prose prose-invert max-w-none text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-line">
                        {viewingNode.description}
                    </div>

                    {/* GALLERY / EXTRA IMAGES */}
                    {viewingNode?.image_urls?.length > 1 && (
                        <div className="mt-8 space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Additional Assets / Certificates</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {viewingNode.image_urls.slice(1).map((img, idx) => (
                                    <a href={img} target="_blank" rel="noreferrer" key={idx} className="block aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-sky-500 transition-colors">
                                        <img src={img} alt="Certificate/Asset" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3 md:gap-4 pt-6 md:pt-8 border-t border-white/10">
                        {viewingNode.smart_links?.map((link, idx) => (
                            <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white text-black hover:bg-sky-400 text-xs md:text-sm font-bold px-5 py-2.5 md:px-6 md:py-3 rounded-xl transition-transform hover:-translate-y-1 shadow-[0_5px_15px_rgba(255,255,255,0.1)]">
                                {link.label} ↗
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-8 pt-24 md:pt-32 pb-32 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="h-10 w-10 border-2 border-t-transparent border-sky-400 rounded-full animate-spin" />
            <p className="text-xs text-sky-400/80 tracking-widest font-mono uppercase animate-pulse">Loading Database...</p>
          </div>
        ) : currentView === 'portfolio' ? (
          
          /* ================= VIEW 1: PORTFOLIO ================= */
          <div className="space-y-12 md:space-y-16 animate-fadeIn">
            
            {/* HERO SECTION */}
            <div className="relative flex flex-col-reverse lg:flex-row items-center justify-between gap-8 md:gap-12 p-6 md:p-12 border border-white/10 bg-white/[0.02] rounded-[2rem] md:rounded-[2.5rem] backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-sky-400 to-indigo-600" />
              
              <div className="flex-1 space-y-5 md:space-y-6 relative z-10 w-full text-center lg:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter text-white">
                  {backendData?.profile_core?.full_name || "Md Salik Ubair"}
                </h1>
                
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-2 text-base md:text-xl text-sky-400 font-medium tracking-wide lg:border-l-2 lg:border-indigo-500 lg:pl-4">
                  <span>{backendData?.profile_core?.professional_title || "Update Title in Dashboard"}</span>
                  {backendData?.profile_core?.location && (
                      <div className="flex items-center gap-2">
                          <span className="hidden lg:inline text-slate-500">•</span>
                          <span className="text-slate-300 text-xs md:text-sm bg-white/5 lg:bg-transparent px-3 py-1 lg:px-0 lg:py-0 rounded-full">{backendData.profile_core.location}</span>
                      </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center lg:justify-start gap-3 text-xs md:text-sm mt-4">
                  {backendData?.profile_core?.phone_number && <span className="bg-white/5 border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-lg text-slate-300">📞 {backendData.profile_core.phone_number}</span>}
                  {backendData?.social_channels?.email && <a href={`mailto:${backendData.social_channels.email}`} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">✉️ Email</a>}
                  {backendData?.social_channels?.linkedin && <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-lg text-sky-400 hover:bg-white/10 transition-colors">LinkedIn ↗</a>}
                  {backendData?.social_channels?.github && <a href={backendData.social_channels.github} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 px-3 py-2 md:px-4 md:py-2 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">GitHub ↗</a>}
                  
                  {backendData?.profile_core?.whatsapp_link && (
                    <a href={backendData.profile_core.whatsapp_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 md:px-4 md:py-2 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        💬 WhatsApp
                    </a>
                  )}

                  {backendData?.social_channels?.instagram && (
                    <a href={backendData.social_channels.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:opacity-90 transition-opacity font-bold shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                        📸 Instagram
                    </a>
                  )}

                  {backendData?.profile_core?.master_cv_url && <a href={backendData.profile_core.master_cv_url} target="_blank" rel="noreferrer" className="bg-sky-500 text-black font-bold px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-sky-400 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.3)]">📄 View Full Resume</a>}
                </div>

                {backendData?.profile_core?.profile_summary && (
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-2xl lg:border-t lg:border-white/5 lg:pt-4 lg:mt-4 mx-auto lg:mx-0">
                        {backendData.profile_core.profile_summary}
                    </p>
                )}
              </div>

              <div className="relative w-40 md:w-[250px] lg:w-[300px] flex-shrink-0 z-20 mx-auto">
                  <div className="relative w-full aspect-[4/5] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black">
                      <img src={backendData?.profile_core?.display_picture_url || avatarImg} alt="Profile" className="w-full h-full object-cover" />
                  </div>
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-6">
              <h3 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">Core Technical Stack</h3>
              <div className="flex flex-wrap gap-2">
                {backendData?.profile_core?.skills_list ? (
                  backendData.profile_core.skills_list.split(',').filter(s => s.trim() !== "").map((skill, index) => (
                    <span key={index} className="bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium px-4 py-2 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.1)] hover:bg-sky-500/20 transition-all cursor-default">
                      {skill.trim()}
                    </span>
                  ))
                ) : <span className="text-[10px] md:text-xs text-slate-600">No skills added yet.</span>}
              </div>
            </div>

            {/* DYNAMIC LISTS RENDER */}
            {['experiences', 'projects', 'education', 'certifications_and_achievements'].map((sec) => {
              if (!backendData || !backendData[sec] || backendData[sec].length === 0) return null;
              const displayTitle = sec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={sec} id={`section-${sec}`} className="space-y-4 md:space-y-6 relative w-full overflow-hidden scroll-mt-24">
                  <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-widest border-b border-white/10 pb-3 md:pb-4 flex items-center gap-3">
                     <div className="w-2 h-2 bg-sky-500 rounded-full" /> {displayTitle}
                  </h2>
                  
                  <div className="flex overflow-x-auto md:grid md:grid-cols-2 gap-4 md:gap-6 pb-6 md:pb-0 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {(backendData[sec] || []).map((item) => {
                      return (
                        <div 
                            key={item.id} 
                            onClick={() => setViewingNode({...item, _category: sec})}
                            className="min-w-[85vw] md:min-w-0 snap-center group cursor-pointer border border-white/10 bg-white/[0.02] backdrop-blur-md rounded-2xl md:rounded-3xl p-6 md:p-8 hover:border-sky-500/50 hover:bg-white/[0.04] transition-all duration-300 shadow-xl hover:-translate-y-2 flex flex-col justify-between"
                        >
                          <div className="space-y-3 md:space-y-4 pointer-events-none">
                            {item.image_urls && item.image_urls.length > 0 && (
                              <div className="w-full h-32 md:h-40 rounded-xl overflow-hidden mb-3 md:mb-4 border border-white/10 relative bg-[#050505]">
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                  <img src={item.image_urls[0]} alt="Project Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-3 md:gap-4">
                              <h3 className="text-base md:text-xl font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-2">{item.title}</h3>
                              <span className="text-[9px] md:text-[10px] font-mono bg-white/10 px-2 py-1 md:px-3 md:py-1 rounded-full text-slate-300 whitespace-nowrap flex-shrink-0">{item.duration_or_date}</span>
                            </div>
                            <p className="text-xs md:text-sm font-semibold text-indigo-400">{item.organization_or_issuer}</p>
                            <p className="text-xs md:text-sm text-slate-400 leading-relaxed line-clamp-3">{item.description}</p>
                          </div>
                          
                          <div className="mt-4 md:mt-6 flex justify-end pt-3 md:pt-4 border-t border-white/5 pointer-events-none">
                              <span className="text-[10px] md:text-xs font-bold text-sky-500 group-hover:translate-x-2 transition-transform">View Details ↗</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !isAuthenticated ? (
          
          /* ================= VIEW 2: LOGIN ================= */
          <div className="max-w-md mx-auto my-20 md:my-32 border border-white/10 bg-[#050505]/80 rounded-[2rem] p-8 md:p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
            <div className="text-center space-y-2 mb-8 md:mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">System Login</h2>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4 md:space-y-5">
              <input type="text" value={username} required onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 md:py-3.5 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
              <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 md:py-3.5 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
              <button type="submit" className="w-full bg-white text-black hover:bg-slate-200 font-bold text-xs md:text-sm py-3.5 md:py-4 rounded-xl transition-colors mt-2 md:mt-4">Authorize Access</button>
            </form>
          </div>
        ) : (
          
          /* ================= VIEW 3: ADMIN HUB ================= */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-fadeIn relative z-10">
             <div className="lg:col-span-1 space-y-6">
               <div className="border border-white/10 bg-[#050505]/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-6 shadow-xl">
                 <h2 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">Profile Matrix</h2>
                 <div className="p-4 border border-dashed border-white/20 rounded-2xl bg-white/[0.02] text-center space-y-3">
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full overflow-hidden border-2 border-sky-500/30">
                        {profileForm.display_picture_url ? <img src={profileForm.display_picture_url} alt="DP" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center text-xl md:text-2xl">👤</div>}
                    </div>
                    <div>
                        <label className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors inline-block">
                            {isUploadingDP ? "Uploading..." : "Upload New Photo"}
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'dp')} className="hidden" disabled={isUploadingDP} />
                        </label>
                    </div>
                 </div>

                 <form onSubmit={handleProfileSubmit} className="space-y-4">
                   <div className="p-3 md:p-4 bg-sky-900/10 border border-sky-500/30 rounded-xl space-y-3">
                       <h3 className="text-[9px] md:text-[10px] font-bold text-sky-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></div>Master CV Details</h3>
                       <input type="text" placeholder="CV Download Link (e.g. Google Drive)" value={profileForm.master_cv_url || ''} onChange={(e) => setProfileForm({...profileForm, master_cv_url: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                       <textarea rows={3} placeholder="Paste raw CV Text here for RAG Brain ingestion..." value={profileForm.master_cv_text || ''} onChange={(e) => setProfileForm({...profileForm, master_cv_text: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none resize-none transition-colors" />
                   </div>

                   {['full_name', 'professional_title', 'location', 'phone_number', 'whatsapp_link', 'skills_list'].map((field) => (
                     <div key={field} className="space-y-1">
                       <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">{field.replace(/_/g, ' ')}</label>
                       <input type="text" value={profileForm[field] || ''} onChange={(e) => setProfileForm({...profileForm, [field]: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                     </div>
                   ))}
                   
                   <div className="space-y-1">
                       <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Instagram Link</label>
                       <input type="url" value={socialForm.instagram || ''} onChange={(e) => setSocialForm({...socialForm, instagram: e.target.value})} className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                   </div>

                   <textarea rows={4} value={profileForm.profile_summary || ''} onChange={(e) => setProfileForm({...profileForm, profile_summary: e.target.value})} placeholder="Professional Summary" className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-sky-500 outline-none resize-none transition-colors" />
                   
                   <div className="p-3 md:p-4 bg-indigo-900/10 border border-indigo-500/30 rounded-xl space-y-3">
                       <h3 className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>Family & Private Narrative</h3>
                       <textarea rows={3} value={profileForm.family_narrative || ''} onChange={(e) => setProfileForm({...profileForm, family_narrative: e.target.value})} placeholder="Enter Family Details & Background Narrative here..." className="w-full bg-black border border-white/10 rounded-lg md:rounded-xl px-3 py-2 text-xs md:text-sm text-white focus:border-indigo-500 outline-none resize-none transition-colors" />
                   </div>

                   <button type="submit" className="w-full bg-white text-black font-bold text-xs md:text-sm py-2.5 md:py-3 rounded-lg md:rounded-xl hover:bg-slate-200 transition-colors">Sync Master Data</button>
                 </form>
               </div>
             </div>

             <div className="lg:col-span-2 space-y-6 md:space-y-8 relative z-10">
                <div className={`border border-white/10 ${editingNode ? 'bg-sky-900/10 border-sky-500/50' : 'bg-[#050505]/60'} backdrop-blur-2xl rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-5 md:space-y-6 shadow-xl transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                      <h2 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          {editingNode ? <><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Editing Mode</> : 'Add New Portfolio Entry'}
                      </h2>
                      {editingNode && <button type="button" onClick={cancelEdit} className="text-[10px] md:text-xs font-bold text-slate-400 hover:text-white transition-colors bg-white/5 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-white/10">Cancel Edit ✕</button>}
                  </div>
                  
                  <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 relative z-20">
                    <select value={itemForm.category} disabled={editingNode} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} className="md:col-span-2 bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors disabled:opacity-50">
                      <option value="projects">Engineering Projects</option>
                      <option value="experiences">Professional Experience</option>
                      <option value="education">Academic Qualifications</option>
                      <option value="certifications_and_achievements">Certifications & Awards</option>
                    </select>
                    
                    <div className="md:col-span-2 bg-black/40 p-4 md:p-5 rounded-xl md:rounded-2xl border border-dashed border-white/20 space-y-3 md:space-y-4">
                        <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div> Attach Visual Assets
                            </div>
                            <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-[9px] md:text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-lg transition-colors">
                                {isUploadingItemImg ? "Uploading..." : "+ Upload Image"}
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'item')} className="hidden" disabled={isUploadingItemImg} />
                            </label>
                        </label>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                            {itemForm.image_urls && itemForm.image_urls.length > 0 ? (
                                itemForm.image_urls.map((imgUrl, idx) => (
                                    <div key={idx} className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border border-white/20 group">
                                        <img src={imgUrl} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeUploadedImage(idx)} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] md:text-xs font-bold">Remove</button>
                                    </div>
                                ))
                            ) : <p className="text-[10px] md:text-xs text-slate-500 font-mono">No images attached yet.</p>}
                        </div>
                    </div>

                    <input type="text" placeholder="Title" value={itemForm.title} required onChange={(e) => setItemForm({...itemForm, title: e.target.value})} className="bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <input type="text" placeholder="Organization / Issuer" value={itemForm.organization_or_issuer} onChange={(e) => setItemForm({...itemForm, organization_or_issuer: e.target.value})} className="bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <input type="text" placeholder="Duration (e.g., 2023 - Present)" value={itemForm.duration_or_date} onChange={(e) => setItemForm({...itemForm, duration_or_date: e.target.value})} className="bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <input type="text" placeholder="Skills Mapped" value={itemForm.tag_or_skills_mapped} onChange={(e) => setItemForm({...itemForm, tag_or_skills_mapped: e.target.value})} className="bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <textarea rows={4} placeholder="Detailed Description Block (Public)" value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} className="md:col-span-2 bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-white outline-none focus:border-sky-500 resize-none transition-colors" />
                    
                    {/* HIDDEN README FIELD */}
                    <textarea rows={3} placeholder="Hidden Readme Context (Only for AI Brain)" value={itemForm.hidden_readme || ''} onChange={(e) => setItemForm({...itemForm, hidden_readme: e.target.value})} className="md:col-span-2 bg-sky-900/10 border border-sky-500/30 rounded-lg md:rounded-xl px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm text-sky-100 outline-none focus:border-sky-500 resize-none transition-colors" />

                    <div className="md:col-span-2 bg-black/40 p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/5 space-y-3 md:space-y-4">
                        <label className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Smart Links Configuration
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" placeholder="Label (e.g. GitHub)" value={tempLink.label} onChange={(e) => setTempLink({...tempLink, label: e.target.value})} className="flex-1 bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                            <input type="url" placeholder="URL Link" value={tempLink.url} onChange={(e) => setTempLink({...tempLink, url: e.target.value})} className="flex-[2] bg-black border border-white/10 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                            <button type="button" onClick={addSmartLink} className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl transition-colors">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {itemForm.smart_links && itemForm.smart_links.map((lnk, idx) => (
                                <span key={idx} className="flex items-center gap-2 bg-white/5 text-slate-200 text-[10px] md:text-xs font-semibold px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-white/10 group cursor-pointer" title="Click 'X' to remove">
                                    {lnk.label} <button type="button" onClick={() => removeSmartLink(idx)} className="text-red-400 hover:text-red-300 ml-1 font-bold group-hover:scale-125 transition-transform">✕</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className={`md:col-span-2 ${editingNode ? 'bg-amber-500 hover:bg-amber-400' : 'bg-sky-600 hover:bg-sky-500'} text-white font-bold text-xs md:text-sm py-3.5 md:py-4 rounded-lg md:rounded-xl transition-colors`}>
                        {editingNode ? "Save Edited Entry" : "Save New Entry"}
                    </button>
                  </form>
                </div>

                <div className="border border-white/10 bg-[#050505]/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-5 md:space-y-6 shadow-xl relative z-20">
                  <h2 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest flex items-center justify-between">
                      Manage Portfolio Content
                      <span className="text-[9px] md:text-[10px] text-slate-500">Edit / Remove</span>
                  </h2>
                  {['education', 'projects', 'experiences', 'certifications_and_achievements'].map((category) => {
                    if (!backendData || !backendData[category] || backendData[category].length === 0) return null;
                    return (
                      <div key={`manage-${category}`} className="space-y-2 md:space-y-3 pt-3 md:pt-4 border-t border-white/5">
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sky-500">{category.replace(/_/g, ' ')}</span>
                        <div className="space-y-2">
                          {backendData[category].map((node) => (
                            <div key={node.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black p-3 md:p-4 rounded-xl border border-white/5 group hover:border-sky-500/30 transition-colors gap-2 md:gap-3">
                              <div className="truncate w-full sm:max-w-[65%]">
                                  <p className="text-xs md:text-sm text-slate-200 font-bold truncate">{node.title}</p>
                                  <p className="text-[9px] md:text-[10px] text-slate-500 truncate font-mono">{node.organization_or_issuer}</p>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <button type="button" onClick={(e) => triggerEditNode(category, node, e)} className="flex-1 sm:flex-none text-amber-400 hover:text-white border border-amber-900/50 hover:bg-amber-900/50 px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors">Edit</button>
                                <button type="button" onClick={(e) => handleDeleteNode(category, node.id, e)} className="flex-1 sm:flex-none text-red-400 hover:text-white border border-red-900/50 hover:bg-red-900 px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-colors">Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
             </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 🚀 FIXED: FLOATING AI TOGGLE BUTTON WITH IMPRESSIVE CTA 🚀 */}
      {/* ========================================================= */}
      {!isChatOpen && currentView === 'portfolio' && (
         <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] flex items-center gap-3 md:gap-4 animate-fadeIn">
             <div className="flex bg-sky-500/10 border border-sky-500/30 text-sky-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold tracking-widest backdrop-blur-md shadow-[0_0_15px_rgba(14,165,233,0.3)] animate-pulse shadow-sky-500/20">
                 Talk to AI Twin →
             </div>
             <button onClick={() => setIsChatOpen(true)} className="bg-sky-600 hover:bg-sky-500 text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)] flex items-center justify-center transition-transform hover:scale-110 border border-white/20">
                 <span className="text-xl md:text-2xl">💬</span>
             </button>
         </div>
      )}

      {/* ========================================================= */}
      {/* 🚀 RESPONSIVE PREMIUM WIDGET (PC: Split View, Mobile: Fullscreen Fixed Top Avatar) 🚀 */}
      {/* ========================================================= */}
      <div className={`fixed z-[200] transform transition-all duration-300 flex flex-col bg-[#0a0a0a]/95 backdrop-blur-3xl 
          ${isChatOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 pointer-events-none translate-y-10'}
          /* MOBILE: Fullscreen Fixed Layout */
          inset-0 w-full h-full rounded-none overflow-hidden
          /* DESKTOP: Bottom Right Split Window */
          md:inset-auto md:bottom-10 md:right-10 md:w-[650px] md:h-[450px] md:border md:border-white/10 md:rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.9)]`}>
          
          {/* Header Row */}
          <div className="flex items-center justify-between p-3 md:p-3 border-b border-white/10 bg-[#111] flex-shrink-0 h-12 md:h-12 relative z-50">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                  <span className="text-[10px] md:text-xs font-bold text-white tracking-widest uppercase">Digital Twin Agent</span>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={toggleAudio} className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors border ${!isAudioEnabled ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                      {isAudioEnabled ? '🔊' : '🔇'}
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="flex items-center justify-center w-7 h-7 bg-white/5 hover:bg-red-500/80 text-white rounded-md transition-colors border border-white/10">
                      ✕
                  </button>
              </div>
          </div>
          
          {/* RESPONSIVE FLEX LAYOUT CONTAINER */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              
              {/* FIXED AVATAR AREA (Mobile: Top Fixed, Desktop: Left Side) */}
              {/* FIXED: Increased mobile height to 45vh and min-h to 300px for a prominent look */}
              <div className="w-full h-[45vh] min-h-[300px] md:w-[260px] md:h-full bg-black border-b md:border-b-0 md:border-r border-white/10 relative flex-shrink-0">
                  <video src={idleVideo} autoPlay loop muted playsInline className={`absolute w-full h-full object-cover object-top md:object-center transition-opacity duration-700 ${showIdle ? 'opacity-100' : 'opacity-0'}`} />
                  <video ref={thinkingRef} src={thinkingVideo} preload="none" loop={false} muted playsInline onEnded={handleThinkingEnded} className={`absolute w-full h-full object-cover object-top md:object-center transition-opacity duration-500 ${showThinking ? 'opacity-100' : 'opacity-0'}`} />
                  <video ref={speakingRef} src={speakingVideo} preload="none" loop={aiState === 'answering'} muted={aiState === 'answering'} playsInline onEnded={handleSpeakingEnded} className={`absolute w-full h-full object-cover object-top md:object-center transition-opacity duration-200 ${showSpeaking ? 'opacity-100' : 'opacity-0'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none z-10" />
              </div>

              {/* CHAT INTERFACE AREA (Fully Scrollable) */}
              <div className="flex-1 flex flex-col h-[calc(100vh-45vh-3rem)] md:h-full bg-[#050505]">
                  {/* Scrollable Log */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#050505]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {aiState === 'standby' && (
                          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 md:space-y-3 opacity-60">
                              <span className="text-2xl md:text-3xl">✨</span>
                              <p className="text-[10px] md:text-[11px] font-medium text-slate-300 leading-relaxed px-4">
                                  Digital Twin Offline.<br/>
                                  <span className="text-slate-500 text-[9px] md:text-[10px]">Tap 'Start Session' to initiate AI interaction.</span>
                              </p>
                          </div>
                      )}
                      {chatHistory.map((chat, idx) => (
                          <div key={idx} className={`max-w-[90%] rounded-xl p-3 text-[11px] md:text-[12px] leading-relaxed shadow-lg ${chat.role === 'user' ? 'bg-sky-600 text-white self-end rounded-br-sm ml-auto' : 'bg-[#151515] border border-white/5 text-slate-200 self-start rounded-bl-sm mr-auto'}`}>
                              {chat.text}
                          </div>
                      ))}
                      {['thinking', 'answering'].includes(aiState) && (
                          <div className="max-w-[85%] bg-[#151515] border border-white/5 text-slate-400 self-start rounded-xl p-2 md:p-3 text-[9px] md:text-[10px] rounded-bl-sm mr-auto flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse"></div> Receiving...
                          </div>
                      )}
                      <div ref={chatEndRef} />
                  </div>

                  {/* Input Block (Sticks to Bottom) */}
                  <div className="p-3 md:p-4 border-t border-white/10 bg-[#0a0a0a] flex-shrink-0">
                      {aiState === 'standby' ? (
                          <button onClick={startIntroSequence} className="w-full bg-sky-500 hover:bg-sky-400 text-black font-extrabold uppercase tracking-widest text-[11px] py-3.5 rounded-lg shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all">
                              Start Session
                          </button>
                      ) : (
                          <form onSubmit={triggerAiQuery} className="relative flex items-center">
                              <input type="text" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} disabled={['intro', 'thinking', 'answering'].includes(aiState)} placeholder="Ask Salik's Twin..." className="w-full bg-[#111] border border-white/10 focus:border-sky-500/50 rounded-lg pl-4 pr-12 py-3 text-xs text-white outline-none transition-all placeholder:text-slate-600 disabled:opacity-50" />
                              <button type="submit" disabled={!userQuery.trim() || ['intro', 'thinking', 'answering'].includes(aiState)} className="absolute right-1.5 w-8 h-8 rounded-md bg-sky-500/10 text-sky-400 flex items-center justify-center hover:bg-sky-500 hover:text-black transition-all disabled:opacity-0">
                                  <span className="font-bold text-base">↗</span>
                              </button>
                          </form>
                      )}
                  </div>
              </div>

          </div>
      </div>
      
    </div>
  );
}

export default App;