/**
 * Gupta Sons Kolhu - Pure Supabase & LocalStorage Hybrid Integration
 */

// --- Dynamic User-Scoped Cart Helper ---

async function getCartKey() {
    try {
        if (typeof supabaseClient !== 'undefined') {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session && session.user) {
                return `gsk_cart_${session.user.id}`;
            }
        }
    } catch (err) {
        console.error("Error fetching session for cart key:", err);
    }
    return 'gsk_cart_guest';
}

// --- Account Icon Routing Handler ---

async function handleAccountClick(e) {
    if (e) e.preventDefault();

    let isLoggedIn = false;

    if (typeof supabaseClient !== 'undefined') {
        const { data } = await supabaseClient.auth.getSession();
        if (data?.session) {
            isLoggedIn = true;
        }
    }

    if (!isLoggedIn) {
        const localFlag = sessionStorage.getItem('gsk_user_logged_in');
        if (localFlag === 'true') {
            isLoggedIn = true;
        }
    }

    if (isLoggedIn) {
        window.location.href = 'profile.html';
    } else {
        window.location.href = 'login.html';
    }
}

// --- Supabase Data Handlers ---

async function fetchCategories() {
    try {
        if (typeof supabaseClient !== 'undefined') {
            const { data, error } = await supabaseClient.from('categories').select('*');
            if (!error && data) return data;
            console.error("Supabase category fetch error:", error);
        }
    } catch (err) {
        console.error("Failed to fetch categories from Supabase:", err);
    }
    return [];
}

async function fetchProducts() {
    try {
        if (typeof supabaseClient !== 'undefined') {
            const { data, error } = await supabaseClient.from('products').select('*');
            if (!error && data) return data;
            console.error("Supabase product fetch error:", error);
        }
    } catch (err) {
        console.error("Failed to fetch products from Supabase:", err);
    }
    return [];
}

// --- UI Rendering ---

async function renderCategories() {
    const grid = document.getElementById('category-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="col-12 text-center py-3"><div class="spinner-border text-warning" role="status"></div></div>';

    const categories = await fetchCategories();
    grid.innerHTML = '';

    if (categories.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted py-4">No categories found in database.</div>';
        return;
    }

    categories.forEach(cat => {
        grid.innerHTML += `
            <div class="col-6 col-lg-3">
                <a href="#shop" class="category-card" onclick="filterProducts('${cat.id}')">
                    <img src="${cat.image_url || cat.image || ''}" alt="${cat.name}">
                    <div class="category-overlay"></div>
                    <span class="category-title">${cat.name}</span>
                </a>
            </div>
        `;
    });
}

async function renderProducts(categoryFilter = 'all') {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-warning" role="status"></div></div>';

    const products = await fetchProducts();
    grid.innerHTML = '';

    const filterLower = categoryFilter.toLowerCase();
    const filtered = products.filter(p => {
        if (categoryFilter === 'all') return true;
        const catId = String(p.category_id || '').toLowerCase();
        const catName = String(p.category || '').toLowerCase();
        const title = String(p.title || '').toLowerCase();
        return catId === filterLower || catName.includes(filterLower) || title.includes(filterLower);
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted py-5">No products found.</div>';
        return;
    }

    filtered.forEach(product => {
        let badgeHTML = '';
        let buttonHTML = `<button class="btn-outline-custom mt-auto" onclick="handleAddToCart(event, '${product.id}')">Add to Cart</button>`;

        if (product.badge === "Selling Fast") badgeHTML = `<span class="badge-custom bg-selling-fast">Selling Fast</span>`;
        else if (product.badge === "Best Seller") badgeHTML = `<span class="badge-custom bg-best-seller">Best Seller</span>`;
        else if (product.badge === "Sold Out") {
            badgeHTML = `<span class="badge-custom bg-sold-out">Sold Out</span>`;
            buttonHTML = `<button class="btn-outline-custom mt-auto" disabled style="opacity:0.5;">Sold Out</button>`;
        }

        grid.innerHTML += `
            <div class="col-12 col-sm-6 col-lg-3 product-item" data-category="${product.category_id || product.category}">
                <div class="product-card text-center">
                    <div class="product-img-wrapper" onclick="openProductModal('${product.id}')" style="cursor: pointer;" title="View Details">
                        ${badgeHTML}
                        <img src="${product.image_url || product.image || ''}" class="product-img" alt="${product.title}">
                    </div>
                    <div class="stars mt-2"><i class="fa-solid fa-star" style="color: #E5A93C;"></i> 4.9</div>
                    <h3 class="product-title" onclick="openProductModal('${product.id}')" style="cursor: pointer;">${product.title}</h3>
                    <p class="product-price fw-bold mb-3">Rs. ${product.price}</p>
                    ${buttonHTML}
                </div>
            </div>
        `;
    });
}

function filterProducts(category) {
    const shopTitle = document.getElementById('shop-title');
    const resetBtn = document.getElementById('reset-filter-btn');
    if (category === 'all') {
        if (shopTitle) shopTitle.innerText = "Our Complete Collection";
        if (resetBtn) resetBtn.classList.add('d-none');
    } else {
        if (shopTitle) shopTitle.innerText = `${category.charAt(0).toUpperCase() + category.slice(1)} Oils`;
        if (resetBtn) resetBtn.classList.remove('d-none');
    }
    renderProducts(category);
}

// --- Menu Controls ---

function initMobileMenuAutoClose() {
    const navLinks = document.querySelectorAll('#navbarNav .nav-link');
    const menuContainer = document.getElementById('navbarNav');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuContainer && menuContainer.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(menuContainer) || new bootstrap.Collapse(menuContainer);
                bsCollapse.hide();
            }
        });
    });
}

