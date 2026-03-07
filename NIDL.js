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

async function GenerateList() { //get list from AREDL API, display only what's been cleared in Northern Ireland
  const aredlLevels = await aredlList();
  list.innerHTML = "";
  
  try {
    const responseRecords = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/1kgSNtY1q_RscXJGZe-XOM5NSUfpV1UkYnmLthz8fFlI/values/${encodeURIComponent(`Records!A1:E`)}?key=AIzaSyCBmzuL3Z3NORg7j5Jtfq791Y8Hf7Yq0DU`,
    );
    const jsonRecords = await responseRecords.json();

    const [headers, ...rows] = jsonRecords.values;
    recordsData = rows.map((row) =>
      Object.fromEntries(row.map((v, i) => [headers[i], v])),
    );

    console.log(recordsData);
    nidlPlayers.innerHTML = [...new Set(recordsData.map(p => p.Player))].join("<br>") // replace this with a for loop for better styling in the future

    if (styling == "grid") {
      list.classList.add("gridstyle");
    } else {
      if (list.classList.contains("gridstyle")) {
        list.classList.remove("gridstyle");
      }
    }
    
    await renderList(recordsData, aredlLevels);

  } catch (err) {
    console.error("Failed to fetch data:", err);
  }
}

input.addEventListener("blur", () => {
  targetPlayer = input.value.trim();
  profiles = true;
  GenerateList();
});

async function renderList(profilesData, aredlLevels) {
  position = 0;
  list.innerHTML = "";

  const completionsByLevel = {};
  const profileByRecord = {};

  for (const record of profilesData) {
   if (!completionsByLevel[record.Record]) {
     completionsByLevel[record.Record] = [];
   }
   completionsByLevel[record.Record].push(record);
  }
   
  for (const levelName in completionsByLevel) {
    completionsByLevel[levelName].sort((a, b) =>
      new Date(a.Date) - new Date(b.Date)
    );
  }
  const completedLevels = new Set(
    profilesData.map(p => `${p.Record}`)
  );

  for (const level of aredlLevels) {
    
    const completions = completionsByLevel[level.name];
    if (!completions) continue;

    const first = completions[0];
    
    level.player = first.Player;
    level.date = first.Date;

    level.completion = first.Completion && first.Completion.trim() !== ""
      ? first.Completion
      : "";

    level.FollowingVictors = completions.slice(1);
    
    await renderCard(level);
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

async function renderCard(item) {
  if (profiles) {
    if (item.player !== targetPlayer && !item.FollowingVictors.some(v => v.Player === targetPlayer)) {
      return;
    }
  }

  entry = document.createElement("div");
  entry.classList.add("card");
  entry.classList.add(styling);
  entry.classList.add(type);

  const level = await AREDLLevelData(item.level_id);
  position += 1 
  
  if (!item.completion || item.completion.trim() === "") {
    if (level.verifications?.length > 0) {
      item.completion = level.verifications[0].video_url;
    }
  };

  const match = item.completion?.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/
  );

  if (!match) return;
  const completionID = match[1];;

  if (styling == "modern") {
    entry.innerHTML += `<p class="levelPos">#${position}</p>`;
  }

  entry.style.setProperty(
    "--bg-url",
    `url("https://img.youtube.com/vi/${completionID}/maxresdefault.jpg")`,
  );

  entry.innerHTML += `
    <a href="${item.completion}" target="_blank" width="320" height="180">
    <img src="https://img.youtube.com/vi/${completionID}/maxresdefault.jpg" width="320" height="180">
    </a>
  `;

  if (!item.FollowingVictors) {
    item.FollowingVictors = "";
  }
  
  if (!item.date) {
    item.date = "";
  }

  if (type == "classics" && styling == "modern") {
    entry.innerHTML += `
      <div class="cardContainer" style="background: linear-gradient(
      270deg,
      rgba(0, 0, 0, 0),
      rgba(5, 5, 5, 1)
      ), url('https://img.youtube.com/vi/${completionID}/maxresdefault.jpg');
      background-size: cover;">
        <div class="container">
          <div class="level">
            <p class="textLevel">${item.name}</p>
            <p class="textPublisher">by ${level.publisher.global_name}</p>
          </div>
        </div>
        <div class="container victors">
          <p class="date">${item.date}</p>
          <p class="victor">${item.player}</p>
          <p class="followingVictors">${item.FollowingVictors.map(v => v.Player).join(", ")}</p>
        </div>
      </div>
      `;
  } else if (type == "platformers" && styling == "modern") {
    //platformers
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
  list.appendChild(entry);
}

GenerateList();
console.log(styling, type, "profile view:", profiles);
