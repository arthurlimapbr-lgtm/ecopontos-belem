const STORAGE_KEYS = {
  favorites: 'ecopontos-belem-favorites',
  suggestions: 'ecopontos-belem-suggestions'
};

const state = {
  filteredPoints: [...window.ecopontosData],
  favorites: new Set(loadFavorites()),
  selectedPointId: window.ecopontosData[0]?.id || null,
  map: null,
  markerLayer: null,
  userLocation: null,
  closestMode: false,
  sortMode: 'relevance',
  quizIndex: 0,
  quizScore: 0,
  quizCompleted: false
};

const elements = {
  searchInput: document.getElementById('searchInput'),
  searchButton: document.getElementById('searchButton'),
  clearSearchButton: document.getElementById('clearSearchButton'),
  searchSuggestions: document.getElementById('searchSuggestions'),
  bairroFilter: document.getElementById('bairroFilter'),
  materialFilter: document.getElementById('materialFilter'),
  categoryFilter: document.getElementById('categoryFilter'),
  verifiedFilter: document.getElementById('verifiedFilter'),
  favoritesFilter: document.getElementById('favoritesFilter'),
  sortFilter: document.getElementById('sortFilter'),
  clearFiltersButton: document.getElementById('clearFiltersButton'),
  activeFilters: document.getElementById('activeFilters'),
  resultsSummary: document.getElementById('resultsSummary'),
  pointsList: document.getElementById('pointsList'),
  pointDetail: document.getElementById('pointDetail'),
  guideList: document.getElementById('guideList'),
  quizCard: document.getElementById('quizCard'),
  nearbyButton: document.getElementById('nearbyButton'),
  sourcesList: document.getElementById('sourcesList'),
  lastUpdatedText: document.getElementById('lastUpdatedText'),
  installBtn: document.getElementById('installBtn'),
  suggestionForm: document.getElementById('suggestionForm'),
  suggestionInput: document.getElementById('suggestionInput'),
  offlineBanner: document.getElementById('offlineBanner'),
  statPoints: document.getElementById('statPoints'),
  statMaterials: document.getElementById('statMaterials'),
  statVerified: document.getElementById('statVerified')
};

let deferredInstallPrompt = null;

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  renderStats();
  renderGuide();
  renderSources();
  renderQuiz();
  renderPointDetail();
  renderList();
  renderSummary();
  renderActiveFilters();
  initMap();
  bindEvents();
  registerServiceWorker();
  setupOfflineBanner();
  onLocationChange();
  elements.lastUpdatedText.textContent = window.appMeta.lastUpdated;
});

