import { Component, lazy, Suspense, useState, type ReactNode } from 'react'
import { defaultAvatar, hairColors, hairStyles, pantsColors, shirtColors, skinColors, type AvatarConfig } from '../../../shared/avatar'
import { request } from './model'
const AvatarPreview = lazy(() => import('./AvatarPreview'))
const styles = { short: 'Corto', curly: 'Rulos', long: 'Largo', bun: 'Rodete', bald: 'Sin pelo' }
class PreviewBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state = {failed:false}
  static getDerivedStateFromError() { return {failed:true} }
  render() { return this.state.failed ? <p>La vista 3D no está disponible. Podés guardar tu apariencia igualmente.</p> : this.props.children }
}
function Swatches({ label, colors, value, onChange }: { label: string; colors: readonly string[]; value: string; onChange: (color:string)=>void }) {
  return <fieldset className="avatar-field"><legend>{label}</legend><div className="avatar-swatches">{colors.map((color,index) => <button type="button" key={color} style={{background:color}} className={value===color?'chosen':''} aria-label={`${label}, tono ${index+1}`} aria-pressed={value===color} onClick={()=>onChange(color)}>{value===color && <span>✓</span>}</button>)}</div></fieldset>
}
export default function AvatarEditor({ initial, saved }: { initial?: AvatarConfig; saved: (avatar:AvatarConfig)=>void }) {
  const [avatar,setAvatar] = useState<AvatarConfig>(()=>({... (initial ?? defaultAvatar)}))
  const [saving,setSaving] = useState(false), [error,setError] = useState('')
  function patch(update: Partial<AvatarConfig>) { setAvatar(previous=>({...previous,...update})) }
  async function save() {
    setSaving(true);setError('')
    try { const result=await request<{avatar:AvatarConfig}>('/profile/avatar','PUT',avatar);saved(result.avatar) }
    catch(error) {setError(error instanceof Error ? error.message : 'No pudimos guardar tu personaje.')}
    finally {setSaving(false)}
  }
  return <div className="avatar-editor">
    <div className="avatar-preview"><PreviewBoundary><Suspense fallback={<p>Preparando tu personaje…</p>}><AvatarPreview avatar={avatar} /></Suspense></PreviewBoundary><span>Arrastrá para verlo de todos lados</span></div>
    <p>Un personaje bien tuyo. Los demás lo verán cuando guardes.</p>
    <Swatches label="Piel" colors={skinColors} value={avatar.skin} onChange={skin=>patch({skin})} />
    <fieldset className="avatar-field"><legend>Peinado</legend><div className="avatar-styles">{hairStyles.map(style=><button type="button" key={style} aria-pressed={avatar.hairStyle===style} className={avatar.hairStyle===style?'chosen':''} onClick={()=>patch({hairStyle:style})}>{styles[style]}</button>)}</div></fieldset>
    {avatar.hairStyle!=='bald'&&<Swatches label="Color de pelo" colors={hairColors} value={avatar.hairColor} onChange={hairColor=>patch({hairColor})} />}
    <Swatches label="Remera" colors={shirtColors} value={avatar.shirt} onChange={shirt=>patch({shirt})} />
    <Swatches label="Pantalón" colors={pantsColors} value={avatar.pants} onChange={pants=>patch({pants})} />
    <label className="avatar-glasses"><input type="checkbox" checked={avatar.glasses} onChange={event=>patch({glasses:event.target.checked})} /> Usar anteojos</label>
    {error&&<p className="avatar-error" role="alert">{error}</p>}
    <button className="game-primary" disabled={saving} onClick={()=>void save()}>{saving?'Guardando…':'Guardar mi personaje'}</button>
  </div>
}
