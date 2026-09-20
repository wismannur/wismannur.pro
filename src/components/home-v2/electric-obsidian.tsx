"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface ElectricObsidianProps {
  className?: string;
}

// Pixel-perfect vector coordinates of the official Wisman Nur repository monogram logo
// Composed of: Left Curly Bracket { , Right Curly Bracket } , and Interlocking W + A Monogram
const LOGO_POLYGONS: [number, number][][] = [
  // 1. Left Curly Bracket {
  [
    [-2.266, 1.892], [-1.419, 1.892], [-1.221, 1.441], [-1.804, 1.408],
    [-1.837, 0.429], [-1.936, 0.198], [-2.145, 0.011], [-1.925, -0.209],
    [-1.826, -0.484], [-1.804, -1.408], [-1.287, -1.419], [-1.529, -1.881],
    [-2.266, -1.881], [-2.277, -0.561], [-2.332, -0.396], [-2.431, -0.286],
    [-2.673, -0.22], [-2.673, 0.231], [-2.431, 0.297], [-2.332, 0.407],
    [-2.277, 0.572], [-2.266, 1.892]
  ],
  // 2. Right Curly Bracket }
  [
    [1.419, 1.892], [2.266, 1.881], [2.277, 0.528], [2.409, 0.308],
    [2.662, 0.231], [2.662, -0.22], [2.409, -0.297], [2.277, -0.517],
    [2.266, -1.881], [1.529, -1.881], [1.276, -1.419], [1.804, -1.397],
    [1.826, -0.44], [1.936, -0.176], [2.134, 0.0], [1.914, 0.22],
    [1.815, 0.484], [1.804, 1.408], [1.21, 1.419], [1.419, 1.892]
  ],
  // 3. Top Diamond Chevron of 'A'
  [
    [-0.132, 1.771], [0.132, 1.771], [0.638, 0.836], [0.385, 0.231],
    [0.0, 0.924], [-0.385, 0.22], [-0.638, 0.814], [-0.132, 1.771]
  ],
  // 4. Left Diagonal Leg of 'W'
  [
    [-1.65, 1.155], [-1.1, 1.155], [-0.638, 0.066], [-0.572, -0.121],
    [-0.88, -0.693], [-1.65, 1.155]
  ],
  // 5. Right Diagonal Leg of 'W'
  [
    [1.1, 1.155], [1.65, 1.155], [0.869, -0.693], [0.561, -0.099],
    [1.1, 1.155]
  ],
  // 6. Interlocking Bottom Chevron Apex of 'A'/'W'
  [
    [-0.011, 0.286], [1.177, -1.881], [0.594, -1.881], [0.0, -0.792],
    [-0.605, -1.881], [-1.188, -1.881], [-0.011, 0.286]
  ]
];

