const classicsId = "1kgSNtY1q_RscXJGZe-XOM5NSUfpV1UkYnmLthz8fFlI";
const platformersId = "1kgSNtY1q_RscXJGZe-XOM5NSUfpV1UkYnmLthz8fFlI";
const classicsRange = "Classics!A1:E200";
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

//one higher than the highest
const ENJvalues = Array.from({ length: 13 }, (_, i) => i - 1);
const AEMvalues = Array.from({ length: 37 }, (_, i) => i);
const GDDLvalues = Array.from({ length: 40 }, (_, i) => i);

function valueToColour(value, min, max) {
  const t = (value - min) / (max - min);
  const h = 240 - t * 240;
  return `hsl(${h}, 80%, 50%)`;
}

//hardcode nlw because its better than assigning 400 static variables
console.log(ENJvalues, AEMvalues, GDDLvalues);

function renderCard(item) {
  if (item.CompletionLink?.trim()) {
    entry = document.createElement("a");
    entry.href = item.CompletionLink;
  } else {
    entry = document.createElement("div");
  }
  entry.classList.add("card");
  entry.classList.add(type);
  if (item.Record) {
    if (item.CompletionLink?.trim()) {
      entry.classList.add("card");
      const completionID = item.CompletionLink.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
      )[1];

      console.log(item.CompletionLink, completionID);
      entry.style.setProperty(
        "--bg-url",
        `url("https://img.youtube.com/vi/${completionID}/maxresdefault.jpg")`,
      );
    }
    if (styling == "grid") {
      entry.innerHTML = `
      <a href="${item.CompletionLink}" target="_blank">
      <img src="https://img.youtube.com/vi/${completionID}/maxresdefault.jpg" width=${thumbWidth} height=${thumbHeight}>
      </a>
    `;
    } else {
      if (type == "classics") {
        entry.innerHTML += `
        <p>${item.Pos}:</p>
        <div class="container">
          <p class="textLevel">${item.Record}</p>
          <p class="textPublisher">by ${item.Publisher}</p>
        </div>
        <p class="firstVictor">${item.FirstVictor}</p>
        `;
      } else {
        entry.innerHTML += `
        <p>${item.Pos}</p>
        <p class="textLevel">${item.Record}</p>
        <p class="textPublisher">${item.Publisher}</p>
        <p class="firstVictor">${item.FirstVictor}</p>
        `;
      }
    }
    list.appendChild(entry);
  }
}
GenerateList();
console.log(styling, type);
