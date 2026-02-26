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
  profiles = profiles === false ? true : false;
  console.log(profiles);

  profiles === true
    ? (btnProfiles.textContent = "To list")
    : (btnProfiles.textContent = "To player");
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
    console.log(data);
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
    
    if (profiles) {
      await renderProfile(recordsData, aredlLevels);
    } else {
      await renderList(recordsData, aredlLevels);
    }

  } catch (err) {
    console.error("Failed to fetch data:", err);
  }
}

input.addEventListener("blur", () => {
  targetPlayer = input.value.trim();
  renderProfile(recordsData, data);
});

async function renderList(profilesData, aredlLevels) {
  position = 0;
  list.innerHTML = "";

  const completedLevels = new Set(
    profilesData.map(p => `${p.Record}`)
  );

  const aredlFiltered = aredlLevels.filter(level => completedLevels.has(`${level.name}`))
  console.log("aredl", aredlFiltered);
  
  console.log("completed", completedLevels);
  
  const profileByRecord = {};
  for (const p of profilesData) {
    profileByRecord[p.Record] = p;
  }

  for (const level of aredlLevels) {
    const profile = profileByRecord[level.name];
    if (!profile) continue;
      level.player = profile.Player;
      level.completion = profile.Completion;
      level.date = profile.Date;
    
      const others = profilesData.filter(p =>
        p.Record === level.name &&
        p.Player !== profile.Player
      );
    
      level.FollowingVictors = others;
    }
  aredlFiltered.sort((a, b) => new Date(b.date) - new Date(a.date)); 
  for (const level of aredlFiltered) {
    await renderCard(level);
  }
}
    
async function renderProfile(profilesData, data) {
  list.innerHTML = "";
  const playerProfiles = profilesData.filter((p) => p.Player === targetPlayer);

  const profileKeySet = new Set(
    playerProfiles.map((p) => `${p.Record}::${p.Publisher}`),
  );

  const filteredData = data.filter((row) =>
    profileKeySet.has(`${row.Record}::${row.Publisher}`),
  );

  filteredData.forEach(await renderCard);
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
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching level:", error);
    return []
  }
}

async function renderCard(item) {
  entry = document.createElement("div");
  entry.classList.add("card");
  entry.classList.add(styling);
  entry.classList.add(type);

  const level = await AREDLLevelData(item.level_id);
  position += 1 

  if ((!item.completion) && level.verifications?.length > 0) {
   item.completion = level.verifications[0].video_url;
  }
  
  const completionID = item.completion.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
  )[1];

  if (styling == "modern") {
    entry.innerHTML += `<p class="levelPos">#${position}</p>`;
  }

  console.log(item);
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
