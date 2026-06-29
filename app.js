/**
 * Cura Veritas Engine - Version 3.6
 * Handles State, Data generation, Authentication, and UI Rendering.
 * FIXED: Collection deletion logic and event propagation.
 */

const app = {
  state: {
    history: ['home'],
    user: JSON.parse(localStorage.getItem('cv_user')) || null,
    savedItems: JSON.parse(localStorage.getItem('cv_saved_items')) || [], 
    folders: JSON.parse(localStorage.getItem('cv_folders')) || ['Clinical Ethics', 'Historiography'],
    articles: [], 
    activeFolderFilter: null, 
    pendingSaveId: null 
  },

  init() {
    this.migrateOldData(); 
    this.generateDatabase();
    this.refreshAllViews();
    console.log("Cura Veritas Engine Running.");
  },

  migrateOldData() {
    const oldSaved = JSON.parse(localStorage.getItem('cv_saved'));
    if (oldSaved && Array.isArray(oldSaved) && typeof oldSaved[0] === 'number') {
      this.state.savedItems = oldSaved.map(id => ({ id: id, folder: 'Uncategorized' }));
      localStorage.setItem('cv_saved_items', JSON.stringify(this.state.savedItems));
      localStorage.removeItem('cv_saved');
    }
  },

  generateDatabase() {
    const subjects = ["Ethics", "Philosophy", "Quantum Mechanics", "Biology", "Sociology", "Archival Theory", "AI", "Medicine", "Theology", "Law"];
    const actions = ["The Implications of", "A Study on", "Paradoxes within", "Historical Analysis of", "Future Trends in"];
    const contexts = ["in the Digital Age", "during the Anthropocene", "for Synthetic Life", "in Transparent Governance", "under Stress"];

    const authorsPool = [
      "Dr. Alan Turing", "Prof. Marie Curie", "Dr. Elias Thorne", "Dr. Elias Thorne", 
      "Sarah Jenkins, PhD", "Liam O'Connell", "Dr. Maria Chen", "Prof. Robert Lang",
      "Dr. Julian Vellum", "Helena Vance", "Dr. K. Patel", "J. R. Oppenheimer",
      "Dr. Aris Thorne", "Prof. Wei Chen", "Silas Vance", "Dr. Amara Singh",
      "A. L. Thompson", "Dr. Beatriz Silva", "Prof. John Nash", "Dr. Elias Thorne"
    ];

    for (let i = 1; i <= 50; i++) {
      let sub = subjects[i % subjects.length];
      let act = actions[i % actions.length];
      let ctx = contexts[i % contexts.length];
      let auth = authorsPool[i % authorsPool.length];
      
      this.state.articles.push({
        id: i,
        title: `${act} ${sub} ${ctx}`,
        abstract: `An in-depth exploration of ${sub.toLowerCase()} focusing on modern frameworks and historical precedents. Document ID: ARCHIVE-${i}.`,
        tag: i % 2 === 0 ? "Open Access" : "Institutional",
        author: auth,
        pdfUrl: `../ASSETS/(${i}).pdf`
      });
    }
  },

  navigate(targetId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const target = document.getElementById(`screen-${targetId}`);
    if (target) {
      target.classList.add('active');
      target.querySelector('.scroll-area')?.scrollTo(0, 0);
      if (this.state.history[this.state.history.length - 1] !== targetId) {
        this.state.history.push(targetId);
      }
    }
    document.querySelectorAll('.nav-item').forEach(nav => {
      nav.classList.toggle('active', nav.dataset.target === targetId);
    });
  },

  goBack() {
    if (this.state.history.length > 1) {
      this.state.history.pop();
      this.navigate(this.state.history[this.state.history.length - 1]);
    } else {
      this.navigate('home');
    }
  },

  toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if(sidebar) sidebar.classList.toggle('active');
    if(overlay) overlay.classList.toggle('active');
  },

  renderCuratedHome() {
    const container = document.getElementById('home-curated');
    if (!container) return; 
    container.innerHTML = '';
    const curated = this.state.articles.slice(0, 10);
    curated.forEach(art => { container.innerHTML += this.createArticleCardHTML(art); });
  },

  handleSearch() {
    const inputEl = document.getElementById('searchInput');
    if (!inputEl) return;
    
    const query = inputEl.value.toLowerCase();
    const clearBtn = document.getElementById('clearSearchBtn');
    if(clearBtn) clearBtn.style.display = query.length > 0 ? 'block' : 'none';
    
    const filtered = this.state.articles.filter(a => 
      a.title.toLowerCase().includes(query) || a.abstract.toLowerCase().includes(query) || a.author.toLowerCase().includes(query)
    );
    
    const titleEl = document.getElementById('searchTitle');
    const countEl = document.getElementById('searchCount');
    if(titleEl) titleEl.innerText = query ? `Results for "${query}"` : "All Archives";
    if(countEl) countEl.innerText = `${filtered.length} entries found`;
    
    this.renderSearchResults(filtered);
  },

  clearSearch() {
    const inputEl = document.getElementById('searchInput');
    if(inputEl) inputEl.value = '';
    this.handleSearch();
  },

  searchFor(term) {
    this.navigate('search');
    const inputEl = document.getElementById('searchInput');
    if(inputEl) {
        inputEl.value = term;
        this.handleSearch();
    }
  },

  renderSearchResults(data = this.state.articles) {
    const container = document.getElementById('search-results');
    if (!container) return;
    container.innerHTML = '';
    
    if (data.length === 0) {
      container.innerHTML = `<div style="padding: 40px 24px; text-align: center; color: var(--text-muted);">No archives match your inquiry.</div>`;
      return;
    }
    data.forEach(art => { container.innerHTML += this.createArticleCardHTML(art); });
  },

  createArticleCardHTML(art) {
    const savedObj = this.state.savedItems.find(item => item.id === art.id);
    const isSaved = !!savedObj;
    
    const saveIcon = isSaved 
      ? `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> Saved` 
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> Save`;
    
    const badgeClass = art.tag === "Open Access" ? "badge-open" : "";
    const folderText = isSaved && savedObj.folder !== 'Uncategorized' 
      ? `<span style="font-size:10px; color:var(--teal); margin-left:auto;">In: ${savedObj.folder}</span>` : '';

    return `
      <article class="result-card">
        <div class="result-badges">
          <span class="badge ${badgeClass}">${art.tag}</span>
        </div>
        <a href="${art.pdfUrl}" target="_blank" class="result-title">${art.title}</a>
        <p class="result-abstract">${art.abstract}</p>
        <div class="result-author" style="display:flex; align-items:center;">
          <span>By <strong>${art.author}</strong></span>
          ${folderText}
        </div>
        <div class="result-actions">
          <a href="${art.pdfUrl}" target="_blank" class="result-action" style="text-decoration:none;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Read PDF
          </a>
          <button class="result-action" onclick="app.initiateSave(${art.id})" style="color: ${isSaved ? 'var(--teal)' : 'inherit'}">
            ${saveIcon}
          </button>
        </div>
      </article>
    `;
  },

  initiateSave(articleId) {
    if (!this.state.user) {
      ui.showToast('Please login to save archives.');
      this.navigate('profile');
      return;
    }

    const existingIndex = this.state.savedItems.findIndex(item => item.id === articleId);
    
    if (existingIndex > -1) {
      this.state.savedItems.splice(existingIndex, 1);
      this.syncData();
      this.refreshAllViews(); 
      ui.showToast('Removed from Library');
    } else {
      this.state.pendingSaveId = articleId;
      const selectEl = document.getElementById('saveFolderSelect');
      
      if(!selectEl) {
         this.state.savedItems.push({ id: articleId, folder: 'Uncategorized' });
         this.syncData();
         this.refreshAllViews(); 
         ui.showToast('Saved to Library');
         return;
      }

      selectEl.innerHTML = `<option value="Uncategorized">Uncategorized</option>`;
      this.state.folders.forEach(f => {
        selectEl.innerHTML += `<option value="${f}">${f}</option>`;
      });
      this.openModal('saveModal');
    }
  },

  confirmSave() {
    const selectEl = document.getElementById('saveFolderSelect');
    const folder = selectEl ? selectEl.value : 'Uncategorized';
    
    this.state.savedItems.push({ id: this.state.pendingSaveId, folder: folder });
    this.syncData();
    this.closeModal(null, 'saveModal', true);
    this.refreshAllViews(); 
    ui.showToast(`Saved to ${folder}`);
  },

  filterLibrary(folderName) {
    if(this.state.activeFolderFilter === folderName) {
      this.state.activeFolderFilter = null; 
    } else {
      this.state.activeFolderFilter = folderName;
    }
    this.renderLibrary();
  },

  // THE FIX: Event parameter safely stops bubbling.
  deleteFolder(event, folderName) {
    event.stopPropagation(); // Prevents click from opening/filtering the folder
    
    if(confirm(`Delete collection "${folderName}"?\nAny saved documents inside will be moved to Uncategorized.`)) {
      this.state.folders = this.state.folders.filter(f => f !== folderName);
      
      // Re-assign orphaned articles
      this.state.savedItems.forEach(item => {
        if(item.folder === folderName) item.folder = 'Uncategorized';
      });
      
      if(this.state.activeFolderFilter === folderName) this.state.activeFolderFilter = null;
      
      this.syncData();
      this.refreshAllViews();
      ui.showToast('Collection deleted');
    }
  },

  renderLibrary() {
    const countText = document.getElementById('libraryCountText');
    if (countText) countText.innerText = `${this.state.savedItems.length} Items Saved`;
    
    const folderContainer = document.getElementById('library-folders');
    if (folderContainer) {
      folderContainer.innerHTML = '';
      this.state.folders.forEach(folder => {
        const isActive = this.state.activeFolderFilter === folder ? 'active-folder' : '';
        const itemCount = this.state.savedItems.filter(item => item.folder === folder).length;
        
        folderContainer.innerHTML += `
          <div class="folder-card ${isActive}" onclick="app.filterLibrary('${folder}')">
            <div class="folder-header">
              <div class="folder-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
              </div>
              <button class="delete-folder-btn" onclick="app.deleteFolder(event, '${folder}')" aria-label="Delete Folder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
            <div class="folder-name">${folder}</div>
            <div class="folder-count">${itemCount} items</div>
          </div>
        `;
      });
    }

    const savedContainer = document.getElementById('library-saved-items');
    if (!savedContainer) return;
    
    savedContainer.innerHTML = '';
    let itemsToDisplay = this.state.savedItems;
    const titleEl = document.getElementById('librarySectionTitle');
    
    if(this.state.activeFolderFilter) {
      itemsToDisplay = this.state.savedItems.filter(item => item.folder === this.state.activeFolderFilter);
      if(titleEl) titleEl.innerHTML = `Viewing: <strong style="color:var(--text-primary);">${this.state.activeFolderFilter}</strong> <span class="filter-status" onclick="app.filterLibrary('${this.state.activeFolderFilter}')">(✖ Clear Filter)</span>`;
    } else {
      if(titleEl) titleEl.innerHTML = `All Saved Archives`;
    }

    if (itemsToDisplay.length === 0) {
      savedContainer.innerHTML = `<div style="padding: 24px; color: var(--text-muted); text-align: center;">No archives found here.</div>`;
      return;
    }

    const savedArticles = itemsToDisplay.map(savedObj => 
      this.state.articles.find(a => a.id === savedObj.id)
    ).filter(Boolean);

    savedArticles.forEach(art => {
      savedContainer.innerHTML += this.createArticleCardHTML(art);
    });
  },

  createFolder() {
    const input = document.getElementById('folderNameInput');
    if (!input) return;
    
    const name = input.value.trim();
    if (name === '') {
      ui.showToast('Collection name cannot be empty');
      return;
    }
    if (this.state.folders.includes(name)) {
      ui.showToast('Collection already exists');
      return;
    }
    
    this.state.folders.push(name);
    this.syncData();
    ui.showToast(`Collection "${name}" created`);
    input.value = '';
    this.closeModal(null, 'folderModal', true);
    this.refreshAllViews();
  },

  checkAuth() {
    const loginView = document.getElementById('view-login');
    const profileView = document.getElementById('view-profile');
    if(!loginView || !profileView) return; 

    if (this.state.user) {
      loginView.style.display = 'none';
      profileView.style.display = 'block';
      
      const pName = document.getElementById('profileName');
      const pFall = document.getElementById('avatarFallback');
      const pCount = document.getElementById('profileSaveCount');
      const pRole = document.getElementById('profileRoleText');
      
      if(pName) pName.innerText = this.state.user.name;
      if(pFall) pFall.innerText = this.state.user.name.charAt(0).toUpperCase();
      if(pCount) pCount.innerText = this.state.savedItems.length;
      
      if(pRole) {
          let displayRole = this.state.user.role || 'Researcher';
          if (displayRole === "Researcher") displayRole = "Verified Researcher";
          pRole.innerText = displayRole;
      }
    } else {
      loginView.style.display = 'block';
      profileView.style.display = 'none';
    }
  },

  login() {
    const userEl = document.getElementById('loginUsername');
    const passEl = document.getElementById('loginPassword');
    const roleEl = document.getElementById('loginRole');
    
    if(!userEl || !passEl) return;
    
    const userIn = userEl.value.trim();
    const passIn = passEl.value.trim();
    const roleIn = roleEl ? roleEl.value : 'Researcher'; 

    if (!userIn || !passIn) {
      ui.showToast("Please enter credentials.");
      return;
    }

    this.state.user = { name: userIn, role: roleIn };
    localStorage.setItem('cv_user', JSON.stringify(this.state.user));
    
    userEl.value = '';
    passEl.value = '';
    
    ui.showToast(`Welcome back, ${userIn}`);
    this.refreshAllViews();
  },

  logout() {
    this.state.user = null;
    localStorage.removeItem('cv_user');
    ui.showToast('Logged out successfully.');
    this.refreshAllViews();
  },

  clearData() {
    localStorage.clear();
    this.state.savedItems = [];
    this.state.folders = ['Clinical Ethics', 'Historiography'];
    this.state.activeFolderFilter = null;
    ui.showToast("All local data cleared.");
    this.logout();
    setTimeout(() => window.location.reload(), 1000);
  },

  syncData() {
    localStorage.setItem('cv_saved_items', JSON.stringify(this.state.savedItems));
    localStorage.setItem('cv_folders', JSON.stringify(this.state.folders));
  },

  refreshAllViews() {
    this.renderCuratedHome();
    this.handleSearch();
    this.renderLibrary();
    this.checkAuth();
  },

  openModal(modalId) { 
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.add('active'); 
  },
  
  closeModal(event, modalId, force = false) {
    const modal = document.getElementById(modalId);
    if (modal && (force || event.target.id === modalId)) { 
        modal.classList.remove('active'); 
    }
  }
};

const ui = {
  showToast(message) {
    const container = document.getElementById('toastContainer');
    if(!container) return; 
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());