function bindEvents() {
  let searchTimer;
  elements.searchButton.addEventListener('click', handleSearch);
  elements.clearSearchButton.addEventListener('click', () => {
    elements.searchInput.value = '';
    applyFilters();
    elements.searchInput.focus();
  });
  elements.searchInput.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(applyFilters, 120);
  });
  elements.searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handleSearch();
  });

  elements.bairroFilter.addEventListener('change', applyFilters);
  elements.materialFilter.addEventListener('change', applyFilters);
  elements.categoryFilter.addEventListener('change', applyFilters);
  elements.verifiedFilter.addEventListener('change', applyFilters);
  elements.favoritesFilter.addEventListener('change', applyFilters);
  elements.sortFilter.addEventListener('change', () => {
    state.sortMode = elements.sortFilter.value;
    if (state.sortMode === 'distance' && !state.userLocation) {
      requestNearbyPoints();
      return;
    }
    applyFilters();
  });
  elements.clearFiltersButton.addEventListener('click', clearFilters);
  elements.activeFilters.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-clear-filter]');
    if (chip) clearSingleFilter(chip.dataset.clearFilter);
  });

  elements.nearbyButton.addEventListener('click', requestNearbyPoints);

  elements.pointsList.addEventListener('click', (event) => {
    const favoriteButton = event.target.closest('[data-favorite-id]');
    if (favoriteButton) {
      toggleFavorite(favoriteButton.dataset.favoriteId);
      return;
    }

    const selectButton = event.target.closest('[data-select-point]');
    if (selectButton) {
      state.selectedPointId = selectButton.dataset.selectPoint;
      renderPointDetail();
      renderList();
      return;
    }
  });

  elements.pointDetail.addEventListener('click', (event) => {
    const favoriteButton = event.target.closest('[data-detail-favorite]');
    if (favoriteButton) {
      toggleFavorite(favoriteButton.dataset.detailFavorite);
    }
  });

  elements.quizCard.addEventListener('click', (event) => {
    const optionButton = event.target.closest('[data-answer-index]');
    if (optionButton) {
      handleQuizAnswer(Number(optionButton.dataset.answerIndex));
      return;
    }

    const nextButton = event.target.closest('[data-next-question]');
    if (nextButton) {
      advanceQuiz();
    }

    const restartButton = event.target.closest('[data-restart-quiz]');
    if (restartButton) {
      resetQuiz();
    }
  });

  elements.suggestionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = elements.suggestionInput.value.trim();
    if (!text) {
      elements.suggestionInput.focus();
      return;
    }

    const drafts = getSavedSuggestions();
    drafts.push({
      text,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem(STORAGE_KEYS.suggestions, JSON.stringify(drafts));
    elements.suggestionInput.value = '';
    alert('Rascunho salvo localmente. Ele deve passar por revisão antes de ser incluído como informação oficial.');
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    elements.installBtn.hidden = false;
  });

  elements.installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      elements.installBtn.hidden = true;
    }
    deferredInstallPrompt = null;
  });
}

function initFilters() {
  const bairros = Array.from(new Set(window.ecopontosData.map((point) => point.bairro))).sort();
  const materiais = Array.from(new Set(window.ecopontosData.flatMap((point) => point.materials))).sort();
  const categorias = Array.from(new Set(window.ecopontosData.map((point) => point.category))).sort();

  populateSelect(elements.bairroFilter, ['Todos', ...bairros]);
  populateSelect(elements.materialFilter, ['Todos', ...materiais]);
  populateSelect(elements.categoryFilter, ['Todos', ...categorias]);
  populateSearchSuggestions();
}

function populateSelect(select, options) {
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
    .join('');
}

function populateSearchSuggestions() {
  const suggestions = new Set([
    ...window.ecopontosData.flatMap((point) => [
      point.name,
      point.bairro,
      point.address,
      point.category,
      point.status || '',
      ...point.materials
    ]),
    ...window.materialGuides.map((item) => item.material)
  ]);

  elements.searchSuggestions.innerHTML = [...suggestions]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((suggestion) => `<option value="${escapeHtml(suggestion)}"></option>`)
    .join('');
}

function clearFilters() {
  elements.searchInput.value = '';
  elements.bairroFilter.value = 'Todos';
  elements.materialFilter.value = 'Todos';
  elements.categoryFilter.value = 'Todos';
  elements.verifiedFilter.checked = false;
  elements.favoritesFilter.checked = false;
  elements.sortFilter.value = 'relevance';
  state.sortMode = 'relevance';
  state.closestMode = false;
  applyFilters();
}