// --- Modal & Search Logic ---

async function openProductModal(id) {
    const products = await fetchProducts();
    const product = products.find(p => String(p.id) === String(id));
    if (!product) return;

    const modalTitle = document.getElementById('modalTitle');
    const modalCategory = document.getElementById('modalCategory');
    const modalPrice = document.getElementById('modalPrice');
    const modalDesc = document.getElementById('modalDesc');
    const modalMainImg = document.getElementById('modalMainImg');

    if (modalTitle) modalTitle.innerText = product.title;
    if (modalCategory) modalCategory.innerText = product.category_id || product.category || '';
    if (modalPrice) modalPrice.innerText = `Rs. ${product.price}`;
    if (modalDesc) modalDesc.innerText = product.description || "A pure, traditionally crafted wood-pressed oil.";
    if (modalMainImg) modalMainImg.src = product.image_url || product.image || '';

    const thumbsContainer = document.getElementById('modalThumbnails');
    if (thumbsContainer) {
        thumbsContainer.innerHTML = '';

        let galleryImages = [];

        const rawGallery = product.gallery_urls || product.gallery || product.images;

        if (Array.isArray(rawGallery) && rawGallery.length > 0) {
            galleryImages = rawGallery;
        } else if (typeof rawGallery === 'string' && rawGallery.trim() !== '') {
            try {
                const parsed = JSON.parse(rawGallery);
                galleryImages = Array.isArray(parsed) ? parsed : rawGallery.split(',').map(img => img.trim());
            } catch (e) {
                galleryImages = rawGallery.split(',').map(img => img.trim());
            }
        }

        const mainImg = product.image_url || product.image;
        if (galleryImages.length === 0 && mainImg) {
            galleryImages = [mainImg];
        }

        if (galleryImages.length > 0 && modalMainImg) {
            modalMainImg.src = galleryImages[0];
        }

        galleryImages.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = `modal-thumbnail shadow-sm ${index === 0 ? 'active' : ''}`;
            thumb.onclick = () => {
                if (modalMainImg) modalMainImg.src = imgSrc;
                document.querySelectorAll('.modal-thumbnail').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbsContainer.appendChild(thumb);
        });
    }

    const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
    if (modalAddToCartBtn) {
        if (product.badge === "Sold Out") {
            modalAddToCartBtn.innerText = "Sold Out";
            modalAddToCartBtn.disabled = true;
            modalAddToCartBtn.style.opacity = "0.5";
        } else {
            modalAddToCartBtn.innerText = "Add to Cart";
            modalAddToCartBtn.disabled = false;
            modalAddToCartBtn.style.opacity = "1";
            modalAddToCartBtn.setAttribute('onclick', `handleAddToCart(event, '${product.id}')`);
        }
    }

    const modalElement = document.getElementById('productModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function handleSearch() {
    const searchModalElement = document.getElementById('searchModal');
    if (!searchModalElement) return;

    const modal = new bootstrap.Modal(searchModalElement);
    const searchInput = document.getElementById('searchInput');
    const searchStatus = document.getElementById('search-status');

    if (searchInput) searchInput.value = '';
    if (searchStatus) searchStatus.innerText = 'Suggested Products';

    fetchProducts().then(products => {
        renderSearchResults(products.slice(0, 4));
        modal.show();
        if (searchInput) setTimeout(() => searchInput.focus(), 500);
    });
}

async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const products = await fetchProducts();

    if (query.trim() === '') {
        const searchStatus = document.getElementById('search-status');
        if (searchStatus) searchStatus.innerText = 'Suggested Products';
        renderSearchResults(products.slice(0, 4));
        return;
    }

    const results = products.filter(p => {
        const titleMatch = p.title && p.title.toLowerCase().includes(query);
        const catMatch = (p.category_id && p.category_id.toLowerCase().includes(query)) ||
            (p.category && p.category.toLowerCase().includes(query));
        return titleMatch || catMatch;
    });

    const searchStatus = document.getElementById('search-status');
    if (searchStatus) searchStatus.innerText = `Search Results (${results.length})`;
    renderSearchResults(results);
}

