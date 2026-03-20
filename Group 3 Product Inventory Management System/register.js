$(document).ready(function () {

    // Initialize ID counters if they don't exist yet
    if (!localStorage.getItem("staffId")) {
        localStorage.setItem("staffId", 1);
    }
    if (!localStorage.getItem("supplierId")) {
        localStorage.setItem("supplierId", 1);
    }

    // Clear errors when user types
    $("#name").on("input", function () { $("#nameError").text(""); });
    $("#username").on("input", function () { $("#usernameError").text(""); });
    $("#password").on("input", function () { $("#passwordError").text(""); });
    $("#selectRole").on("change", function () { $("#roleError").text(""); });

    // Register button click
    $("#btnRegister").click(function () {

        let name = $("#name").val().trim();
        let username = $("#username").val().trim();
        let password = $("#password").val();
        let selectedRole = $("#selectRole").val();

        // Validate all fields using DOM error messages (not alert)
        let valid = true;

        if (name === "") {
            $("#nameError").text("Full name is required.");
            valid = false;
        }

        if (username === "") {
            $("#usernameError").text("Username is required.");
            valid = false;
        } else if (username.length < 3) {
            $("#usernameError").text("Username must be at least 3 characters.");
            valid = false;
        }

        if (password === "") {
            $("#passwordError").text("Password is required.");
            valid = false;
        } else if (password.length < 6) {
            $("#passwordError").text("Password must be at least 6 characters.");
            valid = false;
        }

        if (selectedRole === "") {
            $("#roleError").text("Please select a role.");
            valid = false;
        }

        if (!valid) return;

        // Save based on role
        if (selectedRole === "Admin") {
            if (StorageManager.load("Admin", null) !== null) {
                $("#roleError").text("An Admin is already registered. Only one Admin is allowed.");
                return;
            }
            let adminUser = new Admin(name, username, password, "Admin");
            StorageManager.save("Admin", adminUser);

        } else if (selectedRole === "Staff") {
            let staffArray = StorageManager.load("Staff", []);

            // Check for duplicate username
            for (let i = 0; i < staffArray.length; i++) {
                if (staffArray[i].username === username) {
                    $("#usernameError").text("This username is already taken.");
                    return;
                }
            }

            let staffId = Number(localStorage.getItem("staffId"));
            staffArray.push(new Staff(name, username, password, "Staff", staffId));
            StorageManager.save("Staff", staffArray);
            localStorage.setItem("staffId", staffId + 1);

        } else {
            let supplierArray = StorageManager.load("Supplier", []);

            // Check for duplicate username
            for (let i = 0; i < supplierArray.length; i++) {
                if (supplierArray[i].username === username) {
                    $("#usernameError").text("This username is already taken.");
                    return;
                }
            }

            let supplierId = Number(localStorage.getItem("supplierId"));
            supplierArray.push(new Supplier(name, username, password, "Supplier", supplierId));
            StorageManager.save("Supplier", supplierArray);
            localStorage.setItem("supplierId", supplierId + 1);
        }

        showToast("Registered successfully!");
        setTimeout(function () {
            window.location.href = "index.html";
        }, 900);
    });

});

function showToast(message) {
    $("#toast").text(message).fadeIn(300);
    setTimeout(function () {
        $("#toast").fadeOut(400);
    }, 2500);
}
