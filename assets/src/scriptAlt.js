let pokemons = [];
let nextPokemons = [];
let nextUrl;
let nextJson;

// eslint-disable-next-line no-unused-vars
function init() {
  let url = "https://pokeapi.co/api/v2/pokemon?limit=20&offset=0";
  loadPokemons(url);
}

function doSomething() {
  if (isScrolledToBottom()) {
    renderNextPokemonCards(nextJson);
  }
}

function isScrolledToBottom() {
  return window.scrollY + window.innerHeight >= document.body.offsetHeight;
}

async function loadPokemons(url) {
  let [response, err] = await resolve(fetch(url));
  if (response) {
    let [pokemonsJSON, err] = await resolve(response.json());
    if (pokemonsJSON) {
      nextUrl = pokemonsJSON.next;
      await renderPokemonCards(pokemonsJSON);
      console.log("loading next pokes");
      await loadNextPokemons(nextUrl);
      window.onscroll = function () {
        doSomething();
      };
    } if (err) {
      console.error("Fehler in der ersten json lessen:", err);
    }
    
  }
  if (err) {
    console.error("Fehler:", err);
  }
}

async function resolve(p) {
  try {
    let response = await p;
    return [response, null];
  } catch (e) {
    return [null, e];
  }
}

async function loadNextPokemons(url) {
  let response = await fetch(url);
  nextJson = await response.json();
  nextUrl = nextJson.next;
  await cachePokemons(nextJson, nextPokemons);
}

async function renderPokemonCards(pokemonsJSON) {
  await cachePokemons(pokemonsJSON, pokemons);
  document.getElementById("pokemonCards").innerHTML = renderPokemons(pokemons);
}

async function renderNextPokemonCards(json) {
  document.getElementById("pokemonCards").innerHTML = +renderPokemons(nextPokemons);
  pokemons = pokemons.concat(nextPokemons);
  nextPokemons = [];
  await cachePokemons(json, nextPokemons);
}

async function cachePokemons(pokemonsJSON, array) {
  for (let i = 0; i < pokemonsJSON.results.length; i++) {
    const pokemon = pokemonsJSON.results[i];
    let infos = await getPokeInfos(pokemon.url);
    let name = capitalizeFirstLetter(pokemon.name);
    array.push({ name: name, infos: infos });
  }
}

function renderPokemons(array) {
  let html = "";
  for (let i = 0; i < array.length; i++) {
    const pokemon = array[i];
    let imageUrl = pokemon.infos["image"];
    let id = pokemon.infos.id.toString().padStart(3, "0");
    html +=
      /*html*/ `
            <div id='${pokemon.name}' class='pokemonCard df_column ${pokemon.infos.types[0]}'>
                <div class='id'>#${id}</div>
                <div class='df_row'>
                    <div class='df_column gap_8'>
                    <h2>${pokemon.name}</h2>
                    ` +
      getPokemonTypesHTML(pokemon.infos.types) +
      `
                    </div>
                    <div class='image'>
                        <img src=${imageUrl} alt="">
                    </div>
                </div>
            </div>
        `;
  }
  return html;
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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function getPokeInfos(url) {
  let result;
  let response = await fetch(url);
  let pokemonsJSON = await response.json();
  let imageURL = pokemonsJSON["sprites"]["other"]["official-artwork"]["front_default"];
  let id = pokemonsJSON.id;
  let typesJSON = pokemonsJSON["types"];
  let types = [];
  for (let i = 0; i < typesJSON.length; i++) {
    const element = typesJSON[i].type.name;
    types.push(element);
  }
  result = { image: imageURL, types: types, id: id };
  return result;
}
