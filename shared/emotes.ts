export const emotes = [
  {emoji:'😡',label:'Enojarme'},
  {emoji:'🖕',label:'Fuck you'},
  {emoji:'👍',label:'Like'},
  {emoji:'❤️',label:'Corazón'},
] as const
export type Emote = typeof emotes[number]['emoji']
export type EmoteEvent = { id:string; userId:string; targetId:string; emoji:Emote }
