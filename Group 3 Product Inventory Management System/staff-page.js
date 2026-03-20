$(document).ready(function () {

    // --- Auth guard ---
    let currentRole = StorageManager.load("currentRole", null);
    if (currentRole !== "Staff") {
        window.location.href = "index.html";
        return;
    }

    // Initialize request ID counter
    if (!localStorage.getItem("requestId")) {
        localStorage.setItem("requestId", 1);
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

        $(".page-content.active").fadeOut(150, function () {
            $(".page-content").removeClass("active");
            $("#" + pageName).addClass("active").hide().fadeIn(200);
            loadPage(pageName);
        });
    });

    // --- Search and filter (live) ---
    $("#searchInput").on("input", function () {
        filterInventory();
    });

    $("#stockFilter").change(function () {
        filterInventory();
    });

    // --- Show product info when a product is selected ---
    $("#saleProduct").change(function () {
        updateSaleInfo();
    });

    // --- Recalculate total when quantity changes ---
    $("#saleQuantity").on("input", function () {
        updateSaleInfo();
        $("#saleQuantityError").text("");
    });

    // --- Clear errors on input ---
    $("#saleProduct").change(function () { $("#saleProductError").text(""); });
    $("#restockProduct").change(function () { $("#restockProductError").text(""); });
    $("#restockQuantity").on("input", function () { $("#restockQuantityError").text(""); });
    $("#profileUsername").on("input", function () { $("#profileUsernameError").text(""); });
    $("#profilePassword").on("input", function () { $("#profilePasswordError").text(""); });

    // --- Buttons ---
    $("#recordSaleBtn").click(function () { recordSale(); });
    $("#sendRequestBtn").click(function () { sendRestockRequest(); });
    $("#saveProfileBtn").click(function () { saveProfile(); });

    // --- Logout ---
    $("#logoutBtn").click(function () {
        StorageManager.remove("currentRole");
        StorageManager.remove("currentUser");
        window.location.href = "index.html";
    });

    // --- Load all pages on start ---
    loadDashboard();
    loadInventory();
    loadSalesPage();
    loadRestockPage();
    loadUserProfile();
});

function loadPage(pageName) {
    if (pageName === "dashboard") {
        loadDashboard();
    } else if (pageName === "inventory") {
        loadInventory();
    } else if (pageName === "sales") {
        loadSalesPage();
    } else if (pageName === "restock") {
        loadRestockPage();
    } else if (pageName === "profile") {
        loadUserProfile();
    }
}

// =====================
// DASHBOARD
// =====================
function loadDashboard() {
    let productsArray = StorageManager.load("Products", []);
    let requestsArray = StorageManager.load("Requests", []);

    let lowStock = 0;
    for (let i = 0; i < productsArray.length; i++) {
        if (productsArray[i].stock <= 10) {
            lowStock++;
        }
    }

    let pending = 0;
    for (let i = 0; i < requestsArray.length; i++) {
        if (requestsArray[i].status === "PENDING") {
            pending++;
        }
    }

    $("#totalProducts").text(productsArray.length);
    $("#lowStockCount").text(lowStock);
    $("#pendingRequests").text(pending);
}

// =====================
// INVENTORY VIEW
// =====================
function loadInventory() {
    let productsArray = StorageManager.load("Products", []);
    renderInventoryTable(productsArray);
}

function filterInventory() {
    let searchText = $("#searchInput").val().toLowerCase();
    let stockFilter = $("#stockFilter").val();
    let productsArray = StorageManager.load("Products", []);
    let filtered = [];

    for (let i = 0; i < productsArray.length; i++) {
        let product = productsArray[i];
        let nameMatch = product.productName.toLowerCase().indexOf(searchText) !== -1;
        let categoryMatch = product.category.toLowerCase().indexOf(searchText) !== -1;
        let isLow = product.stock < 10;
        let statusMatch = stockFilter === "" ||
            (stockFilter === "low" && isLow) ||
            (stockFilter === "normal" && !isLow);

        if ((nameMatch || categoryMatch) && statusMatch) {
            filtered.push(product);
        }
    }

    renderInventoryTable(filtered);
}

