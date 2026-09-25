export const roomKinds = ['kitchen','bathroom','bedroom','living'] as const
export type RoomKind = typeof roomKinds[number]
export type RoomRecord = { id:string; name:string; kind:RoomKind; slot:number }
export const roomCatalog: Record<RoomKind,{name:string;color:string;floor:string;icon:string;suggestion:string}> = {
  kitchen:{name:'Cocina',color:'#b99573',floor:'#c7bca7',icon:'dishes',suggestion:'Lavar los platos'},
  bathroom:{name:'Baño',color:'#7d9d96',floor:'#c9d2cf',icon:'clean',suggestion:'Limpiar el baño'},
  bedroom:{name:'Dormitorio',color:'#ac9eb6',floor:'#c0a384',icon:'laundry',suggestion:'Ordenar el dormitorio'},
  living:{name:'Living',color:'#b59080',floor:'#c2a787',icon:'clean',suggestion:'Barrer el living'},
}
export type HouseRoom = RoomRecord & {color:string;floor:string;icon:string;suggestion:string;position:[number,number]}
export function layoutRooms(records:RoomRecord[]):HouseRoom[] {
  const sorted=[...records].sort((a,b)=>a.slot-b.slot)
  const rows=Math.max(1,Math.ceil(sorted.length/2))
  return sorted.map((record,index)=>({ ...roomCatalog[record.kind],...record,position:[index%2===0?-3.55:3.55,(Math.floor(index/2)-(rows-1)/2)*6.4] }))
}
export function houseBounds(rooms:HouseRoom[]) {
  const rows=Math.max(1,Math.ceil(rooms.length/2))
  return { width:14.2, depth:rows*6.4, entranceZ:rows*3.2+1.25 }
}
