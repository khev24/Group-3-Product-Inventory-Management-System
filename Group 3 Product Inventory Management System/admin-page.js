// Tracks which product is being edited (-1 means we are adding a new one)
let selectedIndex = -1;

$(document).ready(function () {

    // --- Auth guard: redirect to login if not logged in as Admin ---
    let currentRole = StorageManager.load("currentRole", null);
    if (currentRole !== "Admin") {
        window.location.href = "index.html";
        return;
    }

    // Initialize product ID counter
    if (!localStorage.getItem("productId")) {
        localStorage.setItem("productId", 1);
    }

    // Initialize transaction ID counter
    if (!localStorage.getItem("transactionId")) {
        localStorage.setItem("transactionId", 1);
    }

    // Show greeting
    let currentUser = StorageManager.load("currentUser", null);
    if (currentUser) {
        $("#userGreeting").text("Hello, " + currentUser.name);
    }

    // --- Sidebar navigation ---
    $(".nav-item").click(function () {
        let pageName = $(this).data("page");

        $(".nav-item").removeClass("active");
        $(this).addClass("active");

        // Fade out current page, fade in new page
        $(".page-content.active").fadeOut(150, function () {
            $(".page-content").removeClass("active");
            $("#" + pageName).addClass("active").hide().fadeIn(200);
            loadPage(pageName);
        });
    });

    // --- Modal open/close ---
    $("#addProductBtn").click(function () {
        selectedIndex = -1;
        $("#productModalTitle").text("Add Product");
        clearProductForm();
        openModal();
    });

    $("#closeModal, #cancelModal").click(function () {
        closeModal();
    });

    // Close modal when clicking outside of it
    $("#productModal").click(function (e) {
        if ($(e.target).attr("id") === "productModal") {
            closeModal();
        }
    });

    // --- Save product ---
    $("#saveProductBtn").click(function () {
        saveProduct();
    });

    // --- Search and filter (live search as user types) ---
    $("#inventorySearch").on("input", function () {
        filterInventory();
    });

    $("#categoryFilter").change(function () {
        filterInventory();
    });

    // --- Transaction filter ---
    $("#transactionFilter").change(function () {
        loadTransactions();
    });

    // --- Profile: clear errors on input ---
    $("#profileUsername").on("input", function () { $("#profileUsernameError").text(""); });
    $("#profilePassword").on("input", function () { $("#profilePasswordError").text(""); });

    // --- Save profile ---
    $("#saveProfileBtn").click(function () {
        saveProfile();
    });

    // --- Settings buttons ---
    $("#clearAppDataBtn").click(function () {
        if (confirm("This will delete all products, transactions, and requests. User accounts will be kept. Continue?")) {
            StorageManager.clearAppData();
            showToast("App data cleared successfully.");
            loadDashboard();
        }
    });

    $("#factoryResetBtn").click(function () {
        if (confirm("WARNING: This will delete EVERYTHING including user accounts. You will be logged out. Are you sure?")) {
            StorageManager.clearAll();
            window.location.href = "index.html";
        }
    });

    // --- Logout ---
    $("#logoutBtn").click(function () {
        StorageManager.remove("currentRole");
        StorageManager.remove("currentUser");
        window.location.href = "index.html";
    });

    // --- Load all pages on start ---
    loadDashboard();
    loadInventory();
    loadStockMonitoring();
    loadTransactions();
    loadReports();
    loadUserProfile();
    initializeDummyData();
});

