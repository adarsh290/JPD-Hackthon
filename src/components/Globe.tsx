import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Ping {
  id: string;
  lat: number;
  lng: number;
  type: 'visit' | 'click';
}

// Convert Lat/Lng to 3D Cartesian coordinates
const latLngToVector3 = (lat: number, lng: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

// Major countries approx lat/lng
const countryData: Record<string, { lat: number; lng: number }> = {
  'US': { lat: 37.0902, lng: -95.7129 },
  'IN': { lat: 20.5937, lng: 78.9629 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'DE': { lat: 51.1657, lng: 10.4515 },
  'BR': { lat: -14.2350, lng: -51.9253 },
  'AU': { lat: -25.2744, lng: 133.7751 },
  'JP': { lat: 36.2048, lng: 138.2529 },
  'CA': { lat: 56.1304, lng: -106.3468 },
  'FR': { lat: 46.2276, lng: 2.2137 },
  'CN': { lat: 35.8617, lng: 104.1954 },
  'unknown': { lat: 0, lng: 0 },
};

function PingMesh({ ping }: { ping: Ping }) {
  const pos = useMemo(() => latLngToVector3(ping.lat, ping.lng, 2.05), [ping]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.5;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh position={pos} ref={meshRef}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial 
        color={ping.type === 'click' ? '#22d3ee' : '#00ff00'} 
        transparent 
        opacity={0.8}
      />
    </mesh>
  );
}

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          emissive="#00ff00" 
          emissiveIntensity={0.05} 
          wireframe
        />
        {/* Glow effect */}
        <mesh scale={[1.01, 1.01, 1.01]}>
          <sphereGeometry args={[2, 64, 64]} />
          <meshStandardMaterial color="#00ff00" transparent opacity={0.05} />
        </mesh>
      </mesh>
    </group>
  );
}

export function RotatableGlobe({ pings }: { pings: Ping[] }) {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00ff00" />
        <Earth />
        {pings.map(ping => (
          <PingMesh key={ping.id} ping={ping} />
        ))}
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={4} 
          maxDistance={10}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}
