(function(){
const $=s=>document.querySelector(s);
const canvas=$('#scene');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}catch(e){$('#nogl').hidden=false;$('#hud').hidden=true;$('#intro').hidden=true;return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xe8dcc8,26,120);
const camera=new THREE.PerspectiveCamera(42,1,0.1,150);
let aspectK=1;
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();aspectK=camera.aspect<1?Math.min(1.6,0.9/camera.aspect):1;}
addEventListener('resize',resize);resize();
const hemi=new THREE.HemisphereLight(0xfff1dc,0x8c7a64,0.82);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe7c4,0.9);sun.position.set(9,15,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:50});sun.shadow.bias=-0.0005;scene.add(sun);
const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.75},o||{}));
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const randOf=a=>a[Math.random()*a.length|0];
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const tweens=[];function tween(dur,fn,done){tweens.push({t:0,dur,fn,done});}
function shade(m){m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return m;}
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);}return t;}

// ---------- world: 한옥 마당 ----------
const BOUND={x0:-10.6,x1:10.6,z0:-8.2,z1:7.6};const clouds=[];
const dirtTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#d6c29a';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=Math.random()<.5?'rgba(150,120,80,.18)':'rgba(255,245,220,.25)';g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*3,2+Math.random()*3);}},[10,10]);
const field0=new THREE.Mesh(new THREE.PlaneGeometry(260,260),new THREE.MeshLambertMaterial({color:0xa7a171}));field0.rotation.x=-Math.PI/2;field0.position.y=-0.02;field0.receiveShadow=true;scene.add(field0);
dirtTex.repeat.set(3,2.6);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(24.6,22),new THREE.MeshLambertMaterial({map:dirtTex}));ground.rotation.x=-Math.PI/2;ground.position.z=-2;ground.receiveShadow=true;scene.add(ground);
// sky dome + far mountains + clouds
(function(){
  const sky=new THREE.Mesh(new THREE.SphereGeometry(140,32,16),new THREE.MeshBasicMaterial({side:THREE.BackSide,fog:false,depthWrite:false,
    map:canvasTex(8,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#6fa6cf');gr.addColorStop(0.42,'#a9cde2');gr.addColorStop(0.5,'#f2dcc0');gr.addColorStop(1,'#f2dcc0');g.fillStyle=gr;g.fillRect(0,0,w,h);})}));
  scene.add(sky);
  const layers=[[48,0x8fa596,9,16],[62,0x9fb3a6,12,22],[80,0xb3c2b6,16,30]];
  layers.forEach(([R,col,hMin,hMax],li)=>{const m=new THREE.MeshLambertMaterial({color:col,flatShading:true});
    for(let i=0;i<16;i++){const a=-Math.PI*0.95+i/15*Math.PI*0.9+li*0.11;const h=hMin+Math.random()*(hMax-hMin);
      const c=new THREE.Mesh(new THREE.ConeGeometry(h*1.25,h,6+(i%3)),m);c.position.set(Math.cos(a)*R,h/2-1.5,Math.sin(a)*R-6);c.rotation.y=Math.random()*3;scene.add(c);}
    for(let i=0;i<10;i++){const a=Math.PI*0.08+i/9*Math.PI*0.84;const h=hMin*0.8+Math.random()*(hMax-hMin)*0.6;const c=new THREE.Mesh(new THREE.ConeGeometry(h*1.4,h,6),m);c.position.set(Math.cos(a)*R,h/2-1.5,Math.sin(a)*R+4);c.rotation.y=Math.random()*3;scene.add(c);}});
  const cm=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.92});
  for(let i=0;i<9;i++){const g=new THREE.Group();for(let k=0;k<5;k++){const s=new THREE.Mesh(new THREE.SphereGeometry(2+Math.random()*2.2,10,8),cm);s.position.set(k*2.6-5,Math.random()*1.2,Math.random()*2);s.scale.y=0.55;g.add(s);}
    g.position.set((Math.random()-.5)*160,28+Math.random()*12,-40-Math.random()*60);g.userData.v=0.4+Math.random()*0.6;scene.add(g);clouds.push(g);}
})();
const tarpTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#3b7bc3';g.fillRect(0,0,w,h);for(let i=0;i<w;i+=8){g.fillStyle='rgba(255,255,255,.06)';g.fillRect(i,0,3,h);g.fillStyle='rgba(0,0,40,.06)';g.fillRect(0,i,w,3);}
  g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();g.moveTo(Math.random()*w,0);g.lineTo(Math.random()*w,h);g.stroke();}},[5,3]);
const tarp=new THREE.Mesh(new THREE.PlaneGeometry(17,8.5),new THREE.MeshLambertMaterial({map:tarpTex}));tarp.rotation.x=-Math.PI/2;tarp.position.set(0,0.01,-2.6);tarp.receiveShadow=true;scene.add(tarp);

// 한옥 (back)
(function(){
  const wood=M(0x8a5a36),cream=M(0xf2e6cc),beam=M(0x5a3a24);
  const maru=new THREE.Mesh(new THREE.BoxGeometry(18,0.7,3.2),M(0xb0814f));maru.position.set(0,0.35,-11.3);scene.add(shade(maru));
  const step=new THREE.Mesh(new THREE.BoxGeometry(5,0.3,0.6),M(0x9a9086));step.position.set(0,0.15,-9.5);scene.add(shade(step));
  for(let x=-8.4;x<=8.41;x+=2.8){const p=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.18,3.0,10),wood);p.position.set(x,2.2,-9.9);scene.add(shade(p));}
  const lattice=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#f6edd8';g.fillRect(0,0,w,h);g.strokeStyle='#7a4e2e';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);g.lineWidth=3;for(let i=32;i<w;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke();}},[1,1]);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(17.6,2.6,0.25),cream);wall.position.set(0,2.0,-12.6);scene.add(shade(wall));
  for(let x=-7;x<=7.01;x+=2.8){const d=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.9),new THREE.MeshStandardMaterial({map:lattice,roughness:.8}));d.position.set(x,2.0,-12.46);scene.add(d);}
  const lintel=new THREE.Mesh(new THREE.BoxGeometry(18,0.3,0.3),beam);lintel.position.set(0,3.6,-9.9);scene.add(shade(lintel));
  const tile=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#4a4f58';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=16){g.fillStyle='#3a3e46';g.fillRect(x,0,5,h);g.fillStyle='#5e646e';g.fillRect(x+8,0,3,h);}},[14,3]);
  const roofM=new THREE.MeshStandardMaterial({map:tile,roughness:.7});
  const front=new THREE.Mesh(new THREE.BoxGeometry(20.5,0.25,4.4),roofM);front.position.set(0,4.55,-9.6);front.rotation.x=0.42;scene.add(shade(front));
  const back=new THREE.Mesh(new THREE.BoxGeometry(20.5,0.25,3.6),roofM);back.position.set(0,4.75,-12.8);back.rotation.x=-0.5;scene.add(shade(back));
  const ridge=new THREE.Mesh(new THREE.BoxGeometry(19,0.4,0.5),M(0x34373d));ridge.position.set(0,5.55,-11.4);scene.add(shade(ridge));
  [-1,1].forEach(s=>{const tip=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.22,4.2),roofM);tip.position.set(s*10.4,4.75,-9.8);tip.rotation.set(0.42,0,s*-0.22);scene.add(shade(tip));});
})();
// 돌담
(function(){
  const stone=canvasTex(256,128,(g,w,h)=>{g.fillStyle='#8f857a';g.fillRect(0,0,w,h);for(let r=0;r<4;r++)for(let c=0;c<6;c++){const x=c*44+(r%2)*22-10,y=r*32;g.fillStyle=['#a89d90','#9a8f84','#b3a99c','#8a8075'][(r+c)%4];g.beginPath();g.ellipse(x+21,y+16,20,14,0,0,6.283);g.fill();}},[6,1]);
  const sm=new THREE.MeshStandardMaterial({map:stone,roughness:.95}),cap=M(0x474b52);
  function wallSeg(x,z,len,rot){const w=new THREE.Mesh(new THREE.BoxGeometry(len,1.25,0.6),sm);w.position.set(x,0.62,z);w.rotation.y=rot;scene.add(shade(w));
    const c=new THREE.Mesh(new THREE.BoxGeometry(len+0.2,0.18,0.85),cap);c.position.set(x,1.32,z);c.rotation.y=rot;scene.add(shade(c));}
  wallSeg(-12,-2.5,20.5,Math.PI/2);wallSeg(12,-2.5,20.5,Math.PI/2);
  wallSeg(-7.3,8.5,9.6,0);wallSeg(7.3,8.5,9.6,0);
  [-2.5,2.5].forEach(x=>{const p=new THREE.Mesh(new THREE.BoxGeometry(0.6,2.2,0.6),M(0x6b4a30));p.position.set(x,1.1,8.5);scene.add(shade(p));});
})();
// 감나무
const persimmons=[];
function persimmonTree(x,z,s){
  const g=new THREE.Group();const bark=M(0x5b3d2a,{roughness:.95});
  const t1=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.35,2.6,8),bark);t1.position.y=1.3;t1.rotation.z=0.12;g.add(t1);
  [[-0.9,2.6,0.2,0.8],[0.8,2.8,-0.3,-0.7],[0.1,3.0,0.7,0.2]].forEach(([bx,by,bz,rz])=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.14,1.6,6),bark);b.position.set(bx*0.5,by-0.4,bz*0.5);b.rotation.set(bz*0.6,0,rz);g.add(b);});
  const leafCols=[0xd9902f,0xc96a26,0xe3b043,0x9a8a3a];
  for(let i=0;i<7;i++){const r=0.9+Math.random()*0.5;const c=new THREE.Mesh(new THREE.IcosahedronGeometry(r,0),M(leafCols[i%4],{flatShading:true}));c.position.set((Math.random()-.5)*2.6,3.2+Math.random()*1.2,(Math.random()-.5)*2.2);g.add(c);}
  const fm=M(0xf2701a,{roughness:.4});
  for(let i=0;i<16;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(0.13,10,8),fm);const a=Math.random()*6.283,r=1.1+Math.random()*0.7;f.position.set(Math.cos(a)*r,2.6+Math.random()*1.8,Math.sin(a)*r);f.scale.y=0.8;g.add(f);persimmons.push(f);}
  g.position.set(x,0,z);g.scale.setScalar(s);scene.add(shade(g));
}
persimmonTree(-9.4,-7.6,1.1);persimmonTree(9.6,5.4,1);
// 장독대
(function(){const base=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.35,2.2),M(0x9c9286));base.position.set(9.2,0.17,-7.0);scene.add(shade(base));
  const pts=[[0,0],[0.32,0.02],[0.48,0.25],[0.52,0.5],[0.42,0.78],[0.28,0.86],[0.28,0.92]].map(p=>new THREE.Vector2(p[0],p[1]));const og=new THREE.LatheGeometry(pts,24);const om=M(0x5b3a26,{roughness:.35,metalness:.1});
  [[-1.1,-0.4,1.2],[0,-0.5,1.35],[1.1,-0.4,1.1],[-0.6,0.5,0.95],[0.6,0.5,1.0]].forEach(([dx,dz,s])=>{const o=new THREE.Mesh(og,om);o.scale.setScalar(s);o.position.set(9.2+dx,0.35,-7+dz);scene.add(shade(o));
    const lid=new THREE.Mesh(new THREE.SphereGeometry(0.33*s,14,6,0,6.283,0,1.2),om);lid.position.set(9.2+dx,0.35+0.9*s,-7+dz);scene.add(lid);});})();
// 장작
(function(){const lm=M(0x8a5a36),em=M(0xd9b98a);for(let r=0;r<3;r++)for(let i=0;i<5-r;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.16,1.4,8),lm);l.rotation.x=Math.PI/2;l.position.set(9.4+(i-2+r/2)*0.34,0.16+r*0.3,1.6);scene.add(shade(l));}})();

