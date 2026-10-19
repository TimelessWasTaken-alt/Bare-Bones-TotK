(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE_KEY = "bare-bones-totk-v2";
  const state = {
    theme: "dark",
    lateChecks: {},
    gloom: 1,
    regions: {},
    effectsUsed: 0,
    extraRegions: 0,
    runLog: { date: "", time: "", notes: "" }
  };
  let toastTimer;

  const lateItems = [
    "A Blood Moon occurred immediately before the challenge begins.",
    "No enemies were defeated after that Blood Moon and before the challenge began.",
    "Start at the Room of Awakening or Shrine of Resurrection.",
    "Existing inventory equipment is unusable unless another rule explicitly permits it.",
    "Amiibo-associated weapons, bows, and shields remain banned.",
    "Existing upgrades and story progress are retained.",
    "If already owned, the Master Sword stays unusable until the 5-encounter unlock is complete.",
    "If already owned, defeat 3 Stalnoxes before using the Hylian Shield.",
    "Fuse has no unlock because it is prohibited in every mode.",
    "The paraglider remains prohibited outside shrines and dungeons."
  ];

  const regions = [
    {name:"Great Sky Island", destination:"Top of the Temple of Time", explore:true},
    {name:"Great Plateau", destination:"Shrine of Resurrection and Mount Hylia summit", explore:true},
    {name:"Central Hyrule", destination:"Hyrule Castle Sanctum (inside the castle)", explore:true},
    {name:"Hebra", destination:"Hebra Peak summit", explore:true},
    {name:"Tabantha Frontier / Rito Village", destination:"Rito Village — regional placement needs confirmation", explore:true},
    {name:"West Necluda", destination:"Summit of both Dueling Peaks", explore:true},
    {name:"East Necluda", destination:"Hateno Village and Hateno Ancient Tech Lab", explore:true},
    {name:"Mount Lanayru", destination:"Mount Lanayru summit", explore:true},
    {name:"Lanayru Great Spring", destination:"Ploymus Mountain summit — proposed, not confirmed", explore:true},
    {name:"Gerudo Highlands", destination:"High ground above Yiga Hideout; entering it is not required", explore:true},
    {name:"Gerudo Desert", destination:"Gerudo Town", explore:true},
    {name:"Faron", destination:"Cape Cales point and Eventide Island — regional placement needs confirmation", explore:true},
    {name:"Eldin / Death Mountain", destination:"Death Mountain summit", explore:true},
    {name:"Woodland / Great Hyrule Forest", destination:"Korok Forest", explore:true},
    {name:"Ridgeland", destination:"Satori Mountain summit", explore:true}
  ];


  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* Private browsing can block storage. */ }
  }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") {
        Object.assign(state, saved);
        state.lateChecks ||= {};
        state.regions ||= {};
        state.runLog ||= {date:"",time:"",notes:""};
      }
    } catch (_) { /* Start with clean defaults if stored data is invalid. */ }
  }
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.append(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        if (!ok) throw new Error("Copy unavailable");
      }
      toast("Copied to clipboard");
    } catch (_) {
      window.prompt("Copy the text below:", text);
    }
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function makeCheckRow(text, checked, onChange) {
    const label = document.createElement("label");
    label.className = "check-row" + (checked ? " is-checked" : "");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !!checked;
    input.addEventListener("change", () => {
      label.classList.toggle("is-checked", input.checked);
      onChange(input.checked);
    });
    const span = document.createElement("span");
    span.textContent = text;
    label.append(input, span);
    return label;
  }
  function renderLateChecks() {
    const root = $("#lateChecks");
    root.replaceChildren();
    lateItems.forEach((item, i) => root.append(makeCheckRow(item, !!state.lateChecks[i], checked => {
      state.lateChecks[i] = checked; saveState(); updateLateProgress();
    })));
    updateLateProgress();
  }
  function updateLateProgress() {
    const count = lateItems.filter((_, i) => state.lateChecks[i]).length;
    $("#lateProgress").textContent = `${count} of ${lateItems.length} complete`;
    $("#lateProgressBar").style.width = `${count / lateItems.length * 100}%`;
  }
  function resetLate() {
    state.lateChecks = {};
    saveState(); renderLateChecks(); toast("Late-Start checklist reset");
  }
  function renderGloom() {
    state.gloom = Math.max(0, Math.min(5, Number(state.gloom) || 0));
    $("#gloomCount").textContent = state.gloom;
    $("#gloomProgressBar").style.width = `${state.gloom * 20}%`;
    $("#gloomStatus").textContent = state.gloom === 5
      ? "Requirement complete — Master Sword use unlocked for Late-Start Mode."
      : `${5 - state.gloom} qualifying encounter${5 - state.gloom === 1 ? "" : "s"} remaining.`;
    $("#gloomAdd").disabled = state.gloom >= 5;
    $("#gloomUndo").disabled = state.gloom <= 0;
    saveState();
  }
  function renderRegions() {
    const root = $("#regionList");
    root.replaceChildren();
    regions.forEach((region, i) => {
      const saved = state.regions[i] || {};
      const card = document.createElement("article");
      card.className = "region-card";
      card.innerHTML = `<h4>${escapeHTML(region.name)}</h4><p class="region-destination">${escapeHTML(region.destination)}</p><div class="region-checks"></div><div class="region-status" aria-live="polite"></div>`;
      const checks = $(".region-checks", card);
      const options = [{key:"time", label:"60 min complete"}, ...(region.explore ? [{key:"explore",label:"50% explored"}] : []), {key:"destination",label:"Destination reached"}];
      options.forEach(option => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = !!saved[option.key];
        input.addEventListener("change", () => {
          state.regions[i] ||= {};
          state.regions[i][option.key] = input.checked;
          updateRegionCard(card, region, state.regions[i]);
          saveState();
        });
        const text = document.createElement("span");
        text.textContent = option.label;
        label.append(input, text);
        checks.append(label);
      });
      updateRegionCard(card, region, saved);
      root.append(card);
    });
  }
  function updateRegionCard(card, region, saved) {
    const complete = !!saved.time && !!saved.destination && (!region.explore || !!saved.explore);
    card.classList.toggle("is-complete", complete);
    $(".region-status", card).textContent = complete ? "Region complete" : "Requirements not complete";
  }
  function copyRegions() {
    const output = regions.map((region, i) => {
      const saved = state.regions[i] || {};
      return `${region.name} — ${region.destination}\n` +
        `  [${saved.time ? "x" : " "}] 60 minutes complete\n` +
        (region.explore ? `  [${saved.explore ? "x" : " "}] 50% explored\n` : "") +
        `  [${saved.destination ? "x" : " "}] Destination reached\n`;
    }).join("\n");
    copyText(`Bare Bones TOTK — Wanderer progress\n\n${output}`);
  }
  function resetRegions() {
    state.regions = {};
    saveState(); renderRegions(); toast("Regional progress reset");
  }
  function renderEffects() {
    const used = Math.max(0, Math.min(3, Number(state.effectsUsed) || 0));
    state.effectsUsed = used;
    $("#effectCount").textContent = `${used} / 3 used`;
    $("#effectSummary").textContent = used < 3 ? `${3 - used} use${3 - used === 1 ? "" : "s"} available.` : "All uses spent. Complete three additional regions to replenish.";
    const buttons = $("#effectUseButtons");
    buttons.replaceChildren();
    for (let i = 1; i <= 3; i++) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "use-button" + (i <= used ? " used" : "");
      button.textContent = i <= used ? `Use ${i} · spent` : `Mark use ${i} spent`;
      button.setAttribute("aria-pressed", String(i <= used));
      button.addEventListener("click", () => {
        state.effectsUsed = i <= state.effectsUsed ? i - 1 : i;
        if (state.effectsUsed < 3) state.extraRegions = 0;
        saveState(); renderEffects();
      });
      buttons.append(button);
    }
    const replenish = $("#replenishPanel");
    replenish.hidden = used < 3;
    const extra = Math.max(0, Math.min(3, Number(state.extraRegions) || 0));
    state.extraRegions = extra;
    $("#replenishCount").textContent = `${extra} / 3`;
    $("#regionMinus").disabled = extra <= 0;
    $("#regionPlus").disabled = extra >= 3;
    $("#replenishStatus").textContent = extra === 3 ? "Three additional regions complete. You can refill the allowance." : `${3 - extra} more completed region${3 - extra === 1 ? "" : "s"} needed.`;
    $("#replenishNow").hidden = extra < 3;
    saveState();
  }
  function resetEffects() {
    state.effectsUsed = 0; state.extraRegions = 0;
    saveState(); renderEffects(); toast("Effect allowance reset");
  }
  function renderRunLog() {
    $("#runDate").value = state.runLog.date || "";
    $("#runTime").value = state.runLog.time || "";
    $("#runNotes").value = state.runLog.notes || "";
  }
  function saveRunLog() {
    state.runLog = {date:$("#runDate").value, time:$("#runTime").value, notes:$("#runNotes").value};
    saveState();
    $("#runSaveStatus").textContent = "Autosaved in this browser.";
  }
  function copyRunLog() {
    const log = state.runLog;
    copyText(`Bare Bones TOTK — Survival Run\nDate: ${log.date || "Not entered"}\nTime survived: ${log.time || "Not entered"}\nNotes: ${log.notes || "None"}`);
  }
  function initRules() {
    const search = $("#ruleSearch");
    const ruleItems = $$(".rule-item");
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      ruleItems.forEach(item => {
        const match = !query || (item.dataset.search + " " + item.textContent).toLowerCase().includes(query);
        item.hidden = !match;
        if (match) visible++;
      });
      $("#noRulesFound").hidden = visible > 0;
    });
    $("#expandRules").addEventListener("click", () => {
      const visible = ruleItems.filter(item => !item.hidden);
      const shouldOpen = visible.some(item => !item.open);
      visible.forEach(item => item.open = shouldOpen);
      $("#expandRules").textContent = shouldOpen ? "Collapse all" : "Expand all";
    });
  }
  function initTheme() {
    document.body.classList.toggle("light-theme", state.theme === "light");
    $("#themeToggle").setAttribute("aria-label", state.theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    $("#themeToggle").addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      document.body.classList.toggle("light-theme", state.theme === "light");
      $("#themeToggle").setAttribute("aria-label", state.theme === "light" ? "Switch to dark theme" : "Switch to light theme");
      saveState();
    });
  }
  function initNavigation() {
    const nav = $("#siteNav");
    const toggle = $("#menuToggle");
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    $$(".nav-inner a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            $$(".nav-inner a").forEach(link => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
          }
        });
      }, {rootMargin:"-20% 0px -70% 0px"});
      $$("main section[id]").forEach(section => observer.observe(section));
    }
  }
  function bindEvents() {
    $("#gloomAdd").addEventListener("click", () => { state.gloom++; renderGloom(); });
    $("#gloomUndo").addEventListener("click", () => { state.gloom--; renderGloom(); });
    $("#gloomReset").addEventListener("click", () => { state.gloom = 1; renderGloom(); toast("Master Sword tracker reset to 1/5"); });
    $("#copyRegions").addEventListener("click", copyRegions);
    $("#resetRegions").addEventListener("click", resetRegions);
    $("#regionMinus").addEventListener("click", () => { state.extraRegions = Math.max(0, state.extraRegions - 1); renderEffects(); });
    $("#regionPlus").addEventListener("click", () => { state.extraRegions = Math.min(3, state.extraRegions + 1); renderEffects(); });
    $("#replenishNow").addEventListener("click", () => {
      if (state.extraRegions === 3 && state.effectsUsed === 3) {
        state.effectsUsed = 0; state.extraRegions = 0; saveState(); renderEffects(); toast("Three effect-food uses replenished");
      }
    });
    $("#copyRun").addEventListener("click", copyRunLog);
    ["runDate","runTime","runNotes"].forEach(id => $(`#${id}`).addEventListener("input", saveRunLog));
    $$("[data-reset]").forEach(button => button.addEventListener("click", () => {
      if (button.dataset.reset === "lateChecks") resetLate();
    }));
    $$("[data-copy]").forEach(button => button.addEventListener("click", () => copyChecklist(button.dataset.copy, "Late-Start setup checklist")));
  }
  function init() {
    loadState();
    initTheme();
    initNavigation();
    initRules();
    renderLateChecks();
    renderGloom();
    renderRegions();
    renderEffects();
    renderRunLog();
    bindEvents();
  }
  document.addEventListener("DOMContentLoaded", init);
})();