function renderInventoryTable(productsArray) {
    let table = $("#productsTableBody");
    table.empty();

    if (productsArray.length === 0) {
        table.append("<tr><td colspan='6' style='text-align:center; padding:20px; color:#888;'>No products found.</td></tr>");
        return;
    }

    for (let i = 0; i < productsArray.length; i++) {
        let product = productsArray[i];
        let status = getStatusBadge(product.stock);

        let imageCell = product.imageUrl
            ? "<img src='" + product.imageUrl + "' alt='img' style='width:36px;height:36px;object-fit:cover;border-radius:4px;' onerror=\"this.style.display='none';this.nextSibling.style.display='inline';\" /><span style='display:none;color:#aaa;font-size:11px;'>No image</span>"
            : "<span style='color:#aaa;font-size:11px;'>No image</span>";

        let row = "<tr>" +
            "<td>" + imageCell + "</td>" +
            "<td>" + product.productName + "</td>" +
            "<td>" + product.category + "</td>" +
            "<td>₱" + parseFloat(product.price).toFixed(2) + "</td>" +
            "<td>" + product.stock + "</td>" +
            "<td>" + status + "</td>" +
        "</tr>";

        table.append(row);
    }
}

// =====================
// SALES TRANSACTION
// =====================
function loadSalesPage() {
    let productsArray = StorageManager.load("Products", []);
    let salesArray = StorageManager.load("Sales", []);

    // Populate product dropdown
    let select = $("#saleProduct");
    select.find("option:not(:first)").remove();

    for (let i = 0; i < productsArray.length; i++) {
        let p = productsArray[i];
        select.append("<option value='" + p.productName + "'>" + p.productName + " (Stock: " + p.stock + ")</option>");
    }

    // Load sales table (newest first)
    let table = $("#salesTableBody");
    table.empty();

    let reversed = salesArray.slice().reverse();

    if (reversed.length === 0) {
        table.append("<tr><td colspan='6' style='text-align:center; padding:20px; color:#888;'>No sales recorded yet.</td></tr>");
        return;
    }

    for (let i = 0; i < reversed.length; i++) {
        let sale = reversed[i];

        // Find matching product image
        let imageCell = "<span style='color:#aaa;font-size:11px;'>No image</span>";
        for (let j = 0; j < productsArray.length; j++) {
            if (productsArray[j].productName === sale.productName && productsArray[j].imageUrl) {
                imageCell = "<img src='" + productsArray[j].imageUrl + "' alt='img' style='width:36px;height:36px;object-fit:cover;border-radius:4px;' onerror=\"this.style.display='none';this.nextSibling.style.display='inline';\" /><span style='display:none;color:#aaa;font-size:11px;'>No image</span>";
                break;
            }
        }

        let row = "<tr>" +
            "<td>" + (sale.transactionId || "—") + "</td>" +
            "<td>" + imageCell + "</td>" +
            "<td>" + sale.date + "</td>" +
            "<td>" + sale.productName + "</td>" +
            "<td>" + sale.quantity + "</td>" +
            "<td>₱" + parseFloat(sale.amount || 0).toFixed(2) + "</td>" +
        "</tr>";
        table.append(row);
    }
}

function updateSaleInfo() {
    let name = $("#saleProduct").val();
    let qty = parseInt($("#saleQuantity").val()) || 0;
    let productsArray = StorageManager.load("Products", []);

    for (let i = 0; i < productsArray.length; i++) {
        if (productsArray[i].productName === name) {
            let product = productsArray[i];
            $("#currentStock").text(product.stock);
            $("#productPrice").text(parseFloat(product.price).toFixed(2));
            $("#saleTotal").text((qty * product.price).toFixed(2));
            $("#productInfo").slideDown(200);
            return;
        }
    }

    // No product selected
    $("#productInfo").slideUp(200);
}

function recordSale() {
    let valid = true;
    $("#saleProductError, #saleQuantityError").text("");

    let name = $("#saleProduct").val();
    let quantity = parseInt($("#saleQuantity").val());

    if (name === "") {
        $("#saleProductError").text("Please select a product.");
        valid = false;
    }
    if (isNaN(quantity) || quantity <= 0) {
        $("#saleQuantityError").text("Please enter a valid quantity (minimum 1).");
        valid = false;
    }
    if (!valid) return;

    let productsArray = StorageManager.load("Products", []);
    let salesArray = StorageManager.load("Sales", []);
    let transactionsArray = StorageManager.load("Transactions", []);

    for (let i = 0; i < productsArray.length; i++) {
        if (productsArray[i].productName === name) {
            if (quantity > productsArray[i].stock) {
                $("#saleQuantityError").text("Not enough stock. Only " + productsArray[i].stock + " available.");
                return;
            }

            productsArray[i].stock -= quantity;

            let txnId = Number(localStorage.getItem("transactionId"));
            let sale = new Transaction(
                txnId, new Date().toLocaleDateString(),
                name, quantity,
                quantity * productsArray[i].price,
                "Sales"
            );
            localStorage.setItem("transactionId", txnId + 1);

            salesArray.push(sale);
            transactionsArray.push(sale);

            StorageManager.save("Products", productsArray);
            StorageManager.save("Sales", salesArray);
            StorageManager.save("Transactions", transactionsArray);

            showToast("Sale recorded: " + quantity + "x " + name);

            // Reset form
            $("#saleProduct").val("");
            $("#saleQuantity").val("");
            $("#productInfo").slideUp(200);

            loadSalesPage();
            loadInventory();
            loadDashboard();
            return;
        }
    }
}

