$(document).ready(function () {

    // Clear errors when user types
    $("#username").on("input", function () {
        $("#usernameError").text("");
        $("#loginError").hide();
    });

    $("#password").on("input", function () {
        $("#passwordError").text("");
        $("#loginError").hide();
    });

    // Login button click
    $("#btnLogin").click(function () {

        // Step 1: Validate the form first
        let valid = true;

        let username = $("#username").val().trim();
        let password = $("#password").val();

        if (username === "") {
            $("#usernameError").text("Please enter your username.");
            valid = false;
        }

        if (password === "") {
            $("#passwordError").text("Please enter your password.");
            valid = false;
        }

        if (!valid) return;

        // Step 2: Check credentials against localStorage
        let adminData = StorageManager.load("Admin", null);
        let staffArray = StorageManager.load("Staff", []);
        let supplierArray = StorageManager.load("Supplier", []);

        // Check if Admin
        if (adminData !== null && username === adminData.username && password === adminData.password) {
            StorageManager.save("currentRole", "Admin");
            StorageManager.save("currentUser", adminData);
            showToast("Login successful! Welcome, " + adminData.name);
            setTimeout(function () {
                window.location.href = "admin-page.html";
            }, 800);
            return;
        }

        // Check if Staff
        for (let i = 0; i < staffArray.length; i++) {
            if (staffArray[i].username === username && staffArray[i].password === password) {
                StorageManager.save("currentRole", "Staff");
                StorageManager.save("currentUser", staffArray[i]);
                showToast("Login successful! Welcome, " + staffArray[i].name);
                setTimeout(function () {
                    window.location.href = "staff-page.html";
                }, 800);
                return;
            }
        }

        // Check if Supplier
        for (let i = 0; i < supplierArray.length; i++) {
            if (supplierArray[i].username === username && supplierArray[i].password === password) {
                StorageManager.save("currentRole", "Supplier");
                StorageManager.save("currentUser", supplierArray[i]);
                showToast("Login successful! Welcome, " + supplierArray[i].name);
                setTimeout(function () {
                    window.location.href = "supplier-page.html";
                }, 800);
                return;
            }
        }

        // If nothing matched, show error
        $("#loginError").text("Invalid username or password. Please try again.").slideDown(300);
        $("#password").val("");
    });

    // Allow pressing Enter on password field to login
    $("#password").keypress(function (e) {
        if (e.which === 13) {
            $("#btnLogin").click();
        }
    });

});

function showToast(message) {
    $("#toast").text(message).fadeIn(300);
    setTimeout(function () {
        $("#toast").fadeOut(400);
    }, 2500);
}
