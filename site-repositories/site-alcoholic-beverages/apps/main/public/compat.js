(function () {
  var hash = window.location.hash;
  if (hash && hash.indexOf('#?') === 0) {
    window.location.replace('/?' + hash.slice(2));
    return;
  }
  var params = new URLSearchParams(window.location.search);
  var page = params.get('page');
  if (!page) return;
  var id = params.get('id');
  var q = params.get('q');
  var go = function (url) {
    window.location.replace(url || '/404.html');
  };
  var direct = {
    home: '/',
    china: id === 'anhui' ? '/regions/anhui/' : '/regions/',
    world: '/regions/',
    categories: '/styles/',
    tags: '/search/',
  };
  if (direct[page]) return go(direct[page]);
  if (page === 'province') return go(id === 'anhui' ? '/regions/anhui/' : '/regions/');
  if (page === 'city') return go(id && String(id).indexOf('亳州') !== -1 ? '/regions/bozhou/' : '/regions/');
  if (page === 'country') return go(id === 'china' ? '/regions/china/' : '/regions/');
  if (page === 'continent') return go('/regions/');
  if (page === 'search') return go(q ? '/search/?q=' + encodeURIComponent(q) : '/search/');
  if (page === 'pub' && !id) return go('/places/');
  if (page === 'liquor' && !id) return go('/styles/');
  fetch('/legacy-routes.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (map) {
      if (page === 'liquor' || page === 'pub') {
        return go(id ? map.details[page + ':' + id] : page === 'liquor' ? '/styles/' : '/places/');
      }
      if (page === 'category') return go(id ? map.categories[id] : '/styles/');
      if (page === 'subcategory') {
        var category = params.get('category');
        return go(category && id ? map.subcategories[category + '/' + id] : '/styles/');
      }
      if (page === 'tag') return go(id && map.tags[id] ? map.tags[id] : '/search/');
      go('/404.html');
    })
    .catch(function () {
      go('/404.html');
    });
})();
