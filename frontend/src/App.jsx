import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; 

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
  const [currentView, setCurrentView] = useState('portfolio'); 
  const [backendData, setBackendData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // AI Chat Interface
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Welcome to Md Salik Ubair\'s AI Assistant. You can ask me about his projects, technical skills, experience, or contact details.' }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Admin Forms
  const [profileForm, setProfileForm] = useState({
    full_name: '', professional_title: '', location: '', profile_summary: '', current_status: '',
    skills_list: '', languages_known: '', phone_number: '', whatsapp_link: '', family_narrative: ''   
  });

  const [socialForm, setSocialForm] = useState({
    email: '', linkedin: '', github: '', instagram: ''
  });

  const [itemForm, setItemForm] = useState({
    category: 'projects', title: '', organization_or_issuer: '', duration_or_date: '',
    description: '', tag_or_skills_mapped: '', external_redirection_link: ''
  });

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
            family_narrative: data.family_meta?.summary || ''
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

  // --- API HANDLERS ---
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

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    alert("Initiating Data Transfer... Please wait up to 50 seconds if the server is waking up.");

    fetch('https://salik-portfolio-backend.onrender.com/api/portfolio/update-core', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm)
    })
    .then(res => res.json())
    .then(resData => {
      if (resData.success) {
        fetch('https://salik-portfolio-backend.onrender.com/api/portfolio/update-family', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: profileForm.family_narrative })
        })
        .then(res => res.json())
        .then(() => { 
            alert("✅ Profile Core & Background Matrix saved successfully in MongoDB."); 
            refreshPortfolioData(); 
        })
        .catch(err => alert("⚠️ Family data link failed: " + err));
      } else {
        alert("❌ Core update failed: " + resData.error);
      }
    })
    .catch(err => {
        alert("⚠️ Backend Connection Delayed. Render server might be waking up. Try again in 30 seconds. Error: " + err);
    });
  };

  const handleSocialsSubmit = (e) => {
    e.preventDefault();
    fetch('https://salik-portfolio-backend.onrender.com/api/portfolio/update-socials', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(socialForm)
    }).then(res => res.json()).then(resData => {
      if (resData.success) { alert("Social links saved."); refreshPortfolioData(); }
    });
  };

  const handleItemSubmit = (e) => {
    e.preventDefault();
    fetch(`https://salik-portfolio-backend.onrender.com/api/portfolio/item/${itemForm.category}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itemForm)
    }).then(res => res.json()).then(resData => {
      if (resData.success) {
        alert("Item published successfully.");
        setItemForm({ ...itemForm, title: '', organization_or_issuer: '', duration_or_date: '', description: '', tag_or_skills_mapped: '', external_redirection_link: '' });
        refreshPortfolioData();
      }
    });
  };

  const handleDeleteNode = (category, id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    fetch(`https://salik-portfolio-backend.onrender.com/api/portfolio/item/${category}/${id}`, { method: 'DELETE' })
    .then(res => res.json()).then(resData => { if (resData.success) refreshPortfolioData(); });
  };

  const handleAiQuery = (questionText) => {
    if (!questionText.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', text: questionText }]);
    setIsAiTyping(true);

    fetch('https://salik-portfolio-backend.onrender.com/api/rag/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: questionText })
    }).then(res => res.json()).then(data => {
      setChatHistory(prev => [...prev, { role: 'ai', text: data.ai_response || "Sorry, I couldn't process that." }]);
      setIsAiTyping(false);
    }).catch(() => {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Network error. Please try again.' }]);
      setIsAiTyping(false);
    });
  };

  const triggerChatRequest = (e) => {
    e.preventDefault();
    if (!chatQuestion.trim()) return;
    handleAiQuery(chatQuestion);
    setChatQuestion('');
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 font-sans antialiased selection:bg-sky-500/20 relative">

      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* NAVBAR */}
      <nav className="border-b border-slate-800/60 bg-[#000000]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-semibold text-sm tracking-wide text-slate-200">Md Salik Ubair <span className="text-sky-500">Portfolio</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('portfolio')} className={`text-sm font-medium transition-colors ${currentView === 'portfolio' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>View Profile</button>
          <button onClick={() => setCurrentView('admin-hub')} className={`text-sm font-medium transition-colors ${currentView === 'admin-hub' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'}`}>Admin Hub</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8 pb-32 relative z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="h-6 w-6 border-2 border-t-transparent border-sky-400 rounded-full animate-spin" />
            <p className="text-sm text-slate-400 tracking-wide">Loading Database...</p>
          </div>
        ) : currentView === 'portfolio' ? (
          
          /* VIEW 1: PREMIUM PORTFOLIO */
          <div className="space-y-12 animate-fadeIn">
            {/* HERO SECTION */}
            <div className="border border-slate-800 bg-slate-900/20 rounded-3xl p-8 md:p-12 space-y-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-sky-500" />
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                  {backendData?.profile_core?.full_name || "Profile Not Setup"}
                </h1>
                <p className="text-lg md:text-xl text-sky-400 font-medium">
                  {backendData?.profile_core?.professional_title || "Update your title in Admin Hub"}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {backendData?.profile_core?.phone_number && <span className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-slate-300 flex items-center">📞 {backendData.profile_core.phone_number}</span>}
                {backendData?.profile_core?.whatsapp_link && <a href={backendData.profile_core.whatsapp_link} target="_blank" rel="noreferrer" className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-emerald-400 hover:border-emerald-500 transition-colors flex items-center">💬 WhatsApp Me</a>}
                {backendData?.social_channels?.email && <a href={`mailto:${backendData.social_channels.email}`} className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-slate-300 hover:text-sky-400 transition-colors flex items-center">📧 Email</a>}
                {backendData?.social_channels?.linkedin && <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-slate-300 hover:text-sky-400 transition-colors flex items-center">LinkedIn ↗</a>}
                {backendData?.social_channels?.github && <a href={backendData.social_channels.github} target="_blank" rel="noreferrer" className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-lg text-slate-300 hover:text-sky-400 transition-colors flex items-center">GitHub ↗</a>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <p>📍 Location: <span className="text-slate-200">{backendData?.profile_core?.location || "-"}</span></p>
                <p>⚡ Status: <span className="text-slate-200">{backendData?.profile_core?.current_status || "-"}</span></p>
              </div>
              
              {backendData?.profile_core?.profile_summary && (
                <p className="text-slate-300 text-base leading-relaxed font-medium whitespace-pre-line border-l-2 border-slate-700 pl-6 py-2">
                  {backendData.profile_core.profile_summary}
                </p>
              )}
            </div>

            {/* SKILLS MATRIX */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 border border-slate-800 bg-slate-900/10 rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-white tracking-wide">Technical Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {backendData?.profile_core?.skills_list ? (
                    backendData.profile_core.skills_list.split(',').filter(s => s.trim() !== "").map((skill, index) => (
                      <span key={`skill-${index}`} className="bg-slate-900 border border-slate-700 text-sky-100 text-sm px-4 py-1.5 rounded-full shadow-sm hover:border-sky-500 transition-colors">{skill.trim()}</span>
                    ))
                  ) : <span className="text-sm text-slate-500">No skills mapped.</span>}
                </div>
              </div>
              <div className="md:col-span-1 border border-slate-800 bg-slate-900/10 rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-white tracking-wide">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {backendData?.profile_core?.languages_known ? (
                    backendData.profile_core.languages_known.split(',').filter(l => l.trim() !== "").map((lang, index) => (
                      <span key={`lang-${index}`} className="bg-slate-900 border border-slate-700 text-slate-300 text-sm px-4 py-1.5 rounded-full">{lang.trim()}</span>
                    ))
                  ) : <span className="text-sm text-slate-500">No languages mapped.</span>}
                </div>
              </div>
            </div>

            {/* DYNAMIC LISTS */}
            {['experiences', 'projects', 'education', 'certifications_and_achievements'].map((sec) => {
              if (!backendData || !backendData[sec] || backendData[sec].length === 0) return null;
              
              const displayTitle = sec.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={sec} className="space-y-6">
                  <h2 className="text-2xl font-bold text-white border-b border-slate-800 pb-4">{displayTitle}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {backendData[sec].map((item) => (
                      <div key={item.id} className="border border-slate-800 bg-slate-900/20 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-900/50 transition-colors">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg font-bold text-white">{item.title}</h3>
                            <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-300 whitespace-nowrap">{item.duration_or_date}</span>
                          </div>
                          <p className="text-sm font-semibold text-sky-400">{item.organization_or_issuer}</p>
                          {item.tag_or_skills_mapped && <p className="text-xs text-slate-500 font-mono">Skills: {item.tag_or_skills_mapped}</p>}
                          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{item.description}</p>
                        </div>
                        {item.external_redirection_link && (
                          <a href={item.external_redirection_link} target="_blank" rel="noreferrer" className="mt-6 inline-block text-sm font-medium text-sky-500 hover:text-sky-400 transition-colors">View Resource ↗</a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* FAMILY BACKGROUND */}
            {backendData?.family_meta?.summary && (
              <div className="border border-slate-800 bg-slate-900/10 rounded-2xl p-8 space-y-4">
                <h3 className="text-lg font-bold text-white tracking-wide">Personal Background & Origin</h3>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{backendData.family_meta.summary}</p>
              </div>
            )}
          </div>
        ) : !isAuthenticated ? (
          
          /* VIEW 2: LOGIN */
          <div className="max-w-md mx-auto my-20 border border-slate-800 bg-slate-900/30 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Admin Terminal</h2>
              <p className="text-sm text-slate-400">Authenticate to access portfolio settings.</p>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Username</label>
                <input type="text" value={username} required onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Master Password</label>
                <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" />
              </div>
              <button type="submit" className="w-full bg-white text-black hover:bg-slate-200 font-bold text-sm py-3.5 rounded-xl transition-colors mt-2">Authorize</button>
            </form>
          </div>
        ) : (
          
          /* VIEW 3: ADMIN HUB */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            <div className="lg:col-span-1 space-y-8">
              <div className="border border-slate-800 bg-slate-900/20 rounded-3xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-white">Profile Control</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {['full_name', 'professional_title', 'location', 'current_status', 'phone_number', 'whatsapp_link', 'skills_list', 'languages_known'].map((field) => (
                    <div key={field} className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 capitalize">{field.replace(/_/g, ' ')}</label>
                      <input type="text" value={profileForm[field] || ''} onChange={(e) => setProfileForm({...profileForm, [field]: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" placeholder={field === 'skills_list' ? 'React, Python, Node (comma separated)' : ''} />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Professional Summary</label>
                    <textarea rows={4} value={profileForm.profile_summary || ''} onChange={(e) => setProfileForm({...profileForm, profile_summary: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Family Background Summary</label>
                    <textarea rows={3} value={profileForm.family_narrative || ''} onChange={(e) => setProfileForm({...profileForm, family_narrative: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
                  </div>
                  <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors">Commit Core Data</button>
                </form>
              </div>

              <div className="border border-slate-800 bg-slate-900/20 rounded-3xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-white">Digital Channels</h2>
                <form onSubmit={handleSocialsSubmit} className="space-y-4">
                  {['email', 'linkedin', 'github', 'instagram'].map((sField) => (
                    <div key={sField} className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 capitalize">{sField}</label>
                      <input type="text" value={socialForm[sField] || ''} onChange={(e) => setSocialForm({...socialForm, [sField]: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500" />
                    </div>
                  ))}
                  <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors">Update Linkages</button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="border border-slate-800 bg-slate-900/20 rounded-3xl p-8 space-y-6">
                <h2 className="text-lg font-bold text-white">Publish Database Node</h2>
                <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-slate-400">Target Segment</label>
                    <select value={itemForm.category} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500">
                      <option value="projects">Engineering Projects</option>
                      <option value="experiences">Professional Experience</option>
                      <option value="education">Academic Qualifications</option>
                      <option value="certifications_and_achievements">Credentials & Awards</option>
                    </select>
                  </div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Primary Title</label><input type="text" value={itemForm.title} required onChange={(e) => setItemForm({...itemForm, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Organization / Issuer</label><input type="text" value={itemForm.organization_or_issuer} onChange={(e) => setItemForm({...itemForm, organization_or_issuer: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Timeline (e.g. May 2023 - Present)</label><input type="text" value={itemForm.duration_or_date} onChange={(e) => setItemForm({...itemForm, duration_or_date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-slate-400">Technology Stack Map</label><input type="text" value={itemForm.tag_or_skills_mapped} onChange={(e) => setItemForm({...itemForm, tag_or_skills_mapped: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500" /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-xs font-medium text-slate-400">External Verification Link</label><input type="url" value={itemForm.external_redirection_link} onChange={(e) => setItemForm({...itemForm, external_redirection_link: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500" /></div>
                  <div className="space-y-1.5 md:col-span-2"><label className="text-xs font-medium text-slate-400">Detailed Description Block</label><textarea rows={4} value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" /></div>
                  
                  <button type="submit" className="md:col-span-2 bg-white text-black hover:bg-slate-200 font-bold text-sm py-3.5 rounded-xl transition-colors">Inject Data Node</button>
                </form>
              </div>

              {/* Manage Existing Items */}
              <div className="border border-slate-800 bg-slate-900/20 rounded-3xl p-8 space-y-6">
                <h2 className="text-lg font-bold text-white">Active Database Records</h2>
                {['education', 'projects', 'experiences', 'certifications_and_achievements'].map((category) => {
                  if (!backendData || !backendData[category] || backendData[category].length === 0) return null;
                  return (
                    <div key={`manage-${category}`} className="space-y-3">
                      <span className="text-xs font-bold uppercase text-slate-500">{category.replace(/_/g, ' ')}</span>
                      <div className="space-y-2">
                        {backendData[category].map((node) => (
                          <div key={node.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm">
                            <span className="text-slate-300 font-medium truncate max-w-[80%]">{node.title}</span>
                            <button onClick={() => handleDeleteNode(category, node.id)} className="text-red-400 hover:text-white border border-red-900/50 hover:bg-red-900/30 px-3 py-1 rounded-lg text-xs transition-colors">Purge</button>
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

      {/* RAG MODEL CHAT HUD */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {!isChatOpen && (
          <div className="bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl shadow-sky-500/20 animate-bounce relative cursor-default">
            💬 Query AI Systems
            <div className="w-3 h-3 bg-sky-500 rotate-45 absolute -bottom-1 right-6" />
          </div>
        )}

        {isChatOpen ? (
          <div className="w-80 md:w-[420px] h-[550px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Core Intelligence
              </span>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-500 hover:text-white text-lg">✕</button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-black">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-br-none shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'}`}>
                    {msg.role === 'user' ? msg.text : <ReactMarkdown className="markdown-body font-sans text-sm prose-p:mb-2 prose-ul:list-disc prose-ul:ml-4 prose-strong:text-white prose-strong:font-bold prose-headings:text-sky-400 prose-headings:font-bold prose-headings:mb-2">{msg.text}</ReactMarkdown>}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-800 text-slate-500 text-xs rounded-2xl rounded-bl-none px-4 py-3 animate-pulse">Computing response...</div>
                </div>
              )}
            </div>

            <form onSubmit={triggerChatRequest} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input type="text" value={chatQuestion} onChange={(e) => setChatQuestion(e.target.value)} placeholder="Inquire about parameters..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors" />
              <button type="submit" className="bg-white hover:bg-slate-200 text-black font-bold text-sm px-5 rounded-xl transition-colors">Send</button>
            </form>
          </div>
        ) : (
          <button onClick={() => setIsChatOpen(true)} className="h-14 w-14 rounded-full bg-white text-black text-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform duration-200">🤖</button>
        )}
      </div>
    </div>
  );
}

export default App;