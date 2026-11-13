import { sleep, error } from './helpers.js';

/** Hámarksfjöldi hráefna í svari frá API. */
const MAX_INGREDIENTS = 20;

/** Sækir og sannreynir gögn frá TheMealDB. */
export class MealApi {
  /**
   * @param {string} baseUrl API base url.
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async search(query) {
    if (query.toLowerCase().includes('slow')) await sleep(2);
    if (query.toLowerCase().includes('error')) error('Villa við leit.');
    return this.#request(`search.php?s=${encodeURIComponent(query)}`);
  }

  async lookup(id) {
    return this.#request(`lookup.php?i=${encodeURIComponent(id)}`);
  }

  async #request(path) {
    const response = await fetch(new URL(path, this.baseUrl));
    if (!response.ok) throw new Error(`Vefþjónusta skilaði stöðunni ${response.status}.`);
    const data = await response.json();
    if (!data || !('meals' in data) || (data.meals !== null && !Array.isArray(data.meals))) {
      throw new Error('Svar frá vefþjónustu var á óvæntu formi.');
    }
    return (data.meals || []).map((meal) => {
      if (!meal || typeof meal.idMeal !== 'string' || typeof meal.strMeal !== 'string') {
        throw new Error('Uppskriftargögn eru ógild.');
      }
      const ingredients = [];
      for (let i = 1; i <= MAX_INGREDIENTS; i += 1) {
        const ingredient = meal[`strIngredient${i}`]?.trim();
        const measure = meal[`strMeasure${i}`]?.trim();
        if (ingredient) ingredients.push({ ingredient, measure: measure || '' });
      }
      return {
        id: meal.idMeal,
        title: meal.strMeal,
        image: meal.strMealThumb,
        instructions: meal.strInstructions || '',
        ingredients,
      };
    });
  }
}
