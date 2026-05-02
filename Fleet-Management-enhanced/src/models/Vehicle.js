class Vehicle {
    constructor(id, make, model, year) {
        this.id = id;
        this.make = make;
        this.model = model;
        this.year = year;
    }

    static create(vehicleData) {
        // Code to create a vehicle record
    }

    static findById(id) {
        // Code to find a vehicle by ID
    }

    static findAll() {
        // Code to find all vehicles
    }

    static update(id, vehicleData) {
        // Code to update a vehicle record
    }

    static delete(id) {
        // Code to delete a vehicle record
    }
}

module.exports = Vehicle;