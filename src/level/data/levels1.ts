import type { GridPoint, HazardDef, LevelDef, PlatformDef, WindZoneDef, WorldLevelDef } from "../LevelData";

const P = (x:number,y:number,w:number,h=1): PlatformDef => ({x,y,w,h});
const S = (x:number,y:number,w:number,h=1): HazardDef => ({kind:"spike",x,y,w,h});
const B = (x:number,y:number,toX:number,toY:number,speed=2): HazardDef => ({kind:"blade",x,y,to:{x:toX,y:toY},speed});
const W = (x:number,y:number,w:number,h:number,forceX:number): WindZoneDef => ({x,y,w,h,forceX});
const CP = (x:number,y:number): GridPoint => ({x,y});
const world = (spawn:GridPoint, platforms:PlatformDef[], door:GridPoint, extra:Partial<WorldLevelDef>={}):WorldLevelDef => ({spawn,platforms,door,...extra});
const meta = (id:number, worldId:number, name:string, difficulty:number, rules:LevelDef["rules"], reality:WorldLevelDef, reflection:WorldLevelDef, mechanics:string[]):LevelDef => ({
  id, world:worldId, name, difficulty, rules, reality, reflection,
  intendedRoute:"Follow the authored platform sequence while monitoring both live worlds.", requiredMechanics:mechanics,
  switchPoints:["Swap when the floating route becomes the higher immediate risk."],
});

export const WORLD1: LevelDef[] = [
  meta(1,1,"First Reflection",1,{invertedMovement:true},
    world({x:3,y:15},[P(0,17,32),P(7,13,6),P(16,10,5),P(23,13,5)],{x:29,y:15},{checkpoints:[CP(17,9)]}),
    world({x:3,y:15},[P(0,17,32),P(7,13,6),P(16,10,5),P(23,13,5)],{x:29,y:15}),["inverted movement"]),
  meta(2,1,"Mirrored Path",2,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,6),P(8,14,5),P(15,11,5),P(22,14,5),P(28,17,4)],{x:29,y:15},{checkpoints:[CP(15,10)]}),
    world({x:2,y:15},[P(0,17,6),P(8,12,4),P(14,15,5),P(21,11,5),P(28,14,4)],{x:29,y:15}),["inverted movement","viewport observation"]),
  meta(3,1,"The Gap",2,{invertedMovement:true},
    world({x:3,y:15},[P(0,17,8),P(11,14,4),P(17,11,4),P(24,14,4),P(29,17,3)],{x:29,y:15},{checkpoints:[CP(17,10)],hazards:[S(8,17,3)]}),
    world({x:3,y:15},[P(0,17,6),P(9,13,5),P(16,15,5),P(23,12,4),P(29,17,3)],{x:29,y:15},{hazards:[S(6,17,3)]}),["inverted movement","split landings"]),
  meta(4,1,"Watch the Window",3,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,7),P(9,14,4),P(15,11,4),P(21,14,4),P(27,11,5)],{x:29,y:9},{checkpoints:[CP(21,13)],hazards:[S(12,17,3)]}),
    world({x:2,y:15},[P(0,17,10),P(12,13,4),P(18,10,4),P(24,13,4),P(28,8,4)],{x:29,y:7},{hazards:[S(10,17,3)]}),["inverted movement","viewport swapping"]),
  meta(5,1,"Mirror Edge",3,{invertedMovement:true},
    world({x:3,y:15},[P(0,17,5),P(7,14,4),P(13,11,4),P(19,8,4),P(25,11,4),P(29,14,3)],{x:29,y:12},{hazards:[S(5,17,2),S(11,17,2)]}),
    world({x:3,y:15},[P(0,17,9),P(11,14,4),P(17,11,4),P(23,8,4),P(28,14,4)],{x:29,y:12},{hazards:[S(9,17,2),S(15,17,2)]}),["inverted movement","precision jumps"]),
  meta(6,1,"Mirror Master",4,{invertedMovement:true},
    world({x:2,y:15},[P(0,17,5),P(7,14,3),P(12,11,4),P(18,14,3),P(23,10,4),P(29,14,3)],{x:29,y:12},{checkpoints:[CP(18,13)],hazards:[S(5,17,2),B(15,15,20,15)]}),
    world({x:2,y:15},[P(0,17,8),P(10,13,4),P(16,10,4),P(22,13,4),P(28,10,4)],{x:29,y:8},{hazards:[S(8,17,2),B(20,9,25,9)]}),["inverted movement","blade timing"]),
];