// ---------- zones ----------
const ZONES={
  rest:{name:'평상',x:0,z:4.2,r:2.6,dist:9},
  salt:{name:'배추 절이기',x:-6,z:-1.6,r:3.3,dist:8.5},
  sauce:{name:'양념 만들기',x:-2.4,z:-5.4,r:2.2,dist:6.8},
  mix:{name:'속 버무리기',x:2.6,z:-5.4,r:2.8,dist:8.5},
  eat:{name:'수육 먹기',x:6.4,z:2.4,r:2.6,dist:7.2},
  field:{name:'배추밭',x:-6.2,z:4.6,r:2.7,dist:8},
  bury:{name:'김장독 묻기',x:8.4,z:-3.4,r:2.2,dist:6.6}
};
const ZKEYS=['field','salt','sauce','mix','bury','eat','rest'];
const SLOT_ANG=[0,1.2,-1.2,2.3,-2.3,Math.PI,0.65,-0.65];
function slotPos(zk,i){const z=ZONES[zk];const a=SLOT_ANG[i%SLOT_ANG.length];const r=zk==='rest'?2.0:zk==='field'?2.7:(zk==='sauce'||zk==='eat'||zk==='bury'?1.9:2.3);return V(z.x+Math.sin(a)*r,0,z.z+Math.cos(a)*r);}
function zoneAt(p){for(const k of ZKEYS){const z=ZONES[k];const dx=p.x-z.x,dz=p.z-z.z;if(dx*dx+dz*dz<z.r*z.r)return k;}return null;}

const basinPts=[[0,0.03],[1.9,0.03],[2.06,0.14],[2.34,0.86],[2.48,0.92],[2.5,0.98],[2.38,0.99]].map(p=>new THREE.Vector2(p[0],p[1]));
const basinGeo=new THREE.LatheGeometry(basinPts,64);const basinMat=M(0xc8392b,{roughness:.5,side:THREE.DoubleSide});
function basinAt(zk){const b=new THREE.Mesh(basinGeo,basinMat);b.scale.setScalar(0.82);b.position.set(ZONES[zk].x,0,ZONES[zk].z);scene.add(shade(b));}
basinAt('salt');basinAt('mix');
function wholeCabbage(x,z,s){const geo=new THREE.SphereGeometry(0.6,24,16);const pos=geo.attributes.position,cols=[];const a=new THREE.Color(0x5b9440),b=new THREE.Color(0xe7ecbf);
  for(let i=0;i<pos.count;i++){const c=a.clone().lerp(b,(0.6-pos.getY(i))/1.2);cols.push(c.r,c.g,c.b);}geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  const m=new THREE.Mesh(geo,M(0xffffff,{vertexColors:true}));m.scale.set(s,s*1.5,s);m.rotation.z=1.35;m.rotation.y=Math.random()*3;m.position.set(x,0.55*s,z);scene.add(shade(m));}
[[-9.6,-2.8,1],[-10.2,-1.7,.95],[-9.8,-0.6,.9],[-10.4,-3.7,.9],[-9.2,-4.0,.95],[-10.5,-0.2,.85],[-9.9,-1.3,.8]].forEach(a=>wholeCabbage(...a));
(function(){const s=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.55,0.9,12),M(0xf1ece0));s.position.set(-8.6,0.45,1.0);scene.add(shade(s));})();

const SB=ZONES.sauce;
const bowlPts=[[0,0.02],[0.75,0.02],[1.0,0.22],[1.2,0.56],[1.25,0.6]].map(p=>new THREE.Vector2(p[0],p[1]));
const bigBowl=new THREE.Mesh(new THREE.LatheGeometry(bowlPts,48),M(0xc9ced3,{metalness:.7,roughness:.3,side:THREE.DoubleSide}));bigBowl.position.set(SB.x,0,SB.z);scene.add(shade(bigBowl));
const sauceCanvas=document.createElement('canvas');sauceCanvas.width=sauceCanvas.height=256;const sauceTex=new THREE.CanvasTexture(sauceCanvas);
const sauceDisc=new THREE.Mesh(new THREE.CircleGeometry(1.05,48),M(0xffffff,{map:sauceTex,roughness:.9}));sauceDisc.rotation.x=-Math.PI/2;sauceDisc.position.set(SB.x,0.06,SB.z);scene.add(sauceDisc);
[[0xb8281a,-1.5,-1.4],[0xf2ead0,-0.5,-1.7],[0x6b4a2a,0.5,-1.7],[0x5f9a3a,1.5,-1.4]].forEach(([c,dx,dz])=>{
  const j=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.5,16),M(0xe9e4da,{transparent:true,opacity:.7}));j.position.set(SB.x+dx,0.25,SB.z+dz);scene.add(j);
  const f=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,0.34,16),M(c));f.position.set(SB.x+dx,0.18,SB.z+dz);scene.add(f);});

const EB=ZONES.eat;
(function(){const potPts=[[0,0.25],[0.6,0.28],[0.95,0.6],[1.05,0.95],[1.25,1.0],[1.25,1.05],[1.0,1.08]].map(p=>new THREE.Vector2(p[0],p[1]));
  const pot=new THREE.Mesh(new THREE.LatheGeometry(potPts,40),M(0x2d2b2a,{metalness:.4,roughness:.5,side:THREE.DoubleSide}));pot.position.set(EB.x+0.4,0.2,EB.z-1.3);scene.add(shade(pot));
  const lidm=new THREE.Mesh(new THREE.SphereGeometry(1.0,24,8,0,Math.PI*2,0,0.5),M(0x3a3634,{metalness:.4}));lidm.position.set(EB.x+0.4,0.62,EB.z-1.3);scene.add(lidm);
  for(let i=0;i<3;i++){const br=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.3,0.3),M(0x9b5a3c));const a=i*2.09;br.position.set(EB.x+0.4+Math.sin(a)*0.8,0.15,EB.z-1.3+Math.cos(a)*0.8);scene.add(br);}
})();
const fireLight=new THREE.PointLight(0xff8a3c,0.9,4);fireLight.position.set(EB.x+0.4,0.4,EB.z-1.3);scene.add(fireLight);
const board=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.14,1.0),M(0xc49a6c));board.position.set(EB.x-0.3,0.07,EB.z+0.2);scene.add(shade(board));
const sliceGeo=new THREE.BoxGeometry(0.34,0.07,0.24),sliceMat=M(0xdcb79c,{roughness:.6}),sliceFat=M(0xf6ece0);
const slices=[];
function layoutSlices(){slices.forEach(s=>scene.remove(s));slices.length=0;
  for(let i=0;i<8;i++){const g=new THREE.Group();const m=new THREE.Mesh(sliceGeo,sliceMat);const f=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.025,0.24),sliceFat);f.position.y=0.045;g.add(m,f);
    g.position.set(EB.x-0.95+(i%4)*0.42,0.18,EB.z+0.02+(i<4?0:0.34));g.rotation.y=(Math.random()-.5)*.3;g.rotation.z=0.25;scene.add(g);slices.push(g);}}
layoutSlices();
const kpl=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.36,0.06,24),M(0xf7f3ea));kpl.position.set(EB.x+1.1,0.03,EB.z+0.7);scene.add(kpl);
const kp=new THREE.Mesh(new THREE.SphereGeometry(0.3,12,8),M(0xb8321f));kp.scale.set(1,0.35,0.8);kp.position.set(EB.x+1.1,0.1,EB.z+0.7);scene.add(kp);
const steam=[];for(let i=0;i<12;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(0.18,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5,depthWrite:false}));s.userData.t=Math.random();scene.add(s);steam.push(s);}

(function(){const R=ZONES.rest;const top=new THREE.Mesh(new THREE.BoxGeometry(3.4,0.16,2.0),M(0xb88a5a));top.position.set(R.x,0.5,R.z-0.4);scene.add(shade(top));
  for(const sx of[-1,1])for(const sz of[-1,1]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.5,0.16),M(0x8a6440));l.position.set(R.x+sx*1.5,0.25,R.z-0.4+sz*0.85);scene.add(l);}
  const mat=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.03,0.7),M(0x8c5aa0));mat.position.set(R.x-0.6,0.6,R.z-0.5);scene.add(mat);
  const jug=new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,0.36,14),M(0xe9e4d8));jug.position.set(R.x+0.8,0.76,R.z-0.6);scene.add(jug);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.09,0.1,14),M(0xd8c8a8));cup.position.set(R.x+1.15,0.63,R.z-0.3);scene.add(cup);})();

// shared kimchi box
const BOXX=4.9,BOXZ=-7.7;
const box=new THREE.Mesh(new THREE.BoxGeometry(2.3,0.9,1.35),M(0xffffff,{transparent:true,opacity:.4,roughness:.2,depthWrite:false}));box.position.set(BOXX,0.45,BOXZ);scene.add(box);
const boxEdge=new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry),new THREE.LineBasicMaterial({color:0x8d9aa2}));boxEdge.position.copy(box.position);scene.add(boxEdge);
const lid=new THREE.Mesh(new THREE.BoxGeometry(2.4,0.1,1.45),M(0x4f9a56,{roughness:.5}));lid.position.set(BOXX+1.5,0.55,BOXZ);lid.rotation.z=1.2;scene.add(shade(lid));
const pieceGeo=new THREE.BoxGeometry(0.62,0.22,0.55),pieceMat=M(0xb8321f,{roughness:.8});
const slots=[];for(let L=0;L<3;L++)for(let z=0;z<2;z++)for(let x=0;x<3;x++)slots.push(V(BOXX+(x-1)*0.68,0.14+L*0.25,BOXZ+(z-.5)*0.6));
let boxFill=0,pieces=[];
function placePiece(i){const m=new THREE.Mesh(pieceGeo,pieceMat);m.position.copy(slots[i]);m.rotation.y=(Math.random()-.5)*.25;m.castShadow=true;scene.add(m);pieces.push(m);}
function reserveSlot(){const i=boxFill++;const full=boxFill>=slots.length;if(full)boxFill=0;return {i,full};}
function landed(r){placePiece(r.i);if(r.full)setTimeout(()=>{pieces.forEach(p=>scene.remove(p));pieces=[];toast('마당 김치통 하나 꽉 찼다!');},500);}
function flyPiece(from){const r=reserveSlot();const m=new THREE.Mesh(pieceGeo,pieceMat);m.position.copy(from);m.scale.setScalar(.6);scene.add(m);const s=from.clone(),e=slots[r.i].clone();
  tween(1.0,p=>{const k=ease(p);m.position.lerpVectors(s,e,k);m.position.y+=Math.sin(p*Math.PI)*2.2;m.rotation.z=p*Math.PI;m.scale.setScalar(.6+.4*k);},()=>{scene.remove(m);landed(r);});}

// ---------- 배추밭 ----------
const FB=ZONES.field;const fieldCabs=[];
(function(){const soil=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#7a5636';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32){g.fillStyle='#5f4128';g.fillRect(0,y,w,10);g.fillStyle='#8f6a45';g.fillRect(0,y+16,w,6);}},[1,3]);
  const bed=new THREE.Mesh(new THREE.BoxGeometry(5.4,0.12,3.8),new THREE.MeshLambertMaterial({map:soil}));bed.position.set(FB.x,0.06,FB.z-0.2);bed.receiveShadow=true;scene.add(bed);
  const fence=M(0x9a7550);for(let i=0;i<8;i++){const t=i/7;[[-2.8+t*5.6,-2.2],[-2.8+t*5.6,1.8]].forEach(([dx,dz])=>{const s=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.6,0.08),fence);s.position.set(FB.x+dx,0.3,FB.z+dz);scene.add(s);});}
})();
const fcCore=new THREE.SphereGeometry(0.42,16,12),fcLeaf=new THREE.SphereGeometry(0.34,12,8);
const fcCoreM=M(0xcfe39a,{roughness:.6}),fcLeafM=M(0x4f8a35,{roughness:.7,side:THREE.DoubleSide});
for(let r=0;r<3;r++)for(let c=0;c<4;c++){const g=new THREE.Group();const core=new THREE.Mesh(fcCore,fcCoreM);core.scale.set(1,1.25,1);core.position.y=0.45;g.add(core);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;const l=new THREE.Mesh(fcLeaf,fcLeafM);l.scale.set(1,0.45,1.3);l.position.set(Math.sin(a)*0.32,0.32,Math.cos(a)*0.32);l.rotation.set(Math.cos(a)*0.7,0,-Math.sin(a)*0.7);g.add(l);}
  g.position.set(FB.x-1.8+c*1.2,0.12,FB.z-1.4+r*1.05);g.rotation.y=Math.random()*3;shade(g);scene.add(g);fieldCabs.push({g,pulls:0,gone:false,regrow:0,base:g.position.clone()});}
