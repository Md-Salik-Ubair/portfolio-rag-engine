import React, { useState, useEffect } from 'react'

function App() {
  // Global View Navigation Matrix
  const [currentView, setCurrentView] = useState('portfolio') 
  const [backendData, setBackendData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Security Subsystem State
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // RAG AI Assistant Subsystem State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am the AI Representative of Md Salik Ubair. Ask me about his projects, experience, education, skills, or family matrix updates!' }
  ])
  const [isAiTyping, setIsAiTyping] = useState(false)

  // Admin Dashboard Component Form Input States
  const [coreForm, setCoreForm] = useState({
    full_name: '',
    professional_title: '',
    location: '',
    profile_summary: '',
    current_status: '',
    skills_list: '',       // Injected for skills mapping
    languages_known: '',   // Injected for language metrics
    family_narrative: ''   // Injected for dynamic parents details
  })

  const [socialForm, setSocialForm] = useState({
    email: '',
    linkedin: '',
    github: '',
    instagram: ''
  })

  const [itemForm, setItemForm] = useState({
    category: 'projects',
    title: '',
    organization_or_issuer: '',
    duration_or_date: '',
    description: '',
    tag_or_skills_mapped: '',
    external_redirection_link: ''
  })

  // Pulling state arrays dynamically from Python server
  const refreshPortfolioData = () => {
    setLoading(true)
    fetch('http://127.0.0.1:5000/api/portfolio/data')
      .then(res => res.json())
      .then(data => {
        setBackendData(data)
        if(data.profile_core) {
          setCoreForm({
            full_name: data.profile_core.full_name || '',
            professional_title: data.profile_core.professional_title || '',
            location: data.profile_core.location || '',
            profile_summary: data.profile_core.profile_summary || '',
            current_status: data.profile_core.current_status || '',
            skills_list: data.profile_core.skills_list || '',
            languages_known: data.profile_core.languages_known || '',
            family_narrative: data.family_meta?.summary || ''
          })
        }
        if(data.social_channels) {
          setSocialForm({
            email: data.social_channels.email || '',
            linkedin: data.social_channels.linkedin || '',
            github: data.social_channels.github || '',
            instagram: data.social_channels.instagram || ''
          })
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Connectivity breach to backend server:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    refreshPortfolioData()
  }, [])

  // Action: Validate Admin Credentials parameters via backend
  const executeLoginSubmit = (e) => {
    e.preventDefault()
    fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
      if(data.success) {
        setIsAuthenticated(true)
        alert(data.message)
      } else {
        alert("Breech Rejected: " + data.error)
      }
    })
    .catch(err => alert("Security terminal communication error: " + err))
  }

  // Action: Submit updated headers profile data nodes
  const handleCoreSubmit = (e) => {
    e.preventDefault()
    fetch('http://127.0.0.1:5000/api/portfolio/update-core', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coreForm)
    })
    .then(res => res.json())
    .then(resData => {
      if(resData.success) {
        alert("Dynamic metrics securely locked in the core store!")
        refreshPortfolioData()
      }
    })
    .catch(err => alert("Transmission fault: " + err))
  }

  // Action: Submit external social anchor channels links
  const handleSocialsSubmit = (e) => {
    e.preventDefault()
    fetch('http://127.0.0.1:5000/api/portfolio/update-socials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(socialForm)
    })
    .then(res => res.json())
    .then(resData => {
      if(resData.success) {
        alert("Social channels links synchronized securely!")
        refreshPortfolioData()
      }
    })
    .catch(err => alert(err))
  }

  // Action: Append new array item node securely
  const handleItemSubmit = (e) => {
    e.preventDefault()
    fetch(`http://127.0.0.1:5000/api/portfolio/item/${itemForm.category}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemForm)
    })
    .then(res => res.json())
    .then(resData => {
      if(resData.success) {
        alert(`Successfully linked dynamic asset node inside ${itemForm.category}!`)
        setItemForm({
          category: itemForm.category,
          title: '',
          organization_or_issuer: '',
          duration_or_date: '',
          description: '',
          tag_or_skills_mapped: '',
          external_redirection_link: ''
        })
        refreshPortfolioData()
      }
    })
    .catch(err => alert(err))
  }

  // Action: Delete custom tracking asset components
  const handleDeleteNode = (category, id) => {
    if(!window.confirm("Purge selected data node permanently from network registry?")) return
    fetch(`http://127.0.0.1:5000/api/portfolio/item/${category}/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(resData => { if(resData.success) refreshPortfolioData() })
    .catch(err => console.error(err))
  }

  // Core AI Network Integration Engine
  const fireAiQuery = (questionText) => {
    if(!questionText.trim()) return

    const userMsg = { role: 'user', text: questionText }
    setChatHistory(prev => [...prev, userMsg])
    setIsAiTyping(true)

    fetch('http://127.0.0.1:5000/api/rag/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: questionText })
    })
    .then(res => res.json())
    .then(data => {
      setChatHistory(prev => [...prev, { role: 'ai', text: data.ai_response }])
      setIsAiTyping(false)
    })
    .catch(err => {
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Error interacting with AI brain pipeline.' }])
      setIsAiTyping(false)
    })
  }

  const handleChatRequest = (e) => {
    e.preventDefault()
    if(!chatQuestion.trim()) return
    fireAiQuery(chatQuestion)
    setChatQuestion('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500/30">
      {/* NAVBAR */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-sm tracking-widest text-slate-400">CORE.ENGINE.ACTIVE</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('portfolio')} className={`px-4 py-1.5 text-xs font-bold rounded-md tracking-wide transition-all ${currentView === 'portfolio' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'}`}>📂 PORTFOLIO SPACE</button>
          <button onClick={() => setCurrentView('admin-hub')} className={`px-4 py-1.5 text-xs font-bold rounded-md tracking-wide transition-all ${currentView === 'admin-hub' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'}`}>🔒 ADMIN CONTROL HUB</button>
        </div>
      </nav>

      {/* MAIN CONTENT DISPLAY */}
      <main className="max-w-7xl mx-auto p-6 md:p-12 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-3">
            <div className="h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-500 tracking-wider">SYNCING CORE MODEL STRATAS...</p>
          </div>
        ) : currentView === 'portfolio' ? (
          
          /* ==========================================================
             VIEW 1: PORTFOLIO PUBLIC PRESENTATION LAYER
             ========================================================== */
          <div className="space-y-12 animate-fadeIn">
            {/* Header Identity Canvas */}
            <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-8 md:p-12 space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  {backendData?.profile_core?.full_name || "Anonymous Architecture Grid"}
                </h1>
                <p className="text-lg text-cyan-400/90 font-mono tracking-wide">
                  {backendData?.profile_core?.professional_title || "Engineering Title Unallocated"}
                </p>
              </div>

              {/* Dynamic Coordinate Anchors (Social Links Badging) */}
              <div className="flex flex-wrap gap-3 text-xs font-mono">
                {backendData?.social_channels?.email && <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-md text-slate-300">📧 {backendData.social_channels.email}</span>}
                {backendData?.social_channels?.linkedin && <a href={backendData.social_channels.linkedin} target="_blank" rel="noreferrer" className="bg-blue-950/30 border border-blue-900/40 px-3 py-1 rounded-md text-blue-400 hover:underline">💼 LinkedIn ↗</a>}
                {backendData?.social_channels?.github && <a href={backendData.social_channels.github} target="_blank" rel="noreferrer" className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-md text-slate-200 hover:underline">🐙 GitHub ↗</a>}
                {backendData?.social_channels?.instagram && <a href={backendData.social_channels.instagram} target="_blank" rel="noreferrer" className="bg-rose-950/20 border border-rose-900/30 px-3 py-1 rounded-md text-rose-400 hover:underline">📸 Instagram ↗</a>}
              </div>

              <div className="h-px bg-slate-900" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400 font-mono">
                <p>📍 Location: <span className="text-slate-200 font-sans font-medium">{backendData?.profile_core?.location || "Not Provided"}</span></p>
                <p>⚡ Status: <span className="text-slate-200 font-sans font-medium">{backendData?.profile_core?.current_status || "Not Provided"}</span></p>
              </div>
              <p className="text-slate-300 text-base leading-relaxed whitespace-pre-line">
                {backendData?.profile_core?.profile_summary || "Empty blueprint canvas active. Execute login to supply functional context tokens."}
              </p>
            </div>

            {/* TECHNICAL SKILLS MATRIX & LANGUAGES HUB */}
            {(backendData?.profile_core?.skills_list || backendData?.profile_core?.languages_known) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {backendData?.profile_core?.skills_list && (
                  <div className="md:col-span-2 border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-3">
                    <h3 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">// Technical Skill Vectors</h3>
                    <div className="flex flex-wrap gap-2">
                      {backendData.profile_core.skills_list.split(',').map((skill, index) => (
                        <span key={index} className="bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 font-mono text-xs px-2.5 py-1 rounded-md">{skill.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
                {backendData?.profile_core?.languages_known && (
                  <div className="md:col-span-1 border border-slate-900 bg-slate-900/20 rounded-xl p-6 space-y-3">
                    <h3 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">// Languages Known</h3>
                    <div className="flex flex-wrap gap-2">
                      {backendData.profile_core.languages_known.split(',').map((lang, index) => (
                        <span key={index} className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs px-2.5 py-1 rounded-md">{lang.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MAIN PORTFOLIO MODULE ARRAYS MAP */}
            {['education', 'projects', 'experiences', 'certifications_and_achievements'].map((sec) => (
              <div key={sec} className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 font-mono border-b border-slate-900 pb-2">// {sec.replace(/_/g, ' ')}</h2>
                {(!backendData || !backendData[sec] || backendData[sec].length === 0) ? (
                  <p className="text-xs text-slate-600 font-mono italic pl-2">No components committed inside this tracking node array.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {backendData[sec].map((item) => (
                      <div key={item.id} className="border border-slate-900 bg-slate-900/20 rounded-xl p-6 flex flex-col justify-between border-t-2 border-t-slate-800 hover:border-cyan-500/20 transition-all">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-base font-extrabold text-slate-100 tracking-tight">{item.title}</h3>
                            <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400 whitespace-nowrap">{item.duration_or_date}</span>
                          </div>
                          <p className="text-xs font-bold text-cyan-400 font-mono">{item.organization_or_issuer}</p>
                          <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                        </div>
                        {item.external_redirection_link && (
                          <a href={item.external_redirection_link} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors">⚡ VERIFY CREDENTIAL URL ↗</a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* FAMILY META TIMELINE VIEW LAYER */}
            {backendData?.family_meta?.summary && (
              <div className="border border-dashed border-slate-900 bg-slate-900/5 rounded-2xl p-6 md:p-8 space-y-3">
                <h3 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">// Personal Ancestry & Rental Core Timeline</h3>
                <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line font-sans">{backendData.family_meta.summary}</p>
              </div>
            )}
          </div>
        ) : !isAuthenticated ? (
          
          /* ==========================================================
             VIEW 2: SECURITY BARRIER ENFORCER LOGIN PROMPT CARD
             ========================================================== */
          <div className="max-w-md mx-auto my-12 border border-slate-900 bg-slate-900/40 rounded-2xl p-8 space-y-6 shadow-2xl border-t-2 border-t-rose-500/30 backdrop-blur">
            <div className="text-center space-y-1">
              <div className="mx-auto w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">🔒</div>
              <h2 className="text-lg font-black tracking-tight text-slate-100">Root Subsystem Verification</h2>
              <p className="text-xs text-slate-500 font-mono">Authentication required to access configuration blocks.</p>
            </div>
            <form onSubmit={executeLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Username</label>
                <input type="text" value={username} required onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 transition-colors font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider uppercase text-slate-400">Master Password Signature</label>
                <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 transition-colors font-mono" />
              </div>
              <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-xs py-3 rounded-lg tracking-widest uppercase transition-colors">EXECUTE SECURE AUTH CONNECTION</button>
            </form>
          </div>
        ) : (
          
          /* ==========================================================
             VIEW 3: SECURE CONTROL HUD PANEL CONTROL FORMS
             ========================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            {/* Left Column Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-slate-900 bg-slate-900/30 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-black text-slate-200">System Identity Core</h2>
                <form onSubmit={handleCoreSubmit} className="space-y-4">
                  {['full_name', 'professional_title', 'location', 'current_status', 'skills_list', 'languages_known'].map((field) => (
                    <div key={field} className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">{field.replace(/_/g, ' ')}</label>
                      <input type="text" value={coreForm[field]} placeholder={field === 'skills_list' ? 'Python, OpenCV, MLOps' : ''} onChange={(e) => setCoreForm({...coreForm, [field]: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono" />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Profile Narrative Summary</label>
                    <textarea rows={3} value={coreForm.profile_summary} onChange={(e) => setCoreForm({...coreForm, profile_summary: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none font-sans text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Parents & Family Personal Narrative Summary</label>
                    <textarea rows={3} value={coreForm.family_narrative} placeholder="Details regarding rental management or parental roots..." onChange={(e) => setCoreForm({...coreForm, family_narrative: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none font-sans text-xs" />
                  </div>
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs py-2 rounded-lg transition-colors">⚡ COMMIT IDENTITY MATRIX</button>
                </form>
              </div>

              {/* Social Channels Configurator Box */}
              <div className="border border-slate-900 bg-slate-900/30 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-slate-200 font-mono">// Redirection Links</h2>
                <form onSubmit={handleSocialsSubmit} className="space-y-4">
                  {['email', 'linkedin', 'github', 'instagram'].map((sField) => (
                    <div key={sField} className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase text-slate-400">{sField}</label>
                      <input type="text" value={socialForm[sField]} onChange={(e) => setSocialForm({...socialForm, [sField]: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono" />
                    </div>
                  ))}
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs py-2 rounded-lg transition-colors">🔗 SYNC REDIRECT CHANNELS</button>
                </form>
              </div>
            </div>

            {/* Right Column Grid Appenders */}
            <div className="lg:col-span-2 space-y-8">
              <div className="border border-slate-900 bg-slate-900/30 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-black text-slate-200">Inject Component Nodes</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">Appends structured blocks directly into arrays lists.</p>
                </div>
                <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Target Matrix Selection</label>
                    <select value={itemForm.category} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-500">
                      <option value="projects">Projects Repository Block</option>
                      <option value="experiences">Professional Experience Record</option>
                      <option value="education">Educational Qualifications Subsystem</option>
                      <option value="certifications_and_achievements">Certifications & Achievements Grid</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Title / Degree Core</label>
                    <input type="text" value={itemForm.title} required onChange={(e) => setItemForm({...itemForm, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Issuer / Association Hub</label>
                    <input type="text" value={itemForm.organization_or_issuer} onChange={(e) => setItemForm({...itemForm, organization_or_issuer: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Duration Timeline stamp</label>
                    <input type="text" value={itemForm.duration_or_date} placeholder="e.g., 2022 - 2026 / May 2025" onChange={(e) => setItemForm({...itemForm, duration_or_date: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Technical Tags / Scores Mapped</label>
                    <input type="text" value={itemForm.tag_or_skills_mapped} placeholder="e.g., OpenCV / CGPA: 8.9" onChange={(e) => setItemForm({...itemForm, tag_or_skills_mapped: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Verification Redirect Reference URL Link</label>
                    <input type="url" value={itemForm.external_redirection_link} placeholder="https://github.com/..." onChange={(e) => setItemForm({...itemForm, external_redirection_link: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Contextual Component Description</label>
                    <textarea rows={3} value={itemForm.description} onChange={(e) => setItemForm({...itemForm, description: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none font-sans text-xs" />
                  </div>
                  <button type="submit" className="md:col-span-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-xs py-3 rounded-lg tracking-widest uppercase transition-colors">➕ BIND NEW NODE TO STREAM</button>
                </form>
              </div>

              {/* Secure Purge Real-time Review Terminal Node */}
              <div className="border border-slate-900 bg-slate-900/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-mono tracking-wider text-slate-500">// LIVE ACTIVE INDEX (MANUAL NODES PURGING)</h3>
                {['education', 'projects', 'experiences', 'certifications_and_achievements'].map((category) => (
                  <div key={category} className="space-y-2">
                    <span className="text-[10px] font-mono tracking-widest font-bold uppercase text-slate-500">{category}</span>
                    {(!backendData || !backendData[category] || backendData[category].length === 0) ? (
                      <p className="text-xs text-slate-700 font-mono italic pl-2">No active vectors committed.</p>
                    ) : (
                      <div className="space-y-1.5 pl-2">
                        {backendData[category].map((node) => (
                          <div key={node.id} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-900 text-xs font-mono">
                            <span className="text-slate-300">{node.title}</span>
                            <button onClick={() => handleDeleteNode(category, node.id)} className="text-rose-500 hover:text-slate-100 border border-rose-500/20 px-2 py-0.5 rounded bg-rose-500/5 text-[10px] font-sans font-bold transition-all">PURGE</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING COMPONENT: INTERACTIVE RAG CHAT BUBBLE HUB */}
      <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end gap-3">
        {!isChatOpen && (
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-xl animate-bounce relative border border-cyan-300/30 whitespace-nowrap">
            ✨ Ask Salik's AI Brain Live!
            <div className="w-2 h-2 bg-blue-600 rotate-45 absolute -bottom-1 right-5" />
          </div>
        )}

        {isChatOpen ? (
          <div className="w-80 md:w-96 h-[480px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border-t-2 border-t-cyan-500 animate-fadeIn">
            <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">AI Representative Matrix</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-500 hover:text-slate-300 font-mono text-sm">✕</button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/50">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-950 text-slate-300 border border-slate-800'}`}>{msg.text}</div>
                </div>
              ))}
              {isAiTyping && <div className="flex justify-start"><div className="bg-slate-950 border border-slate-800 text-slate-500 text-[10px] font-mono rounded-xl px-3 py-2 animate-pulse">AI BRAIN EVALUATING DATA MATRIX...</div></div>}
            </div>

            <div className="px-3 py-2 bg-slate-950/40 border-t border-slate-900 flex flex-wrap gap-1.5 justify-start">
              <button type="button" onClick={() => fireAiQuery("What technical projects have you built?")} className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 text-[10px] px-2 py-1 rounded transition-colors font-mono">📁 Projects?</button>
              <button type="button" onClick={() => fireAiQuery("Tell me about your internship experience")} className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 text-[10px] px-2 py-1 rounded transition-colors font-mono">💼 Internships?</button>
              <button type="button" onClick={() => fireAiQuery("Where are you located?")} className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-400 text-[10px] px-2 py-1 rounded transition-colors font-mono">📍 Location?</button>
            </div>

            <form onSubmit={handleChatRequest} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input type="text" value={chatQuestion} onChange={(e) => setChatQuestion(e.target.value)} placeholder="Ask about AI, internships, location..." className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500" />
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs px-3 rounded-lg transition-colors">SEND</button>
            </form>
          </div>
        ) : (
          <button onClick={() => setIsChatOpen(true)} className="h-12 w-12 rounded-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shadow-2xl transition-all border border-cyan-400/20 hover:scale-105">💬</button>
        )}
      </div>
    </div>
  )
}

export default App