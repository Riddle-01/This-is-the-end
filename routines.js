const routines = [
 {id:"full",name:"Full Body Blast",category:"Full Body",difficulty:"Intermediate",duration:45,description:"A complete full-body workout targeting all major muscle groups for maximum results.",emoji:"💪",exercises:[["Squats","4","12"],["Bench Press","4","10"],["Deadlifts","3","8"],["Plank","3","30 sec"],["Lunges","3","12"]]},
 {id:"upper",name:"Upper Body Power",category:"Upper Body",difficulty:"Advanced",duration:40,description:"Focus on chest, back, shoulders, and arms to build upper body strength.",emoji:"💪",exercises:[["Push-ups","4","20"],["Shoulder Press","4","10"],["Barbell Rows","4","12"],["Bicep Curls","3","15"],["Tricep Dips","3","12"]]},
 {id:"lower",name:"Lower Body Strength",category:"Lower Body",difficulty:"Intermediate",duration:35,description:"Build powerful legs and glutes with this intensive lower body routine.",emoji:"🦵",exercises:[["Squats","5","10"],["Lunges","4","12"],["Leg Press","4","15"],["Glute Bridge","3","15"],["Calf Raises","3","15"]]},
 {id:"core",name:"Core Crusher",category:"Core",difficulty:"Beginner",duration:20,description:"Build core stability with controlled movements and balanced exercises.",emoji:"🔥",exercises:[["Plank","3","30 sec"],["Crunches","3","15"],["Dead Bug","3","10"],["Bird Dog","3","10"],["Side Plank","2","20 sec"]]},
 {id:"cardio",name:"HIIT Cardio Burn",category:"Cardio",difficulty:"Intermediate",duration:25,description:"A cardio routine with adjustable work and rest periods to keep you moving.",emoji:"🏃",exercises:[["Jumping Jacks","3","30 sec"],["High Knees","3","30 sec"],["Mountain Climbers","3","20"],["Step-ups","3","12"],["March in Place","3","45 sec"]]},
 {id:"beginner",name:"Beginner Foundation",category:"Full Body",difficulty:"Beginner",duration:30,description:"Start with fundamental movements and build confidence gradually.",emoji:"🌱",exercises:[["Bodyweight Squats","2","10"],["Wall Push-ups","2","10"],["Glute Bridge","2","12"],["Bird Dog","2","8"],["Easy March","2","1 min"]]}
];
let customRoutines = [];
let selectedBase = "full";
let activeFilter = "All";
let editingId = null;
const $ = s => document.querySelector(s);
const baseList = $("#base-list"), baseDetail = $("#base-detail"), grid = $("#routine-grid");
function allRoutines(){return [...routines,...customRoutines]}
function safeText(value){return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderBase(){
 baseList.innerHTML = routines.map(r=>`<button type="button" class="base-option ${r.id===selectedBase?"active":""}" data-base="${r.id}"><span><strong>${safeText(r.name)}</strong><small>${safeText(r.category)} · ${r.duration}min</small></span><span class="chevron">›</span></button>`).join("");
 const r=routines.find(x=>x.id===selectedBase)||routines[0];
 baseDetail.innerHTML=`<div class="detail-top"><div class="detail-title"><span class="routine-emoji">${r.emoji}</span><div><h3>${safeText(r.name)}</h3><p>${safeText(r.description)}</p></div></div><div class="pills"><span class="pill orange">${safeText(r.difficulty)}</span><span class="pill">◷ ${r.duration} min</span><span class="pill">${r.exercises.length} exercises</span></div></div><div class="exercise-breakdown"><h4>EXERCISE BREAKDOWN</h4>${r.exercises.map((e,i)=>`<div class="exercise-row"><span class="number">${i+1}</span><span>${safeText(e[0])}</span><strong>${safeText(e[1])} × ${safeText(e[2])}</strong></div>`).join("")}</div><button type="button" class="primary-btn add-plan" data-add-plan="${r.id}">＋ Add This Routine to My Plan</button>`;
}
function renderCards(){
 const shown=allRoutines().filter(r=>activeFilter==="All"||(activeFilter==="Custom"?r.custom===true:r.category===activeFilter));
 grid.innerHTML=shown.map(r=>`<article class="routine-card"><div class="card-heading"><span class="card-icon">${r.emoji||"💪"}</span><h3>${safeText(r.name)}</h3></div><p class="card-description">${safeText(r.description)}</p><div class="card-pills"><span>${safeText(r.difficulty)}</span><span>${safeText(r.category)}</span></div><span class="duration">⏱ ${r.duration} min</span><div class="exercise-list-title">EXERCISES (${r.exercises.length})</div>${r.exercises.slice(0,3).map(e=>`<div class="mini-exercise"><span>${safeText(e[0])}</span><strong>${safeText(e[1])}×${safeText(e[2])}</strong></div>`).join("")}${r.exercises.length>3?'<span class="more-exercises">+'+(r.exercises.length-3)+' more...</span>':""}<button type="button" class="card-edit" data-edit="${r.id}">✏️ Edit</button></article>`).join("");
 $("#empty-state").hidden=shown.length>0;
}
function addExerciseRow(ex=["","",""]){
 const row=document.createElement("div");row.className="exercise-input-row";
 row.innerHTML=`<input aria-label="Exercise name" placeholder="Exercise name" value="${safeText(ex[0])}" required><input aria-label="Sets" type="number" min="1" max="20" value="${safeText(ex[1]||3)}" required><input aria-label="Reps" placeholder="Reps" value="${safeText(ex[2]||12)}" required><button type="button" aria-label="Remove exercise">×</button>`;
 row.querySelector("button").addEventListener("click",()=>{if($("#exercise-editor").children.length>1)row.remove()});
 $("#exercise-editor").append(row);
}
function openEditor(r=null){
 editingId=r?.id||null;$("#dialog-title").textContent=r?"EDIT ROUTINE":"NEW ROUTINE";$("#submit-routine").textContent=r?"Save Changes":"Create Routine";
 const f=$("#routine-editor");f.elements.name.value=r?.name||"";f.elements.description.value=r?.description||"";f.elements.difficulty.value=r?.difficulty||"Intermediate";f.elements.category.value=r?.category||"Core";f.elements.duration.value=r?.duration||30;
 $("#exercise-editor").innerHTML="";(r?.exercises||[["",3,12]]).forEach(addExerciseRow);$("#dialog-error").textContent="";$("#routine-dialog").showModal();
}
baseList.addEventListener("click",e=>{const b=e.target.closest("[data-base]");if(b){selectedBase=b.dataset.base;renderBase()}});
baseDetail.addEventListener("click",e=>{const b=e.target.closest("[data-add-plan]");if(!b)return;const r=allRoutines().find(x=>x.id===b.dataset.addPlan);if(r){const chosen=JSON.parse(localStorage.getItem("primeSelectedRoutines")||"[]");if(!chosen.includes(r.id))chosen.push(r.id);localStorage.setItem("primeSelectedRoutines",JSON.stringify(chosen));b.textContent="✓ Added to My Plan";setTimeout(()=>b.textContent="＋ Add This Routine to My Plan",1600)}});
$("#filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;activeFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderCards()});
grid.addEventListener("click",e=>{const b=e.target.closest("[data-edit]");if(!b)return;const r=allRoutines().find(x=>x.id===b.dataset.edit);if(r)openEditor(r)});
$("#new-routine").addEventListener("click",()=>openEditor());
$("#add-exercise").addEventListener("click",()=>addExerciseRow());
$("#close-dialog").addEventListener("click",()=>$("#routine-dialog").close());
$("#cancel-dialog").addEventListener("click",()=>$("#routine-dialog").close());
$("#routine-editor").addEventListener("submit",e=>{
 e.preventDefault();const f=e.currentTarget;
 const exercises=[...$("#exercise-editor").querySelectorAll(".exercise-input-row")].map(row=>[row.children[0].value.trim(),row.children[1].value,row.children[2].value.trim()]);
 if(!f.elements.name.value.trim()||exercises.some(x=>!x[0]||!x[1]||!x[2])){$("#dialog-error").textContent="Complete the routine name and every exercise.";return}
 const item={id:editingId||"custom-"+Date.now(),name:f.elements.name.value.trim(),description:f.elements.description.value.trim()||"A custom routine created for your plan.",difficulty:f.elements.difficulty.value,category:f.elements.category.value,duration:Number(f.elements.duration.value),emoji:"💪",exercises,custom:true};
 if(editingId){const i=customRoutines.findIndex(x=>x.id===editingId);if(i>=0)customRoutines[i]=item;else customRoutines.push(item)}else customRoutines.push(item);
 try{localStorage.setItem("primeCustomRoutines",JSON.stringify(customRoutines))}catch{}
 $("#routine-dialog").close();activeFilter="All";document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter==="All"));renderCards();
});
$("#budget").addEventListener("input",e=>$("#budget-output").textContent="$"+e.target.value);
document.querySelectorAll("[data-choice-group]").forEach(group=>group.addEventListener("click",e=>{const b=e.target.closest("[data-value]");if(!b)return;if(group.dataset.choiceGroup==="days")b.classList.toggle("active");else{group.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b))}}));
$("#plan-form").addEventListener("submit",e=>{
 e.preventDefault();const f=e.currentTarget;
 const data={age:f.elements.age.value,level:f.elements.level.value,budget:f.elements.budget.value,time:document.querySelector('[data-choice-group="time"] .active')?.dataset.value||"",days:[...document.querySelectorAll('[data-choice-group="days"] .active')].map(x=>x.dataset.value),goals:f.elements.goals.value,notes:f.elements.notes.value,savedAt:new Date().toISOString()};
 if(!data.age||!data.level){$("#form-message").textContent="Please select your age range and fitness level.";return}
 try{localStorage.setItem("primeTrainingPlan",JSON.stringify(data));$("#form-message").textContent="✓ Your plan preferences have been saved on this device."}catch{$("#form-message").textContent="Your browser could not save the plan. Please check storage settings."}
});
try{customRoutines=JSON.parse(localStorage.getItem("primeCustomRoutines")||"[]");if(!Array.isArray(customRoutines))customRoutines=[]}catch{customRoutines=[]}
renderBase();renderCards();