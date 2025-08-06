import * as THREE from 'three'
import {
    GPUComputationRenderer
} from 'three/addons/misc/GPUComputationRenderer.js'
import gsap from '@/gsap'

import Gl from '@/gl/Gl'
import {
    Scroll
} from '@/scroll'

export default class Particles {
    constructor() {
        this.gl = new Gl()
        this.instance = new THREE.Group()

        /*
          Settings
        */
        this.settings = {
            scale: 0.25,
            textCount: 24, // Number of floating text elements
            updateInterval: 2000, // Update text every 2 seconds
        }

        /*
          Global
        */
        this.globalSpeed = 1.0

        /*
          Fleet Telematics Data
        */
        this.vehicles = new Map()
        this.textElements = []
        this.currentMetrics = []
        this.lastUpdateTime = 0

        // Initialize Fleet Telematics system
        console.log('Particles: Initializing Fleet Telematics system...')
        this.initFleetData()
        this.createTextElements()
        this.setupDataUpdates()

        // Set positioning
        this.mesh = this.instance
        this.mesh.rotation.x = -Math.PI * 0.425
        this.mesh.position.set(0.114, 1.82, -0.48)
        this.mesh.renderOrder = 2

        console.log('Particles: Fleet Telematics system initialized successfully')
    }

    /**
     * Initialize Fleet Telematics vehicle data
     */
    initFleetData() {
        const vehicleTypes = [
            { type: 'truck', fuel: 300, efficiency: 8.5 },
            { type: 'van', fuel: 80, efficiency: 12.0 },
            { type: 'car', fuel: 60, efficiency: 15.0 },
            { type: 'bus', fuel: 200, efficiency: 6.0 }
        ]

        // Create 15 vehicles
        for (let i = 0; i < 15; i++) {
            const vehicleType = vehicleTypes[i % vehicleTypes.length]

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

                // Engine data
                engine: {
                    temperature: 85 + Math.random() * 20, // 85-105°C
                    rpm: 800 + Math.random() * 2000, // 800-2800 RPM
                    load: Math.random() * 100, // 0-100%
                    runtime: Math.random() * 10000, // Hours
                    faultCodes: []
                },

                // Driver data
                driver: {
                    id: `DR-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
                    score: 60 + Math.random() * 40, // 60-100 score
                    drivingTime: Math.random() * 12, // 0-12 hours today
                    violations: Math.floor(Math.random() * 5) // 0-4 violations
                },

                // Status
                status: {
                    connected: Math.random() > 0.1, // 90% connected
                    ignition: Math.random() > 0.3, // 70% running
                    lastUpdate: Date.now() - Math.random() * 300000, // Last 5 minutes
                    nextMaintenance: 500 + Math.random() * 2000 // km until maintenance
                }
            }

            this.vehicles.set(vehicle.id, vehicle)
        }

        console.log('Particles: Fleet data initialized with', this.vehicles.size, 'vehicles')
    }

    /**
     * Create floating text elements for Fleet Telematics data
     */
    createTextElements() {
        console.log('Particles: Creating text elements...')

        for (let i = 0; i < this.settings.textCount; i++) {
            // Generate random 3D position (similar to original particle distribution)
            const radius = 2 + Math.random() * 3
            const theta = Math.random() * Math.PI * 2
            const phi = Math.random() * Math.PI

            const x = radius * Math.sin(phi) * Math.cos(theta)
            const y = radius * Math.sin(phi) * Math.sin(theta)
            const z = radius * Math.cos(phi)

            // Create HTML element for text
            const textElement = document.createElement('div')
            textElement.className = 'fleet-telematics-particle'
            textElement.style.cssText = `
                position: fixed;
                pointer-events: none;
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                font-weight: 600;
                color: #60b2ff;
                text-shadow: 0 0 8px rgba(96, 178, 255, 0.6);
                white-space: nowrap;
                z-index: 10000;
                opacity: 0.9;
                transform-origin: center;
                transition: opacity 0.3s ease;
                background: rgba(19, 49, 83, 0.9);
                padding: 6px 10px;
                border-radius: 6px;
                border: 1px solid rgba(96, 178, 255, 0.4);
                backdrop-filter: blur(6px);
                min-width: 140px;
                text-align: center;
                box-shadow: 0 2px 10px rgba(96, 178, 255, 0.2);
            `

            // Set initial position for visibility
            textElement.style.left = `${100 + (i % 6) * 200}px`
            textElement.style.top = `${100 + Math.floor(i / 6) * 80}px`
            textElement.innerHTML = `
                <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">Vehicle ${i + 1}</div>
                <div style="font-size: 14px; font-weight: bold;">Loading...</div>
                <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">Initializing</div>
            `

            // Add to document body
            console.log('Particles: Adding text element', i, 'to document body')
            document.body.appendChild(textElement)

            // Create 3D object for positioning
            const mesh = new THREE.Object3D()
            mesh.position.set(x, y, z)
            mesh.userData = {
                element: textElement,
                originalPosition: new THREE.Vector3(x, y, z),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01
                ),
                life: Math.random(),
                random: Math.random(),
                metricIndex: i % 4, // Cycle through metric types
                lastUpdate: 0
            }

            this.instance.add(mesh)
            this.textElements.push(mesh)
        }

        console.log('Particles: Created', this.textElements.length, 'text elements')
    }

    /**
     * Setup data updates for Fleet Telematics
     */
    setupDataUpdates() {
        // Start data simulation
        this.startDataSimulation()

        // Update text content initially
        this.updateTextContent()

        console.log('Particles: Data updates initialized')
    }

    /**
     * Start the data simulation loop
     */
    startDataSimulation() {
        if (this.dataUpdateInterval) {
            clearInterval(this.dataUpdateInterval)
        }

        this.dataUpdateInterval = setInterval(() => {
            this.updateVehicleData()
            this.updateTextContent()
        }, 1000) // Update every second

        console.log('Particles: Data simulation started')
    }

    /**
     * Update all vehicle data with realistic changes
     */
    updateVehicleData() {
        this.vehicles.forEach((vehicle, id) => {
            // Update location
            if (vehicle.status.ignition) {
                vehicle.location.speed = Math.max(0, vehicle.location.speed + (Math.random() - 0.5) * 10)
                vehicle.location.heading += (Math.random() - 0.5) * 20

                // Simulate movement
                const speedKmh = vehicle.location.speed
                const speedMs = speedKmh / 3.6
                const deltaTime = 1 // 1 second
                const distance = speedMs * deltaTime

                const headingRad = vehicle.location.heading * Math.PI / 180
                vehicle.location.lat += (distance * Math.cos(headingRad)) / 111000 // Rough conversion
                vehicle.location.lng += (distance * Math.sin(headingRad)) / (111000 * Math.cos(vehicle.location.lat * Math.PI / 180))
            } else {
                vehicle.location.speed = 0
            }

            // Update fuel
            if (vehicle.status.ignition && vehicle.location.speed > 0) {
                const consumption = (vehicle.location.speed / 100) * vehicle.fuel.efficiency * (1/3600) // L/s
                vehicle.fuel.level = Math.max(0, vehicle.fuel.level - consumption)
                vehicle.fuel.consumption += consumption
            }

            // Update engine
            if (vehicle.status.ignition) {
                vehicle.engine.temperature = Math.min(120, Math.max(80, vehicle.engine.temperature + (Math.random() - 0.5) * 2))
                vehicle.engine.rpm = 800 + (vehicle.location.speed / 100) * 2000 + (Math.random() - 0.5) * 200
                vehicle.engine.load = (vehicle.location.speed / 100) * 80 + Math.random() * 20
                vehicle.engine.runtime += 1/3600 // Add 1 second in hours
            } else {
                vehicle.engine.temperature = Math.max(20, vehicle.engine.temperature - 0.5)
                vehicle.engine.rpm = 0
                vehicle.engine.load = 0
            }

            // Update driver behavior
            if (vehicle.status.ignition) {
                vehicle.driver.drivingTime += 1/3600 // Add 1 second in hours

                // Simulate score changes based on driving
                if (vehicle.location.speed > 80) {
                    vehicle.driver.score = Math.max(0, vehicle.driver.score - 0.1) // Speeding penalty
                }
                if (Math.abs(vehicle.location.speed - (vehicle.previousSpeed || vehicle.location.speed)) > 20) {
                    vehicle.driver.score = Math.max(0, vehicle.driver.score - 0.2) // Harsh acceleration/braking
                }

                vehicle.previousSpeed = vehicle.location.speed
            }

            // Random status changes
            if (Math.random() < 0.001) { // 0.1% chance per second
                vehicle.status.ignition = !vehicle.status.ignition
            }

            vehicle.status.lastUpdate = Date.now()
        })
    }

    /**
     * Update text content with current fleet metrics
     */
    updateTextContent() {
        this.currentMetrics = this.getDisplayMetrics()

        this.textElements.forEach((mesh, index) => {
            const userData = mesh.userData
            const element = userData.element

            // Get metric for this text element
            const metricIndex = index % this.currentMetrics.length
            const metric = this.currentMetrics[metricIndex]

            if (metric) {
                // Update content based on metric type
                let content = ''
                switch (metric.type) {
                    case 'location':
                        content = `
                            <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.vehicleId}</div>
                            <div style="font-size: 14px; font-weight: bold;">${metric.value}</div>
                            <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                        `
                        break
                    case 'fuel':
                        content = `
                            <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.vehicleId}</div>
                            <div style="font-size: 14px; font-weight: bold; color: ${metric.status === 'warning' ? '#ff6b6b' : '#60b2ff'};">${metric.value}</div>
                            <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                        `
                        break
                    case 'engine':
                        content = `
                            <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.vehicleId}</div>
                            <div style="font-size: 14px; font-weight: bold; color: ${metric.status === 'warning' ? '#ff6b6b' : '#60b2ff'};">${metric.value}</div>
                            <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                        `
                        break
                    case 'driver':
                        content = `
                            <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.label}</div>
                            <div style="font-size: 14px; font-weight: bold; color: ${metric.status === 'warning' ? '#ff6b6b' : '#60b2ff'};">${metric.value}</div>
                            <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                        `
                        break
                    case 'fleet':
                        content = `
                            <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.label}</div>
                            <div style="font-size: 14px; font-weight: bold; color: ${metric.status === 'warning' ? '#ff6b6b' : '#4ade80'};">${metric.value}</div>
                            <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                        `
                        break
                    default:
                        content = `
                            <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">Fleet Data</div>
                            <div style="font-size: 14px; font-weight: bold;">Active</div>
                            <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">Real-time</div>
                        `
                }

                element.innerHTML = content
                userData.lastUpdate = Date.now()
            }
        })
    }

    /**
     * Get formatted display metrics for particles
     */
    getDisplayMetrics() {
        const vehicles = Array.from(this.vehicles.values())
        const metrics = []

        vehicles.forEach(vehicle => {
            // Location/Speed metrics
            metrics.push({
                type: 'location',
                vehicleId: vehicle.id,
                label: 'Location',
                value: vehicle.status.ignition ? `${vehicle.location.speed.toFixed(0)} km/h` : 'IDLE',
                detail: `${vehicle.location.lat.toFixed(4)}, ${vehicle.location.lng.toFixed(4)}`,
                status: vehicle.location.speed > 80 ? 'warning' : 'normal',
                priority: vehicle.location.speed > 100 ? 'high' : 'normal'
            })

            // Fuel metrics
            const fuelPercent = (vehicle.fuel.level / vehicle.fuel.capacity) * 100
            metrics.push({
                type: 'fuel',
                vehicleId: vehicle.id,
                label: 'Fuel Level',
                value: `${fuelPercent.toFixed(0)}%`,
                detail: `${vehicle.fuel.level.toFixed(1)}L / ${vehicle.fuel.capacity}L`,
                status: fuelPercent < 20 ? 'warning' : 'normal',
                priority: fuelPercent < 10 ? 'high' : 'normal'
            })

            // Engine metrics
            metrics.push({
                type: 'engine',
                vehicleId: vehicle.id,
                label: 'Engine Status',
                value: vehicle.status.ignition ? `${vehicle.engine.temperature.toFixed(0)}°C` : 'OFF',
                detail: vehicle.status.ignition ? `${vehicle.engine.rpm.toFixed(0)} RPM` : 'Stopped',
                status: vehicle.engine.temperature > 100 ? 'warning' : 'normal',
                priority: vehicle.engine.temperature > 110 ? 'high' : 'normal'
            })

            // Driver behavior
            metrics.push({
                type: 'driver',
                vehicleId: vehicle.id,
                label: `Driver ${vehicle.driver.id}`,
                value: `${vehicle.driver.score.toFixed(0)}`,
                detail: `${vehicle.driver.drivingTime.toFixed(0)}h`,
                status: vehicle.driver.score < 70 ? 'warning' : 'normal',
                priority: vehicle.driver.score < 60 ? 'high' : 'normal'
            })
        })

        // Add fleet summary metrics
        const summary = this.getFleetSummary()
        metrics.push({
            type: 'fleet',
            vehicleId: 'FLEET',
            label: 'Fleet Status',
            value: `${summary.active}/${summary.total}`,
            detail: `${summary.connected} connected`,
            status: summary.connected < summary.total * 0.9 ? 'warning' : 'normal',
            priority: 'high'
        })

        return metrics
    }

    /**
     * Get fleet summary statistics
     */
    getFleetSummary() {
        const vehicles = Array.from(this.vehicles.values())
        const activeVehicles = vehicles.filter(v => v.status.ignition)
        const connectedVehicles = vehicles.filter(v => v.status.connected)

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
        }
    }
    /**
     * Set camera reference for 3D to 2D projection
     */
    setCamera(camera) {
        this.camera = camera
    }

    /**
     * Update method called every frame
     */
    update() {
        if (!this.textElements.length) return

        const time = this.gl.time.elapsed * 0.001
        const camera = this.camera || this.gl.world.activeScenes.current?.activeCamera

        if (!camera) return

        this.textElements.forEach((mesh, index) => {
            const userData = mesh.userData
            const element = userData.element

            // Animate position with flow field (similar to original particles)
            const flowStrength = 0.5 + this.gl.audio.frequencies.synthLoop.current * 0.001

            // Simple noise-based movement
            const noiseX = Math.sin(time * 0.5 + index * 0.1) * 0.02
            const noiseY = Math.cos(time * 0.3 + index * 0.15) * 0.02
            const noiseZ = Math.sin(time * 0.7 + index * 0.2) * 0.02

            mesh.position.x = userData.originalPosition.x + noiseX * flowStrength
            mesh.position.y = userData.originalPosition.y + noiseY * flowStrength
            mesh.position.z = userData.originalPosition.z + noiseZ * flowStrength

            // Update life cycle
            userData.life += 0.005
            if (userData.life > 1) userData.life = 0

            // Project 3D position to 2D screen coordinates
            const worldPosition = mesh.position.clone()
            worldPosition.project(camera)

            // Convert to screen coordinates
            const screenX = (worldPosition.x * 0.5 + 0.5) * this.gl.sizes.width
            const screenY = (-worldPosition.y * 0.5 + 0.5) * this.gl.sizes.height

            // Update element position
            element.style.left = `${screenX}px`
            element.style.top = `${screenY}px`

            // Handle visibility based on distance and life
            const distance = worldPosition.z
            const lifeAlpha = Math.sin(userData.life * Math.PI)
            const distanceAlpha = distance > 1 ? 0 : (1 - distance)
            const finalAlpha = lifeAlpha * distanceAlpha * 0.9

            element.style.opacity = finalAlpha

            // Hide if too far or behind camera
            if (distance > 1 || distance < -1) {
                element.style.display = 'none'
            } else {
                element.style.display = 'block'
            }
        })
    }

    /**
     * Trigger hover effect on Fleet Telematics particles
     */
    triggerHover() {
        const tl = gsap.timeline({ delay: 0.5 })

        tl.fromTo(
            this.mesh.scale, {
                x: 1, y: 1, z: 1,
            }, {
                x: 1.15, y: 1.15, z: 1.15,
                duration: 0.5,
                ease: 'power2.inOut',
            }
        )

        tl.fromTo(
            this.mesh.scale, {
                x: 1.15, y: 1.15, z: 1.15,
            }, {
                x: 1, y: 1, z: 1,
                duration: 2,
                ease: 'power2.inOut',
                immediateRender: false,
            }
        )

        // Also animate text elements
        this.textElements.forEach((mesh, index) => {
            const element = mesh.userData.element
            gsap.fromTo(element, {
                scale: 1,
            }, {
                scale: 1.1,
                duration: 0.3,
                ease: 'power2.inOut',
                yoyo: true,
                repeat: 1,
                delay: index * 0.05
            })
        })
    }

    /**
     * Trigger wave animation on Fleet Telematics particles
     */
    triggerWave(_direction, _duration, _ease, _animateStrength = false, _delay) {
        if (_direction === 1) {
            gsap.fromTo(
                this.mesh.scale, {
                    x: 0.1, y: 0.1, z: 0.1,
                }, {
                    x: 1, y: 1, z: 1,
                    delay: _delay ? _delay : 0,
                    duration: _duration != undefined ? _duration : 4.1,
                    ease: _ease ? _ease : 'power2.inOut',
                }
            )

            // Animate text elements appearing
            this.textElements.forEach((mesh, index) => {
                const element = mesh.userData.element
                gsap.fromTo(element, {
                    opacity: 0,
                    scale: 0.5,
                }, {
                    opacity: 0.9,
                    scale: 1,
                    duration: _duration != undefined ? _duration : 4.1,
                    ease: _ease ? _ease : 'power2.inOut',
                    delay: (_delay ? _delay : 0) + index * 0.1
                })
            })
        } else {
            gsap.fromTo(
                this.mesh.scale, {
                    x: 1, y: 1, z: 1,
                }, {
                    x: 0.1, y: 0.1, z: 0.1,
                    duration: _duration != undefined ? _duration : 2.75,
                    ease: 'expo.inOut',
                }
            )

            // Animate text elements disappearing
            this.textElements.forEach((mesh, index) => {
                const element = mesh.userData.element
                gsap.fromTo(element, {
                    opacity: 0.9,
                    scale: 1,
                }, {
                    opacity: 0,
                    scale: 0.5,
                    duration: _duration != undefined ? _duration : 2.75,
                    ease: 'expo.inOut',
                    delay: index * 0.05
                })
            })
        }
    }

    /**
     * Resize handler for Fleet Telematics particles
     */
    resize() {
        // Fleet Telematics particles automatically adjust to screen size
        // No specific resize handling needed
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Stop data simulation
        if (this.dataUpdateInterval) {
            clearInterval(this.dataUpdateInterval)
        }

        // Remove HTML elements
        this.textElements.forEach(mesh => {
            if (mesh.userData.element && mesh.userData.element.parentNode) {
                mesh.userData.element.parentNode.removeChild(mesh.userData.element)
            }
        })

        // Clear arrays
        this.textElements = []
        this.currentMetrics = []
        this.vehicles.clear()

        console.log('Particles: Fleet Telematics system destroyed')
    }
}