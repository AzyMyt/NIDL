// I WANT TO ADD LIKE A TIME MACHINE AND uh SORTING BY THINGS later

const btnModern = document.getElementById("modern");
const btnGrid = document.getElementById("grid");
const btnClassics = document.getElementById("classics");
const btnPlatformers = document.getElementById("platformers");
const btnProfiles = document.getElementById("profiles");
const list = document.getElementById("list");
const input = document.getElementById("targetPlayerInput");
const nidlPlayers = document.getElementById("players");


let profiles = false;
let styling = "modern";
let type = "classics";
let currentStyle;
let currentType;
let recordsData;
let data;
let targetPlayer;
let position = 0;

btnModern.addEventListener("click", () => updateStyling("modern"));
btnGrid.addEventListener("click", () => updateStyling("grid"));
btnClassics.addEventListener("click", () => updateType("classics"));
btnPlatformers.addEventListener("click", () => updateType("platformers"));

btnProfiles.addEventListener("click", () => {
  console.log(profiles);
  profiles = false;
  input.value = "";
  GenerateList();
});

const typeButtons = {
  classics: btnClassics,
  platformers: btnPlatformers,
};

const styleButtons = {
  modern: btnModern,
  grid: btnGrid,
};

function updateActiveButton(buttonMap, activeKey) {
  Object.entries(buttonMap).forEach(([key, btn]) => {
    btn.style.backgroundColor = key === activeKey ? "#bbb" : "#222";
    btn.style.color = key === activeKey ? "#000" : "#fff";
  });
}

function updateStyling(newStyle) {
  if (currentStyle === newStyle) return;
  updateActiveButton(styleButtons, newStyle);
  styling = currentStyle = newStyle;
  GenerateList();
}

function updateType(newType) {
  if (currentType === newType) return;
  updateActiveButton(typeButtons, newType);
  type = currentType = newType;
  GenerateList();
}
updateActiveButton(styleButtons, styling);
updateActiveButton(typeButtons, type);

