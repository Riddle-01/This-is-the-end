(() => {
  "use strict";

  const SUPABASE_URL = "https://lykigrvkzkvwpeqgmxjq.supabase.co";
  const SUPABASE_KEY = "sb_publishable_87iX3KMcXjiZU3VV8Xq7rYw_N7CTjSk8";
  const list = document.getElementById("court-list");
  const count = document.getElementById("court-count");
  const search = document.getElementById("court-search");
  const filters = document.getElementById("filters");

  const colors = { soccer:"#ff5a00", football:"#ff5a00", volleyball:"#2675d8", swimming:"#11a6a6", basketball:"#8b5cf6", padel:"#16a34a", baseball:"#b7791f", other:"#777" };
  const icons = { soccer:"⚽", football:"⚽", volleyball:"🏐", swimming:"🏊", basketball:"🏀", padel:"🎾", baseball:"⚾", other:"📍" };
  let primeCourts = [];
  let activeFilter = "all";
  let map;
  const markers = new Map();

  // Public facilities in La Chorrera. Pins are added only when a coordinate
  // could be corroborated; other directory entries remain visible with a map-search link.
  const localPlaces = [
    {id:"sky-soccer",name:"SKY Soccer",sport:"football",location:"Las Anclas Mall, Barrio Colón",detail:"Alquiler de canchas de fútbol; consulta la reserva por WhatsApp.",phone:"+507 6979-2664",lat:8.86798,lng:-79.79114,booking:true,source:"Directorio local"},
    {id:"futgold",name:"Sintética Futgold",sport:"football",location:"Av. Libertador, Barrio Colón",detail:"Cancha sintética; consulta alquiler y horarios.",phone:"+507 6294-0094",booking:true,query:"Sintética Futgold La Chorrera Panamá"},
    {id:"infiniti",name:"Infiniti Sport Center",sport:"other",location:"Calle Talavera, Villas del Campo",detail:"Pádel, voleibol, futsal, baloncesto y caja de bateo. Publica reservas de canchas.",phone:"+507 6874-3833",url:"https://www.iscpty.com/",booking:true,query:"Infiniti Sport Center La Chorrera Panamá"},
    {id:"costa-verde",name:"Sport Center Costa Verde",sport:"football",location:"Costa Verde, La Chorrera",detail:"Alquiler de fútbol 11 y fútbol 5; confirmar disponibilidad con el centro.",phone:"+507 6989-7401",booking:true,query:"Sport Center Costa Verde La Chorrera Panamá"},
    {id:"la-escondida",name:"Cancha La Escondida",sport:"football",location:"V6CR+PH5, La Chorrera",detail:"Fútbol 5 y alquiler de cancha; confirmar horarios antes de ir.",phone:"+507 6315-5616",booking:true,query:"Cancha La Escondida La Chorrera Panamá"},
    {id:"la-seda",name:"Cuadro de Fútbol de La Seda",sport:"football",location:"La Seda, La Chorrera",detail:"Alquiler de cancha, ligas y torneos.",phone:"+507 6291-2348",lat:8.87889,lng:-79.78889,booking:true},
    {id:"el-harino",name:"Cancha Sintética El Harino",sport:"football",location:"Barrio Balboa, La Chorrera",detail:"Cancha deportiva comunitaria; consulta administración para uso.",lat:8.87316,lng:-79.78689,booking:false},
    {id:"herradura",name:"Cancha Sintética de La Herradura",sport:"football",location:"Guadalupe, La Chorrera",detail:"Instalación deportiva comunitaria; confirmar condiciones de uso.",lat:8.85125,lng:-79.80679,booking:false},
    {id:"piscina-municipal",name:"Piscina Municipal de La Chorrera",sport:"swimming",location:"Calle T Oeste, El Harino",detail:"Piscina pública; consultar administración por cupos y horarios.",lat:8.87298,lng:-79.78754,booking:false},
    {id:"muquita",name:"Estadio Agustín “Muquita” Sánchez",sport:"football",location:"Matuna, La Chorrera",detail:"Estadio deportivo; acceso sujeto a actividades y administración.",lat:8.8875,lng:-79.775556,booking:false},
    {id:"mariano-rivera",name:"Estadio Mariano Rivera",sport:"baseball",location:"Puerto Caimito, La Chorrera",detail:"Estadio de béisbol; consultar acceso y actividades.",query:"Estadio Mariano Rivera Puerto Caimito La Chorrera",booking:false},
    {id:"piscina-yoi",name:"Piscina YOI",sport:"swimming",location:"Trapichito, La Chorrera",detail:"Piscina recreativa; consultar tarifas, cupos y reservas.",query:"Piscina YOI Trapichito La Chorrera",booking:false},
    {id:"los-posos",name:"Centro Recreativo Los Posos",sport:"swimming",location:"La Mitra, La Chorrera",detail:"Centro recreativo con piscinas; consultar acceso y disponibilidad.",query:"Centro Recreativo Los Posos La Chorrera",booking:false}
  ];

  function sportKey(sport) {
    const value = String(sport || "").toLowerCase();
    if (value.includes("volley")) return "volleyball";
    if (value.includes("swim") || value.includes("pool") || value.includes("natac")) return "swimming";
    if (value.includes("basket")) return "basketball";
    if (value.includes("padel") || value.includes("pádel") || value.includes("tennis")) return "padel";
    if (value.includes("baseball") || value.includes("béisbol")) return "baseball";
    if (value.includes("soccer") || value.includes("football") || value.includes("fútbol") || value.includes("futsal")) return "soccer";
    return "other";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }

  function markerIcon(key, isPrime) {
    const color = isPrime ? "#ff5a00" : (colors[key] || colors.other);
    const border = isPrime ? "3px solid #111" : "3px solid #fff";
    return L.divIcon({
      className:"prime-place-marker",
      html:'<div style="width:25px;height:25px;background:'+color+';border:'+border+';border-radius:50%;box-shadow:0 2px 10px #0005;display:grid;place-items:center;color:white;font-size:12px">'+(isPrime?"P":(icons[key]||"•"))+'</div>',
      iconSize:[25,25],iconAnchor:[12,12]
    });
  }

  function initMap() {
    if (!window.L) {
      document.getElementById("map").innerHTML = '<p class="state-message">The map could not be loaded. Check your internet connection and reload this page.</p>';
      return;
    }
    map = L.map("map", {scrollWheelZoom:true,zoomControl:true}).setView([8.8803,-79.7833],13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom:19,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
  }

  function googleMapsLink(place) {
    return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(place.query || (place.name+" "+place.location+" La Chorrera Panamá"));
  }

  function addExternalMarkers() {
    if (!map) return;
    localPlaces.forEach(place => {
      if (typeof place.lat !== "number" || typeof place.lng !== "number") return;
      const key = sportKey(place.sport);
      const marker = L.marker([place.lat,place.lng],{icon:markerIcon(key,false)}).addTo(map);
      const contact = place.phone ? '<br><span>'+escapeHTML(place.phone)+'</span>' : "";
      const link = '<br><a href="'+googleMapsLink(place)+'" target="_blank" rel="noopener">Open directions ↗</a>';
      marker.bindPopup('<strong>'+escapeHTML(place.name)+'</strong><br>'+escapeHTML(place.detail)+contact+link);
      markers.set(place.id,marker);
    });
  }

  function renderCourts() {
    const term = search.value.trim().toLowerCase();
    const entries = [
      ...primeCourts.map(court => ({...court,kind:"prime",id:"prime-"+court.id,originalId:court.id})),
      ...localPlaces.map(place => ({...place,kind:"external"}))
    ];
    const filtered = entries.filter(item => {
      const key = sportKey(item.sport);
      const matchesFilter = activeFilter === "all" || key === activeFilter;
      const matchesSearch = !term || [item.name,item.sport,item.location,item.description,item.detail].some(value => String(value||"").toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
    count.textContent = filtered.length+" RESULTS";

    if (!filtered.length) {
      list.innerHTML = '<div class="state-message">No places match your search. Try another sport or keyword.</div>';
      return;
    }

    list.innerHTML = filtered.map(item => {
      const key = sportKey(item.sport);
      const color = colors[key] || colors.other;
      const icon = icons[key] || "📍";
      const isPrime = item.kind === "prime";
      const image = isPrime && item.image_url ? ' style="background-image:url(&quot;'+escapeHTML(item.image_url)+'&quot;)"' : "";
      const thumb = isPrime && item.image_url ? "" : icon;
      const status = isPrime ? "PRIME · BOOK ON SITE" : (item.booking ? "EXTERNAL · RENTAL / BOOKING" : "PUBLIC / COMMUNITY");
      const detail = isPrime ? (item.location || "Location not specified") : item.location;
      const price = isPrime ? '<span class="price">$ '+Number(item.hourly_rate||0).toFixed(2).replace(/\.00$/,"")+' <small>/ hour</small></span>' : '<span class="price">'+(item.phone ? escapeHTML(item.phone) : "See details")+'</span>';
      const action = isPrime ? "VIEW AREA ↗" : '<a class="view-link" href="'+googleMapsLink(item)+'" target="_blank" rel="noopener">MAP / DETAILS ↗</a>';
      return '<article class="court-card" tabindex="0" role="button" data-id="'+escapeHTML(item.id)+'" data-kind="'+item.kind+'">'+
        '<div class="court-thumb"'+image+'>'+thumb+'</div><div class="court-info">'+
        '<div class="court-type" style="color:'+color+'"><i class="type-dot" style="background:'+color+'"></i>'+escapeHTML(item.sport||"Sport")+'</div>'+
        '<h2>'+escapeHTML(item.name)+'</h2><div class="court-location">'+escapeHTML(detail||"La Chorrera")+'</div>'+
        '<div class="court-status">'+status+'</div><div class="court-bottom">'+price+action+'</div></div></article>';
    }).join("");

    list.querySelectorAll(".court-card").forEach(card => {
      const activate = () => {
        list.querySelectorAll(".court-card").forEach(item => item.classList.remove("selected"));
        card.classList.add("selected");
        const marker = markers.get(card.dataset.id);
        if (marker && map) { map.setView(marker.getLatLng(),16,{animate:true}); marker.openPopup(); }
        else if (card.dataset.kind === "prime" && map) {
          map.setView([8.8803,-79.7833],14,{animate:true});
        }
      };
      card.addEventListener("click",event => {
        if (event.target.closest("a")) return;
        activate();
      });
      card.addEventListener("keydown",event => {
        if (event.key==="Enter" || event.key===" ") {event.preventDefault();activate();}
      });
    });
  }

  async function loadCourts() {
    if (!window.supabase || !window.supabase.createClient) {
      primeCourts = [];
      renderCourts();
      return;
    }
    const client = window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const {data,error} = await client.from("courts")
      .select("id,name,sport,description,image_url,location,hourly_rate")
      .eq("is_active",true).order("name",{ascending:true});
    if (error) console.error("PRIME courts error:",error);
    primeCourts = error ? [] : (data||[]);
    renderCourts();
  }

  filters.addEventListener("click",event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    filters.querySelectorAll(".filter").forEach(item => item.classList.toggle("active",item===button));
    renderCourts();
  });
  search.addEventListener("input",renderCourts);

  initMap();
  addExternalMarkers();
  loadCourts();
})();