// Create dummy data in the inventory
function initializeDummyData() {
    if (StorageManager.load("Products", []).length === 0) {
        StorageManager.save("Products", [
            new Product(1, "Coca-Cola 1.5L", "Beverages", 75, 20, "https://res.cloudinary.com/druzooo6r/image/upload/v1773992570/SM9083975-12_cay1i8.jpg"),
            new Product(2, "Lucky Me Pancit Canton", "Instant Noodles", 15, 50, "https://res.cloudinary.com/druzooo6r/image/upload/v1773992571/images_dp3euk.jpg"),
            new Product(3, "Bear Brand Milk", "Dairy", 35, 8, "https://res.cloudinary.com/druzooo6r/image/upload/v1773992576/7585674564-scaled_f9qtoo.jpg"),
            new Product(4, "Gardenia Bread", "Bakery", 65, 5, "https://res.cloudinary.com/druzooo6r/image/upload/v1773992580/images_1_rcebhd.jpg"),
            new Product(5, "Safeguard Soap", "Personal Care", 45, 12, "https://res.cloudinary.com/druzooo6r/image/upload/v1773992579/SM2091839-1-3_a96w09.jpg")
        ]);
        localStorage.setItem("productId", 6);
    }

    if (StorageManager.load("Transactions", []).length === 0) {
        StorageManager.save("Transactions", [
            {
                transactionId: 1,
                date: "2026-03-19",
                productName: "Coca-Cola 1.5L",
                type: "Sales",
                quantity: 2,
                amount: 150
            },
            {
                transactionId: 2,
                date: "2026-03-19",
                productName: "Lucky Me Pancit Canton",
                type: "Restocking",
                quantity: 20,
                amount: 0
            }
        ]);
        localStorage.setItem("transactionId", 3);
    }
}

// Calls the correct load function based on which page is selected
function loadPage(pageName) {
    if (pageName === "dashboard") {
        loadDashboard();
    } else if (pageName === "inventory") {
        loadInventory();
    } else if (pageName === "stock") {
        loadStockMonitoring();
    } else if (pageName === "transactions") {
        loadTransactions();
    } else if (pageName === "reports") {
        loadReports();
    } else if (pageName === "profile") {
        loadUserProfile();
    }
    // settings page has no load function needed
}

// =====================
// DASHBOARD
// =====================
function loadDashboard() {
    let productsArray = StorageManager.load("Products", []);
    let transactionsArray = StorageManager.load("Transactions", []);

    let lowStockCount = 0;
    for (let i = 0; i < productsArray.length; i++) {
        if (productsArray[i].stock <= 10) {
            lowStockCount++;
        }
    }

    $("#totalProducts").text(productsArray.length);
    $("#lowStockCount").text(lowStockCount);
    $("#totalTransactions").text(transactionsArray.length);
}

// =====================
// INVENTORY
// =====================
function loadInventory() {
    let productsArray = StorageManager.load("Products", []);

    // Populate category filter dropdown
    let categoryFilter = $("#categoryFilter");
    let currentFilterValue = categoryFilter.val();
    categoryFilter.find("option:not(:first)").remove();

    for (let i = 0; i < productsArray.length; i++) {
        let cat = productsArray[i].category;
        // Only add category if it's not already in the dropdown
        if (categoryFilter.find("option[value='" + cat + "']").length === 0) {
            categoryFilter.append("<option value='" + cat + "'>" + cat + "</option>");
        }
    }

    // Restore previously selected filter
    categoryFilter.val(currentFilterValue);

    renderProductTable(productsArray);
}

function filterInventory() {
    let searchText = $("#inventorySearch").val().toLowerCase();
    let categoryValue = $("#categoryFilter").val().toLowerCase();
    let productsArray = StorageManager.load("Products", []);
    let filtered = [];

    for (let i = 0; i < productsArray.length; i++) {
        let product = productsArray[i];
        let nameMatch = product.productName.toLowerCase().indexOf(searchText) !== -1;
        let categoryMatch = product.category.toLowerCase().indexOf(searchText) !== -1;
        let filterMatch = categoryValue === "" || product.category.toLowerCase() === categoryValue;

        if ((nameMatch || categoryMatch) && filterMatch) {
            filtered.push(product);
        }
    }

    renderProductTable(filtered);
}

