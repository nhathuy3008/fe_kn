import { Canvas, useFrame } from "@react-three/fiber";
import {
    PerspectiveCamera,
    Stars,
    Sparkles,
} from "@react-three/drei";

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

import "./WishSky.css";

/* =========================================================
   CAMERA
========================================================= */

function FlyingCamera({ arrived }) {
    const ref = useRef();

    useFrame(({ clock }) => {
        if (!ref.current) return;

        const t = clock.elapsedTime;

        /*
         * Camera tiến sâu vào không gian.
         */
        const targetZ =
            13 - Math.min(t * 0.75, 7);

        ref.current.position.z =
            THREE.MathUtils.lerp(
                ref.current.position.z,
                targetZ,
                0.025
            );

        /*
         * Drift rất nhẹ.
         */
        ref.current.position.x =
            Math.sin(t * 0.18) * 0.18;

        ref.current.position.y =
            Math.sin(t * 0.13) * 0.15;

        /*
         * Khi star chưa đến:
         * camera nhìn sâu vào không gian.
         *
         * Khi đến:
         * hơi nhìn về vị trí star.
         */
        const lookX = arrived ? 0.6 : 0;
        const lookY = arrived ? 0.35 : 0;

        ref.current.lookAt(
            lookX,
            lookY,
            -15
        );
    });

    return (
        <PerspectiveCamera
            ref={ref}
            makeDefault
            position={[0, 0, 13]}
            fov={55}
        />
    );
}

/* =========================================================
   BACKGROUND GALAXY
========================================================= */

function Galaxy() {
    const ref = useRef();

    const count = 3200;

    const positions = useMemo(() => {
        const array =
            new Float32Array(
                count * 3
            );

        for (
            let i = 0;
            i < count;
            i++
        ) {
            const i3 = i * 3;

            const radius =
                5 +
                Math.random() * 34;

            const angle =
                Math.random() *
                Math.PI *
                2;

            array[i3] =
                Math.cos(angle) *
                radius *
                0.85;

            array[i3 + 1] =
                (Math.random() -
                    0.5) *
                22;

            array[i3 + 2] =
                -Math.random() * 60;
        }

        return array;
    }, []);

    useFrame(({ clock }) => {
        if (!ref.current) return;

        ref.current.rotation.z =
            clock.elapsedTime *
            0.002;

        ref.current.rotation.y =
            Math.sin(
                clock.elapsedTime *
                    0.03
            ) * 0.015;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[
                        positions,
                        3,
                    ]}
                />
            </bufferGeometry>

            <pointsMaterial
                size={0.045}
                color="#dce8ff"
                transparent
                opacity={0.7}
                depthWrite={false}
                sizeAttenuation
                toneMapped={false}
            />
        </points>
    );
}

/* =========================================================
   MILKY WAY
========================================================= */

function MilkyWay() {
    const ref = useRef();

    const count = 2600;

    const positions = useMemo(() => {
        const array =
            new Float32Array(
                count * 3
            );

        for (
            let i = 0;
            i < count;
            i++
        ) {
            const i3 = i * 3;

            /*
             * Tạo dải dài theo X.
             */
            const x =
                (Math.random() -
                    0.5) *
                55;

            /*
             * Dải tương đối mỏng.
             */
            const y =
                (Math.random() -
                    0.5) *
                    3.5 +
                Math.sin(x * 0.12) *
                    1.5;

            const z =
                -20 -
                Math.random() * 25;

            array[i3] = x;
            array[i3 + 1] = y;
            array[i3 + 2] = z;
        }

        return array;
    }, []);

    useFrame(({ clock }) => {
        if (!ref.current) return;

        ref.current.rotation.z =
            -0.38 +
            Math.sin(
                clock.elapsedTime *
                    0.025
            ) *
                0.015;
    });

    return (
        <points
            ref={ref}
            rotation={[
                0,
                0,
                -0.38,
            ]}
        >
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[
                        positions,
                        3,
                    ]}
                />
            </bufferGeometry>

            <pointsMaterial
                size={0.08}
                color="#bfc7ff"
                transparent
                opacity={0.2}
                depthWrite={false}
                toneMapped={false}
                sizeAttenuation
            />
        </points>
    );
}

/* =========================================================
   NEBULA
========================================================= */

function NebulaCloud({
    position,
    scale,
    color,
    opacity = 0.035,
    speed = 0.01,
}) {
    const ref = useRef();

    useFrame(({ clock }) => {
        if (!ref.current) return;

        const t = clock.elapsedTime;

        ref.current.rotation.y =
            t * speed;

        ref.current.rotation.z =
            Math.sin(t * speed) *
            0.15;

        /*
         * Nebula "thở".
         */
        const pulse =
            1 +
            Math.sin(
                t * 0.12 +
                    position[0]
            ) *
                0.03;

        ref.current.scale.set(
            scale[0] * pulse,
            scale[1] * pulse,
            scale[2] * pulse
        );
    });

    return (
        <mesh
            ref={ref}
            position={position}
        >
            <sphereGeometry
                args={[1, 32, 32]}
            />

            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                depthWrite={false}
                side={THREE.BackSide}
                blending={
                    THREE.AdditiveBlending
                }
                toneMapped={false}
            />
        </mesh>
    );
}

function Nebulas() {
    return (
        <>
            <NebulaCloud
                position={[
                    -9,
                    5,
                    -28,
                ]}
                scale={[
                    14,
                    7,
                    8,
                ]}
                color="#5846c8"
                opacity={0.025}
            />

            <NebulaCloud
                position={[
                    10,
                    -4,
                    -35,
                ]}
                scale={[
                    17,
                    8,
                    10,
                ]}
                color="#285f99"
                opacity={0.025}
                speed={-0.008}
            />

            <NebulaCloud
                position={[
                    2,
                    7,
                    -45,
                ]}
                scale={[
                    20,
                    9,
                    12,
                ]}
                color="#783b8f"
                opacity={0.018}
                speed={0.005}
            />
        </>
    );
}

/* =========================================================
   FOREGROUND STARS
   Tạo parallax.
========================================================= */

