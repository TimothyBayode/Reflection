import type { GridPoint, HazardDef, LevelDef, PlatformDef, WindZoneDef, WorldLevelDef } from "../LevelData";

const P=(x:number,y:number,w:number,h=1):PlatformDef=>({x,y,w,h});
const M=(x:number,y:number,w:number,h:number,toX:number,toY:number,speed:number):PlatformDef=>({kind:"moving",x,y,w,h,to:{x:toX,y:toY},speed});
const F=(x:number,y:number,w:number,h=1,delay=.5,reset=3):PlatformDef=>({kind:"falling",x,y,w,h,delay,reset});
const S=(x:number,y:number,w:number,h=1):HazardDef=>({kind:"spike",x,y,w,h});
const B=(x:number,y:number,toX:number,toY:number,speed=2):HazardDef=>({kind:"blade",x,y,to:{x:toX,y:toY},speed});
const C=(x:number,y:number,w:number,h:number,toY:number,period=2):HazardDef=>({kind:"crusher",x,y,w,h,toY,period});
const L=(x:number,y:number,w:number,h:number,on:number,off:number):HazardDef=>({kind:"laser",x,y,w,h,on,off});
const W=(x:number,y:number,w:number,h:number,forceX:number):WindZoneDef=>({x,y,w,h,forceX});
const CP=(x:number,y:number):GridPoint=>({x,y});
const world=(spawn:GridPoint,platforms:PlatformDef[],door:GridPoint,extra:Partial<WorldLevelDef>={}):WorldLevelDef=>({spawn,platforms,door,...extra});
const meta=(id:number,wid:number,name:string,difficulty:number,rules:LevelDef["rules"],reality:WorldLevelDef,reflection:WorldLevelDef,mechanics:string[]):LevelDef=>({id,world:wid,name,difficulty,rules,reality,reflection,intendedRoute:"Traverse the authored route using predictable hazard cycles.",requiredMechanics:mechanics,switchPoints:["Swap before committing to a hazard cycle that differs across worlds."]});

export const WORLD3:LevelDef[]=[
  meta(13,3,"Blade Run",6,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,32),P(10,13,5),P(20,10,5)],{x:29,y:15},{hazards:[B(8,15,14,15),B(18,12,24,12)]}),
    world({x:2,y:15},[P(0,17,32),P(8,13,5),P(18,10,5)],{x:29,y:15},{hazards:[B(14,15,20,15),B(22,12,27,12)]}),["blades","inverted movement"]),
  meta(14,3,"Stomp",6,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,7),P(10,14,5),P(18,11,5),P(26,14,6)],{x:29,y:12},{hazards:[C(7,6,4,2,16),C(20,4,4,2,14)]}),
    world({x:2,y:15},[P(0,17,9),P(12,12,4),P(19,15,4),P(27,11,5)],{x:29,y:9},{hazards:[C(9,3,4,2,14),C(23,6,4,2,16)]}),["crushers","inverted movement"]),
  meta(15,3,"Laser Mirror",7,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,6),P(9,14,5),P(17,11,5),P(25,14,7)],{x:29,y:12},{hazards:[L(7,10,1,7,1.2,1),L(22,8,1,9,.8,1.2)]}),
    world({x:2,y:15},[P(0,17,8),P(11,12,4),P(18,15,4),P(26,11,6)],{x:29,y:9},{hazards:[L(9,9,1,8,.8,1.2),L(24,6,1,11,1.2,1)]}),["lasers","cycle timing"]),
  meta(16,3,"Falling Away",7,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,5),F(7,14,4),F(14,11,4),F(21,14,4),P(28,17,4)],{x:29,y:15},{checkpoints:[CP(21,13)]}),
    world({x:2,y:15},[P(0,17,8),F(10,13,4,1,.7),F(17,15,4,1,.7),F(24,11,4,1,.7)],{x:29,y:9}),["falling platforms","route commitment"]),
  meta(17,3,"Blade + Stomp",8,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,6),P(9,14,4),P(16,11,4),P(23,14,4),P(29,17,3)],{x:29,y:15},{checkpoints:[CP(16,10)],hazards:[B(6,15,12,15),C(18,4,4,2,15)]}),
    world({x:2,y:15},[P(0,17,8),P(11,12,4),P(18,15,4),P(25,12,4)],{x:29,y:10},{hazards:[B(13,13,19,13),C(21,5,4,2,16)]}),["blades","crushers"]),
  meta(18,3,"Hazard Master",8,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,5),P(7,14,4),P(13,11,4),P(19,14,4),P(25,10,4),P(29,14,3)],{x:29,y:12},{checkpoints:[CP(19,13)],hazards:[B(5,15,11,15),C(14,4,4,2,14),L(23,6,1,9,1,1)]}),
    world({x:2,y:15},[P(0,17,7),P(9,12,4),P(15,15,4),P(22,11,4),P(28,14,4)],{x:29,y:12},{hazards:[B(11,13,17,13),C(24,3,4,2,15),L(18,6,1,10,1.2,.8)]}),["blades","crushers","lasers"]),
];

