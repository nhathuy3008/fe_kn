import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
    Html,
    OrbitControls,
    PerspectiveCamera,
    Stars,
} from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import {
    Bloom,
    EffectComposer,
    Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { createWish } from "../apis/wishApi";
import WishSky from "./WishSky";
import "./WishTree.css";

/* =========================================================
   BRANCH
========================================================= */

function Branch({
    start = [0, 0, 0],
    end = [0, 1, 0],
    startRadius = 0.15,
    endRadius = 0.08,
}) {
    const data = useMemo(() => {
        const from = new THREE.Vector3(...start);
        const to = new THREE.Vector3(...end);
        const direction = new THREE.Vector3().subVectors(to, from);
        const length = direction.length();
        const position = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
        const quaternion = new THREE.Quaternion();

        quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );

        return {
            position: position.toArray(),
            quaternion,
            length,
        };
    }, [start, end]);

    return (
        <mesh
            position={data.position}
            quaternion={data.quaternion}
            castShadow
            receiveShadow
        >
            <cylinderGeometry
                args={[endRadius, startRadius, data.length, 10]}
            />
            <meshStandardMaterial
                color="#3a2115"
                roughness={0.95}
            />
        </mesh>
    );
}

/* =========================================================
   LEAF
========================================================= */

function Leaf({
    position,
    scale,
    rotation,
    speed,
    offset,
}) {
    const ref = useRef();

    useFrame(({ clock }) => {
        if (!ref.current) return;

        const t = clock.elapsedTime;
        const windPhase = t * 0.65 - position[0] * 0.7;

        const wind = Math.pow(
            Math.max(0, Math.sin(windPhase)),
            5
        );

        const normalSway =
            Math.sin(t * speed + offset) * 0.06;

        ref.current.rotation.z =
            rotation[2] +
            normalSway +
            wind * 0.14;

        ref.current.rotation.x =
            rotation[0] +
            Math.cos(t * speed * 0.7 + offset) * 0.035 +
            wind * 0.04;

        ref.current.position.y =
            position[1] +
            Math.sin(t * speed * 0.6 + offset) * 0.025;

        ref.current.position.x =
            position[0] +
            wind * 0.035;
    });

    return (
        <mesh
            ref={ref}
            position={position}
            scale={scale}
            rotation={rotation}
        >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
                color="#174a36"
                emissive="#062a1d"
                emissiveIntensity={0.65}
                roughness={0.9}
            />
        </mesh>
    );
}

/* =========================================================
   STAR SHAPE
========================================================= */

function StarShape() {
    const shape = useMemo(() => {
        const star = new THREE.Shape();

        // Nhỏ hơn bản 70 sao để 120 sao không che kín tán cây.
        const outerRadius = 0.135;
        const innerRadius = 0.058;

        for (let i = 0; i < 10; i++) {
            const radius =
                i % 2 === 0
                    ? outerRadius
                    : innerRadius;

            const angle =
                (i / 10) * Math.PI * 2 -
                Math.PI / 2;

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                star.moveTo(x, y);
            } else {
                star.lineTo(x, y);
            }
        }

        star.closePath();
        return star;
    }, []);

    return <shapeGeometry args={[shape]} />;
}

/* =========================================================
   STAR DUST
========================================================= */