function ForegroundStars() {
    const ref = useRef();

    const count = 180;

    const positions = useMemo(() => {
        const array =
            new Float32Array(
                count * 3
            );

        for (
            let i = 0;
            i < count;
            i++
        ) {
            const i3 = i * 3;

            array[i3] =
                (Math.random() -
                    0.5) *
                30;

            array[i3 + 1] =
                (Math.random() -
                    0.5) *
                18;

            array[i3 + 2] =
                -4 -
                Math.random() * 20;
        }

        return array;
    }, []);

    useFrame(({ clock }) => {
        if (!ref.current) return;

        /*
         * Di chuyển nhanh hơn
         * background một chút.
         */
        ref.current.rotation.z =
            Math.sin(
                clock.elapsedTime *
                    0.025
            ) *
            0.008;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[
                        positions,
                        3,
                    ]}
                />
            </bufferGeometry>

            <pointsMaterial
                size={0.085}
                color="#ffffff"
                transparent
                opacity={0.6}
                depthWrite={false}
                toneMapped={false}
            />
        </points>
    );
}

/* =========================================================
   WISH STAR TRAIL
========================================================= */

function WishStarTrail({
    starRef,
    active,
    count = 24,
}) {
    const refs = useRef([]);

    const history = useRef(
        Array.from(
            { length: count },
            () =>
                new THREE.Vector3(
                    0,
                    -3.5,
                    5
                )
        )
    );

    useFrame(() => {
        if (!starRef.current) return;

        /*
         * Lưu vị trí hiện tại của sao.
         */
        history.current.unshift(
            starRef.current.position.clone()
        );

        history.current.pop();

        refs.current.forEach(
            (mesh, index) => {
                if (!mesh) return;

                const point =
                    history.current[
                        Math.min(
                            index,
                            history.current
                                .length - 1
                        )
                    ];

                mesh.position.copy(
                    point
                );

                /*
                 * Đuôi càng xa càng nhỏ.
                 */
                const ratio =
                    1 -
                    index / count;

                mesh.scale.setScalar(
                    Math.max(
                        0.1,
                        ratio
                    )
                );

                if (
                    mesh.material
                ) {
                    mesh.material.opacity =
                        active
                            ? ratio *
                              0.32
                            : mesh.material
                                  .opacity *
                              0.94;
                }
            }
        );
    });

    return (
        <>
            {Array.from({
                length: count,
            }).map((_, index) => (
                <mesh
                    key={index}
                    ref={(element) => {
                        refs.current[
                            index
                        ] = element;
                    }}
                >
                    <sphereGeometry
                        args={[
                            0.055,
                            8,
                            8,
                        ]}
                    />

                    <meshBasicMaterial
                        color={
                            index < 8
                                ? "#ffe99b"
                                : "#b9d8ff"
                        }
                        transparent
                        opacity={0}
                        depthWrite={
                            false
                        }
                        blending={
                            THREE.AdditiveBlending
                        }
                        toneMapped={
                            false
                        }
                    />
                </mesh>
            ))}
        </>
    );
}

/* =========================================================
   ARRIVAL SHOCKWAVE
========================================================= */

function ArrivalShockwave({
    active,
    position,
}) {
    const ref = useRef();

    const started = useRef(false);
    const progress = useRef(0);

    useFrame((_, delta) => {
        if (!ref.current) return;

        if (!active) {
            ref.current.visible =
                false;

            return;
        }

        if (!started.current) {
            started.current = true;
            progress.current = 0;
        }

        ref.current.visible = true;

        progress.current +=
            delta * 0.8;

        const scale =
            0.2 +
            progress.current * 4;

        ref.current.scale.setScalar(
            scale
        );

        ref.current.material.opacity =
            Math.max(
                0,
                0.65 -
                    progress.current
            );

        if (
            progress.current > 0.7
        ) {
            ref.current.visible =
                false;
        }
    });

    return (
        <mesh
            ref={ref}
            position={position}
            visible={false}
        >
            <ringGeometry
                args={[
                    0.2,
                    0.23,
                    64,
                ]}
            />

            <meshBasicMaterial
                color="#fff3b0"
                transparent
                opacity={0.6}
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={
                    THREE.AdditiveBlending
                }
                toneMapped={false}
            />
        </mesh>
    );
}

/* =========================================================
   WISH STAR
========================================================= */

