import{r as D,a as M,b as S,g as T}from"./index-rb7veoCc.js";function E(l,o){for(var u=0;u<o.length;u++){const s=o[u];if(typeof s!="string"&&!Array.isArray(s)){for(const n in s)if(n!=="default"&&!(n in l)){const p=Object.getOwnPropertyDescriptor(s,n);p&&Object.defineProperty(l,n,p.get?p:{enumerable:!0,get:()=>s[n]})}}}return Object.freeze(Object.defineProperty(l,Symbol.toStringTag,{value:"Module"}))}var h,P;function x(){if(P)return h;P=1;var l=Object.create,o=Object.defineProperty,u=Object.getOwnPropertyDescriptor,s=Object.getOwnPropertyNames,n=Object.getPrototypeOf,p=Object.prototype.hasOwnProperty,b=(t,e,r)=>e in t?o(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r,v=(t,e)=>{for(var r in e)o(t,r,{get:e[r],enumerable:!0})},y=(t,e,r,c)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of s(e))!p.call(t,i)&&i!==r&&o(t,i,{get:()=>e[i],enumerable:!(c=u(e,i))||c.enumerable});return t},O=(t,e,r)=>(r=t!=null?l(n(t)):{},y(!t||!t.__esModule?o(r,"default",{value:t,enumerable:!0}):r,t)),w=t=>y(o({},"__esModule",{value:!0}),t),a=(t,e,r)=>(b(t,typeof e!="symbol"?e+"":e,r),r),f={};v(f,{default:()=>d}),h=w(f);var _=O(D()),m=M(),K=S();const j="https://cdn.embed.ly/player-0.1.0.min.js",L="playerjs";class d extends _.Component{constructor(){super(...arguments),a(this,"callPlayer",m.callPlayer),a(this,"duration",null),a(this,"currentTime",null),a(this,"secondsLoaded",null),a(this,"mute",()=>{this.callPlayer("mute")}),a(this,"unmute",()=>{this.callPlayer("unmute")}),a(this,"ref",e=>{this.iframe=e})}componentDidMount(){this.props.onMount&&this.props.onMount(this)}load(e){(0,m.getSDK)(j,L).then(r=>{this.iframe&&(this.player=new r.Player(this.iframe),this.player.on("ready",()=>{setTimeout(()=>{this.player.isReady=!0,this.player.setLoop(this.props.loop),this.props.muted&&this.player.mute(),this.addListeners(this.player,this.props),this.props.onReady()},500)}))},this.props.onError)}addListeners(e,r){e.on("play",r.onPlay),e.on("pause",r.onPause),e.on("ended",r.onEnded),e.on("error",r.onError),e.on("timeupdate",({duration:c,seconds:i})=>{this.duration=c,this.currentTime=i})}play(){this.callPlayer("play")}pause(){this.callPlayer("pause")}stop(){}seekTo(e,r=!0){this.callPlayer("setCurrentTime",e),r||this.pause()}setVolume(e){this.callPlayer("setVolume",e)}setLoop(e){this.callPlayer("setLoop",e)}getDuration(){return this.duration}getCurrentTime(){return this.currentTime}getSecondsLoaded(){return this.secondsLoaded}render(){const e={width:"100%",height:"100%"};return _.default.createElement("iframe",{ref:this.ref,src:this.props.url,frameBorder:"0",scrolling:"no",style:e,allow:"encrypted-media; autoplay; fullscreen;",referrerPolicy:"no-referrer-when-downgrade"})}}return a(d,"displayName","Kaltura"),a(d,"canPlay",K.canPlay.kaltura),h}var g=x();const N=T(g),C=E({__proto__:null,default:N},[g]);export{C as K};
