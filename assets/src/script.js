let nextUrl;
const URL_API = "https://pokeapi.co/api/v2/pokemon?limit=30&offset=0";
let pokemons = [];
let nextPokeJson;
let nextPokemons = [];
let results = [];
let language = null;
let searching = false;
let loading = 0;

async function init() {
  await includeHTML();
  setLanguage("de");
  openMenu();
  loadPokemons(URL_API);
}

function setLanguage(lang) {
  abortSearch();
  if (language) document.getElementById(language).classList.remove("active_link");
  language = lang;
  document.getElementById(lang).classList.add("active_link");
  openMenu();
  loadPokemons(URL_API);
}

async function loadPokemons(url) {
  controller = setNewController();
  let [response, err] = await resolve(fetch(url), { signal });
  if (response) {
    let [pokemonsJSON, err] = await resolve(response.json());
    if (pokemonsJSON) {
      nextUrl = pokemonsJSON.next;
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
    pokemons.forEach((pokemon, index) => renderPokemonCard(pokemon, index));
    await loadNextPokemons(nextUrl);
    window.onscroll = async function () {
      if (isScrolledToBottom()) {
        await renderNextPokemons();
      }
    };
  }
  if (err) {
    console.error("Error in the caching the first pokemons", err);
  }
}

async function renderNextPokemons() {
  window.onscroll = "";
  nextPokemons.forEach((pokemon, index) => renderPokemonCard(pokemon, pokemons.length + index));
  pokemons = pokemons.concat(nextPokemons);
  await loadNextPokemons(nextUrl);
  window.onscroll = async function () {
    if (isScrolledToBottom()) {
      await renderNextPokemons();
    }
  };
}

function isScrolledToBottom() {
  return window.scrollY + document.body.offsetHeight >= document.body.scrollHeight;
}

async function loadNextPokemons(url) {
  let response = await fetch(url);
  nextPokeJson = await response.json();
  nextUrl = nextPokeJson.next;
  setLoading(0);
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
    let step = ((i + 1) * 100) / pokemonsJSON.results.length;
    setLoading(step);
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

  let types = [];
  pokemonsJSON.types.forEach((type) => types.push( {name: type.type.name, nameLang: null, url: type.type.url}));

  const hpJson = pokemonsJSON.stats.find((stat) => stat.stat.name === "hp");
  const hp = { name: "HP", value: hpJson.base_stat, url: hpJson.stat.url };

  const attackJson = pokemonsJSON.stats.find((stat) => stat.stat.name === "attack");
  const attack = { name: "Attack", value: attackJson.base_stat, url: attackJson.stat.url };

  const defenseJson = pokemonsJSON.stats.find((stat) => stat.stat.name === "defense");
  const defense = { name: "Defense", value: defenseJson.base_stat, url: defenseJson.stat.url };

  const sp_attackJson = pokemonsJSON.stats.find((stat) => stat.stat.name === "special-attack");
  const sp_attack = { name: "Sp. Attack", value: sp_attackJson.base_stat, url: sp_attackJson.stat.url };

  const sp_defenseJson = pokemonsJSON.stats.find((stat) => stat.stat.name === "special-defense");
  const sp_defense = {name: 'Sp. Defense', value: sp_defenseJson.base_stat, url: sp_defenseJson.stat.url};

  const speedJson = pokemonsJSON.stats.find((stat) => stat.stat.name === "speed");
  const speed = {name: 'Speed', value: speedJson.base_stat, url: speedJson.stat.url};

  result = {
    image: pokemonsJSON["sprites"]["other"]["official-artwork"]["front_default"],
    types: types,
    id: pokemonsJSON.id,
    height: (pokemonsJSON.height / 10).toFixed(2),
    weight: (pokemonsJSON.weight / 10).toFixed(2),
    abilities: abilities,
    name: pokemonsJSON.name,
    speciesURL: pokemonsJSON.species.url,
    stats: { hp: hp, attack: attack, defense: defense, sp_attack: sp_attack, sp_defense: sp_defense, speed: speed },
  };
  return result;
}

async function loadBaseStats(pokemon) {
  const stats = pokemon.infos.stats;
  stats.hp.name = await getLangStat(stats.hp.url);
  stats.attack.name = await getLangStat(stats.attack.url);
  stats.defense.name = await getLangStat(stats.defense.url);
  stats.sp_attack.name = await getLangStat(stats.sp_attack.url);
  stats.sp_defense.name = await getLangStat(stats.sp_defense.url);
  stats.speed.name = await getLangStat(stats.speed.url);
  for (let i = 0; i < pokemon.infos.types.length; i++) {
    pokemon.infos.types[i].nameLang = await getLangStat(pokemon.infos.types[i].url);
  }
  pokemon.infos.stats = stats;
  return pokemon;
}

async function getLangStat(url) {
  let response = await fetch(url);
  let json = await response.json();
  const name = json.names.find((name) => name.language.name === language).name;
  return name;
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

function renderPokemonCard(pokemon, index) {
  let imageUrl = pokemon.infos["image"];
  let id = pokemon.infos.id.toString().padStart(3, "0");
  document.getElementById("pokemonCards").innerHTML +=
    /*html*/ `
        <div id='${pokemon.name}' class='pokemonCard df_column ${pokemon.infos.types[0].name}' onclick='openCard(${index})'>
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

async function openCard(id) {
  if (id != -1) {
    document.getElementById("dialog_bg").classList.remove("d_none");
    document.getElementById("dialog_bg").style.top = `${window.scrollY}px`;
    document.body.style.overflow = "hidden";
    document.getElementById("top_area").setAttribute("class", "background_image");
    loadPokemonCard(id);
  }
}

async function loadPokemonCard(id) {
  let actualPokemon;
  if (searching) {
    let pokemon = { infos: { url: results[id].url } };
    pokemon.infos = await getPokeInfos(pokemon.infos.url);
    pokemon.name = capitalizeFirstLetter(pokemon.infos.name);
    actualPokemon = pokemon;
  } else {
    actualPokemon = pokemons[id];
  }
  if (!actualPokemon) {
    console.log("The Pokemon with id:" + id + " does not exist!");
    return;
  }
  checkAvailability(id);
  actualPokemon = await loadBaseStats(actualPokemon);
  loadTopCardInfo(actualPokemon);
  loadAbout(actualPokemon);
  
  let data = loadChartData(actualPokemon);
  destroyChart();
  showChart(data);
}

function loadChartData(pokemon) {
  const stats = pokemon.infos.stats;
  return {
    labels: [stats.hp.name, stats.attack.name, stats.defense.name, stats.sp_attack.name, stats.sp_defense.name, stats.speed.name],
    datasets: [
      {
        data: [stats.hp.value, stats.attack.value, stats.defense.value, stats.sp_attack.value, stats.sp_defense.value, stats.speed.value],
        backgroundColor: ["rgba(205, 65, 65, 1)", "rgba(65, 205, 65, 1)", "rgba(205, 65, 65, 1)", "rgba(65, 205, 65, 1)", "rgba(65, 205, 65, 1)", "rgba(205, 65, 65, 1)", "rgba(65, 205, 65, 1)"],
        borderWidth: 0,
        barPercentage: 0.2,
        categoryPercentage: 0.9,
        borderRadius: 5,
      },
    ],
  };
}

function loadTopCardInfo(pokemon) {
  let formatId = pokemon.infos.id.toString().padStart(5, "0");
  document.getElementById("top_area").classList.add(pokemon.infos.types[0].name);
  let typesWithLang = [];
  pokemon.infos.types.forEach((type) => typesWithLang.push({name: type.nameLang}));
  document.getElementById("type_area").innerHTML = getPokemonTypesHTML(typesWithLang);
  document.getElementById("id_area").innerHTML = `#${formatId}`;
  document.getElementById("pokemonImage").src = `${pokemon.infos.image}`;
}

async function checkAvailability(id) {
  const nextId = await getNextId(id);
  if (nextId) {
    if (nextId == -1) {
      document.getElementById("nextImg").classList.add("d_none");
    } else {
      document.getElementById("nextImg").classList.remove("d_none");
    }
    document.getElementById("nextImg").setAttribute("onclick", `openCard(${nextId})`);
  }
  if (id - 1 == -1) {
    document.getElementById("backImg").classList.add("d_none");
  } else {
    document.getElementById("backImg").classList.remove("d_none");
  }
  document.getElementById("backImg").setAttribute("onclick", `openCard(${id - 1})`);
}

async function getNextId(id) {
  if (searching) {
    if (id + 1 < results.length) return id + 1;
  } else {
    if (id + 1 < pokemons.length) return id + 1;
    else {
      await renderNextPokemons();
      let nextId = await getNextId(id);
      return nextId;
    }
  }
  return -1;
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
          <div class='type_label'>${capitalizeFirstLetter(element.name)}</div>
      `;
  }
  return typesHTML;
}
