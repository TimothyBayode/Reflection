import type { BoosterZoneDef, GridPoint, HazardDef, LevelDef, PlatformDef, WindZoneDef, WorldLevelDef } from "../LevelData";

const P=(x:number,y:number,w:number,h=1):PlatformDef=>({x,y,w,h});
const S=(x:number,y:number,w:number,h=1):HazardDef=>({kind:"spike",x,y,w,h});
const B=(x:number,y:number,toX:number,toY:number,speed=2):HazardDef=>({kind:"blade",x,y,to:{x:toX,y:toY},speed});
const C=(x:number,y:number,w:number,h:number,toY:number):HazardDef=>({kind:"crusher",x,y,w,h,toY,period:2});
const L=(x:number,y:number,w:number,h:number,on:number,off:number):HazardDef=>({kind:"laser",x,y,w,h,on,off});
const W=(x:number,y:number,w:number,h:number,forceX:number):WindZoneDef=>({x,y,w,h,forceX});
const CP=(x:number,y:number):GridPoint=>({x,y});
const BJ=(x:number,y:number):BoosterZoneDef=>({kind:"boosterJump",x,y});
const HB=(x:number,y:number):BoosterZoneDef=>({kind:"horizontalBoost",x,y});
const world=(spawn:GridPoint,platforms:PlatformDef[],door:GridPoint,extra:Partial<WorldLevelDef>={}):WorldLevelDef=>({spawn,platforms,door,...extra});
const meta=(id:number,name:string,difficulty:number,rules:LevelDef["rules"],reality:WorldLevelDef,reflection:WorldLevelDef,mechanics:string[]):LevelDef=>({id,world:5,name,difficulty,rules,reality,reflection,intendedRoute:"Use only the booster mechanics enabled for this level and preserve both worlds through each jump.",requiredMechanics:mechanics,switchPoints:["Swap before a booster commitment when the other world has the tighter landing."]});

export const WORLD5:LevelDef[]=[
  meta(25,"Booster Intro",7,{invertedMovement:true,boosterJump:true},
    world({x:2,y:15},[P(0,17,6),P(9,14,3),P(15,10,3),P(21,14,3),P(27,10,5)],{x:29,y:8},{boosterZones:[BJ(8,15)]}),
    world({x:2,y:15},[P(0,17,8),P(11,12,3),P(17,15,3),P(23,11,3),P(29,14,3)],{x:29,y:12},{boosterZones:[BJ(10,15)]}),["booster jump"]),
  meta(26,"Booster Gap",8,{invertedMovement:true,boosterJump:true},
    world({x:2,y:15},[P(0,17,5),P(8,14,3),P(14,9,3),P(21,14,3),P(28,17,4)],{x:29,y:15},{boosterZones:[BJ(7,13)],checkpoints:[CP(21,13)],hazards:[S(5,17,3)]}),
    world({x:2,y:15},[P(0,17,7),P(10,12,3),P(16,15,3),P(22,10,3),P(29,14,3)],{x:29,y:12},{boosterZones:[BJ(9,11)],hazards:[S(7,17,3)]}),["booster jump","spikes"]),
  meta(27,"Horizontal Boost",8,{invertedMovement:true,horizontalBoost:true},
    world({x:2,y:15},[P(0,17,5),P(8,14,3),P(15,14,3),P(22,11,3),P(29,14,3)],{x:29,y:12},{boosterZones:[HB(6,15)]}),
    world({x:2,y:15},[P(0,17,8),P(11,12,3),P(18,15,3),P(25,11,3),P(29,14,3)],{x:29,y:12},{boosterZones:[HB(9,15)]}),["horizontal boost"]),
  meta(28,"Booster Combination",9,{invertedMovement:true,boosterJump:true,horizontalBoost:true},
    world({x:2,y:15},[P(0,17,5),P(7,14,3),P(13,10,3),P(19,13,3),P(25,9,3),P(30,14,2)],{x:30,y:12},{boosterZones:[BJ(6,13),HB(12,10)],hazards:[B(16,12,22,12)]}),
    world({x:2,y:15},[P(0,17,8),P(10,12,3),P(16,15,3),P(22,11,3),P(28,14,4)],{x:29,y:12},{boosterZones:[BJ(9,11),HB(15,15)],hazards:[B(20,14,25,14)]}),["booster jump","horizontal boost","blades"]),
  meta(29,"The Paradox",9.5,{invertedMovement:true,invertedGravity:true,invertedWind:true,boosterJump:true,horizontalBoost:true},
    world({x:2,y:3},[P(0,0,5),P(7,5,3),P(13,8,3),P(19,5,3),P(25,9,3),P(30,5,2)],{x:30,y:3},{gravity:-1,checkpoints:[CP(19,4)],windZones:[W(5,0,9,18,2)],boosterZones:[BJ(6,5),HB(12,8)],momentum:.55,hazards:[B(15,6,20,6),C(23,2,4,2,10)]}),
    world({x:2,y:15},[P(0,17,7),P(9,12,3),P(15,15,3),P(21,11,3),P(27,14,3),P(30,10,2)],{x:30,y:8},{gravity:1,checkpoints:[CP(21,10)],windZones:[W(5,0,9,18,-2)],boosterZones:[BJ(8,11),HB(14,15)],momentum:1.15,hazards:[B(17,14,22,14),C(24,5,4,2,15)]}),["gravity","wind","boosters","momentum","hazards"]),
  meta(30,"Reflection",10,{invertedMovement:true,invertedGravity:true,invertedWind:true,boosterJump:true,horizontalBoost:true},
    world({x:2,y:3},[P(0,0,5),P(7,5,3),P(13,8,3),P(19,5,3),P(24,9,3),P(29,6,3)],{x:30,y:3},{gravity:-1,checkpoints:[CP(13,7),CP(24,8)],windZones:[W(5,0,8,18,2),W(18,0,8,18,3)],boosterZones:[BJ(6,5),HB(12,8)],momentum:.55,timeScale:1.15,hazards:[B(9,5,14,5),C(16,2,4,2,10),L(22,0,1,10,1,1)]}),
    world({x:2,y:15},[P(0,17,7),P(9,12,3),P(15,15,3),P(21,11,3),P(26,14,3),P(30,10,2)],{x:30,y:8},{gravity:1,checkpoints:[CP(15,14),CP(26,13)],windZones:[W(5,0,8,18,-2),W(18,0,8,18,-3)],boosterZones:[BJ(8,11),HB(14,15)],momentum:1.15,timeScale:.85,hazards:[B(17,14,22,14),C(24,5,4,2,15),L(20,7,1,10,1,1)]}),["all mastered mechanics","multiple checkpoints"]),
];
