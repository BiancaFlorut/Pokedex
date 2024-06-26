let searchCount = 0;
let menu = false;
let timer;
let step = 20;
let totalNumberOfPokemons;

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
    step = 20;
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
    document.body.ontouchmove = async function() {
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
    document.body.ontouchmove = '';
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
  totalNumberOfPokemons = pokeListJson.count;
  let progress = step * 100 / totalNumberOfPokemons;
  setLoading(progress);
  step = step + pokeListJson.results.length;
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
  let progress = step * 100 / totalNumberOfPokemons;
  setLoading(progress);
  let pokeListJson = await response.json();
  step = step + pokeListJson.results.length;
  results = results.concat(await checkMatch(pokeListJson, search));
  if (!pokeListJson.next || !searching) {
    console.log("end search for: " + search);
    return;
  }
  searchNext(pokeListJson.next, search);
}

function openMenu() {
  let element = document.getElementById("menuList");
  let button = document.getElementById("menuIcon");
  document.getElementById("headerLink").href = "";
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

function setLoading(value) {
  if (value > 100) value = 100;
  document.getElementById('loadingValue').style.width = value + '%';
  document.getElementById('loadingValueCard').style.width = value + '%';
}