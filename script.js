let storeData = { categories: [], products: [] };
let cart = [];
let currentCategory = 'all';

// Logo 10-Click Counter State
let clickCount = 0;
let clickTimer = null;

// Fetch db.json on page load
document.addEventListener("DOMContentLoaded", () => {
    fetch('db.json')
        .then(response => {
            if (!response.ok) throw new Error("Failed to load db.json");
            return response.json();
        })
        .then(data => {
            // LocalStorage check karein agar admin ne koi naya data save kiya ho
            const savedData = localStorage.getItem('affiCartData');
            storeData = savedData ? JSON.parse(savedData) : data;

            renderCategories();
            renderProducts(storeData.products);
        })
        .catch(error => {
            console.error("Error loading JSON:", error);
            document.getElementById('productGrid').innerHTML = `<p class="col-span-full text-center text-red-500">db.json load karne me error aayi. Please local server (Live Server) use karein.</p>`;
        });
});

function handleLogoClick() {
    clickCount++;
    clearTimeout(clickTimer);
    
    if (clickCount >= 10) {
        clickCount = 0;
        document.getElementById('loginModal').classList.remove('hidden');
    } else {
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 1000);
    }
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
}

function verifyAdminLogin() {
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value.trim();

    if (user === 'admin' && pass === 'admin@123') {
        closeLoginModal();
        document.getElementById('jsonInput').value = JSON.stringify(storeData, null, 2);
        document.getElementById('adminModal').classList.remove('hidden');
    } else {
        alert("Galat Username ya Password hai!");
    }
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

function saveJsonData() {
    try {
        const parsed = JSON.parse(document.getElementById('jsonInput').value);
        if (!parsed.categories || !parsed.products) {
            throw new Error("JSON me 'categories' aur 'products' dono hona zaroori hai.");
        }
        storeData = parsed;
        localStorage.setItem('affiCartData', JSON.stringify(storeData));
        alert("Store successfully update ho gaya!");
        closeAdminModal();
        renderCategories();
        renderProducts(storeData.products);
    } catch (err) {
        alert("Invalid JSON format! Error: " + err.message);
    }
}

// Render Categories
function renderCategories() {
    const container = document.getElementById('categoryContainer');
    if (!container) return;
    container.innerHTML = '';

    storeData.categories.forEach(cat => {
        const isActive = currentCategory === cat.id;
        const btnClass = isActive 
            ? "cat-btn bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition" 
            : "cat-btn bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap hover:bg-gray-300 transition";
        
        container.innerHTML += `<button onclick="filterCategory('${cat.id}')" class="${btnClass}">${cat.name}</button>`;
    });
}

// Render Products
function renderProducts(items) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!items || items.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-gray-500 py-10">Koi product nahi mila.</p>`;
        return;
    }

    items.forEach(product => {
        grid.innerHTML += `
            <div class="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between">
                <div>
                    <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded-lg mb-4">
                    <span class="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-semibold">${product.company}</span>
                    <h3 class="font-bold text-gray-800 mt-2 text-base">${product.name}</h3>
                    <p class="text-indigo-600 font-bold mt-1">₹${product.price}</p>
                </div>
                <div class="mt-4">
                    <button onclick="addToCart(${product.id})" class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
}

function filterCategory(category) {
    currentCategory = category;
    renderCategories();
    applyFilters();
}

function filterProducts() {
    applyFilters();
}

function applyFilters() {
    let filtered = storeData.products || [];
    const searchInput = document.getElementById('searchInput');
    const companyFilter = document.getElementById('companyFilter');
    
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const companyVal = companyFilter ? companyFilter.value : 'all';

    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }

    if (companyVal !== 'all') {
        filtered = filtered.filter(p => p.company === companyVal);
    }

    if (searchVal !== '') {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchVal) || p.company.toLowerCase().includes(searchVal));
    }

    renderProducts(filtered);
}

function addToCart(productId) {
    const product = storeData.products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    toggleCartModal();
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const mobileCartCount = document.getElementById('mobileCartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.innerText = totalCount;
    if (mobileCartCount) mobileCartCount.innerText = totalCount;

    if (cart.length === 0) {
        if (cartItems) cartItems.innerHTML = `<p class="text-gray-500 text-sm text-center py-4">Your cart is empty.</p>`;
        if (cartTotal) cartTotal.innerText = '₹0';
        return;
    }

    if (cartItems) cartItems.innerHTML = '';
    let totalPrice = 0;

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;
        if (cartItems) {
            cartItems.innerHTML += `
                <div class="py-3 flex justify-between items-center">
                    <div>
                        <h4 class="text-sm font-bold text-gray-800">${item.name}</h4>
                        <p class="text-xs text-gray-500">₹${item.price} x ${item.quantity}</p>
                    </div>
                    <span class="font-bold text-sm">₹${item.price * item.quantity}</span>
                </div>
            `;
        }
    });

    if (cartTotal) cartTotal.innerText = `₹${totalPrice}`;
}

function toggleCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) modal.classList.toggle('hidden');
}

function checkoutWhatsApp() {
    if (cart.length === 0) return alert("Aapki cart khali hai!");
    let message = "Namaste, mujhe ye products order karne hain:%0A%0A";
    let total = 0;

    cart.forEach(item => {
        message += `• *${item.name}* (Qty: ${item.quantity}) - ₹${item.price * item.quantity}%0A`;
        total += item.price * item.quantity;
    });
    message += `%0A*Kul Rashi (Total): ₹${total}*`;
    
    const whatsappNumber = "919876543210"; 
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
}

function checkoutAffiliate() {
    if (cart.length === 0) return alert("Aapki cart khali hai!");
    const targetUrl = cart[0].affiliateLink || "https://www.flipkart.com";
    window.open(targetUrl, '_blank');
}