function fieldPull(fc,byMe){
  if(fc.gone)return;fc.pulls++;const g=fc.g;
  if(fc.pulls<3){tween(0.25,p=>{g.rotation.z=Math.sin(p*Math.PI*3)*0.25;g.position.y=fc.base.y+0.1*fc.pulls*ease(p);});if(byMe)bubble('me',me,myNick,fc.pulls===1?'영차!':'영~차!');emitP('burst',fc.base.clone().setY(0.2),6,0x6b4a2a);return;}
  fc.gone=true;fc.regrow=12+Math.random()*8;const s=g.position.clone(),e=V(-9.4,0.6,-1.2);
  emitP('burst',fc.base.clone().setY(0.2),14,0x6b4a2a);
  tween(0.9,p=>{const k=ease(p);g.position.lerpVectors(s,e,k);g.position.y+=Math.sin(p*Math.PI)*3;g.rotation.x=p*4;},()=>{g.visible=false;g.rotation.set(0,Math.random()*3,0);});
  if(byMe){toast(randOf(['쑥!','뽑았다!','실하다~']));did('pull');}
}
// ---------- 김장독 묻기 ----------
const BB=ZONES.bury;const HOLE=V(BB.x,0,BB.z-0.2);
const holeDisc=new THREE.Mesh(new THREE.CircleGeometry(0.8,32),M(0x3f2a1b,{roughness:1}));holeDisc.rotation.x=-Math.PI/2;holeDisc.position.set(HOLE.x,0.025,HOLE.z);holeDisc.scale.setScalar(0.05);scene.add(holeDisc);
const mound=new THREE.Mesh(new THREE.SphereGeometry(0.7,16,10),M(0x8a6440,{roughness:1}));mound.scale.set(1,0.01,1);mound.position.set(HOLE.x+1.4,0,HOLE.z-0.6);scene.add(shade(mound));
const ongPts=[[0,0],[0.32,0.02],[0.48,0.25],[0.52,0.5],[0.42,0.78],[0.28,0.86],[0.28,0.92]].map(p=>new THREE.Vector2(p[0],p[1]));
const ongGeo=new THREE.LatheGeometry(ongPts,24),ongM=M(0x5b3a26,{roughness:.35,metalness:.1});
const ong=new THREE.Mesh(ongGeo,ongM);ong.scale.setScalar(1.35);ong.visible=false;scene.add(shade(ong));
const ongFill=new THREE.Mesh(new THREE.CircleGeometry(0.36,20),M(0xb8321f));ongFill.rotation.x=-Math.PI/2;ongFill.visible=false;scene.add(ongFill);
const strawTex=canvasTex(64,64,(g,w,h)=>{g.fillStyle='#d9b45a';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=4){g.fillStyle=x%8?'#c49a42':'#e8c873';g.fillRect(x,0,2,h);}},[4,1]);
const strawGeo=new THREE.ConeGeometry(0.7,1.1,14,1,true),strawM=new THREE.MeshStandardMaterial({map:strawTex,roughness:1,side:THREE.DoubleSide});
const straw=new THREE.Mesh(strawGeo,strawM);straw.visible=false;scene.add(shade(straw));
const trophies=[];
let bury={step:'dig',dig:0,fill:0,last:null};
function resetBury(){bury={step:'dig',dig:0,fill:0,last:null};holeDisc.scale.setScalar(0.05);mound.scale.set(1,0.01,1);ong.visible=false;ongFill.visible=false;straw.visible=false;}
function buryTrophy(){const i=trophies.length%6;if(trophies[i])scene.remove(trophies[i]);const t=new THREE.Group();const s=new THREE.Mesh(strawGeo,strawM);s.scale.setScalar(0.6);s.position.y=0.33;t.add(s);
  const d=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.5,0.08,14),M(0x6b4a2a));t.add(d);t.position.set(10.0+Math.floor(i/3)*0.95,0,BB.z-1.0+(i%3)*0.95);scene.add(shade(t));trophies[i]=t;}
// signs + tap targets
function roundRect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function drawSign(c,text){const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.fillStyle='#fffaf1';g.strokeStyle='#2b211c';g.lineWidth=5;roundRect(g,8,8,304,64,18);g.fill();g.stroke();
  g.fillStyle='#2b211c';g.font='36px Jua, "Apple SD Gothic Neo", sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,160,42,280);}
const zoneHits=[];
ZKEYS.forEach(k=>{const z=ZONES[k];const c=document.createElement('canvas');c.width=320;c.height=80;drawSign(c,z.name);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthWrite:false}));s.scale.set(2.4,0.6,1);s.position.set(z.x,k==='rest'?2.5:3.0,z.z-(k==='eat'?1.3:0.2));s.userData={zone:k,c};scene.add(s);z.sign=s;zoneHits.push(s);});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{ZKEYS.forEach(k=>{const s=ZONES[k].sign;drawSign(s.userData.c,ZONES[k].name);s.material.map.needsUpdate=true;});people().forEach(p=>setLabel(p.label,p.name,p.isMe));});

// walk marker
const marker=new THREE.Mesh(new THREE.RingGeometry(0.28,0.4,32),new THREE.MeshBasicMaterial({color:0xfffaf1,transparent:true,opacity:0,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=0.03;scene.add(marker);

// leaves
const leaves=[];const leafColors=[0xe0802f,0xd9572b,0xe8b13c,0xc9452a];
for(let i=0;i<22;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.13),new THREE.MeshLambertMaterial({color:leafColors[i%4],side:THREE.DoubleSide}));resetLeaf(m,true);scene.add(m);leaves.push(m);}
function resetLeaf(m,init){const tree=Math.random()<.5?[-9.4,-7.6]:[9.6,5.4];const near=Math.random()<.6;
  m.position.set(near?tree[0]+(Math.random()-.5)*5:(Math.random()-.5)*22,init?Math.random()*7:5+Math.random()*2,near?tree[1]+(Math.random()-.5)*5:(Math.random()-.5)*16-1);m.userData.s=0.3+Math.random()*0.4;m.userData.p=Math.random()*6;}

// particles
const pGeo=new THREE.BoxGeometry(0.035,0.035,0.035);const pMat={};function pm(c){return pMat[c]||(pMat[c]=new THREE.MeshBasicMaterial({color:c}));}
const parts=[];for(let i=0;i<260;i++){const m=new THREE.Mesh(pGeo,pm(0xffffff));m.visible=false;m.userData={v:V(0,0,0),life:0,floor:0};scene.add(m);parts.push(m);}
let pIdx=0;
function emitP(kind,p,n,color){for(let i=0;i<n;i++){const m=parts[pIdx++%parts.length];m.visible=true;
  if(kind==='fall'){m.material=pm(color||0xffffff);m.position.set(p.x+(Math.random()-.5)*.4,p.y+0.9+Math.random()*.4,p.z+(Math.random()-.5)*.4);m.userData.v.set(0,-1,0);}
  else{m.material=Math.random()<.85?pm(color||0xb5281a):pm(0xf3e6c4);m.position.copy(p);m.position.y+=0.05;m.userData.v.set((Math.random()-.5)*2.2,1+Math.random()*1.6,(Math.random()-.5)*2.2);}
  m.userData.life=1;m.userData.floor=p.y;}}

// ---------- cabbage half ----------
function mix(a,b,t){return '#'+new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString();}
function drawBase(g,wilt){g.fillStyle=wilt?'#efe2a6':'#f6eebc';g.fillRect(0,0,512,512);
  for(let k=16;k>=1;k--){const rx=k*21,ry=k*34;g.beginPath();for(let a=0;a<=Math.PI+0.001;a+=0.04){const w=1+0.045*Math.sin(a*9+k*1.7);const x=256+Math.cos(a)*rx*w,y=24+Math.sin(a)*ry*w;a===0?g.moveTo(x,y):g.lineTo(x,y);}
    g.closePath();const t=Math.pow(k/16,1.6);g.fillStyle=k%2?mix(wilt?'#f3e8b4':'#fbf6d8',wilt?'#b8cc84':'#c9e19a',t):mix(wilt?'#ead99a':'#f2e7a8',wilt?'#a5c070':'#b4d486',t);g.fill();g.strokeStyle='rgba(110,140,60,.35)';g.lineWidth=2;g.stroke();}
  g.fillStyle='#fffbe6';g.beginPath();g.ellipse(256,24,26,64,0,0,Math.PI*2);g.fill();g.lineWidth=22;g.strokeStyle=wilt?'#7d9a4c':'#6a9b44';g.beginPath();g.arc(256,256,250,0,Math.PI*2);g.stroke();}
const SX=0.85,SZ=1.6,UW=2*SX,VW=2*SZ;
const GRID=14,cells=[];for(let j=0;j<GRID;j++)for(let i=0;i<GRID;i++){const u=(i+.5)/GRID,v=(j+.5)/GRID;if((u-.5)**2+(v-.5)**2<0.44**2)cells.push({u,v});}
function domeGeo(){const geo=new THREE.SphereGeometry(1,48,20,0,Math.PI*2,0,Math.PI/2);const pos=geo.attributes.position,cols=[];const green=new THREE.Color(0x4a8532),pale=new THREE.Color(0xeef0c6);
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);const ang=Math.atan2(x,z);const d=1+0.045*Math.sin(ang*11+y*7)+0.025*Math.sin(ang*27);pos.setXYZ(i,x*d,y,z*d);const c=green.clone().lerp(pale,Math.pow((z+1)/2,1.2));cols.push(c.r,c.g,c.b);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();return geo;}
function makeCabbage(wilted){const grp=new THREE.Group();const domeMat=M(0xffffff,{vertexColors:true,roughness:.7,side:THREE.DoubleSide});
  const dome=new THREE.Mesh(domeGeo(),domeMat);dome.rotation.x=Math.PI;dome.scale.set(SX,wilted?0.48:0.7,SZ);dome.castShadow=true;if(wilted)domeMat.color.setRGB(1,0.97,0.82);
  const fc=document.createElement('canvas');fc.width=fc.height=512;const base=document.createElement('canvas');base.width=base.height=512;drawBase(base.getContext('2d'),!!wilted);
  const salt=document.createElement('canvas');salt.width=salt.height=512;const paint=document.createElement('canvas');paint.width=paint.height=512;const tex=new THREE.CanvasTexture(fc);
  const face=new THREE.Mesh(new THREE.CircleGeometry(0.985,72),M(0xffffff,{map:tex,roughness:.85}));face.rotation.x=-Math.PI/2;face.scale.set(SX,SZ,1);face.position.y=0.002;face.receiveShadow=true;
  grp.add(dome,face);grp.rotation.y=Math.PI/2+0.12;
  const c={grp,dome,domeMat,face,fc,base,salt,paint,tex,depth:wilted?0.48:0.7,dirty:true,saltAmt:0,cov:new Float32Array(cells.length),coverage:0};compose(c);return c;}
function compose(c){const g=c.fc.getContext('2d');g.drawImage(c.base,0,0);g.drawImage(c.salt,0,0);g.drawImage(c.paint,0,0);c.tex.needsUpdate=true;c.dirty=false;}
function stampSalt(c,u,v){const g=c.salt.getContext('2d');const px=u*512,py=(1-v)*512;for(let i=0;i<22;i++){const a=Math.random()*6.283,r=Math.random();g.fillStyle='rgba(255,255,255,'+(0.6+Math.random()*.4)+')';g.fillRect(px+Math.cos(a)*r*60,py+Math.sin(a)*r*32,2+Math.random()*2.5,2+Math.random()*2.5);}c.saltAmt+=0.021;c.dirty=true;}
function stampPaint(c,u,v){const g=c.paint.getContext('2d');const px=u*512,py=(1-v)*512;g.save();g.translate(px,py);g.scale(1,UW/VW);
  for(let i=0;i<7;i++){const a=Math.random()*6.283,r=Math.random()*55;g.fillStyle='rgba('+(170+Math.random()*30|0)+','+(30+Math.random()*25|0)+',20,'+(0.35+Math.random()*.3)+')';g.beginPath();g.arc(Math.cos(a)*r,Math.sin(a)*r,18+Math.random()*26,0,6.283);g.fill();}
  for(let i=0;i<26;i++){const a=Math.random()*6.283,r=Math.random()*80;g.fillStyle=Math.random()<.8?'rgba(140,18,10,.85)':'rgba(240,235,220,.8)';g.fillRect(Math.cos(a)*r,Math.sin(a)*r,2+Math.random()*3,2+Math.random()*3);}
  g.restore();const R=0.3;let n=0;for(let i=0;i<cells.length;i++){const dx=(cells[i].u-u)*UW,dy=(cells[i].v-v)*VW;if(dx*dx+dy*dy<R*R)c.cov[i]=Math.min(1,c.cov[i]+0.5);if(c.cov[i]>=1)n++;}
  c.coverage=n/cells.length;c.domeMat.color.setRGB(1,0.97-0.4*c.coverage,0.82-0.4*c.coverage);c.dirty=true;}
