/* PRIME Community — Supabase-backed community page */
const SUPABASE_URL="https://lykigrvkzkvwpeqgmxjq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_87iX3KMcXjiZU3VX8q7rYw_N7CTjSk8";
const primeAuthStorage={
 getItem(key){try{return localStorage.getItem(key)??sessionStorage.getItem(key)}catch{return sessionStorage.getItem(key)}},
 setItem(key,value){try{if(localStorage.getItem(key)!==null)localStorage.setItem(key,value);else sessionStorage.setItem(key,value)}catch{sessionStorage.setItem(key,value)}},
 removeItem(key){try{localStorage.removeItem(key);sessionStorage.removeItem(key)}catch{}}
};
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{storage:primeAuthStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=s=>document.querySelector(s);
const escapeHTML=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let teams=[],coaches=[],reviews=[],activeSport="All",selectedTeam=null,selectedCoach=null,currentUser=null;
const sportFilters=["All","5-a-side Football","Padel","Basketball","Volleyball","Tennis","Athletics"];
function initials(name){return String(name||"PR").split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()}
function renderTeams(){
 const list=teams.filter(t=>activeSport==="All"||t.sport===activeSport);
 $("#team-grid").innerHTML=list.map(t=>`<article class="team-card"><div class="team-cover"><span class="sport-tag">${escapeHTML(t.sport.toUpperCase())}</span><span class="rating">★ ${Number(t.rating).toFixed(1)}</span><h3>${escapeHTML(t.name)}</h3></div><div class="team-info"><h4>${escapeHTML(t.name)}</h4><p class="location">📍 ${escapeHTML(t.location)}</p><p>${escapeHTML(t.description)}</p><div class="team-meta"><span><strong>${escapeHTML(t.price||"Free")}</strong> ${escapeHTML(t.price_unit||"")}</span><span>♟ ${Number(t.member_count)||0} members</span></div><button class="btn join-btn" data-join="${t.id}">JOIN TEAM</button></div></article>`).join("");
 $("#team-empty").hidden=list.length>0;
}
function renderAthletes(){
 $("#athlete-grid").innerHTML=coaches.map(a=>`<article class="athlete-card"><div class="athlete-visual">${a.avatar_url?'<img class="coach-photo" src="'+escapeHTML(a.avatar_url)+'" alt="'+escapeHTML(a.full_name)+'">':'<span class="avatar">'+escapeHTML(initials(a.full_name))+'</span>'}<span class="sport-tag">${escapeHTML(a.level||a.role)}</span><span class="athlete-score">★ ${Number(a.overall_rating).toFixed(1)} · ${escapeHTML(a.sport)}</span></div><div class="athlete-info"><h3>${escapeHTML(a.full_name)}</h3><p>${escapeHTML(a.about)}</p><div class="athlete-stats">${(Array.isArray(a.career_stats)?a.career_stats:[]).slice(0,3).map(s=>`<div><strong>${escapeHTML(s.value)}</strong><small>${escapeHTML(s.label)}</small></div>`).join("")}</div><button class="profile-btn" data-profile="${a.id}">VIEW PROFILE</button></div></article>`).join("");
}
function openJoin(team){
 selectedTeam=team;$("#join-sport").textContent=team.sport.toUpperCase();$("#join-team-name").textContent=team.name;$("#join-team-location").textContent="📍 "+team.location;$("#join-team-meta").textContent="★ "+Number(team.rating).toFixed(1)+" · "+team.member_count+" members";$("#join-description").textContent=team.description||"Send a request to join this team.";$("#join-tags").innerHTML=(team.tags||[]).map(t=>`<span>${escapeHTML(t)}</span>`).join("");$("#join-status").textContent="";$("#join-form").reset();if(currentUser?.email)$("#join-form").elements.email.value=currentUser.email;$("#join-dialog").showModal();
}
function renderReviews(coachId){
 const list=reviews.filter(r=>r.coach_id===coachId);
 $("#field-notes-title").textContent="FIELD NOTES · "+list.length+" REVIEWS";
 $("#profile-reviews").innerHTML=list.length?list.map(r=>`<article class="field-note"><div class="field-note-head"><span>${escapeHTML(r.profiles?.display_name||"PRIME member")}</span><strong>★ ${Number(r.overall_rating).toFixed(1)}</strong></div><p>${escapeHTML(r.review_text||"Shared their rating.")}</p></article>`).join(""):'<p class="profile-about">No field notes yet. Be the first to share feedback after a session.</p>';
}
function openProfile(a){
 selectedCoach=a;
 $("#profile-avatar").textContent=initials(a.full_name);$("#profile-role").textContent=a.role||a.level||"ATHLETE";$("#profile-name").textContent=a.full_name;$("#profile-summary").textContent=(a.sport||"SPORT")+" · ★ "+Number(a.overall_rating).toFixed(1);
 $("#profile-about").textContent=a.about||"Profile details coming soon.";
 const rows=[["OVERALL RATING",a.overall_rating],["COACHING QUALITY",a.coaching_quality],["COMMUNICATION",a.communication],["VALUE FOR MONEY",a.value_for_money]];
 $("#profile-ratings").innerHTML=rows.map(([label,value])=>{const v=Number(value)||0;return `<div class="rating-line"><span>${label}</span><strong>${v.toFixed(1)}</strong><div class="rating-bar"><span style="width:${Math.max(0,Math.min(100,v*20))}%"></span></div></div>`}).join("");
 $("#profile-specialties").innerHTML=(a.specialties||[]).map(s=>`<span>⚡ ${escapeHTML(s)}</span>`).join("");
 $("#profile-stats").innerHTML=(Array.isArray(a.career_stats)?a.career_stats:[]).map(s=>`<div><strong>${escapeHTML(s.value)}</strong><small>${escapeHTML(s.label)}</small></div>`).join("");
 renderReviews(a.id);$("#coach-status").textContent="";$("#coach-message").value="";$("#profile-dialog").showModal();
}
async function requireUser(statusSelector){
 if(currentUser)return true;
 $(statusSelector).textContent="Please sign in to your PRIME account before sending this request.";
 return false;
}
$("#team-filters").addEventListener("click",e=>{const b=e.target.closest("[data-sport]");if(!b)return;activeSport=b.dataset.sport;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderTeams()});
$("#team-grid").addEventListener("click",e=>{const b=e.target.closest("[data-join]");if(b){const t=teams.find(x=>x.id===b.dataset.join);if(t)openJoin(t)}});
$("#athlete-grid").addEventListener("click",e=>{const b=e.target.closest("[data-profile]");if(b){const a=coaches.find(x=>x.id===b.dataset.profile);if(a)openProfile(a)}});
$("#join-close").addEventListener("click",()=>$("#join-dialog").close());$("#profile-close").addEventListener("click",()=>$("#profile-dialog").close());$("#profile-done").addEventListener("click",()=>$("#profile-dialog").close());
$("#join-dialog").addEventListener("click",e=>{if(e.target===$("#join-dialog"))$("#join-dialog").close()});$("#profile-dialog").addEventListener("click",e=>{if(e.target===$("#profile-dialog"))$("#profile-dialog").close()});
$("#join-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!selectedTeam||!await requireUser("#join-status"))return;
 const f=new FormData(e.currentTarget),full_name=String(f.get("name")).trim(),email=String(f.get("email")).trim(),phone=String(f.get("phone")).trim();
 const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;button.textContent="SENDING...";
 try{const {error}=await supabaseClient.from("community_team_requests").insert({team_id:selectedTeam.id,user_id:currentUser.id,full_name,email,phone:phone||null});if(error)throw error;$("#join-status").textContent="✓ Your request has been saved to your PRIME account.";button.textContent="REQUEST SENT";}
 catch(err){console.error(err);$("#join-status").textContent=err.code==="23505"?"You already sent a request to this team.":"We couldn't save your request. Please try again.";button.disabled=false;button.textContent="CLAIM YOUR SPOT";}
});
async function sendCoachRequest(message){
 if(!selectedCoach||!await requireUser("#coach-status"))return false;
 const {error}=await supabaseClient.from("community_session_requests").insert({coach_id:selectedCoach.id,user_id:currentUser.id,message:message||null});
 if(error)throw error;
 return true;
}
$("#coach-message-form").addEventListener("submit",async e=>{
 e.preventDefault();const message=$("#coach-message").value.trim();if(!message)return;
 const b=e.currentTarget.querySelector("button");b.disabled=true;
 try{await sendCoachRequest(message);$("#coach-status").textContent="✓ Message sent to PRIME. Your request is saved in your account.";$("#coach-message").value="";}
 catch(err){console.error(err);$("#coach-status").textContent="We couldn't send your message. Please sign in and try again.";}
 finally{b.disabled=false;}
});
$("#request-session").addEventListener("click",async()=>{
 const b=$("#request-session");b.disabled=true;b.textContent="SENDING REQUEST...";
 try{await sendCoachRequest("Session request");$("#coach-status").textContent="✓ SESSION REQUEST SENT. Your request is saved in your PRIME account.";b.textContent="REQUEST SENT";}
 catch(err){console.error(err);$("#coach-status").textContent="Please sign in to request a session.";b.disabled=false;b.textContent="REQUEST A SESSION";}
});
$("#contact-form").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);const payload={name:String(f.get("name")).trim(),email:String(f.get("email")).trim(),message:String(f.get("message")).trim()};const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;button.textContent="SENDING...";$("#contact-status").textContent="";
 try{const {error}=await supabaseClient.from("contact_messages").insert(payload);if(error)throw error;e.currentTarget.reset();$("#contact-status").textContent="✓ Message sent successfully. Thank you for contacting PRIME!";button.textContent="MESSAGE SENT";}
 catch(err){console.error(err);$("#contact-status").textContent="We couldn't send your message. Please try again in a moment.";button.disabled=false;button.textContent="SEND MESSAGE";}
});
async function initCommunity(){
 try{
  const {data:authData,error:authError}=await supabaseClient.auth.getUser();if(authError)throw authError;currentUser=authData.user||null;
  const [teamResult,coachResult,reviewResult]=await Promise.all([
   supabaseClient.from("community_teams").select("*").eq("is_active",true).order("name"),
   supabaseClient.from("community_coaches").select("*").eq("is_active",true).order("full_name"),
   supabaseClient.from("community_coach_reviews").select("id,coach_id,user_id,overall_rating,review_text,created_at").order("created_at",{ascending:false})
  ]);
  if(teamResult.error)throw teamResult.error;if(coachResult.error)throw coachResult.error;
  teams=teamResult.data||[];coaches=coachResult.data||[];reviews=reviewResult.error?[]:(reviewResult.data||[]);
  renderTeams();renderAthletes();
  if(currentUser?.email)$("#join-form").elements.email.value=currentUser.email;
 }catch(err){console.error("PRIME Community loading error:",err);$("#team-empty").hidden=false;$("#team-empty").textContent="Community data couldn't load. Please refresh the page or sign in again.";}
}
renderTeams();renderAthletes();initCommunity();
