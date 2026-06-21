import React, { useState, useEffect } from 'react';
import avatarImg from './assets/avatar.jpg';

// ==========================================
// FULL CINEMATIC APP (DEEP & CONFIDENT VOICE OPTIMIZED)
// ==========================================
function App() {
  const [currentView, setCurrentView] = useState('portfolio'); 
  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // AI Chat & Voice Interface
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: "Hello! I am the AI representation of Md Salik Ubair. I can tell you all about his projects, skills, and experience. What would you like to know?" }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  // Voice & Animation States
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Upload & Edit States
  const [isUploading, setIsUploading] = useState(false);
  const [editingNode, setEditingNode] = useState(null); 

  // Admin Forms
  const [profileForm, setProfileForm] = useState({
    full_name: '', professional_title: '', location: '', profile_summary: '', current_status: '',
    skills_list: '', languages_known: '', phone_number: '', whatsapp_link: '', family_narrative: '',
    display_picture_url: '' 
  });

  const [socialForm, setSocialForm] = useState({
    email: '', linkedin: '', github: '', instagram: ''
  });

  const [itemForm, setItemForm] = useState({
    category: 'projects', title: '', organization_or_issuer: '', duration_or_date: '',
    description: '', tag_or_skills_mapped: '', external_redirection_link: '',
    smart_links: []
  });
  const [tempLink, setTempLink] = useState({ label: '', url: '' });

  const refreshPortfolioData = () => {
    fetch('https://salik-portfolio-backend.onrender.com/api/portfolio/data')
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
            display_picture_url: data.profile_core?.display_picture_url || ''
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
    fetch('https://salik-portfolio-backend.onrender.com/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(res => res.json()).then(data => {
      if (data.success) setIsAuthenticated(true);
      else alert("Login Failed: " + data.error);
    }).catch(() => alert("Server unreachable."));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const IMGBB_API_KEY = "67a2f496c1625f298a33f240d8366100"; 
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST', body: formData
      });
      const data = await res.json();
      if (data.success) {
        setProfileForm({ ...profileForm, display_picture_url: data.data.url });
        alert("✅ Photo Uploaded to Cloud Successfully! Please click 'Commit Profile Data' to save.");
      } else {
        alert("Upload Failed. Check API Key.");
      }
    } catch (err) {
      alert("Network Error during upload.");
    }
    setIsUploading(false);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    fetch('https://salik-portfolio-backend.onrender.com/api/portfolio/update-core', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm)
    })
    .then(res => res.json())
    .then(resData => {
      if (resData.success) {
        fetch('https://salik-portfolio-backend.onrender.com/api/portfolio/update-family', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: profileForm.family_narrative })
        })
        .then(() => { alert("✅ Profile Data Saved!"); refreshPortfolioData(); })
      }
    });
  };

  // SMART LINKS LOGIC
  const addSmartLink = (e) => {
    e.preventDefault();
    if (tempLink.label.trim() && tempLink.url.trim()) {
        setItemForm({ ...itemForm, smart_links: [...(itemForm.smart_links || []), tempLink] });
        setTempLink({ label: '', url: '' });
    }
  };
  
  const removeSmartLink = (index) => {
    const newLinks = [...(itemForm.smart_links || [])];
    newLinks.splice(index, 1);
    setItemForm({ ...itemForm, smart_links: newLinks });
  };

  // EDIT & DELETE LOGIC
  const triggerEditNode = (category, node) => {
    setEditingNode({ category, id: node.id });
    setItemForm({
        category: category,
        title: node.title || '',
        organization_or_issuer: node.organization_or_issuer || '',
        duration_or_date: node.duration_or_date || '',
        description: node.description || '',
        tag_or_skills_mapped: node.tag_or_skills_mapped || '',
        external_redirection_link: node.external_redirection_link || '',
        smart_links: node.smart_links || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingNode(null);
    setItemForm({
        category: 'projects', title: '', organization_or_issuer: '', duration_or_date: '',
        description: '', tag_or_skills_mapped: '', external_redirection_link: '', smart_links: []
    });
  };

  const handleItemSubmit = (e) => {
    e.preventDefault();
    const url = editingNode 
        ? `https://salik-portfolio-backend.onrender.com/api/portfolio/item/${editingNode.category}/${editingNode.id}`
        : `https://salik-portfolio-backend.onrender.com/api/portfolio/item/${itemForm.category}`;
    
    const method = editingNode ? 'PUT' : 'POST';

    fetch(url, {
      method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemForm)
    }).then(res => res.json()).then(resData => {
      if (resData.success) {
        alert(`Item ${editingNode ? 'updated' : 'published'} successfully.`);
        cancelEdit(); 
        refreshPortfolioData();
      } else {
        alert("Action failed: " + resData.error);
      }
    });
  };

  const handleDeleteNode = (category, id) => {
    if (!window.confirm("Are you sure you want to permanently delete this item?")) return;
    fetch(`https://salik-portfolio-backend.onrender.com/api/portfolio/item/${category}/${id}`, { method: 'DELETE' })
    .then(res => res.json()).then(resData => { if (resData.success) refreshPortfolioData(); });
  };

  // ==========================================
  // DEEP, POWERFUL & CONFIDENT VOICE ENGINE
  // ==========================================
  const stopAudio = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn("Speech API cancel ignored.");
    }
    setIsSpeaking(false);
  };

  const toggleMute = () => {
    setIsAudioEnabled(!isAudioEnabled);
    stopAudio();
  };

  const speakText = (text) => {
    if (!isAudioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      const safeText = String(text || "");
      const cleanText = safeText
        .replace(/[*#`]/g, '') 
        .replace(/\[(.*?)\]\(.*?\)/g, '$1'); 

      stopAudio(); 
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      
      // Targeting the deepest built-in voices available on the user's OS
      const preferredVoice = 
        voices.find(v => v.name.includes('Google UK English Male')) ||
        voices.find(v => v.name.includes('Mark')) || // Microsoft Mark is generally deeper
        voices.find(v => v.name.includes('David')) || 
        voices.find(v => (v.name.includes('India') || v.name.includes('en-IN')) && v.name.includes('Male')) ||
        voices.find(v => v.name.includes('Male')) ||
        voices[0];

      if (preferredVoice) utterance.voice = preferredVoice;

      // THE MAGIC TWEAKS FOR CONFIDENCE AND DEPTH
      utterance.rate = 0.92; // Slightly slower. Shows confidence and clarity.
      utterance.pitch = 0.7; // Lower pitch to make it sound heavier and more masculine.

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Audio playback error caught safely:", error);
      setIsSpeaking(false);
    }
  };

  const handleAiQuery = (questionText) => {
    if (!questionText.trim()) return;
    
    stopAudio(); 
    
    setChatHistory(prev => [...prev, { role: 'user', text: questionText }]);
    setIsAiTyping(true);

    fetch('https://salik-portfolio-backend.onrender.com/api/rag/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: questionText })
    }).then(res => res.json()).then(data => {
      const responseText = data.ai_response || "I couldn't fetch that information right now. Please try again.";
      setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]);
      setIsAiTyping(false);
      speakText(responseText); 
    }).catch(() => {
      const errorText = "It seems there's a network issue. Let's try that again in a moment.";
      setChatHistory(prev => [...prev, { role: 'ai', text: errorText }]);
      setIsAiTyping(false);
      speakText(errorText);
    });
  };

  const triggerChatRequest = (e) => {
    e.preventDefault();
    if (!chatQuestion.trim()) return;
    handleAiQuery(chatQuestion);
    setChatQuestion('');
  };

  const formatAiResponse = (rawText) => {
      const safeText = String(rawText || "");
      const cleaned = safeText.replace(/[*#`]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1 (Link Attached)');
      return cleaned.split('\n').map((line, idx) => (
          line.trim() ? <p key={idx} className="mb-2">{line}</p> : null
      ));
  };

  const activeAvatar = backendData?.profile_core?.display_picture_url || avatarImg;

  return (
    <div className="min-h-screen bg-[#020202] text-slate-100 font-sans antialiased overflow-x-hidden relative selection:bg-sky-500/30">
      
      {/* Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>

      {/* NAVBAR */}
      <nav className="fixed w-full border-b border-white/5 bg-black/50 backdrop-blur-2xl z-50 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-extrabold text-lg tracking-widest text-white drop-shadow-[0_0_10px_rgba(14,165,233,0.8)]">
            SALIK<span className="text-sky-500">.AI</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setCurrentView('portfolio')} className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${currentView === 'portfolio' ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}>Terminal</button>
          <button onClick={() => setCurrentView('admin-hub')} className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${currentView === 'admin-hub' ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}>System Hub</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8 pt-32 pb-32 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="h-10 w-10 border-2 border-t-transparent border-sky-400 rounded-full animate-spin" />
            <p className="text-xs text-sky-400/80 tracking-widest font-mono uppercase animate-pulse">Establishing Secure Uplink...</p>
          </div>
        ) : currentView === 'portfolio' ? (
          
          /* ================= VIEW 1: PORTFOLIO ================= */
          <div className="space-y-16 animate-fadeIn">
            
            {/* HERO SECTION */}
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 p-8 md:p-12 border border-white/10 bg-white/[0.02] rounded-[2.5rem] backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-sky-400 to-indigo-600" />
              
              <div className="flex-1 space-y-6 relative z-10">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white">
                  {backendData?.profile_core?.full_name || "Md Salik Ubair"}
                </h1>
                <p className="text-lg md:text-xl text-sky-400 font-medium tracking-wide border-l-2 border-indigo-500 pl-4">
                  {backendData?.profile_core?.professional_title || "Update title in Admin Hub"}
                </p>

                <div className="flex flex-wrap gap-3 text-sm mt-4">
                  {backendData?.profile_core?.phone_number && <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-slate-300">📞 {backendData.profile_core.phone_number}</span>}
                  {backendData?.profile_core?.whatsapp_link && <a href={backendData.profile_core.whatsapp_link} target="_blank" rel="noreferrer" className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors">💬 WhatsApp</a>}
                  {backendData?.social_channels?.linkedin && <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sky-400 hover:bg-white/10 transition-colors">LinkedIn ↗</a>}
                  {backendData?.social_channels?.github && <a href={backendData.social_channels.github} target="_blank" rel="noreferrer" className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">GitHub ↗</a>}
                </div>

                {backendData?.profile_core?.profile_summary && (
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl border-t border-white/5 pt-4 mt-4">
                        {backendData.profile_core.profile_summary}
                    </p>
                )}
              </div>

              {/* Dynamic Main Character Matrix (Reacts to Audio) */}
              <div className="relative w-72 h-72 md:w-[350px] md:h-[350px] flex-shrink-0">
                 {/* Outer slow ring */}
                 <div className="absolute inset-0 border-2 border-sky-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                 {/* Inner fast ring */}
                 <div className="absolute inset-4 border border-indigo-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                 
                 {/* THIS IS THE VOICE AURA: Turns ON when speaking */}
                 <div className={`absolute -inset-6 rounded-full blur-2xl transition-all duration-300 ${isSpeaking ? 'bg-sky-400/30 animate-pulse scale-110' : 'bg-sky-500/10'}`}></div>
                 
                 <div className={`absolute inset-6 rounded-full overflow-hidden border-2 transition-colors duration-300 ${isSpeaking ? 'border-sky-400 shadow-[0_0_60px_rgba(56,189,248,0.5)]' : 'border-white/10 bg-[#050505] shadow-[0_0_40px_rgba(0,0,0,0.8)]'}`}>
                    <img src={activeAvatar} alt="Main Character" onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400/050505/38bdf8?text=Image+Pending'; }} className={`w-full h-full object-cover transition-all duration-700 ${isSpeaking ? 'opacity-100 scale-105' : 'opacity-90 hover:opacity-100'}`} />
                 </div>
              </div>
            </div>

            {/* SKILLS & LANGUAGES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 space-y-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Technical Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {backendData?.profile_core?.skills_list ? (
                    backendData.profile_core.skills_list.split(',').filter(s => s.trim() !== "").map((skill, index) => (
                      <span key={index} className="bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium px-4 py-1.5 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.1)]">{skill.trim()}</span>
                    ))
                  ) : <span className="text-xs text-slate-600">No skills mapped.</span>}
                </div>
              </div>
              <div className="md:col-span-1 border border-white/10 bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 space-y-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {backendData?.profile_core?.languages_known ? (
                    backendData.profile_core.languages_known.split(',').filter(l => l.trim() !== "").map((lang, index) => (
                      <span key={index} className="bg-white/5 border border-white/10 text-slate-300 text-xs px-4 py-1.5 rounded-full">{lang.trim()}</span>
                    ))
                  ) : <span className="text-xs text-slate-600">No data.</span>}
                </div>
              </div>
            </div>

            {/* DYNAMIC LISTS RENDER */}
            {['experiences', 'projects', 'education', 'certifications_and_achievements'].map((sec) => {
              if (!backendData || !backendData[sec] || backendData[sec].length === 0) return null;
              const displayTitle = sec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={sec} className="space-y-6 relative">
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest border-b border-white/10 pb-4 flex items-center gap-3">
                     <div className="w-2 h-2 bg-sky-500 rounded-full" /> {displayTitle}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {backendData[sec].map((item) => (
                      <div key={item.id} className="group border border-white/10 bg-white/[0.02] backdrop-blur-md rounded-3xl p-8 hover:border-sky-500/50 hover:bg-white/[0.04] transition-all duration-300 shadow-xl flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">{item.title}</h3>
                            <span className="text-[10px] font-mono bg-white/10 px-3 py-1 rounded-full text-slate-300 whitespace-nowrap">{item.duration_or_date}</span>
                          </div>
                          <p className="text-sm font-semibold text-indigo-400">{item.organization_or_issuer}</p>
                          {item.tag_or_skills_mapped && <p className="text-[11px] text-slate-400 font-mono bg-black/40 inline-block px-2 py-1 rounded">Tech: {item.tag_or_skills_mapped}</p>}
                          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{item.description}</p>
                        </div>
                        
                        {/* SMART LINKS RENDER */}
                        <div className="mt-6 flex flex-wrap gap-3 pt-4 border-t border-white/5">
                          {item.smart_links && item.smart_links.length > 0 ? (
                            item.smart_links.map((link, idx) => (
                              <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 rounded-lg text-xs font-bold text-sky-400 hover:bg-sky-500/20 hover:scale-105 transition-all">
                                {link.label} ↗
                              </a>
                            ))
                          ) : item.external_redirection_link ? (
                            <a href={item.external_redirection_link} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-400 hover:text-sky-400 underline decoration-sky-500/30 underline-offset-4 transition-colors">View Resource ↗</a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !isAuthenticated ? (
          
          /* ================= VIEW 2: LOGIN ================= */
          <div className="max-w-md mx-auto my-32 border border-white/10 bg-[#050505]/80 rounded-[2rem] p-10 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500" />
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-2xl font-bold text-white tracking-tight">System Login</h2>
              <p className="text-xs font-mono text-slate-500">Authenticate for Master Control.</p>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <input type="text" value={username} required onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-sky-500 outline-none transition-colors" />
              <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-sky-500 outline-none transition-colors" />
              <button type="submit" className="w-full bg-white text-black hover:bg-slate-200 font-bold text-sm py-4 rounded-xl transition-colors mt-4">Authorize Access</button>
            </form>
          </div>
        ) : (
          
          /* ================= VIEW 3: ADMIN HUB ================= */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
             
             {/* PROFILE CONTROL */}
             <div className="lg:col-span-1 space-y-6">
               <div className="border border-white/10 bg-[#050505]/60 backdrop-blur-2xl rounded-3xl p-6 space-y-6 shadow-xl">
                 <h2 className="text-sm font-bold text-white uppercase tracking-widest">Profile Configuration</h2>
                 
                 {/* DIRECT IMAGE UPLOAD */}
                 <div className="p-4 border border-dashed border-white/20 rounded-2xl bg-white/[0.02] text-center space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-sky-500/30">
                        {profileForm.display_picture_url ? <img src={profileForm.display_picture_url} alt="DP" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-black flex items-center justify-center text-2xl">👤</div>}
                    </div>
                    <div>
                        <label className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors inline-block">
                            {isUploading ? "Uploading..." : "Upload New Photo"}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isUploading} />
                        </label>
                        <p className="text-[9px] text-slate-500 mt-2 font-mono">Direct Cloud Sync</p>
                    </div>
                 </div>

                 <form onSubmit={handleProfileSubmit} className="space-y-4">
                   {['full_name', 'professional_title', 'location', 'current_status', 'phone_number', 'whatsapp_link', 'skills_list', 'languages_known'].map((field) => (
                     <div key={field} className="space-y-1">
                       <label className="text-[10px] font-bold text-slate-500 uppercase">{field.replace(/_/g, ' ')}</label>
                       <input type="text" value={profileForm[field] || ''} onChange={(e) => setProfileForm({...profileForm, [field]: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500 outline-none transition-colors" />
                     </div>
                   ))}
                   <textarea rows={4} value={profileForm.profile_summary || ''} onChange={(e) => setProfileForm({...profileForm, profile_summary: e.target.value})} placeholder="Professional Summary" className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-sky-500 outline-none resize-none transition-colors" />
                   <button type="submit" className="w-full bg-white text-black font-bold text-sm py-3 rounded-xl hover:bg-slate-200 transition-colors">Commit Profile Data</button>
                 </form>
               </div>
             </div>

             <div className="lg:col-span-2 space-y-8">
                {/* PUBLISH / EDIT NODE FORM */}
                <div className={`border border-white/10 ${editingNode ? 'bg-sky-900/10 border-sky-500/50' : 'bg-[#050505]/60'} backdrop-blur-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-xl transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                          {editingNode ? <><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Editing Node Mode</> : 'Publish Data Node'}
                      </h2>
                      {editingNode && <button type="button" onClick={cancelEdit} className="text-xs font-bold text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">Cancel Edit ✕</button>}
                  </div>
                  
                  <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <select value={itemForm.category} disabled={editingNode} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} className="md:col-span-2 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-sky-500 transition-colors disabled:opacity-50">
                      <option value="projects">Engineering Projects</option>
                      <option value="experiences">Professional Experience</option>
                      <option value="education">Academic Qualifications</option>
                      <option value="certifications_and_achievements">Certifications & Awards</option>
                    </select>
                    <input type="text" placeholder="Title" value={itemForm.title} required onChange={(e) => setItemForm({...itemForm, title: e.target.value})} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <input type="text" placeholder="Organization / Issuer" value={itemForm.organization_or_issuer} onChange={(e) => setItemForm({...itemForm, organization_or_issuer: e.target.value})} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <input type="text" placeholder="Duration (e.g., 2023 - Present)" value={itemForm.duration_or_date} onChange={(e) => setItemForm({...itemForm, duration_or_date: e.target.value})} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <input type="text" placeholder="Skills Mapped (Comma separated)" value={itemForm.tag_or_skills_mapped} onChange={(e) => setItemForm({...itemForm, tag_or_skills_mapped: e.target.value})} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                    <textarea rows={4} placeholder="Detailed Description Block" value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} className="md:col-span-2 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-sky-500 resize-none transition-colors" />
                    
                    {/* SMART LINKS */}
                    <div className="md:col-span-2 bg-black/40 p-5 rounded-2xl border border-white/5 space-y-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Smart Links Configuration
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" placeholder="Label (e.g. GitHub)" value={tempLink.label} onChange={(e) => setTempLink({...tempLink, label: e.target.value})} className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                            <input type="url" placeholder="URL Link" value={tempLink.url} onChange={(e) => setTempLink({...tempLink, url: e.target.value})} className="flex-[2] bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-sky-500 transition-colors" />
                            <button type="button" onClick={addSmartLink} className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {itemForm.smart_links && itemForm.smart_links.map((lnk, idx) => (
                                <span key={idx} className="flex items-center gap-2 bg-white/5 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10">
                                    {lnk.label} <button type="button" onClick={() => removeSmartLink(idx)} className="text-red-400 hover:text-red-300 ml-1">✕</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className={`md:col-span-2 ${editingNode ? 'bg-amber-500 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-sky-600 hover:bg-sky-500 shadow-[0_0_20px_rgba(2,132,199,0.3)]'} text-white font-bold text-sm py-4 rounded-xl transition-colors`}>
                        {editingNode ? "Update Existing Node" : "Inject Node into Database"}
                    </button>
                  </form>
                </div>

                {/* ACTIVE DATABASE RECORDS */}
                <div className="border border-white/10 bg-[#050505]/60 backdrop-blur-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
                  <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center justify-between">
                      Active Data Nodes
                      <span className="text-[10px] text-slate-500">Manage Content</span>
                  </h2>
                  {['education', 'projects', 'experiences', 'certifications_and_achievements'].map((category) => {
                    if (!backendData || !backendData[category] || backendData[category].length === 0) return null;
                    return (
                      <div key={`manage-${category}`} className="space-y-3 pt-4 border-t border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500">{category.replace(/_/g, ' ')}</span>
                        <div className="space-y-2">
                          {backendData[category].map((node) => (
                            <div key={node.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black p-4 rounded-xl border border-white/5 group hover:border-sky-500/30 transition-colors gap-3">
                              <div className="truncate max-w-[70%]">
                                  <p className="text-sm text-slate-200 font-bold truncate">{node.title}</p>
                                  <p className="text-[10px] text-slate-500 truncate font-mono">{node.organization_or_issuer}</p>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button type="button" onClick={() => triggerEditNode(category, node)} className="flex-1 sm:flex-none text-amber-400 hover:text-white border border-amber-900/50 hover:bg-amber-900/50 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">Edit</button>
                                <button type="button" onClick={() => handleDeleteNode(category, node)} className="flex-1 sm:flex-none text-red-400 hover:text-white border border-red-900/50 hover:bg-red-900 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">Purge</button>
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

      {/* TESTING TERMINAL (Crash-Proof TTS) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {!isChatOpen && (
          <button onClick={() => setIsChatOpen(true)} className="group relative h-14 w-14 rounded-full bg-black border border-white/10 text-2xl flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.15)] hover:scale-105 hover:border-sky-500/50 transition-all">
            🤖
            <span className="absolute -top-10 right-0 bg-sky-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-wider uppercase shadow-xl">Query Agent</span>
          </button>
        )}

        {isChatOpen && (
          <div className="w-80 md:w-[420px] h-[550px] bg-[#020202]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-fadeIn">
            <div className="bg-white/[0.02] px-6 py-5 flex items-center justify-between border-b border-white/5">
              <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-white flex items-center gap-2 uppercase tracking-widest">
                    <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-sky-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} /> 
                    {isSpeaking ? 'AI is Speaking...' : 'AI Assistant Active'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">Pre-Avatar Integration Phase</span>
              </div>
              <div className="flex items-center gap-4">
                  {/* SAFE AUDIO TOGGLE BUTTON */}
                  <button type="button" onClick={toggleMute} className={`text-xs px-2 py-1 rounded border ${isAudioEnabled ? 'border-sky-500/50 text-sky-400 bg-sky-500/10' : 'border-slate-500/50 text-slate-500 bg-black'}`}>
                      {isAudioEnabled ? '🔊 ON' : '🔇 MUTE'}
                  </button>
                  <button type="button" onClick={() => setIsChatOpen(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3.5 text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-2xl rounded-br-sm' : 'bg-white/[0.04] border border-white/5 text-slate-300 rounded-2xl rounded-bl-sm font-light'}`}>
                    {/* NATIVE RENDERER USED HERE (No Markdown Crashes) */}
                    {msg.role === 'user' ? String(msg.text) : formatAiResponse(msg.text)}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] border border-white/5 text-sky-400 text-xs font-mono rounded-2xl rounded-bl-sm px-5 py-3 animate-pulse">Thinking...</div>
                </div>
              )}
            </div>

            <form onSubmit={triggerChatRequest} className="p-4 bg-black/50 border-t border-white/5 flex gap-2">
              <input type="text" value={chatQuestion} onChange={(e) => setChatQuestion(e.target.value)} placeholder="Ask anything about Salik..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" />
              <button type="submit" className="bg-white text-black hover:bg-slate-200 font-bold text-sm px-5 rounded-xl transition-colors">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;