function uvToWorld(c,u,v){return c.face.localToWorld(V((u-.5)*2,(v-.5)*2,0));}
function helpStamp(){if(!cab)return;
  if(myZone==='mix'){let best=0;for(let k=0;k<8;k++){const i=Math.random()*cells.length|0;if(k===0||cab.cov[i]<cab.cov[best])best=i;}const cl=cells[best];stampPaint(cab,cl.u,cl.v);emitP('burst',uvToWorld(cab,cl.u,cl.v),5);}
  else if(myZone==='salt'&&cab.saltAmt<0.7){const cl=cells[Math.random()*cells.length|0];stampSalt(cab,cl.u,cl.v);emitP('fall',uvToWorld(cab,cl.u,cl.v),5);}
  updatePanelMeter();}

// ---------- chibi people ----------
function setLabel(s,text,me){const c=s.userData.c,g=c.getContext('2d');g.clearRect(0,0,256,64);g.font='28px Jua, "Apple SD Gothic Neo", sans-serif';
  const w=Math.min(240,g.measureText(text).width+28),x=(256-w)/2;g.fillStyle=me?'#f1e3a0':'rgba(255,250,241,.95)';g.strokeStyle='#2b211c';g.lineWidth=4;roundRect(g,x,6,w,52,16);g.fill();g.stroke();
  g.fillStyle='#2b211c';g.textAlign='center';g.textBaseline='middle';g.fillText(text,128,33,220);s.material.map.needsUpdate=true;}
const skinM=M(0xf6d2b0,{roughness:.6}),eyeM=M(0x2b211c,{roughness:.3}),cheekM=M(0xf3a094),gloveM=M(0xd8323a,{roughness:.4}),shoeM=M(0x3b3430),apronM=M(0xf6f1e6,{side:THREE.DoubleSide});
function makePerson(o){
  const g=new THREE.Group(),inner=new THREE.Group();g.add(inner);
  [-0.14,0.14].forEach(x=>{const f=new THREE.Mesh(new THREE.SphereGeometry(0.12,12,8),shoeM);f.scale.set(1,0.6,1.35);f.position.set(x,0.07,0.04);inner.add(f);});
  const body=new THREE.Mesh(new THREE.SphereGeometry(0.36,20,16),M(o.cloth));body.scale.set(1,1.1,0.9);body.position.y=0.5;inner.add(body);
  const apron=new THREE.Mesh(new THREE.SphereGeometry(0.372,20,16,Math.PI/2-0.85,1.7,0.55,1.6),apronM);apron.scale.set(1,1.1,0.9);apron.position.y=0.5;inner.add(apron);
  const head=new THREE.Group();head.position.y=1.18;inner.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(0.42,24,18),skinM));
  [-0.14,0.14].forEach(x=>{const e=new THREE.Mesh(new THREE.SphereGeometry(0.045,10,8),eyeM);e.scale.set(1,1.35,0.6);e.position.set(x,0.02,0.39);head.add(e);
    const c=new THREE.Mesh(new THREE.SphereGeometry(0.065,10,8),cheekM);c.scale.set(1,0.6,0.4);c.position.set(x*1.7,-0.09,0.34);head.add(c);});
  const mouth=new THREE.Mesh(new THREE.TorusGeometry(0.05,0.013,6,12,Math.PI),eyeM);mouth.rotation.z=Math.PI;mouth.position.set(0,-0.1,0.405);head.add(mouth);
  if(o.cap){const cap=new THREE.Mesh(new THREE.SphereGeometry(0.44,24,10,0,Math.PI*2,0,Math.PI/2),M(o.cap));cap.position.y=0.05;head.add(cap);
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.04,16,1,false,-1,2),M(o.cap));brim.position.set(0,0.08,0.3);head.add(brim);}
  else{const sc=new THREE.Mesh(new THREE.SphereGeometry(0.445,24,10,0,Math.PI*2,0,Math.PI/2),M(o.scarf));sc.position.set(0,0.04,-0.03);sc.rotation.x=-0.5;head.add(sc);
    const kn=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,8),M(o.scarf));kn.position.set(0,0.42,0.18);head.add(kn);}
  const arms=[];[-1,1].forEach(s=>{const pv=new THREE.Group();pv.position.set(s*0.33,0.68,0);const a=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.085,0.34,10),M(o.cloth));a.position.y=-0.17;pv.add(a);
    const h=new THREE.Mesh(new THREE.SphereGeometry(0.11,12,10),gloveM);h.position.y=-0.36;pv.add(h);pv.rotation.z=s*0.35;inner.add(pv);arms.push(pv);});
  const lc=document.createElement('canvas');lc.width=256;lc.height=64;const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(lc),depthWrite:false}));label.scale.set(1.5,0.375,1);label.userData.c=lc;label.position.y=2.0;g.add(label);
  setLabel(label,o.name,o.me);
  shade(inner);scene.add(g);
  return {g,inner,head,arms,label,name:o.name,zone:'rest',slot:0,target:g.position.clone(),phase:Math.random()*6,gest:null,moving:false};
}
function people(){const a=npcs.slice();peers.forEach(p=>a.push(p));if(me)a.push(me);return a;}
function personHead(p,out){return out.copy(p.g.position).setY(2.25);}
function sendTo(p,zk,slot){p.zone=zk;p.slot=slot;p.target.copy(slotPos(zk,slot));}
function gesture(p,type){p.gest={type,t:0};}
function animatePerson(p,dt,working){
  const L=p.arms[0],R=p.arms[1];p.inner.rotation.x=0;p.inner.position.y=0;
  if(p.gest){p.gest.t+=dt;const t=p.gest.t;
    if(p.gest.type==='bow'){p.inner.rotation.x=Math.sin(Math.min(1,t/1.2)*Math.PI)*0.55;L.rotation.set(0,0,-0.2);R.rotation.set(0,0,0.2);}
    else if(p.gest.type==='wave'){R.rotation.set(0,0,2.5+Math.sin(t*12)*0.35);L.rotation.set(0,0,-0.35);}
    else if(p.gest.type==='hooray'){p.inner.position.y=Math.abs(Math.sin(t*7))*0.35;L.rotation.set(0,0,-2.7);R.rotation.set(0,0,2.7);}
    if(t>1.4)p.gest=null;return;}
  if(p.moving){const s=Math.sin(time*11+p.phase);p.inner.position.y=Math.abs(s)*0.09;L.rotation.set(s*0.8,0,-0.35);R.rotation.set(-s*0.8,0,0.35);return;}
  if(working){const s=Math.sin(time*(7+p.phase)+p.phase);L.rotation.set(-1.25+s*0.3,0,-0.15);R.rotation.set(-1.25-s*0.3,0,0.15);p.inner.position.y=Math.abs(s)*0.02;return;}
  p.inner.position.y=Math.sin(time*2+p.phase)*0.015;L.rotation.set(0,0,-0.35);R.rotation.set(0,0,0.35);p.head.rotation.z=Math.sin(time*0.8+p.phase)*0.05;
}
const tmpV=V(0,0,0),tmpD=V(0,0,0);
function walk(p,dt){tmpD.copy(p.target).sub(p.g.position);tmpD.y=0;const dist=tmpD.length();
  if(dist>0.05){const step=Math.min(dist,3.4*dt);p.g.position.addScaledVector(tmpD.normalize(),step);const want=Math.atan2(tmpD.x,tmpD.z);p.g.rotation.y=lerpAng(p.g.rotation.y,want,Math.min(1,dt*10));p.moving=true;return false;}
  p.moving=false;if(p.zone&&ZONES[p.zone]&&zoneAt(p.g.position)===p.zone){const z=ZONES[p.zone];p.g.rotation.y=lerpAng(p.g.rotation.y,Math.atan2(z.x-p.g.position.x,z.z-p.g.position.z),Math.min(1,dt*6));}return true;}
function lerpAng(a,b,t){let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return a+d*t;}

function subj(name,honor){if(honor)return name+'님이';const ch=name.charCodeAt(name.length-1);const bat=ch>=0xAC00&&ch<=0xD7A3&&((ch-0xAC00)%28)!==0;return name+(bat?'이':'가');}
function shortName(n){const p=n.split(' ');return p[p.length-1];}

// NPC 이웃
const NPCDEF=[
  {name:'옆집 할머니',cloth:0x8a6d55,scarf:0x7b5ea7,pref:['field','salt','salt','rest','bury'],lines:['아이고 허리야~','옛날엔 백 포기씩 했어','천천히 해, 천천히']},
  {name:'김장 고수 이모',cloth:0x3f6e8c,scarf:0xd9572b,pref:['sauce','mix','mix','salt'],lines:['잎사귀 사이사이 꼼꼼히!','양념 아끼지 마라~','소금은 줄기 쪽에 더 쳐']},
  {name:'막내 삼촌',cloth:0x5d7a3a,cap:0x2f4b7a,pref:['eat','field','field','rest','eat'],lines:['나 이거 처음 해봐','수육은 언제 나와요?','막걸리 한잔 더?']},
  {name:'동네 친구 수진',cloth:0xcf7a9a,scarf:0xe8b13c,pref:['mix','sauce','eat','field','bury'],lines:['인증샷 찍어야지 ㅋㅋ','끝나고 수육 먹자','내년에도 같이 하자']},
  {name:'통장님',cloth:0x6d6875,cap:0x9c2f2f,pref:['rest','bury','bury','eat','mix'],lines:['올해 배추 실하네~','다들 고생 많아요','김치통 모자라면 말해요']},
  {name:'윗집 새댁',cloth:0x81b29a,scarf:0xf2cc8f,pref:['sauce','sauce','mix','eat'],lines:['액젓 이 정도면 돼요?','마늘 더 넣을까요?','저 이번이 첫 김장이에요']}
];
const ACT={pull:'배추 한 포기 뽑았어요',bury:'김장독 하나 묻었어요',salt:'배추 한 쪽 절였어요',sauce:'양념 한 통 만들었어요',mix:'김치 한 쪽 버무렸어요',eat:'수육 한 점 먹었어요',wrap:'김치에 수육 싸 먹었어요',drink:'막걸리 한 잔 했어요'};
let yardKimchi=14;
const npcs=NPCDEF.map((d,i)=>{const p=makePerson(d);p.def=d;p.i=i;const zk=randOf(d.pref);sendTo(p,zk,1+((i*3)%7));p.g.position.copy(p.target);p.timer=4+Math.random()*10;p.pause=0;p.inner.userData.who={t:'npc',i};return p;});
for(let i=0;i<yardKimchi;i++)placePiece(boxFill++);

let me=null,myNick='',myZone=null,time=0;
const stats={pull:0,salt:0,sauce:0,mix:0,bury:0,eat:0,help:0,gave:0,got:0};let inv=0;
let R=null,lastSent='';
const peers=new Map();
const PEER_STYLE=[[0x6c8fb3,0xe07a5f],[0xa66b9e,0x81b29a],[0x6a994e,0xf2cc8f],[0x8d6e63,0x9fa8da],[0x457b9d,0xe9c46a],[0xb56576,0x6d9dc5]];
function cleanNick(s){return typeof s==='string'?s.replace(/[\u0000-\u001f​-‏‪-‮]/g,'').trim().slice(0,8):'';}

// ---------- feed, bubbles, toast ----------
const feedEl=$('#feed');
function feed(text,mine){const li=document.createElement('li');li.textContent=text;if(mine)li.className='me';feedEl.prepend(li);while(feedEl.children.length>3)feedEl.lastChild.remove();setTimeout(()=>{li.classList.add('out');setTimeout(()=>li.remove(),900);},6000);}
function feedAct(name,honor,a,mine){feed((mine?'내가':subj(name,honor))+' '+(ACT[a]||'김장했어요'),mine);}
const bubbleLayer=$('#bubbles');const bubbles=new Map();
function bubble(key,person,who,text){let b=bubbles.get(key);
  if(!b){const el=document.createElement('div');el.className='bub';const nb=document.createElement('b');const sp=document.createElement('span');el.append(nb,sp);bubbleLayer.appendChild(el);b={el,nb,sp,t:0};bubbles.set(key,b);}
  if(b.el.hidden){let vis=[];bubbles.forEach(o=>{if(o!==b&&!o.el.hidden)vis.push(o);});if(vis.length>=2){vis.sort((x,y)=>x.t-y.t);vis[0].el.hidden=true;}}b.person=person;b.nb.textContent=who;b.sp.textContent=text;b.t=2.8;b.el.hidden=false;b.el.style.animation='none';void b.el.offsetWidth;b.el.style.animation='';}
