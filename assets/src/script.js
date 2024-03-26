let nextUrl;
const URL_API = "https://pokeapi.co/api/v2/pokemon?limit=30&offset=0";
let pokemons = [];
let nextPokeJson;
let nextPokemons = [];
let results = [];
let searchCount = 0;
let menu = false;
let language = null;
let totalNumberOfPokemons;

// eslint-disable-next-line no-unused-vars
async function init() {
  // eslint-disable-next-line no-undef
  await includeHTML();
  setLanguage("de");
  openMenu();
  loadPokemons(URL_API);
}

// eslint-disable-next-line no-unused-vars
function setLanguage(lang) {
  if (language) document.getElementById(language).classList.remove("active_link");
  language = lang;
  document.getElementById(lang).classList.add("active_link");
  openMenu();
}

async function loadPokemons(url) {
  let [response, err] = await resolve(fetch(url));
  if (response) {
    let [pokemonsJSON, err] = await resolve(response.json());
    if (pokemonsJSON) {
      nextUrl = pokemonsJSON.next;
      totalNumberOfPokemons = pokemonsJSON.count;
      let [array, err] = await resolve(cachePokemons(pokemonsJSON));
      renderPokemons(array, err);
    }
    if (err) {
      console.error("Fehler in der ersten json lessen:", err);
    }
  }
  if (err) {
    console.error("Fehler:", err);
  }
}

async function renderPokemons(array, err) {
  if (array) {
    pokemons = pokemons.concat(array);
    pokemons.forEach((pokemon) => renderPokemonCard(pokemon));
    await loadNextPokemons(nextUrl);
    window.onscroll = function () {
      renderNextPokemons();
    };
  }
  if (err) {
    console.error("Error in the caching the first pokemons", err);
  }
}

async function renderNextPokemons() {
  if (isScrolledToBottom()) {
    nextPokemons.forEach((pokemon) => renderPokemonCard(pokemon));
    pokemons = pokemons.concat(nextPokemons);
    await loadNextPokemons(nextUrl);
  }
}

function isScrolledToBottom() {
  return window.scrollY + window.innerHeight >= document.body.offsetHeight;
}

async function loadNextPokemons(url) {
  let response = await fetch(url);
  nextPokeJson = await response.json();
  nextUrl = nextPokeJson.next;
  nextPokemons = await cachePokemons(nextPokeJson);
}

async function resolve(p) {
  try {
    let response = await p;
    return [response, null];
  } catch (e) {
    return [null, e];
  }
}

async function cachePokemons(pokemonsJSON) {
  let array = [];
  for (let i = 0; i < pokemonsJSON.results.length; i++) {
    const pokemonsJson = pokemonsJSON.results[i];
    let [infos, err] = await resolve(getPokeInfos(pokemonsJson.url));
    if (infos) {
      let name = capitalizeFirstLetter(pokemonsJson.name);
      let pokemon = { name: name, infos: infos };
      array.push(pokemon);
    }
    if (err) {
      console.error("Error in get infos for the pokemon with the index:", i, err);
    }
  }
  return array;
}

async function getPokeInfos(url) {
  let result;
  let response = await fetch(url);
  let pokemonsJSON = await response.json();
  let abilities = [];
  pokemonsJSON.abilities.forEach((ability) => abilities.push({ ability: ability.ability.name, url: ability.ability.url }));
  let typesJSON = pokemonsJSON["types"];
  let types = [];
  for (let i = 0; i < typesJSON.length; i++) {
    const element = typesJSON[i].type.name;
    types.push(element);
  }
  let hp = pokemonsJSON.stats.find((stat) => stat.stat.name === "hp");
  let attack = pokemonsJSON.stats.find((stat) => stat.stat.name === "attack");
  let defense = pokemonsJSON.stats.find((stat) => stat.stat.name === "defense");
  let sp_attack = pokemonsJSON.stats.find((stat) => stat.stat.name === "special-attack");
  let sp_defense = pokemonsJSON.stats.find((stat) => stat.stat.name === "special-defense");
  let speed = pokemonsJSON.stats.find((stat) => stat.stat.name === "speed");

  result = {
    image: pokemonsJSON["sprites"]["other"]["official-artwork"]["front_default"],
    types: types,
    id: pokemonsJSON.id,
    height: (pokemonsJSON.height / 10).toFixed(2),
    weight: (pokemonsJSON.weight / 10).toFixed(2),
    abilities: abilities,
    name: pokemonsJSON.name,
    speciesURL: pokemonsJSON.species.url,
    stats: { hp: hp.base_stat, attack: attack.base_stat, defense: defense.base_stat, sp_attack: sp_attack.base_stat, sp_defense: sp_defense.base_stat, speed: speed.base_stat },
  };
  return result;
}