function StarDust({
    active = false,
    count = 10,
}) {
    const refs = useRef([]);

    const particles = useMemo(
        () =>
            Array.from({ length: count }, () => ({
                angle: Math.random() * Math.PI * 2,
                radius: 0.18 + Math.random() * 0.3,
                speed: 0.6 + Math.random() * 1.4,
                offset: Math.random() * Math.PI * 2,
                size: 0.008 + Math.random() * 0.014,
            })),
        [count]
    );

    useFrame(({ clock }) => {
        if (!active) return;

        const t = clock.elapsedTime;

        refs.current.forEach((mesh, index) => {
            if (!mesh) return;

            const p = particles[index];
            const angle =
                p.angle + t * p.speed;

            const radius =
                p.radius +
                Math.sin(t * 1.8 + p.offset) * 0.04;

            mesh.position.x =
                Math.cos(angle) * radius;

            mesh.position.y =
                Math.sin(angle) * radius +
                Math.sin(t * 2.4 + p.offset) * 0.08;

            mesh.position.z =
                Math.sin(angle * 1.7) * 0.12;

            const pulse =
                0.6 +
                Math.sin(t * 4 + p.offset) * 0.35;

            mesh.scale.setScalar(
                Math.max(0.2, pulse)
            );
        });
    });

    if (!active) return null;

    return (
        <group>
            {particles.map((particle, index) => (
                <mesh
                    key={index}
                    ref={(element) => {
                        refs.current[index] = element;
                    }}
                >
                    <sphereGeometry
                        args={[particle.size, 6, 6]}
                    />
                    <meshBasicMaterial
                        color="#fff0a6"
                        transparent
                        opacity={0.9}
                        depthWrite={false}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* =========================================================
   WISH STAR
========================================================= */

function WishStar({
    star,
    index,
    onClick,
    sendingStarId,
    sentStarId,
    selectedStarId,
}) {
    const groupRef = useRef();
    const glowRef = useRef();
    const coreRef = useRef();
    const starMaterialRef = useRef();

    const [hovered, setHovered] =
        useState(false);

    const isSending =
        sendingStarId === star.id;

    const isSent =
        sentStarId === star.id;

    const isSelected =
        selectedStarId === star.id;

    const twinkle = useMemo(
        () => ({
            speed: 1.2 + Math.random() * 2.2,
            offset: Math.random() * Math.PI * 2,
            flashOffset: Math.random() * 15,
            flashSpeed: 0.15 + Math.random() * 0.08,
        }),
        []
    );

    useEffect(() => {
        return () => {
            document.body.style.cursor =
                "default";
        };
    }, []);

    useFrame(({ clock }) => {
        if (!groupRef.current) return;

        const t = clock.elapsedTime;

        if (isSent) {
            groupRef.current.position.y += 0.11;
            groupRef.current.position.z += 0.025;
            groupRef.current.rotation.z += 0.04;

            groupRef.current.scale.lerp(
                new THREE.Vector3(1.8, 1.8, 1.8),
                0.04
            );

            return;
        }

        groupRef.current.position.y =
            star.position[1] +
            Math.sin(t * star.speed + star.offset) * 0.08;

        groupRef.current.rotation.z =
            Math.sin(t * 0.5 + index) * 0.12;

        const pulse =
            0.78 +
            Math.sin(t * twinkle.speed + twinkle.offset) * 0.18;

        const flashWave =
            Math.sin(
                t * twinkle.flashSpeed +
                twinkle.flashOffset
            );

        const flash =
            flashWave > 0.97
                ? (flashWave - 0.97) * 18
                : 0;

        let targetScale = pulse + flash;

        if (hovered) targetScale = 1.55;
        if (isSelected) targetScale = 1.75;
        if (isSending) targetScale = 1.9;

        groupRef.current.scale.lerp(
            new THREE.Vector3(
                targetScale,
                targetScale,
                targetScale
            ),
            0.08
        );

        if (glowRef.current) {
            glowRef.current.material.opacity =
                isSelected
                    ? 0.25
                    : hovered
                      ? 0.17
                      : 0.035 +
                        pulse * 0.035 +
                        flash * 0.1;
        }

        if (coreRef.current) {
            const coreScale =
                0.8 +
                pulse * 0.25 +
                flash * 0.4;

            coreRef.current.scale.setScalar(
                coreScale
            );
        }

        if (starMaterialRef.current) {
            starMaterialRef.current.opacity =
                Math.min(
                    1,
                    0.72 +
                        pulse * 0.25 +
                        flash
                );
        }
    });

    return (
        <group
            ref={groupRef}
            position={star.position}
            onClick={(event) => {
                event.stopPropagation();

                if (!isSending && !isSent) {
                    onClick(star);
                }
            }}
            onPointerOver={(event) => {
                event.stopPropagation();

                if (!isSent) {
                    setHovered(true);
                    document.body.style.cursor =
                        "pointer";
                }
            }}
            onPointerOut={() => {
                setHovered(false);
                document.body.style.cursor =
                    "default";
            }}
        >
            <mesh ref={glowRef}>
                <sphereGeometry
                    args={[
                        isSelected ? 0.36 : 0.27,
                        12,
                        12,
                    ]}
                />
                <meshBasicMaterial
                    color="#ffd95f"
                    transparent
                    opacity={0.06}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            <mesh>
                <StarShape />
                <meshBasicMaterial
                    ref={starMaterialRef}
                    color={
                        isSelected
                            ? "#fff7c4"
                            : hovered
                              ? "#fff8c9"
                              : "#ffe174"
                    }
                    transparent
                    opacity={1}
                    toneMapped={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <mesh
                ref={coreRef}
                position={[0, 0, -0.01]}
            >
                <circleGeometry args={[0.055, 16]} />
                <meshBasicMaterial
                    color="#ffffff"
                    toneMapped={false}
                />
            </mesh>

            <StarDust
                active={
                    hovered ||
                    isSelected ||
                    isSending
                }
                count={10}
            />

            {hovered &&
                !isSelected &&
                !isSending &&
                !isSent && (
                    <Html
                        center
                        position={[0, 0.4, 0]}
                        distanceFactor={8}
                    >
                        <div className="wish-star-tooltip">
                            <span>✦</span>
                            Chọn vì sao này
                        </div>
                    </Html>
                )}
        </group>
    );
}

/* =========================================================
   METEOR SHOWER - 1 POINTS OBJECT
========================================================= */

function MeteorShower({
    count = 100,
}) {
    const pointsRef = useRef();

    const meteors = useMemo(() => {
        const positions =
            new Float32Array(count * 3);

        const data = Array.from(
            { length: count },
            (_, i) => {
                const startX =
                    -16 + Math.random() * 24;

                const startY =
                    4 + Math.random() * 9;

                const startZ =
                    -8 - Math.random() * 22;

                positions[i * 3] = startX;
                positions[i * 3 + 1] = startY;
                positions[i * 3 + 2] = startZ;

                return {
                    startX,
                    startY,
                    startZ,
                    speed: 0.7 + Math.random() * 1.3,
                    delay: Math.random() * 16,
                    distance: 8 + Math.random() * 12,
                    drop: 4 + Math.random() * 7,
                };
            }
        );

        return {
            positions,
            data,
        };
    }, [count]);

    useFrame(({ clock }) => {
        if (!pointsRef.current) return;

        const positions =
            pointsRef.current.geometry.attributes.position.array;

        const time = clock.elapsedTime;

        for (let i = 0; i < count; i++) {
            const meteor = meteors.data[i];

            // Nhiều sao băng xuất hiện thường xuyên hơn.
            const cycle = 7;
            const localTime =
                (time * meteor.speed + meteor.delay) %
                cycle;

            const duration = 1.5;

            if (localTime < duration) {
                const progress =
                    localTime / duration;

                positions[i * 3] =
                    meteor.startX +
                    progress * meteor.distance;

                positions[i * 3 + 1] =
                    meteor.startY -
                    progress * meteor.drop;

                positions[i * 3 + 2] =
                    meteor.startZ;
            } else {
                positions[i * 3] = 999;
                positions[i * 3 + 1] = 999;
                positions[i * 3 + 2] = 999;
            }
        }

        pointsRef.current.geometry.attributes.position.needsUpdate =
            true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[meteors.positions, 3]}
                />
            </bufferGeometry>

            <pointsMaterial
                size={0.15}
                color="#ffffff"
                transparent
                opacity={0.95}
                depthWrite={false}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
}

/* =========================================================
   METEOR TRAILS
========================================================= */

function MeteorTrails({
    count = 50,
}) {
    const groupRef = useRef();

    const meteors = useMemo(
        () =>
            Array.from({ length: count }, () => ({
                x: -15 + Math.random() * 20,
                y: 4 + Math.random() * 8,
                z: -7 - Math.random() * 18,
                delay: Math.random() * 16,
                speed: 0.7 + Math.random() * 0.7,
                length: 1.7 + Math.random() * 3.3,
                distance: 9 + Math.random() * 5,
                drop: 4 + Math.random() * 3,
            })),
        [count]
    );

    useFrame(({ clock }) => {
        if (!groupRef.current) return;

        const t = clock.elapsedTime;

        groupRef.current.children.forEach(
            (meteor, index) => {
                const data = meteors[index];

                const cycle = 8;

                const local =
                    (t * data.speed + data.delay) %
                    cycle;

                const duration = 1.35;

                if (local > duration) {
                    meteor.visible = false;
                    return;
                }

                meteor.visible = true;

                const progress =
                    local / duration;

                meteor.position.x =
                    data.x +
                    progress * data.distance;

                meteor.position.y =
                    data.y -
                    progress * data.drop;

                meteor.position.z =
                    data.z;

                const opacity =
                    Math.sin(progress * Math.PI);

                meteor.children.forEach(
                    (child) => {
                        if (child.material) {
                            const base =
                                child.userData.baseOpacity ??
                                1;

                            child.material.opacity =
                                opacity * base;
                        }
                    }
                );
            }
        );
    });

    return (
        <group ref={groupRef}>
            {meteors.map((meteor, index) => (
                <group
                    key={index}
                    rotation={[0, 0, -0.43]}
                    visible={false}
                >
                    <mesh
                        position={[
                            -meteor.length / 2,
                            0,
                            0,
                        ]}
                        userData={{
                            baseOpacity: 0.25,
                        }}
                    >
                        <planeGeometry
                            args={[
                                meteor.length,
                                0.025,
                            ]}
                        />
                        <meshBasicMaterial
                            color="#87cfff"
                            transparent
                            opacity={0.25}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                            toneMapped={false}
                        />
                    </mesh>

                    <mesh
                        position={[
                            -meteor.length * 0.25,
                            0,
                            0.01,
                        ]}
                        userData={{
                            baseOpacity: 0.65,
                        }}
                    >
                        <planeGeometry
                            args={[
                                meteor.length * 0.5,
                                0.018,
                            ]}
                        />
                        <meshBasicMaterial
                            color="#e7f7ff"
                            transparent
                            opacity={0.65}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                            toneMapped={false}
                        />
                    </mesh>

                    <mesh
                        userData={{
                            baseOpacity: 0.2,
                        }}
                    >
                        <sphereGeometry
                            args={[0.12, 6, 6]}
                        />
                        <meshBasicMaterial
                            color="#a8dfff"
                            transparent
                            opacity={0.2}
                            depthWrite={false}
                            blending={THREE.AdditiveBlending}
                            toneMapped={false}
                        />
                    </mesh>

                    <mesh
                        userData={{
                            baseOpacity: 1,
                        }}
                    >
                        <sphereGeometry
                            args={[0.04, 6, 6]}
                        />
                        <meshBasicMaterial
                            color="#ffffff"
                            transparent
                            opacity={1}
                            depthWrite={false}
                            toneMapped={false}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/* =========================================================
   FIREFLIES - OPTIMIZED POINTS
========================================================= */

function Fireflies({
    count = 100,
}) {
    const ref = useRef();

    const data = useMemo(() => {
        const positions =
            new Float32Array(count * 3);

        const original =
            new Float32Array(count * 3);

        const speed =
            new Float32Array(count);

        const offset =
            new Float32Array(count);

        const radius =
            new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            const x =
                (Math.random() - 0.5) * 9;

            const y =
                Math.random() * 6 - 1.5;

            const z =
                (Math.random() - 0.5) * 5;

            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

            original[i3] = x;
            original[i3 + 1] = y;
            original[i3 + 2] = z;

            speed[i] =
                0.25 + Math.random() * 0.65;

            offset[i] =
                Math.random() * Math.PI * 2;

            radius[i] =
                0.15 + Math.random() * 0.55;
        }

        return {
            positions,
            original,
            speed,
            offset,
            radius,
        };
    }, [count]);

    useFrame(({ clock }) => {
        if (!ref.current) return;

        const t = clock.elapsedTime;

        const positions =
            ref.current.geometry.attributes.position.array;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            positions[i3] =
                data.original[i3] +
                Math.sin(
                    t * data.speed[i] +
                    data.offset[i]
                ) *
                    data.radius[i];

            positions[i3 + 1] =
                data.original[i3 + 1] +
                Math.sin(
                    t * data.speed[i] * 1.3 +
                    data.offset[i]
                ) *
                    0.35;

            positions[i3 + 2] =
                data.original[i3 + 2] +
                Math.cos(
                    t * data.speed[i] * 0.8 +
                    data.offset[i]
                ) *
                    data.radius[i];
        }

        ref.current.geometry.attributes.position.needsUpdate =
            true;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[data.positions, 3]}
                />
            </bufferGeometry>

            <pointsMaterial
                size={0.055}
                color="#ffe693"
                transparent
                opacity={0.8}
                depthWrite={false}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
}

/* =========================================================
   HEART TEXTURE
========================================================= */

function createHeartTexture() {
    const canvas =
        document.createElement("canvas");

    canvas.width = 64;
    canvas.height = 64;

    const ctx =
        canvas.getContext("2d");

    if (!ctx) {
        throw new Error(
            "Không thể tạo canvas cho HeartRain."
        );
    }

    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.moveTo(32, 56);

    ctx.bezierCurveTo(
        28,
        51,
        7,
        38,
        7,
        21
    );

    ctx.bezierCurveTo(
        7,
        9,
        21,
        4,
        32,
        17
    );

    ctx.bezierCurveTo(
        43,
        4,
        57,
        9,
        57,
        21
    );

    ctx.bezierCurveTo(
        57,
        38,
        36,
        51,
        32,
        56
    );

    ctx.closePath();
    ctx.fill();

    const texture =
        new THREE.CanvasTexture(canvas);

    texture.colorSpace =
        THREE.SRGBColorSpace;

    texture.needsUpdate = true;

    return texture;
}

/* =========================================================
   HEART RAIN - 150 HEARTS IN ONE POINTS OBJECT
========================================================= */

function HeartRain({
    count = 150,
}) {
    const ref = useRef();

    const heartTexture = useMemo(
        () => createHeartTexture(),
        []
    );

    const data = useMemo(() => {
        const positions =
            new Float32Array(count * 3);

        const baseX =
            new Float32Array(count);

        const speeds =
            new Float32Array(count);

        const swaySpeeds =
            new Float32Array(count);

        const swayAmounts =
            new Float32Array(count);

        const offsets =
            new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            const x =
                (Math.random() - 0.5) * 16;

            const y =
                -4 + Math.random() * 15;

            const z =
                -4 + Math.random() * 8;

            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

            baseX[i] = x;

            speeds[i] =
                0.25 + Math.random() * 0.5;

            swaySpeeds[i] =
                0.5 + Math.random() * 0.8;

            swayAmounts[i] =
                0.15 + Math.random() * 0.65;

            offsets[i] =
                Math.random() * Math.PI * 2;
        }

        return {
            positions,
            baseX,
            speeds,
            swaySpeeds,
            swayAmounts,
            offsets,
        };
    }, [count]);

    useEffect(() => {
        return () => {
            heartTexture.dispose();
        };
    }, [heartTexture]);

    useFrame(({ clock }, delta) => {
        if (!ref.current) return;

        const t = clock.elapsedTime;

        const attribute =
            ref.current.geometry.attributes.position;

        const positions =
            attribute.array;

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Trái tim bay từ dưới lên như các điều ước.
            positions[i3 + 1] +=
                delta * data.speeds[i];

            positions[i3] =
                data.baseX[i] +
                Math.sin(
                    t * data.swaySpeeds[i] +
                    data.offsets[i]
                ) *
                    data.swayAmounts[i];

            if (positions[i3 + 1] > 9) {
                positions[i3 + 1] =
                    -4 - Math.random() * 3;

                data.baseX[i] =
                    (Math.random() - 0.5) * 16;

                positions[i3] =
                    data.baseX[i];

                positions[i3 + 2] =
                    -4 + Math.random() * 8;
            }
        }

        attribute.needsUpdate = true;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[data.positions, 3]}
                />
            </bufferGeometry>

            <pointsMaterial
                map={heartTexture}
                alphaMap={heartTexture}
                size={0.18}
                color="#ff8fa8"
                transparent
                opacity={0.72}
                alphaTest={0.05}
                depthWrite={false}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                toneMapped={false}
            />
        </points>
    );
}

/* =========================================================
   MAGIC SWING
========================================================= */

/* =========================================================
   KHÁNH NGỌC - 3D CHARACTER
========================================================= */

function LittleGirl3D() {
    const hairRef = useRef();
    const leftLegRef = useRef();
    const rightLegRef = useRef();
    const nameRef = useRef();

    useFrame(({ clock }) => {
        const t = clock.elapsedTime;

        // Tóc chuyển động nhẹ
        if (hairRef.current) {
            hairRef.current.rotation.z =
                Math.sin(t * 1.2) * 0.035;
        }

        // Chân đung đưa nhẹ
        if (leftLegRef.current) {
            leftLegRef.current.rotation.x =
                -0.18 +
                Math.sin(t * 1.3) * 0.05;
        }

        if (rightLegRef.current) {
            rightLegRef.current.rotation.x =
                -0.18 +
                Math.sin(t * 1.3 + 0.3) * 0.05;
        }

        // Tên bay nhẹ
        if (nameRef.current) {
            nameRef.current.position.y =
                1.82 +
                Math.sin(t * 1.5) * 0.025;
        }
    });

    return (
        <group
            position={[0, -1.14, 0.02]}
            scale={0.42}
        >
            {/* =====================================
                CHÂN
            ===================================== */}

            <group
                ref={leftLegRef}
                position={[-0.2, -0.45, 0.08]}
                rotation={[-0.18, 0, 0]}
            >
                {/* đùi */}

                <mesh
                    position={[0, -0.27, 0.12]}
                    rotation={[0.35, 0, 0]}
                >
                    <capsuleGeometry
                        args={[0.095, 0.4, 6, 10]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                        roughness={0.75}
                    />
                </mesh>

                {/* cẳng chân */}

                <mesh
                    position={[0, -0.68, 0.26]}
                    rotation={[0.08, 0, 0]}
                >
                    <capsuleGeometry
                        args={[0.08, 0.42, 6, 10]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                        roughness={0.75}
                    />
                </mesh>

                {/* giày */}

                <mesh
                    position={[0, -0.96, 0.35]}
                    rotation={[0.1, 0, 0]}
                >
                    <sphereGeometry
                        args={[0.12, 12, 10]}
                    />

                    <meshStandardMaterial
                        color="#f6e6cf"
                        roughness={0.65}
                    />
                </mesh>
            </group>

            <group
                ref={rightLegRef}
                position={[0.2, -0.45, 0.08]}
                rotation={[-0.18, 0, 0]}
            >
                <mesh
                    position={[0, -0.27, 0.12]}
                    rotation={[0.35, 0, 0]}
                >
                    <capsuleGeometry
                        args={[0.095, 0.4, 6, 10]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                        roughness={0.75}
                    />
                </mesh>

                <mesh
                    position={[0, -0.68, 0.26]}
                    rotation={[0.08, 0, 0]}
                >
                    <capsuleGeometry
                        args={[0.08, 0.42, 6, 10]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                        roughness={0.75}
                    />
                </mesh>

                <mesh
                    position={[0, -0.96, 0.35]}
                    rotation={[0.1, 0, 0]}
                >
                    <sphereGeometry
                        args={[0.12, 12, 10]}
                    />

                    <meshStandardMaterial
                        color="#f6e6cf"
                        roughness={0.65}
                    />
                </mesh>
            </group>

            {/* =====================================
                VÁY
            ===================================== */}

            <mesh
                position={[0, 0.03, 0]}
                rotation={[0, 0, 0]}
            >
                <coneGeometry
                    args={[
                        0.52,
                        0.85,
                        24,
                        1,
                        true,
                    ]}
                />

                <meshStandardMaterial
                    color="#f4b9cf"
                    emissive="#6b3049"
                    emissiveIntensity={0.18}
                    roughness={0.65}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* lớp váy ngoài */}

            <mesh position={[0, -0.04, 0]}>
                <coneGeometry
                    args={[
                        0.58,
                        0.7,
                        24,
                        1,
                        true,
                    ]}
                />

                <meshStandardMaterial
                    color="#ffd5e4"
                    transparent
                    opacity={0.35}
                    roughness={0.5}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* =====================================
                THÂN
            ===================================== */}

            <mesh position={[0, 0.53, 0]}>
                <capsuleGeometry
                    args={[0.25, 0.35, 8, 12]}
                />

                <meshStandardMaterial
                    color="#f1b2ca"
                    roughness={0.7}
                />
            </mesh>

            {/* cổ */}

            <mesh position={[0, 0.87, 0]}>
                <cylinderGeometry
                    args={[
                        0.09,
                        0.1,
                        0.18,
                        12,
                    ]}
                />

                <meshStandardMaterial
                    color="#ffd7c2"
                />
            </mesh>

            {/* =====================================
                TAY TRÁI - HƯỚNG TỚI DÂY
            ===================================== */}

            <group
                position={[-0.27, 0.64, 0]}
                rotation={[
                    0,
                    0,
                    -0.72,
                ]}
            >
                <mesh
                    position={[-0.22, 0, 0]}
                >
                    <capsuleGeometry
                        args={[
                            0.07,
                            0.32,
                            6,
                            10,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                    />
                </mesh>

                <mesh
                    position={[
                        -0.48,
                        0.03,
                        0,
                    ]}
                    rotation={[
                        0,
                        0,
                        -0.35,
                    ]}
                >
                    <capsuleGeometry
                        args={[
                            0.06,
                            0.3,
                            6,
                            10,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                    />
                </mesh>

                {/* bàn tay */}

                <mesh
                    position={[
                        -0.68,
                        0.1,
                        0,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            0.085,
                            10,
                            10,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                    />
                </mesh>
            </group>

            {/* =====================================
                TAY PHẢI
            ===================================== */}

            <group
                position={[0.27, 0.64, 0]}
                rotation={[
                    0,
                    0,
                    0.72,
                ]}
            >
                <mesh
                    position={[0.22, 0, 0]}
                >
                    <capsuleGeometry
                        args={[
                            0.07,
                            0.32,
                            6,
                            10,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                    />
                </mesh>

                <mesh
                    position={[
                        0.48,
                        0.03,
                        0,
                    ]}
                    rotation={[
                        0,
                        0,
                        0.35,
                    ]}
                >
                    <capsuleGeometry
                        args={[
                            0.06,
                            0.3,
                            6,
                            10,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                    />
                </mesh>

                <mesh
                    position={[
                        0.68,
                        0.1,
                        0,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            0.085,
                            10,
                            10,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#ffd7c2"
                    />
                </mesh>
            </group>

            {/* =====================================
                ĐẦU
            ===================================== */}

            <mesh position={[0, 1.18, 0]}>
                <sphereGeometry
                    args={[0.36, 24, 24]}
                />

                <meshStandardMaterial
                    color="#ffd7c2"
                    roughness={0.75}
                />
            </mesh>

            {/* =====================================
                TÓC
            ===================================== */}

            <group ref={hairRef}>
                {/* tóc sau */}

                <mesh
                    position={[
                        0,
                        1.16,
                        -0.12,
                    ]}
                    scale={[
                        1.05,
                        1.18,
                        0.8,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            0.4,
                            20,
                            20,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#3b251f"
                        roughness={0.85}
                    />
                </mesh>

                {/* tóc dài trái */}

                <mesh
                    position={[
                        -0.28,
                        0.78,
                        -0.08,
                    ]}
                    rotation={[
                        0,
                        0,
                        0.08,
                    ]}
                >
                    <capsuleGeometry
                        args={[
                            0.12,
                            0.65,
                            8,
                            10,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#3b251f"
                        roughness={0.9}
                    />
                </mesh>

                {/* tóc dài phải */}

                <mesh
                    position={[
                        0.28,
                        0.78,
                        -0.08,
                    ]}
                    rotation={[
                        0,
                        0,
                        -0.08,
                    ]}
                >
                    <capsuleGeometry
                        args={[
                            0.12,
                            0.65,
                            8,
                            10,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#3b251f"
                        roughness={0.9}
                    />
                </mesh>

                {/* mái */}

                <mesh
                    position={[
                        0,
                        1.38,
                        0.23,
                    ]}
                    scale={[
                        1,
                        0.45,
                        0.3,
                    ]}
                >
                    <sphereGeometry
                        args={[
                            0.34,
                            18,
                            18,
                        ]}
                    />

                    <meshStandardMaterial
                        color="#3b251f"
                    />
                </mesh>
            </group>

            {/* =====================================
                MẮT
            ===================================== */}

            <mesh
                position={[
                    -0.125,
                    1.2,
                    0.335,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.035,
                        10,
                        10,
                    ]}
                />

                <meshBasicMaterial
                    color="#2d211e"
                />
            </mesh>

            <mesh
                position={[
                    0.125,
                    1.2,
                    0.335,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.035,
                        10,
                        10,
                    ]}
                />

                <meshBasicMaterial
                    color="#2d211e"
                />
            </mesh>

            {/* highlight mắt */}

            <mesh
                position={[
                    -0.113,
                    1.215,
                    0.365,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.012,
                        8,
                        8,
                    ]}
                />

                <meshBasicMaterial
                    color="#ffffff"
                    toneMapped={false}
                />
            </mesh>

            <mesh
                position={[
                    0.137,
                    1.215,
                    0.365,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.012,
                        8,
                        8,
                    ]}
                />

                <meshBasicMaterial
                    color="#ffffff"
                    toneMapped={false}
                />
            </mesh>

            {/* =====================================
                MÁ HỒNG
            ===================================== */}

            <mesh
                position={[
                    -0.22,
                    1.08,
                    0.33,
                ]}
                scale={[1.4, 0.65, 1]}
            >
                <sphereGeometry
                    args={[
                        0.045,
                        8,
                        8,
                    ]}
                />

                <meshBasicMaterial
                    color="#f4a6aa"
                    transparent
                    opacity={0.55}
                />
            </mesh>

            <mesh
                position={[
                    0.22,
                    1.08,
                    0.33,
                ]}
                scale={[1.4, 0.65, 1]}
            >
                <sphereGeometry
                    args={[
                        0.045,
                        8,
                        8,
                    ]}
                />

                <meshBasicMaterial
                    color="#f4a6aa"
                    transparent
                    opacity={0.55}
                />
            </mesh>

            {/* =====================================
                MIỆNG
            ===================================== */}

            <mesh
                position={[
                    0,
                    1.035,
                    0.35,
                ]}
                scale={[1.4, 0.45, 1]}
            >
                <sphereGeometry
                    args={[
                        0.035,
                        10,
                        10,
                    ]}
                />

                <meshBasicMaterial
                    color="#b96570"
                />
            </mesh>

            {/* =====================================
                KẸP TÓC NGÔI SAO
            ===================================== */}

            <mesh
                position={[
                    0.27,
                    1.4,
                    0.25,
                ]}
                scale={0.11}
                rotation={[
                    0,
                    0,
                    0.2,
                ]}
            >
                <StarShape />

                <meshBasicMaterial
                    color="#ffe89c"
                    toneMapped={false}
                />
            </mesh>

            {/* =====================================
                GLOW NHẸ
            ===================================== */}

            <pointLight
                position={[
                    0,
                    0.8,
                    0.5,
                ]}
                color="#ffd1df"
                intensity={0.4}
                distance={2.5}
            />

            {/* =====================================
                TÊN
            ===================================== */}

            <group
                ref={nameRef}
                position={[
                    0,
                    1.82,
                    0,
                ]}
            >
                <Html
                    center
                    transform
                    distanceFactor={7}
                    style={{
                        pointerEvents:
                            "none",
                    }}
                >
                    <div
                        style={{
                            padding:
                                "5px 11px",
                            border:
                                "1px solid rgba(255,225,160,.28)",
                            borderRadius:
                                "999px",

                            background:
                                "rgba(12,16,30,.48)",

                            backdropFilter:
                                "blur(7px)",

                            color:
                                "#fff1c4",

                            fontFamily:
                                "Arial, sans-serif",

                            fontSize:
                                "9px",

                            fontWeight:
                                600,

                            whiteSpace:
                                "nowrap",

                            letterSpacing:
                                ".5px",

                            boxShadow:
                                "0 0 15px rgba(255,210,130,.12)",

                            textShadow:
                                "0 0 7px rgba(255,225,170,.55)",
                        }}
                    >
                        ✦ Khánh Ngọc ✦
                    </div>
                </Html>
            </group>
        </group>
    );
}


/* =========================================================
   MAGIC SWING + KHÁNH NGỌC
========================================================= */

function MagicSwing() {
    const swingRef = useRef();
    const glowRef = useRef();

    useFrame(({ clock }) => {
        const t =
            clock.elapsedTime;

        if (swingRef.current) {
            swingRef.current.rotation.z =
                Math.sin(
                    t * 0.7
                ) * 0.035;
        }

        if (glowRef.current) {
            glowRef.current.material.opacity =
                0.05 +
                Math.sin(
                    t * 1.5
                ) *
                    0.02;
        }
    });

    return (
        <group
            ref={swingRef}

            // Nếu xích đu bị lá che,
            // tăng Z từ 2.15 -> 2.5
            position={[
                1.55,
                3.35,
                2.15,
            ]}
        >
            {/* =====================================
                DÂY TRÁI
            ===================================== */}

            <mesh
                position={[
                    -0.32,
                    -0.75,
                    0,
                ]}
            >
                <cylinderGeometry
                    args={[
                        0.014,
                        0.014,
                        1.7,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#9a7951"
                    roughness={0.95}
                />
            </mesh>

            {/* =====================================
                DÂY PHẢI
            ===================================== */}

            <mesh
                position={[
                    0.32,
                    -0.75,
                    0,
                ]}
            >
                <cylinderGeometry
                    args={[
                        0.014,
                        0.014,
                        1.7,
                        8,
                    ]}
                />

                <meshStandardMaterial
                    color="#9a7951"
                    roughness={0.95}
                />
            </mesh>

            {/* =====================================
                GHẾ GỖ
            ===================================== */}

            <mesh
                position={[
                    0,
                    -1.62,
                    0,
                ]}
                castShadow
            >
                <boxGeometry
                    args={[
                        0.95,
                        0.1,
                        0.42,
                    ]}
                />

                <meshStandardMaterial
                    color="#654126"
                    roughness={0.82}
                />
            </mesh>

            {/* cạnh ghế sáng nhẹ */}

            <mesh
                position={[
                    0,
                    -1.565,
                    0.02,
                ]}
            >
                <boxGeometry
                    args={[
                        0.86,
                        0.015,
                        0.35,
                    ]}
                />

                <meshBasicMaterial
                    color="#c79558"
                    transparent
                    opacity={0.38}
                />
            </mesh>

            {/* =====================================
                KHÁNH NGỌC
            ===================================== */}

            <LittleGirl3D />

            {/* =====================================
                GLOW XÍCH ĐU
            ===================================== */}

            <mesh
                ref={glowRef}
                position={[
                    0,
                    -1.55,
                    0,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.75,
                        14,
                        14,
                    ]}
                />

                <meshBasicMaterial
                    color="#ffd878"
                    transparent
                    opacity={0.055}
                    depthWrite={false}
                    blending={
                        THREE.AdditiveBlending
                    }
                    toneMapped={false}
                />
            </mesh>

            {/* =====================================
                ĐOM ĐÓM XUNG QUANH
            ===================================== */}

            <mesh
                position={[
                    -0.7,
                    -1.2,
                    0.3,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.025,
                        6,
                        6,
                    ]}
                />

                <meshBasicMaterial
                    color="#fff0a0"
                    toneMapped={false}
                />
            </mesh>

            <mesh
                position={[
                    0.65,
                    -0.85,
                    0.2,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.02,
                        6,
                        6,
                    ]}
                />

                <meshBasicMaterial
                    color="#fff4b5"
                    toneMapped={false}
                />
            </mesh>

            <mesh
                position={[
                    0.78,
                    -1.55,
                    0.25,
                ]}
            >
                <sphereGeometry
                    args={[
                        0.022,
                        6,
                        6,
                    ]}
                />

                <meshBasicMaterial
                    color="#ffe17d"
                    toneMapped={false}
                />
            </mesh>

            <pointLight
                position={[
                    0,
                    -1.25,
                    0.7,
                ]}
                color="#ffe1a0"
                intensity={0.45}
                distance={3}
            />
        </group>
    );
}

/* =========================================================
   WISH SIGN
========================================================= */

function WishSign() {
    const signRef = useRef();

    useFrame(({ clock }) => {
        if (!signRef.current) return;
        signRef.current.rotation.z =
            Math.sin(clock.elapsedTime * 0.6) * 0.018;
    });

    return (
        <group position={[-1.65, -2.18, 1.6]}>
            <mesh position={[0, -0.38, 0]} rotation={[0, 0, 0.06]}>
                <boxGeometry args={[0.08, 0.9, 0.08]} />
                <meshStandardMaterial color="#4b2d1d" roughness={1} />
            </mesh>

            <group ref={signRef}>
                <mesh>
                    <boxGeometry args={[1.55, 0.5, 0.08]} />
                    <meshStandardMaterial color="#392317" roughness={0.9} />
                </mesh>

                <Html
                    center
                    transform
                    position={[0, 0, 0.055]}
                    distanceFactor={8}
                    style={{ pointerEvents: "none" }}
                >
                    <div
                        style={{
                            color: "#ffe6a0",
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: "7px",
                            whiteSpace: "nowrap",
                            letterSpacing: "1.5px",
                            textShadow: "0 0 8px rgba(255,220,130,.85)",
                        }}
                    >
                        ✦ MAKE A WISH ✦
                    </div>
                </Html>
            </group>
        </group>
    );
}

/* =========================================================
   MAGIC MUSHROOMS
========================================================= */

function MagicMushrooms() {
    const refs = useRef([]);

    const mushrooms = useMemo(
        () => [
            [-2.35, -2.42, 1.25, 0.15],
            [-1.95, -2.43, 1.55, 0.1],
            [-1.35, -2.42, 1.85, 0.12],
            [1.25, -2.42, 1.85, 0.12],
            [1.75, -2.42, 1.55, 0.16],
            [2.25, -2.43, 1.25, 0.1],
        ],
        []
    );

    useFrame(({ clock }) => {
        refs.current.forEach((mesh, index) => {
            if (!mesh) return;
            const pulse =
                1 + Math.sin(clock.elapsedTime * 1.5 + index) * 0.08;
            mesh.scale.setScalar(pulse);
        });
    });

    return (
        <group>
            {mushrooms.map(([x, y, z, size], index) => (
                <group key={index} position={[x, y, z]}>
                    <mesh position={[0, size * 0.8, 0]}>
                        <cylinderGeometry
                            args={[
                                size * 0.2,
                                size * 0.28,
                                size * 1.6,
                                6,
                            ]}
                        />
                        <meshStandardMaterial color="#ddd0a5" roughness={0.9} />
                    </mesh>

                    <mesh
                        ref={(element) => {
                            refs.current[index] = element;
                        }}
                        position={[0, size * 1.65, 0]}
                    >
                        <sphereGeometry
                            args={[
                                size,
                                12,
                                8,
                                0,
                                Math.PI * 2,
                                0,
                                Math.PI / 2,
                            ]}
                        />
                        <meshStandardMaterial
                            color="#8fffd0"
                            emissive="#3ee6a4"
                            emissiveIntensity={2}
                            roughness={0.5}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/* =========================================================
   WISH CONSTELLATION
========================================================= */

function WishConstellation({ active }) {
    const groupRef = useRef();

    const points = useMemo(() => {
        const raw = [
            [-1.0, 0.35],
            [-0.76, 0.73],
            [-0.38, 0.82],
            [0, 0.5],
            [0.38, 0.82],
            [0.76, 0.73],
            [1.0, 0.35],
            [0.8, -0.05],
            [0.42, -0.43],
            [0, -0.84],
            [-0.42, -0.43],
            [-0.8, -0.05],
            [-1.0, 0.35],
        ];

        return raw.map(
            ([x, y]) =>
                new THREE.Vector3(
                    x * 1.45,
                    y * 1.18 + 2.8,
                    -1.2
                )
        );
    }, []);

    const geometry = useMemo(
        () => new THREE.BufferGeometry().setFromPoints(points),
        [points]
    );

    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);

    useFrame(({ clock }) => {
        if (!active || !groupRef.current) return;

        const pulse =
            1 + Math.sin(clock.elapsedTime * 3) * 0.025;

        groupRef.current.scale.setScalar(pulse);
    });

    if (!active) return null;

    return (
        <group ref={groupRef}>
            <line geometry={geometry}>
                <lineBasicMaterial
                    color="#ffe6a0"
                    transparent
                    opacity={0.58}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </line>

            {points.slice(0, -1).map((point, index) => (
                <mesh key={index} position={point}>
                    <sphereGeometry
                        args={[
                            index % 3 === 0 ? 0.055 : 0.035,
                            8,
                            8,
                        ]}
                    />
                    <meshBasicMaterial
                        color="#fff8d6"
                        transparent
                        opacity={0.95}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                    />
                </mesh>
            ))}

            <pointLight
                position={[0, 2.7, -1]}
                color="#ffd986"
                intensity={1.1}
                distance={5}
            />
        </group>
    );
}

/* =========================================================
   MAGIC TREE
========================================================= */

function MagicTree({
    onStarClick,
    sendingStarId,
    sentStarId,
    selectedStarId,
}) {
    const treeRef = useRef();

    const leaves = useMemo(
        () =>
            Array.from(
                { length: 80 },
                () => {
                    const angle =
                        Math.random() *
                        Math.PI *
                        2;

                    const radius =
                        0.5 +
                        Math.random() * 2.9;

                    const centerBoost =
                        (1 - radius / 3.4) *
                        0.9;

                    return {
                        position: [
                            Math.cos(angle) * radius,
                            3.4 +
                                Math.random() * 2.6 +
                                centerBoost,
                            Math.sin(angle) *
                                radius *
                                0.6,
                        ],

                        scale: [
                            0.45 +
                                Math.random() * 0.55,
                            0.4 +
                                Math.random() * 0.5,
                            0.45 +
                                Math.random() * 0.5,
                        ],

                        rotation: [
                            Math.random() * 0.5,
                            Math.random() * Math.PI,
                            Math.random() * 0.5,
                        ],

                        speed:
                            0.3 +
                            Math.random() * 0.5,

                        offset:
                            Math.random() *
                            Math.PI *
                            2,
                    };
                }
            ),
        []
    );

const treeStars = useMemo(() => {
    const total = 120;

    return Array.from({ length: total }, (_, index) => {
        // Golden angle giúp sao phân bố đều, ít tụ thành cụm
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const angle = index * goldenAngle;

        const progress = (index + 0.5) / total;

        // Tán cây rộng nhất ở giữa/dưới, hẹp hơn ở đỉnh
        const yNormalized = progress * 2 - 1;

        const canopyRadius =
            2.9 * Math.sqrt(1 - yNormalized * yNormalized);

        const radius =
            0.65 +
            canopyRadius * 0.9 +
            Math.random() * 0.25;

        const x =
            Math.cos(angle) * radius;

        /*
         * Quan trọng:
         * z dương = nằm phía camera.
         *
         * Cho sao nằm ở lớp phía trước của tán cây thay vì
         * xuyên sâu vào giữa đám lá.
         */
        const z =
            0.75 +
            Math.abs(Math.sin(angle)) * 0.65 +
            Math.random() * 0.25;

        const y =
            3.65 +
            progress * 2.45 +
            (Math.random() - 0.5) * 0.22;

        return {
            id: `TREE_STAR_${index}`,

            position: [
                x,
                y,
                z,
            ],

            speed:
                0.8 +
                Math.random() * 0.8,

            offset:
                Math.random() *
                Math.PI *
                2,
        };
    });
}, []);

    useFrame(({ clock }) => {
        if (!treeRef.current) return;

        treeRef.current.rotation.y =
            Math.sin(
                clock.elapsedTime * 0.15
            ) * 0.012;
    });

    return (
        <group
            ref={treeRef}
            position={[0, -2.5, 0]}
        >
            <Branch
                start={[0, 0, 0]}
                end={[0, 4.15, 0]}
                startRadius={0.68}
                endRadius={0.27}
            />

            <Branch
                start={[-0.05, 2.6, 0]}
                end={[-2.4, 4.4, 0]}
                startRadius={0.3}
                endRadius={0.11}
            />

            <Branch
                start={[-1.25, 3.55, 0]}
                end={[-2.9, 5, -0.15]}
                startRadius={0.18}
                endRadius={0.07}
            />

            <Branch
                start={[-1.1, 3.45, 0]}
                end={[-1.65, 5.6, 0.35]}
                startRadius={0.17}
                endRadius={0.06}
            />

            <Branch
                start={[-1.8, 4.1, 0]}
                end={[-3.05, 4.25, 0.4]}
                startRadius={0.12}
                endRadius={0.04}
            />

            <Branch
                start={[0.05, 2.85, 0]}
                end={[2.45, 4.6, 0.05]}
                startRadius={0.3}
                endRadius={0.1}
            />

            <Branch
                start={[1.25, 3.75, 0]}
                end={[2.85, 5.25, -0.25]}
                startRadius={0.18}
                endRadius={0.06}
            />

            <Branch
                start={[1.15, 3.65, 0]}
                end={[1.55, 5.85, 0.3]}
                startRadius={0.17}
                endRadius={0.06}
            />

            <Branch
                start={[1.9, 4.15, 0]}
                end={[3.05, 4.4, 0.35]}
                startRadius={0.12}
                endRadius={0.04}
            />

            <Branch
                start={[0, 3.75, 0]}
                end={[-0.65, 6.1, 0]}
                startRadius={0.2}
                endRadius={0.06}
            />

            <Branch
                start={[0, 3.8, 0]}
                end={[0.8, 6.15, -0.1]}
                startRadius={0.2}
                endRadius={0.06}
            />

            <Branch
                start={[-0.15, 0.15, 0]}
                end={[-1.6, -0.15, 0.5]}
                startRadius={0.3}
                endRadius={0.05}
            />

            <Branch
                start={[0.15, 0.15, 0]}
                end={[1.7, -0.1, 0.3]}
                startRadius={0.3}
                endRadius={0.05}
            />

            <Branch
                start={[0, 0.1, 0]}
                end={[0.4, -0.1, 1.5]}
                startRadius={0.25}
                endRadius={0.04}
            />

            <MagicSwing />

            {leaves.map(
                (leaf, index) => (
                    <Leaf
                        key={index}
                        {...leaf}
                    />
                )
            )}

            {treeStars.map(
                (star, index) => (
                    <WishStar
                        key={star.id}
                        star={star}
                        index={index}
                        onClick={onStarClick}
                        sendingStarId={
                            sendingStarId
                        }
                        sentStarId={
                            sentStarId
                        }
                        selectedStarId={
                            selectedStarId
                        }
                    />
                )
            )}

            <pointLight
                position={[0, 4.5, 1]}
                color="#4bd69a"
                intensity={4}
                distance={8}
                decay={2}
            />
        </group>
    );
}

/* =========================================================
   GROUND
========================================================= */

function Ground() {
    return (
        <>
            <mesh
                position={[0, -2.55, 0]}
                rotation={[
                    -Math.PI / 2,
                    0,
                    0,
                ]}
                receiveShadow
            >
                <circleGeometry args={[9, 64]} />
                <meshStandardMaterial
                    color="#06130f"
                    roughness={1}
                />
            </mesh>

            <mesh
                position={[0, -2.53, 0]}
                rotation={[
                    -Math.PI / 2,
                    0,
                    0,
                ]}
            >
                <circleGeometry args={[3.5, 64]} />
                <meshBasicMaterial
                    color="#103326"
                    transparent
                    opacity={0.28}
                />
            </mesh>
        </>
    );
}

/* =========================================================
   MOON
========================================================= */

function Moon() {
    const moonRef = useRef();
    const haloRef = useRef();
    const orbitRef = useRef();
    const heartRef = useRef();
    const heartGlowRef = useRef();

    /* ==========================================
       HỐ TRĂNG
    ========================================== */

    const craters = useMemo(
        () => [
            [-0.42, 0.42, 0.16, 0.13],
            [0.37, 0.52, 0.1, 0.08],
            [0.48, -0.22, 0.2, 0.12],
            [-0.35, -0.35, 0.13, 0.16],
            [0.05, 0.12, 0.12, 0.1],
            [0.1, -0.58, 0.09, 0.12],
            [-0.62, 0.02, 0.08, 0.07],
            [0.57, 0.15, 0.07, 0.09],
        ],
        []
    );

    /* ==========================================
       VÒNG BỤI SAO
    ========================================== */

    const orbitParticles = useMemo(() => {
        const count = 55;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const angle =
                (i / count) *
                Math.PI *
                2;

            const radius =
                1.38 +
                (Math.random() - 0.5) *
                    0.16;

            positions[i * 3] =
                Math.cos(angle) * radius;

            positions[i * 3 + 1] =
                Math.sin(angle) *
                radius *
                0.48;

            positions[i * 3 + 2] =
                (Math.random() - 0.5) *
                0.15;
        }

        return positions;
    }, []);

    /* ==========================================
       SPARKLE
    ========================================== */

    const sparkles = useMemo(
        () =>
            Array.from(
                { length: 14 },
                (_, index) => {
                    const angle =
                        (index / 14) *
                            Math.PI *
                            2 +
                        Math.random() *
                            0.3;

                    const radius =
                        1.18 +
                        Math.random() *
                            0.55;

                    return {
                        position: [
                            Math.cos(angle) *
                                radius,

                            Math.sin(angle) *
                                radius,

                            0.2 +
                                Math.random() *
                                    0.25,
                        ],

                        size:
                            0.025 +
                            Math.random() *
                                0.035,

                        speed:
                            1.5 +
                            Math.random() *
                                3,

                        offset:
                            Math.random() *
                            Math.PI *
                            2,
                    };
                }
            ),
        []
    );

    /* ==========================================
       WISH DUST
    ========================================== */

    const dust = useMemo(
        () =>
            Array.from(
                { length: 18 },
                () => ({
                    x:
                        (Math.random() -
                            0.5) *
                        1.8,

                    y:
                        -0.8 +
                        Math.random() *
                            1.6,

                    z:
                        0.5 +
                        Math.random() *
                            0.4,

                    speed:
                        0.08 +
                        Math.random() *
                            0.15,

                    offset:
                        Math.random() *
                        Math.PI *
                        2,

                    size:
                        0.012 +
                        Math.random() *
                            0.018,
                })
            ),
        []
    );

    const dustRefs = useRef([]);
    const sparkleRefs = useRef([]);

    /* ==========================================
       ANIMATION
    ========================================== */

    useFrame(({ clock }, delta) => {
        const t = clock.elapsedTime;

        /* Mặt trăng trôi nhẹ */

        if (moonRef.current) {
            moonRef.current.rotation.y =
                Math.sin(t * 0.12) *
                0.035;
        }

        /* Halo thở */

        if (haloRef.current) {
            const pulse =
                1 +
                Math.sin(t * 0.65) *
                    0.04;

            haloRef.current.scale.setScalar(
                pulse
            );
        }

        /* Vòng sao xoay */

        if (orbitRef.current) {
            orbitRef.current.rotation.z =
                t * 0.08;

            orbitRef.current.rotation.y =
                Math.sin(t * 0.2) *
                0.12;
        }

        /* Heart beat */

        if (heartRef.current) {
            const beat =
                1 +
                Math.pow(
                    Math.max(
                        0,
                        Math.sin(
                            t * 2.2
                        )
                    ),
                    7
                ) *
                    0.12;

            heartRef.current.scale.setScalar(
                beat
            );
        }

        if (heartGlowRef.current) {
            heartGlowRef.current.material.opacity =
                0.05 +
                Math.pow(
                    Math.max(
                        0,
                        Math.sin(
                            t * 2.2
                        )
                    ),
                    7
                ) *
                    0.12;
        }

        /* Sparkle chớp */

        sparkleRefs.current.forEach(
            (spark, index) => {
                if (!spark) return;

                const data =
                    sparkles[index];

                const pulse =
                    0.25 +
                    Math.pow(
                        Math.max(
                            0,
                            Math.sin(
                                t *
                                    data.speed +
                                    data.offset
                            )
                        ),
                        5
                    ) *
                        1.4;

                spark.scale.setScalar(
                    pulse
                );

                spark.rotation.z +=
                    delta * 0.3;
            }
        );

        /* Bụi điều ước bay lên */

        dustRefs.current.forEach(
            (particle, index) => {
                if (!particle) return;

                const data =
                    dust[index];

                particle.position.y +=
                    delta * data.speed;

                particle.position.x =
                    data.x +
                    Math.sin(
                        t * 0.6 +
                            data.offset
                    ) *
                        0.08;

                if (
                    particle.position.y >
                    1.25
                ) {
                    particle.position.y =
                        -0.9;
                }
            }
        );
    });

    return (
        <group
            position={[-5.5, 5.5, -8]}
        >
            {/* ======================================
                HALO XANH
            ====================================== */}

            <mesh ref={haloRef}>
                <sphereGeometry
                    args={[1.6, 32, 32]}
                />

                <meshBasicMaterial
                    color="#8eb8ff"
                    transparent
                    opacity={0.045}
                    depthWrite={false}
                    blending={
                        THREE.AdditiveBlending
                    }
                    toneMapped={false}
                />
            </mesh>

            {/* Halo vàng */}

            <mesh>
                <sphereGeometry
                    args={[1.36, 32, 32]}
                />

                <meshBasicMaterial
                    color="#ffd986"
                    transparent
                    opacity={0.065}
                    depthWrite={false}
                    blending={
                        THREE.AdditiveBlending
                    }
                    toneMapped={false}
                />
            </mesh>

            {/* ======================================
                QUỸ ĐẠO BỤI SAO
            ====================================== */}

            <points
                ref={orbitRef}
                rotation={[
                    0.3,
                    0,
                    -0.15,
                ]}
            >
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[
                            orbitParticles,
                            3,
                        ]}
                    />
                </bufferGeometry>

                <pointsMaterial
                    size={0.035}
                    color="#fff0b0"
                    transparent
                    opacity={0.75}
                    depthWrite={false}
                    blending={
                        THREE.AdditiveBlending
                    }
                    toneMapped={false}
                />
            </points>

            {/* ======================================
                MẶT TRĂNG
            ====================================== */}

            <group ref={moonRef}>
                <mesh>
                    <sphereGeometry
                        args={[1.1, 48, 48]}
                    />

                    <meshBasicMaterial
                        color="#fff1bd"
                        toneMapped={false}
                    />
                </mesh>

                {/* Hố trăng */}

                {craters.map(
                    (
                        [
                            x,
                            y,
                            width,
                            height,
                        ],
                        index
                    ) => (
                        <mesh
                            key={index}
                            position={[
                                x,
                                y,
                                1.085,
                            ]}
                            scale={[
                                width,
                                height,
                                1,
                            ]}
                        >
                            <circleGeometry
                                args={[1, 20]}
                            />

                            <meshBasicMaterial
                                color="#c8b77d"
                                transparent
                                opacity={0.2}
                                depthWrite={false}
                                toneMapped={false}
                            />
                        </mesh>
                    )
                )}

                {/* ==================================
                    TRÁI TIM
                ================================== */}

                <group
                    ref={heartRef}
                    position={[
                        0,
                        -0.02,
                        1.13,
                    ]}
                    scale={0.5}
                >
                    <mesh
                        position={[
                            -0.105,
                            0.09,
                            0,
                        ]}
                    >
                        <circleGeometry
                            args={[0.15, 24]}
                        />

                        <meshBasicMaterial
                            color="#fff8dd"
                            transparent
                            opacity={0.85}
                            toneMapped={false}
                        />
                    </mesh>

                    <mesh
                        position={[
                            0.105,
                            0.09,
                            0,
                        ]}
                    >
                        <circleGeometry
                            args={[0.15, 24]}
                        />

                        <meshBasicMaterial
                            color="#fff8dd"
                            transparent
                            opacity={0.85}
                            toneMapped={false}
                        />
                    </mesh>

                    <mesh
                        position={[
                            0,
                            -0.055,
                            0,
                        ]}
                        rotation={[
                            0,
                            0,
                            Math.PI / 4,
                        ]}
                    >
                        <planeGeometry
                            args={[
                                0.245,
                                0.245,
                            ]}
                        />

                        <meshBasicMaterial
                            color="#fff8dd"
                            transparent
                            opacity={0.85}
                            toneMapped={false}
                        />
                    </mesh>
                </group>

                {/* Glow sau trái tim */}

                <mesh
                    ref={heartGlowRef}
                    position={[
                        0,
                        0,
                        1.115,
                    ]}
                >
                    <circleGeometry
                        args={[0.38, 32]}
                    />

                    <meshBasicMaterial
                        color="#ffd983"
                        transparent
                        opacity={0.08}
                        depthWrite={false}
                        blending={
                            THREE.AdditiveBlending
                        }
                        toneMapped={false}
                    />
                </mesh>
            </group>

            {/* ======================================
                SPARKLE QUANH VIỀN
            ====================================== */}

            {sparkles.map(
                (spark, index) => (
                    <group
                        key={index}
                        ref={(element) => {
                            sparkleRefs.current[
                                index
                            ] = element;
                        }}
                        position={
                            spark.position
                        }
                    >
                        {/* tia ngang */}

                        <mesh>
                            <planeGeometry
                                args={[
                                    spark.size *
                                        4,
                                    spark.size *
                                        0.35,
                                ]}
                            />

                            <meshBasicMaterial
                                color="#ffffff"
                                transparent
                                opacity={0.9}
                                depthWrite={false}
                                blending={
                                    THREE.AdditiveBlending
                                }
                                toneMapped={false}
                            />
                        </mesh>

                        {/* tia dọc */}

                        <mesh>
                            <planeGeometry
                                args={[
                                    spark.size *
                                        0.35,
                                    spark.size *
                                        4,
                                ]}
                            />

                            <meshBasicMaterial
                                color="#ffffff"
                                transparent
                                opacity={0.9}
                                depthWrite={false}
                                blending={
                                    THREE.AdditiveBlending
                                }
                                toneMapped={false}
                            />
                        </mesh>
                    </group>
                )
            )}

            {/* ======================================
                BỤI ĐIỀU ƯỚC BAY KHỎI TRĂNG
            ====================================== */}

            {dust.map(
                (particle, index) => (
                    <mesh
                        key={index}
                        ref={(element) => {
                            dustRefs.current[
                                index
                            ] = element;
                        }}
                        position={[
                            particle.x,
                            particle.y,
                            particle.z,
                        ]}
                    >
                        <sphereGeometry
                            args={[
                                particle.size,
                                6,
                                6,
                            ]}
                        />

                        <meshBasicMaterial
                            color="#ffeaa2"
                            transparent
                            opacity={0.75}
                            depthWrite={false}
                            blending={
                                THREE.AdditiveBlending
                            }
                            toneMapped={false}
                        />
                    </mesh>
                )
            )}

            {/* ======================================
                3 NGÔI SAO LỚN QUANH TRĂNG
            ====================================== */}

            <mesh
                position={[
                    1.45,
                    0.65,
                    0.1,
                ]}
                scale={0.75}
            >
                <StarShape />

                <meshBasicMaterial
                    color="#ffffff"
                    toneMapped={false}
                />
            </mesh>

            <mesh
                position={[
                    -1.38,
                    -0.45,
                    0.1,
                ]}
                scale={0.45}
            >
                <StarShape />

                <meshBasicMaterial
                    color="#ffe69a"
                    toneMapped={false}
                />
            </mesh>

            <mesh
                position={[
                    1.15,
                    -1,
                    0.1,
                ]}
                scale={0.3}
            >
                <StarShape />

                <meshBasicMaterial
                    color="#fff5cf"
                    toneMapped={false}
                />
            </mesh>

            <pointLight
                color="#d9e4ff"
                intensity={5}
                distance={22}
            />

            <pointLight
                position={[0, 0, 2]}
                color="#ffe6a0"
                intensity={1.2}
                distance={5}
            />
        </group>
    );
}

/* =========================================================
   CAMERA
========================================================= */

function CameraController({
    selectedStar,
}) {
    const { camera } = useThree();

    const normalPosition = useMemo(
        () =>
            new THREE.Vector3(
                0,
                2.5,
                15
            ),
        []
    );

    const normalTarget = useMemo(
        () =>
            new THREE.Vector3(
                0,
                2.2,
                0
            ),
        []
    );

    const currentTarget = useRef(
        normalTarget.clone()
    );

    useFrame(() => {
        if (selectedStar) {
            const starWorld =
                new THREE.Vector3(
                    selectedStar.position[0],
                    selectedStar.position[1] - 2.5,
                    selectedStar.position[2]
                );

            const desiredCamera =
                new THREE.Vector3(
                    starWorld.x * 0.22,
                    2.6 +
                        starWorld.y * 0.12,
                    8.8
                );

            camera.position.lerp(
                desiredCamera,
                0.025
            );

            currentTarget.current.lerp(
                starWorld,
                0.035
            );
        } else {
            camera.position.lerp(
                normalPosition,
                0.025
            );

            currentTarget.current.lerp(
                normalTarget,
                0.035
            );
        }

        camera.lookAt(
            currentTarget.current
        );
    });

    return null;
}

/* =========================================================
   SCENE
========================================================= */

function Scene({
    onStarClick,
    sendingStarId,
    sentStarId,
    selectedStar,
    constellationActive,
}) {
    return (
        <>
            <PerspectiveCamera
                makeDefault
                position={[0, 2.5, 11]}
                fov={43}
            />

            <CameraController
                selectedStar={selectedStar}
            />

            <color
                attach="background"
                args={["#02040c"]}
            />

            <fog
                attach="fog"
                args={["#02040c", 10, 28]}
            />

            <ambientLight
                intensity={
                    selectedStar
                        ? 0.2
                        : 0.3
                }
                color="#7280ff"
            />

            <directionalLight
                position={[-5, 8, 6]}
                intensity={1.4}
                color="#e6edff"
            />

            <pointLight
                position={[4, 2, 2]}
                color="#6655ff"
                intensity={2.5}
                distance={12}
            />

            <Stars
                radius={80}
                depth={45}
                count={3000}
                factor={3}
                saturation={0}
                fade
                speed={0.18}
            />

            <MeteorShower count={100} />
            <MeteorTrails count={50} />

            <Moon />
            <Ground />

            <WishSign />
            <MagicMushrooms />
            <WishConstellation active={constellationActive} />

            {/* 150 trái tim bay xung quanh cây */}
            <HeartRain count={150} />

            <MagicTree
                onStarClick={onStarClick}
                sendingStarId={sendingStarId}
                sentStarId={sentStarId}
                selectedStarId={
                    selectedStar?.id ||
                    null
                }
            />

            <Fireflies count={100} />

            {!selectedStar && (
                <OrbitControls
                    enablePan={false}
                    enableZoom={false}
                    enableDamping
                    dampingFactor={0.035}
                    target={[0, 2.2, 0]}
                    minPolarAngle={
                        Math.PI / 2.6
                    }
                    maxPolarAngle={
                        Math.PI / 1.75
                    }
                    minAzimuthAngle={-0.3}
                    maxAzimuthAngle={0.3}
                />
            )}

            <EffectComposer>
                <Bloom
                    intensity={
                        selectedStar
                            ? 2
                            : 1.7
                    }
                    luminanceThreshold={0.4}
                    luminanceSmoothing={0.75}
                    mipmapBlur
                />

                <Vignette
                    eskil={false}
                    offset={0.18}
                    darkness={
                        selectedStar
                            ? 0.95
                            : 0.85
                    }
                />
            </EffectComposer>
        </>
    );
}

/* =========================================================
   MAIN
========================================================= */

export default function WishTree({
    onBack,
}) {
    const [
        sceneMode,
        setSceneMode,
    ] = useState("tree");
    const [
        skyWish,
        setSkyWish,
    ] = useState(null);

    const [
        selectedStar,
        setSelectedStar,
    ] = useState(null);

    const [
        message,
        setMessage,
    ] = useState("");

    const [
        sending,
        setSending,
    ] = useState(false);

    const [
        sendingStarId,
        setSendingStarId,
    ] = useState(null);

    const [
        sentStarId,
        setSentStarId,
    ] = useState(null);

    const [
        error,
        setError,
    ] = useState("");
const [
        constellationActive,
        setConstellationActive,
    ] = useState(false);
    const handleStarClick = (star) => {
        if (sending) return;

        setSelectedStar(star);
        setMessage("");
        setError("");
    };

    const closeModal = () => {
        if (sending) return;

        setSelectedStar(null);
        setMessage("");
        setError("");
    };

    const handleSendWish = async () => {
        const cleanMessage =
            message.trim();

        if (!cleanMessage) {
            setError(
                "Em chưa viết điều ước kìa ✨"
            );
            return;
        }

        if (!selectedStar || sending) {
            return;
        }

        try {
            setSending(true);
            setError("");

            setSendingStarId(
                selectedStar.id
            );

            const response =
                await createWish(
                    cleanMessage
                );

            const newWish =
                response.data;

            setSkyWish(newWish);

            setSentStarId(
                selectedStar.id
            );

            setSendingStarId(null);
            setMessage("");
            setSelectedStar(null);

            // Chòm sao trái tim xuất hiện sau khi điều ước được gửi.
            setConstellationActive(true);

            setTimeout(() => {
                setSceneMode(
                    "transition"
                );
            }, 1250);

            setTimeout(() => {
                setConstellationActive(false);
                setSceneMode("sky");
            }, 2400);
        } catch (err) {
            console.error(
                "Create wish error:",
                err
            );

            setError(
                err.message ||
                    "Không thể gửi điều ước."
            );

            setSendingStarId(null);
            setSceneMode("tree");
        } finally {
            setSending(false);
        }
    };

    if (
        sceneMode === "sky" &&
        skyWish
    ) {
        return (
            <WishSky
                wish={skyWish}
                onBack={() => {
                    setSceneMode("tree");
                    setSkyWish(null);
                    setSentStarId(null);
                    setSendingStarId(null);
                    setSelectedStar(null);
                    setMessage("");
                    setError("");
                    setConstellationActive(false);
                }}
            />
        );
    }

    return (
    <main
        className={`wish-tree-page ${
            sceneMode ===
            "transition"
                ? "tree-leaving"
                : ""
        }`}
    >

       <button
    className="home-button"
    onClick={onBack}
>
            <span>🏠</span>
            <span>Trang chủ</span>
        </button>

        <Canvas
            shadows
            dpr={[1, 1.35]}
            gl={{
                antialias: true,
                alpha: false,
                powerPreference:
                    "high-performance",
            }}
        >
                <Scene
                    onStarClick={
                        handleStarClick
                    }
                    sendingStarId={
                        sendingStarId
                    }
                    sentStarId={
                        sentStarId
                    }
                    selectedStar={
                        selectedStar
                    }
                    constellationActive={
                        constellationActive
                    }
                />
            </Canvas>

            <header className="wish-tree-header">
                <div className="header-symbol">
                    ✦
                </div>

                <span className="header-small">
                    A LITTLE PLACE FOR YOUR DREAMS
                </span>

                <h1>
                    Cây Điều Ước
                </h1>

                <p>
                    Trên cây có những vì
                    sao đang chờ điều ước
                    của em.
                    <br />
                    <span>
                        Chọn một vì sao mà
                        em thích nhé ✨
                    </span>
                </p>
            </header>

            {!selectedStar && (
                <div className="wish-counter">
                    <span>✦</span>
                    Chạm vào một vì sao
                    để gửi điều ước
                </div>
            )}

            {selectedStar &&
                sceneMode ===
                    "tree" && (
                    <div
                        className="wish-modal-overlay"
                        onClick={
                            closeModal
                        }
                    >
                        <article
                            className="wish-letter"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >
                            <div className="letter-corner corner-top-left">
                                ✦
                            </div>

                            <div className="letter-corner corner-top-right">
                                ✦
                            </div>

                            <div className="letter-corner corner-bottom-left">
                                ✦
                            </div>

                            <div className="letter-corner corner-bottom-right">
                                ✦
                            </div>

                            <div className="wish-letter-star">
                                ★
                            </div>

                            <span className="wish-letter-label">
                                VÌ SAO NÀY LÀ
                                CỦA EM
                            </span>

                            <h2>
                                Hãy gửi một điều ước
                            </h2>

                            <div className="wish-divider">
                                <span />
                                <b>✦</b>
                                <span />
                            </div>

                            <p className="wish-form-description">
                                Nhắm mắt lại
                                một chút,
                                nghĩ về điều
                                em mong muốn
                                rồi viết nó
                                vào đây nhé.
                            </p>

                            <textarea
                                className="wish-input"
                                value={message}
                                onChange={(event) => {
                                    setMessage(
                                        event.target.value
                                    );

                                    if (error) {
                                        setError("");
                                    }
                                }}
                                placeholder="Em ước rằng..."
                                maxLength={500}
                                autoFocus
                                disabled={sending}
                            />

                            <div className="wish-input-footer">
                                <span>
                                    {message.length}
                                    /500
                                </span>
                            </div>

                            {error && (
                                <p className="wish-form-error">
                                    {error}
                                </p>
                            )}

                            <button
                                type="button"
                                className="fulfill-button"
                                onClick={
                                    handleSendWish
                                }
                                disabled={
                                    sending ||
                                    !message.trim()
                                }
                            >
                                {sending ? (
                                    <>
                                        <span className="button-star spinning">
                                            ✦
                                        </span>
                                        Đang gửi điều ước...
                                    </>
                                ) : (
                                    <>
                                        <span className="button-star">
                                            ✦
                                        </span>
                                        Gửi điều ước
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                className="choose-another-button"
                                onClick={
                                    closeModal
                                }
                                disabled={sending}
                            >
                                Để em chọn vì sao khác
                            </button>
                        </article>
                    </div>
                )}
        </main>
    );
}