function renderSearchResults(results) {
    const grid = document.getElementById('search-results-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (results.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center py-4 text-muted">No products found.</div>`;
        return;
    }

    results.forEach(product => {
        grid.innerHTML += `
            <div class="col-6 col-md-3">
                <div class="card border-0 shadow-sm h-100" style="cursor:pointer;" onclick="const m = bootstrap.Modal.getInstance(document.getElementById('searchModal')); if(m) m.hide(); openProductModal('${product.id}');">
                    <img src="${product.image_url || product.image || ''}" class="card-img-top" style="height:120px; object-fit:cover;" alt="${product.title}">
                    <div class="card-body p-2 text-center">
                        <h6 class="card-title small fw-bold mb-1 text-truncate">${product.title}</h6>
                        <p class="text-primary-accent small fw-bold mb-0">Rs. ${product.price}</p>
                    </div>
                </div>
            </div>
        `;
    });
}

// --- Cart & Messaging Handlers ---

async function handleAddToCart(event, productId) {
    if (event) event.stopPropagation();

    try {
        let session = null;
        if (typeof supabaseClient !== 'undefined') {
            const { data } = await supabaseClient.auth.getSession();
            session = data.session;
        }

        if (session && session.user) {
            // OPTION A: LOGGED-IN USER (Supabase DB with Fallback)
            const userId = session.user.id;

            const { data: existing, error: selectError } = await supabaseClient
                .from('cart_items')
                .select('*')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .maybeSingle();

            if (!selectError) {
                if (existing) {
                    await supabaseClient
                        .from('cart_items')
                        .update({ quantity: existing.quantity + 1 })
                        .eq('id', existing.id);
                } else {
                    await supabaseClient
                        .from('cart_items')
                        .insert([{ user_id: userId, product_id: productId, quantity: 1 }]);
                }
            } else {
                await addProductToLocalStorage(`gsk_cart_${userId}`, productId);
            }
        } else {
            // OPTION B: GUEST USER (LocalStorage)
            await addProductToLocalStorage('gsk_cart_guest', productId);
        }
    } catch (err) {
        console.error("Cart action failed, falling back to LocalStorage:", err);
        const key = await getCartKey();
        await addProductToLocalStorage(key, productId);
    }

    await updateCartBadge();

    // UI Feedback Animation
    const button = event ? (event.target.tagName === 'BUTTON' ? event.target : event.target.closest('button')) : null;
    if (button) {
        const originalText = button.innerText;
        button.innerText = "✓ Added";
        button.classList.add('btn-added');
        setTimeout(() => {
            button.innerText = originalText;
            button.classList.remove('btn-added');
        }, 1500);
    }
}

async function addProductToLocalStorage(cartKey, productId) {
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const existingItem = cart.find(item => String(item.id) === String(productId));

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const products = await fetchProducts();
        const product = products.find(p => String(p.id) === String(productId));
        if (product) {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image_url || product.image || '',
                category: product.category_id || product.category || 'General',
                quantity: 1
            });
        }
    }
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

async function updateCartBadge() {
    let totalItems = 0;

    try {
        let session = null;
        if (typeof supabaseClient !== 'undefined') {
            const { data } = await supabaseClient.auth.getSession();
            session = data?.session;
        }

        if (session && session.user) {
            const { data: dbItems, error } = await supabaseClient
                .from('cart_items')
                .select('quantity')
                .eq('user_id', session.user.id);

            if (!error && dbItems) {
                totalItems = dbItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            } else {
                const cartKey = `gsk_cart_${session.user.id}`;
                const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
                totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            }
        } else {
            const cart = JSON.parse(localStorage.getItem('gsk_cart_guest')) || [];
            totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        }
    } catch (err) {
        const cartKey = await getCartKey();
        const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }

    const badge = document.getElementById('cart-badge');
    if (badge) {
        if (totalItems > 0) {
            badge.innerText = totalItems;
            badge.style.display = 'inline-block';
        } else {
            badge.innerText = '0';
            badge.style.display = 'none';
        }
    }
}

// Contact Form Integration
// Contact Form Integration
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const fName = document.getElementById('contactFName')?.value.trim();
        const lName = document.getElementById('contactLName')?.value.trim();
        const email = document.getElementById('contactEmail')?.value.trim();
        const msg = document.getElementById('contactMsg')?.value.trim();

        if (!fName || !lName || !email || !msg) {
            alert("Please fill in all fields.");
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Sending...";
        }

        try {
            if (typeof supabaseClient !== 'undefined') {
                const { error } = await supabaseClient.from('messages').insert([
                    {
                        first_name: fName,
                        last_name: lName,
                        email: email,
                        message: msg
                    }
                ]);

                if (error) throw error;
            }

            const successMsg = document.getElementById('msgSuccess');
            if (successMsg) {
                successMsg.classList.remove('d-none');
                setTimeout(() => successMsg.classList.add('d-none'), 4000);
            }
            this.reset();
        } catch (err) {
            console.error("Failed to submit contact form message to Supabase:", err);
            alert("Failed to send message: " + (err.message || "Please try again."));
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "Send Message";
            }
        }
    });
}

// Window Scroll Effect
window.addEventListener('scroll', function () {
    const navbar = document.getElementById('main-nav');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await renderCategories();
    await renderProducts('all');
    await updateCartBadge();
    initMobileMenuAutoClose();
});