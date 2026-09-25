import { useEffect, useState, type FormEvent } from 'react'
import GameHouse from './game/GameHouse'

type User = { id: string; display_name: string }
type Home = { id: string; name: string; timezone: string; role: 'admin' | 'member' }
type Member = { id: string; display_name: string; role: 'admin' | 'member' }
type Screen = 'loading' | 'welcome' | 'register' | 'login' | 'invited' | 'setup-credentials' | 'legacy-login' | 'choose-home' | 'create-home' | 'join-home' | 'home'

async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json() as { error?: string }
  if (!response.ok) throw new Error(data.error ?? 'No pudimos completar la acción.')
  return data as T
}

function getError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error. Probá de nuevo.'
}

function Logo() {
  return <img className="brand-logo" src="/brand/te-toca-logo.svg" alt="Te Toca" />
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [home, setHome] = useState<Home | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [personalKey, setPersonalKey] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [pendingInvite, setPendingInvite] = useState('')
  const [homeName, setHomeName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadHome() {
    const result = await api<{ home: Home | null; members: Member[] }>('/homes/current')
    setHome(result.home)
    setMembers(result.members)
    setScreen(result.home ? 'home' : 'choose-home')
  }

  useEffect(() => {
    api<{ user: User; needsCredentials:boolean }>('/auth/me')
      .then(async ({ user: current, needsCredentials }) => {
        setUser(current)
        if(needsCredentials)setScreen('setup-credentials')
        else await loadHome()
      })
      .catch(() => setScreen('welcome'))
  }, [])

  function show(next: Screen) {
    setError('')
    setPassword('')
    setShowPassword(false)
    setScreen(next)
  }

  async function perform(action: () => Promise<void>) {
    setError('')
    setBusy(true)
    try { await action() } catch (caught) { setError(getError(caught)) } finally { setBusy(false) }
  }

  async function finishAccount(invite = '') {
    if(invite) {
      const result=await api<{home:Home|null}>('/homes/current')
      if(!result.home) {
        try { await api('/homes/join','POST',{inviteCode:invite}) }
        catch(error) { setInviteInput(invite);show('join-home');throw error }
      }
    }
    setPendingInvite('')
    await loadHome()
  }

  function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const joining=screen==='invited'
    void perform(async()=>{
      const result=await api<{user:User}>('/auth/register','POST',{username,password})
      setUser(result.user);setPassword('')
      await finishAccount(joining?inviteInput:'')
    })
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform(async()=>{
      const result=await api<{user:User}>('/auth/login','POST',{username,password})
      setUser(result.user);setPassword('')
      await finishAccount(pendingInvite)
    })
  }

  function submitLegacy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform(async()=>{
      const result=await api<{user:User}>('/auth/legacy-login','POST',{accessCode:personalKey})
      setUser(result.user);setPersonalKey('');show('setup-credentials')
    })
  }

  function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform(async()=>{
      await api('/auth/credentials','POST',{username,password})
      setPassword('')
      await finishAccount(pendingInvite)
    })
  }

  function submitCreateHome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform(async () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      await api('/homes', 'POST', { name: homeName, timezone })
      await loadHome()
    })
  }

  function submitJoinHome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform(async () => {
      await api('/homes/join', 'POST', { inviteCode: inviteInput })
      setInviteInput('')
      await loadHome()
    })
  }

  function logout() {
    void perform(async () => {
      await api('/auth/logout', 'POST', {})
      setUser(null)
      setHome(null)
      setMembers([])
      setUsername('');setPassword('');setPersonalKey('');setPendingInvite('')
      show('welcome')
    })
  }

  const isAuthenticated = Boolean(user)

  if (screen === 'home' && home && user) {
    return <GameHouse home={home} user={user} members={members} onLogout={logout} authError={error} />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Logo />
        {isAuthenticated && <button className="text-button" type="button" onClick={logout} disabled={busy}>Salir</button>}
      </header>

      <main className="main-layout">
        <section className="hero" aria-label="Bienvenida a Te Toca">
          <div className="eyebrow"><span className="eyebrow-dot" /> Una casa compartida, turnos claros</div>
          <h1>La casa funciona mejor cuando <em>todos participan.</em></h1>
          <p className="hero-copy">Entrá con tu usuario, encontrá tu habitación y descubrí qué te toca hacer hoy.</p>
          <div className="house-art" aria-hidden="true">
            <div className="house-shadow" />
            <div className="house-roof" />
            <div className="house-body">
              <div className="room room-a"><span className="room-symbol">✦</span><span>Cocina</span></div>
              <div className="room room-b"><span className="room-symbol">◒</span><span>Baño</span></div>
              <div className="room room-c"><span className="room-symbol">✳</span><span>Habitación</span></div>
              <div className="room room-d"><span className="room-symbol">⌂</span><span>Común</span></div>
            </div>
            <div className="avatar avatar-one" /><div className="avatar avatar-two" />
          </div>
          <p className="hero-footnote">Tu casa, tus personas, sus tareas. Todo en un solo lugar.</p>
        </section>

        <section className="panel" aria-live="polite">
          {screen === 'loading' && <div className="panel-content"><div className="loading-mark" /><h2>Preparando tu casa…</h2></div>}

          {screen === 'welcome' && <div className="panel-content">
            <span className="step-label">TE DAMOS LA BIENVENIDA</span>
            <h2>¿Cómo querés entrar?</h2>
            <p>Empezá una casa o sumate a la que ya comparten.</p>
            <div className="action-stack">
              <button className="primary-button" onClick={() => show('register')}>Crear mi perfil <span aria-hidden="true">↗</span></button>
              <button className="secondary-button" onClick={() => show('invited')}>Me invitaron a una casa <span aria-hidden="true">→</span></button>
              <button className="text-button centered" onClick={() => show('login')}>Ya tengo una cuenta</button>
            </div>
          </div>}

          {(screen === 'register' || screen === 'invited') && <div className="panel-content">
            <button className="back-button" onClick={() => show('welcome')} type="button">← Volver</button>
            <span className="step-label">{screen === 'invited' ? 'ME INVITARON' : 'PRIMER PASO'}</span>
            <h2>{screen === 'invited' ? 'Sumate a tu casa.' : 'Creá tu perfil.'}</h2>
            <p>{screen === 'invited' ? 'Creá tu cuenta y usá el código que te compartieron.' : 'Un usuario y una contraseña. Así de simple.'}</p>
            <form onSubmit={submitRegister} className="form-stack">
              <label>Usuario<input autoFocus autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={24} required placeholder="charly" value={username} onChange={event=>setUsername(event.target.value)} /></label>
              <label>Contraseña<div className="password-field"><input type={showPassword?'text':'password'} autoComplete="new-password" minLength={6} maxLength={64} required placeholder="Al menos 6 caracteres" value={password} onChange={event=>setPassword(event.target.value)} /><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'}>{showPassword?'Ocultar':'Ver'}</button></div></label>
              {screen === 'invited' && <label>Código de la casa<input className="code-input" autoCapitalize="characters" autoComplete="off" required placeholder="ABCD-EFGH" value={inviteInput} onChange={(event) => setInviteInput(event.target.value)} /></label>}
              <button className="primary-button" disabled={busy}>{busy ? 'Un momento…' : screen === 'invited' ? 'Continuar' : 'Crear perfil'} <span aria-hidden="true">→</span></button>
            </form>
            <button className="text-button centered" onClick={()=>{setPendingInvite(screen==='invited'?inviteInput:'');show('login')}}>Ya tengo una cuenta</button>
          </div>}

          {screen === 'login' && <div className="panel-content">
            <button className="back-button" onClick={() => show('welcome')} type="button">← Volver</button>
            <span className="step-label">BIENVENIDO DE NUEVO</span>
            <h2>Entrá a tu casa.</h2>
            <p>Ingresá tu usuario y contraseña.</p>
            <form onSubmit={submitLogin} className="form-stack">
              <label>Usuario<input autoFocus autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={24} required placeholder="charly" value={username} onChange={event=>setUsername(event.target.value)} /></label>
              <label>Contraseña<div className="password-field"><input type={showPassword?'text':'password'} autoComplete="current-password" minLength={6} maxLength={64} required placeholder="Tu contraseña" value={password} onChange={event=>setPassword(event.target.value)} /><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'}>{showPassword?'Ocultar':'Ver'}</button></div></label>
              <button className="primary-button" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'} <span aria-hidden="true">→</span></button>
            </form>
            <button className="text-button centered" onClick={()=>show('legacy-login')}>Tenía una cuenta con clave personal</button>
          </div>}

          {screen === 'legacy-login' && <div className="panel-content">
            <button className="back-button" onClick={()=>show('login')}>← Volver</button>
            <h2>Conservá tu cuenta.</h2><p>Usá tu clave anterior una última vez para elegir un usuario y una contraseña.</p>
            <form onSubmit={submitLegacy} className="form-stack"><label>Clave anterior<input autoFocus className="code-input" autoComplete="off" required value={personalKey} onChange={event=>setPersonalKey(event.target.value)} placeholder="TT-XXXX-XXXX-XXXX-XXXX-XXXX" /></label><button className="primary-button" disabled={busy}>{busy?'Entrando…':'Continuar'}</button></form>
          </div>}

          {screen === 'setup-credentials' && <div className="panel-content">
            <h2>Elegí cómo entrar.</h2><p>Tu casa y tu personaje siguen acá. Elegí tu usuario y contraseña para volver a entrar.</p>
            <form onSubmit={submitCredentials} className="form-stack"><label>Usuario<input autoFocus autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={3} maxLength={24} required placeholder="charly" value={username} onChange={event=>setUsername(event.target.value)} /></label>
              <label>Contraseña<div className="password-field"><input type={showPassword?'text':'password'} autoComplete="new-password" minLength={6} maxLength={64} required placeholder="Al menos 6 caracteres" value={password} onChange={event=>setPassword(event.target.value)} /><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'}>{showPassword?'Ocultar':'Ver'}</button></div></label><button className="primary-button" disabled={busy}>{busy?'Guardando…':'Guardar y continuar'}</button></form>
          </div>}

          {screen === 'choose-home' && <div className="panel-content">
            <span className="step-label">HOLA, {user?.display_name.toUpperCase()}</span>
            <h2>¿Dónde empezamos?</h2>
            <p>Creá una casa para quienes viven con vos o entrá con el código que te pasaron.</p>
            <div className="action-stack">
              <button className="primary-button" onClick={() => show('create-home')}>Crear una casa <span aria-hidden="true">↗</span></button>
              <button className="secondary-button" onClick={() => show('join-home')}>Me invitaron <span aria-hidden="true">→</span></button>
            </div>
          </div>}

          {screen === 'create-home' && <div className="panel-content">
            <button className="back-button" onClick={() => show('choose-home')} type="button">← Volver</button>
            <span className="step-label">NUEVA CASA</span>
            <h2>Pongámosle nombre.</h2>
            <p>Después vas a poder compartir un código para que otros se unan.</p>
            <form onSubmit={submitCreateHome} className="form-stack">
              <label>Nombre de la casa<input autoFocus maxLength={60} minLength={2} required placeholder="Casa Mendoza" value={homeName} onChange={(event) => setHomeName(event.target.value)} /></label>
              <button className="primary-button" disabled={busy}>{busy ? 'Creando…' : 'Crear casa'} <span aria-hidden="true">→</span></button>
            </form>
          </div>}

          {screen === 'join-home' && <div className="panel-content">
            <button className="back-button" onClick={() => show('choose-home')} type="button">← Volver</button>
            <span className="step-label">UNIRME A UNA CASA</span>
            <h2>Tenés una invitación.</h2>
            <p>Pedile el código a quien creó la casa. Dura siete días.</p>
            <form onSubmit={submitJoinHome} className="form-stack">
              <label>Código de la casa<input autoFocus className="code-input" autoCapitalize="characters" autoComplete="off" required placeholder="ABCD-EFGH" value={inviteInput} onChange={(event) => setInviteInput(event.target.value)} /></label>
              <button className="primary-button" disabled={busy}>{busy ? 'Uniéndote…' : 'Entrar a la casa'} <span aria-hidden="true">→</span></button>
            </form>
          </div>}

          {error && <div className="error-message" role="alert">{error}</div>}
        </section>
      </main>
    </div>
  )
}
