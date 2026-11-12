(() => {
  "use strict";

  const SUPABASE_URL = "https://lykigrvkzkvwpeqgmxjq.supabase.co";
  const SUPABASE_KEY = "sb_publishable_87iX3KMcXjiZU3V8Xq7rYw_N7CTjSk8";

  const list = document.getElementById("court-list");
  const count = document.getElementById("court-count");
  const search = document.getElementById("court-search");
  const filters = document.getElementById("filters");

  const colors = { soccer:"#ff5a00", football:"#ff5a00", volleyball:"#2675d8", swimming:"#11a6a6" };
  const icons = { soccer:"⚽", football:"⚽", volleyball:"🏐", swimming:"🏊" };
  let allCourts = [];
  let activeFilter = "all";
  let map;
  let areaMarker;

  function sportKey(sport) {
    const value = String(sport || "").toLowerCase();
    if (value.includes("volley")) return "volleyball";
    if (value.includes("swim") || value.includes("pool")) return "swimming";
    if (value.includes("soccer") || value.includes("football")) return "soccer";
    return "other";
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[char]);
  }

  function initMap() {
    if (!window.L) {
      document.getElementById("map").innerHTML = '<p class="state-message">The map could not be loaded. Check your internet connection and reload this page.</p>';
      return;
    }
    map = L.map("map", { scrollWheelZoom:true, zoomControl:true }).setView([8.8803, -79.7833], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom:19,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const areaIcon = L.divIcon({
      className:"prime-area-marker",
      html:'<div style="width:22px;height:22px;background:#ff5a00;border:4px solid #fff;border-radius:50%;box-shadow:0 2px 12px #0005"></div>',
      iconSize:[22,22],
      iconAnchor:[11,11]
    });
    areaMarker = L.marker([8.8803, -79.7833], {icon:areaIcon}).addTo(map);
    areaMarker.bindPopup(
      '<strong>PRIME · La Chorrera</strong><br><span>General area only. Individual court coordinates have not been registered yet.</span>'
    );
  }

  function renderCourts() {
    const term = search.value.trim().toLowerCase();
    const filtered = allCourts.filter(court => {
      const key = sportKey(court.sport);
      const matchesFilter = activeFilter === "all" || key === activeFilter;
      const matchesSearch = !term || [court.name,court.sport,court.location,court.description]
        .some(value => String(value || "").toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });

    count.textContent = filtered.length + (filtered.length === 1 ? " RESULT" : " RESULTS");

    if (!filtered.length) {
      list.innerHTML = '<div class="state-message">No courts match your search. Try another sport or keyword.</div>';
      return;
    }

    list.innerHTML = filtered.map(court => {
      const key = sportKey(court.sport);
      const color = colors[key] || "#777";
      const icon = icons[key] || "📍";
      const image = court.image_url ? ' style="background-image:url(&quot;' + escapeHTML(court.image_url) + '&quot;)"' : "";
      const thumbContent = court.image_url ? "" : icon;
      const price = Number(court.hourly_rate || 0).toFixed(2).replace(/\.00$/,"");
      return `
        <article class="court-card" tabindex="0" role="button" data-id="${escapeHTML(court.id)}" aria-label="Show ${escapeHTML(court.name)} on the map">
          <div class="court-thumb"${image}>${thumbContent}</div>
          <div class="court-info">
            <div class="court-type" style="color:${color}"><i class="type-dot" style="background:${color}"></i>${escapeHTML(court.sport || "Sport")}</div>
            <h2>${escapeHTML(court.name)}</h2>
            <div class="court-location">${escapeHTML(court.location || "Location not specified")}</div>
            <div class="court-bottom">
              <span class="price">$ ${price} <small>/ hour</small></span>
              <span class="view-link">VIEW AREA ↗</span>
            </div>
          </div>
        </article>`;
    }).join("");

    list.querySelectorAll(".court-card").forEach(card => {
      const activate = () => {
        list.querySelectorAll(".court-card").forEach(item => item.classList.remove("selected"));
        card.classList.add("selected");
        if (map && areaMarker) {
          map.setView(areaMarker.getLatLng(), 15, {animate:true});
          areaMarker.openPopup();
        }
      };
      card.addEventListener("click", activate);
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  }

  async function loadCourts() {
    if (!window.supabase || !window.supabase.createClient) {
      list.innerHTML = '<div class="state-message">Could not connect to PRIME. Please reload the page.</div>';
      count.textContent = "UNAVAILABLE";
      return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await client
      .from("courts")
      .select("id,name,sport,description,image_url,location,hourly_rate")
      .eq("is_active", true)
      .order("name", { ascending:true });

    if (error) {
      console.error("PRIME courts error:", error);
      list.innerHTML = '<div class="state-message">Courts could not be loaded right now. Please try again later.</div>';
      count.textContent = "ERROR";
      return;
    }

    allCourts = data || [];
    renderCourts();
  }

  filters.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    filters.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === button));
    renderCourts();
  });

  search.addEventListener("input", renderCourts);

  initMap();
  loadCourts();
})();