// =====================
// RESTOCK REQUEST
// =====================
function loadRestockPage() {
    let productsArray = StorageManager.load("Products", []);
    let requestsArray = StorageManager.load("Requests", []);

    // Populate product dropdown
    let select = $("#restockProduct");
    select.find("option:not(:first)").remove();

    for (let i = 0; i < productsArray.length; i++) {
        let p = productsArray[i];
        select.append("<option value='" + p.productName + "'>" + p.productName + "</option>");
    }

    // Load requests table (newest first)
    let table = $("#requestsTableBody");
    table.empty();

    let reversed = requestsArray.slice().reverse();

    if (reversed.length === 0) {
        table.append("<tr><td colspan='4' style='text-align:center; padding:20px; color:#888;'>No requests yet.</td></tr>");
        return;
    }

    for (let i = 0; i < reversed.length; i++) {
        let req = reversed[i];
        let statusBadge = req.status === "PENDING"
            ? "<span class='badge badge-yellow'>PENDING</span>"
            : "<span class='badge badge-green'>DELIVERED</span>";

        let row = "<tr>" +
            "<td>" + req.date + "</td>" +
            "<td>" + req.productName + "</td>" +
            "<td>" + req.quantity + "</td>" +
            "<td>" + statusBadge + "</td>" +
        "</tr>";

        table.append(row);
    }
}

function sendRestockRequest() {
    let valid = true;
    $("#restockProductError, #restockQuantityError").text("");

    let name = $("#restockProduct").val();
    let quantity = parseInt($("#restockQuantity").val());

    if (name === "") {
        $("#restockProductError").text("Please select a product.");
        valid = false;
    }
    if (isNaN(quantity) || quantity <= 0) {
        $("#restockQuantityError").text("Please enter a valid quantity (minimum 1).");
        valid = false;
    }
    if (!valid) return;

    let requestsArray = StorageManager.load("Requests", []);
    let requestId = Number(localStorage.getItem("requestId"));

    requestsArray.push(new Request(
        requestId,
        new Date().toLocaleDateString(),
        name, quantity, "PENDING"
    ));

    StorageManager.save("Requests", requestsArray);
    localStorage.setItem("requestId", requestId + 1);

    showToast("Restock request sent for " + name + "!");

    // Reset form
    $("#restockProduct").val("");
    $("#restockQuantity").val("");

    loadRestockPage();
    loadDashboard();
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

    let currentUser = StorageManager.load("currentUser", null);
    let staffArray = StorageManager.load("Staff", []);

    currentUser.username = newUsername;
    if (newPassword !== "") currentUser.password = newPassword;

    for (let i = 0; i < staffArray.length; i++) {
        if (staffArray[i].staffId === currentUser.staffId) {
            staffArray[i].username = newUsername;
            if (newPassword !== "") staffArray[i].password = newPassword;
        }
    }

    StorageManager.save("Staff", staffArray);
    StorageManager.save("currentUser", currentUser);
    showToast("Profile updated successfully!");
    $("#profilePassword").val("");
}

// =====================
// HELPERS
// =====================
function getStatusBadge(stock) {
    if (stock === 0) return "<span class='badge badge-red'>Out of Stock</span>";
    if (stock < 5) return "<span class='badge badge-red'>Critical</span>";
    if (stock < 10) return "<span class='badge badge-yellow'>Low Stock</span>";
    return "<span class='badge badge-green'>Normal</span>";
}

function showToast(message) {
    $("#toast").text(message).fadeIn(300);
    setTimeout(function () {
        $("#toast").fadeOut(400);
    }, 2500);
}