const menuItems = [
  { menuItem: "aboutMenuItem", menuContent: "about" },
  { menuItem: "baseStatsMenuItem", menuContent: "baseStats" },
  { menuItem: "evolutionMenuItem", menuContent: "evolution" },
  { menuItem: "movesMenuItem", menuContent: "moves" },
];
let chart;
const pokeCallStack = 25;

function stopPropagation(event) {
  event.stopPropagation();
}

function toggleMenu(index, event) {
  event.stopPropagation();
  resetMenu();
  document.getElementById(menuItems[index].menuItem).classList.add("active");
  document.getElementById(menuItems[index].menuContent).classList.remove("d_none");
}

function resetMenu() {
  document.getElementById("aboutMenuItem").classList.remove("active");
  document.getElementById("baseStatsMenuItem").classList.remove("active");
  document.getElementById("evolutionMenuItem").classList.remove("active");
  document.getElementById("movesMenuItem").classList.remove("active");

  document.getElementById("about").classList.add("d_none");
  document.getElementById("baseStats").classList.add("d_none");
  document.getElementById("evolution").classList.add("d_none");
  document.getElementById("moves").classList.add("d_none");
}

function showChart(data) {
  const ctx = document.getElementById("myChart");
  const progressBar = {
    id: "progressBar",
    beforeDatasetsDraw(chart, args, pluginOptions) {
      const {
        ctx,
        data,
        chartArea: { top, bottom, left, right, width, height },
        scales: { x, y },
      } = chart;

      ctx.save();
      const barHeight = height / data.labels.length;
      ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
      ctx.fillStyle = "rgba(200, 200, 200, 0.5)";

      chart.getDatasetMeta(0).data.forEach((dataPoint, index) => {
        dataPoint.y = top + barHeight * (index + 0.8);
        //label
        ctx.font = "16px sans-serif bold";
        ctx.fillStyle = "rgba(180, 180, 180, 1)";
        ctx.textBaseline = "middle";
        ctx.fillText(data.labels[index], left - 202, dataPoint.y);

        //label
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgba(80, 80, 80, 1)";
        ctx.textBaseline = "middle";
        ctx.fillText(data.datasets[0].data[index], left - 44, dataPoint.y);

        //shape
        ctx.beginPath();
        ctx.lineWidth = dataPoint.height;
        ctx.lineJoin = "round";
        ctx.strokeRect(left, dataPoint.y, width, 1);
      });
    },
  };

  chart = new Chart(ctx, {
    type: "bar",
    data,
    options: {
      layout: {
        padding: { left: 200 },
      },
      indexAxis: "y",
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: { display: false },
          max: 255,
        },
        y: {
          beginAtZero: true,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: { display: false },
        },
      },
    },
    plugins: [progressBar],
  });
}

function destroyChart() {
  if (chart) chart.destroy();
}

async function getEvolution(url) {
  if (url) {
    let result = await fetch(url);
    let json = await result.json();
    setLoading(loadingStepCard++ * 100 / pokeCallStack);
    const pokemon = await getPokeNames(json);
     document.getElementById("evolution").innerHTML = renderEvolutions(pokemon);
     setLoading(100);
  } else {
    document.getElementById("evolution").innerHTML = "There is no evolution for this Pokemon.";
  }
}

function renderEvolutions(pokemon) {
  
  let html = /*html*/ `
  <div class='df_row df_center gap_32'>
    <div class='small_evolution'>
      <img src="${pokemon.src}" alt="${pokemon.langName}">
      <div>${pokemon.langName}</div>
    </div>
  `;
  if (pokemon.evolutions) {
    const evolutions = pokemon.evolutions;
    html += /*html*/ `
    <img src="./assets/icons/right-arrow-black.png" alt="">
    <div class='df_column gap_32'>
  `;
    evolutions.forEach( (evolution) => {
    html +=  renderEvolutions(evolution);
  });
    html += /*html*/ `
    </div>
  `;
  }
  html += /*html*/ `
    </div>
  `;
  return html;
}

async function getImageAndName(url) {
  const result = await fetch(url);
  setLoading(loadingStepCard++ * 100 / pokeCallStack);
  const json = await result.json();
  const name = json.names.find((name) => name.language.name === language).name;
  const src = await getImage(json.varieties[0].pokemon.url);
  return [src, name];
}

async function getImage(url) {
  const result = await fetch(url);
  setLoading(loadingStepCard++ * 100 / pokeCallStack);
  const json = await result.json();
  return json.sprites.other['official-artwork'].front_default;
}

async function getPokeNames(json) {
  let pokemon = {};
  pokemon.name = json.chain.species.name;
  pokemon.url = json.chain.species.url;
  const [src, langName] = await getImageAndName(pokemon.url);
  pokemon.src = src;
  pokemon.langName = langName;
  pokemon.evolutions = [];
  if (json.chain.evolves_to.length > 0) {
    for (const element of json.chain.evolves_to) {
      const evolution = await searchEvolutionFrom(element);
      pokemon.evolutions.push(evolution);
    }
  }
  return pokemon;
}

async function searchEvolutionFrom(json) {
  const [src, langName] = await getImageAndName(json.species.url);
  const evolution = { name: json.species.name, url: json.species.url, src: src, langName: langName};
  if (json.evolves_to.length > 0) {
    evolution.evolutions = [];
    for (const element of json.evolves_to) {
      let newEvolution = await searchEvolutionFrom(element);
      evolution.evolutions.push(newEvolution);
    }
  }
  return evolution;
}