function FlyingWishStar({
    onArrived,
}) {
    const ref = useRef();

    const coreRef = useRef();
    const glowRef = useRef();

    const arrived = useRef(false);

    const [didArrive, setDidArrive] =
        useState(false);

    const endPosition =
        useMemo(
            () =>
                new THREE.Vector3(
                    2.2,
                    1.5,
                    -12
                ),
            []
        );

    useFrame(({ clock }) => {
        if (!ref.current) return;

        const t = clock.elapsedTime;

        /*
         * Sau khi tới nơi,
         * star nằm lại và pulse.
         */
        if (arrived.current) {
            ref.current.position.copy(
                endPosition
            );

            const pulse =
                0.92 +
                Math.sin(t * 2.2) *
                    0.1;

            ref.current.scale.setScalar(
                pulse
            );

            ref.current.rotation.z +=
                0.002;

            if (glowRef.current) {
                const glowPulse =
                    1 +
                    Math.sin(
                        t * 2.2
                    ) *
                        0.18;

                glowRef.current.scale.setScalar(
                    glowPulse
                );
            }

            return;
        }

        /*
         * Bay trong 4 giây.
         */
        const progress =
            Math.min(t / 4, 1);

        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );

        const start =
            new THREE.Vector3(
                0,
                -3.5,
                5
            );

        /*
         * Đường chính.
         */
        ref.current.position.lerpVectors(
            start,
            endPosition,
            eased
        );

        /*
         * Đường cong.
         */
        ref.current.position.y +=
            Math.sin(
                progress *
                    Math.PI
            ) *
            2.3;

        ref.current.position.x +=
            Math.sin(
                progress *
                    Math.PI
            ) *
            -0.8;

        /*
         * Gần camera lớn,
         * đi xa nhỏ dần.
         */
        const scale =
            THREE.MathUtils.lerp(
                1.9,
                0.8,
                eased
            );

        ref.current.scale.setScalar(
            scale
        );

        ref.current.rotation.z +=
            0.018;

        /*
         * Core rung sáng nhẹ.
         */
        if (coreRef.current) {
            const corePulse =
                1 +
                Math.sin(t * 12) *
                    0.08;

            coreRef.current.scale.setScalar(
                corePulse
            );
        }

        if (
            progress >= 1 &&
            !arrived.current
        ) {
            arrived.current = true;

            setDidArrive(true);

            onArrived?.();
        }
    });

    return (
        <>
            <WishStarTrail
                starRef={ref}
                active={!didArrive}
            />

            <group
                ref={ref}
                position={[
                    0,
                    -3.5,
                    5,
                ]}
            >
                {/* Outer aura */}

                <mesh
                    ref={glowRef}
                >
                    <sphereGeometry
                        args={[
                            0.9,
                            32,
                            32,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#ffd65c"
                        transparent
                        opacity={0.045}
                        depthWrite={
                            false
                        }
                        blending={
                            THREE.AdditiveBlending
                        }
                        toneMapped={
                            false
                        }
                    />
                </mesh>

                {/* Inner aura */}

                <mesh>
                    <sphereGeometry
                        args={[
                            0.45,
                            32,
                            32,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#ffe68f"
                        transparent
                        opacity={0.12}
                        depthWrite={
                            false
                        }
                        blending={
                            THREE.AdditiveBlending
                        }
                        toneMapped={
                            false
                        }
                    />
                </mesh>

                {/* Core */}

                <mesh ref={coreRef}>
                    <sphereGeometry
                        args={[
                            0.13,
                            32,
                            32,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#fffbe2"
                        toneMapped={
                            false
                        }
                    />
                </mesh>

                {/* Star cross */}

                <mesh>
                    <planeGeometry
                        args={[
                            0.8,
                            0.012,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#fff5c8"
                        transparent
                        opacity={0.65}
                        depthWrite={
                            false
                        }
                        blending={
                            THREE.AdditiveBlending
                        }
                        toneMapped={
                            false
                        }
                    />
                </mesh>

                <mesh
                    rotation={[
                        0,
                        0,
                        Math.PI / 2,
                    ]}
                >
                    <planeGeometry
                        args={[
                            0.8,
                            0.012,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#fff5c8"
                        transparent
                        opacity={0.65}
                        depthWrite={
                            false
                        }
                        blending={
                            THREE.AdditiveBlending
                        }
                        toneMapped={
                            false
                        }
                    />
                </mesh>

                <pointLight
                    color="#ffd35c"
                    intensity={
                        didArrive
                            ? 10
                            : 8
                    }
                    distance={6}
                />
            </group>

            <ArrivalShockwave
                active={didArrive}
                position={[
                    2.2,
                    1.5,
                    -12,
                ]}
            />
        </>
    );
}

/* =========================================================
   RANDOM SHOOTING STAR
========================================================= */

function ShootingStar({
    initialDelay = 0,
}) {
    const ref = useRef();

    const state = useRef({
        active: false,

        next:
            initialDelay +
            2 +
            Math.random() * 6,

        start: 0,

        duration: 0.8,

        direction: 1,

        startX: -12,

        startY: 5,

        z: -15,

        drop: 4,
    });

    useFrame(({ clock }) => {
        if (!ref.current) return;

        const t = clock.elapsedTime;
        const data = state.current;

        if (
            !data.active &&
            t >= data.next
        ) {
            data.active = true;
            data.start = t;

            data.duration =
                0.7 +
                Math.random() * 0.8;

            data.direction =
                Math.random() > 0.5
                    ? 1
                    : -1;

            data.startX =
                data.direction === 1
                    ? -12
                    : 12;

            data.startY =
                2 +
                Math.random() * 7;

            data.z =
                -10 -
                Math.random() * 20;

            data.drop =
                2 +
                Math.random() * 5;

            ref.current.visible =
                true;
        }

        if (!data.active) {
            ref.current.visible =
                false;

            return;
        }

        const progress =
            (t - data.start) /
            data.duration;

        if (progress >= 1) {
            data.active = false;

            /*
             * Lần sau 7 - 16 giây.
             */
            data.next =
                t +
                7 +
                Math.random() * 9;

            ref.current.visible =
                false;

            return;
        }

        ref.current.position.x =
            data.startX +
            data.direction *
                progress *
                24;

        ref.current.position.y =
            data.startY -
            progress * data.drop;

        ref.current.position.z =
            data.z;

        ref.current.rotation.z =
            data.direction === 1
                ? -0.18
                : Math.PI + 0.18;

        const opacity =
            Math.sin(
                progress *
                    Math.PI
            );

        ref.current.children.forEach(
            (child) => {
                if (
                    child.material
                ) {
                    child.material.opacity =
                        opacity *
                        (child.userData
                            .opacity ??
                            1);
                }
            }
        );
    });

    return (
        <group
            ref={ref}
            visible={false}
        >
            {/* Tail */}

            <mesh
                position={[
                    -1.8,
                    0,
                    0,
                ]}
                userData={{
                    opacity: 0.28,
                }}
            >
                <planeGeometry
                    args={[
                        3.6,
                        0.012,
                    ]}
                />

                <meshBasicMaterial
                    color="#d9e8ff"
                    transparent
                    opacity={0.28}
                    depthWrite={false}
                    blending={
                        THREE.AdditiveBlending
                    }
                    toneMapped={false}
                />
            </mesh>

            {/* Head */}

            <mesh
                userData={{
                    opacity: 1,
                }}
            >
                <sphereGeometry
                    args={[
                        0.055,
                        12,
                        12,
                    ]}
                />

                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={1}
                    depthWrite={false}
                    toneMapped={false}
                />
            </mesh>

            <pointLight
                color="#dcecff"
                intensity={3}
                distance={3}
            />
        </group>
    );
}


/* =========================================================
   CINEMATIC PLANET
========================================================= */

function DistantPlanet({
    position,
    radius,
    color,
    glow,
    ring = false,
}) {
    const ref = useRef();

    useFrame(({ clock }) => {
        if (!ref.current) return;

        const t = clock.elapsedTime;

        ref.current.rotation.y =
            t * 0.025;

        ref.current.rotation.z =
            Math.sin(t * 0.08) *
            0.025;
    });

    return (
        <group
            ref={ref}
            position={position}
        >
            <mesh>
                <sphereGeometry
                    args={[
                        radius,
                        36,
                        36,
                    ]}
                />

                <meshStandardMaterial
                    color={color}
                    emissive={glow}
                    emissiveIntensity={0.18}
                    roughness={0.9}
                    metalness={0.05}
                />
            </mesh>

            <mesh scale={1.22}>
                <sphereGeometry
                    args={[
                        radius,
                        28,
                        28,
                    ]}
                />

                <meshBasicMaterial
                    color={glow}
                    transparent
                    opacity={0.035}
                    side={THREE.BackSide}
                    depthWrite={false}
                    blending={
                        THREE.AdditiveBlending
                    }
                    toneMapped={false}
                />
            </mesh>

            {ring && (
                <mesh
                    rotation={[
                        Math.PI / 2.3,
                        0.18,
                        0,
                    ]}
                >
                    <ringGeometry
                        args={[
                            radius * 1.35,
                            radius * 2.05,
                            80,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#c7d4ff"
                        transparent
                        opacity={0.11}
                        side={
                            THREE.DoubleSide
                        }
                        depthWrite={false}
                        blending={
                            THREE.AdditiveBlending
                        }
                        toneMapped={false}
                    />
                </mesh>
            )}
        </group>
    );
}

/* =========================================================
   STARDUST TUNNEL
========================================================= */

function StardustTunnel() {
    const ref = useRef();

    const positions =
        useMemo(() => {
            const count = 420;

            const array =
                new Float32Array(
                    count * 3
                );

            for (
                let i = 0;
                i < count;
                i++
            ) {
                const i3 = i * 3;

                const angle =
                    Math.random() *
                    Math.PI *
                    2;

                const radius =
                    3 +
                    Math.random() *
                        15;

                array[i3] =
                    Math.cos(angle) *
                    radius;

                array[i3 + 1] =
                    Math.sin(angle) *
                    radius *
                    0.62;

                array[i3 + 2] =
                    5 -
                    Math.random() *
                        55;
            }

            return array;
        }, []);

    useFrame(({ clock }) => {
        if (!ref.current) return;

        ref.current.rotation.z =
            clock.elapsedTime *
            0.006;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[
                        positions,
                        3,
                    ]}
                />
            </bufferGeometry>

            <pointsMaterial
                size={0.035}
                color="#fff7df"
                transparent
                opacity={0.32}
                depthWrite={false}
                blending={
                    THREE.AdditiveBlending
                }
                toneMapped={false}
                sizeAttenuation
            />
        </points>
    );
}

/* =========================================================
   COSMIC RINGS
========================================================= */

function CosmicRings({
    arrived,
}) {
    const ref = useRef();

    useFrame(({ clock }) => {
        if (!ref.current) return;

        const t = clock.elapsedTime;

        ref.current.rotation.y =
            t * 0.13;

        ref.current.rotation.z =
            t * 0.055;

        const pulse =
            1 +
            Math.sin(t * 1.2) *
                0.025;

        ref.current.scale.setScalar(
            arrived
                ? pulse
                : 0.82
        );
    });

    return (
        <group
            ref={ref}
            position={[
                2.2,
                1.5,
                -12.2,
            ]}
        >
            {[
                0.78,
                1.08,
                1.42,
            ].map(
                (
                    radius,
                    index
                ) => (
                    <mesh
                        key={
                            radius
                        }
                        rotation={[
                            index *
                                0.65,
                            index *
                                0.4,
                            index *
                                0.7,
                        ]}
                    >
                        <torusGeometry
                            args={[
                                radius,
                                0.008,
                                8,
                                80,
                            ]}
                        />

                        <meshBasicMaterial
                            color={
                                index ===
                                0
                                    ? "#fff0a8"
                                    : index ===
                                        1
                                      ? "#b9d8ff"
                                      : "#c5adff"
                            }
                            transparent
                            opacity={
                                arrived
                                    ? 0.2 -
                                      index *
                                          0.035
                                    : 0.025
                            }
                            depthWrite={
                                false
                            }
                            blending={
                                THREE.AdditiveBlending
                            }
                            toneMapped={
                                false
                            }
                        />
                    </mesh>
                )
            )}
        </group>
    );
}

/* =========================================================
   WISH CONSTELLATION
========================================================= */

function WishConstellation({
    visible,
}) {
    const ref = useRef();

    const points =
        useMemo(
            () => [
                new THREE.Vector3(
                    -2.1,
                    1,
                    -16
                ),
                new THREE.Vector3(
                    -1.3,
                    2,
                    -16
                ),
                new THREE.Vector3(
                    -0.25,
                    1.6,
                    -16
                ),
                new THREE.Vector3(
                    0.55,
                    2.5,
                    -16
                ),
                new THREE.Vector3(
                    1.6,
                    1.85,
                    -16
                ),
                new THREE.Vector3(
                    2.45,
                    2.4,
                    -16
                ),
            ],
            []
        );

    const geometry =
        useMemo(
            () =>
                new THREE.BufferGeometry().setFromPoints(
                    points
                ),
            [points]
        );

    useEffect(() => {
        return () => {
            geometry.dispose();
        };
    }, [geometry]);

    useFrame(({ clock }) => {
        if (!ref.current) return;

        ref.current.rotation.z =
            Math.sin(
                clock.elapsedTime *
                    0.08
            ) *
            0.015;
    });

    if (!visible) {
        return null;
    }

    return (
        <group ref={ref}>
            <line
                geometry={
                    geometry
                }
            >
                <lineBasicMaterial
                    color="#dbe7ff"
                    transparent
                    opacity={0.18}
                    depthWrite={false}
                    blending={
                        THREE.AdditiveBlending
                    }
                    toneMapped={false}
                />
            </line>

            {points.map(
                (
                    point,
                    index
                ) => (
                    <mesh
                        key={
                            index
                        }
                        position={
                            point
                        }
                    >
                        <sphereGeometry
                            args={[
                                index ===
                                3
                                    ? 0.055
                                    : 0.035,
                                8,
                                8,
                            ]}
                        />

                        <meshBasicMaterial
                            color={
                                index ===
                                3
                                    ? "#fff0a5"
                                    : "#e7efff"
                            }
                            toneMapped={
                                false
                            }
                        />
                    </mesh>
                )
            )}
        </group>
    );
}

/* =========================================================
   ARRIVAL BURST
========================================================= */

function ArrivalBurst({
    active,
}) {
    const ref = useRef();

    const start =
        useRef(null);

    const rays =
        useMemo(
            () =>
                Array.from(
                    {
                        length: 16,
                    },
                    (
                        _,
                        index
                    ) => ({
                        angle:
                            (index /
                                16) *
                            Math.PI *
                            2,

                        length:
                            0.55 +
                            Math.random() *
                                1.25,
                    })
                ),
            []
        );

    useFrame(({ clock }) => {
        if (!ref.current) return;

        if (!active) {
            ref.current.visible =
                false;

            start.current =
                null;

            return;
        }

        if (
            start.current ===
            null
        ) {
            start.current =
                clock.elapsedTime;
        }

        const progress =
            Math.min(
                (clock.elapsedTime -
                    start.current) /
                    1.4,
                1
            );

        ref.current.visible =
            progress < 1;

        ref.current.scale.setScalar(
            0.2 +
                progress *
                    2.5
        );

        ref.current.children.forEach(
            (child) => {
                if (
                    !child.material
                ) {
                    return;
                }

                child.material.opacity =
                    Math.max(
                        0,
                        (1 -
                            progress) *
                            0.7
                    );
            }
        );
    });

    return (
        <group
            ref={ref}
            position={[
                2.2,
                1.5,
                -11.9,
            ]}
            visible={false}
        >
            {rays.map(
                (
                    ray,
                    index
                ) => (
                    <mesh
                        key={
                            index
                        }
                        rotation={[
                            0,
                            0,
                            ray.angle,
                        ]}
                        position={[
                            Math.cos(
                                ray.angle
                            ) *
                                0.45,

                            Math.sin(
                                ray.angle
                            ) *
                                0.45,

                            0,
                        ]}
                    >
                        <planeGeometry
                            args={[
                                ray.length,
                                0.012,
                            ]}
                        />

                        <meshBasicMaterial
                            color={
                                index %
                                    3 ===
                                0
                                    ? "#fff0a3"
                                    : "#d7e6ff"
                            }
                            transparent
                            opacity={0}
                            depthWrite={
                                false
                            }
                            blending={
                                THREE.AdditiveBlending
                            }
                            toneMapped={
                                false
                            }
                        />
                    </mesh>
                )
            )}
        </group>
    );
}

/* =========================================================
   ORBITING PARTICLES
========================================================= */

function OrbitingParticles({
    visible,
}) {
    const ref = useRef();

    const positions =
        useMemo(() => {
            const count = 80;

            const array =
                new Float32Array(
                    count * 3
                );

            for (
                let i = 0;
                i < count;
                i++
            ) {
                const i3 = i * 3;

                const angle =
                    Math.random() *
                    Math.PI *
                    2;

                const radius =
                    0.7 +
                    Math.random() *
                        1.4;

                array[i3] =
                    Math.cos(angle) *
                    radius;

                array[i3 + 1] =
                    Math.sin(angle) *
                    radius *
                    0.5;

                array[i3 + 2] =
                    (Math.random() -
                        0.5) *
                    0.5;
            }

            return array;
        }, []);

    useFrame(({ clock }) => {
        if (!ref.current) return;

        ref.current.rotation.z =
            clock.elapsedTime *
            0.16;

        ref.current.rotation.y =
            clock.elapsedTime *
            0.08;
    });

    if (!visible) {
        return null;
    }

    return (
        <points
            ref={ref}
            position={[
                2.2,
                1.5,
                -12,
            ]}
        >
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[
                        positions,
                        3,
                    ]}
                />
            </bufferGeometry>

            <pointsMaterial
                size={0.04}
                color="#ffe7a2"
                transparent
                opacity={0.7}
                depthWrite={false}
                blending={
                    THREE.AdditiveBlending
                }
                toneMapped={false}
            />
        </points>
    );
}



/* =========================================================
   FINALE: HEART FIREWORK + CONSTELLATION + GOLDEN RAIN
========================================================= */

function HeartFirework({ active }) {
    const group = useRef();
    const start = useRef(null);
    const refs = useRef([]);

    const points = useMemo(() => {
        const count = 64;
        return Array.from({ length: count }, (_, i) => {
            const t = (i / count) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y =
                13 * Math.cos(t) -
                5 * Math.cos(2 * t) -
                2 * Math.cos(3 * t) -
                Math.cos(4 * t);
            return new THREE.Vector3(
                x * 0.13,
                y * 0.13,
                (Math.random() - 0.5) * 0.35
            );
        });
    }, []);

    useFrame(({ clock }) => {
        if (!group.current) return;

        if (!active) {
            group.current.visible = false;
            start.current = null;
            return;
        }

        if (start.current === null) start.current = clock.elapsedTime;

        const local = clock.elapsedTime - start.current - 3.7;

        if (local < 0 || local > 3.4) {
            group.current.visible = false;
            return;
        }

        group.current.visible = true;
        const p = Math.min(local / 1.05, 1);
        const fade =
            local < 1.5 ? 1 : Math.max(0, 1 - (local - 1.5) / 1.9);

        refs.current.forEach((mesh, i) => {
            if (!mesh) return;
            const point = points[i];

            mesh.position.set(
                point.x * p,
                point.y * p - Math.max(0, local - 1.2) ** 2 * 0.08,
                point.z * p
            );

            if (mesh.material) {
                mesh.material.opacity =
                    fade * (0.72 + Math.sin(clock.elapsedTime * 18 + i) * 0.28);
            }
        });
    });

    return (
        <group ref={group} position={[0, 5.8, -15]} visible={false}>
            {points.map((_, i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        refs.current[i] = el;
                    }}
                >
                    <sphereGeometry args={[0.038, 6, 6]} />
                    <meshBasicMaterial
                        color={i % 7 === 0 ? "#ffffff" : "#ff9fc9"}
                        transparent
                        opacity={0}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

function HeartConstellation({ visible }) {
    const ref = useRef();

    const points = useMemo(() => {
        const result = [];
        const count = 34;

        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y =
                13 * Math.cos(t) -
                5 * Math.cos(2 * t) -
                2 * Math.cos(3 * t) -
                Math.cos(4 * t);

            result.push(new THREE.Vector3(x * 0.11, y * 0.11, 0));
        }

        result.push(result[0].clone());
        return result;
    }, []);

    const geometry = useMemo(
        () => new THREE.BufferGeometry().setFromPoints(points),
        [points]
    );

    useEffect(() => () => geometry.dispose(), [geometry]);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.elapsedTime;
        ref.current.rotation.z = Math.sin(t * 0.15) * 0.02;
        ref.current.scale.setScalar(1 + Math.sin(t * 2.1) * 0.025);
    });

    if (!visible) return null;

    return (
        <group ref={ref} position={[0, 2.1, -18]}>
            <line geometry={geometry}>
                <lineBasicMaterial
                    color="#ffc7df"
                    transparent
                    opacity={0.28}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    toneMapped={false}
                />
            </line>

            {points.slice(0, -1).map((point, i) => (
                <mesh key={i} position={point}>
                    <sphereGeometry args={[i % 5 === 0 ? 0.05 : 0.03, 8, 8]} />
                    <meshBasicMaterial
                        color={i % 4 === 0 ? "#fff0a8" : "#ffd5e8"}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

function GoldenMagicRain({ visible }) {
    const ref = useRef();

    const data = useMemo(() => {
        const count = 240;
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 22;
            positions[i3 + 1] = Math.random() * 14 - 1;
            positions[i3 + 2] = -8 - Math.random() * 20;
            speeds[i] = 0.6 + Math.random() * 1.1;
        }

        return { positions, speeds };
    }, []);

    useFrame((_, delta) => {
        if (!ref.current || !visible) return;

        const attr = ref.current.geometry.attributes.position;

        for (let i = 0; i < data.speeds.length; i++) {
            const yi = i * 3 + 1;
            attr.array[yi] -= data.speeds[i] * delta;

            if (attr.array[yi] < -7) {
                attr.array[yi] = 8 + Math.random() * 5;
            }
        }

        attr.needsUpdate = true;
    });

    if (!visible) return null;

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[data.positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.045}
                color="#ffe59a"
                transparent
                opacity={0.46}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
                sizeAttenuation
            />
        </points>
    );
}


/* =========================================================
   SKY
========================================================= */
/* =========================================================
   FIREWORK SHOW
========================================================= */

function FireworkShow({ active }) {
    const fireworks = useMemo(
        () => [
            {
                target: [-5.2, 4.2, -14],
                delay: 0,
                color: "#ffd86b",
                secondary: true,
            },
            {
                target: [5.3, 5.1, -16],
                delay: 0.55,
                color: "#ff8fbd",
            },
            {
                target: [-2.2, 6.5, -18],
                delay: 1.1,
                color: "#8fcfff",
                secondary: true,
            },
            {
                target: [3.2, 7.1, -17],
                delay: 1.6,
                color: "#c69cff",
            },
            {
                target: [-6.3, 7.3, -20],
                delay: 2.15,
                color: "#fff0a0",
            },
            {
                target: [6.5, 3.8, -15],
                delay: 2.6,
                color: "#ff9e91",
                secondary: true,
            },
            {
                target: [0, 8.2, -19],
                delay: 3.1,
                color: "#ffffff",
                secondary: true,
            },

            // Finale
            {
                target: [-3.7, 5.8, -15],
                delay: 4,
                color: "#ffd76a",
            },
            {
                target: [3.9, 5.9, -15],
                delay: 4.08,
                color: "#9fcaff",
            },
            {
                target: [0, 7.5, -16],
                delay: 4.18,
                color: "#ff9fc9",
                secondary: true,
            },
        ],
        []
    );

    if (!active) {
        return null;
    }

    return (
        <group>
            {fireworks.map(
                (firework, index) => (
                    <FireworkRocket
                        key={index}
                        {...firework}
                        seed={index}
                    />
                )
            )}
        </group>
    );
}


/* =========================================================
   FIREWORK ROCKET
========================================================= */

function FireworkRocket({
    target,
    delay = 0,
    color = "#ffd76a",
    secondary = false,
    seed = 0,
}) {
    const groupRef = useRef();

    const rocketRef = useRef();

    const flashRef = useRef();

    const particlesRef =
        useRef([]);

    const secondaryRef =
        useRef([]);

    const startedAt =
        useRef(null);

    const exploded =
        useRef(false);

    const secondaryExploded =
        useRef(false);

    const startPosition =
        useMemo(
            () => [
                target[0] *
                    0.65,

                -7 -
                    (seed % 3),

                target[2] +
                    2,
            ],
            [target, seed]
        );

    /* =========================
       MAIN EXPLOSION PARTICLES
    ========================= */

    const particles =
        useMemo(() => {
            const count = 105;

            return Array.from(
                { length: count },
                (_, index) => {
                    const theta =
                        Math.random() *
                        Math.PI *
                        2;

                    const phi =
                        Math.acos(
                            2 *
                                Math.random() -
                                1
                        );

                    const speed =
                        1.4 +
                        Math.random() *
                            2.8;

                    const direction =
                        new THREE.Vector3(
                            Math.sin(phi) *
                                Math.cos(
                                    theta
                                ),

                            Math.cos(phi),

                            Math.sin(phi) *
                                Math.sin(
                                    theta
                                )
                        );

                    // Một số tia dài hơn
                    if (
                        index %
                            11 ===
                        0
                    ) {
                        direction.multiplyScalar(
                            1.35
                        );
                    }

                    return {
                        direction,
                        speed,

                        size:
                            0.018 +
                            Math.random() *
                                0.035,

                        drag:
                            0.88 +
                            Math.random() *
                                0.08,

                        twinkle:
                            Math.random() *
                            Math.PI *
                            2,
                    };
                }
            );
        }, []);

    /* =========================
       SECONDARY PARTICLES
    ========================= */

    const secondaryParticles =
        useMemo(() => {
            return Array.from(
                { length: 38 },
                () => {
                    const angle =
                        Math.random() *
                        Math.PI *
                        2;

                    const vertical =
                        (Math.random() -
                            0.5) *
                        0.7;

                    return {
                        direction:
                            new THREE.Vector3(
                                Math.cos(
                                    angle
                                ),
                                vertical,
                                Math.sin(
                                    angle
                                )
                            ),

                        speed:
                            0.7 +
                            Math.random() *
                                1.2,

                        size:
                            0.012 +
                            Math.random() *
                                0.022,
                    };
                }
            );
        }, []);

    useFrame(({ clock }) => {
        if (!groupRef.current) {
            return;
        }

        if (
            startedAt.current ===
            null
        ) {
            startedAt.current =
                clock.elapsedTime;
        }

        const elapsed =
            clock.elapsedTime -
            startedAt.current -
            delay;

        /* =========================
           WAIT
        ========================= */

        if (elapsed < 0) {
            groupRef.current.visible =
                false;

            return;
        }

        groupRef.current.visible =
            true;

        /* =========================
           ROCKET ASCENDING
        ========================= */

        const flightDuration =
            1.15;

        if (
            elapsed <
            flightDuration
        ) {
            const progress =
                elapsed /
                flightDuration;

            // ease out
            const eased =
                1 -
                Math.pow(
                    1 -
                        progress,
                    2.3
                );

            if (
                rocketRef.current
            ) {
                rocketRef.current.visible =
                    true;

                rocketRef.current.position.set(
                    THREE.MathUtils.lerp(
                        startPosition[0],
                        target[0],
                        eased
                    ),

                    THREE.MathUtils.lerp(
                        startPosition[1],
                        target[1],
                        eased
                    ),

                    THREE.MathUtils.lerp(
                        startPosition[2],
                        target[2],
                        eased
                    )
                );
            }

            return;
        }

        /* =========================
           EXPLODE
        ========================= */

        if (
            !exploded.current
        ) {
            exploded.current =
                true;

            if (
                rocketRef.current
            ) {
                rocketRef.current.visible =
                    false;
            }

            if (
                flashRef.current
            ) {
                flashRef.current.visible =
                    true;
            }
        }

        const explosionTime =
            elapsed -
            flightDuration;

        /* =========================
           FLASH
        ========================= */

        if (
            flashRef.current
        ) {
            if (
                explosionTime <
                0.22
            ) {
                const flashProgress =
                    explosionTime /
                    0.22;

                flashRef.current.visible =
                    true;

                flashRef.current.scale.setScalar(
                    0.2 +
                        flashProgress *
                            2.2
                );

                if (
                    flashRef.current
                        .material
                ) {
                    flashRef.current.material.opacity =
                        1 -
                        flashProgress;
                }
            } else {
                flashRef.current.visible =
                    false;
            }
        }

        /* =========================
           MAIN PARTICLES
        ========================= */

        particlesRef.current.forEach(
            (
                mesh,
                index
            ) => {
                if (!mesh) return;

                const particle =
                    particles[
                        index
                    ];

                const t =
                    explosionTime;

                if (t < 0) {
                    mesh.visible =
                        false;

                    return;
                }

                mesh.visible =
                    t < 3.4;

                const drag =
                    Math.pow(
                        particle.drag,
                        t * 8
                    );

                const distance =
                    particle.speed *
                    t *
                    drag;

                mesh.position.set(
                    target[0] +
                        particle
                            .direction
                            .x *
                            distance,

                    target[1] +
                        particle
                            .direction
                            .y *
                            distance -
                        0.38 *
                            t *
                            t,

                    target[2] +
                        particle
                            .direction
                            .z *
                            distance
                );

                const opacity =
                    Math.max(
                        0,
                        1 -
                            t /
                                3.2
                    );

                // twinkle
                const flicker =
                    0.7 +
                    Math.sin(
                        clock.elapsedTime *
                            18 +
                            particle.twinkle
                    ) *
                        0.3;

                if (
                    mesh.material
                ) {
                    mesh.material.opacity =
                        opacity *
                        flicker;
                }

                const scale =
                    Math.max(
                        0.15,
                        1 -
                            t *
                                0.16
                    );

                mesh.scale.setScalar(
                    scale
                );
            }
        );

        /* =========================
           SECONDARY EXPLOSION
        ========================= */

        if (
            secondary &&
            explosionTime >
                0.7
        ) {
            secondaryExploded.current =
                true;
        }

        if (
            secondaryExploded.current
        ) {
            const secondaryTime =
                explosionTime -
                0.7;

            secondaryRef.current.forEach(
                (
                    mesh,
                    index
                ) => {
                    if (!mesh) {
                        return;
                    }

                    const particle =
                        secondaryParticles[
                            index
                        ];

                    if (
                        secondaryTime <
                        0
                    ) {
                        mesh.visible =
                            false;

                        return;
                    }

                    mesh.visible =
                        secondaryTime <
                        2.2;

                    const distance =
                        particle.speed *
                        secondaryTime;

                    mesh.position.set(
                        target[0] +
                            particle
                                .direction
                                .x *
                                distance,

                        target[1] +
                            particle
                                .direction
                                .y *
                                distance -
                            0.3 *
                                secondaryTime *
                                secondaryTime,

                        target[2] +
                            particle
                                .direction
                                .z *
                                distance
                    );

                    if (
                        mesh.material
                    ) {
                        mesh.material.opacity =
                            Math.max(
                                0,
                                0.8 -
                                    secondaryTime /
                                        2.5
                            );
                    }
                }
            );
        }

        /* =========================
           END
        ========================= */

        if (
            explosionTime >
            4
        ) {
            groupRef.current.visible =
                false;
        }
    });

    return (
        <group ref={groupRef}>
            {/* =====================
                ROCKET
            ===================== */}

            <group
                ref={rocketRef}
                position={
                    startPosition
                }
            >
                {/* rocket head */}

                <mesh>
                    <sphereGeometry
                        args={[
                            0.045,
                            8,
                            8,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#ffffff"
                        toneMapped={
                            false
                        }
                    />
                </mesh>

                {/* rocket glow */}

                <mesh>
                    <sphereGeometry
                        args={[
                            0.12,
                            8,
                            8,
                        ]}
                    />

                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.2}
                        depthWrite={
                            false
                        }
                        blending={
                            THREE.AdditiveBlending
                        }
                        toneMapped={
                            false
                        }
                    />
                </mesh>

                {/* tail */}

                <mesh
                    position={[
                        0,
                        -0.25,
                        0,
                    ]}
                >
                    <planeGeometry
                        args={[
                            0.025,
                            0.55,
                        ]}
                    />

                    <meshBasicMaterial
                        color="#ffe5a3"
                        transparent
                        opacity={0.7}
                        side={
                            THREE.DoubleSide
                        }
                        depthWrite={
                            false
                        }
                        blending={
                            THREE.AdditiveBlending
                        }
                        toneMapped={
                            false
                        }
                    />
                </mesh>

                <pointLight
                    color={color}
                    intensity={2}
                    distance={2}
                />
            </group>

            {/* =====================
                EXPLOSION FLASH
            ===================== */}

            <mesh
                ref={flashRef}
                position={target}
                visible={false}
            >
                <sphereGeometry
                    args={[
                        0.3,
                        16,
                        16,
                    ]}
                />

                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={1}
                    depthWrite={
                        false
                    }
                    blending={
                        THREE.AdditiveBlending
                    }
                    toneMapped={
                        false
                    }
                />
            </mesh>

            {/* =====================
                MAIN EXPLOSION
            ===================== */}

            {particles.map(
                (
                    particle,
                    index
                ) => (
                    <mesh
                        key={
                            index
                        }
                        ref={(
                            element
                        ) => {
                            particlesRef.current[
                                index
                            ] =
                                element;
                        }}
                        visible={
                            false
                        }
                    >
                        <sphereGeometry
                            args={[
                                particle.size,
                                5,
                                5,
                            ]}
                        />

                        <meshBasicMaterial
                            color={
                                index %
                                    7 ===
                                0
                                    ? "#ffffff"
                                    : color
                            }
                            transparent
                            opacity={1}
                            depthWrite={
                                false
                            }
                            blending={
                                THREE.AdditiveBlending
                            }
                            toneMapped={
                                false
                            }
                        />
                    </mesh>
                )
            )}

            {/* =====================
                SECONDARY EXPLOSION
            ===================== */}

            {secondary &&
                secondaryParticles.map(
                    (
                        particle,
                        index
                    ) => (
                        <mesh
                            key={
                                index
                            }
                            ref={(
                                element
                            ) => {
                                secondaryRef.current[
                                    index
                                ] =
                                    element;
                            }}
                            visible={
                                false
                            }
                        >
                            <sphereGeometry
                                args={[
                                    particle.size,
                                    5,
                                    5,
                                ]}
                            />

                            <meshBasicMaterial
                                color="#ffffff"
                                transparent
                                opacity={
                                    0.8
                                }
                                depthWrite={
                                    false
                                }
                                blending={
                                    THREE.AdditiveBlending
                                }
                                toneMapped={
                                    false
                                }
                            />
                        </mesh>
                    )
                )}
        </group>
    );
}
export default function WishSky({
    wish,
    onBack,
}) {
    const [arrived, setArrived] =
        useState(false);

    return (
        <div className="wish-sky-page">
            <Canvas
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                }}
            >
                {/* Background */}

                <color
                    attach="background"
                    args={[
                        "#010208",
                    ]}
                />

                <fog
                    attach="fog"
                    args={[
                        "#010208",
                        28,
                        70,
                    ]}
                />

                {/* Camera */}

                <FlyingCamera
                    arrived={arrived}
                />

                {/* Lights */}

                <ambientLight
                    intensity={0.12}
                />

                {/* Cinematic deep-space objects */}

                <DistantPlanet
                    position={[
                        -11,
                        5,
                        -38,
                    ]}
                    radius={2.5}
                    color="#27345d"
                    glow="#647dff"
                    ring
                />

                <DistantPlanet
                    position={[
                        13,
                        -6,
                        -52,
                    ]}
                    radius={4}
                    color="#38294c"
                    glow="#9867d7"
                    ring={false}
                />

                <StardustTunnel />

                {/* Nebula */}

                <Nebulas />

                {/* Background stars */}

                <Stars
                    radius={120}
                    depth={80}
                    count={6500}
                    factor={3.2}
                    saturation={0}
                    fade
                    speed={0.08}
                />

                {/* Milky Way */}

                <MilkyWay />

                {/* Galaxy */}

                <Galaxy />

                {/* Middle sparkles */}

                <Sparkles
                    count={240}
                    scale={[
                        30,
                        18,
                        45,
                    ]}
                    size={1.3}
                    speed={0.1}
                    opacity={0.32}
                    color="#dfe8ff"
                />

                {/* Foreground */}

                <ForegroundStars />

                {/* Random meteors */}

                <ShootingStar
                    initialDelay={1}
                />

                <ShootingStar
                    initialDelay={6}
                />

                <ShootingStar
                    initialDelay={11}
                />

                {/* Wish */}

                <FlyingWishStar
                    onArrived={() =>
                        setArrived(true)
                    }
                />
                <FireworkShow active={arrived} />

                {/* Finale đặc biệt */}

                <HeartFirework active={arrived} />

                <HeartConstellation visible={arrived} />

                <GoldenMagicRain visible={arrived} />

                {/* Magic around the wish after arrival */}

                <CosmicRings
                    arrived={arrived}
                />

                <WishConstellation
                    visible={arrived}
                />

                <OrbitingParticles
                    visible={arrived}
                />

                <ArrivalBurst
                    active={arrived}
                />

                {/* Effects */}

                <EffectComposer>
                    <Bloom
                        intensity={2.4}
                        luminanceThreshold={
                            0.22
                        }
                        luminanceSmoothing={
                            0.85
                        }
                        mipmapBlur
                    />

                    <Vignette
                        eskil={false}
                        offset={0.08}
                        darkness={0.92}
                    />
                </EffectComposer>
            </Canvas>

            {/* ==============================
                MESSAGE
            =============================== */}

            <div
                className={`sky-message ${
                    arrived
                        ? "visible"
                        : ""
                }`}
            >
                <span className="sky-symbol">
                    ✦
                </span>

                <span className="sky-label">
                    {wish?.starId}
                </span>

                <h1>
                    Điều ước của em
                    <br />
                    đã có một nơi trên
                    bầu trời.
                </h1>

                <p>
                    Từ giờ, giữa hàng ngàn
                    vì sao, sẽ có một vì
                    sao giữ điều em mong
                    ước.
                </p>

                <button
                    onClick={onBack}
                >
                    ✦ Trở về cây điều ước
                </button>
            </div>
        </div>
    );
}