export const WORLD4:LevelDef[]=[
  meta(19,4,"Momentum",7,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,8),P(11,14,5),P(18,10,5),P(26,14,6)],{x:29,y:12},{momentum:.5}),
    world({x:2,y:15},[P(0,17,8),P(11,12,5),P(19,15,4),P(26,11,6)],{x:29,y:9},{momentum:1.2}),["modified momentum"]),
  meta(20,4,"Different Speed",7,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,7),P(10,13,4),P(16,10,4),P(22,13,4),P(29,17,3),M(13,8,4,1,20,8,1)],{x:29,y:15},{timeScale:1}),
    world({x:2,y:15},[P(0,17,8),P(11,12,4),P(18,15,4),P(25,11,4),M(13,8,4,1,21,8,1)],{x:29,y:9},{timeScale:.7}),["modified time","moving platforms"]),
  meta(21,4,"Moving World",8,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,6),P(9,14,4),P(18,11,4),P(27,14,5),M(11,10,4,1,18,10,1.5),M(20,7,4,1,27,7,1)],{x:29,y:12}),
    world({x:2,y:15},[P(0,17,9),P(12,12,4),P(19,15,4),P(27,11,5),M(11,10,4,1,18,10,.8),M(20,7,4,1,27,7,1.6)],{x:29,y:9}),["moving platforms","different speeds"]),
  meta(22,4,"The Safe Side",8,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,7),P(10,13,4),P(17,10,4),P(24,13,4),P(29,17,3)],{x:29,y:15},{hazards:[S(7,17,3),B(19,12,24,12)]}),
    world({x:2,y:15},[P(0,17,5),P(8,14,4),P(15,11,4),P(22,14,4),P(28,17,4)],{x:29,y:15},{hazards:[S(5,17,3),B(13,13,19,13)]}),["viewport swapping","hazard comparison"]),
  meta(23,4,"Two Clocks",9,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,6),P(8,14,4),P(14,11,4),P(20,14,4),P(27,10,5)],{x:29,y:8},{timeScale:1.2,hazards:[B(10,13,15,13)]}),
    world({x:2,y:15},[P(0,17,8),P(10,12,4),P(17,15,4),P(24,11,4),P(29,14,3)],{x:29,y:12},{timeScale:.8,hazards:[B(18,14,23,14)]}),["modified time","blade timing"]),
  meta(24,4,"Reality Master",9,{invertedMovement:true,invertedWind:true},
    world({x:2,y:15},[P(0,17,6),P(8,13,4),P(14,10,4),P(20,13,4),P(26,9,4),P(30,14,2)],{x:30,y:12},{checkpoints:[CP(20,12)],momentum:.55,timeScale:1.15,windZones:[W(6,0,8,18,2)],hazards:[B(12,12,17,12),C(23,3,4,2,14)]}),
    world({x:2,y:15},[P(0,17,8),P(10,12,4),P(17,15,4),P(24,11,4),P(29,14,3)],{x:29,y:12},{checkpoints:[CP(17,14)],momentum:1.15,timeScale:.85,windZones:[W(7,0,8,18,-2)],hazards:[B(18,14,23,14),C(25,4,4,2,15)]}),["momentum","time","wind","hazards"]),
];