function renderProductTable(productsArray) {
    let table = $("#productsTableBody");
    table.empty();

    if (productsArray.length === 0) {
        table.append("<tr><td colspan='8' style='text-align:center; padding:20px; color:#888;'>No products found.</td></tr>");
        return;
    }

    // We need the real index from the full array for edit/delete
    let allProducts = StorageManager.load("Products", []);

    for (let i = 0; i < productsArray.length; i++) {
        let product = productsArray[i];
        let realIndex = -1;

        // Find the real index in the full array using productId
        for (let j = 0; j < allProducts.length; j++) {
            if (allProducts[j].productId === product.productId) {
                realIndex = j;
                break;
            }
        }

        let status = getStatusBadge(product.stock);

        // Show image thumbnail if imageUrl exists, otherwise show placeholder text
        let imageCell = product.imageUrl
            ? "<img src='" + product.imageUrl + "' alt='img' style='width:40px;height:40px;object-fit:cover;border-radius:4px;' onerror=\"this.style.display='none';this.nextSibling.style.display='inline';\" /><span style='display:none;color:#aaa;font-size:11px;'>No image</span>"
            : "<span style='color:#aaa;font-size:11px;'>No image</span>";

        let row = "<tr>" +
            "<td>" + product.productId + "</td>" +
            "<td>" + imageCell + "</td>" +
            "<td>" + product.productName + "</td>" +
            "<td>" + product.category + "</td>" +
            "<td>₱" + parseFloat(product.price).toFixed(2) + "</td>" +
            "<td>" + product.stock + "</td>" +
            "<td>" + status + "</td>" +
            "<td>" +
                "<button class='btn btn-success btn-sm' onclick='editProduct(" + realIndex + ")'>Edit</button> " +
                "<button class='btn btn-danger btn-sm' onclick='deleteProduct(" + realIndex + ")'>Delete</button>" +
            "</td>" +
        "</tr>";

        table.append(row);
    }
}

// =====================
// STOCK MONITORING
// =====================
function loadStockMonitoring() {
    let productsArray = StorageManager.load("Products", []);
    let table = $("#stockTableBody");
    table.empty();

    if (productsArray.length === 0) {
        table.append("<tr><td colspan='5' style='text-align:center; padding:20px; color:#888;'>No products to monitor.</td></tr>");
        return;
    }

    for (let i = 0; i < productsArray.length; i++) {
        let product = productsArray[i];
        let status = getStatusBadge(product.stock);
        let alert = getAlertBadge(product.stock);

        let imageCell = product.imageUrl
            ? "<img src='" + product.imageUrl + "' alt='img' style='width:36px;height:36px;object-fit:cover;border-radius:4px;' onerror=\"this.style.display='none';this.nextSibling.style.display='inline';\" /><span style='display:none;color:#aaa;font-size:11px;'>No image</span>"
            : "<span style='color:#aaa;font-size:11px;'>No image</span>";

        let row = "<tr>" +
            "<td>" + imageCell + "</td>" +
            "<td>" + product.productName + "</td>" +
            "<td>" + product.category + "</td>" +
            "<td>" + product.stock + "</td>" +
            "<td>" + status + "</td>" +
            "<td>" + alert + "</td>" +
        "</tr>";

        table.append(row);
    }
}

// =====================
// ADD / EDIT / DELETE PRODUCT
// =====================
function saveProduct() {
    // Validate form inputs
    let valid = true;

    let name = $("#productName").val().trim();
    let category = $("#productCategory").val().trim();
    let price = $("#productPrice").val();
    let stock = $("#productStock").val();
    let imageUrl = $("#productImageUrl").val().trim();

    // Clear previous errors
    $("#productNameError, #productCategoryError, #productPriceError, #productStockError").text("");

    if (name === "") {
        $("#productNameError").text("Product name is required.");
        valid = false;
    }
    if (category === "") {
        $("#productCategoryError").text("Category is required.");
        valid = false;
    }
    if (price === "" || isNaN(price) || parseFloat(price) < 0) {
        $("#productPriceError").text("Please enter a valid price.");
        valid = false;
    }
    if (stock === "" || isNaN(stock) || parseInt(stock) < 0) {
        $("#productStockError").text("Please enter a valid stock amount.");
        valid = false;
    }

    if (!valid) return;

    let productsArray = StorageManager.load("Products", []);

    if (selectedIndex !== -1) {
        // Update existing product
        productsArray[selectedIndex].productName = name;
        productsArray[selectedIndex].category = category;
        productsArray[selectedIndex].price = parseFloat(price);
        productsArray[selectedIndex].stock = parseInt(stock);
        productsArray[selectedIndex].imageUrl = imageUrl;

        showToast("Product updated successfully!");
    } else {
        // Add new product
        let productId = Number(localStorage.getItem("productId"));
        productsArray.push(new Product(productId, name, category, parseFloat(price), parseInt(stock), imageUrl));
        localStorage.setItem("productId", productId + 1);

        showToast("Product added successfully!");
    }

    StorageManager.save("Products", productsArray);
    closeModal();
    loadInventory();
    loadDashboard();
    loadStockMonitoring();
}