export const WORLD2: LevelDef[] = [
  meta(7,2,"Upside Down",4,{invertedMovement:true,invertedGravity:true},
    world({x:3,y:3},[P(0,0,32),P(7,4,5),P(15,7,5),P(23,4,5)],{x:29,y:2},{gravity:-1,checkpoints:[CP(15,6)]}),
    world({x:3,y:15},[P(0,17,32),P(7,13,5),P(15,10,5),P(23,13,5)],{x:29,y:15},{gravity:1}),["inverted movement","inverted gravity"]),
  meta(8,2,"Double Gravity",5,{invertedMovement:true,invertedGravity:true},
    world({x:2,y:3},[P(0,0,7),P(9,4,4),P(15,7,4),P(21,4,4),P(28,0,4)],{x:29,y:2},{gravity:-1,hazards:[S(13,0,2)]}),
    world({x:2,y:15},[P(0,17,7),P(9,13,4),P(15,10,4),P(21,13,4),P(28,17,4)],{x:29,y:15},{gravity:1,hazards:[S(13,17,2)]}),["inverted movement","inverted gravity","spikes"]),
  meta(9,2,"Wind",5,{invertedMovement:true,invertedWind:true},
    world({x:2,y:15},[P(0,17,8),P(11,14,4),P(17,11,4),P(23,14,4),P(29,17,3)],{x:29,y:15},{windZones:[W(8,0,8,17,2)]}),
    world({x:2,y:15},[P(0,17,6),P(9,12,4),P(15,15,4),P(21,11,4),P(28,14,4)],{x:29,y:12},{windZones:[W(7,0,9,17,-2)]}),["inverted movement","wind"]),
  meta(10,2,"Wind Tunnel",5,{invertedMovement:true,invertedWind:true},
    world({x:2,y:15},[P(0,17,6),P(9,14,4),P(15,10,4),P(21,14,4),P(28,17,4)],{x:29,y:15},{windZones:[W(6,5,7,12,3),W(19,5,8,12,3)]}),
    world({x:2,y:15},[P(0,17,8),P(11,12,4),P(17,15,4),P(23,11,4),P(29,14,3)],{x:29,y:12},{windZones:[W(6,5,7,12,-3),W(19,5,8,12,-3)]}),["inverted movement","strong wind"]),
  meta(11,2,"Heavy Air",6,{invertedMovement:true,invertedGravity:true,invertedWind:true},
    world({x:3,y:3},[P(0,0,6),P(8,5,4),P(14,8,4),P(20,5,4),P(27,0,5)],{x:29,y:2},{gravity:-1,windZones:[W(6,0,7,18,2)]}),
    world({x:3,y:15},[P(0,17,6),P(8,12,4),P(14,9,4),P(20,12,4),P(27,17,5)],{x:29,y:15},{gravity:1,windZones:[W(6,0,7,18,-2)]}),["inverted gravity","wind"]),
  meta(12,2,"Physics Master",7,{invertedMovement:true,invertedGravity:true,invertedWind:true},
    world({x:2,y:3},[P(0,0,5),P(7,5,4),P(13,8,3),P(18,5,4),P(24,9,3),P(28,5,4)],{x:28,y:6},{gravity:-1,checkpoints:[CP(18,4)],windZones:[W(5,0,9,18,2),W(20,0,8,18,2)],hazards:[S(10,0,2)]}),
    world({x:2,y:15},[P(0,17,5),P(7,12,4),P(13,9,3),P(18,12,4),P(24,8,3),P(28,12,4)],{x:28,y:14},{gravity:1,checkpoints:[CP(18,13)],windZones:[W(5,0,9,18,-2),W(20,0,8,18,-2)],hazards:[S(10,17,2)]}),["inverted gravity","wind","spikes"]),
];
