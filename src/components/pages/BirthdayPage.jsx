import { useEffect, useState } from "react";
import "./BirthdayPage.css";

import {
    getCurrentBirthdayVideo,
    markVideoViewed
} from "../apis/birthdayVideoApi";

export default function BirthdayPage({ onBack }) {

    // =========================================
    // STATE
    // =========================================

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
                "🎂 Birthday API:",
                res.data
            );


            // =====================================
            // VIDEO ĐANG BỊ KHÓA
            // =====================================

            if (res.data?.locked) {

                setLocked(true);

                // ---------------------------------
                // QUAN TRỌNG:
                // Không dùng new Date(unlockAt)
                // trực tiếp vì BE có thể trả:
                //
                // 2026-08-14T00:00:00.000Z
                //
                // Z = UTC
                // Việt Nam = UTC+7
                //
                // Nếu parse trực tiếp sẽ thành:
                // 14/08/2026 07:00
                //
                // Trong khi mình cần:
                // 14/08/2026 00:00
                // ---------------------------------

                if (res.data.unlockAt) {

                    setUnlockDate(
                        parseBirthdayDate(
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


                // =================================
                // GHI NHẬN LƯỢT XEM
                // =================================

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
    // PARSE NGÀY SINH NHẬT
    // =========================================
    //
    // Đây là phần FIX lỗi 20 giờ thay vì 13-14 giờ.
    //
    // API có thể trả:
    //
    // 2026-08-14
    //
    // hoặc:
    //
    // 2026-08-14T00:00:00.000Z
    //
    // hoặc:
    //
    // 2026-08-14T00:00:00.000+00:00
    //
    // Nếu dùng:
    //
    // new Date("2026-08-14T00:00:00.000Z")
    //
    // thì JavaScript sẽ hiểu là UTC.
    //
    // Việt Nam UTC+7 => thành 07:00.
    //
    // Ta chỉ lấy YYYY-MM-DD rồi tạo
    // Date theo LOCAL TIME của máy.
    //
    // =========================================

    const parseBirthdayDate = (value) => {

        if (!value) {

            return getNextBirthday();

        }


        const stringValue =
            String(value);


        // -----------------------------------------
        // Lấy YYYY-MM-DD
        // -----------------------------------------

        const match =
            stringValue.match(
                /^(\d{4})-(\d{2})-(\d{2})/
            );


        if (match) {

            const year =
                Number(match[1]);

            const month =
                Number(match[2]) - 1;

            const day =
                Number(match[3]);


            /*
             * Date local.
             *
             * Máy ở Việt Nam:
             *
             * 2026
             * 7
             * 14
             * 0
             * 0
             * 0
             *
             * = 14/08/2026 00:00
             */

            return new Date(
                year,
                month,
                day,
                0,
                0,
                0,
                0
            );

        }


        // -----------------------------------------
        // FALLBACK
        // -----------------------------------------

        const parsed =
            new Date(value);


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            return new Date(
                parsed.getFullYear(),
                parsed.getMonth(),
                parsed.getDate(),
                0,
                0,
                0,
                0
            );

        }


        return getNextBirthday();

    };


    // =========================================
    // NGÀY SINH NHẬT TIẾP THEO
    // =========================================

    const getNextBirthday = () => {

        const now =
            new Date();


        let year =
            now.getFullYear();


        let birthday =
            new Date(
                year,
                7,
                14,
                0,
                0,
                0,
                0
            );


        /*
         * Nếu đã qua 00:00 ngày 14/08
         * thì lấy sinh nhật năm sau.
         */

        if (now >= birthday) {

            year += 1;

            birthday =
                new Date(
                    year,
                    7,
                    14,
                    0,
                    0,
                    0,
                    0
                );

        }


        return birthday;

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


        // -----------------------------------------
        // Tránh gọi API liên tục sau khi hết giờ
        // -----------------------------------------

        let expired = false;


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


                /*
                 * Chỉ gọi API một lần.
                 */

                if (!expired) {

                    expired = true;

                    loadVideo();

                }


                return;

            }


            // =================================
            // TÍNH NGÀY
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


            // =================================
            // TÍNH GIỜ
            // =================================

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


            // =================================
            // TÍNH PHÚT
            // =================================

            const minutes =
                Math.floor(
                    difference /
                    (1000 * 60)
                );


            difference -=
                minutes *
                1000 *
                60;


            // =================================
            // TÍNH GIÂY
            // =================================

            const seconds =
                Math.floor(
                    difference /
                    1000
                );


            // =================================
            // UPDATE
            // =================================

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


        // Chạy ngay lập tức
        updateCountdown();


        // Chạy mỗi giây
        const timer =
            setInterval(
                updateCountdown,
                1000
            );


        return () => {

            clearInterval(timer);

        };

    }, [
        locked,
        unlockDate
    ]);


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

                            <br />

                            mở vào

                        </p>


                        <strong>

                            🎂 {formatUnlockDate()} ❤️

                        </strong>


                        {/* =========================
                            COUNTDOWN
                        ========================= */}

                        <div className="countdown">


                            {/* NGÀY */}

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


                            {/* GIỜ */}

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


                            {/* PHÚT */}

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


                            {/* GIÂY */}

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