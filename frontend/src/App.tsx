import { useEffect, useState, type FormEvent } from 'react'

type User = { id: string; display_name: string }
type Home = { id: string; name: string; timezone: string; role: 'admin' | 'member' }
type Member = { id: string; display_name: string; role: 'admin' | 'member' }
type Screen = 'loading' | 'welcome' | 'register' | 'login' | 'invited' | 'save-key' | 'choose-home' | 'create-home' | 'join-home' | 'home'

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
  const [name, setName] = useState('')
  const [personalKey, setPersonalKey] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [savedKey, setSavedKey] = useState('')
  const [pendingInvite, setPendingInvite] = useState('')
  const [homeName, setHomeName] = useState('')
  const [newInvite, setNewInvite] = useState('')
  const [inviteExpiry, setInviteExpiry] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function loadHome() {
    const result = await api<{ home: Home | null; members: Member[] }>('/homes/current')
    setHome(result.home)
    setMembers(result.members)
    setScreen(result.home ? 'home' : 'choose-home')
  }

  useEffect(() => {
    api<{ user: User }>('/auth/me')
      .then(async ({ user: current }) => {
        setUser(current)
        await loadHome()
      })
      .catch(() => setScreen('welcome'))
  }, [])

  function show(next: Screen) {
    setError('')
    setCopied(false)
    setScreen(next)
  }

  async function perform(action: () => Promise<void>) {
    setError('')
    setBusy(true)
    try { await action() } catch (caught) { setError(getError(caught)) } finally { setBusy(false) }
  }

  function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const joining = screen === 'invited'
    void perform(async () => {
      const result = await api<{ user: User; accessCode: string }>('/auth/register', 'POST', { displayName: name })
      setUser(result.user)
      setSavedKey(result.accessCode)
      setPendingInvite(joining ? inviteInput : '')
      show('save-key')
    })
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform(async () => {
      const result = await api<{ user: User }>('/auth/login', 'POST', { accessCode: personalKey })
      setUser(result.user)
      setPersonalKey('')
      await loadHome()
    })
  }

  function continueAfterKey() {
    void perform(async () => {
      const invite = pendingInvite
      setSavedKey('')
      setPendingInvite('')
      if (invite) {
        try {
          await api('/homes/join', 'POST', { inviteCode: invite })
          await loadHome()
        } catch (caught) {
          setInviteInput(invite)
          show('join-home')
          throw caught
        }
      } else {
        show('choose-home')
      }
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

  function generateInvite() {
    void perform(async () => {
      const result = await api<{ inviteCode: string; expiresAt: number }>('/homes/invite', 'POST', {})
      setNewInvite(result.inviteCode)
      setInviteExpiry(result.expiresAt)
      setCopied(false)
    })
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setError('No se pudo copiar. Seleccioná el código para guardarlo.')
    }
  }

  function logout() {
    void perform(async () => {
      await api('/auth/logout', 'POST', {})
      setUser(null)
      setHome(null)
      setMembers([])
      setNewInvite('')
      show('welcome')
    })
  }

  const isAuthenticated = Boolean(user)

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
          <p className="hero-copy">Entrá con tu clave, encontrá tu habitación y descubrí qué te toca hacer hoy.</p>
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
              <button className="text-button centered" onClick={() => show('login')}>Ya tengo mi clave personal</button>
            </div>
          </div>}

          {(screen === 'register' || screen === 'invited') && <div className="panel-content">
            <button className="back-button" onClick={() => show('welcome')} type="button">← Volver</button>
            <span className="step-label">{screen === 'invited' ? 'ME INVITARON' : 'PRIMER PASO'}</span>
            <h2>{screen === 'invited' ? 'Sumate a tu casa.' : 'Creá tu perfil.'}</h2>
            <p>{screen === 'invited' ? 'Ingresá el código que te compartieron y elegí cómo querés aparecer.' : 'Elegí un nombre. Después vas a recibir tu clave personal para volver a entrar.'}</p>
            <form onSubmit={submitRegister} className="form-stack">
              <label>Tu nombre<input autoFocus autoComplete="nickname" maxLength={40} minLength={2} required placeholder="Por ejemplo, Charly" value={name} onChange={(event) => setName(event.target.value)} /></label>
              {screen === 'invited' && <label>Código de la casa<input className="code-input" autoCapitalize="characters" autoComplete="off" required placeholder="ABCD-EFGH" value={inviteInput} onChange={(event) => setInviteInput(event.target.value)} /></label>}
              <button className="primary-button" disabled={busy}>{busy ? 'Un momento…' : screen === 'invited' ? 'Continuar' : 'Crear perfil'} <span aria-hidden="true">→</span></button>
            </form>
          </div>}

          {screen === 'login' && <div className="panel-content">
            <button className="back-button" onClick={() => show('welcome')} type="button">← Volver</button>
            <span className="step-label">BIENVENIDO DE NUEVO</span>
            <h2>Entrá a tu casa.</h2>
            <p>Usá la clave personal que guardaste cuando creaste tu perfil.</p>
            <form onSubmit={submitLogin} className="form-stack">
              <label>Tu clave personal<input autoFocus className="code-input" autoCapitalize="characters" autoComplete="off" required placeholder="TT-XXXX-XXXX-XXXX-XXXX-XXXX" value={personalKey} onChange={(event) => setPersonalKey(event.target.value)} /></label>
              <button className="primary-button" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'} <span aria-hidden="true">→</span></button>
            </form>
          </div>}

          {screen === 'save-key' && <div className="panel-content">
            <span className="step-label">TU CLAVE PERSONAL</span>
            <h2>Guardá tu llave.</h2>
            <p>La vas a necesitar para volver a entrar desde otro dispositivo. Esta clave se muestra una sola vez.</p>
            <div className="code-card"><span>CLAVE DE {user?.display_name.toUpperCase()}</span><strong>{savedKey}</strong></div>
            <button className="secondary-button" type="button" onClick={() => void copy(savedKey)}>{copied ? 'Copiada ✓' : 'Copiar clave'}</button>
            <button className="primary-button" type="button" onClick={continueAfterKey} disabled={busy}>Ya guardé mi clave <span aria-hidden="true">→</span></button>
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

          {screen === 'home' && home && <div className="panel-content">
            <span className="step-label">TU CASA</span>
            <h2>{home.name}</h2>
            <p>Ya estás adentro, {user?.display_name}. Acá vas a encontrar a todos y, en el próximo módulo, las tareas de cada habitación.</p>
            <div className="member-list"><span>VIVEN ACÁ</span>{members.map((member) => <div className="member" key={member.id}><span className="member-avatar">{member.display_name[0].toUpperCase()}</span><span>{member.display_name}</span>{member.role === 'admin' && <small>Administra</small>}</div>)}</div>
            {home.role === 'admin' && <div className="invite-section">
              <h3>Invitá a alguien</h3><p>Compartí un código para que se una a la casa.</p>
              <button className="secondary-button" onClick={generateInvite} disabled={busy}>{newInvite ? 'Generar otro código' : 'Generar código de invitación'}</button>
              {newInvite && <><div className="code-card invite"><span>CÓDIGO DE LA CASA</span><strong>{newInvite}</strong><small>Vence el {new Date((inviteExpiry ?? 0) * 1000).toLocaleDateString('es-AR')}</small></div><button className="text-button" onClick={() => void copy(newInvite)}>{copied ? 'Copiado ✓' : 'Copiar código'}</button></>}
            </div>}
          </div>}

          {error && <div className="error-message" role="alert">{error}</div>}
        </section>
      </main>
    </div>
  )
}
