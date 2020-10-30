import Search from './modules/Search';
import Recipe from './modules/Recipe';
import List from './modules/List';
import Likes from './modules/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {clearLoader, elements, renderLoader} from './views/base';
//Global state of the app
const state = {};

const controlSearch = async () => {
    //get query from the view
    const query = searchView.getInput();

    if (query) {
        // new search object and add to state
        state.search = new Search(query);
        // prepare ui for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {

            //search for recipes
            await state.search.getResults();

            //render results on ui
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (e) {
            alert('Something went wrong!');
            clearLoader();

        }
    }

}
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResAndPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});
const controlRrecipe = async () => {
    const id = window.location.hash.replace('#', '');

    if (id) {
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlit selected search item
        if (state.search) {
            searchView.highlightSelected(id);
        }
        //create new recipe object
        state.recipe = new Recipe(id);

        try {
            //get recipe data
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            //render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        } catch (e) {
            alert('Error processing recipe');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRrecipe));

const controlList = () => {
    //create new list if there is none yet
    if (!state.list) state.list = new List();
    //add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    })
}
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete from state
        state.list.deleteItem(id);

        //delete from ui
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
})

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    //not liked
    if (!state.likes.isLiked(currentID)) {
        //add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //toggle the like
        likesView.toggleLikeBtn(true);
        //add like to ui
        likesView.renderLike(newLike);
    } else {
        //add like to the state
        state.likes.deleteLike(currentID);
        //toggle the like
        likesView.toggleLikeBtn(false);
        //remove like from ui
        likesView.deleteLike(currentID);
    }
}

window.addEventListener('load', () => {

    state.likes = new Likes();
    state.likes.readStorage();
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    state.likes.likes.forEach(like => likesView.renderLike(like));
})


elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        if (state.recipe.servings > 1) {

            state.recipe.updateServing('dec');
            recipeView.updateServings(state.recipe);

        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        state.recipe.updateServing('inc');
        recipeView.updateServings(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList()
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
});
