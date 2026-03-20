// StorageManager
class StorageManager {

    // Save any data to localStorage
    static save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Load any data from localStorage (returns fallback if not found)
    static load(key, fallback) {
        let data = localStorage.getItem(key);
        if (data === null) {
            return fallback;
        }
        return JSON.parse(data);
    }

    // Remove one item from localStorage
    static remove(key) {
        localStorage.removeItem(key);
    }

    // Clear only app data (products, transactions, requests)
    // User accounts are kept so nobody gets logged out
    static clearAppData() {
        localStorage.removeItem("Products");
        localStorage.removeItem("Transactions");
        localStorage.removeItem("Sales");
        localStorage.removeItem("Requests");
        localStorage.removeItem("productId");
        localStorage.removeItem("requestId");
        localStorage.removeItem("transactionId");
    }

    // Full reset - clears everything including user accounts
    static clearAll() {
        localStorage.clear();
    }
}