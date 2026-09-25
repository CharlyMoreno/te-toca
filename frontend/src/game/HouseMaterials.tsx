import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'

export type Finish='wood'|'tile'|'stone'|'fabric'|'plaster'|'metal'|'ceramic'|'glass'
type Maps=Partial<Record<Finish,THREE.CanvasTexture>>
const Materials=createContext<Maps>({})
// Procedural, deterministic maps: no external assets or downloads.
function texture(kind:Finish):THREE.CanvasTexture {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512
  const ctx=canvas.getContext('2d')!
  let seed=42
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
  ctx.fillStyle='#c6c1b5';ctx.fillRect(0,0,512,512)
  if(kind==='wood') {
    for(let row=0;row<8;row++) {
      const brightness=172+Math.floor(rand()*32)
      ctx.fillStyle=`rgb(${brightness+18},${brightness+8},${brightness-8})`;ctx.fillRect(0,row*64,512,63)
      for(let i=0;i<160;i++) {
        const y=row*64+rand()*63,x=rand()*512
        ctx.strokeStyle=`rgba(62,47,31,${rand()*.13})`;ctx.lineWidth=.3+rand()*.6
        ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+35,y-1,x+80,y+2,x+130,y);ctx.stroke()
      }
      ctx.fillStyle='#71695c';ctx.fillRect(0,row*64,512,1)
      const offset=(row%3)*170;ctx.fillRect(offset,row*64,1,64)
    }
  } else if(kind==='tile') {
    for(let x=0;x<4;x++)for(let y=0;y<4;y++) {
      const v=207+Math.floor(rand()*14);ctx.fillStyle=`rgb(${v},${v},${v-3})`;ctx.fillRect(x*128+2,y*128+2,124,124)
      ctx.strokeStyle='#f4f3ec';ctx.strokeRect(x*128+3,y*128+3,122,122)
    }
  } else if(kind==='fabric') {
    ctx.fillStyle='#dbd7cd';ctx.fillRect(0,0,512,512)
    for(let i=0;i<512;i+=3){ctx.fillStyle=i%2?'#b5b0a4':'#edeae1';ctx.globalAlpha=.3;ctx.fillRect(i,0,1,512);ctx.fillRect(0,i,512,1)}ctx.globalAlpha=1
  } else {
    const image=ctx.getImageData(0,0,512,512)
    for(let i=0;i<image.data.length;i+=4){const v=(kind==='stone'?209:226)+rand()*22;image.data[i]=v;image.data[i+1]=v;image.data[i+2]=v-2;image.data[i+3]=255}ctx.putImageData(image,0,0)
    if(kind==='stone')for(let i=0;i<12;i++) {
      const y=rand()*512;ctx.strokeStyle='#aaaba92a';ctx.lineWidth=.6+rand()*1.5;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(120,y-70,330,y+90,512,y-20);ctx.stroke()
    }
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4
  return map
}
export function HouseMaterials({children}:{children:ReactNode}) {
  const maps=useMemo(()=>Object.fromEntries(['wood','tile','stone','fabric','plaster'].map(kind=>[kind,texture(kind as Finish)])) as Maps,[])
  useEffect(()=>()=>Object.values(maps).forEach(map=>map?.dispose()),[maps])
  return <Materials.Provider value={maps}>{children}</Materials.Provider>
}
export function Surface({finish='plaster',color='#ffffff'}:{finish?:Finish;color?:string}) {
  const maps=useContext(Materials),map=maps[finish]
  if(finish==='glass')return <meshPhysicalMaterial color={color} roughness={.08} metalness={.1} transparent opacity={.25} depthWrite={false} side={THREE.DoubleSide} />
  return <meshStandardMaterial color={color} map={map} bumpMap={map} bumpScale={finish==='fabric'?.018:finish==='wood'?.012:.005}
    roughness={finish==='metal'?.22:finish==='ceramic'?.18:finish==='stone'?.36:finish==='fabric'?.96:.73}
    metalness={finish==='metal'?.85:0} />
}
