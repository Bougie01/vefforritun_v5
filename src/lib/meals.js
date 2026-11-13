import { el, empty } from './elements.js';

export class MealSearcher {
  constructor(api, baseElement) {
    this.api = api;
    this.baseElement = baseElement;
  }

  showMessage(message) {
    empty(this.baseElement);
    this.baseElement.append(el('p', { class: 'message', role: 'status' }, message));
  }

  async search(query) {
    if (!query.trim()) {
      this.showMessage('Sláðu inn leitarorð.');
      return;
    }
    this.showMessage('Leita að uppskriftum…');
    try {
      const meals = await this.api.search(query.trim());
      if (meals.length === 0) {
        this.showMessage('Engar uppskriftir fundust.');
        return;
      }
      const list = el('ul', { class: 'results-list' });
      for (const meal of meals) {
        const link = el('a', { href: `?id=${encodeURIComponent(meal.id)}` },
          el('img', { src: meal.image, alt: '', loading: 'lazy' }), meal.title);
        list.append(el('li', { class: 'results-item' }, link));
      }
      empty(this.baseElement);
      this.baseElement.append(this.form(), list);
    } catch (e) {
      this.showMessage(`Villa við leit: ${e.message}`);
    }
  }

  form() {
    const input = el('input', { type: 'search', name: 'query', id: 'query', required: 'true', placeholder: 'T.d. bread' });
    const form = el('form', { class: 'form' },
      el('label', { for: 'query' }, 'Leitarorð'),
      el('div', { class: 'form-row' }, input, el('button', { type: 'submit' }, 'Leita')));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.search(input.value);
    });
    return form;
  }

  async showMeal(id) {
    this.showMessage('Sæki uppskrift…');
    try {
      const meals = await this.api.lookup(id);
      if (!meals.length) {
        this.showMessage('Uppskrift fannst ekki.');
        return;
      }
      const meal = meals[0];
      const ingredients = el('ul', { class: 'meal-ingredients' },
        ...meal.ingredients.map(({ ingredient, measure }) => el('li', {}, `${ingredient}${measure ? ` — ${measure}` : ''}`)));
      const instructions = el('div', { class: 'meal-instructions' },
        ...meal.instructions.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => el('p', {}, line)));
      const article = el('article', { class: 'meal' },
        el('a', { href: '/' }, 'Til baka'), el('h2', {}, meal.title),
        el('img', { class: 'meal-image', src: meal.image, alt: meal.title }),
        el('h3', {}, 'Hráefni'), ingredients, el('h3', {}, 'Leiðbeiningar'), instructions);
      empty(this.baseElement);
      this.baseElement.append(article);
    } catch (e) {
      this.showMessage(`Villa við að sækja uppskrift: ${e.message}`);
    }
  }

  /**
   * Birtir annaðhvort leitarform eða ákveðna uppskrift.
   * @param {string|null} id ID uppskriftar, ef ekki null er hún birt.
   */
  render(id = null) {
    if (id) {
      this.showMeal(id);
      return;
    }
    empty(this.baseElement);
    this.baseElement.append(this.form());
  }
}