function editProduct(index) {
    let productsArray = StorageManager.load("Products", []);
    if (!productsArray[index]) return;

    selectedIndex = index;
    let product = productsArray[index];

    $("#productModalTitle").text("Edit Product");
    $("#productName").val(product.productName);
    $("#productCategory").val(product.category);
    $("#productPrice").val(product.price);
    $("#productStock").val(product.stock);
    $("#productImageUrl").val(product.imageUrl || "");

    // Clear any old errors
    $("#productNameError, #productCategoryError, #productPriceError, #productStockError").text("");

    openModal();
}

function deleteProduct(index) {
    let productsArray = StorageManager.load("Products", []);
    if (!productsArray[index]) return;

    if (!confirm("Delete \"" + productsArray[index].productName + "\"? This cannot be undone.")) {
        return;
    }

    productsArray.splice(index, 1);
    StorageManager.save("Products", productsArray);

    showToast("Product deleted.");
    loadInventory();
    loadDashboard();
    loadStockMonitoring();
}

// =====================
// TRANSACTIONS
// =====================
function loadTransactions() {
    let filter = $("#transactionFilter").val();
    let transactionsArray = StorageManager.load("Transactions", []);
    let productsArray = StorageManager.load("Products", []);
    let table = $("#transactionsTableBody");
    table.empty();

    // Show newest first
    let reversed = transactionsArray.slice().reverse();
    let found = false;

    for (let i = 0; i < reversed.length; i++) {
        let t = reversed[i];
        if (filter === "" || t.type === filter) {
            let typeBadge = t.type === "Sales"
                ? "<span class='badge badge-green'>Sales</span>"
                : "<span class='badge badge-blue'>Restocking</span>";

            // Find matching product image
            let imageCell = "<span style='color:#aaa;font-size:11px;'>No image</span>";
            for (let j = 0; j < productsArray.length; j++) {
                if (productsArray[j].productName === t.productName && productsArray[j].imageUrl) {
                    imageCell = "<img src='" + productsArray[j].imageUrl + "' alt='img' style='width:36px;height:36px;object-fit:cover;border-radius:4px;' onerror=\"this.style.display='none';this.nextSibling.style.display='inline';\" /><span style='display:none;color:#aaa;font-size:11px;'>No image</span>";
                    break;
                }
            }

            let row = "<tr>" +
                "<td>" + (t.transactionId || "—") + "</td>" +
                "<td>" + imageCell + "</td>" +
                "<td>" + t.date + "</td>" +
                "<td>" + t.productName + "</td>" +
                "<td>" + typeBadge + "</td>" +
                "<td>" + t.quantity + "</td>" +
                "<td>" + (t.type === "Sales" ? "₱" + parseFloat(t.amount || 0).toFixed(2) : "—") + "</td>" +
            "</tr>";

            table.append(row);
            found = true;
        }
    }

    if (!found) {
        table.append("<tr><td colspan='7' style='text-align:center; padding:20px; color:#888;'>No transactions found.</td></tr>");
    }
}

// =====================
// REPORTS
// =====================
function loadReports() {
    let productsArray = StorageManager.load("Products", []);
    let transactionsArray = StorageManager.load("Transactions", []);

    let productSalesList = $("#productSalesList");
    let soldOutList = $("#soldOutList");
    productSalesList.empty();
    soldOutList.empty();

    let totalRevenue = 0;

    // Product sales summary
    for (let i = 0; i < productsArray.length; i++) {
        let product = productsArray[i];
        let totalQtySold = 0;

        for (let j = 0; j < transactionsArray.length; j++) {
            if (transactionsArray[j].productName === product.productName && transactionsArray[j].type === "Sales") {
                totalQtySold += transactionsArray[j].quantity;
            }
        }

        productSalesList.append(
            "<div class='report-item'>" +
                "<span>" + product.productName + "</span>" +
                "<strong>" + totalQtySold + " sold</strong>" +
            "</div>"
        );
    }

    if (productsArray.length === 0) {
        productSalesList.append("<p style='color:#888;'>No products yet.</p>");
    }

    // Sold out products
    let hasSoldOut = false;
    for (let i = 0; i < productsArray.length; i++) {
        if (productsArray[i].stock === 0) {
            soldOutList.append(
                "<div class='report-item'>" +
                    "<span>" + productsArray[i].productName + "</span>" +
                    "<span class='badge badge-red'>Out of Stock</span>" +
                "</div>"
            );
            hasSoldOut = true;
        }
    }
    if (!hasSoldOut) {
        soldOutList.append("<p style='color:#888;'>No sold-out products.</p>");
    }

    // Total revenue
    for (let i = 0; i < transactionsArray.length; i++) {
        if (transactionsArray[i].type === "Sales") {
            totalRevenue += parseFloat(transactionsArray[i].amount || 0);
        }
    }
    $("#totalRevenue").text("₱" + totalRevenue.toFixed(2));
}

