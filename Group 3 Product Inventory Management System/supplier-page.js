$(document).ready(function () {

    // --- Auth guard ---
    let currentRole = StorageManager.load("currentRole", null);
    if (currentRole !== "Supplier") {
        window.location.href = "index.html";
        return;
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

    // --- Profile ---
    $("#profileUsername").on("input", function () { $("#profileUsernameError").text(""); });
    $("#profilePassword").on("input", function () { $("#profilePasswordError").text(""); });
    $("#saveProfileBtn").click(function () { saveProfile(); });

    // --- Logout ---
    $("#logoutBtn").click(function () {
        StorageManager.remove("currentRole");
        StorageManager.remove("currentUser");
        window.location.href = "index.html";
    });

    // --- Load all pages on start ---
    loadDashboard();
    loadRequests();
    loadDelivery();
    loadHistory();
    loadUserProfile();
});

function loadPage(pageName) {
    if (pageName === "dashboard") {
        loadDashboard();
    } else if (pageName === "requests") {
        loadRequests();
    } else if (pageName === "delivery") {
        loadDelivery();
    } else if (pageName === "history") {
        loadHistory();
    } else if (pageName === "profile") {
        loadUserProfile();
    }
}

// =====================
// DASHBOARD
// =====================
function loadDashboard() {
    let requestsArray = StorageManager.load("Requests", []);
    let pending = 0;
    let delivered = 0;

    for (let i = 0; i < requestsArray.length; i++) {
        if (requestsArray[i].status === "PENDING") {
            pending++;
        }
        if (requestsArray[i].status === "DELIVERED") {
            delivered++;
        }
    }

    $("#pendingCount").text(pending);
    $("#deliveredCount").text(delivered);
    $("#totalRequests").text(requestsArray.length);
}

// =====================
// RESTOCK REQUESTS
// =====================
function loadRequests() {
    let requestsArray = StorageManager.load("Requests", []);
    let productsArray = StorageManager.load("Products", []);
    let table = $("#requestsTableBody");
    table.empty();

    let hasPending = false;

    for (let i = 0; i < requestsArray.length; i++) {
        let req = requestsArray[i];
        if (req.status === "PENDING") {
            let imageCell = "<span style='color:#aaa;font-size:11px;'>No image</span>";
            for (let j = 0; j < productsArray.length; j++) {
                if (productsArray[j].productName === req.productName && productsArray[j].imageUrl) {
                    imageCell = "<img src='" + productsArray[j].imageUrl + "' alt='img' style='width:36px;height:36px;object-fit:cover;border-radius:4px;' onerror=\"this.style.display='none';this.nextSibling.style.display='inline';\" /><span style='display:none;color:#aaa;font-size:11px;'>No image</span>";
                    break;
                }
            }

            let row = "<tr>" +
                "<td>" + req.id + "</td>" +
                "<td>" + imageCell + "</td>" +
                "<td>" + req.productName + "</td>" +
                "<td>" + req.quantity + "</td>" +
                "<td><span class='badge badge-yellow'>PENDING</span></td>" +
                "<td>" + req.date + "</td>" +
            "</tr>";
            table.append(row);
            hasPending = true;
        }
    }

    if (!hasPending) {
        table.append("<tr><td colspan='6' style='text-align:center; padding:20px; color:#888;'>No pending requests.</td></tr>");
    }
}

// =====================
// DELIVERY MANAGEMENT
// =====================
function loadDelivery() {
    let requestsArray = StorageManager.load("Requests", []);
    let productsArray = StorageManager.load("Products", []);
    let table = $("#deliveryTableBody");
    table.empty();

    let hasPending = false;

    for (let i = 0; i < requestsArray.length; i++) {
        let req = requestsArray[i];
        if (req.status === "PENDING") {
            let imageCell = "<span style='color:#aaa;font-size:11px;'>No image</span>";
            for (let j = 0; j < productsArray.length; j++) {
                if (productsArray[j].productName === req.productName && productsArray[j].imageUrl) {
                    imageCell = "<img src='" + productsArray[j].imageUrl + "' alt='img' style='width:36px;height:36px;object-fit:cover;border-radius:4px;' onerror=\"this.style.display='none';this.nextSibling.style.display='inline';\" /><span style='display:none;color:#aaa;font-size:11px;'>No image</span>";
                    break;
                }
            }

            let row = "<tr>" +
                "<td>" + req.id + "</td>" +
                "<td>" + imageCell + "</td>" +
                "<td>" + req.productName + "</td>" +
                "<td>" + req.quantity + "</td>" +
                "<td><span class='badge badge-yellow'>PENDING</span></td>" +
                "<td><button class='btn btn-success btn-sm' onclick='deliverProducts(" + i + ")'>✓ Deliver</button></td>" +
            "</tr>";
            table.append(row);
            hasPending = true;
        }
    }

    if (!hasPending) {
        table.append("<tr><td colspan='6' style='text-align:center; padding:20px; color:#888;'>No pending deliveries.</td></tr>");
    }
}

function deliverProducts(index) {
    if (!confirm("Confirm delivery? This will update the product stock.")) {
        return;
    }

    let requestsArray = StorageManager.load("Requests", []);
    let productsArray = StorageManager.load("Products", []);
    let transactionsArray = StorageManager.load("Transactions", []);

    let request = requestsArray[index];
    if (!request || request.status !== "PENDING") {
        showToast("Request not found or already delivered.");
        return;
    }

    // Mark the request as delivered
    requestsArray[index].status = "DELIVERED";

    // Find the product by NAME (not by index - this was the original bug)
    let productFound = false;
    for (let i = 0; i < productsArray.length; i++) {
        if (productsArray[i].productName === request.productName) {
            productsArray[i].stock += request.quantity;
            productFound = true;
            break;
        }
    }

    if (!productFound) {
        showToast("Warning: Product not found in inventory.");
    }

    // Add a restocking transaction
    let txnId = Number(localStorage.getItem("transactionId") || 1);
    transactionsArray.push(new Transaction(
        txnId, new Date().toLocaleDateString(),
        request.productName,
        request.quantity, 0, "Restocking"
    ));
    localStorage.setItem("transactionId", txnId + 1);

    StorageManager.save("Requests", requestsArray);
    StorageManager.save("Products", productsArray);
    StorageManager.save("Transactions", transactionsArray);

    showToast("Delivered " + request.quantity + "x " + request.productName + "!");

    loadDelivery();
    loadDashboard();
    loadHistory();
}

// =====================
// SUPPLY HISTORY
// =====================
function loadHistory() {
    let requestsArray = StorageManager.load("Requests", []);
    let productsArray = StorageManager.load("Products", []);
    let table = $("#historyTableBody");
    table.empty();

    let hasDelivered = false;

    // Show newest first
    let reversed = requestsArray.slice().reverse();

    for (let i = 0; i < reversed.length; i++) {
        let req = reversed[i];
        if (req.status === "DELIVERED") {
            let imageCell = "<span style='color:#aaa;font-size:11px;'>No image</span>";
            for (let j = 0; j < productsArray.length; j++) {
                if (productsArray[j].productName === req.productName && productsArray[j].imageUrl) {
                    imageCell = "<img src='" + productsArray[j].imageUrl + "' alt='img' style='width:36px;height:36px;object-fit:cover;border-radius:4px;' onerror=\"this.style.display='none';this.nextSibling.style.display='inline';\" /><span style='display:none;color:#aaa;font-size:11px;'>No image</span>";
                    break;
                }
            }

            let row = "<tr>" +
                "<td>" + req.date + "</td>" +
                "<td>" + imageCell + "</td>" +
                "<td>" + req.productName + "</td>" +
                "<td>" + req.quantity + "</td>" +
                "<td><span class='badge badge-green'>DELIVERED</span></td>" +
            "</tr>";
            table.append(row);
            hasDelivered = true;
        }
    }

    if (!hasDelivered) {
        table.append("<tr><td colspan='5' style='text-align:center; padding:20px; color:#888;'>No deliveries yet.</td></tr>");
    }
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
    let supplierArray = StorageManager.load("Supplier", []);

    currentUser.username = newUsername;
    if (newPassword !== "") currentUser.password = newPassword;

    for (let i = 0; i < supplierArray.length; i++) {
        if (supplierArray[i].supplierId === currentUser.supplierId) {
            supplierArray[i].username = newUsername;
            if (newPassword !== "") supplierArray[i].password = newPassword;
        }
    }

    StorageManager.save("Supplier", supplierArray);
    StorageManager.save("currentUser", currentUser);
    showToast("Profile updated successfully!");
    $("#profilePassword").val("");
}

// =====================
// HELPERS
// =====================
function showToast(message) {
    $("#toast").text(message).fadeIn(300);
    setTimeout(function () {
        $("#toast").fadeOut(400);
    }, 2500);
}