async function aredlList() {
  try {
    const response = await fetch("https://api.aredl.net/v2/api/aredl/levels", {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching levels:", error);
    return [];
  }
} 

// Check AREDL for existing levels and display only what's been cleared in Northern Ireland
async function GenerateList() {
  list.innerHTML = "";

  try {
    const [aredlLevels, responseRecords] = await Promise.all([
      aredlList(),
      fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/1kgSNtY1q_RscXJGZe-XOM5NSUfpV1UkYnmLthz8fFlI/values/${encodeURIComponent(`Records!A1:E`)}?key=AIzaSyCBmzuL3Z3NORg7j5Jtfq791Y8Hf7Yq0DU`
      )
    ]);

    const jsonRecords = await responseRecords.json();

    const [headers, ...rows] = jsonRecords.values;

    recordsData = rows.map(row =>
      Object.fromEntries(
        row.map((v, i) => [headers[i], v])
      )
    );

    console.log(recordsData);
    
    // calculate points for each player after list is fetched
    // very likely would require moving this operation to after list fetching
    const players = [...new Set(recordsData.map(p => p.Player))];

    nidlPlayers.innerHTML = "";

    for (const player of players) {
      nidlPlayers.innerHTML += `
        <p class="nidlPlayers" onclick="searchClick('${player}')">
          ${player}
        </p>
      `;
    }

    if (styling == "grid") {
      list.classList.add("gridstyle");
    } else {
      list.classList.remove("gridstyle");
    }

    await renderList(recordsData, aredlLevels);

  } catch (err) {
    console.error("Failed to generate list:", err);
  }
}

input.addEventListener("blur", () => {
  targetPlayer = input.value.trim();
  profiles = true;
  GenerateList();
});

function searchClick(query) {
  player = String(query);
  input.value = player;
  targetPlayer = player;
  profiles = true;
  GenerateList();
}

async function renderList(profilesData, aredlLevels) {
  position = 0;
  list.innerHTML = "";

  const completionsByLevel = {};

  for (const record of profilesData) {
    if (!completionsByLevel[record.Record]) {
      completionsByLevel[record.Record] = [];
    }

    completionsByLevel[record.Record].push(record);
  }

  function parseUKDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string" || dateStr.trim() === "") {
      return new Date(9999, 11, 31);
    }

    const [day, month, year] = dateStr.split("/").map(Number);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return new Date(9999, 11, 31);
    }

    return new Date(year, month - 1, day);
  }

  for (const levelName in completionsByLevel) {
    completionsByLevel[levelName].sort(
      (a, b) => parseUKDate(a.Date) - parseUKDate(b.Date)
    );
  }

  const completedLevels = new Set(
    profilesData.map(p => `${p.Record}`)
  );

  const cards = [];

  for (const level of aredlLevels) {
    const completions = completionsByLevel[level.name];

    if (!completions || completions.length === 0) continue;

    const sortedCompletions = [...completions].sort(
      (a, b) => parseUKDate(a.Date) - parseUKDate(b.Date)
    );

    const first = sortedCompletions[0];
    
    // i dont remember my own code ffs
    // i interact with this codebase once a month at best

    // add points
    cards.push({
      ...level,
      player: first.Player,
      date: first.Date,
      completion: first.Completion?.trim() ?? "",
      FollowingVictors: sortedCompletions.slice(1)
    });
  }

  const renderedCards = await Promise.all(
    cards.map((item, index) =>
      renderCard(item, index + 1)
    )
  );

  for (const entry of renderedCards) {
    if (entry) {
      list.appendChild(entry);
    }
  }

  // Spellcheck / level skip warning
  for (const levelName in completionsByLevel) {
    if (!aredlLevels.some(level => level.name === levelName)) {
      const closeMatch = aredlLevels.find(level => {
        const a = level.name.toLowerCase();
        const b = levelName.toLowerCase();

        return a.includes(b) || b.includes(a);
      });

      if (closeMatch) {
        console.warn(
          `Skipped "${levelName}" by ${completionsByLevel[levelName][0].Player}. Did you mean "${closeMatch.name}"?`
        );
      } else {
        console.warn(
          `Skipped "${levelName}" by ${completionsByLevel[levelName][0].Player}.`
        );
      }
    }
  }

  console.log("completed", completedLevels);
  console.log("completions: ", completionsByLevel);
}

    
async function AREDLLevelData(level_id) {
  try {
    const response = await fetch(`https://api.aredl.net/v2/api/aredl/levels/${level_id}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching level:", error);
    return []
  }
}

async function getYouTubeThumbnail(videoID) {
  const qualities = [
    "maxresdefault",
    "sddefault",
    "hqdefault",
    "mqdefault",
    "default"
  ];

  for (const quality of qualities) {
    const url = `https://img.youtube.com/vi/${videoID}/${quality}.jpg`;

    const img = new Image();

    const valid = await new Promise(resolve => {
      img.onload = () => resolve(img.naturalWidth > 200);
      img.onerror = () => resolve(false);
      img.src = url;
    });

    if (valid) return url;
  }
  return null;
}

async function renderCard(item, position) {
  if (profiles) {
    if (
      item.player !== targetPlayer &&
      !item.FollowingVictors.some(v => v.Player === targetPlayer)
    ) {
      return null;
    }
  }

  const entry = document.createElement("div");
  entry.classList.add("card");
  entry.classList.add(styling);
  entry.classList.add(type);

  const level = await AREDLLevelData(item.level_id);

  if (!item.completion || item.completion.trim() === "") {
    if (level.verifications?.length > 0) {
      item.completion = level.verifications[0].video_url;
    }
  }

  const match = item.completion?.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/
  );

  if (!match) return null;

  const completionID = match[1];

  if (styling == "modern") {
    entry.innerHTML += `<p class="levelPos">#${position}</p>`;
  }

  const thumbnail = await getYouTubeThumbnail(completionID);

  entry.innerHTML += `
    <a href="${item.completion}" target="_blank">
      <img src="${thumbnail}" width="100%" height="100%" style="object-fit: cover;">
    </a>
  `;

  if (!item.FollowingVictors) {
    item.FollowingVictors = "";
  }

  if (!item.date) {
    item.date = "";
  }

  const publisher = level.publisher?.global_name ?? "?????";;

  if (type == "classics" && styling == "modern") {
    entry.innerHTML += `
      <div class="cardContainer" style="background: linear-gradient(
      270deg,
      rgba(0, 0, 0, 0),
      rgba(5, 5, 5, 1)
      ), url('https://levelthumbs.prevter.me/thumbnail/${item.level_id}');
      background-size: cover; background-position: center center;">
        <div class="container">
          <div class="level">
            <div class="levelName">
             <p class="textLevel">${item.name}</p>
             <p class="textPosition">#${item.position}</p>
            </div>
            <p class="textPublisher">by ${publisher}</p>
          </div>
        </div>
        <div class="container victors">
          <p class="date">${item.date}</p>
          <p class="victor" onclick="searchClick('${item.player}')">${item.player}</p>
          <p class="followingVictors">${item.FollowingVictors.map(v => v.Player).join(", ")}</p>
        </div>
      </div>
      `;
  } else if (type == "platformers" && styling == "modern") {
    entry.innerHTML += `
      <div class="cardContainer" style="background: linear-gradient(
      270deg, rgba(0, 0, 0, 0), rgba(5, 5, 5, 1)
      ), url('https://img.youtube.com/vi/${completionID}/maxresdefault.jpg');
      background-size: cover;">
        <div class="container">
          <div class="level">
            <p class="textLevel">${item.Record}</p>
            <p class="textPublisher">by ${item.Publisher}</p>
          </div>
        </div>
        <div class="container victors">
          <p class="firstVictor">${item.FirstVictor}</p>
          <p class="followingVictors">${item.FollowingVictors}</p>
        </div>
      </div>
      `;
  }
  
  return entry;

}

GenerateList();
console.log(styling, type, "profile view:", profiles);
// profiles to be improved later
// maybe with discord int idfk turbo low priority