let timer;
// eslint-disable-next-line no-unused-vars
 function validate(id) {
  clearTimeout(timer);
   timer= setTimeout(search,1000, id);
   console.log('waiting ', timer);
}

let currentSearchedPokemonIndex;
let controller;
let signal;

function setNewController() {
  controller = new AbortController();
  signal = controller.signal;
}

function search(id) {
  document.getElementById("pokemonCards").innerHTML = "";
  searchCount = 0;
  currentSearchedPokemonIndex = 0;
  let searchValue = document.getElementById(`${id}`).value.trim().toLowerCase();
  if (searchValue.length >= 3) {
    console.log('start searching for ', searchValue);
    searching = true;
    abortSearch();
    setNewController();
    searchPokemons(searchValue);
  }
  if (searchValue.length == 0) {
    searching = false;
    pokemons.forEach((pokemon, index) => renderPokemonCard(pokemon, index));
    window.onscroll = async function () {
      if (isScrolledToBottom()) {
        await renderNextPokemons();
      }
    };
  }
}

function abortSearch() {
  if (controller) {
    controller.abort();
    window.onscroll = "";
    console.log('searching is aborted. ');
  }
}

async function searchPokemons(searchValue) {
  results = [];
  let url = "https://pokeapi.co/api/v2/pokemon/";
  document.getElementById("pokemonCards").innerHTML = "";
  window.onscroll = "";
  let response = await fetch(url, {signal});
  let pokeListJson = await response.json();
  results = results.concat(await checkMatch(pokeListJson, searchValue));
  await searchNext(pokeListJson.next, searchValue);
}

async function checkMatch(json, search) {
  let resultsMatch = [];
  json.results.forEach((element) => {
    let name = element.name.toLowerCase();
    if (name.includes(search)) {
      resultsMatch.push(element);
      searchCount++;
    }
  });
  if (searchCount > 0) {
    let array = await cachePokemons({ results: resultsMatch });
    array.forEach((pokemon) => {
      renderPokemonCard(pokemon, currentSearchedPokemonIndex);
      currentSearchedPokemonIndex++;
    });
  }
  return resultsMatch;
}

async function searchNext(url, search) {
  let response = await fetch(url, {signal});
  let pokeListJson = await response.json();
  results = results.concat(await checkMatch(pokeListJson, search));
  if (!pokeListJson.next || !searching) {
    console.log("end search for: " + search);
    return;
  }
  searchNext(pokeListJson.next, search);
}

// eslint-disable-next-line no-unused-vars
function openMenu() {
  let element = document.getElementById("menuList");
  let button = document.getElementById("menuIcon");
  if (menu) {
    element.classList.add("d_none");
    button.style.backgroundColor = "#f6f6f6";
    menu = false;
  } else {
    element.classList.remove("d_none");
    button.style.backgroundColor = "#c2c2c2";
    menu = true;
  }
}
