const classicsId = "1kgSNtY1q_RscXJGZe-XOM5NSUfpV1UkYnmLthz8fFlI";
const platformersId = "1kgSNtY1q_RscXJGZe-XOM5NSUfpV1UkYnmLthz8fFlI";
const classicsRange = "Classics!A1:F200";
const platformersRange = "Platformers!A1:E153";
const key = "AIzaSyCBmzuL3Z3NORg7j5Jtfq791Y8Hf7Yq0DU";
const classicUrl = `https://sheets.googleapis.com/v4/spreadsheets/${classicsId}/values/${encodeURIComponent(classicsRange)}?key=${key}`;
const platformerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${platformersId}/values/${encodeURIComponent(platformersRange)}?key=${key}`;

// I WANT TO ADD LIKE A TIME MACHINE AND uh SORTING BY THINGS later
// also want sliders/config for each entries background blur

//tweaky
const size = 20;
const thumbHeight = size * 9;
const thumbWidth = size * 16;
console.log(`${thumbWidth}x${thumbHeight}`);

//brick programming 101
let currentStyle;
let currentType;

//defaults
let styling = "modern";
let type = "classics";

const btnModern = document.getElementById("modern");
const btnGrid = document.getElementById("grid");

btnModern.addEventListener("click", () => updateStyling("modern"));
btnGrid.addEventListener("click", () => updateStyling("grid"));

const styleButtons = {
  modern: btnModern,
  grid: btnGrid,
};

const btnClassics = document.getElementById("classics");
const btnPlatformers = document.getElementById("platformers");

btnClassics.addEventListener("click", () => updateType("classics"));
btnPlatformers.addEventListener("click", () => updateType("platformers"));

const typeButtons = {
  classics: btnClassics,
  platformers: btnPlatformers,
};

list = document.getElementById("list");

function updateActiveButton(buttonMap, activeKey) {
  Object.entries(buttonMap).forEach(([key, btn]) => {
    btn.style.backgroundColor = key === activeKey ? "#fff" : "#000";
    btn.style.color = key === activeKey ? "#000" : "#222";
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

// defaults
updateActiveButton(styleButtons, styling);
updateActiveButton(typeButtons, type);

async function GenerateList() {
  list.innerHTML = "";

  try {
    if (type == "classics") {
      response = await fetch(classicUrl);
    } else {
      response = await fetch(platformerUrl);
    }
    const json = await response.json();

    const [headers, ...rows] = json.values;
    const data = rows.map((row) =>
      Object.fromEntries(row.map((v, i) => [headers[i], v])),
    );

    console.log(data);
    data.forEach(renderCard);

    if (styling == "grid") {
      list.classList.add("gridstyle");
    } else {
      if (list.classList.contains("gridstyle")) {
        list.classList.remove("gridstyle");
      }
    }
  } catch (err) {
    console.error("Failed to fetch data:", err);
  }
}

function renderCard(item) {
  entry = document.createElement("div");
  entry.classList.add("card");
  entry.classList.add(styling);
  entry.classList.add(type);

  if (item.Record) {
    if (styling == "modern") {
      entry.innerHTML += `<p class="levelPos">#${item.Pos}</p>`;
    }
    const completionID = item.CompletionLink.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
    )[1];

    console.log(item.Record, item.CompletionLink, completionID);
    entry.style.setProperty(
      "--bg-url",
      `url("https://img.youtube.com/vi/${completionID}/maxresdefault.jpg")`,
    );
    entry.innerHTML += `
      <a href="${item.CompletionLink}" target="_blank" width="${thumbWidth}" height="${thumbHeight}">
      <img src="https://img.youtube.com/vi/${completionID}/maxresdefault.jpg" width=${thumbWidth} height=${thumbHeight}>
      </a>
    `;

    if (type == "classics" && styling == "modern") {
      if (!item.FollowingVictors) {
        item.FollowingVictors = "";
      }
      entry.innerHTML += `
        <div class="cardContainer" style="background: linear-gradient(
        270deg,
        rgba(0, 0, 0, 0),
        rgba(5, 5, 5, 1)
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
    } else if (type == "platformers" && styling == "modern") {
      //platformers
      entry.innerHTML += `
        <div class="cardContainer" style="background: linear-gradient(
        270deg,
        rgba(0, 0, 0, 0),
        rgba(5, 5, 5, 1)
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
  }
  list.appendChild(entry);
}

GenerateList();
console.log(styling, type);
