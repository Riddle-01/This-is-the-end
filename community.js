/* PRIME Community — interactive community page */
const SUPABASE_URL="https://lykigrvkzkvwpeqgmxjq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_87iX3KMcXjiZU3V8Xq7rYw_N7CTjSk8";
const primeAuthStorage={
 getItem(key){try{return localStorage.getItem(key)??sessionStorage.getItem(key)}catch{return sessionStorage.getItem(key)}},
 setItem(key,value){try{if(localStorage.getItem(key)!==null)localStorage.setItem(key,value);else sessionStorage.setItem(key,value)}catch{sessionStorage.setItem(key,value)}},
 removeItem(key){try{localStorage.removeItem(key);sessionStorage.removeItem(key)}catch{}}
};
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{storage:primeAuthStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const teams=[
 {id:"coco",sport:"5-a-side Football",place:"EL COCO",name:"El Coco Football Club",location:"El Coco, La Chorrera, Panama Oeste",description:"A friendly five-a-side group for weekly matches and local tournaments.",price:"$5",unit:"/ match",members:34,rating:"4.8",tags:["Weekly matches","All levels","Evenings"]},
 {id:"chorrera-padel",sport:"Padel",place:"LA CHORRERA",name:"La Chorrera Padel Club",location:"La Chorrera, Panama Oeste",description:"Competitive padel team with monthly inter-club tournaments.",price:"$18",unit:"/ month",members:22,rating:"4.9",tags:["Inter-club tournaments","Coach","Lounge"]},
 {id:"puerto",sport:"Basketball",place:"PUERTO CAIMITO",name:"Puerto Caimito Arena",location:"Puerto Caimito, La Chorrera, Panama Oeste",description:"Multi-purpose hall with regulation backboards and bleachers for 120 people.",price:"$12",unit:"/ hour",members:52,rating:"4.6",tags:["Open court","Youth league","Indoor"]},
 {id:"playa",sport:"Volleyball",place:"PLAYA LEONA",name:"Playa Leona Volleyball",location:"Playa Leona, La Chorrera, Panama Oeste",description:"Beach volleyball sessions and weekend friendly competitions.",price:"Free",unit:"",members:18,rating:"4.7",tags:["Beach sessions","Weekend games","All levels"]},
 {id:"colon",sport:"Padel",place:"BARRIO COLÓN",name:"Colón Padel Team",location:"Colón, La Chorrera, Panama Oeste",description:"Competitive padel team with monthly inter-club tournaments. Secure your spot in the community.",price:"$20",unit:"/ month",members:22,rating:"4.8",tags:["Inter-club tournaments","Coach","Lounge","Parking"]},
 {id:"guacimo",sport:"Basketball",place:"GUÁCIMO",name:"Guácimo Ballers",location:"Guácimo, La Chorrera, Panama Oeste",description:"Youth basketball team with a sports development program.",price:"$20",unit:"/ month",members:30,rating:"4.6",tags:["Youth development","Training","Team league"]},
 {id:"tennis",sport:"Tennis",place:"LA MITRA",name:"La Mitra Tennis Crew",location:"La Mitra, La Chorrera, Panama Oeste",description:"Practice sessions, doubles matches and friendly tennis meetups.",price:"$8",unit:"/ session",members:16,rating:"4.7",tags:["Doubles","Practice","Weekend"]},
 {id:"runners",sport:"Athletics",place:"LA PESA",name:"La Pesa Runners",location:"La Pesa, La Chorrera, Panama Oeste",description:"A local running crew for relaxed group runs and training sessions.",price:"Free",unit:"",members:41,rating:"4.9",tags:["5K","10K","Group runs"]}
];
const athletes=[
 {id:"diego",name:"Diego Fábrega",initials:"DF",level:"ADVANCED",sport:"FOOTBALL",rating:"4.9",bio:"8 years coaching youth teams. Specialist in individual technique.",stats:[["124","MATCHES"],["38","GOALS"],["5","TROPHIES"]],ratings:[["Overall rating","4.9",98],["Coaching quality","5.0",100],["Communication","4.7",94],["Value for money","4.8",96]],specialties:["Shooting Technique","Tactical Awareness","Youth Development"]},
 {id:"camila",name:"Camila Ureña",initials:"CU",level:"PROFESSIONAL",sport:"PADEL",rating:"5.0",bio:"Former professional padel player. Personalized lessons for all levels.",stats:[["87","MATCHES"],["412","POINTS"],["4","TROPHIES"]],ratings:[["Overall rating","5.0",100],["Coaching quality","5.0",100],["Communication","4.9",98],["Value for money","4.8",96]],specialties:["Padel technique","Footwork","Private lessons"]},
 {id:"ricardo",name:"Ricardo Solís",initials:"RS",level:"COACH",sport:"ATHLETICS",rating:"4.8",bio:"Strength & conditioning coach and running guide. Progressive plans from 5K to 21K.",stats:[["56","RACES"],["34","WINS"],["1","TROPHY"]],ratings:[["Overall rating","4.8",96],["Coaching quality","4.9",98],["Communication","4.7",94],["Value for money","4.8",96]],specialties:["Running plans","Strength","Conditioning"]},
 {id:"mariana",name:"Mariana Gómez",initials:"MG",level:"ADVANCED",sport:"5-A-SIDE FOOTBALL",rating:"4.7",bio:"Forward for Los Halcones FC. Active player every week in El Coco.",stats:[["42","MATCHES"],["21","GOALS"],["2","TROPHIES"]],ratings:[["Overall rating","4.7",94],["Teamwork","4.9",98],["Communication","4.6",92],["Consistency","4.7",94]],specialties:["Forward play","Teamwork","Finishing"]},
 {id:"luis",name:"Luis Torres",initials:"LT",level:"INTERMEDIATE",sport:"BASKETBALL",rating:"4.6",bio:"Match organizer at Puerto Caimito. Point guard with great court vision.",stats:[["87","MATCHES"],["412","POINTS"],["4","TROPHIES"]],ratings:[["Overall rating","4.6",92],["Teamwork","4.8",96],["Communication","4.5",90],["Consistency","4.6",92]],specialties:["Playmaking","Court vision","Defense"]},
 {id:"andrea",name:"Andrea Vega",initials:"AV",level:"ADVANCED",sport:"PADEL",rating:"4.8",bio:"Padel player in La Chorrera. Climbed 2 levels in 6 months with PRIME.",stats:[["56","MATCHES"],["34","WINS"],["1","TROPHY"]],ratings:[["Overall rating","4.8",96],["Technique","4.9",98],["Communication","4.7",94],["Consistency","4.8",96]],specialties:["Padel","Doubles","Agility"]}
];
let activeSport="All",selectedTeam=null,currentUser=null;
const $=s=>document.querySelector(s);
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function renderTeams(){
 const list=teams.filter(t=>activeSport==="All"||t.sport===activeSport);
 $("#team-grid").innerHTML=list.map(t=>`<article class="team-card"><div class="team-cover"><span class="sport-tag">${escapeHTML(t.sport.toUpperCase())}</span><span class="rating">★ ${t.rating}</span><h3>${escapeHTML(t.place)}</h3></div><div class="team-info"><h4>${escapeHTML(t.name)}</h4><p class="location">📍 ${escapeHTML(t.location)}</p><p>${escapeHTML(t.description)}</p><div class="team-meta"><span><strong>${escapeHTML(t.price)}</strong> ${escapeHTML(t.unit)}</span><span>♟ ${t.members} members</span></div><button class="btn join-btn" data-join="${t.id}">JOIN TEAM</button></div></article>`).join("");
 $("#team-empty").hidden=list.length>0;
}
function renderAthletes(){
 $("#athlete-grid").innerHTML=athletes.map(a=>`<article class="athlete-card"><div class="athlete-visual"><span class="sport-tag">${escapeHTML(a.level)}</span><span class="avatar">${a.initials}</span><span class="athlete-score">★ ${a.rating} · ${escapeHTML(a.sport)}</span></div><div class="athlete-info"><h3>${escapeHTML(a.name)}</h3><p>${escapeHTML(a.bio)}</p><div class="athlete-stats">${a.stats.map(s=>`<div><strong>${s[0]}</strong><small>${s[1]}</small></div>`).join("")}</div><button class="profile-btn" data-profile="${a.id}">VIEW PROFILE</button></div></article>`).join("");
}
function openJoin(team){
 selectedTeam=team;$("#join-sport").textContent=team.sport.toUpperCase();$("#join-team-name").textContent=team.place;$("#join-team-location").textContent="📍 "+team.name;$("#join-team-meta").textContent="★ "+team.rating+" · "+team.members+" members";$("#join-description").textContent=team.description+" Submit your details and the organizer will receive your request.";$("#join-tags").innerHTML=team.tags.map(t=>`<span>${escapeHTML(t)}</span>`).join("");$("#join-status").textContent="";$("#join-form").reset();if(currentUser?.email)$("#join-form").elements.email.value=currentUser.email;$("#join-dialog").showModal();
}
function openProfile(a){
 $("#profile-avatar").textContent=a.initials;$("#profile-role").textContent=a.level;$("#profile-name").textContent=a.name;$("#profile-summary").textContent=a.bio+" · "+a.sport;$("#profile-ratings").innerHTML=a.ratings.map(r=>`<div class="rating-line"><span>${r[0]}</span><strong>${r[1]}</strong><div class="rating-bar"><span style="width:${r[2]}%"></span></div></div>`).join("");$("#profile-specialties").innerHTML=a.specialties.map(s=>`<span>⚡ ${escapeHTML(s)}</span>`).join("");$("#profile-stats").innerHTML=a.stats.map(s=>`<div><strong>${s[0]}</strong><small>${s[1]}</small></div>`).join("");$("#profile-dialog").showModal();
}
$("#team-filters").addEventListener("click",e=>{const b=e.target.closest("[data-sport]");if(!b)return;activeSport=b.dataset.sport;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderTeams()});
$("#team-grid").addEventListener("click",e=>{const b=e.target.closest("[data-join]");if(b){const t=teams.find(x=>x.id===b.dataset.join);if(t)openJoin(t)}});
$("#athlete-grid").addEventListener("click",e=>{const b=e.target.closest("[data-profile]");if(b){const a=athletes.find(x=>x.id===b.dataset.profile);if(a)openProfile(a)}});
$("#join-close").addEventListener("click",()=>$("#join-dialog").close());$("#profile-close").addEventListener("click",()=>$("#profile-dialog").close());$("#profile-done").addEventListener("click",()=>$("#profile-dialog").close());
$("#join-dialog").addEventListener("click",e=>{if(e.target===$("#join-dialog"))$("#join-dialog").close()});$("#profile-dialog").addEventListener("click",e=>{if(e.target===$("#profile-dialog"))$("#profile-dialog").close()});
$("#join-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!selectedTeam)return;
 const f=new FormData(e.currentTarget),name=String(f.get("name")).trim(),email=String(f.get("email")).trim(),phone=String(f.get("phone")).trim();
 const message="COMMUNITY TEAM REQUEST\nTeam: "+selectedTeam.name+" ("+selectedTeam.sport+")\nPhone: "+(phone||"Not provided")+"\nSigned-in user: "+(currentUser?.id||"Guest");
 const button=e.currentTarget.querySelector("button[type=submit]");button.disabled=true;button.textContent="SENDING...";
 try{const {error}=await supabaseClient.from("contact_messages").insert({name,email,message});if(error)throw error;$("#join-status").textContent="✓ You're on the request list for "+selectedTeam.name+". We'll be in touch shortly.";button.textContent="REQUEST SENT";}
 catch(err){console.error(err);$("#join-status").textContent="We couldn't send your request right now. Please try again or contact PRIME.";button.disabled=false;button.textContent="CLAIM YOUR SPOT";}
});
$("#contact-form").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);const payload={name:String(f.get("name")).trim(),email:String(f.get("email")).trim(),message:String(f.get("message")).trim()};const button=e.currentTarget.querySelector("button[type=submit]");button.disabled=true;button.textContent="SENDING...";$("#contact-status").textContent="";
 try{const {error}=await supabaseClient.from("contact_messages").insert(payload);if(error)throw error;e.currentTarget.reset();$("#contact-status").textContent="✓ Message sent successfully. Thank you for contacting PRIME!";button.textContent="MESSAGE SENT";}
 catch(err){console.error(err);$("#contact-status").textContent="We couldn't send your message. Please try again in a moment.";button.disabled=false;button.textContent="SEND MESSAGE";}
});
async function initCommunity(){
 try{const {data,error}=await supabaseClient.auth.getUser();if(error)throw error;currentUser=data.user||null;if(currentUser?.email){const sign=$("#join-form").elements.email;sign.value=currentUser.email}}
 catch(err){console.warn("PRIME session check:",err)}
}
renderTeams();renderAthletes();initCommunity();