function placeBubbles(dt){const W=innerWidth,H=innerHeight;bubbles.forEach(b=>{if(b.el.hidden)return;b.t-=dt;if(b.t<=0||!b.person){b.el.hidden=true;return;}
  personHead(b.person,tmpV);tmpV.project(camera);if(tmpV.z>1){b.el.style.transform='translate(-999px,0)';return;}const bw=b.el.offsetWidth,bh=b.el.offsetHeight;
  let x=(tmpV.x*.5+.5)*W-bw/2,y=(-tmpV.y*.5+.5)*H-bh-4;x=Math.max(16,Math.min(W-16-bw,x));y=Math.max(110,Math.min(H-300-bh,y));b.el.style.transform='translate('+x.toFixed(0)+'px,'+y.toFixed(0)+'px)';});}
function sayNpc(i,t){const n=npcs[i];bubble('n'+i,n,n.name,t);n.pause=1.4;}
function npcNear(zk){const l=npcs.filter(n=>n.zone===zk&&!n.moving);return l.length?randOf(l):randOf(npcs);}
let toastT=0;const toastEl=$('#toast');
function toast(t){toastEl.textContent=t;toastEl.classList.remove('show');void toastEl.offsetWidth;toastEl.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('show'),1500);}
// ---------- 김치 나눔 ----------
let picked=null;
function whoObj(w){return w.t==='npc'?npcs[w.i]:peers.get(w.peer);}
function openPerson(w){const p=whoObj(w);if(!p)return;closePops();picked=w;
  $('#ppName').textContent=p.name+(w.t==='npc'?' (이웃)':'');
  const g=$('#ppGift');g.textContent=inv>0?'김치 나눠주기 · 내 김치 '+inv+'통':'김치 나눠주기';g.disabled=false;
  $('#ppHelp').hidden=w.t==='peer'&&!R;$('#personPop').hidden=false;}
const giftGeo=new THREE.BoxGeometry(0.5,0.32,0.36),giftLidGeo=new THREE.BoxGeometry(0.54,0.07,0.4),giftM=M(0xb8321f,{roughness:.5}),giftLidM=M(0x4f9a56);
function flyGift(from,to,done){const g=new THREE.Group();g.add(new THREE.Mesh(giftGeo,giftM));const l=new THREE.Mesh(giftLidGeo,giftLidM);l.position.y=0.19;g.add(l);
  const s=personHead(from,V(0,0,0)).setY(1.4),e=V(0,0,0);g.position.copy(s);scene.add(g);
  tween(1.1,p=>{personHead(to,e).setY(1.4);const k=ease(p);g.position.lerpVectors(s,e,k);g.position.y+=Math.sin(p*Math.PI)*2.2;g.rotation.y=p*Math.PI*2;g.scale.setScalar(0.8+Math.sin(p*Math.PI)*0.5);},
    ()=>{scene.remove(g);emitP('burst',e.clone().setY(1.2),14,0xb8321f);if(done)done();});}
function giveKimchi(){const w=picked;closePops();if(!w||!me)return;const p=whoObj(w);if(!p)return;
  if(inv<=0){toast('김치부터 버무려요');sayNpc(npcNear('mix').i,'속 버무리기 가서 한 쪽 해 와~');return;}
  if(w.t==='peer'){if(!R){toast('지금은 연결이 끊겼어요');return;}R.emit('gift',{to:w.peer}).catch(()=>{});}
  inv--;stats.gave++;gesture(me,'bow');feed('내가 '+(w.t==='npc'?shortName(p.name):p.name+'님')+'에게 김치 한 통 나눴어요',true);
  flyGift(me,p,()=>{gesture(p,'hooray');
    if(w.t==='npc'){sayNpc(w.i,randOf(['아이고 고마워라~','이거 우리 손주 줘야겠다','맛있겠다! 잘 먹을게','내년엔 내가 줄게~']));
      if(Math.random()<.35)setTimeout(()=>{if(!me)return;flyGift(p,me,()=>{inv++;stats.got++;toast(shortName(p.name)+' 답례 김치!');gesture(me,'hooray');});sayNpc(w.i,'이건 우리 집 김치, 맛 좀 봐~');},1800);}});
}
function receivedGift(fromName,fromPerson){inv++;stats.got++;toast(fromName+'님이 김치 한 통 줬어요!');feed(subj(fromName,true)+' 나에게 김치 한 통 나눴어요',true);
  if(fromPerson&&me)flyGift(fromPerson,me,()=>gesture(me,'hooray'));}
$('#ppHelp').addEventListener('click',()=>{const w=picked;closePops();if(!w)return;if(w.t==='npc')helpNpc(w.i);else helpPeer(w.peer);});
$('#ppGift').addEventListener('click',giveKimchi);
$('#ppClose').addEventListener('click',closePops);
let npcGiftT=70;
function did(a){if(a in stats)stats[a]++;feedAct(myNick,false,a,true);if(R)R.emit('did',{a}).catch(()=>{});if(a==='mix'){yardKimchi++;inv++;updateTags();}}

// ---------- panel ----------
const pTitle=$('#pTitle'),pHint=$('#pHint'),mrow=$('#mrow'),mfill=$('#mfill'),mzone=$('#mzone'),mlab=$('#mlab'),acts=$('#acts');
function btn(text,cls,fn){const b=document.createElement('button');b.type='button';b.textContent=text;if(cls)b.className=cls;b.addEventListener('click',fn);acts.append(b);return b;}
let cab=null,mainBtn=null,gen=0,warned=false;
const INGS=[{k:'gochu',n:'고춧가루',c:0xb8281a},{k:'garlic',n:'다진 마늘',c:0xf2ead0},{k:'ginger',n:'생강',c:0xe0c27a},{k:'jeot',n:'멸치액젓',c:0x6b4a2a},{k:'radish',n:'무채',c:0xf6f3ea},{k:'pa',n:'쪽파',c:0x5f9a3a}];
let sauce={added:new Set(),stir:0,angle:0,lastA:null};
function drawSauce(){const g=sauceCanvas.getContext('2d');const n=sauce.added.size;
  const base=new THREE.Color(0xe8dcc4);if(sauce.added.has('gochu'))base.lerp(new THREE.Color(0xb02a18),0.55+0.4*Math.min(1,sauce.stir));if(sauce.added.has('jeot'))base.lerp(new THREE.Color(0x6b2a14),0.12);
  g.fillStyle=n?'#'+base.getHexString():'#c9ced3';g.fillRect(0,0,256,256);const k=1-Math.min(1,sauce.stir);
  INGS.forEach((ing,j)=>{if(!sauce.added.has(ing.k))return;g.fillStyle='#'+new THREE.Color(ing.c).getHexString();for(let i=0;i<60*k+8;i++){const a=Math.random()*6.283,r=Math.random()*(40+70*(1-k));g.globalAlpha=0.7;g.fillRect(128+Math.cos(a)*r+(j-2.5)*22*k,128+Math.sin(a)*r,4,4);}});
  g.globalAlpha=1;g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=3;g.beginPath();for(let t=0;t<14;t+=0.1){const r=t*8;g.lineTo(128+Math.cos(t)*r,128+Math.sin(t)*r);}g.stroke();
  sauceTex.needsUpdate=true;sauceDisc.position.y=n?0.14+0.05*n:0.06;}
drawSauce();
function updatePanelMeter(){
  if(myZone==='salt'&&cab){mrow.hidden=false;mzone.hidden=false;mfill.style.background='#8fb0c6';mfill.style.width=Math.min(100,cab.saltAmt*100)+'%';mlab.textContent='소금 '+Math.round(cab.saltAmt*100)+'%';if(mainBtn)mainBtn.disabled=cab.saltAmt<0.2;}
  else if(myZone==='mix'&&cab){mrow.hidden=false;mzone.hidden=true;mfill.style.background='var(--chili)';mfill.style.width=cab.coverage*100+'%';mlab.textContent='양념 '+Math.round(cab.coverage*100)+'%';if(mainBtn)mainBtn.disabled=cab.coverage<0.35;}
  else if(myZone==='sauce'){mrow.hidden=false;mzone.hidden=true;mfill.style.background='var(--chili)';const s=sauce.added.size<4?sauce.added.size/6*0.5:0.5+0.5*Math.min(1,sauce.stir);mfill.style.width=s*100+'%';mlab.textContent=sauce.added.size<4?'재료 '+sauce.added.size+'/6':'젓기 '+Math.round(Math.min(1,sauce.stir)*100)+'%';}
  else if(myZone==='bury'&&bury.step==='dig'){mrow.hidden=false;mzone.hidden=true;mfill.style.background='#8a6440';mfill.style.width=bury.dig*100+'%';mlab.textContent='파기 '+Math.round(bury.dig*100)+'%';}
  else mrow.hidden=true;}
function renderBury(){if(myZone!=='bury')return;acts.textContent='';
  if(bury.step==='dig'){pHint.textContent='구덩이 자리를 문질러 땅을 파요.';}
  if(bury.step==='jar'){pHint.textContent='구덩이 다 팠다!';btn('독 넣기','',()=>{bury.step='lower';acts.textContent='';ong.visible=true;ong.position.set(HOLE.x,2.4,HOLE.z);
    tween(1.0,p=>{ong.position.y=2.4-3.15*ease(p);},()=>{bury.step='fill';renderBury();});});}
  if(bury.step==='fill'){pHint.textContent='김치를 꾹꾹 눌러 담아요.';btn('김치 담기 ('+bury.fill+'/3)','',()=>{bury.fill++;emitP('fall',V(HOLE.x,0.5,HOLE.z),14,0xb8321f);ongFill.visible=true;ongFill.position.set(HOLE.x,0.08+0.12*bury.fill,HOLE.z);
    if(bury.fill>=3){bury.step='cover';}renderBury();});}
  if(bury.step==='cover'){pHint.textContent='뚜껑 덮고 짚 씌우면 끝.';btn('짚 씌우기','leaf',()=>{acts.textContent='';straw.visible=true;straw.position.set(HOLE.x,3,HOLE.z);
    tween(0.7,p=>{straw.position.y=3-2.45*ease(p);},()=>{bury.step='done';toast('김장독 하나 묻었다!');did('bury');gesture(me,'hooray');sayNpc(npcNear('bury').i,randOf(['봄까지 맛있게 익겠다~','이제 땅이 김치 냉장고지','잘 묻었네!']));
      const g=gen;setTimeout(()=>{if(g!==gen)return;buryTrophy();resetBury();renderBury();updatePanelMeter();},1600);});});}
  updatePanelMeter();}
function clearActivity(){gen++;if(cab){scene.remove(cab.grp);cab.tex.dispose();cab=null;}mainBtn=null;}
function spawnCab(zk){const g=gen;const z=ZONES[zk];cab=makeCabbage(zk==='mix');cab.grp.position.set(z.x+0.1,5,z.z);scene.add(cab.grp);cab.grp.scale.setScalar(0.82);const c=cab;
  tween(0.7,p=>{if(g!==gen)return;c.grp.position.y=0.03+c.depth*0.82+(1-ease(p))*4.5;});updatePanelMeter();}
