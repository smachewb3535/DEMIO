/**
 * Optimized Particles System for Fleet Telemetrics
 * Improved performance and memory management
 */

import * as THREE from 'three';
import gsap from '@/gsap';
import Gl from '@/gl/Gl';
import { FleetTelematicsData } from '../../data/FleetTelematicsData';

export default class ParticlesOptimized {
    constructor() {
        this.gl = new Gl();
        this.instance = new THREE.Group();

        // Performance settings
        this.settings = {
            scale: 0.25,
            textCount: this.getOptimalTextCount(),
            updateInterval: 2000,
            maxVisibleDistance: 50,
            cullingEnabled: true,
            poolSize: 32 // Object pooling for better performance
        };

        // Object pools for performance
        this.textElementPool = [];
        this.activeElements = [];
        this.inactiveElements = [];

        // Fleet data
        this.fleetData = new FleetTelematicsData();
        this.currentMetrics = [];
        this.lastUpdateTime = 0;

        // Performance tracking
        this.frameCount = 0;
        this.lastFPSCheck = performance.now();
        this.currentFPS = 60;

        this.init();
    }

    getOptimalTextCount() {
        // Adjust particle count based on device capabilities
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowEnd = navigator.hardwareConcurrency <= 4;
        
        if (isMobile) return 12;
        if (isLowEnd) return 16;
        return 24;
    }

    init() {
        console.log('ParticlesOptimized: Initializing optimized system...');
        
        this.createObjectPool();
        this.setupDataUpdates();
        this.setupPerformanceMonitoring();
        
        // Set positioning
        this.mesh = this.instance;
        this.mesh.rotation.x = -Math.PI * 0.425;
        this.mesh.position.set(0.114, 1.82, -0.48);
        this.mesh.renderOrder = 2;

        console.log('ParticlesOptimized: System initialized');
    }

    createObjectPool() {
        console.log('ParticlesOptimized: Creating object pool...');
        
        for (let i = 0; i < this.settings.poolSize; i++) {
            const textElement = this.createTextElement(i);
            const mesh = this.createMeshForElement(textElement, i);
            
            const pooledObject = {
                element: textElement,
                mesh: mesh,
                isActive: false,
                lastUpdate: 0
            };
            
            this.textElementPool.push(pooledObject);
            this.inactiveElements.push(pooledObject);
        }
        
        console.log('ParticlesOptimized: Object pool created with', this.settings.poolSize, 'objects');
    }

    createTextElement(index) {
        const textElement = document.createElement('div');
        textElement.className = 'fleet-telematics-particle optimized';
        textElement.style.cssText = `
            position: fixed;
            pointer-events: none;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            font-weight: 600;
            color: var(--fleet-particle-primary, #60b2ff);
            text-shadow: 0 0 8px var(--fleet-particle-primary, #60b2ff)99;
            white-space: nowrap;
            z-index: 1000;
            opacity: 0;
            transform-origin: center;
            transition: opacity 0.3s ease;
            background: var(--fleet-particle-bg, rgba(19, 49, 83, 0.85));
            padding: 6px 10px;
            border-radius: 6px;
            border: 1px solid var(--fleet-particle-border, rgba(96, 178, 255, 0.3));
            backdrop-filter: blur(6px);
            min-width: 140px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(96, 178, 255, 0.2);
            will-change: transform, opacity;
        `;
        
        // Set initial content
        textElement.innerHTML = `
            <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">Loading...</div>
            <div style="font-size: 14px; font-weight: bold;">Initializing</div>
            <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">Fleet Data</div>
        `;
        
        // Initially hidden
        textElement.style.display = 'none';
        document.body.appendChild(textElement);
        
        return textElement;
    }

    createMeshForElement(textElement, index) {
        // Generate random 3D position
        const radius = 2 + Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        const mesh = new THREE.Object3D();
        mesh.position.set(x, y, z);
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
            metricIndex: index % 4,
            lastUpdate: 0,
            isVisible: false
        };

