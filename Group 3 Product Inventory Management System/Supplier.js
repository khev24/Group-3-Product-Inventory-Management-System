class Supplier extends User {
    constructor(name, username, password, role, supplierId) {
        super(name, username, password, role);
        this.supplierId = supplierId;
    }
}