async function getSpeciesNameBreeding(pokemon) {
  let response = null;
  try {
    response = await fetch(pokemon.infos.speciesURL);
    if (response.ok) {
      let pokeJSON = await response.json();
      let species = pokeJSON.genera.find((genus) => genus.language.name === language).genus;
      let name = pokeJSON.names.find((name) => name.language.name === language).name;
      pokemon.infos.species = species;
      pokemon.name = name;
      let [genderRatio, eggGroup, eggCycle] = getGenderEggGroupEggCycle(pokeJSON);
      setEggGroups(genderRatio, eggGroup, eggCycle);
    } else {
      console.log("cannot find species for the pokemon with id:", pokemon.infos.id);
    }
  } catch {
    console.log("cannot fetch pokemon with id:", pokemon.infos.id);
  }
  return pokemon;
}

function getGenderEggGroupEggCycle(json) {
  const genderRate = json.gender_rate;
  let genderRatio;
  switch (genderRate) {
    case -1:
      genderRatio = "Geschlechtslos";
      break;
    case 0:
      genderRatio = /*html*/ `<img src="../assets/icons/male.png" alt="">100%`;
      break;
    case 8:
      genderRatio = /*html*/ `<img src="../assets/icons/male.png" alt="">87.5% <img src="../assets/icons/female.png" alt=""> 12.5%`;
      break;
    default:
      genderRatio = `<img src="../assets/icons/male.png" alt="">${(genderRate / 8) * 100}% ,<img src="../assets/icons/female.png" alt="female"> ${100 - (genderRate / 8) * 100}% `;
      break;
  }
  let eggGroup = json.egg_groups.map((eggGroup) => eggGroup.url);
  let eggCycle = Math.ceil((json.hatch_counter + 1) / 5);
  return [genderRatio, eggGroup, eggCycle];
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function renderPokemonCard(pokemon) {
  let imageUrl = pokemon.infos["image"];
  let id = pokemon.infos.id.toString().padStart(3, "0");
  document.getElementById("pokemonCards").innerHTML +=
    /*html*/ `
        <div id='${pokemon.name}' class='pokemonCard df_column ${pokemon.infos.types[0]}' onclick='openCard(${pokemon.infos.id})'>
            <div class='id'>#${id}</div>
            <div class='df_row'>
                <div class='df_column gap_8'>
                    <h2>${pokemon.name}</h2>` +
    getPokemonTypesHTML(pokemon.infos.types) +
    /*html*/ `
                </div>
                <div class='image'>
                    <img src=${imageUrl} alt="${pokemon.name}">
                </div>
            </div>
        </div>
    `;
}

// eslint-disable-next-line no-unused-vars
async function openCard(id) {
  document.getElementById("dialog_bg").classList.remove("d_none");
  document.getElementById("dialog_bg").style.top = `${window.scrollY}px`;
  document.body.style.overflow = "hidden";
  document.getElementById("top_area").setAttribute("class", "background_image");
  loadPokemonCard(id);
}

async function loadPokemonCard(id) {
  let actualPokemon;
  pokemons.forEach((pokemon) => {
    if (pokemon.infos.id == id) actualPokemon = pokemon;
  });
  if (!actualPokemon) {
    actualPokemon = await getPokemonFromApi(id);
  }
  if (!actualPokemon) {
    console.log("The Pokemon with id:" + id + " does not exist!");
    return;
  }
  checkAvailability(id);
  loadTopCardInfo(actualPokemon);
  loadAbout(actualPokemon);
  let data = loadChartData(actualPokemon);
  // eslint-disable-next-line no-undef
  destroyChart();
  // eslint-disable-next-line no-undef
  showChart(data);
}

function loadChartData(pokemon) {
  const stats = pokemon.infos.stats;
  return {
    labels: ["HP", "Attack", "Defense", "Sp. Attack", "Sp. Defense", "Speed"],
    datasets: [
      {
        data: [stats.hp, stats.attack, stats.defense, stats.sp_attack, stats.sp_defense, stats.speed],
        backgroundColor: ["rgba(205, 65, 65, 1)", "rgba(65, 205, 65, 1)", "rgba(205, 65, 65, 1)", "rgba(65, 205, 65, 1)", "rgba(65, 205, 65, 1)", "rgba(205, 65, 65, 1)", "rgba(65, 205, 65, 1)"],
        borderWidth: 0,
        barPercentage: 0.2,
      },
    ],
  };
}

function loadTopCardInfo(pokemon) {
  let formatId = pokemon.infos.id.toString().padStart(5, "0");
  document.getElementById("top_area").classList.add(pokemon.infos.types[0]);
  document.getElementById("type_area").innerHTML = getPokemonTypesHTML(pokemon.infos.types);
  document.getElementById("id_area").innerHTML = `#${formatId}`;
  document.getElementById("pokemonImage").src = `${pokemon.infos.image}`;
}

function checkAvailability(id) {
  if (id - 1 == 0) {
    document.getElementById("backImg").classList.add("d_none");
  } else {
    document.getElementById("backImg").classList.remove("d_none");
  }
  if (id + 1 >= totalNumberOfPokemons) {
    document.getElementById("nextImg").classList.add("d_none");
  } else {
    document.getElementById("nextImg").classList.remove("d_none");
  }
  document.getElementById("backImg").setAttribute("onclick", `openCard(${id - 1})`);
  document.getElementById("nextImg").setAttribute("onclick", `openCard(${id + 1})`);
}

async function getPokemonFromApi(id) {
  let pokemon = { infos: { id: id } };
  pokemon.infos.url = "https://pokeapi.co/api/v2/pokemon/" + id;
  pokemon.infos = await getPokeInfos(pokemon.infos.url);
  pokemon.name = capitalizeFirstLetter(pokemon.infos.name);
  return pokemon;
}

async function setEggGroups(gender, eggGroups, eggCycle) {
  document.getElementById("gender").innerHTML = gender;
  document.getElementById("eggGroup").innerHTML = "";
  let spacing = ", ";
  for (let i = 0; i < eggGroups.length; i++) {
    const eggGroupURL = eggGroups[i];
    let group = await renderEggGroup(eggGroupURL);
    if (i + 1 == eggGroups.length) {
      spacing = "";
    }
    document.getElementById("eggGroup").innerHTML += group + spacing;
  }
  document.getElementById("eggCycle").innerHTML = eggCycle;
}

async function renderEggGroup(eggGroupUrl) {
  let response = await fetch(eggGroupUrl);
  let json = await response.json();
  let nameDe = json.names.find((name) => name.language.name === language).name;
  return nameDe;
}

async function loadAbout(pokemon) {
  let poke = await getSpeciesNameBreeding(pokemon);
  document.getElementById("pokeName").innerHTML = poke.name;
  document.getElementById("species").innerHTML = poke.infos.species;
  document.getElementById("height").innerHTML = `${pokemon.infos.height} m`;
  document.getElementById("weight").innerHTML = `${pokemon.infos.weight} kg`;
  document.getElementById("abilities").innerHTML = "";
  let spacing = ", ";
  for (let i = 0; i < pokemon.infos.abilities.length; i++) {
    let ability = pokemon.infos.abilities[i];
    let abilityLanguage = await getAbility(ability);
    if (i + 1 == pokemon.infos.abilities.length) {
      spacing = "";
    }
    document.getElementById("abilities").innerHTML += capitalizeFirstLetter(abilityLanguage) + spacing;
  }
}

async function getAbility(ability) {
  let response = await fetch(ability.url);
  let json = await response.json();
  let abilityLanguage = json.names.find((name) => name.language.name === language).name;
  return abilityLanguage;
}

// eslint-disable-next-line no-unused-vars
function closeDialog() {
  document.getElementById("dialog_bg").classList.add("d_none");
  document.body.style.overflow = "";
  document.getElementById("top_area").classList = "background_image";
}

function getPokemonTypesHTML(types) {
  let typesHTML = "";
  for (let i = 0; i < types.length; i++) {
    const element = types[i];
    typesHTML += /*html*/ `
          <div class='type_label'>${capitalizeFirstLetter(element)}</div>
      `;
  }
  return typesHTML;
}

// eslint-disable-next-line no-unused-vars
async function search(url, id) {
  searchCount = 0;
  let searchValue = document.getElementById(`${id}`).value.trim().toLowerCase();
  if (searchValue.length >= 3) {
    results = [];
    document.getElementById("pokemonCards").innerHTML = "";
    window.onscroll = "";
    let response = await fetch(url);
    let pokeListJson = await response.json();
    await checkMatch(pokeListJson, searchValue);
    await searchNext(pokeListJson.next, searchValue);
  }
  if (searchValue.length == 0) {
    document.getElementById("pokemonCards").innerHTML = "";
    pokemons.forEach((pokemon) => renderPokemonCard(pokemon));
    window.onscroll = function () {
      renderNextPokemons();
    };
  }
}

async function checkMatch(json, search) {
  results = [];
  json.results.forEach((element) => {
    let name = element.name.toLowerCase();
    if (name.includes(search)) {
      results.push(element);
      searchCount++;
    }
  });
  if (searchCount > 0) {
    let array = await cachePokemons({ results: results });
    array.forEach((pokemon) => renderPokemonCard(pokemon));
  }
  return results;
}

async function searchNext(url, search) {
  if (!url) {
    console.log("end next search");
    return;
  }
  let response = await fetch(url);
  let pokeListJson = await response.json();
  results = results.concat(checkMatch(pokeListJson, search));
  if (!pokeListJson.next) {
    console.log("end search");
    return;
  }
  searchNext(pokeListJson.next, search);
}

// eslint-disable-next-line no-unused-vars
function openMenu() {
  let element = document.getElementById("menuList");
    if (menu) {
      element.classList.add("d_none");
      menu = false;
    } else {
      element.classList.remove("d_none");
      menu = true;
    }
}
