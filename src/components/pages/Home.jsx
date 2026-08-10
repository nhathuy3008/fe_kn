import { useEffect, useMemo } from "react";
import "./Home.css";

export default function Home({
    onWishTree,
    onDiary,
    onBirthdayVideo,
    onAdmin,
}) {
    useEffect(() => {
        const handleAdminShortcut = (e) => {
            if (
                e.ctrlKey &&
                e.shiftKey &&
                e.key.toLowerCase() === "h"
            ) {
                e.preventDefault();

                if (onAdmin) {
                    onAdmin();
                }
            }
        };

        window.addEventListener(
            "keydown",
            handleAdminShortcut
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleAdminShortcut
            );
        };
    }, [onAdmin]);
    const stars = useMemo(
        () =>
            Array.from(
                { length: 100 },
                (_, i) => ({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 78,
                    delay: Math.random() * 6,
                    size:
                        1 +
                        Math.random() * 2.5,
                })
            ),
        []
    );

    return (
        <div className="journey">
            {/* =====================
                BACKGROUND
            ====================== */}

            <div className="journey-sky" />
            <div className="nebula nebula1"></div>
            <div className="nebula nebula2"></div>

            <div className="fog fog1"></div>
            <div className="fog fog2"></div>

            <div className="heart-rain">
                {Array.from({ length: 25 }).map((_, i) => (
                    <span
                        key={i}
                        className="heart-drop"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 12}s`,
                            animationDuration: `${18 + Math.random() * 8}s`
                        }}
                    >
                        ❤
                    </span>
                ))}
            </div>

            <div className="fireflies">
                {Array.from({ length: 35 }).map((_, i) => (
                    <span
                        key={i}
                        className="firefly"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${40 + Math.random() * 50}%`,
                            animationDelay: `${Math.random() * 8}s`
                        }}
                    />
                ))}
            </div>
            <div className="journey-stars">
                {stars.map((star) => (
                    <span
                        key={star.id}
                        style={{
                            "--x": `${star.x}%`,
                            "--y": `${star.y}%`,
                            "--delay": `${star.delay}s`,
                            "--size": `${star.size}px`,
                        }}
                    />
                ))}
            </div>
            <div className="magic-dust">
                {Array.from({ length: 250 }).map((_, i) => (
                    <span
                        key={i}
                        style={{
                            "--x": `${Math.random() * 100}%`,
                            "--y": `${Math.random() * 100}%`,
                            "--delay": `${Math.random() * 10}s`,
                            "--size": `${1 + Math.random() * 4}px`
                        }}
                    />
                ))}
            </div>
            <div className="comets">

                {

                    Array.from({ length: 6 }).map((_, i) =>

                        <div

                            key={i}

                            className="comet"

                            style={{

                                "--delay": `${i * 5}s`

                            }}

                        />

                    )

                }

            </div>
            <div className="leaf-rain">

                {

                    Array.from({ length: 30 }).map((_, i) =>

                        <span key={i}>🍃</span>

                    )

                }

            </div>
            <div className="background-firework">

                {

                    Array.from({ length: 5 }).map((_, i) =>

                        <div key={i} className="fw" />

                    )

                }

            </div>
            {/* Sao băng */}

            <div className="journey-shooting shooting-one" />
            <div className="journey-shooting shooting-two" />
            <div className="journey-shooting shooting-three" />

            {/* =====================
                MOON
            ====================== */}

            <div className="journey-moon">
                <span className="moon-hole moon-hole-1" />
                <span className="moon-hole moon-hole-2" />
                <span className="moon-hole moon-hole-3" />
            </div>

            {/* =====================
                TITLE
            ====================== */}

            <header className="journey-title">
                <span>
                    ✦ MỘT CÂU CHUYỆN NHỎ ✦
                </span>

                <h1>
                    Chuyện của
                    <em> chúng mình</em>
                </h1>

                <p>
                    Có những câu chuyện bắt đầu
                    <br />
                    chỉ từ một điều ước...
                </p>
            </header>

            {/* =====================
                CHƯƠNG I
            ====================== */}

            <button
                className="journey-place wish-place"
                type="button"
                onClick={onWishTree}
            >
                <div className="journey-tree">
                    <div className="tree-glow" />

                    <div className="jt-leaf jt-leaf-1" />
                    <div className="jt-leaf jt-leaf-2" />
                    <div className="jt-leaf jt-leaf-3" />
                    <div className="jt-leaf jt-leaf-4" />
                    <div className="jt-leaf jt-leaf-5" />

                    <div className="jt-trunk" />

                    <span className="jt-star jt-star-1">
                        ✦
                    </span>

                    <span className="jt-star jt-star-2">
                        ✦
                    </span>

                    <span className="jt-star jt-star-3">
                        ✦
                    </span>

                    <span className="jt-star jt-star-4">
                        ✦
                    </span>

                    <span className="jt-star jt-star-5">
                        ✦
                    </span>

                    <span className="jt-heart">
                        ♡
                    </span>
                </div>

                <div className="place-text">
                    <small>
                        CHƯƠNG I
                    </small>

                    <h2>
                        Cây Điều Ước
                    </h2>

                    <p>
                        Nơi một điều ước
                        <br />
                        tìm thấy vì sao
                        của mình.
                    </p>

                    <span>
                        Chạm vào cây
                    </span>
                </div>
            </button>

            {/* =====================
                CON ĐƯỜNG
            ====================== */}

            <div className="memory-path">
                <span className="path-dot p1" />
                <span className="path-dot p2" />
                <span className="path-dot p3" />
                <span className="path-dot p4" />
                <span className="path-dot p5" />
                <span className="path-dot p6" />
                <span className="path-dot p7" />

                <span className="path-memory memory-one">
                    ✦
                </span>

                <span className="path-memory memory-two">
                    ♡
                </span>

                <span className="path-memory memory-three">
                    ✦
                </span>
            </div>

            {/* =====================
                CHƯƠNG II
            ====================== */}

            <button
                className="journey-place diary-place"
                type="button"
                onClick={onDiary}
            >
                <div className="floating-book">
                    <div className="floating-book-glow" />

                    <div className="fb-page fb-left">
                        <span>✦</span>

                        <i />
                        <i />
                        <i />
                        <i />

                        <small>
                            H
                        </small>
                    </div>

                    <div className="fb-spine" />

                    <div className="fb-page fb-right">
                        <span>♡</span>

                        <i />
                        <i />
                        <i />
                        <i />

                        <small>
                            N
                        </small>
                    </div>

                    <span className="magic m1">
                        ✦
                    </span>

                    <span className="magic m2">
                        ♡
                    </span>

                    <span className="magic m3">
                        ✦
                    </span>

                    <span className="magic m4">
                        ·
                    </span>
                </div>

                <div className="place-text">
                    <small>
                        CHƯƠNG II
                    </small>

                    <h2>
                        Nhật Ký Tâm Sự
                    </h2>

                    <p>
                        Nơi những điều chưa nói
                        <br />
                        được viết thành kỷ niệm.
                    </p>

                    <span>
                        Mở cuốn nhật ký
                    </span>
                </div>
            </button>
            {/* =====================
        CHƯƠNG III
====================== */}

            <button
                className="journey-place birthday-place"
                type="button"
                onClick={onBirthdayVideo}
            >
                <div className="birthday-box">

                    <div className="birthday-glow" />

                    <div className="gift-base" />

                    <div className="gift-top" />

                    <div className="gift-ribbon-v" />

                    <div className="gift-ribbon-h" />

                    <span className="gift-heart">
                        ❤
                    </span>

                    <span className="gift-star star1">
                        ✦
                    </span>

                    <span className="gift-star star2">
                        ✦
                    </span>

                    <span className="gift-star star3">
                        ✦
                    </span>

                </div>

                <div className="place-text">

                    <small>
                        CHƯƠNG III
                    </small>

                    <h2>
                        Chiếc Hộp Thời Gian
                    </h2>

                    <p>
                        Một món quà...
                        <br />
                        chỉ mở vào ngày
                        14/08 mỗi năm.
                    </p>

                    <span>
                        Mở món quà
                    </span>

                </div>
            </button>
            {/* =====================
                GROUND
            ====================== */}

            <div className="journey-ground">
                <div className="ground-glow" />
            </div>
            {/* =====================
                FOOTER
            ====================== */}

            <div className="journey-ending">
                <span>♡</span>

                câu chuyện vẫn đang tiếp tục...

                <span>♡</span>
            </div>
        </div>
    );
}