function setupZone(zk){
  clearActivity();acts.textContent='';warned=false;myZone=zk;
  $('#panel').hidden=!zk;if(zk)pTitle.textContent=ZONES[zk].name;
  if(zk==='field'){pHint.textContent='배추를 세 번 눌러 쑥 뽑아요.';}
  if(zk==='bury'){if(bury.step==='done')resetBury();if(bury.step==='lower'){bury.step='fill';ong.position.set(HOLE.x,-0.75,HOLE.z);}renderBury();}
  if(zk==='rest'){pHint.textContent='쉬어가요. 이웃을 누르면 거들어줘요.';btn('막걸리 한 잔','leaf',()=>{did('drink');toast('캬~');gesture(me,'hooray');});}
  if(zk==='salt'){pHint.textContent='단면을 문질러 소금 치기. 초록 칸에서 멈춰요.';spawnCab('salt');mainBtn=btn('절이기 완료','',finishSalt);mainBtn.disabled=true;}
  if(zk==='mix'){pHint.textContent='빈 곳 없이 문질러 양념 치대기.';spawnCab('mix');mainBtn=btn('버무리기 완료','',finishMix);mainBtn.disabled=true;}
  if(zk==='sauce'){sauce={added:new Set(),stir:0,angle:0,lastA:null};drawSauce();pHint.textContent='재료 넣고 그릇 안을 빙글빙글 저어요.';
    INGS.forEach(ing=>{const b=btn(ing.n,'ing',()=>{if(sauce.added.has(ing.k))return;sauce.added.add(ing.k);b.classList.add('used');emitP('fall',V(SB.x,0.3,SB.z),18,ing.c);drawSauce();updatePanelMeter();
      if(sauce.added.size===4)pHint.textContent='이제 그릇 안을 빙글빙글 저어요.';});});}
  if(zk==='eat'){pHint.textContent='갓 삶은 수육, 마음껏.';btn('수육 한 점','',()=>eatSlice(false));btn('김치에 싸서','',()=>eatSlice(true));btn('막걸리 짠','leaf',()=>{did('drink');toast('캬~');gesture(me,'hooray');});}
  updatePanelMeter();renderNav();pushPresence(true);
  if(zk){const z=ZONES[zk];camGoal.yaw=0;camGoal.pitch=zk==='rest'?0.7:0.92;camGoal.dist=z.dist;}else{camGoal.dist=Math.max(camGoal.dist,11);camGoal.pitch=Math.min(camGoal.pitch,0.85);}
}
function finishSalt(){if(!cab)return;const a=cab.saltAmt,c=cab,g=gen;
  sayNpc(npcNear('salt').i,a<0.47?'아이고 싱겁다~ 좀 더 쳐':a>0.88?'짜다 짜! 물에 헹구자':'간 딱 좋다, 잘했네');toast(a<0.47?'좀 싱거워요':a>0.88?'짜요 짜!':'간이 딱!');did('salt');
  cab=null;mainBtn.disabled=true;const s=c.grp.position.clone(),e=V(ZONES.mix.x-2.6,0.3,ZONES.mix.z+2.0);
  tween(0.5,p=>{c.dome.scale.y=0.7-0.22*p;c.domeMat.color.setRGB(1,1-0.03*p,1-0.18*p);},()=>{tween(0.9,p=>{const k=ease(p);c.grp.position.lerpVectors(s,e,k);c.grp.position.y+=Math.sin(p*Math.PI)*2.2;c.grp.scale.setScalar(0.82*(1-0.6*k));},()=>{scene.remove(c.grp);c.tex.dispose();if(g===gen&&myZone==='salt')spawnCab('salt');});});}
function finishMix(){if(!cab)return;const c=cab,g=gen,cov=c.coverage;toast(cov>0.85?'양념 꽉꽉!':cov>0.6?'고루 잘 묻었어요':'양념이 좀 비었어요');
  if(stats.salt<=stats.mix)sayNpc(npcNear('mix').i,'이모가 절여둔 거 갖다 썼다~');did('mix');cab=null;mainBtn.disabled=true;
  const r=reserveSlot(),s=c.grp.position.clone(),e=slots[r.i].clone();e.y+=0.3;
  tween(0.35,p=>{c.grp.scale.set(0.82,0.82*(1+0.15*p),0.82*(1-0.45*ease(p)));},()=>{tween(0.95,p=>{const k=ease(p);c.grp.position.lerpVectors(s,e,k);c.grp.position.y+=Math.sin(p*Math.PI)*2.4;const sc=0.82*(1-0.78*k);c.grp.scale.set(sc,sc*1.15,sc*0.55);c.grp.rotation.z=p*Math.PI*0.6;},()=>{scene.remove(c.grp);c.tex.dispose();landed(r);if(g===gen&&myZone==='mix')spawnCab('mix');});});}
function finishSauce(){toast('양념 한 통 완성!');did('sauce');gesture(me,'hooray');sayNpc(npcNear('sauce').i,randOf(['색 곱다~','이거면 열 포기는 하겠다','간 한번 봐봐, 딱이지?']));const g=gen;setTimeout(()=>{if(g===gen&&myZone==='sauce')setupZone('sauce');},1300);}
function eatSlice(wrap){const s=slices.find(x=>x.visible);if(!s){toast('새로 썰어 올게요~');layoutSlices();return;}
  s.visible=false;emitP('burst',s.position.clone(),4,0xdcb79c);stats.eat++;feedAct(myNick,false,wrap?'wrap':'eat',true);if(R)R.emit('did',{a:wrap?'wrap':'eat'}).catch(()=>{});
  toast(randOf(['냠','이 맛에 김장하지','하나 더?','야들야들~']));if(!slices.some(x=>x.visible))setTimeout(layoutSlices,900);
  if(Math.random()<.35)sayNpc(npcNear('eat').i,randOf(['많이 먹어~','김치랑 먹어야 제맛이지','새우젓도 찍어봐']));}

// ---------- nav + gestures ----------
const navEl=$('#nav');
function zoneCount(zk){let n=0;npcs.forEach(p=>{if(p.zone===zk)n++;});peers.forEach(p=>{if(p.zone===zk)n++;});if(myZone===zk)n++;return n;}
function renderNav(){navEl.textContent='';ZKEYS.forEach(k=>{const b=document.createElement('button');b.type='button';b.textContent=ZONES[k].name;const s=document.createElement('small');s.textContent=zoneCount(k)+'명';b.append(s);
  b.setAttribute('aria-current',String(myZone===k));b.addEventListener('click',()=>walkToZone(k));navEl.append(b);});}
function updateTags(){const n=1+npcs.length+peers.size;const c=$('#crowd');c.textContent=(peers.size?'친구 '+peers.size+' · ':'')+n+'명';c.className=R&&peers.size?'live':'';$('#yard').textContent='김치 '+yardKimchi+'쪽';}
function closePops(){['navPop','gestPop','personPop'].forEach(id=>$('#'+id).hidden=true);['navBtn','gestBtn'].forEach(id=>$('#'+id).setAttribute('aria-expanded','false'));}
function togglePop(id,bid){const open=$('#'+id).hidden;closePops();if(open){$('#'+id).hidden=false;$('#'+bid).setAttribute('aria-expanded','true');if(id==='navPop')renderNav();}}
$('#navBtn').addEventListener('click',()=>togglePop('navPop','navBtn'));
$('#gestBtn').addEventListener('click',()=>togglePop('gestPop','gestBtn'));
$('#gestPop').addEventListener('click',e=>{if(e.target.closest('button'))setTimeout(closePops,120);});
function walkToZone(k){if(!me)return;closePops();me.wantZone=k;me.zone=k;me.slot=0;me.target.copy(slotPos(k,0));showMarker(me.target);pushPresence(true);}
const GESTS=[{k:'bow',n:'꾸벅'},{k:'wave',n:'손 흔들기'},{k:'hooray',n:'만세'}];
const PHRASES=['수고했어요!','간 좀 봐줘요','수육 언제 나와요?'];
(function(){const gb=$('#gest');
  GESTS.forEach((gs,i)=>{const b=document.createElement('button');b.type='button';b.textContent=gs.n;b.addEventListener('click',()=>{if(!me)return;gesture(me,gs.k);if(R)R.emit('cheer',{i}).catch(()=>{});
    if(Math.random()<.6){const n=npcs.filter(x=>x.g.position.distanceTo(me.g.position)<7);if(n.length){const t=randOf(n);setTimeout(()=>{gesture(t,gs.k);},500);}}});gb.append(b);});
  PHRASES.forEach((t,j)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.addEventListener('click',()=>{if(!me)return;bubble('me',me,myNick,t);if(R)R.emit('cheer',{i:3+j}).catch(()=>{});
    setTimeout(()=>sayNpc(npcNear(myZone||'rest').i,j===0?'너도 수고했어~':j===1?randOf(['딱 좋다, 걱정 마','조금 싱거운데? 익으면 돼']):randOf(['지금 썰고 있어!','수육 자리로 와~'])),900);});gb.append(b);});})();

// ---------- helping ----------
function helpNpc(i){const n=npcs[i];stats.help++;n.timer=Math.max(0.5,n.timer-4);emitP('burst',personHead(n,V(0,0,0)).setY(0.6),10);gesture(n,'bow');
  sayNpc(i,randOf(['고마워라~','어이구 손 빠르다','덕분에 금방 끝나겠다','역시 품앗이가 최고여']));feed('내가 '+shortName(n.name)+' 거들었어요',true);}
function helpPeer(label){const p=peers.get(label);if(!p||!R)return;
  R.emit('help',{to:label}).then(()=>{stats.help++;feed('내가 '+p.name+'님 거들었어요',true);emitP('burst',personHead(p,V(0,0,0)).setY(0.6),10);}).catch(e=>toast(e&&e.code==='not_permitted'?'보기 전용이라 거들 수는 없어요':'잠깐 연결이 끊겼어요'));}
function receivedHelp(from){toast(from+'님이 거들어줬어요!');feed(subj(from,true)+' 나를 거들었어요');
  if(cab&&(myZone==='salt'||myZone==='mix')){let k=0;const g=gen;const iv=setInterval(()=>{if(g!==gen||k++>=6){clearInterval(iv);return;}helpStamp();},220);}}

// ---------- camera (orbit follow) ----------
const camCur={yaw:0,pitch:0.8,dist:13,target:V(0,0.8,4)},camGoal={yaw:0,pitch:0.8,dist:13,target:V(0,0.8,4)};
function updateCamera(dt){
  if(me){if(myZone&&!me.moving){const z=ZONES[myZone];camGoal.target.set(z.x,myZone==='rest'?0.9:0.4,z.z-(myZone==='eat'?0.5:0));}else camGoal.target.set(me.g.position.x,0.9,me.g.position.z);}
  else{camGoal.target.set(0,1.4,-1.5);camGoal.yaw=time*0.045;camGoal.dist=16;camGoal.pitch=0.38;}
  const k=1-Math.exp(-dt*3.2);camCur.target.lerp(camGoal.target,k);camCur.yaw=lerpAng(camCur.yaw,camGoal.yaw,k);camCur.pitch+= (camGoal.pitch-camCur.pitch)*k;camCur.dist+=(camGoal.dist-camCur.dist)*k;
  const d=camCur.dist*aspectK,cp=Math.cos(camCur.pitch);
  camera.position.set(camCur.target.x+Math.sin(camCur.yaw)*cp*d,camCur.target.y+Math.sin(camCur.pitch)*d,camCur.target.z+Math.cos(camCur.yaw)*cp*d);
  camera.lookAt(camCur.target);}
canvas.addEventListener('wheel',e=>{e.preventDefault();camGoal.dist=Math.max(4.5,Math.min(24,camGoal.dist*(1+e.deltaY*0.0012)));},{passive:false});

// ---------- pointer ----------
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
const groundPlane=new THREE.Plane(V(0,1,0),0),bowlPlane=new THREE.Plane(V(0,1,0),-0.35),hitP=V(0,0,0);
function setNdc(e){const r=canvas.getBoundingClientRect();ndc.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera);}
let lastUV=null;
function workAt(e){
  if(!me||me.moving||!myZone)return false;setNdc(e);
  if(myZone==='field'){if(e.type!=='pointerdown')return true;const live=fieldCabs.filter(f=>!f.gone);const h=ray.intersectObjects(live.map(f=>f.g),true)[0];if(!h)return false;
    let o=h.object;while(o&&!live.some(f=>f.g===o))o=o.parent;const fc=live.find(f=>f.g===o);if(fc)fieldPull(fc,true);return true;}
  if(myZone==='bury'&&bury.step==='dig'){if(!ray.ray.intersectPlane(groundPlane,hitP))return false;if(hitP.distanceTo(HOLE)>1.2)return false;
    if(bury.last&&hitP.distanceTo(bury.last)<0.15)return true;bury.last=hitP.clone();bury.dig=Math.min(1,bury.dig+0.04);
    holeDisc.scale.setScalar(0.1+0.9*bury.dig);mound.scale.set(1,0.05+0.6*bury.dig,1);emitP('burst',V(hitP.x,0.05,hitP.z),4,0x6b4a2a);
    if(bury.dig>=1){bury.step='jar';toast('다 팠다!');renderBury();}updatePanelMeter();return true;}
  if(cab&&(myZone==='salt'||myZone==='mix')){const hit=ray.intersectObject(cab.face)[0];if(!hit||!hit.uv)return false;const u=hit.uv.x,v=hit.uv.y;
    if(lastUV){const dx=(u-lastUV.x)*UW,dy=(v-lastUV.y)*VW;if(dx*dx+dy*dy<0.11*0.11)return true;}lastUV={x:u,y:v};
    if(myZone==='salt'){stampSalt(cab,u,v);emitP('fall',hit.point,6);if(cab.saltAmt>0.95&&!warned){warned=true;sayNpc(npcNear('salt').i,'짜다 짜! 그만 쳐!');}}else{stampPaint(cab,u,v);emitP('burst',hit.point,7);}
    updatePanelMeter();return true;}
  if(myZone==='sauce'&&sauce.added.size>=4&&sauce.stir<1){if(!ray.ray.intersectPlane(bowlPlane,hitP))return false;const dx=hitP.x-SB.x,dz=hitP.z-SB.z;if(dx*dx+dz*dz>1.4*1.4)return false;
    const a=Math.atan2(dz,dx);if(sauce.lastA!=null){let d=a-sauce.lastA;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;sauce.angle+=d;sauce.stir+=Math.abs(d)/(Math.PI*6);sauceDisc.rotation.z=sauce.angle;
      if(Math.random()<.3)emitP('burst',V(hitP.x,0.4,hitP.z),2,0xb02a18);if(Math.random()<.15)drawSauce();if(sauce.stir>=1){sauce.stir=1;drawSauce();finishSauce();}}
    sauce.lastA=a;updatePanelMeter();return true;}
  return false;}