function clearSingleFilter(filter) {
  const controls = {
    search: () => { elements.searchInput.value = ''; },
    bairro: () => { elements.bairroFilter.value = 'Todos'; },
    material: () => { elements.materialFilter.value = 'Todos'; },
    category: () => { elements.categoryFilter.value = 'Todos'; },
    verified: () => { elements.verifiedFilter.checked = false; },
    favorites: () => { elements.favoritesFilter.checked = false; },
    sort: () => {
      elements.sortFilter.value = 'relevance';
      state.sortMode = 'relevance';
      state.closestMode = false;
    }
  };

  if (controls[filter]) {
    controls[filter]();
    applyFilters();
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function getPointSearchText(point) {
  return normalizeText([
    point.name,
    point.bairro,
    point.category,
    point.address,
    point.materials.join(' '),
    point.hours,
    point.notes,
    point.source,
    point.status || ''
  ].join(' '));
}

function applyFilters() {
  const searchTerms = normalizeText(elements.searchInput.value).split(/\s+/).filter(Boolean);
  const selectedBairro = elements.bairroFilter.value;
  const selectedMaterial = elements.materialFilter.value;
  const selectedCategory = elements.categoryFilter.value;
  const onlyVerified = elements.verifiedFilter.checked;
  const favoritesOnly = elements.favoritesFilter.checked;

  const filtered = window.ecopontosData.filter((point) => {
    const pointText = getPointSearchText(point);
    const matchesSearch = searchTerms.every((term) => pointText.includes(term));

    const matchesBairro = selectedBairro === 'Todos' || point.bairro === selectedBairro;
    const matchesMaterial = selectedMaterial === 'Todos' || point.materials.includes(selectedMaterial);
    const matchesCategory = selectedCategory === 'Todos' || point.category === selectedCategory;
    const matchesVerified = !onlyVerified || point.verified;
    const matchesFavorite = !favoritesOnly || state.favorites.has(point.id);

    return matchesSearch && matchesBairro && matchesMaterial && matchesCategory && matchesVerified && matchesFavorite;
  });

  state.filteredPoints = state.closestMode && state.userLocation
    ? filtered
        .map((point) => ({
          ...point,
          distance: hasCoordinates(point) ? calculateDistanceKm(state.userLocation, point) : Number.POSITIVE_INFINITY
        }))
    : filtered;

  if (state.sortMode === 'distance' && state.userLocation) {
    state.filteredPoints.sort((a, b) => {
      const distanceA = Number.isFinite(a.distance)
        ? a.distance
        : hasCoordinates(a) ? calculateDistanceKm(state.userLocation, a) : Number.POSITIVE_INFINITY;
      const distanceB = Number.isFinite(b.distance)
        ? b.distance
        : hasCoordinates(b) ? calculateDistanceKm(state.userLocation, b) : Number.POSITIVE_INFINITY;
      return distanceA - distanceB;
    });
  } else if (state.sortMode === 'name') {
    state.filteredPoints.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  if (state.filteredPoints.length && !state.filteredPoints.some((point) => point.id === state.selectedPointId)) {
    state.selectedPointId = state.filteredPoints[0].id;
  }

  renderList();
  renderPointDetail();
  renderMapMarkers();
  renderSummary();
  renderActiveFilters();
}

function renderSummary() {
  const total = window.ecopontosData.length;
  elements.resultsSummary.textContent = `${state.filteredPoints.length} de ${total} local${total === 1 ? '' : 'is'}`;
}

function renderActiveFilters() {
  const active = [];
  const searchValue = elements.searchInput.value.trim();

  if (searchValue) active.push({ label: `Busca: ${searchValue}`, key: 'search' });
  if (elements.bairroFilter.value !== 'Todos') active.push({ label: elements.bairroFilter.value, key: 'bairro' });
  if (elements.materialFilter.value !== 'Todos') active.push({ label: elements.materialFilter.value, key: 'material' });
  if (elements.categoryFilter.value !== 'Todos') active.push({ label: elements.categoryFilter.value, key: 'category' });
  if (elements.verifiedFilter.checked) active.push({ label: 'Verificados', key: 'verified' });
  if (elements.favoritesFilter.checked) active.push({ label: 'Favoritos', key: 'favorites' });
  if (state.sortMode === 'name') active.push({ label: 'Ordem alfabética', key: 'sort' });
  if (state.sortMode === 'distance' && state.userLocation) active.push({ label: 'Mais próximos', key: 'sort' });

  elements.activeFilters.innerHTML = active
    .map((filter) => `
      <button class="filter-chip" type="button" data-clear-filter="${filter.key}">
        ${escapeHtml(filter.label)} <span aria-hidden="true">×</span>
      </button>
    `)
    .join('');
}

function renderMapMarkers() {
  if (!state.map) {
    return;
  }

  if (state.markerLayer) {
    state.markerLayer.clearLayers();
  }

  state.markerLayer = L.layerGroup().addTo(state.map);

  state.filteredPoints.filter(hasCoordinates).forEach((point) => {
    const marker = L.marker([point.lat, point.lng]).addTo(state.markerLayer);
    const html = `
      <div>
        <strong>${escapeHtml(point.name)}</strong><br>
        <span>${escapeHtml(point.bairro)}</span><br>
        <small>${escapeHtml(point.materials.join(', '))}</small>
      </div>
    `;

    marker.bindPopup(html);
    marker.on('click', () => {
      state.selectedPointId = point.id;
      renderPointDetail();
      renderList();
    });
  });

  const mappedPoints = state.filteredPoints.filter(hasCoordinates);
  if (mappedPoints.length > 0) {
    const bounds = L.latLngBounds(mappedPoints.map((point) => [point.lat, point.lng]));
    state.map.fitBounds(bounds.pad(0.3), { maxZoom: 13, animate: false });
  }
}

function hasCoordinates(point) {
  return Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

function getRouteUrl(point) {
  if (hasCoordinates(point)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.name.replace('LEV anunciado — ', '') + ', Belém, PA')}`;
}

function renderList() {
  if (!state.filteredPoints.length) {
    elements.pointsList.innerHTML = '<div class="empty-state">Nenhum ponto corresponde aos filtros atuais. Ajuste a busca ou a localização.</div>';
    return;
  }

  elements.pointsList.innerHTML = state.filteredPoints
    .map((point) => {
      const isSelected = point.id === state.selectedPointId;
      const isFavorite = state.favorites.has(point.id);
      const distanceText = Number.isFinite(point.distance) ? `<span class="badge">${point.distance.toFixed(1)} km</span>` : '';
      const routeUrl = getRouteUrl(point);
      const routeLabel = hasCoordinates(point) ? 'Traçar rota' : 'Buscar local';
      const statusText = point.verified ? 'Verificado pela Prefeitura' : 'Pendente de confirmação';

      return `
        <article class="point-card ${isSelected ? 'selected' : ''}">
          <div class="point-top">
            <div>
              <h3>${escapeHtml(point.name)}</h3>
              <p>${escapeHtml(point.bairro)}</p>
            </div>
            <button
              class="favorite-btn ${isFavorite ? 'active' : ''}"
              type="button"
              data-favorite-id="${point.id}"
              aria-pressed="${isFavorite}"
              aria-label="${isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}: ${escapeHtml(point.name)}"
            >
              ${isFavorite ? '★' : '☆'}
            </button>
          </div>

          <p class="point-address">${escapeHtml(point.address)}</p>
          <div class="badge-row">
            <span class="badge">${escapeHtml(point.category)}</span>
            ${distanceText}
            <span class="badge ${point.verified ? '' : 'badge-pending'}">${statusText}</span>
          </div>

          <div class="tag-group" style="margin-top: 0.7rem;">
            ${point.materials.map((material) => `<span class="tag">${escapeHtml(material)}</span>`).join('')}
          </div>

          <div class="point-actions">
            <button type="button" data-select-point="${point.id}">Ver detalhes</button>
            <a href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">${routeLabel}</a>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderPointDetail() {
  const selectedPoint = state.filteredPoints.find((point) => point.id === state.selectedPointId) || null;

  if (!selectedPoint) {
    elements.pointDetail.innerHTML = '<div class="empty-state">Selecione um ponto para ver informações detalhadas.</div>';
    return;
  }

  const isFavorite = state.favorites.has(selectedPoint.id);
  const routeUrl = getRouteUrl(selectedPoint);
  const routeLabel = hasCoordinates(selectedPoint) ? 'Abrir rota' : 'Buscar referência no Maps';
  const coordinatesDetail = hasCoordinates(selectedPoint)
    ? `<li><strong>Coordenadas</strong><a href="${escapeHtml(selectedPoint.coordinateSourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(selectedPoint.coordinateSource)}</a></li>`
    : '<li><strong>Localização no mapa</strong>Sem coordenadas verificadas; confira o local exato antes de se deslocar.</li>';
  const statusDetail = selectedPoint.status
    ? `<li><strong>Situação</strong>${escapeHtml(selectedPoint.status)}</li>`
    : '';

  elements.pointDetail.innerHTML = `
    <div class="detail-grid">
      <div>
        <span class="eyebrow">Detalhes do local</span>
        <h3>${escapeHtml(selectedPoint.name)}</h3>
        <p>${escapeHtml(selectedPoint.address)}</p>
        <div class="badge-row" style="margin-top: 0.8rem;">
          <span class="badge">${escapeHtml(selectedPoint.category)}</span>
          <span class="badge ${selectedPoint.verified ? '' : 'badge-pending'}">${selectedPoint.verified ? 'Verificado pela Prefeitura' : 'Pendente de confirmação'}</span>
        </div>
        ${selectedPoint.materials.length
          ? `<div class="tag-group" style="margin-top: 0.8rem;">${selectedPoint.materials.map((material) => `<span class="tag">${escapeHtml(material)}</span>`).join('')}</div>`
          : '<p class="pending-info">Materiais aceitos para este local: pendentes de confirmação.</p>'}
      </div>

      <div>
        <ul class="detail-list">
          <li>
            <strong>Horários</strong>
            ${escapeHtml(selectedPoint.hours)}
          </li>
          <li>
            <strong>Contato</strong>
            ${escapeHtml(selectedPoint.phone)}
          </li>
          <li>
            <strong>Limite diário</strong>
            ${escapeHtml(selectedPoint.dailyLimit || 'Não informado')}
          </li>
          <li>
            <strong>Origem e verificação</strong>
            <a href="${escapeHtml(selectedPoint.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(selectedPoint.source)}</a>
            — verificado em ${escapeHtml(selectedPoint.lastUpdated)}
          </li>
          ${coordinatesDetail}
          ${statusDetail}
          <li>
            <strong>Observação</strong>
            ${escapeHtml(selectedPoint.notes)}
          </li>
        </ul>
        <div class="point-actions" style="margin-top: 0.9rem;">
          <button type="button" data-detail-favorite="${selectedPoint.id}">${isFavorite ? 'Remover favorito' : 'Salvar favorito'}</button>
          <a href="${escapeHtml(routeUrl)}" target="_blank" rel="noreferrer">${routeLabel}</a>
        </div>
      </div>
    </div>
  `;
}

function renderGuide() {
  elements.guideList.innerHTML = window.materialGuides
    .map(
      (item) => `
        <article class="guide-card">
          <span class="eyebrow">Material</span>
          <h3>${escapeHtml(item.material)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <p><strong>Como preparar:</strong> ${escapeHtml(item.preparation)}</p>
        </article>
      `
    )
    .join('');
}

function renderStats() {
  elements.statPoints.textContent = String(window.ecopontosData.length);
  elements.statMaterials.textContent = String(window.materialGuides.length);
  elements.statVerified.textContent = String(window.ecopontosData.filter((point) => point.verified).length);
}

function renderSources() {
  elements.sourcesList.innerHTML = window.appMeta.sources
    .map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)}</a></li>`)
    .join('');
}

function initMap() {
  const mapElement = document.getElementById('mapView');
  if (!mapElement) {
    return;
  }

  if (typeof L === 'undefined') {
    mapElement.innerHTML = '<p class="map-unavailable">O mapa precisa de conexão para carregar. Os locais também estão disponíveis na lista ao lado.</p>';
    return;
  }

  state.map = L.map('mapView', {
    zoomControl: true,
    attributionControl: true
  }).setView([-1.408806, -48.466503], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map);

  renderMapMarkers();
}

function requestNearbyPoints() {
  if (!navigator.geolocation) {
    alert('Geolocalização não disponível neste navegador. Você pode usar os filtros por bairro.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      state.closestMode = true;
      state.sortMode = 'distance';
      elements.sortFilter.value = 'distance';
      applyFilters();
      alert('Sua localização foi usada para ordenar os pontos por proximidade.');
    },
    () => {
      state.closestMode = false;
      state.userLocation = null;
      state.sortMode = 'relevance';
      elements.sortFilter.value = 'relevance';
      applyFilters();
      alert('Não foi possível obter a localização. Você pode continuar usando os filtros por bairro e material.');
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 600000
    }
  );
}

function calculateDistanceKm(userLocation, point) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(point.lat - userLocation.lat);
  const dLng = toRadians(point.lng - userLocation.lng);
  const lat1 = toRadians(userLocation.lat);
  const lat2 = toRadians(point.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function onLocationChange() {
  if (!navigator.onLine) {
    elements.offlineBanner.classList.add('visible');
  }
}

function setupOfflineBanner() {
  const updateBanner = () => {
    elements.offlineBanner.classList.toggle('visible', !navigator.onLine);
  };

  window.addEventListener('online', updateBanner);
  window.addEventListener('offline', updateBanner);
  updateBanner();
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  }
}

function handleSearch() {
  applyFilters();
}

function toggleFavorite(pointId) {
  if (state.favorites.has(pointId)) {
    state.favorites.delete(pointId);
  } else {
    state.favorites.add(pointId);
  }

  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...state.favorites]));
  applyFilters();
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function getSavedSuggestions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.suggestions) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function renderQuiz() {
  const currentQuestion = window.quizQuestions[state.quizIndex];

  if (!currentQuestion) {
    const score = Math.round((state.quizScore / window.quizQuestions.length) * 100);
    const message = score >= 80 ? 'Excelente! Você domina boa parte das regras de reciclagem.' : score >= 50 ? 'Bom trabalho! Revise os pontos principais e continue praticando.' : 'Ainda há espaço para aprender mais sobre separação correta dos resíduos.';

    elements.quizCard.innerHTML = `
      <div class="result-box">
        <h3>Resultado final</h3>
        <p>Você acertou ${state.quizScore} de ${window.quizQuestions.length} perguntas.</p>
        <p>${message}</p>
      </div>
      <div class="quiz-controls">
        <button type="button" class="primary-btn" data-restart-quiz="true">Reiniciar quiz</button>
      </div>
    `;
    return;
  }

  const optionsHtml = currentQuestion.options
    .map(
      (option, optionIndex) => `
        <button class="quiz-option" type="button" data-answer-index="${optionIndex}">${escapeHtml(option)}</button>
      `
    )
    .join('');

  elements.quizCard.innerHTML = `
    <p class="quiz-question">Pergunta ${state.quizIndex + 1}: ${escapeHtml(currentQuestion.question)}</p>
    <div class="quiz-options">${optionsHtml}</div>
  `;
}

function handleQuizAnswer(selectedIndex) {
  const currentQuestion = window.quizQuestions[state.quizIndex];
  const buttons = elements.quizCard.querySelectorAll('.quiz-option');

  buttons.forEach((button, idx) => {
    button.disabled = true;
    if (idx === currentQuestion.correctIndex) {
      button.classList.add('correct');
    }
    if (idx === selectedIndex && idx !== currentQuestion.correctIndex) {
      button.classList.add('incorrect');
    }
  });

  const answeredCorrectly = selectedIndex === currentQuestion.correctIndex;
  if (answeredCorrectly) {
    state.quizScore += 1;
  }

  const explanationHtml = `
    <div class="quiz-explanation">
      <strong>${answeredCorrectly ? 'Correto!' : 'Resposta incorreta.'}</strong>
      <p>${escapeHtml(currentQuestion.explanation)}</p>
    </div>
  `;

  elements.quizCard.insertAdjacentHTML('beforeend', explanationHtml);

  const nextButton = `
    <div class="quiz-controls">
      <button type="button" class="primary-btn" data-next-question="true">
        ${state.quizIndex === window.quizQuestions.length - 1 ? 'Ver resultado' : 'Próxima pergunta'}
      </button>
    </div>
  `;

  elements.quizCard.insertAdjacentHTML('beforeend', nextButton);
}

function advanceQuiz() {
  state.quizIndex += 1;
  if (state.quizIndex >= window.quizQuestions.length) {
    state.quizCompleted = true;
    renderQuiz();
    return;
  }
  renderQuiz();
}

function resetQuiz() {
  state.quizIndex = 0;
  state.quizScore = 0;
  state.quizCompleted = false;
  renderQuiz();
}
