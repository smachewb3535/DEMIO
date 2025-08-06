/**
 * Fleet Telematics Data Service
 * Generates realistic vehicle telemetry data for display in the 3D particle system
 */

export class FleetTelematicsData {
    constructor() {
        console.log('FleetTelematicsData: Initializing...')
        this.vehicles = new Map();
        this.updateInterval = 1000; // Update every second
        this.isRunning = false;
        this.listeners = new Set();

        // Initialize fleet data
        console.log('FleetTelematicsData: Initializing fleet...')
        this.initializeFleet();
        console.log('FleetTelematicsData: Fleet initialized with', this.vehicles.size, 'vehicles')

        // Start data simulation
        console.log('FleetTelematicsData: Starting data simulation...')
        this.startDataSimulation();
        console.log('FleetTelematicsData: Initialization complete')
    }

    /**
     * Initialize a fleet of vehicles with realistic starting data
     */
    initializeFleet() {
        const vehicleTypes = [
            { type: 'Truck', fuel: 200, efficiency: 8.5 },
            { type: 'Van', fuel: 80, efficiency: 12.0 },
            { type: 'Car', fuel: 60, efficiency: 15.0 },
            { type: 'Bus', fuel: 300, efficiency: 6.0 }
        ];

        const routes = [
            'Highway 401 E',
            'Downtown Core',
            'Industrial Zone',
            'Airport Route',
            'Suburban Loop'
        ];

        // Create 12 vehicles for realistic fleet size
        for (let i = 0; i < 12; i++) {
            const vehicleType = vehicleTypes[i % vehicleTypes.length];
            const route = routes[i % routes.length];
            
            const vehicle = {
                id: `VH-${String(i + 1).padStart(3, '0')}`,
                type: vehicleType.type,
                
                // Location data
                location: {
                    lat: 43.6532 + (Math.random() - 0.5) * 0.1, // Toronto area
                    lng: -79.3832 + (Math.random() - 0.5) * 0.1,
                    speed: Math.random() * 80 + 20, // 20-100 km/h
                    heading: Math.random() * 360,
                    altitude: 76 + Math.random() * 50
                },
                
                // Fuel data
                fuel: {
                    level: vehicleType.fuel * (0.3 + Math.random() * 0.6), // 30-90% full
                    capacity: vehicleType.fuel,
                    efficiency: vehicleType.efficiency,
                    consumption: 0,
                    lastFill: Date.now() - Math.random() * 86400000 // Last 24 hours
                },
                
                // Engine diagnostics
                engine: {
                    rpm: 1500 + Math.random() * 2000,
                    temperature: 85 + Math.random() * 15, // 85-100°C
                    oilPressure: 30 + Math.random() * 20, // 30-50 PSI
                    voltage: 12.5 + Math.random() * 1.5, // 12.5-14V
                    faultCodes: [],
                    hours: Math.floor(Math.random() * 5000) + 1000
                },
                
                // Driver behavior
                driver: {
                    id: `DR-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
                    score: 75 + Math.random() * 20, // 75-95 score
                    harshAcceleration: Math.floor(Math.random() * 5),
                    harshBraking: Math.floor(Math.random() * 3),
                    harshCornering: Math.floor(Math.random() * 2),
                    idleTime: Math.floor(Math.random() * 120), // minutes
                    drivingTime: Math.floor(Math.random() * 480) + 60 // 1-8 hours
                },
                
                // Vehicle status
                status: {
                    state: Math.random() > 0.8 ? 'idle' : 'driving',
                    route: route,
                    nextMaintenance: Math.floor(Math.random() * 5000) + 500, // km
                    lastUpdate: Date.now(),
                    connected: Math.random() > 0.05 // 95% connectivity
                }
            };
            
            this.vehicles.set(vehicle.id, vehicle);
        }
    }

    /**
     * Start the data simulation loop
     */
    startDataSimulation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.simulationInterval = setInterval(() => {
            this.updateVehicleData();
            this.notifyListeners();
        }, this.updateInterval);
    }

    /**
     * Stop the data simulation
     */
    stopDataSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        this.isRunning = false;
    }

    /**
     * Update all vehicle data with realistic changes
     */
    updateVehicleData() {
        this.vehicles.forEach((vehicle, id) => {
            this.updateVehicleLocation(vehicle);
            this.updateFuelData(vehicle);
            this.updateEngineData(vehicle);
            this.updateDriverBehavior(vehicle);
            this.updateVehicleStatus(vehicle);
            
            vehicle.status.lastUpdate = Date.now();
        });
    }

    /**
     * Update vehicle location with realistic movement
     */
    updateVehicleLocation(vehicle) {
        if (vehicle.status.state === 'driving') {
            // Simulate movement
            const speedKmh = vehicle.location.speed;
            const speedMs = speedKmh / 3.6; // Convert to m/s
            const deltaTime = this.updateInterval / 1000; // seconds
            const distance = speedMs * deltaTime; // meters
            
            // Convert to lat/lng delta (rough approximation)
            const latDelta = (distance / 111000) * Math.cos(vehicle.location.heading * Math.PI / 180);
            const lngDelta = (distance / 111000) * Math.sin(vehicle.location.heading * Math.PI / 180);
            
            vehicle.location.lat += latDelta;
            vehicle.location.lng += lngDelta;
            
            // Vary speed slightly
            vehicle.location.speed += (Math.random() - 0.5) * 5;
            vehicle.location.speed = Math.max(10, Math.min(100, vehicle.location.speed));
            
            // Occasionally change heading
            if (Math.random() < 0.1) {
                vehicle.location.heading += (Math.random() - 0.5) * 30;
                vehicle.location.heading = (vehicle.location.heading + 360) % 360;
            }
        }
    }

    /**
     * Update fuel consumption and levels
     */
    updateFuelData(vehicle) {
        if (vehicle.status.state === 'driving') {
            // Calculate fuel consumption based on speed and efficiency
            const consumption = vehicle.location.speed / vehicle.fuel.efficiency / 3600; // L/s
            const deltaTime = this.updateInterval / 1000;
            const fuelUsed = consumption * deltaTime;
            
            vehicle.fuel.level = Math.max(0, vehicle.fuel.level - fuelUsed);
            vehicle.fuel.consumption = consumption * 3600; // L/h
        } else {
            vehicle.fuel.consumption = 0;
        }
    }

    /**
     * Update engine diagnostics
     */
    updateEngineData(vehicle) {
        if (vehicle.status.state === 'driving') {
            // RPM varies with speed
            const baseRpm = 800 + (vehicle.location.speed / 100) * 2500;
            vehicle.engine.rpm = baseRpm + (Math.random() - 0.5) * 200;
            
            // Temperature increases with load
            vehicle.engine.temperature += (Math.random() - 0.5) * 2;
            vehicle.engine.temperature = Math.max(80, Math.min(105, vehicle.engine.temperature));
            
            // Oil pressure varies slightly
            vehicle.engine.oilPressure += (Math.random() - 0.5) * 2;
            vehicle.engine.oilPressure = Math.max(25, Math.min(55, vehicle.engine.oilPressure));
        } else {
            // Idle values
            vehicle.engine.rpm = 800 + (Math.random() - 0.5) * 100;
            vehicle.engine.temperature = Math.max(85, vehicle.engine.temperature - 0.5);
        }
        
        // Voltage fluctuates slightly
        vehicle.engine.voltage += (Math.random() - 0.5) * 0.1;
        vehicle.engine.voltage = Math.max(12.0, Math.min(14.5, vehicle.engine.voltage));
        
        // Occasionally generate fault codes
        if (Math.random() < 0.001 && vehicle.engine.faultCodes.length < 3) {
            const faultCodes = ['P0171', 'P0300', 'P0420', 'P0128', 'P0442'];
            const newFault = faultCodes[Math.floor(Math.random() * faultCodes.length)];
            if (!vehicle.engine.faultCodes.includes(newFault)) {
                vehicle.engine.faultCodes.push(newFault);
            }
        }
    }

    /**
     * Update driver behavior metrics
     */
    updateDriverBehavior(vehicle) {
        if (vehicle.status.state === 'driving') {
            // Occasionally record harsh events
            if (Math.random() < 0.01) {
                const eventType = Math.random();
                if (eventType < 0.4) {
                    vehicle.driver.harshAcceleration++;
                } else if (eventType < 0.7) {
                    vehicle.driver.harshBraking++;
                } else {
                    vehicle.driver.harshCornering++;
                }
            }
            
            // Update driving time
            vehicle.driver.drivingTime += this.updateInterval / 60000; // minutes
        } else {
            // Update idle time
            vehicle.driver.idleTime += this.updateInterval / 60000; // minutes
        }
        
        // Recalculate driver score
        const events = vehicle.driver.harshAcceleration + vehicle.driver.harshBraking + vehicle.driver.harshCornering;
        const hours = vehicle.driver.drivingTime / 60;
        const eventsPerHour = hours > 0 ? events / hours : 0;
        vehicle.driver.score = Math.max(50, 100 - (eventsPerHour * 10));
    }

    /**
     * Update vehicle status
     */
    updateVehicleStatus(vehicle) {
        // Occasionally change state
        if (Math.random() < 0.01) {
            vehicle.status.state = vehicle.status.state === 'driving' ? 'idle' : 'driving';
        }

        // Simulate connectivity issues
        if (Math.random() < 0.001) {
            vehicle.status.connected = !vehicle.status.connected;
        }

        // Update maintenance countdown
        if (vehicle.status.state === 'driving') {
            vehicle.status.nextMaintenance -= vehicle.location.speed * (this.updateInterval / 3600000); // km
            vehicle.status.nextMaintenance = Math.max(0, vehicle.status.nextMaintenance);
        }
    }

    /**
     * Add a listener for data updates
     */
    addListener(callback) {
        this.listeners.add(callback);
    }

    /**
     * Remove a listener
     */
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of data updates
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getFleetSummary());
            } catch (error) {
                console.error('Error in Fleet Telematics listener:', error);
            }
        });
    }

    /**
     * Get all vehicles data
     */
    getAllVehicles() {
        return Array.from(this.vehicles.values());
    }

    /**
     * Get a specific vehicle by ID
     */
    getVehicle(id) {
        return this.vehicles.get(id);
    }

    /**
     * Get fleet summary statistics
     */
    getFleetSummary() {
        const vehicles = this.getAllVehicles();
        const activeVehicles = vehicles.filter(v => v.status.state === 'driving');
        const connectedVehicles = vehicles.filter(v => v.status.connected);

        return {
            total: vehicles.length,
            active: activeVehicles.length,
            idle: vehicles.length - activeVehicles.length,
            connected: connectedVehicles.length,
            avgSpeed: activeVehicles.length > 0 ?
                activeVehicles.reduce((sum, v) => sum + v.location.speed, 0) / activeVehicles.length : 0,
            totalFuel: vehicles.reduce((sum, v) => sum + v.fuel.level, 0),
            avgDriverScore: vehicles.reduce((sum, v) => sum + v.driver.score, 0) / vehicles.length,
            maintenanceAlerts: vehicles.filter(v => v.status.nextMaintenance < 500).length,
            faultCodes: vehicles.reduce((sum, v) => sum + v.engine.faultCodes.length, 0)
        };
    }

    /**
     * Get formatted display metrics for particles
     */
    getDisplayMetrics() {
        const vehicles = this.getAllVehicles();
        const metrics = [];

        vehicles.forEach(vehicle => {
            // Vehicle location metric
            metrics.push({
                type: 'location',
                vehicleId: vehicle.id,
                label: `${vehicle.id}`,
                value: `${vehicle.location.speed.toFixed(0)} km/h`,
                detail: `${vehicle.location.lat.toFixed(4)}, ${vehicle.location.lng.toFixed(4)}`,
                status: vehicle.status.state,
                priority: vehicle.status.state === 'driving' ? 'high' : 'normal'
            });

            // Fuel level metric
            const fuelPercent = (vehicle.fuel.level / vehicle.fuel.capacity * 100);
            metrics.push({
                type: 'fuel',
                vehicleId: vehicle.id,
                label: `${vehicle.type}`,
                value: `${fuelPercent.toFixed(0)}%`,
                detail: `${vehicle.fuel.level.toFixed(1)}L / ${vehicle.fuel.capacity}L`,
                status: fuelPercent < 20 ? 'critical' : fuelPercent < 40 ? 'warning' : 'normal',
                priority: fuelPercent < 20 ? 'critical' : 'normal'
            });

            // Engine diagnostics
            metrics.push({
                type: 'engine',
                vehicleId: vehicle.id,
                label: `Engine`,
                value: `${vehicle.engine.temperature.toFixed(0)}°C`,
                detail: `${vehicle.engine.rpm.toFixed(0)} RPM`,
                status: vehicle.engine.temperature > 100 ? 'warning' : 'normal',
                priority: vehicle.engine.faultCodes.length > 0 ? 'high' : 'normal'
            });

            // Driver behavior
            metrics.push({
                type: 'driver',
                vehicleId: vehicle.id,
                label: `Driver ${vehicle.driver.id}`,
                value: `${vehicle.driver.score.toFixed(0)}`,
                detail: `${vehicle.driver.drivingTime.toFixed(0)}h`,
                status: vehicle.driver.score < 70 ? 'warning' : 'normal',
                priority: vehicle.driver.score < 60 ? 'high' : 'normal'
            });
        });

        // Add fleet summary metrics
        const summary = this.getFleetSummary();
        metrics.push({
            type: 'fleet',
            vehicleId: 'FLEET',
            label: 'Fleet Status',
            value: `${summary.active}/${summary.total}`,
            detail: `${summary.connected} connected`,
            status: summary.connected < summary.total * 0.9 ? 'warning' : 'normal',
            priority: 'high'
        });

        return metrics;
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopDataSimulation();
        this.listeners.clear();
        this.vehicles.clear();
    }
}
