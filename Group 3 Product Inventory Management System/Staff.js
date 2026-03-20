class Staff extends User {
    constructor(name, username, password, role, staffId) {
        super(name, username, password, role);
        this.staffId = staffId;
    }
}
