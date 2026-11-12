/* PRIME routines — Supabase account storage */
const SUPABASE_URL = "https://lykigrvkzkvwpeqgmxjq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_87iX3KMcXjiZU3V8Xq7rYw_N7CTjSk8";

/* Match the storage used by signin.html so the same signed-in account is detected. */
const primeAuthStorage = {
  getItem(key) {
    try { return localStorage.getItem(key) ?? sessionStorage.getItem(key); }
    catch { return sessionStorage.getItem(key); }
  },
  setItem(key, value) {
    try {
      if (localStorage.getItem(key) !== null) localStorage.setItem(key, value);
      else sessionStorage.setItem(key, value);
    } catch { sessionStorage.setItem(key, value); }
  },
  removeItem(key) {
    try { localStorage.removeItem(key); sessionStorage.removeItem(key); } catch {}
  }
};

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  { auth: { storage: primeAuthStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const routines = [
 {id:"full",name:"Full Body Blast",category:"Full Body",difficulty:"Intermediate",duration:45,description:"A complete full-body workout targeting all major muscle groups for maximum results.",emoji:"💪",exercises:[["Squats","4","12"],["Bench Press","4","10"],["Deadlifts","3","8"],["Plank","3","30 sec"],["Lunges","3","12"]]},
 {id:"upper",name:"Upper Body Power",category:"Upper Body",difficulty:"Advanced",duration:40,description:"Focus on chest, back, shoulders, and arms to build upper body strength.",emoji:"💪",exercises:[["Push-ups","4","20"],["Shoulder Press","4","10"],["Barbell Rows","4","12"],["Bicep Curls","3","15"],["Tricep Dips","3","12"]]},
 {id:"lower",name:"Lower Body Strength",category:"Lower Body",difficulty:"Intermediate",duration:35,description:"Build powerful legs and glutes with this lower body routine.",emoji:"🦵",exercises:[["Squats","5","10"],["Lunges","4","12"],["Leg Press","4","15"],["Glute Bridge","3","15"],["Calf Raises","3","15"]]},
 {id:"core",name:"Core Crusher",category:"Core",difficulty:"Beginner",duration:20,description:"Build core stability with controlled movements and balanced exercises.",emoji:"🔥",exercises:[["Plank","3","30 sec"],["Crunches","3","15"],["Dead Bug","3","10"],["Bird Dog","3","10"],["Side Plank","2","20 sec"]]},
 {id:"cardio",name:"HIIT Cardio Burn",category:"Cardio",difficulty:"Intermediate",duration:25,description:"A cardio routine with adjustable work and rest periods to keep you moving.",emoji:"🏃",exercises:[["Jumping Jacks","3","30 sec"],["High Knees","3","30 sec"],["Mountain Climbers","3","20"],["Step-ups","3","12"],["March in Place","3","45 sec"]]},
 {id:"beginner",name:"Beginner Foundation",category:"Full Body",difficulty:"Beginner",duration:30,description:"Start with fundamental movements and build confidence gradually.",emoji:"🌱",exercises:[["Bodyweight Squats","2","10"],["Wall Push-ups","2","10"],["Glute Bridge","2","12"],["Bird Dog","2","8"],["Easy March","2","1 min"]]}
];

let currentUser = null;
let customRoutines = [];
let selectedRoutineIds = [];
let preferencesState = {
  age_range:"", fitness_level:"", monthly_budget:50, preferred_time:"",
  preferred_days:[], goals:"", notes:"", selected_routine_ids:[]
};
let selectedBase = "full";
let activeFilter = "All";
let editingId = null;

const $ = selector => document.querySelector(selector);
const baseList = $("#base-list");
const baseDetail = $("#base-detail");
const grid = $("#routine-grid");

function safeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));
}
function allRoutines() { return [...routines, ...customRoutines]; }
function showAccountStatus(message, showSignin = false) {
  const target = $("#account-status");
  target.textContent = message;
  if (showSignin) {
    const link = document.createElement("a");
    link.href = "signin.html";
    link.textContent = " Sign in";
    link.style.color = "#ff6946";
    link.style.fontWeight = "800";
    target.appendChild(link);
  }
}
function showFormMessage(message, isError = false) {
  const target = $("#form-message");
  target.textContent = message;
  target.style.color = isError ? "#ff9b8a" : "#ff825e";
}
function requireSignedIn() {
  if (currentUser) return true;
  showFormMessage("Please sign in to your PRIME account before saving.", true);
  showAccountStatus("Your routines and preferences belong to your account. Sign in to continue.", true);
  return false;
}
function mapRoutine(row) {
  return {
    id:row.id, name:row.name, description:row.description || "",
    category:row.category, difficulty:row.difficulty, duration:row.duration,
    emoji:row.emoji || "💪", exercises:Array.isArray(row.exercises) ? row.exercises : [],
    custom:true
  };
}
async function savePreferencesPatch(patch) {
  if (!requireSignedIn()) throw new Error("Sign in is required.");
  preferencesState = {...preferencesState, ...patch};
  preferencesState.selected_routine_ids = [...new Set(preferencesState.selected_routine_ids || [])];
  const payload = {
    user_id:currentUser.id,
    age_range:preferencesState.age_range || "",
    fitness_level:preferencesState.fitness_level || "",
    monthly_budget:Number(preferencesState.monthly_budget ?? 50),
    preferred_time:preferencesState.preferred_time || "",
    preferred_days:preferencesState.preferred_days || [],
    goals:preferencesState.goals || "",
    notes:preferencesState.notes || "",
    selected_routine_ids:preferencesState.selected_routine_ids,
    updated_at:new Date().toISOString()
  };
  const {error} = await supabaseClient.from("training_preferences").upsert(payload,{onConflict:"user_id"});
  if (error) throw error;
}
function renderBase() {
  baseList.innerHTML = routines.map(r => `
    <button type="button" class="base-option ${r.id===selectedBase?"active":""}" data-base="${r.id}">
      <span><strong>${safeText(r.name)}</strong><small>${safeText(r.category)} · ${r.duration}min</small></span><span class="chevron">›</span>
    </button>`).join("");
  const r = routines.find(item => item.id===selectedBase) || routines[0];
  const added = selectedRoutineIds.includes(r.id);
  baseDetail.innerHTML = `
    <div class="detail-top">
      <div class="detail-title"><span class="routine-emoji">${r.emoji}</span><div><h3>${safeText(r.name)}</h3><p>${safeText(r.description)}</p></div></div>
      <div class="pills"><span class="pill orange">${safeText(r.difficulty)}</span><span class="pill">◷ ${r.duration} min</span><span class="pill">${r.exercises.length} exercises</span></div>
    </div>
    <div class="exercise-breakdown"><h4>EXERCISE BREAKDOWN</h4>
      ${r.exercises.map((exercise,index)=>`<div class="exercise-row"><span class="number">${index+1}</span><span>${safeText(exercise[0])}</span><strong>${safeText(exercise[1])} × ${safeText(exercise[2])}</strong></div>`).join("")}
    </div>
    <button type="button" class="primary-btn add-plan" data-add-plan="${r.id}">${added?"✓ Added to My Plan":"＋ Add This Routine to My Plan"}</button>`;
}
function renderCards() {
  const shown = allRoutines().filter(r => activeFilter==="All" || (activeFilter==="Custom" ? r.custom===true : r.category===activeFilter));
  grid.innerHTML = shown.map(r => `
    <article class="routine-card">
      <div class="card-heading"><span class="card-icon">${r.emoji||"💪"}</span><h3>${safeText(r.name)}</h3></div>
      <p class="card-description">${safeText(r.description)}</p>
      <div class="card-pills"><span>${safeText(r.difficulty)}</span><span>${safeText(r.category)}</span></div>
      <span class="duration">⏱ ${r.duration} min</span>
      <div class="exercise-list-title">EXERCISES (${r.exercises.length})</div>
      ${r.exercises.slice(0,3).map(exercise=>`<div class="mini-exercise"><span>${safeText(exercise[0])}</span><strong>${safeText(exercise[1])}×${safeText(exercise[2])}</strong></div>`).join("")}
      ${r.exercises.length>3 ? `<span class="more-exercises">+${r.exercises.length-3} more...</span>` : ""}
      <button type="button" class="card-edit" data-edit="${safeText(r.id)}">✏️ Edit</button>
      ${r.custom ? `<button type="button" class="card-delete" data-delete="${safeText(r.id)}">Delete routine</button>` : ""}
    </article>`).join("");
  $("#empty-state").hidden = shown.length>0;
}
function addExerciseRow(exercise=["","",""]) {
  const row = document.createElement("div");
  row.className = "exercise-input-row";
  const name = document.createElement("input");
  name.setAttribute("aria-label","Exercise name"); name.placeholder="Exercise name"; name.required=true; name.value=exercise[0]||"";
  const sets = document.createElement("input");
  sets.setAttribute("aria-label","Sets"); sets.type="number"; sets.min="1"; sets.max="20"; sets.required=true; sets.value=exercise[1]||3;
  const reps = document.createElement("input");
  reps.setAttribute("aria-label","Reps"); reps.placeholder="Reps"; reps.required=true; reps.value=exercise[2]||12;
  const remove = document.createElement("button");
  remove.type="button"; remove.setAttribute("aria-label","Remove exercise"); remove.textContent="×";
  remove.addEventListener("click",()=>{if($("#exercise-editor").children.length>1) row.remove();});
  row.append(name,sets,reps,remove);
  $("#exercise-editor").append(row);
}
function openEditor(r=null) {
  /* Editing a built-in routine creates a personal copy; it never changes the shared base routine. */
  editingId = r?.custom ? r.id : null;
  $("#dialog-title").textContent = r ? "EDIT ROUTINE" : "NEW ROUTINE";
  $("#submit-routine").textContent = r?.custom ? "Save Changes" : r ? "Save as My Routine" : "Create Routine";
  const form = $("#routine-editor");
  form.elements.name.value = r?.name || "";
  form.elements.description.value = r?.description || "";
  form.elements.difficulty.value = r?.difficulty || "Intermediate";
  form.elements.category.value = r?.category || "Core";
  form.elements.duration.value = r?.duration || 30;
  $("#exercise-editor").innerHTML = "";
  (r?.exercises || [["",3,12]]).forEach(addExerciseRow);
  $("#dialog-error").textContent = "";
  $("#routine-dialog").showModal();
}
async function loadUserData() {
  const {data,error} = await supabaseClient.auth.getUser();
  if (error) throw error;
  currentUser = data.user;
  if (!currentUser) {
    showAccountStatus("Sign in to PRIME to save and sync your routines and training plan.", true);
    renderBase(); renderCards();
    return;
  }
  showAccountStatus("Signed in as " + (currentUser.email || "your PRIME account") + " · Your data syncs with your account.");
  const [routineResult, preferenceResult] = await Promise.all([
    supabaseClient.from("user_routines").select("*").order("created_at",{ascending:true}),
    supabaseClient.from("training_preferences").select("*").eq("user_id",currentUser.id).maybeSingle()
  ]);
  if (routineResult.error) throw routineResult.error;
  if (preferenceResult.error) throw preferenceResult.error;
  customRoutines = (routineResult.data || []).map(mapRoutine);
  if (preferenceResult.data) {
    const row = preferenceResult.data;
    preferencesState = {
      age_range:row.age_range || "", fitness_level:row.fitness_level || "",
      monthly_budget:Number(row.monthly_budget ?? 50), preferred_time:row.preferred_time || "",
      preferred_days:row.preferred_days || [], goals:row.goals || "", notes:row.notes || "",
      selected_routine_ids:row.selected_routine_ids || []
    };
    selectedRoutineIds = [...preferencesState.selected_routine_ids];
    populatePreferences();
  }
  renderBase(); renderCards();
}
function populatePreferences() {
  const form = $("#plan-form");
  form.elements.age.value = preferencesState.age_range;
  form.elements.level.value = preferencesState.fitness_level;
  form.elements.budget.value = preferencesState.monthly_budget;
  $("#budget-output").textContent = "$" + preferencesState.monthly_budget;
  form.elements.goals.value = preferencesState.goals;
  form.elements.notes.value = preferencesState.notes;
  document.querySelectorAll('[data-choice-group="time"] [data-value]').forEach(button =>
    button.classList.toggle("active",button.dataset.value===preferencesState.preferred_time));
  document.querySelectorAll('[data-choice-group="days"] [data-value]').forEach(button =>
    button.classList.toggle("active",preferencesState.preferred_days.includes(button.dataset.value)));
}
baseList.addEventListener("click",event => {
  const button = event.target.closest("[data-base]");
  if (button) { selectedBase=button.dataset.base; renderBase(); }
});
baseDetail.addEventListener("click",async event => {
  const button = event.target.closest("[data-add-plan]");
  if (!button) return;
  if (!requireSignedIn()) return;
  const id = button.dataset.addPlan;
  const next = [...new Set([...selectedRoutineIds,id])];
  button.disabled = true;
  try {
    await savePreferencesPatch({selected_routine_ids:next});
    selectedRoutineIds = next;
    renderBase();
    showFormMessage("✓ Routine added to your PRIME plan.");
  } catch (error) {
    console.error("Could not add routine:",error);
    showFormMessage("Could not save this routine. " + (error.message || ""),true);
  } finally { button.disabled=false; }
});
$("#filters").addEventListener("click",event => {
  const button=event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter=button.dataset.filter;
  document.querySelectorAll(".filter").forEach(item=>item.classList.toggle("active",item===button));
  renderCards();
});
grid.addEventListener("click",async event => {
  const edit=event.target.closest("[data-edit]");
  if (edit) {
    const routine=allRoutines().find(item=>item.id===edit.dataset.edit);
    if (routine) openEditor(routine);
    return;
  }
  const remove=event.target.closest("[data-delete]");
  if (remove) {
    if (!requireSignedIn()) return;
    const routine=customRoutines.find(item=>item.id===remove.dataset.delete);
    if (!routine || !confirm("Delete this personal routine?")) return;
    remove.disabled=true;
    const {error}=await supabaseClient.from("user_routines").delete().eq("id",routine.id).eq("user_id",currentUser.id);
    if (error) {
      console.error("Could not delete routine:",error);
      showFormMessage("Could not delete this routine: "+error.message,true);
      remove.disabled=false;
      return;
    }
    customRoutines=customRoutines.filter(item=>item.id!==routine.id);
    selectedRoutineIds=selectedRoutineIds.filter(id=>id!==routine.id);
    try { await savePreferencesPatch({selected_routine_ids:selectedRoutineIds}); } catch(error) { console.warn("Routine selection cleanup failed:",error); }
    renderCards(); renderBase(); showFormMessage("✓ Routine deleted from your account.");
  }
});
$("#new-routine").addEventListener("click",()=>openEditor());
$("#add-exercise").addEventListener("click",()=>addExerciseRow());
$("#close-dialog").addEventListener("click",()=>$("#routine-dialog").close());
$("#cancel-dialog").addEventListener("click",()=>$("#routine-dialog").close());
$("#routine-editor").addEventListener("submit",async event => {
  event.preventDefault();
  if (!requireSignedIn()) return;
  const form=event.currentTarget;
  const exercises=[...$("#exercise-editor").querySelectorAll(".exercise-input-row")].map(row=>[
    row.children[0].value.trim(),row.children[1].value,row.children[2].value.trim()
  ]);
  if (!form.elements.name.value.trim() || exercises.some(item=>!item[0]||!item[1]||!item[2])) {
    $("#dialog-error").textContent="Complete the routine name and every exercise."; return;
  }
  const payload={
    user_id:currentUser.id,
    name:form.elements.name.value.trim(),
    description:form.elements.description.value.trim() || "A custom routine created for your plan.",
    difficulty:form.elements.difficulty.value,
    category:form.elements.category.value,
    duration:Number(form.elements.duration.value),
    emoji:"💪", exercises, updated_at:new Date().toISOString()
  };
  const submit=$("#submit-routine");
  submit.disabled=true;
  try {
    let saved;
    if (editingId) {
      const result=await supabaseClient.from("user_routines").update(payload).eq("id",editingId).eq("user_id",currentUser.id).select("*").single();
      if (result.error) throw result.error;
      saved=mapRoutine(result.data);
      customRoutines=customRoutines.map(item=>item.id===editingId?saved:item);
    } else {
      const result=await supabaseClient.from("user_routines").insert(payload).select("*").single();
      if (result.error) throw result.error;
      saved=mapRoutine(result.data);
      customRoutines.push(saved);
    }
    $("#routine-dialog").close();
    activeFilter="All";
    document.querySelectorAll(".filter").forEach(item=>item.classList.toggle("active",item.dataset.filter==="All"));
    renderCards();
    showFormMessage("✓ Your routine is saved to your PRIME account.");
  } catch(error) {
    console.error("Could not save routine:",error);
    $("#dialog-error").textContent="Could not save routine: " + (error.message || "Please try again.");
  } finally { submit.disabled=false; }
});
$("#budget").addEventListener("input",event=>$("#budget-output").textContent="$"+event.target.value);
document.querySelectorAll("[data-choice-group]").forEach(group=>group.addEventListener("click",event=>{
  const button=event.target.closest("[data-value]");
  if (!button) return;
  if (group.dataset.choiceGroup==="days") button.classList.toggle("active");
  else group.querySelectorAll("button").forEach(item=>item.classList.toggle("active",item===button));
}));
$("#plan-form").addEventListener("submit",async event=>{
  event.preventDefault();
  if (!requireSignedIn()) return;
  const form=event.currentTarget;
  const data={
    age_range:form.elements.age.value,
    fitness_level:form.elements.level.value,
    monthly_budget:Number(form.elements.budget.value),
    preferred_time:document.querySelector('[data-choice-group="time"] .active')?.dataset.value || "",
    preferred_days:[...document.querySelectorAll('[data-choice-group="days"] .active')].map(item=>item.dataset.value),
    goals:form.elements.goals.value.trim(),
    notes:form.elements.notes.value.trim(),
    selected_routine_ids:selectedRoutineIds
  };
  if (!data.age_range || !data.fitness_level) {
    showFormMessage("Please select your age range and fitness level.",true); return;
  }
  const submit=$(".save-plan");
  submit.disabled=true;
  try {
    await savePreferencesPatch(data);
    showFormMessage("✓ Your training preferences are saved to your PRIME account.");
  } catch(error) {
    console.error("Could not save training preferences:",error);
    showFormMessage("Could not save your plan: " + (error.message || "Please try again."),true);
  } finally { submit.disabled=false; }
});
supabaseClient.auth.onAuthStateChange((event,session)=>{
  if (event==="SIGNED_OUT") {
    currentUser=null; customRoutines=[]; selectedRoutineIds=[];
    renderBase(); renderCards();
    showAccountStatus("You are signed out. Sign in to sync your routines.",true);
  } else if (event==="SIGNED_IN" && session?.user) {
    currentUser=session.user;
    loadUserData().catch(error=>{console.error(error);showAccountStatus("Could not load account data: "+error.message);});
  }
});
loadUserData().catch(error=>{
  console.error("PRIME routines initialization failed:",error);
  showAccountStatus("Could not connect to your PRIME account. Reload the page or sign in again.");
});
renderBase();
renderCards();