function personAt(){const t=[];npcs.forEach(n=>t.push(n.inner));peers.forEach(p=>t.push(p.inner));const h=ray.intersectObjects(t,true)[0];if(!h)return null;let o=h.object;while(o&&!(o.userData&&o.userData.who))o=o.parent;return o?o.userData.who:null;}
function showMarker(p){marker.position.set(p.x,0.03,p.z);marker.material.opacity=0.9;marker.scale.setScalar(1);}
function tap(e){setNdc(e);
  const w=personAt();if(w){openPerson(w);return;}
  const sh=ray.intersectObjects(zoneHits)[0];if(sh){walkToZone(sh.object.userData.zone);return;}
  if(ray.ray.intersectPlane(groundPlane,hitP)){const x=Math.max(BOUND.x0,Math.min(BOUND.x1,hitP.x)),z=Math.max(BOUND.z0,Math.min(BOUND.z1,hitP.z));
    const zk=zoneAt(V(x,0,z));if(zk&&zk!==myZone){walkToZone(zk);return;}
    me.wantZone=null;me.zone=zk;me.target.set(x,0,z);showMarker(me.target);pushPresence(true);}}
const ptrs=new Map();let mode=null,down=null,pinchD=0;
canvas.addEventListener('pointerdown',e=>{
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});try{canvas.setPointerCapture(e.pointerId)}catch(_){}
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinchD=Math.hypot(a.x-b.x,a.y-b.y);mode='pinch';return;}
  if(!me){mode='orbit';down={x:e.clientX,y:e.clientY,t:performance.now(),moved:0};return;}
  lastUV=null;sauce.lastA=null;
  if(workAt(e)){mode='paint';return;}
  mode='orbit';down={x:e.clientX,y:e.clientY,t:performance.now(),moved:0};canvas.classList.add('dragging');});
canvas.addEventListener('pointermove',e=>{
  const prev=ptrs.get(e.pointerId);if(!prev)return;const dx=e.clientX-prev.x,dy=e.clientY-prev.y;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(mode==='pinch'&&ptrs.size===2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinchD>0)camGoal.dist=Math.max(4.5,Math.min(24,camGoal.dist*pinchD/d));pinchD=d;return;}
  if(mode==='paint'){workAt(e);return;}
  if(mode==='orbit'&&down){down.moved+=Math.abs(dx)+Math.abs(dy);camGoal.yaw-=dx*0.006;camGoal.pitch=Math.max(0.3,Math.min(1.35,camGoal.pitch+dy*0.005));}});
function endPtr(e){const wasOrbit=mode==='orbit'&&down&&ptrs.size===1;
  if(wasOrbit&&me&&down.moved<8&&performance.now()-down.t<500)tap(e);
  ptrs.delete(e.pointerId);if(ptrs.size===0){mode=null;down=null;lastUV=null;sauce.lastA=null;canvas.classList.remove('dragging');}else if(mode==='pinch'){mode='orbit-hold';}}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);

// ---------- sound (wind + magpies) ----------
let audio=null;
$('#soundBtn').addEventListener('click',()=>{
  if(audio){audio.ctx.state==='running'?(audio.ctx.suspend(),$('#soundBtn').textContent='소리 켜기'):(audio.ctx.resume(),$('#soundBtn').textContent='소리 끄기');return;}
  try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const buf=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);const d=buf.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){last=(last+0.02*(Math.random()*2-1))/1.02;d[i]=last*3.2;}
    const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;const gain=ctx.createGain();gain.gain.value=0.22;
    const lfo=ctx.createOscillator();lfo.frequency.value=0.09;const lg=ctx.createGain();lg.gain.value=0.12;lfo.connect(lg);lg.connect(gain.gain);src.connect(lp);lp.connect(gain);gain.connect(ctx.destination);src.start();lfo.start();
    audio={ctx,next:2};$('#soundBtn').textContent='소리 끄기';}catch(_){toast('소리를 켤 수 없어요');}});
function chirp(){if(!audio||audio.ctx.state!=='running')return;const ctx=audio.ctx,t=ctx.currentTime;const n=2+(Math.random()*3|0);
  for(let i=0;i<n;i++){const o=ctx.createOscillator(),g=ctx.createGain();const s=t+i*0.16;o.type='sine';o.frequency.setValueAtTime(2300+Math.random()*500,s);o.frequency.exponentialRampToValueAtTime(1500,s+0.1);
    g.gain.setValueAtTime(0.0001,s);g.gain.exponentialRampToValueAtTime(0.05,s+0.02);g.gain.exponentialRampToValueAtTime(0.0001,s+0.13);o.connect(g);g.connect(ctx.destination);o.start(s);o.stop(s+0.15);}}

// ---------- result ----------
function gradeOf(){const s=stats,tot=s.salt+s.sauce+s.mix+s.pull+s.bury;
  if(s.gave>=3)return['나눔 천사','동네 냉장고가 다 내 김치로 찼어요'];
  if(s.bury>=2)return['김장독 지킴이','올해 김치는 땅속에서 봄을 기다려요'];
  if(s.pull>=8&&s.salt<2)return['배추밭 농부','김장보다 배추 뽑는 게 더 좋았어요'];
  if(tot+s.eat<2)return['평상 지킴이','오늘은 분위기 담당이었어요'];
  if(s.eat>=10&&tot<3)return['수육 먹으러 온 사람','김장은 핑계, 목적은 수육이었어요'];
  if(s.help>=8)return['품앗이의 신','내 김치보다 남의 김치를 더 버무렸어요'];
  if(s.mix>=6)return['김장 국가대표','동네 김장 총감독 하셔도 되겠어요'];
  if(s.sauce>=3)return['양념 장인','이모가 비법 전수하겠대요'];
  if(s.salt>=4)return['절이기 달인','배추 숨 죽이는 데는 일가견 있어요'];
  return['김장 꿈나무','내년엔 더 잘할 거예요'];}
function showResult(exiting){const [g,sub]=gradeOf();$('#leaveBtn').hidden=!exiting;$('#closeBtn').textContent=exiting?'조금 더 있을래요':'마당으로 돌아가기';$('#rWho').textContent=(exiting?'오늘 김장 끝! · ':'')+myNick+'의 김장 일지';$('#sPull').textContent=stats.pull;$('#sBury').textContent=stats.bury;$('#sGave').textContent=stats.gave;$('#sGot').textContent=stats.got;$('#grade').textContent=g;$('#gradeSub').textContent=sub;
  $('#sSalt').textContent=stats.salt;$('#sSauce').textContent=stats.sauce;$('#sMix').textContent=stats.mix;$('#sEat').textContent=stats.eat;
  $('#shareText').value='🥬 온라인 김장 일지 · '+myNick+'\n배추 '+stats.pull+'포기 뽑고, '+stats.salt+'쪽 절이고, 양념 '+stats.sauce+'통 만들고, 김치 '+stats.mix+'쪽 버무리고, 김장독 '+stats.bury+'개 묻고, 수육 '+stats.eat+'점 먹음'+(stats.gave||stats.got?'\n김치 '+stats.gave+'통 나누고 '+stats.got+'통 받음':'')+'\n오늘 칭호: '+g+'\n'+location.origin+'\n#온라인김장 #김장품앗이';
  $('#copyNote').textContent='';$('#result').hidden=false;}
$('#logBtn').addEventListener('click',()=>{if(me){closePops();showResult(false);}});
$('#exitBtn').addEventListener('click',()=>{if(me){closePops();showResult(true);}});
$('#leaveBtn').addEventListener('click',exitYard);
function exitYard(){if(!me)return;netSend({t:'leave'});NET.ch=0;R=null;clearPeers();clearActivity();closePops();
  scene.remove(me.g);bubbles.forEach(b=>b.el.hidden=true);me=null;myZone=null;$('#panel').hidden=true;$('#result').hidden=true;$('#chanBtn').hidden=true;$('#tip').hidden=true;
  for(const k in stats)stats[k]=0;inv=0;$('#hud').classList.add('pre');$('#intro').hidden=false;setNetState(NET.open?'지금 '+NET.total+'명이 김장 중이에요':'혼자서도 들어갈 수 있어요');}
$('#closeBtn').addEventListener('click',()=>{$('#result').hidden=true;});
$('#copyBtn').addEventListener('click',()=>{const t=$('#shareText').value,note=$('#copyNote');const ok=()=>note.textContent='복사했어요! 단톡방에 붙여넣기 하세요';const bad=()=>note.textContent='복사가 안 돼요. 화면을 캡처해서 공유해 주세요';
  const fb=()=>{const ta=$('#shareText');ta.style.left='0';ta.select();try{document.execCommand('copy')?ok():bad();}catch(_){bad();}ta.style.left='-9999px';};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,fb);else fb();});

// ---------- entry ----------
const nickInput=$('#nickInput');
try{const saved=localStorage.getItem('kimjang-nick');if(saved)nickInput.value=saved;}catch(_){}
let pendingNick='',soloTimer=0;
function enterYard(n){
  if(me)return;myNick=n;try{localStorage.setItem('kimjang-nick',n);}catch(_){}
  $('#intro').hidden=true;$('#hud').classList.remove('pre');
  const tip=$('#tip');tip.hidden=false;tip.style.opacity=1;setTimeout(()=>{tip.style.opacity=0;setTimeout(()=>tip.hidden=true,900);},7000);
  me=makePerson({name:n,cloth:0xe07a5f,scarf:0xf1e3a0,me:true});me.isMe=true;me.g.position.set(0,0,9.4);
  camCur.target.set(0,0.9,8);camGoal.yaw=0;camGoal.pitch=0.62;camGoal.dist=10;
  walkToZone('rest');setupZone(null);updateTags();
  feed('내가 마당에 들어왔어요',true);
  setTimeout(()=>sayNpc(1,'왔어? 고무장갑 저기 있다~'),1400);setTimeout(()=>{sayNpc(0,'천천히 해, 천천히');gesture(npcs[0],'wave');},3000);
}
$('#introForm').addEventListener('submit',e=>{e.preventDefault();
  const n=cleanNick(nickInput.value);if(n.length<2){$('#nickErr').textContent='이름은 2~8글자로 적어주세요';nickInput.focus();return;}
  $('#nickErr').textContent='';
  if(NET.open){pendingNick=n;netSend({t:'join',nick:n,ch:0});clearTimeout(soloTimer);soloTimer=setTimeout(()=>{if(!me)enterYard(n);},3500);}
  else enterYard(n);
});

