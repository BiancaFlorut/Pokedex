let nextUrl;
const URL_API = "https://pokeapi.co/api/v2/pokemon?limit=30&offset=0";
let pokemons = [];
let nextPokeJson;
let nextPokemons = [];
let results = [];
let searchCount = 0;
let menu = false;

// eslint-disable-next-line no-unused-vars
function init() {
  // eslint-disable-next-line no-undef
  includeHTML();
  loadPokemons(URL_API);
}

async function loadPokemons(url) {
  let [response, err] = await resolve(fetch(url));
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
  let imageURL = pokemonsJSON["sprites"]["other"]["official-artwork"]["front_default"];
  let height = (pokemonsJSON.height / 10).toFixed(2);
  let weight = (pokemonsJSON.weight / 10).toFixed(2);
  let abilities = [];
  pokemonsJSON.abilities.forEach((ability) => abilities.push(ability.ability.name));
  let id = pokemonsJSON.id;
  let typesJSON = pokemonsJSON["types"];
  let types = [];
  for (let i = 0; i < typesJSON.length; i++) {
    const element = typesJSON[i].type.name;
    types.push(element);
  }
  result = { image: imageURL, types: types, id: id, height: height, weight: weight, abilities: abilities };
  return result;
}

async function getMoreInfos(pokemon) {
  let response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.infos.id}`);
  let pokeJSON = await response.json();
  let species = pokeJSON.genera.find((genus) => genus.language.name === "de").genus;
  let name = pokeJSON.names.find((name) => name.language.name === "de").name;
  pokemon.infos.species = species;
  pokemon.name = name;
  return pokemon;
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
  let actualPokemon;
  pokemons.forEach((pokemon) => {
    if (pokemon.infos.id == id) actualPokemon = pokemon;
  });
  if (actualPokemon) {
    let formatId = actualPokemon.infos.id.toString().padStart(3, "0");
    document.getElementById("top_area").classList.add(actualPokemon.infos.types[0]);
    document.getElementById("type_area").innerHTML = getPokemonTypesHTML(actualPokemon.infos.types);
    document.getElementById("id_area").innerHTML = `#${formatId}`;
    document.getElementById("pokemonImage").src = `${actualPokemon.infos.image}`;
    loadAbout(actualPokemon);
    let [gender, eggGroups, eggCycle] = await getGenderEggGroupEggCycle(id);
    document.getElementById('gender').innerHTML = gender;
    document.getElementById('eggGroup').innerHTML = '';
    let spacing = ", ";
    for (let i = 0; i < eggGroups.length; i++) {
      const eggGroupURL = eggGroups[i];
      let group = await renderEggGroup(eggGroupURL);
      if (i + 1 == eggGroups.length) {
        spacing = "";
      }
      document.getElementById('eggGroup').innerHTML += group + spacing;
    }
    document.getElementById('eggCycle').innerHTML = eggCycle;
  }
}

async function renderEggGroup(eggGroupUrl){
  let response = await fetch(eggGroupUrl);
  let json = await response.json();
  let nameDe = json.names.find(name => name.language.name === 'de').name;
  return nameDe;
}

async function loadAbout(pokemon) {
  let poke = await getMoreInfos(pokemon);
  document.getElementById("pokeName").innerHTML = poke.name;
  document.getElementById("species").innerHTML = poke.infos.species;
  document.getElementById("height").innerHTML = `${pokemon.infos.height} m`;
  document.getElementById("weight").innerHTML = `${pokemon.infos.weight} kg`;
  document.getElementById("abilities").innerHTML = "";
  let spacing = ", ";
  for (let i = 0; i < pokemon.infos.abilities.length; i++) {
    let ability = pokemon.infos.abilities[i];
    let abilityDe = await getAbility(ability);
    if (i + 1 == pokemon.infos.abilities.length) {
      spacing = "";
    }
    document.getElementById("abilities").innerHTML += capitalizeFirstLetter(abilityDe) + spacing;
  }
}

async function getAbility(ability) {
  let response = await fetch("https://pokeapi.co/api/v2/ability/" + ability);
  let json = await response.json();
  let abilityDe = json.names.find((name) => name.language.name === "de").name;
  return abilityDe;
}

async function getGenderEggGroupEggCycle(id) {
  let response = await fetch("https://pokeapi.co/api/v2/pokemon-species/" + id);
  let json = await response.json();
  console.log(json);
  const genderRate = json.gender_rate;
  let genderRatio;
  switch (genderRate) {
    case -1:
      genderRatio = "Geschlechtslos";
      break;
    case 0:
      genderRatio = /*html*/`<img src="../assets/icons/male.png" alt="">100%`;
      break;
    case 8:
      genderRatio = /*html*/`<img src="../assets/icons/male.png" alt="">87.5% <img src="../assets/icons/female.png" alt=""> 12.5%`;
      break;
    default:
      genderRatio = `<img src="../assets/icons/male.png" alt="">${(genderRate / 8) * 100}% ,<img src="../assets/icons/female.png" alt="female"> ${100 - (genderRate / 8) * 100}% `;
      break;
  }
  let eggGroup = json.egg_groups.map(eggGroup => eggGroup.url);
  let eggCycle = Math.ceil((json.hatch_counter + 1) / 5);
  return [genderRatio, eggGroup, eggCycle];
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
  console.log(searchValue);
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
    console.log("end search");
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
  if (window.innerWidth <= 670) {
    if (menu) {
      element.classList.add("d_none");
      menu = false;
    } else {
      element.classList.remove("d_none");
      menu = true;
    }
  }
}