        this.instance.add(mesh);
        return mesh;
    }

    getActiveObject() {
        if (this.inactiveElements.length > 0) {
            const obj = this.inactiveElements.pop();
            obj.isActive = true;
            this.activeElements.push(obj);
            return obj;
        }
        return null;
    }

    releaseObject(obj) {
        if (!obj.isActive) return;
        
        obj.isActive = false;
        obj.element.style.display = 'none';
        obj.mesh.userData.isVisible = false;
        
        const activeIndex = this.activeElements.indexOf(obj);
        if (activeIndex > -1) {
            this.activeElements.splice(activeIndex, 1);
            this.inactiveElements.push(obj);
        }
    }

    setupDataUpdates() {
        // Listen to fleet data updates
        this.fleetData.addListener((summary) => {
            this.updateDisplayMetrics();
        });
        
        // Initial update
        this.updateDisplayMetrics();
    }

    setupPerformanceMonitoring() {
        // Monitor FPS and adjust particle count accordingly
        setInterval(() => {
            this.checkPerformance();
        }, 5000);
    }

    checkPerformance() {
        const now = performance.now();
        const deltaTime = now - this.lastFPSCheck;
        this.currentFPS = Math.round(1000 * this.frameCount / deltaTime);
        
        // Adjust particle count based on performance
        if (this.currentFPS < 30 && this.settings.textCount > 8) {
            this.settings.textCount = Math.max(8, this.settings.textCount - 2);
            console.log('ParticlesOptimized: Reduced particle count due to low FPS:', this.currentFPS);
        } else if (this.currentFPS > 50 && this.settings.textCount < this.getOptimalTextCount()) {
            this.settings.textCount = Math.min(this.getOptimalTextCount(), this.settings.textCount + 1);
            console.log('ParticlesOptimized: Increased particle count due to good FPS:', this.currentFPS);
        }
        
        this.frameCount = 0;
        this.lastFPSCheck = now;
    }

    updateDisplayMetrics() {
        this.currentMetrics = this.fleetData.getDisplayMetrics();
        
        // Release excess objects
        while (this.activeElements.length > this.settings.textCount) {
            const obj = this.activeElements[this.activeElements.length - 1];
            this.releaseObject(obj);
        }
        
        // Activate needed objects
        while (this.activeElements.length < Math.min(this.settings.textCount, this.currentMetrics.length)) {
            const obj = this.getActiveObject();
            if (!obj) break;
            
            obj.element.style.display = 'block';
            obj.mesh.userData.isVisible = true;
        }
        
        // Update content for active objects
        this.activeElements.forEach((obj, index) => {
            if (index < this.currentMetrics.length) {
                this.updateElementContent(obj, this.currentMetrics[index]);
            }
        });
    }

    updateElementContent(obj, metric) {
        const element = obj.element;
        
        if (!metric) return;
        
        // Update content based on metric type
        let content = '';
        let statusColor = '#60b2ff';
        
        switch (metric.status) {
            case 'warning':
                statusColor = '#ffb366';
                break;
            case 'critical':
                statusColor = '#ff6b6b';
                break;
            case 'normal':
            default:
                statusColor = '#60b2ff';
                break;
        }
        
        switch (metric.type) {
            case 'location':
                content = `
                    <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.vehicleId}</div>
                    <div style="font-size: 14px; font-weight: bold; color: ${statusColor};">${metric.value}</div>
                    <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                `;
                break;
            case 'fuel':
                content = `
                    <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.vehicleId}</div>
                    <div style="font-size: 14px; font-weight: bold; color: ${statusColor};">${metric.value}</div>
                    <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                `;
                break;
            case 'engine':
                content = `
                    <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.vehicleId}</div>
                    <div style="font-size: 14px; font-weight: bold; color: ${statusColor};">${metric.value}</div>
                    <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                `;
                break;
            case 'driver':
                content = `
                    <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.label}</div>
                    <div style="font-size: 14px; font-weight: bold; color: ${statusColor};">${metric.value}</div>
                    <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                `;
                break;
            case 'fleet':
                content = `
                    <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">${metric.label}</div>
                    <div style="font-size: 14px; font-weight: bold; color: ${statusColor};">${metric.value}</div>
                    <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">${metric.detail}</div>
                `;
                break;
            default:
                content = `
                    <div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px;">Fleet Data</div>
                    <div style="font-size: 14px; font-weight: bold;">Active</div>
                    <div style="font-size: 9px; opacity: 0.6; margin-top: 1px;">Real-time</div>
                `;
        }

        element.innerHTML = content;
        obj.lastUpdate = Date.now();
    }

    setCamera(camera) {
        this.camera = camera;
    }

    update() {
        if (!this.activeElements.length) return;
        
        this.frameCount++;
        
        const time = this.gl.time.elapsed * 0.001;
        const camera = this.camera || this.gl.world.activeScenes.current?.activeCamera;

        if (!camera) return;

        // Use requestIdleCallback for non-critical updates
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                this.updateNonCritical(time, camera);
            });
        } else {
            this.updateNonCritical(time, camera);
        }

        // Critical updates (position and visibility)
        this.updateCritical(time, camera);
    }

    updateCritical(time, camera) {
        const flowStrength = 0.5 + (this.gl.audio?.frequencies?.synthLoop?.current || 0) * 0.001;

        this.activeElements.forEach((obj, index) => {
            const mesh = obj.mesh;
            const element = obj.element;
            const userData = mesh.userData;

            // Animate position with flow field
            const noiseX = Math.sin(time * 0.5 + index * 0.1) * 0.02;
            const noiseY = Math.cos(time * 0.3 + index * 0.15) * 0.02;
            const noiseZ = Math.sin(time * 0.7 + index * 0.2) * 0.02;

            mesh.position.x = userData.originalPosition.x + noiseX * flowStrength;
            mesh.position.y = userData.originalPosition.y + noiseY * flowStrength;
            mesh.position.z = userData.originalPosition.z + noiseZ * flowStrength;

            // Project 3D position to 2D screen coordinates
            const worldPosition = mesh.position.clone();
            worldPosition.project(camera);

            // Frustum culling
            if (this.settings.cullingEnabled) {
                const distance = worldPosition.z;
                if (distance > 1 || distance < -1) {
                    if (userData.isVisible) {
                        element.style.display = 'none';
                        userData.isVisible = false;
                    }
                    return;
                }
            }

            // Convert to screen coordinates
            const screenX = (worldPosition.x * 0.5 + 0.5) * this.gl.sizes.width;
            const screenY = (-worldPosition.y * 0.5 + 0.5) * this.gl.sizes.height;

            // Update element position using transform for better performance
            element.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;

            // Handle visibility
            const distance = worldPosition.z;
            const lifeAlpha = Math.sin(userData.life * Math.PI);
            const distanceAlpha = distance > 1 ? 0 : (1 - distance);
            const finalAlpha = lifeAlpha * distanceAlpha * 0.9;

            if (finalAlpha > 0.1 && !userData.isVisible) {
                element.style.display = 'block';
                userData.isVisible = true;
            } else if (finalAlpha <= 0.1 && userData.isVisible) {
                element.style.display = 'none';
                userData.isVisible = false;
            }

            if (userData.isVisible) {
                element.style.opacity = finalAlpha;
            }
        });
    }

    updateNonCritical(time, camera) {
        // Update life cycles and other non-critical properties
        this.activeElements.forEach((obj) => {
            const userData = obj.mesh.userData;
            userData.life += 0.005;
            if (userData.life > 1) userData.life = 0;
        });
    }

    setupDataUpdates() {
        // Update text content less frequently for better performance
        setInterval(() => {
            this.updateTextContent();
        }, this.settings.updateInterval);
        
        // Initial update
        this.updateTextContent();
    }

    updateTextContent() {
        this.currentMetrics = this.fleetData.getDisplayMetrics();
        
        this.activeElements.forEach((obj, index) => {
            if (index < this.currentMetrics.length) {
                this.updateElementContent(obj, this.currentMetrics[index]);
            }
        });
    }

    // Animation methods with performance optimizations
    triggerHover() {
        const tl = gsap.timeline({ delay: 0.5 });

        tl.fromTo(
            this.mesh.scale, 
            { x: 1, y: 1, z: 1 }, 
            {
                x: 1.15, y: 1.15, z: 1.15,
                duration: 0.5,
                ease: 'power2.inOut',
            }
        );

        tl.fromTo(
            this.mesh.scale, 
            { x: 1.15, y: 1.15, z: 1.15 }, 
            {
                x: 1, y: 1, z: 1,
                duration: 2,
                ease: 'power2.inOut',
                immediateRender: false,
            }
        );

        // Animate only visible elements
        this.activeElements.forEach((obj, index) => {
            if (obj.mesh.userData.isVisible) {
                gsap.fromTo(obj.element, {
                    scale: 1,
                }, {
                    scale: 1.1,
                    duration: 0.3,
                    ease: 'power2.inOut',
                    yoyo: true,
                    repeat: 1,
                    delay: index * 0.05
                });
            }
        });
    }

    triggerWave(direction, duration, ease, animateStrength = false, delay) {
        if (direction === 1) {
            gsap.fromTo(
                this.mesh.scale,
                { x: 0.1, y: 0.1, z: 0.1 },
                {
                    x: 1, y: 1, z: 1,
                    delay: delay || 0,
                    duration: duration !== undefined ? duration : 4.1,
                    ease: ease || 'power2.inOut',
                }
            );

            // Stagger animation for better performance
            this.activeElements.forEach((obj, index) => {
                if (obj.mesh.userData.isVisible) {
                    gsap.fromTo(obj.element, {
                        opacity: 0,
                        scale: 0.5,
                    }, {
                        opacity: 0.9,
                        scale: 1,
                        duration: duration !== undefined ? duration : 4.1,
                        ease: ease || 'power2.inOut',
                        delay: (delay || 0) + index * 0.1
                    });
                }
            });
        } else {
            gsap.fromTo(
                this.mesh.scale,
                { x: 1, y: 1, z: 1 },
                {
                    x: 0.1, y: 0.1, z: 0.1,
                    duration: duration !== undefined ? duration : 2.75,
                    ease: 'expo.inOut',
                }
            );

            this.activeElements.forEach((obj, index) => {
                if (obj.mesh.userData.isVisible) {
                    gsap.fromTo(obj.element, {
                        opacity: 0.9,
                        scale: 1,
                    }, {
                        opacity: 0,
                        scale: 0.5,
                        duration: duration !== undefined ? duration : 2.75,
                        ease: 'expo.inOut',
                        delay: index * 0.05
                    });
                }
            });
        }
    }

    resize() {
        // Optimized resize handling
        // No specific resize handling needed as elements auto-adjust
    }

    destroy() {
        console.log('ParticlesOptimized: Destroying system...');
        
        // Stop data simulation
        if (this.fleetData) {
            this.fleetData.destroy();
        }

        // Clean up all pooled objects
        this.textElementPool.forEach(obj => {
            if (obj.element && obj.element.parentNode) {
                obj.element.parentNode.removeChild(obj.element);
            }
            if (obj.mesh && obj.mesh.parent) {
                obj.mesh.parent.remove(obj.mesh);
            }
        });

        // Clear arrays
        this.textElementPool = [];
        this.activeElements = [];
        this.inactiveElements = [];
        this.currentMetrics = [];

        console.log('ParticlesOptimized: System destroyed');
    }
}