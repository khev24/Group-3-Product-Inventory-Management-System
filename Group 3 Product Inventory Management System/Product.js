class Product {
    constructor(productId, productName, category, price, stock, imageUrl) {
        this.productId = productId;
        this.productName = productName;
        this.category = category;
        this.price = price;
        this.stock = stock;
        this.imageUrl = imageUrl || "";
    }
}