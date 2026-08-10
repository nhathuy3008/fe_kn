import { useEffect, useState } from "react";
import "./BirthdayPage.css";

import {
    getCurrentBirthdayVideo,
    markVideoViewed
} from "../apis/birthdayVideoApi";

export default function BirthdayPage({ onBack }) {

    const [loading, setLoading] = useState(true);

    const [locked, setLocked] = useState(true);

    const [video, setVideo] = useState(null);

    const [countdown, setCountdown] = useState({
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00"
    });

    const [unlockDate, setUnlockDate] = useState(null);

    // =========================================
    // LOAD VIDEO
    // =========================================

    useEffect(() => {

        loadVideo();

    }, []);

    // =========================================
    // LOAD VIDEO TỪ API
    // =========================================

    const loadVideo = async () => {

        try {

            setLoading(true);

            const res =
                await getCurrentBirthdayVideo();

            console.log(
                "Birthday API:",
                res.data
            );

            // =====================================
            // VIDEO ĐANG BỊ KHÓA
            // =====================================

            if (res.data?.locked) {

                setLocked(true);

                if (res.data.unlockAt) {

                    setUnlockDate(
                        new Date(
                            res.data.unlockAt
                        )
                    );

                } else {

                    setUnlockDate(
                        getNextBirthday()
                    );

                }

                setVideo(null);

                return;
            }

            // =====================================
            // VIDEO ĐÃ MỞ
            // =====================================

            if (
                res.data?.success &&
                res.data?.data
            ) {

                setVideo(
                    res.data.data
                );

                setLocked(false);

                setUnlockDate(null);

                // Ghi nhận lượt xem
                try {

                    if (
                        res.data.data._id
                    ) {

                        await markVideoViewed(
                            res.data.data._id
                        );

                    }

                } catch (viewError) {

                    console.log(
                        "Không ghi nhận được lượt xem:",
                        viewError
                    );

                }

                return;
            }

            // =====================================
            // KHÔNG CÓ VIDEO
            // =====================================

            setLocked(true);

            setVideo(null);

            setUnlockDate(
                getNextBirthday()
            );

        } catch (error) {

            console.error(
                "Birthday video error:",
                error
            );

            /*
             * Nếu BE trả 404 vì chưa có
             * video năm nay thì vẫn hiển thị
             * màn hình khóa.
             */

            setLocked(true);

            setVideo(null);

            setUnlockDate(
                getNextBirthday()
            );

        } finally {

            setLoading(false);

        }

    };

    // =========================================
    // NGÀY SINH NHẬT TIẾP THEO
    // =========================================

    const getNextBirthday = () => {

        const now = new Date();

        let year =
            now.getFullYear();

        const birthday =
            new Date(
                year,
                7,
                14,
                0,
                0,
                0,
                0
            );

        if (now >= birthday) {

            year += 1;

        }

        return new Date(
            year,
            7,
            14,
            0,
            0,
            0,
            0
        );

    };

    // =========================================
    // COUNTDOWN
    // =========================================

    useEffect(() => {

        if (!locked) {
            return;
        }

        const target =
            unlockDate ||
            getNextBirthday();

        setUnlockDate(target);

        const updateCountdown = () => {

            const now =
                new Date();

            let difference =
                target.getTime() -
                now.getTime();

            // =================================
            // ĐẾN NGÀY MỞ
            // =================================

            if (difference <= 0) {

                setCountdown({
                    days: "00",
                    hours: "00",
                    minutes: "00",
                    seconds: "00"
                });

                // Gọi lại API để lấy video
                loadVideo();

                return;

            }

            // =================================
            // TÍNH THỜI GIAN
            // =================================

            const days =
                Math.floor(
                    difference /
                    (1000 * 60 * 60 * 24)
                );

            difference -=
                days *
                1000 *
                60 *
                60 *
                24;

            const hours =
                Math.floor(
                    difference /
                    (1000 * 60 * 60)
                );

            difference -=
                hours *
                1000 *
                60 *
                60;

            const minutes =
                Math.floor(
                    difference /
                    (1000 * 60)
                );

            difference -=
                minutes *
                1000 *
                60;

            const seconds =
                Math.floor(
                    difference /
                    1000
                );

            setCountdown({

                days:
                    String(days)
                        .padStart(2, "0"),

                hours:
                    String(hours)
                        .padStart(2, "0"),

                minutes:
                    String(minutes)
                        .padStart(2, "0"),

                seconds:
                    String(seconds)
                        .padStart(2, "0")

            });

        };

        updateCountdown();

        const timer =
            setInterval(
                updateCountdown,
                1000
            );

        return () => {

            clearInterval(timer);

        };

    }, [locked, unlockDate]);

    // =========================================
    // FORMAT NGÀY
    // =========================================

    const formatUnlockDate = () => {

        const date =
            unlockDate ||
            getNextBirthday();

        return date.toLocaleDateString(
            "vi-VN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    };

    // =========================================
    // LOADING
    // =========================================

    if (loading) {

        return (

            <div className="birthday-page">

                <div className="birthday-overlay" />

                <div className="birthday-stars" />

                <div className="birthday-content">

                    <div className="birthday-loader">

                        <div className="loader-heart">
                            ❤️
                        </div>

                        <p>
                            Đang mở món quà...
                        </p>

                    </div>

                </div>

            </div>

        );

    }

    // =========================================
    // MAIN
    // =========================================

    return (

        <div className="birthday-page">

            <div className="birthday-overlay" />

            <div className="birthday-stars" />

            <div className="birthday-content">

                {/* =================================
                    BACK
                ================================= */}

                <button
                    className="birthday-back"
                    onClick={onBack}
                    type="button"
                >
                    ← Quay lại
                </button>

                {/* =================================
                    TITLE
                ================================= */}

                <div className="birthday-title">

                    <span>
                        ✦ MỘT MÓN QUÀ NHỎ ✦
                    </span>

                    <h1>
                        🎂 Happy Birthday
                    </h1>

                    <p>
                        Có một món quà...
                        <br />
                        anh muốn dành riêng cho em.
                    </p>

                </div>

                {/* =================================
                    GIFT
                ================================= */}

                <div className="gift-container">

                    <div className="gift-glow" />

                    <div className="gift-box">

                        🎁

                    </div>

                </div>

                {/* =================================
                    LOCKED
                ================================= */}

                {locked && (

                    <div className="locked-box">

                        <div className="lock">
                            🔒
                        </div>

                        <h2>
                            Chưa đến lúc mở
                        </h2>

                        <p>
                            Món quà này sẽ được
                            mở vào
                        </p>

                        <strong>
                            🎂 {formatUnlockDate()} ❤️
                        </strong>

                        {/* =========================
                            COUNTDOWN
                        ========================= */}

                        <div className="countdown">

                            <div className="time-box">

                                <strong>
                                    {countdown.days}
                                </strong>

                                <span>
                                    Ngày
                                </span>

                            </div>

                            <div className="countdown-colon">
                                :
                            </div>

                            <div className="time-box">

                                <strong>
                                    {countdown.hours}
                                </strong>

                                <span>
                                    Giờ
                                </span>

                            </div>

                            <div className="countdown-colon">
                                :
                            </div>

                            <div className="time-box">

                                <strong>
                                    {countdown.minutes}
                                </strong>

                                <span>
                                    Phút
                                </span>

                            </div>

                            <div className="countdown-colon">
                                :
                            </div>

                            <div className="time-box">

                                <strong>
                                    {countdown.seconds}
                                </strong>

                                <span>
                                    Giây
                                </span>

                            </div>

                        </div>

                        <p className="countdown-message">

                            Hãy quay lại khi đồng hồ
                            về 0 nhé ❤️

                        </p>

                    </div>

                )}

                {/* =================================
                    VIDEO
                ================================= */}

                {!locked && video && (

                    <div className="video-card">

                        <div className="video-header">

                            <span>
                                ✦ Món quà dành cho em ✦
                            </span>

                            <h2>
                                {video.title}
                            </h2>

                        </div>

                        <div className="video-wrapper">

                            <video
                                controls
                                playsInline
                                preload="metadata"
                                controlsList="nodownload"
                            >

                                <source
                                    src={
                                        video.videoUrl
                                    }
                                    type="video/mp4"
                                />

                                Trình duyệt không hỗ trợ
                                phát video.

                            </video>

                        </div>

                        {video.description && (

                            <p className="video-description">

                                {video.description}

                            </p>

                        )}

                        <div className="video-footer">

                            <span>
                                ❤️
                            </span>

                            <span>
                                Một món quà nhỏ từ anh
                            </span>

                            <span>
                                ❤️
                            </span>

                        </div>

                    </div>

                )}

                {/* =================================
                    KHÔNG CÓ VIDEO
                ================================= */}

                {!locked && !video && (

                    <div className="locked-box">

                        <div className="lock">
                            🎁
                        </div>

                        <h2>
                            Món quà đang được chuẩn bị
                        </h2>

                        <p>
                            Anh đang chuẩn bị một
                            điều đặc biệt dành cho em ❤️
                        </p>

                    </div>

                )}

            </div>

        </div>

    );
}