export function ElectricObsidian({ className = "" }: ElectricObsidianProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x0a0d18, 1.8);
    scene.add(ambientLight);

    // Key Light: Cool Indigo/Blue (Facet Reflections)
    const keyLight = new THREE.DirectionalLight(0x818cf8, 3.4);
    keyLight.position.set(5, 6, 5);
    scene.add(keyLight);

    // Electric Cyan Rim Light (Sharp Edge Highlights)
    const rimLightCyan = new THREE.PointLight(0x38bdf8, 4.2, 14);
    rimLightCyan.position.set(-4, -2, 3);
    scene.add(rimLightCyan);

    // Violet Accent Rim Light
    const rimLightViolet = new THREE.PointLight(0xa855f7, 3.5, 12);
    rimLightViolet.position.set(3, -4, -3);
    scene.add(rimLightViolet);

    // Core Monogram Light
    const coreLight = new THREE.PointLight(0x6366f1, 4.5, 8);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    // --- Main Logo Group ---
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    // --- Extrude Settings for Crystalline Obsidian Finish ---
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      steps: 1,
      depth: 0.36,
      bevelEnabled: true,
      bevelThickness: 0.16,
      bevelSize: 0.1,
      bevelSegments: 2, // 2 segments give crisp, gemstone-faceted bevels
    };

    // Obsidian Material: Jet Black with Mirror Glass Clearcoat & Specular
    const obsidianMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x06070a),
      emissive: new THREE.Color(0x0a0c16),
      roughness: 0.08,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      flatShading: true,
      transparent: true,
      opacity: 0.96,
    });

    // Wireframe Edges Material: Glowing Electric Indigo to Cyan Fissures
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.75,
      linewidth: 1.5,
    });

    const geometries: THREE.BufferGeometry[] = [];

    // Build the 6 3D extruded logo components
    LOGO_POLYGONS.forEach((poly) => {
      const shape = new THREE.Shape();
      shape.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) {
        shape.lineTo(poly[i][0], poly[i][1]);
      }
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometries.push(geom);

      const mesh = new THREE.Mesh(geom, obsidianMaterial);
      mesh.position.z = -extrudeSettings.depth / 2; // Center along Z axis
      logoGroup.add(mesh);

      const edgeGeom = new THREE.EdgesGeometry(geom, 12);
      geometries.push(edgeGeom);
      const edgeMesh = new THREE.LineSegments(edgeGeom, edgesMaterial);
      edgeMesh.position.z = -extrudeSettings.depth / 2;
      logoGroup.add(edgeMesh);
    });

    // --- Dynamic High-Voltage Electric Discharge Arcs between Brackets & Monogram ---
    const createLightningLine = () => {
      const segCount = 8;
      const positions = new Float32Array(segCount * 3);
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      return { line: new THREE.Line(geom, mat), segCount, geom, mat };
    };

    const arc1 = createLightningLine(); // Left bracket tip to W leg
    const arc2 = createLightningLine(); // Right bracket tip to W leg
    const arc3 = createLightningLine(); // Top A apex to bottom chevron
    logoGroup.add(arc1.line);
    logoGroup.add(arc2.line);
    logoGroup.add(arc3.line);

    const updateArc = (
      arc: ReturnType<typeof createLightningLine>,
      p1: THREE.Vector3,
      p2: THREE.Vector3,
      jitter: number
    ) => {
      const pos = arc.geom.attributes.position.array as Float32Array;
      for (let i = 0; i < arc.segCount; i++) {
        const t = i / (arc.segCount - 1);
        const x = p1.x + (p2.x - p1.x) * t + (i > 0 && i < arc.segCount - 1 ? (Math.random() - 0.5) * jitter : 0);
        const y = p1.y + (p2.y - p1.y) * t + (i > 0 && i < arc.segCount - 1 ? (Math.random() - 0.5) * jitter : 0);
        const z = p1.z + (p2.z - p1.z) * t + (i > 0 && i < arc.segCount - 1 ? (Math.random() - 0.5) * jitter : 0);

        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      arc.geom.attributes.position.needsUpdate = true;
    };

    // Key attachment points for electric arcs
    const pLeftBracket = new THREE.Vector3(-2.67, 0, 0.2);
    const pLeftLeg = new THREE.Vector3(-1.1, 0.6, 0.2);
    const pRightBracket = new THREE.Vector3(2.66, 0, 0.2);
    const pRightLeg = new THREE.Vector3(1.1, 0.6, 0.2);
    const pTopApex = new THREE.Vector3(0, 1.77, 0.2);
    const pBottomApex = new THREE.Vector3(0, -0.79, 0.2);

    // --- Floating Electric Energy Sparks / Motes ---
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particleRadii = new Float32Array(particleCount);
    const particleAngles = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 1.8;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3.4;

      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

      particleRadii[i] = radius;
      particleAngles[i] = angle;
      particleSpeeds[i] = 0.5 + Math.random() * 0.9;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 0.055,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- Interactive Mouse Parallax Tracking ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      mouseX = (x / rect.width) * 2 - 1;
      mouseY = -(y / rect.height) * 2 + 1;

      targetRotationY = mouseX * 0.75;
      targetRotationX = -mouseY * 0.55;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // --- Resize Observer ---
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW === 0 || newH === 0) return;

      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // --- Viewport Visibility Pause (Battery & Performance Saver) ---
    let isVisible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    intersectionObserver.observe(container);

    // --- Animation Loop ---
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let frameCount = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsedTime = clock.getElapsedTime();
      frameCount++;

      // Smooth damped rotation towards cursor
      logoGroup.rotation.y += (targetRotationY - logoGroup.rotation.y) * 0.045;
      logoGroup.rotation.x += (targetRotationX - logoGroup.rotation.x) * 0.045;

      // Base idle majestic rotation
      logoGroup.rotation.y += 0.0035;
      logoGroup.rotation.z = Math.sin(elapsedTime * 0.5) * 0.04;

      // Levitation floating breathing
      logoGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12;

      // Electric Pulse Oscillations
      const pulseSpeed = isHoveredRef.current ? 5.2 : 2.8;
      const pulse = Math.sin(elapsedTime * pulseSpeed);
      const normalizedPulse = (pulse + 1) * 0.5;

      // Pulse edge lines between electric indigo and vibrant cyan flare
      edgesMaterial.opacity = 0.6 + normalizedPulse * 0.4;
      if (normalizedPulse > 0.55) {
        edgesMaterial.color.setHex(0x38bdf8); // electric cyan flare
      } else {
        edgesMaterial.color.setHex(0x6366f1); // deep electric indigo
      }

      // Dynamic High-Voltage Lightning Crackle (updates every 3-4 frames)
      const crackleInterval = isHoveredRef.current ? 2 : 4;
      if (frameCount % crackleInterval === 0) {
        const jitter = isHoveredRef.current ? 0.45 : 0.25;
        updateArc(arc1, pLeftBracket, pLeftLeg, jitter);
        updateArc(arc2, pRightBracket, pRightLeg, jitter);
        updateArc(arc3, pTopApex, pBottomApex, jitter * 1.1);

        // Flash lightning discharge colors
        const boltColor = Math.random() > 0.35 ? 0x38bdf8 : 0xc084fc;
        arc1.mat.color.setHex(boltColor);
        arc2.mat.color.setHex(boltColor);
        arc3.mat.color.setHex(boltColor);
        arc1.mat.opacity = 0.35 + Math.random() * 0.6;
        arc2.mat.opacity = 0.35 + Math.random() * 0.6;
        arc3.mat.opacity = 0.35 + Math.random() * 0.6;
      }

      // Pulse core lighting intensity
      coreLight.intensity = 3.6 + normalizedPulse * 3.6;
      rimLightCyan.intensity = 3.2 + normalizedPulse * 2.5;

      // Animate Orbiting Sparks
      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        particleAngles[i] += particleSpeeds[i] * 0.009;
        positions[i * 3] = Math.cos(particleAngles[i]) * particleRadii[i];
        positions[i * 3 + 2] = Math.sin(particleAngles[i]) * particleRadii[i];
        positions[i * 3 + 1] += Math.sin(elapsedTime + i) * 0.0035;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // --- Cleanup & Memory Disposal ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", onPointerMove);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      geometries.forEach((g) => g.dispose());
      obsidianMaterial.dispose();
      edgesMaterial.dispose();
      arc1.geom.dispose();
      arc1.mat.dispose();
      arc2.geom.dispose();
      arc2.mat.dispose();
      arc3.geom.dispose();
      arc3.mat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      className={`relative w-full h-[380px] sm:h-[440px] md:h-[480px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-opacity duration-700 ${
        isLoaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      aria-label="3D Interactive Electric Obsidian Monogram Logo"
    >
      {/* Subtle Aura Halo behind the monogram */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-primary/25 via-cyan-500/10 to-indigo-500/15 blur-[75px] pointer-events-none -z-10" />
    </div>
  );
}
