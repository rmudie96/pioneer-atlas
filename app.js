const state = {
  scenario: "policy_acceleration",
  metric: "localDeprivation",
  selectedCode: null,
  selectedIndustryIndex: null,
  optionFilter: "all",
  summary: [],
  boundaries: [],
  options: [],
  national: null,
  neighbourhoodMap: null,
};

const colors = ["#edf6f4", "#c8e6df", "#85c9bc", "#2a9b8c", "#006c62"];
const deprivationColors = ["#7f1d1d", "#b33a2f", "#d96d49", "#e9a06d", "#f0c99d", "#e7e4d4", "#cbdccf", "#9fc6b7", "#68a994", "#277665"];
const scenarioLabels = {
  existing_trajectory: "Existing trajectory",
  policy_acceleration: "Policy acceleration",
  transformational: "Transformational",
};
const metricMeta = {
  localDeprivation: { title: "Deprivation by Travel to Work Area (TTWA)", label: "Local deprivation percentile", kind: "percentile", ranged: false },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function compactNumber(value, digits = 0) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(value || 0);
}

function money(value) {
  if (value >= 1000) return `£${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}bn`;
  if (value >= 10) return `£${value.toFixed(0)}m`;
  return `£${value.toFixed(1)}m`;
}

function ordinal(value) {
  const number = Math.round(value);
  const lastTwo = number % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${number}th`;
  if (number % 10 === 1) return `${number}st`;
  if (number % 10 === 2) return `${number}nd`;
  if (number % 10 === 3) return `${number}rd`;
  return `${number}th`;
}

function displaySingle(value, kind) {
  if (kind === "money") return money(value);
  if (kind === "percentile") return ordinal(value);
  return compactNumber(value);
}

function displayRange(values, kind) {
  const lower = displaySingle(values.lower, kind);
  const upper = displaySingle(values.upper, kind);
  return lower === upper ? lower : `${lower}–${upper}`;
}

function roundedCount(value, increment) {
  if (value > 0 && value < increment / 2) return `<${compactNumber(increment)}`;
  return compactNumber(Math.round(value / increment) * increment);
}

function displayRoundedCountRange(values, increment) {
  const lower = roundedCount(values.lower, increment);
  const upper = roundedCount(values.upper, increment);
  return lower === upper ? lower : `${lower}–${upper}`;
}

function jobsPotentialLabel(value) {
  return { green: "strong", amber: "moderate", red: "weak" }[value] || value;
}

function summaryMetric(summary) {
  return summary.localDeprivationPercentile;
}

function summaryMetricDisplay(summary) {
  const meta = metricMeta[state.metric];
  if (meta.ranged) return displayRange(summary.scenarios[state.scenario][state.metric], meta.kind);
  return displaySingle(summaryMetric(summary), meta.kind);
}

function quantileBreaks(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return [0.2, 0.4, 0.6, 0.8].map(
    (quantile) => sorted[Math.min(sorted.length - 1, Math.floor(quantile * sorted.length))],
  );
}

function colorFor(value, breaks) {
  let index = 0;
  while (index < breaks.length && value > breaks[index]) index += 1;
  return colors[index];
}

function renderNational() {
  const values = state.national.scenarios[state.scenario];
  $("#national-scenario-label").textContent = `${scenarioLabels[state.scenario]} by ${state.national.projectionHorizon}`;
  $("#national-exports").textContent = displayRange(values.exports, "money");
  $("#national-direct-jobs").textContent = displayRoundedCountRange(values.directFte, 100);
  $("#national-supply-jobs").textContent = displayRoundedCountRange(values.supplyFte, 100);
  $("#national-total-jobs").textContent = displayRoundedCountRange(values.totalFte, 100);
}

function renderMap() {
  if (state.selectedCode && state.neighbourhoodMap) {
    renderNeighbourhoodMap();
    return;
  }
  const summaryByCode = new Map(state.summary.map((item) => [item.code, item]));
  const values = state.summary.map(summaryMetric);
  const breaks = quantileBreaks(values);
  const svg = $("#ttwa-map");
  svg.innerHTML = "";
  state.boundaries.forEach((boundary) => {
    const summary = summaryByCode.get(boundary.code);
    const value = summaryMetric(summary);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", boundary.path);
    path.setAttribute("fill", colorFor(value, breaks));
    path.setAttribute("class", `ttwa-shape${boundary.code === state.selectedCode ? " selected" : ""}`);
    path.setAttribute("tabindex", "0");
    path.setAttribute("role", "button");
    path.setAttribute("aria-label", `${summary.name}: ${summaryMetricDisplay(summary)} ${metricMeta[state.metric].label}`);
    path.dataset.code = boundary.code;
    path.addEventListener("click", () => selectPlace(boundary.code));
    path.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") selectPlace(boundary.code);
    });
    path.addEventListener("mouseenter", (event) => showTooltip(event, summary));
    path.addEventListener("mousemove", positionTooltip);
    path.addEventListener("mouseleave", hideTooltip);
    svg.appendChild(path);
  });
  $("#map-title").textContent = metricMeta[state.metric].title;
  $("#map-instruction").hidden = false;
  $("#legend-low").textContent = "Lower deprivation";
  $("#legend-high").textContent = "Higher deprivation";
  $("#legend-swatches").innerHTML = colors.map((color) => `<i style="background:${color}"></i>`).join("");
  $("#legend-range").textContent = `${displaySingle(Math.min(...values), metricMeta[state.metric].kind)}–${displaySingle(Math.max(...values), metricMeta[state.metric].kind)}`;
  $("#map-note").textContent = "TTWAs approximate self-contained local labour markets. Select one to see deprivation by neighbourhood.";
}

function renderNeighbourhoodMap() {
  const svg = $("#ttwa-map");
  svg.innerHTML = "";
  state.neighbourhoodMap.neighbourhoods.forEach((neighbourhood) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", neighbourhood.path);
    path.setAttribute("fill", deprivationColors[neighbourhood.imdDecile - 1]);
    path.setAttribute("class", "lsoa-shape");
    path.setAttribute("tabindex", "0");
    path.setAttribute("role", "img");
    path.setAttribute("aria-label", `${neighbourhood.name}: IMD decile ${neighbourhood.imdDecile} of 10`);
    path.addEventListener("mouseenter", (event) => showNeighbourhoodTooltip(event, neighbourhood));
    path.addEventListener("mousemove", positionTooltip);
    path.addEventListener("mouseleave", hideTooltip);
    path.addEventListener("blur", hideTooltip);
    svg.appendChild(path);
  });
  $("#map-title").textContent = `${state.neighbourhoodMap.ttwaName}: deprivation by neighbourhood`;
  $("#map-instruction").hidden = true;
  $("#legend-low").textContent = "Most deprived";
  $("#legend-high").textContent = "Least deprived";
  $("#legend-swatches").innerHTML = deprivationColors.map((color) => `<i style="background:${color}"></i>`).join("");
  $("#legend-range").textContent = "IMD deciles 1–10";
  $("#map-note").textContent = "Each shape is a 2021 LSOA. Decile 1 is among England's most deprived 10% of neighbourhoods; decile 10 is among the least deprived 10%.";
}

function showNeighbourhoodTooltip(event, neighbourhood) {
  const tooltip = $("#map-tooltip");
  tooltip.innerHTML = `<strong>${neighbourhood.name}</strong><span>IMD decile ${neighbourhood.imdDecile} of 10</span>`;
  tooltip.hidden = false;
  positionTooltip(event);
}

function showTooltip(event, summary) {
  const tooltip = $("#map-tooltip");
  tooltip.innerHTML = `<strong>${summary.name}</strong><span>${metricMeta[state.metric].label}: ${summaryMetricDisplay(summary)}</span>`;
  tooltip.hidden = false;
  positionTooltip(event);
}

function positionTooltip(event) {
  const stage = $(".map-stage");
  const box = stage.getBoundingClientRect();
  const tooltip = $("#map-tooltip");
  const x = Math.min(event.clientX - box.left + 12, box.width - 210);
  const y = Math.max(8, event.clientY - box.top - 34);
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideTooltip() {
  $("#map-tooltip").hidden = true;
}

function selectedSummary() {
  return state.summary.find((item) => item.code === state.selectedCode);
}

function selectedOptions() {
  return state.options.filter((item) => item.ttwaCode === state.selectedCode);
}

async function selectPlace(code) {
  state.selectedCode = code;
  state.neighbourhoodMap = null;
  state.selectedIndustryIndex = null;
  state.optionFilter = "all";
  $("#option-filter").value = "all";
  $("#industry-detail").hidden = true;
  renderPlace();
  try {
    const response = await fetch(`data/neighbourhoods/${code}.json`);
    if (!response.ok) throw new Error(`Neighbourhood map unavailable (${response.status})`);
    const neighbourhoodMap = await response.json();
    if (state.selectedCode === code) {
      state.neighbourhoodMap = neighbourhoodMap;
      renderMap();
    }
  } catch (error) {
    renderMap();
  }
  if (window.innerWidth < 1100) {
    $("#detail-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function clearPlace() {
  state.selectedCode = null;
  state.neighbourhoodMap = null;
  state.selectedIndustryIndex = null;
  $("#place-overview").hidden = true;
  $("#national-overview").hidden = false;
  $("#place-search").value = "";
  renderMap();
}

function renderPlace() {
  const summary = selectedSummary();
  if (!summary) return clearPlace();
  const values = summary.scenarios[state.scenario];
  $("#national-overview").hidden = true;
  $("#place-overview").hidden = false;
  $("#place-name").textContent = summary.name;
  $("#place-code").textContent = summary.code;
  $("#place-exports").textContent = displayRange(values.exports, "money");
  $("#place-jobs").textContent = displayRoundedCountRange(values.directFte, 10);
  $("#place-supply-jobs").textContent = displayRoundedCountRange(values.supplyFte, 10);
  $("#place-option-count").textContent = `${summary.candidateOptions} candidate industries`;
  $("#place-option-mix").textContent = `${summary.expansionOptions} expansion · ${summary.diversificationOptions} diversification`;
  $("#green-count").textContent = summary.jobsRatings.green;
  $("#amber-count").textContent = summary.jobsRatings.amber;
  $("#red-count").textContent = summary.jobsRatings.red;
  renderOpportunityTable();
  if (state.selectedIndustryIndex !== null) renderIndustryDetail(state.selectedIndustryIndex);
}

function renderOpportunityTable() {
  const options = selectedOptions()
    .filter((item) => state.optionFilter === "all" || item.route === state.optionFilter)
    .sort((a, b) => a.rank - b.rank);
  const body = $("#opportunity-table");
  body.innerHTML = options.map((option) => {
    const originalIndex = state.options.indexOf(option);
    return `<tr data-option-index="${originalIndex}" tabindex="0">
      <td class="sic-code">${option.sic4}</td>
      <td class="industry-cell"><span class="rank-number">${option.rank}</span>${option.industry}</td>
      <td><span class="type-tag">${option.route}</span></td>
      <td class="jobs-cell">${displayRoundedCountRange(option.scenarios[state.scenario].directFte, 5)}<span class="jobs-rag" title="${jobsPotentialLabel(option.jobsRating)} jobs uplift potential"><i class="rag-dot ${option.jobsRating}"></i><span class="sr-only">${jobsPotentialLabel(option.jobsRating)} jobs uplift potential</span></span></td>
      ${ratingTableCell(option.ratings.comparativeAdvantage, "Current Relative Comparative Advantage (RCA)")}
      ${ratingTableCell(option.ratings.relatedness, "Local Industrial Relatedness with Sector")}
      ${ratingTableCell(option.ratings.workforce, "Existing Workforce Suitability")}
      ${ratingTableCell(option.ratings.export, "High Export Potential")}
    </tr>`;
  }).join("");
  $$("tr[data-option-index]").forEach((row) => {
    const open = () => renderIndustryDetail(Number(row.dataset.optionIndex));
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") open();
    });
  });
}

function ratingLabel(value) {
  return value.replace(/^grey_/, "").replaceAll("_", " ");
}

function ratingTableCell(rating, label, detail = "") {
  const colour = rating.split("_")[0];
  const readable = ratingLabel(rating);
  const title = `${label}: ${readable}${detail ? `; ${detail}` : ""}`;
  return `<td class="rag-table-cell" title="${title}"><i class="rag-square ${colour}"></i><span class="sr-only">${title}</span></td>`;
}

function renderRatingGrid(option) {
  const ratings = [
    ["Current Relative Comparative Advantage (RCA)", option.ratings.comparativeAdvantage],
    ["Local Industrial Relatedness with Sector", option.ratings.relatedness],
    ["Existing Workforce Suitability", option.ratings.workforce],
    ["High Export Potential", option.ratings.export],
  ];
  $("#rating-grid").innerHTML = ratings.map(([label, rating]) => `
    <div><span>${label}</span><strong><i class="rag-dot ${rating.split("_")[0]}"></i>${ratingLabel(rating)}</strong></div>
  `).join("");
}

function humanReviewReason(value) {
  const labels = {
    very_large_direct_jobs_estimate: "Very large direct-jobs estimate",
    large_diversification_scale: "Large diversification proposition",
    high_share_review: "High share of the national industry opportunity",
    moderate_share_review: "Material share of the national industry opportunity",
    weaker_industrial_relatedness: "Weaker industrial-relatedness evidence",
    weaker_workforce_compatibility: "Weaker workforce-compatibility evidence",
    precious_materials_trade_value_review: "Precious-materials trade values require interpretation",
    waste_and_circular_economy_scope_review: "Waste and circular-economy scope requires interpretation",
    small_direct_jobs_effect: "Small direct-jobs effect",
  };
  return labels[value] || value.replaceAll("_", " ");
}

function cleanMarketList(value) {
  if (!value) return "No market detail available.";
  const markets = value
    .split(";")
    .map((item) => item.replace(/\s*\([\d,.]+\)\s*$/, "").trim())
    .filter(Boolean);
  return [...new Set(markets)].slice(0, 5).join("; ") || "No market detail available.";
}

function renderIndustryDetail(index) {
  const option = state.options[index];
  if (!option || option.ttwaCode !== state.selectedCode) return;
  state.selectedIndustryIndex = index;
  const values = option.scenarios[state.scenario];
  $("#industry-detail").hidden = false;
  $("#industry-type").textContent = `${option.route} · rank ${option.rank}`;
  $("#industry-name").textContent = option.industry;
  $("#industry-code").textContent = `SIC ${option.sic4}`;
  $("#industry-current-jobs").textContent = roundedCount(option.currentJobs, 5);
  $("#industry-rca").textContent = option.employmentRca.toFixed(2);
  $("#industry-relatedness").textContent = ordinal(option.relatedness);
  $("#industry-workforce").textContent = ordinal(option.workforce);
  $("#industry-exports").textContent = displayRange(values.exports, "money");
  $("#industry-direct-jobs").textContent = displayRoundedCountRange(values.directFte, 5);
  $("#industry-supply-jobs").textContent = displayRoundedCountRange(values.supplyFte, 5);
  renderRatingGrid(option);

  $("#review-callout").hidden = !option.reviewRequired;
  $("#review-reasons").textContent = option.reviewReasons.map(humanReviewReason).join("; ");
  $("#product-list").innerHTML = option.products.length
    ? option.products.map((product) => `<li>${product}</li>`).join("")
    : "<li>No clean linked product detail is available.</li>";
  $("#market-list").textContent = cleanMarketList(option.markets);
  $("#industry-detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function bindControls() {
  $$("#scenario-controls button").forEach((button) => button.addEventListener("click", () => {
    state.scenario = button.dataset.scenario;
    $$("#scenario-controls button").forEach((item) => item.classList.toggle("active", item === button));
    renderNational();
    renderMap();
    if (state.selectedCode) renderPlace();
  }));
  $$("#metric-controls button").forEach((button) => button.addEventListener("click", () => {
    state.metric = button.dataset.metric;
    $$("#metric-controls button").forEach((item) => item.classList.toggle("active", item === button));
    renderMap();
    if (state.selectedCode) renderPlace();
  }));
  $("#reset-map").addEventListener("click", clearPlace);
  $("#close-place").addEventListener("click", clearPlace);
  $("#close-industry").addEventListener("click", () => {
    state.selectedIndustryIndex = null;
    $("#industry-detail").hidden = true;
  });
  $("#option-filter").addEventListener("change", (event) => {
    state.optionFilter = event.target.value;
    state.selectedIndustryIndex = null;
    $("#industry-detail").hidden = true;
    renderOpportunityTable();
  });
  const search = $("#place-search");
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    const results = $("#search-results");
    if (!query) {
      results.hidden = true;
      return;
    }
    const matches = state.summary
      .filter((item) => item.name.toLowerCase().includes(query))
      .slice(0, 8);
    results.innerHTML = matches
      .map((item) => `<button type="button" data-code="${item.code}">${item.name}</button>`)
      .join("");
    results.hidden = matches.length === 0;
    $$("#search-results button").forEach((button) => button.addEventListener("click", () => {
      search.value = state.summary.find((item) => item.code === button.dataset.code).name;
      results.hidden = true;
      selectPlace(button.dataset.code);
    }));
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-wrap")) $("#search-results").hidden = true;
  });
}

async function init() {
  try {
    const [summary, boundaries, options, national] = await Promise.all([
      fetch("data/ttwa-summary.json").then((response) => response.json()),
      fetch("data/ttwa-boundaries.json").then((response) => response.json()),
      fetch("data/industry-options.json").then((response) => response.json()),
      fetch("data/national-summary.json").then((response) => response.json()),
    ]);
    Object.assign(state, { summary, boundaries, options, national });
    bindControls();
    renderNational();
    renderMap();
  } catch (error) {
    document.body.innerHTML = `<main class="load-error"><h1>The PIONEER Atlas could not load</h1><p>${error.message}</p></main>`;
  }
}

init();