// ---------- realtime (서버 /ws: 마당 채널, 위치, 몸짓, 한 일) ----------
const NET={ws:null,open:false,id:0,ch:0,retry:0,cap:30,counts:[],total:0};
function netSend(o){if(NET.open&&NET.ws&&NET.ws.readyState===1)NET.ws.send(JSON.stringify(o));}
const ROOM={
  emit(topic,data){if(!NET.open||!NET.ch)return Promise.reject({code:'offline'});
    if(topic==='help')netSend({t:'help',to:Number(data.to)});else if(topic==='gift')netSend({t:'gift',to:Number(data.to)});else if(topic==='did')netSend({t:'did',a:data.a});else if(topic==='cheer')netSend({t:'cheer',i:data.i|0});
    return Promise.resolve();},
  presence(){return Promise.resolve();}
};
function hexNum(s){return /^#[0-9a-f]{6}$/i.test(s||'')?parseInt(s.slice(1),16):0x6c8fb3;}
function clearPeers(){peers.forEach(v=>scene.remove(v.g));peers.clear();updateTags();renderNav();}
function upsertPeer(pl){
  if(!pl||pl.id===NET.id)return;const nick=cleanNick(pl.nick);if(!nick)return;
  const x=Math.max(BOUND.x0,Math.min(BOUND.x1,(pl.x|0)/10)),z=Math.max(BOUND.z0,Math.min(BOUND.z1,(pl.z|0)/10));
  const zk=ZKEYS.indexOf(pl.zn)>=0?pl.zn:null;
  let v=peers.get(pl.id);
  if(!v){const st=PEER_STYLE[pl.id%PEER_STYLE.length];v=makePerson({name:nick,cloth:hexNum(pl.color),scarf:st[1]});v.peer=pl.id;v.inner.userData.who={t:'peer',peer:pl.id};
    v.g.position.set(x,0,Math.min(BOUND.z1,z+2));peers.set(pl.id,v);}
  v.zone=zk;v.target.set(x,0,z);
  return v;
}
function pushPresence(force){if(!NET.open||!NET.ch||!me)return;
  const o={t:'pos',x:Math.round(me.target.x*10),z:Math.round(me.target.z*10),zn:me.zone||''};const s=JSON.stringify(o);if(!force&&s===lastSent)return;lastSent=s;netSend(o);}
function setNetState(t){const el=$('#netState');if(el)el.textContent=t;}
function onMsg(m){
  switch(m.t){
    case 'hello':NET.id=m.id;onLobby(m);setNetState('지금 '+m.total+'명이 김장 중이에요');
      if(me)netSend({t:'join',nick:myNick,ch:NET.ch||0});break;
    case 'lobby':onLobby(m);break;
    case 'full':setNetState('마당이 꽉 찼어요. 혼자 먼저 시작해도 돼요');toast('마당이 꽉 찼어요');break;
    case 'nickerr':clearTimeout(soloTimer);if(!me){$('#nickErr').textContent=m.msg||'다른 이름으로 해 주세요';nickInput.focus();}else toast(m.msg||'이름을 바꿀 수 없어요');break;
    case 'joined':clearTimeout(soloTimer);clearPeers();lastSent='';NET.ch=m.ch;NET.cap=m.cap;R=ROOM;
      if(m.me&&m.me.id)NET.id=m.me.id;
      if(!me)enterYard(cleanNick(m.me&&m.me.nick)||pendingNick);
      (m.players||[]).forEach(upsertPeer);
      if(typeof m.kimchi==='number')setNation(m.kimchi);
      $('#chanBtn').hidden=false;$('#chanBtn').textContent=m.ch+'번 마당';pushPresence(true);updateTags();renderNav();
      if(m.players&&m.players.length)feed('지금 '+m.ch+'번 마당에 '+m.players.length+'명이 있어요');break;
    case 'enter':{const v=upsertPeer(m.p);if(v){feed(subj(v.name,true)+' 마당에 들어왔어요');gesture(v,'wave');}updateTags();renderNav();break;}
    case 'leave':{const v=peers.get(m.id);if(v){scene.remove(v.g);peers.delete(m.id);feed(subj(v.name,true)+' 집에 갔어요');}updateTags();renderNav();break;}
    case 'pos':{const v=peers.get(m.id);if(!v)break;upsertPeer({id:m.id,nick:v.name,x:m.x,z:m.z,zn:m.zn,color:''});break;}
    case 'did':{const v=peers.get(m.id);if(!v)break;const a=String(m.a||'');if(!ACT[a])break;feedAct(v.name,true,a,false);
      if(a==='mix'){yardKimchi++;updateTags();flyPiece(personHead(v,V(0,0,0)).setY(0.8));}
      if(a==='eat'||a==='wrap'||a==='drink')bubble('p'+m.id,v,v.name,a==='drink'?'캬~':'냠');break;}
    case 'help':{const v=peers.get(m.from);receivedHelp(v?v.name:'친구');if(v)gesture(v,'wave');break;}
    case 'gift':{const a=peers.get(m.from);if(m.to===NET.id){receivedGift(a?a.name:'친구',a);break;}const b=peers.get(m.to);if(a&&b){flyGift(a,b,()=>gesture(b,'hooray'));if(Math.random()<.6)feed(subj(a.name,true)+' '+b.name+'님에게 김치를 나눴어요');}break;}
    case 'cheer':{const v=peers.get(m.id);if(!v)break;const i=m.i|0;if(i>=0&&i<3)gesture(v,GESTS[i].k);else if(i>=3&&i<6)bubble('p'+m.id,v,v.name,PHRASES[i-3]);break;}
    case 'kimchi':setNation(m.n);break;
  }
}
function setNation(n){const el=$('#nation');el.hidden=false;el.textContent='오늘 전국 김치 '+n+'쪽'+(NET.total?' · '+NET.total+'명 접속':'');NET.kimchi=n;}
function onLobby(m){NET.counts=m.ch||[];NET.total=m.total|0;NET.cap=m.cap||NET.cap;if(typeof m.kimchi==='number')setNation(m.kimchi);if(!$('#chanSheet').hidden)renderChannels();}
function connect(){
  let ws;try{ws=new WebSocket((location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/ws');}catch(_){return retry();}
  NET.ws=ws;
  ws.onopen=()=>{NET.open=true;NET.retry=0;};
  ws.onclose=()=>{NET.open=false;NET.ch=0;R=null;if(me){clearPeers();$('#chanBtn').textContent='다시 연결 중…';}else setNetState('연결이 안 돼도 혼자 먼저 시작할 수 있어요');retry();};
  ws.onerror=()=>{};
  ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data);}catch(_){return;}onMsg(m);};
}
function retry(){NET.retry=Math.min(NET.retry+1,6);setTimeout(connect,1000*Math.pow(1.6,NET.retry));}
function renderChannels(){const g=$('#chGrid');g.textContent='';
  NET.counts.forEach((n,i)=>{const ch=i+1;const b=document.createElement('button');b.type='button';b.textContent=ch+'번 마당';const s=document.createElement('small');s.textContent=n>=NET.cap?'꽉 참':n+'명';b.append(s);
    b.disabled=n>=NET.cap&&ch!==NET.ch;b.setAttribute('aria-current',String(ch===NET.ch));
    b.addEventListener('click',()=>{$('#chanSheet').hidden=true;if(ch===NET.ch)return;toast(ch+'번 마당으로 옮겨요');netSend({t:'join',nick:myNick,ch});});g.append(b);});}
$('#chanBtn').addEventListener('click',()=>{if(!NET.open)return;renderChannels();$('#chanSheet').hidden=false;});
$('#chClose').addEventListener('click',()=>{$('#chanSheet').hidden=true;});
connect();


// ---------- loop ----------
const clock=new THREE.Clock();let presT=0,npcHelpT=16,navT=3,chirpT=4;
function loop(){
  const dt=Math.min(clock.getDelta(),0.05);time+=dt;
  for(let i=tweens.length-1;i>=0;i--){const tw=tweens[i];tw.t+=dt;const p=Math.min(1,tw.t/tw.dur);tw.fn(p);if(p>=1){tweens.splice(i,1);tw.done&&tw.done();}}
  for(const m of parts){if(!m.visible)continue;const u=m.userData;u.v.y-=9*dt;m.position.addScaledVector(u.v,dt);u.life-=dt*1.2;if(m.position.y<u.floor){m.position.y=u.floor;u.v.set(0,0,0);}if(u.life<=0)m.visible=false;}
  for(const l of leaves){l.position.y-=l.userData.s*dt;l.position.x+=Math.sin(time*0.7+l.userData.p)*0.3*dt;l.rotation.x+=dt*1.3;l.rotation.y+=dt*0.9;if(l.position.y<0.05)resetLeaf(l,false);}
  fieldCabs.forEach(f=>{if(!f.gone)return;f.regrow-=dt;if(f.regrow<=0){f.gone=false;f.pulls=0;f.g.visible=true;f.g.position.copy(f.base);f.g.scale.setScalar(0.01);const g=f.g;tween(1.2,p=>g.scale.setScalar(Math.max(0.01,ease(p))));}});
  clouds.forEach(c=>{c.position.x+=c.userData.v*dt;if(c.position.x>90)c.position.x=-90;});
  steam.forEach((s,i)=>{s.userData.t+=dt*0.35;if(s.userData.t>1)s.userData.t-=1;const t=s.userData.t;s.position.set(EB.x+0.4+Math.sin(t*6+i)*0.25,1.1+t*2.2,EB.z-1.3+Math.cos(t*5+i)*0.2);s.scale.setScalar(0.6+t*1.6);s.material.opacity=0.45*(1-t);});
  fireLight.intensity=0.8+Math.sin(time*13)*0.15+Math.sin(time*7.3)*0.1;
  if(marker.material.opacity>0){marker.material.opacity=Math.max(0,marker.material.opacity-dt*0.9);marker.scale.setScalar(1+(0.9-marker.material.opacity)*0.6);}
  npcs.forEach(n=>{walk(n,dt);const working=!n.moving&&n.zone!=='rest'&&n.pause<=0&&zoneAt(n.g.position)===n.zone;animatePerson(n,dt,working);
    if(!n.moving){if(n.pause>0)n.pause-=dt;n.timer-=dt;
      if(n.timer<=0){
        if(n.zone&&n.zone!=='rest'&&zoneAt(n.g.position)===n.zone){const a=n.zone==='eat'?randOf(['eat','eat','wrap','drink']):n.zone==='field'?'pull':n.zone;if(a==='pull'){const f=fieldCabs.filter(x=>!x.gone);if(f.length){const fc=randOf(f);fc.pulls=2;fieldPull(fc,false);}}if(a==='bury')buryTrophy();if(Math.random()<.4||a==='mix')feedAct(shortName(n.name),false,a,false);
          if(a==='mix'){yardKimchi++;updateTags();flyPiece(personHead(n,V(0,0,0)).setY(0.8));}if(a==='eat'||a==='wrap')bubble('n'+n.i,n,n.name,'냠');}
        const r=Math.random();
        if(r<.4){const zk=randOf(n.def.pref);if(zk!==n.zone){sendTo(n,zk,1+((n.i*3+(Math.random()*4|0))%7));}}
        else if(r<.5){n.zone=null;n.target.set(BOUND.x0+2+Math.random()*(BOUND.x1-BOUND.x0-4),0,BOUND.z0+3+Math.random()*(BOUND.z1-BOUND.z0-4));n.back=true;}
        else if(r<.6)sayNpc(n.i,randOf(n.def.lines));
        else if(r<.78)gesture(n,randOf(['wave','bow']));
        if(n.back&&!n.zone&&r>=.5){sendTo(n,randOf(n.def.pref),1+((n.i*3)%7));n.back=false;}
        n.timer=7+Math.random()*9;}}});
  peers.forEach(p=>{walk(p,dt);animatePerson(p,dt,!p.moving&&p.zone&&p.zone!=='rest');});
  if(me){walk(me,dt);
    const zNow=zoneAt(me.g.position);
    if(myZone&&zNow!==myZone)setupZone(null);
    if(!me.moving&&zNow&&zNow!==myZone){if(me.target.distanceTo(slotPos(zNow,0))>0.4){me.zone=zNow;me.target.copy(slotPos(zNow,0));}else setupZone(zNow);}
    animatePerson(me,dt,mode==='paint');}
  if(cab&&cab.dirty)compose(cab);
  if(me&&cab&&(myZone==='salt'||myZone==='mix')&&$('#result').hidden){npcHelpT-=dt;if(npcHelpT<=0){npcHelpT=18+Math.random()*12;
    const here=npcs.filter(n=>n.zone===myZone&&!n.moving);if(here.length&&(myZone==='mix'?cab.coverage<0.85:cab.saltAmt<0.45)){const n=randOf(here);sayNpc(n.i,'내가 좀 거들게~');const g=gen;let k=0;const iv=setInterval(()=>{if(g!==gen||k++>=5){clearInterval(iv);return;}helpStamp();},260);}}}
  if(me&&stats.mix>0&&$('#result').hidden){npcGiftT-=dt;if(npcGiftT<=0){npcGiftT=80+Math.random()*60;const n=npcs[1];
    sayNpc(1,'이거 가져가~ 우리 집 김치');flyGift(n,me,()=>{inv++;stats.got++;toast('이모가 김치 한 통 줬어요!');gesture(me,'hooray');});}}
  presT-=dt;if(presT<=0){presT=0.6;pushPresence(false);}
  navT-=dt;if(navT<=0){navT=3;renderNav();}
  chirpT-=dt;if(chirpT<=0){chirpT=6+Math.random()*10;chirp();}
  placeBubbles(dt);updateCamera(dt);
  renderer.render(scene,camera);requestAnimationFrame(loop);
}
renderNav();updateTags();loop();
})();
