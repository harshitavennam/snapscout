// ---------- Element references ----------
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const clearBtn = document.getElementById("clear-btn");
const results = document.getElementById("results");
const countEl = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");

// ---------- Constants ----------
const API = "https://commons.wikimedia.org/w/api.php";
const IDLE_MESSAGE = "🔭 Search above to start scouting.";
const BASE_TITLE = "SnapScout – Find the perfect picture";

// Used to ignore out-of-date responses if the user searches twice quickly
let latestRequest = 0;

// Screen readers announce status changes (loading / count / errors)
countEl.setAttribute("role", "status");

// ---------- Helpers ----------
function buildUrl(query) {
  const params =
    "action=query&generator=search&gsrnamespace=6&gsrlimit=12" +
    "&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=400" +
    "&format=json&origin=*";
  const search = encodeURIComponent("filetype:bitmap " + query);
  return `${API}?${params}&gsrsearch=${search}`;
}

// The artist field comes back as HTML, so reduce it to plain text.
function plainText(html) {
  return new DOMParser().parseFromString(html, "text/html").body.textContent.trim();
}

function createCard(page) {
  const info = page.imageinfo[0];

  const card = document.createElement("a");
  card.className = "card";
  card.href = info.descriptionurl; // opens the full image page
  card.target = "_blank";
  card.rel = "noopener";

  const img = document.createElement("img");
  img.src = info.thumburl || info.url;
  img.alt = page.title;
  img.loading = "lazy";

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h3");
  title.textContent = page.title.replace(/^File:/, "").replace(/\.[^.]+$/, "");

  const artist = info.extmetadata?.Artist?.value;
  const author = document.createElement("p");
  author.textContent = "By " + (artist ? plainText(artist) : "Unknown");

  body.append(title, author);
  card.append(img, body);
  return card;
}

// LOADING state: grey shimmering placeholder cards
function showSkeletons(count = 8) {
  results.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "card skeleton";
    sk.setAttribute("aria-hidden", "true");
    sk.innerHTML =
      '<div class="sk-img"></div>' +
      '<div class="card-body"><div class="sk-line"></div><div class="sk-line short"></div></div>';
    results.appendChild(sk);
  }
}

// Shows a message in the empty-state element (used for idle, empty and error)
function showMessage(text) {
  emptyState.textContent = text;
  emptyState.hidden = false;
}

// ---------- Main search ----------
async function search(query) {
  query = query.trim();

  // Blank search: do NOT call the API, just nudge the user
  if (!query) {
    countEl.textContent = "Please type a word to search.";
    return;
  }

  const requestId = ++latestRequest;
  searchBtn.disabled = true;
  emptyState.hidden = true;

  // 1. LOADING state (before fetch)
  countEl.innerHTML = '<span class="spinner"></span> Searching…';
  showSkeletons();

  try {
    const response = await fetch(buildUrl(query));
    if (!response.ok) throw new Error("Bad status: " + response.status);
    const data = await response.json();

    if (requestId !== latestRequest) return; // a newer search took over

    // Clear skeletons / old results before rendering
    results.innerHTML = "";

    const pages = data.query ? Object.values(data.query.pages) : [];
    const items = pages
      .filter((p) => p.imageinfo)
      .sort((a, b) => a.index - b.index);

    if (items.length === 0) {
      // 2. EMPTY state
      countEl.textContent = `Showing 0 results for “${query}”`;
      showMessage(`😕 No results for “${query}”. Try another search.`);
    } else {
      // RESULTS state
      items.forEach((page) => results.appendChild(createCard(page)));
      countEl.textContent = `Showing ${items.length} results for “${query}”`;
      emptyState.hidden = true;
      document.title = `${query} – SnapScout`; // polish: title follows the search
    }
  } catch (error) {
    // 3. ERROR state (network failure or bad response)
    if (requestId !== latestRequest) return;
    results.innerHTML = "";
    countEl.textContent = "";
    showMessage("⚠️ Something went wrong. Please try again.");
  } finally {
    if (requestId === latestRequest) searchBtn.disabled = false;
  }
}

// ---------- Event listeners ----------

// Search by clicking the button or pressing Enter
form.addEventListener("submit", (event) => {
  event.preventDefault();
  search(input.value);
});

// Quick-pick chips run a search
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    input.value = chip.textContent;
    search(chip.textContent);
  });
});

// Clear: back to the IDLE state
clearBtn.addEventListener("click", () => {
  latestRequest++; // cancel any search still in flight
  searchBtn.disabled = false;
  results.innerHTML = "";
  countEl.textContent = "Showing 0 results";
  showMessage(IDLE_MESSAGE);
  document.title = BASE_TITLE;
});