// =====================
// USER PROFILE
// =====================
function loadUserProfile() {
    let currentUser = StorageManager.load("currentUser", null);
    if (!currentUser) return;

    $("#profileName").val(currentUser.name);
    $("#profileRole").val(currentUser.role);
    $("#profileUsername").val(currentUser.username);
    $("#profilePassword").val("");
}

function saveProfile() {
    let valid = true;
    $("#profileUsernameError, #profilePasswordError").text("");

    let newUsername = $("#profileUsername").val().trim();
    let newPassword = $("#profilePassword").val();

    if (newUsername === "") {
        $("#profileUsernameError").text("Username cannot be empty.");
        valid = false;
    } else if (newUsername.length < 3) {
        $("#profileUsernameError").text("Username must be at least 3 characters.");
        valid = false;
    }
    if (newPassword !== "" && newPassword.length < 6) {
        $("#profilePasswordError").text("Password must be at least 6 characters.");
        valid = false;
    }
    if (!valid) return;

    let role = StorageManager.load("currentRole", null);
    let currentUser = StorageManager.load("currentUser", null);

    currentUser.username = newUsername;
    if (newPassword !== "") {
        currentUser.password = newPassword;
    }

    if (role === "Admin") {
        StorageManager.save("Admin", currentUser);
    } else if (role === "Staff") {
        let staffArray = StorageManager.load("Staff", []);
        for (let i = 0; i < staffArray.length; i++) {
            if (staffArray[i].staffId === currentUser.staffId) {
                staffArray[i].username = newUsername;
                if (newPassword !== "") staffArray[i].password = newPassword;
            }
        }
        StorageManager.save("Staff", staffArray);
    } else if (role === "Supplier") {
        let supplierArray = StorageManager.load("Supplier", []);
        for (let i = 0; i < supplierArray.length; i++) {
            if (supplierArray[i].supplierId === currentUser.supplierId) {
                supplierArray[i].username = newUsername;
                if (newPassword !== "") supplierArray[i].password = newPassword;
            }
        }
        StorageManager.save("Supplier", supplierArray);
    }

    StorageManager.save("currentUser", currentUser);
    showToast("Profile updated successfully!");
    $("#profilePassword").val("");
}

// =====================
// MODAL HELPERS
// =====================
function openModal() {
    $("#productModal").addClass("active").hide().fadeIn(200);
}

function closeModal() {
    $("#productModal").fadeOut(200, function () {
        $(this).removeClass("active");
    });
}

function clearProductForm() {
    $("#productName, #productCategory, #productPrice, #productStock, #productImageUrl").val("");
    $("#productNameError, #productCategoryError, #productPriceError, #productStockError").text("");
}

// =====================
// BADGE HELPERS
// =====================
function getStatusBadge(stock) {
    if (stock === 0)
        return "<span class='badge badge-red'>Out of Stock</span>";
    if (stock < 5)
        return "<span class='badge badge-red'>Critical</span>";
    if (stock < 10)
        return "<span class='badge badge-yellow'>Low Stock</span>";
        return "<span class='badge badge-green'>Normal</span>";
}

function getAlertBadge(stock) {
    if (stock === 0)
        return "<span class='badge badge-red'>Out of Stock</span>";
    if (stock < 5)
        return "<span class='badge badge-red'>Critical</span>";
    if (stock < 10)
        return "<span class='badge badge-yellow'>Warning</span>";
        return "<span class='badge badge-green'>OK</span>";
}

// =====================
// TOAST NOTIFICATION
// =====================
function showToast(message) {
    $("#toast").text(message).fadeIn(300);
    setTimeout(function () {
        $("#toast").fadeOut(400);
    }, 2500);
}