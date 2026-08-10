import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import "./Diary.css";

/* =========================================================
   CONFIG
========================================================= */

const API_URL =
    import.meta.env.VITE_API_URL ||
    // "http://localhost:3000/api";
    "https://be-kn.onrender.com";

const AUTHOR = {
    huy: {
        name: "Huy",
        symbol: "✦",
        short: "H",
    },

    ngoc: {
        name: "Khánh Ngọc",
        symbol: "♡",
        short: "N",
    },
};

const MOODS = {
    love: {
        symbol: "♡",
        name: "Yêu thương",
    },

    happy: {
        symbol: "☀",
        name: "Vui",
    },

    miss: {
        symbol: "☾",
        name: "Nhớ",
    },

    sad: {
        symbol: "☂",
        name: "Buồn",
    },

    normal: {
        symbol: "✦",
        name: "Bình yên",
    },
};

const TYPES = {
    diary: {
        name: "Nhật ký",
        symbol: "✦",
    },

    wish: {
        name: "Lời chúc",
        symbol: "♡",
    },

    memory: {
        name: "Kỷ niệm",
        symbol: "❦",
    },

    letter: {
        name: "Lá thư",
        symbol: "✉",
    },
};

/* =========================================================
   API
========================================================= */

async function request(
    url,
    options = {}
) {
    const response =
        await fetch(
            url,
            options
        );

    let data = {};

    try {
        data =
            await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Có lỗi xảy ra."
        );
    }

    return data;
}

async function getYears() {
    return request(
        `${API_URL}/diaries/years`
    );
}

async function getByYear(year) {
    return request(
        `${API_URL}/diaries/year/${year}`
    );
}

async function createDiary(data) {
    return request(
        `${API_URL}/diaries`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify(
                data
            ),
        }
    );
}

async function updateDiary(
    id,
    data
) {
    return request(
        `${API_URL}/diaries/${id}`,
        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json",
            },

            body: JSON.stringify(
                data
            ),
        }
    );
}

async function deleteDiary(id) {
    return request(
        `${API_URL}/diaries/${id}`,
        {
            method: "DELETE",
        }
    );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
    if (!date) {
        return "";
    }

    const value =
        new Date(date);

    if (
        Number.isNaN(
            value.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "vi-VN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    ).format(value);
}

function formatShortDate(date) {
    if (!date) {
        return "";
    }

    const value =
        new Date(date);

    if (
        Number.isNaN(
            value.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        }
    ).format(value);
}

function dateInputValue(date) {
    const value = date
        ? new Date(date)
        : new Date();

    if (
        Number.isNaN(
            value.getTime()
        )
    ) {
        return "";
    }

    const offset =
        value.getTimezoneOffset();

    return new Date(
        value.getTime() -
        offset * 60000
    )
        .toISOString()
        .slice(0, 10);
}

function normalizeYearItem(
    item
) {
    if (
        typeof item === "number"
    ) {
        return {
            year: item,
            count: 0,
        };
    }

    if (
        typeof item === "string"
    ) {
        return {
            year: Number(item),
            count: 0,
        };
    }

    return {
        year: Number(
            item?.year
        ),
        count:
            Number(
                item?.count
            ) || 0,
    };
}

function isEntryLocked(
    entry
) {
    if (!entry?.locked) {
        return false;
    }

    if (!entry.unlockAt) {
        return true;
    }

    return (
        new Date() <
        new Date(
            entry.unlockAt
        )
    );
}

function getMoodInfo(mood) {
    return (
        MOODS[mood] ||
        MOODS.normal
    );
}

function getTypeInfo(type) {
    return (
        TYPES[type] ||
        TYPES.diary
    );
}

/* =========================================================
   BACKGROUND
========================================================= */

function RoomBackground() {
    const dust = useMemo(
        () =>
            Array.from(
                { length: 50 },
                (_, index) => ({
                    id: index,

                    left:
                        Math.random() *
                        100,

                    top:
                        Math.random() *
                        100,

                    delay:
                        Math.random() *
                        10,

                    duration:
                        6 +
                        Math.random() *
                        10,

                    size:
                        1 +
                        Math.random() *
                        3,
                })
            ),
        []
    );

    const stars = useMemo(
        () =>
            Array.from(
                { length: 30 },
                (_, index) => ({
                    id: index,

                    x:
                        Math.random() *
                        100,

                    y:
                        Math.random() *
                        100,

                    delay:
                        Math.random() *
                        6,

                    size:
                        1 +
                        Math.random() *
                        2,
                })
            ),
        []
    );

    return (
        <div className="diary-room">
            <div className="diary-night" />

            <div className="room-aurora room-aurora-one" />

            <div className="room-aurora room-aurora-two" />

            {/* WINDOW */}

            <div className="diary-window">
                <div className="window-sky">
                    <div className="diary-moon">
                        <span />
                        <span />
                        <span />

                        <div className="moon-halo" />
                    </div>

                    <div className="window-stars">
                        {stars.map(
                            (
                                star
                            ) => (
                                <i
                                    key={
                                        star.id
                                    }
                                    style={{
                                        "--x": `${star.x}%`,
                                        "--y": `${star.y}%`,
                                        "--delay": `${star.delay}s`,
                                        "--size": `${star.size}px`,
                                    }}
                                />
                            )
                        )}
                    </div>
                   <div className="fireworks">

    {Array.from({ length: 6 }).map((_, index) => (
        <div
            key={index}
            className="firework-shell"
            style={{
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${index * 3.5}s`
            }}
        >
            <span className="rocket" />

            <div className="heart-explosion">

    {[
        [0,-70],
        [25,-95],
        [55,-80],
        [75,-40],
        [60,10],
        [35,45],
        [0,65],
        [-35,45],
        [-60,10],
        [-75,-40],
        [-55,-80],
        [-25,-95],

        [12,-55],
        [40,-60],
        [55,-20],
        [45,20],
        [20,48],
        [-20,48],
        [-45,20],
        [-55,-20],
        [-40,-60],
        [-12,-55]
    ].map(([x,y],i)=>(

        <span
            key={i}
            className="heart-particle"
            style={{
                "--tx":`${x}px`,
                "--ty":`${y}px`
            }}
        >
            ❤
        </span>

    ))}

</div>

        </div>
    ))}

</div>
                    <div className="window-cloud cloud-one" />

                    <div className="window-cloud cloud-two" />

<div className="shooting-stars">

{
Array.from({ length: 8 }).map((_, index) => (

<div
    key={index}
    className="meteor"
    style={{
        "--delay": `${index * 2.8}s`,
        "--top": `${5 + Math.random() * 35}%`,
        "--left": `${Math.random() * 30}%`,
        "--duration": `${5 + Math.random() * 3}s`
    }}
>

<span className="meteor-head">

✨

</span>

    <span className="meteor-tail"></span>

</div>

))
}

</div>
                </div>

                <div className="window-frame vertical" />

                <div className="window-frame horizontal" />
            </div>
            <div className="fireflies">
                {
                    Array.from({ length: 12 }).map((_, i) => (
                        <span
                            key={i}
                            className="firefly"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 8}s`
                            }}
                        />
                    ))
                }
            </div>
            {/* CURTAINS */}

            <div className="curtain curtain-left">
                <span />
            </div>

            <div className="curtain curtain-right">
                <span />
            </div>

            {/* ROOM LIGHT */}

            <div className="room-light" />

            <div className="room-vignette" />

            {/* DUST */}

            <div className="diary-dust">
                {dust.map(
                    (item) => (
                        <i
                            key={
                                item.id
                            }
                            style={{
                                left: `${item.left}%`,
                                top: `${item.top}%`,
                                width:
                                    item.size,
                                height:
                                    item.size,
                                animationDelay: `${item.delay}s`,
                                animationDuration: `${item.duration}s`,
                            }}
                        />
                    )
                )}
            </div>
            <div className="heart-rain">
                {Array.from({ length: 18 }).map((_, index) => (
                    <span
                        key={index}
                        className="heart"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 12}s`,
                            animationDuration: `${10 + Math.random() * 8}s`
                        }}
                    >
                        ❤
                    </span>
                ))}
            </div>

            {/* TABLE */}

            <div className="diary-table">
                <div className="table-edge" />

                <div className="table-light" />
            </div>

            {/* CANDLE */}

            <div className="candle">
                <div className="candle-glow" />

                <div className="candle-flame">
                    <span />
                </div>

                <div className="candle-wick" />

                <div className="candle-body">
                    <span />
                </div>

                <div className="candle-shadow" />
            </div>
        </div>
    );
}

/* =========================================================
   INTRO BOOK
========================================================= */

function IntroBook({
    onOpen,
}) {
    const [
        opening,
        setOpening,
    ] = useState(false);

    const handleOpen = () => {
        if (opening) {
            return;
        }

        setOpening(true);

        window.setTimeout(
            () => {
                onOpen();
            },
            650
        );
    };

    return (
        <main
            className={`diary-intro ${opening ? "opening-scene" : ""
                }`}
        >
            <div className="chapter-heading">
                <span>
                    ✦ CHƯƠNG II ✦
                </span>

                <h1>
                    Nhật ký
                    <br />
                    <em>
                        của chúng mình
                    </em>
                </h1>

                <p>
                    Có những điều
                    chẳng cần nói
                    thành lời.
                    <br />
                    Chỉ cần một nơi
                    để chúng được ở
                    lại.
                </p>
            </div>

            <div className="intro-book-scene">
                <div className="intro-book-glow" />

                <span className="intro-magic intro-magic-one">
                    ✦
                </span>

                <span className="intro-magic intro-magic-two">
                    ♡
                </span>

                <span className="intro-magic intro-magic-three">
                    ✦
                </span>

                <span className="intro-magic intro-magic-four">
                    ·
                </span>

                <button
                    className={`closed-book ${opening
                            ? "opening"
                            : ""
                        }`}
                    onClick={
                        handleOpen
                    }
                    type="button"
                >
                    <div className="book-pages-side" />

                    <div className="book-back-cover" />

                    <div className="book-cover">
                        <div className="book-border">
                            <div className="cover-ornament cover-ornament-top">
                                ❦
                            </div>

                            <span className="cover-star">
                                ✦
                            </span>

                            <span className="cover-small">
                                NHẬT KÝ
                            </span>

                            <strong>
                                Của
                                <br />
                                chúng
                                mình
                            </strong>

                            <span className="cover-heart">
                                ♡
                            </span>

                            <small>
                                NHẬT HUY ·
                                KHÁNH
                                NGỌC
                            </small>

                            <div className="cover-ornament cover-ornament-bottom">
                                ❦
                            </div>
                        </div>
                    </div>

                    <span className="book-ribbon" />

                    <span className="open-book-label">
                        <i>
                            ✦
                        </i>

                        Chạm để mở

                        <i>
                            ✦
                        </i>
                    </span>
                </button>
            </div>

            <div className="intro-quote">
                <span>
                    “
                </span>

                Mỗi trang giấy là
                một mảnh nhỏ của
                chúng ta.

                <span>
                    ”
                </span>
            </div>
        </main>
    );
}

/* =========================================================
   YEAR SELECTOR
========================================================= */

function YearSelector({
    years,
    selectedYear,
    onChange,
}) {
    return (
        <div className="year-selector">
            <span className="year-line" />

            <span className="timeline-star">
                ✦
            </span>

            <div className="year-list">
                {years.map(
                    (rawItem) => {
                        const item =
                            normalizeYearItem(
                                rawItem
                            );

                        return (
                            <button
                                key={
                                    item.year
                                }
                                type="button"
                                className={
                                    Number(
                                        selectedYear
                                    ) ===
                                        item.year
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    onChange(
                                        item.year
                                    )
                                }
                            >
                                <i />

                                <span>
                                    {
                                        item.year
                                    }
                                </span>

                                {item.count >
                                    0 && (
                                        <small>
                                            {
                                                item.count
                                            }{" "}
                                            trang
                                        </small>
                                    )}
                            </button>
                        );
                    }
                )}
            </div>

            <span className="timeline-heart">
                ♡
            </span>

            <span className="year-line" />
        </div>
    );
}

/* =========================================================
   YEAR STATISTICS
========================================================= */

function YearStats({
    entries,
    year,
}) {
    const stats =
        useMemo(() => {
            let huy = 0;
            let ngoc = 0;

            const moods = {};

            entries.forEach(
                (entry) => {
                    if (
                        entry.author ===
                        "huy"
                    ) {
                        huy += 1;
                    }

                    if (
                        entry.author ===
                        "ngoc"
                    ) {
                        ngoc += 1;
                    }

                    const mood =
                        entry.mood ||
                        "normal";

                    moods[mood] =
                        (moods[
                            mood
                        ] || 0) + 1;
                }
            );

            const topMood =
                Object.entries(
                    moods
                ).sort(
                    (
                        [, a],
                        [, b]
                    ) => b - a
                )[0]?.[0] ||
                "normal";

            return {
                total:
                    entries.length,
                huy,
                ngoc,
                topMood,
            };
        }, [entries]);

    const mood =
        getMoodInfo(
            stats.topMood
        );

    return (
        <section className="year-summary">

            <div className="year-card">

                <div className="year-left">
                    <small>NĂM</small>

                    <h2>{year}</h2>

                    <p>
                        {entries.length === 0
                            ? "Chưa có kỷ niệm nào."
                            : "Một năm đáng nhớ."}
                    </p>
                </div>

                <div className="year-right">

                    <div className="stat-box">
                        <strong>{stats.total}</strong>
                        <span>Trang</span>
                    </div>

                    <div className="stat-box">
                        <strong>{stats.huy}</strong>
                        <span>Huy</span>
                    </div>

                    <div className="stat-box">
                        <strong>{stats.ngoc}</strong>
                        <span>Ngọc</span>
                    </div>

                    <div className="stat-box mood">
                        <strong>{mood.symbol}</strong>
                        <span>{mood.name}</span>
                    </div>

                </div>

            </div>

        </section>
    );
}

/* =========================================================
   PAGE DECORATION
========================================================= */

function PageDecoration({
    side,
}) {
    return (
        <>
            <span
                className={`page-corner ${side}`}
            />

            <span className="page-flower flower-one">
                ❦
            </span>

            <span className="page-flower flower-two">
                ✦
            </span>

            <span className="paper-grain" />
        </>
    );
}

/* =========================================================
   LOCKED LETTER
========================================================= */

function LockedPage({
    entry,
}) {
    return (
        <article className="entry-page locked-page">
            <PageDecoration side="right" />

            <span className="entry-date">
                {formatDate(
                    entry.diaryDate
                )}
            </span>

            <div className="locked-letter">
                <span className="letter-shadow" />

                <div className="envelope">
                    <div className="envelope-back" />

                    <div className="envelope-paper">
                        <span>
                            Một vài lời
                            đang ngủ
                            yên...
                        </span>
                    </div>

                    <div className="envelope-left" />

                    <div className="envelope-right" />

                    <div className="envelope-bottom" />

                    <div className="envelope-flap" />

                    <div className="wax-seal">
                        <span>
                            ♡
                        </span>
                    </div>
                </div>

                <span className="lock-symbol">
                    ✦
                </span>

                <h3>
                    Một lá thư
                    <br />
                    đang chờ em
                </h3>

                <p>
                    Có vài lời chỉ
                    nên được đọc khi
                    đúng thời điểm.
                </p>

                {entry.unlockAt && (
                    <small>
                        Mở vào{" "}
                        {formatShortDate(
                            entry.unlockAt
                        )}
                    </small>
                )}
            </div>
        </article>
    );
}

/* =========================================================
   DIARY ENTRY
========================================================= */

function DiaryEntry({
    entry,
    author,
}) {
    return (
        <div className="diary-entry-design">
            <span className="entry-type">
                ✦ NHẬT KÝ
            </span>

            {entry.title && (
                <h2>
                    {entry.title}
                </h2>
            )}

            <div className="handwriting-line" />

            <div className="entry-content">
                {entry.content}
            </div>

            <footer className="entry-signature">
                <span>
                    {
                        author.symbol
                    }
                </span>

                <em>
                    {author.name}
                </em>
            </footer>
        </div>
    );
}

/* =========================================================
   WISH ENTRY
========================================================= */

function WishEntry({
    entry,
    author,
}) {
    return (
        <div className="wish-entry-design">
            <div className="wish-entry-stars">
                <span>
                    ✦
                </span>

                <span>
                    ·
                </span>

                <span>
                    ✦
                </span>

                <span>
                    ♡
                </span>
            </div>

            <span className="entry-type">
                ♡ LỜI CHÚC
            </span>

            <span className="wish-entry-heart">
                ♡
            </span>

            {entry.title && (
                <h2>
                    {entry.title}
                </h2>
            )}

            <div className="wish-quote">
                <span>
                    “
                </span>

                <div className="entry-content">
                    {
                        entry.content
                    }
                </div>

                <span>
                    ”
                </span>
            </div>

            <footer className="entry-signature">
                <span>
                    {
                        author.symbol
                    }
                </span>

                <em>
                    {author.name}
                </em>
            </footer>
        </div>
    );
}

/* =========================================================
   MEMORY ENTRY
========================================================= */

function MemoryEntry({
    entry,
    author,
}) {
    return (
        <div className="memory-entry-design">
            <span className="entry-type">
                ❦ KỶ NIỆM
            </span>

            <div className="memory-tape tape-one" />

            <div className="memory-tape tape-two" />

            <div className="memory-polaroid">
                <div className="memory-photo-placeholder">
                    <span>
                        ✦
                    </span>

                    <small>
                        một khoảnh
                        khắc
                    </small>
                </div>

                <div className="memory-polaroid-caption">
                    {formatShortDate(
                        entry.diaryDate
                    )}
                </div>
            </div>

            {entry.title && (
                <h2>
                    {entry.title}
                </h2>
            )}

            <div className="entry-content">
                {entry.content}
            </div>

            <footer className="entry-signature">
                <span>
                    {
                        author.symbol
                    }
                </span>

                <em>
                    {author.name}
                </em>
            </footer>
        </div>
    );
}

/* =========================================================
   LETTER ENTRY
========================================================= */

function LetterEntry({
    entry,
    author,
}) {
    const [
        opened,
        setOpened,
    ] = useState(false);

    return (
        <div className="letter-entry-design">
            <span className="entry-type">
                ✉ LÁ THƯ
            </span>
            <div className="letter-paper opened">
                <span className="letter-to">
                    Gửi{" "}
                    {entry.author ===
                        "huy"
                        ? "em"
                        : "anh"}
                    ,
                </span>

                {entry.title && (
                    <h2>
                        {
                            entry.title
                        }
                    </h2>
                )}

                <div className="entry-content">
                    {
                        entry.content
                    }
                </div>

                <footer className="entry-signature">
                    <span>
                        {
                            author.symbol
                        }
                    </span>

                    <em>
                        {
                            author.name
                        }
                    </em>
                </footer>
            </div>
        </div>
    );
}

/* =========================================================
   ENTRY PAGE
========================================================= */

function EntryPage({
    entry,
    onEdit,
    onDelete,
}) {
    const author =
        AUTHOR[
        entry.author
        ] || AUTHOR.huy;

    const mood =
        getMoodInfo(
            entry.mood
        );

    const locked =
        isEntryLocked(
            entry
        );

    if (locked) {
        return (
            <LockedPage
                entry={entry}
            />
        );
    }

    const isHuy =
        entry.author === "huy";

    const type =
        entry.type || "diary";

    return (
        <article
            className={`entry-page entry-${type} ${isHuy
                    ? "entry-huy"
                    : "entry-ngoc"
                }`}
        >
            <PageDecoration
                side={
                    isHuy
                        ? "left"
                        : "right"
                }
            />

            <header className="entry-header">
                <span className="entry-date">
                    {formatDate(
                        entry.diaryDate
                    )}
                </span>

                <span
                    className="entry-mood"
                    title={
                        mood.name
                    }
                >
                    {
                        mood.symbol
                    }
                </span>
            </header>

            {type ===
                "diary" && (
                    <DiaryEntry
                        entry={
                            entry
                        }
                        author={
                            author
                        }
                    />
                )}

            {type ===
                "wish" && (
                    <WishEntry
                        entry={
                            entry
                        }
                        author={
                            author
                        }
                    />
                )}

            {type ===
                "memory" && (
                    <MemoryEntry
                        entry={
                            entry
                        }
                        author={
                            author
                        }
                    />
                )}

            {type ===
                "letter" && (
                    <LetterEntry
                        entry={
                            entry
                        }
                        author={
                            author
                        }
                    />
                )}

            <div className="entry-actions">
                <button
                    type="button"
                    onClick={() =>
                        onEdit(
                            entry
                        )
                    }
                >
                    Sửa
                </button>

                <span>
                    ·
                </span>

                <button
                    type="button"
                    onClick={() =>
                        onDelete(
                            entry
                        )
                    }
                >
                    Xóa
                </button>
            </div>
        </article>
    );
}

/* =========================================================
   YEAR TITLE PAGE
========================================================= */

function YearTitlePage({
    year,
    entries,
}) {
    return (
        <article className="book-title-page">
            <PageDecoration side="left" />

            <span className="year-page-star">
                ✦
            </span>

            <small>
                CHƯƠNG
            </small>

            <strong>
                {year}
            </strong>

            <div className="year-page-divider">
                <i />

                <span>
                    ♡
                </span>

                <i />
            </div>
        </article>
    );
}

/* =========================================================
   EMPTY PAGE
========================================================= */

function EmptyPage({
    year,
    onWrite,
}) {
    return (
        <article className="entry-page empty-page">
            <PageDecoration side="right" />

            <span className="empty-symbol">
                ✦
            </span>

            <small>
                TRANG CHƯA VIẾT
            </small>

            <h2>
                {year}
            </h2>

            <p>
                Những trang giấy
                của năm này vẫn
                còn trống.
            </p>

            <span className="empty-divider">
                ♡
            </span>

            <em>
                Có lẽ chúng chỉ
                đang chờ một câu
                chuyện mới.
            </em>

            <button
                type="button"
                onClick={onWrite}
            >
                <span>
                    ＋
                </span>
            </button>
        </article>
    );
}

/* =========================================================
   BOOK
========================================================= */

function DiaryBook({
    entries,
    year,
    page,
    setPage,
    onEdit,
    onDelete,
    onWrite,
}) {
    /*
        Spread 0:
        LEFT  = year title
        RIGHT = entry 0

        Spread 1:
        LEFT  = entry 1
        RIGHT = entry 2

        Spread 2:
        LEFT  = entry 3
        RIGHT = entry 4
        ...
    */

    const [
        turning,
        setTurning,
    ] = useState("");

    const [
        direction,
        setDirection,
    ] = useState("");

    const totalSpreads =
        Math.max(
            1,
            Math.ceil(
                (entries.length +
                    1) /
                2
            )
        );

    const getSpread =
        () => {
            if (page === 0) {
                return {
                    left: {
                        type: "year",
                    },

                    right:
                        entries[0] ||
                        null,
                };
            }

            const leftIndex =
                page * 2 - 1;

            const rightIndex =
                page * 2;

            return {
                left:
                    entries[
                    leftIndex
                    ] || null,

                right:
                    entries[
                    rightIndex
                    ] || null,
            };
        };

    const spread =
        getSpread();

    const turnTo = (
        nextPage,
        dir
    ) => {
        if (turning) {
            return;
        }

        setDirection(dir);
        setTurning(
            dir
        );

        window.setTimeout(
            () => {
                setPage(
                    nextPage
                );
            },
            260
        );

        window.setTimeout(() => {
            setTurning("");
        }, 2600);
    };

    const previous =
        () => {
            if (
                page <= 0
            ) {
                return;
            }

            turnTo(
                page - 1,
                "previous"
            );
        };

    const next = () => {
        if (
            page >=
            totalSpreads -
            1
        ) {
            return;
        }

        turnTo(
            page + 1,
            "next"
        );
    };

    const renderPage = (
        value,
        side
    ) => {
        if (
            value?.type ===
            "year"
        ) {
            return (
                <YearTitlePage
                    year={
                        year
                    }
                    entries={
                        entries
                    }
                />
            );
        }

        if (value) {
            return (
                <EntryPage
                    entry={
                        value
                    }
                    onEdit={
                        onEdit
                    }
                    onDelete={
                        onDelete
                    }
                />
            );
        }

        return (
            <EmptyPage
                year={year}
                onWrite={
                    onWrite
                }
            />
        );
    };

    return (
        <section
            className={`book-stage ${turning
                    ? `book-turning ${turning}`
                    : ""
                }`}
        >
            <div className="book-aura" />

            <div className="book-shadow" />

            <span className="book-particle bp-one">
                ✦
            </span>

            <span className="book-particle bp-two">
                ·
            </span>

            <span className="book-particle bp-three">
                ♡
            </span>

            <span className="book-particle bp-four">
                ✦
            </span>

            <div className="open-diary-book">
                <div className="book-page left-page">
                    {renderPage(
                        spread.left,
                        "left"
                    )}
                </div>

                <div className="book-spine">
                    <span />

                    <i />
                </div>

                <div className="book-page right-page">
                    {renderPage(
                        spread.right,
                        "right"
                    )}
                </div>

                {turning && (
                    <div
                        className={`page-turn-layer ${direction}`}
                    >
                        <div className="turn-page-front">
                            <span>
                                ✦
                            </span>
                        </div>

                        <div className="turn-page-back">
                            <span>
                                ♡
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="book-controls">
                <button
                    type="button"
                    disabled={
                        page === 0 ||
                        Boolean(
                            turning
                        )
                    }
                    onClick={
                        previous
                    }
                    aria-label="Trang trước"
                >
                    ‹
                </button>

                <div className="page-indicator">

                    <button
                        className="page-nav"
                        disabled={page === 0}
                        onClick={previous}
                    >
                        ←
                    </button>

                    <div className="page-center">

                        <small>Trang hiện tại</small>

                        <strong>
                            {page + 1}
                            <span> / {totalSpreads}</span>
                        </strong>

                        <div className="page-dots">
                            {Array.from({ length: totalSpreads }).map((_, index) => (
                                <span
                                    key={index}
                                    className={
                                        index === page
                                            ? "dot active"
                                            : "dot"
                                    }
                                    onClick={() => turnTo(index, index > page ? "next" : "prev")}
                                />
                            ))}
                        </div>

                    </div>

                    <button
                        className="page-nav"
                        disabled={page === totalSpreads - 1}
                        onClick={next}
                    >
                        →
                    </button>

                </div>

                <button
                    type="button"
                    disabled={
                        page >=
                        totalSpreads -
                        1 ||
                        Boolean(
                            turning
                        )
                    }
                    onClick={next}
                    aria-label="Trang sau"
                >
                    ›
                </button>
            </div>
        </section>
    );
}

/* =========================================================
   EDITOR
========================================================= */

function DiaryEditor({
    initial,
    selectedYear,
    onClose,
    onSaved,
}) {
    const editing =
        Boolean(
            initial?._id
        );

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [form, setForm] =
        useState({
            title:
                initial?.title ||
                "",

            content:
                initial?.content ||
                "",

            author:
                initial?.author ||
                "ngoc",

            type:
                initial?.type ||
                "diary",

            mood:
                initial?.mood ||
                "normal",

            diaryDate:
                dateInputValue(
                    initial?.diaryDate ||
                    new Date(
                        selectedYear,
                        0,
                        1
                    )
                ),

            locked:
                Boolean(
                    initial?.locked
                ),

            unlockAt:
                initial?.unlockAt
                    ? dateInputValue(
                        initial.unlockAt
                    )
                    : "",
        });

    const change = (
        field,
        value
    ) => {
        setForm(
            (
                previous
            ) => ({
                ...previous,

                [field]:
                    value,
            })
        );
    };

    const submit =
        async (
            event
        ) => {
            event.preventDefault();

            if (
                !form.title.trim()
            ) {
                setError(
                    "Hãy đặt tên cho trang này."
                );

                return;
            }

            if (
                !form.content.trim()
            ) {
                setError(
                    "Trang nhật ký chưa có nội dung."
                );

                return;
            }

            if (
                form.locked &&
                !form.unlockAt
            ) {
                setError(
                    "Hãy chọn ngày mở cho trang đã khóa."
                );

                return;
            }

            try {
                setSaving(
                    true
                );

                setError("");

                const payload = {
                    title:
                        form.title.trim(),

                    content:
                        form.content.trim(),

                    author:
                        form.author,

                    type:
                        form.type,

                    mood:
                        form.mood,

                    diaryDate:
                        form.diaryDate,

                    locked:
                        form.locked,

                    unlockAt:
                        form.locked
                            ? form.unlockAt ||
                            null
                            : null,
                };

                if (editing) {
                    await updateDiary(
                        initial._id,
                        payload
                    );
                } else {
                    await createDiary(
                        payload
                    );
                }

                await onSaved();
            } catch (err) {
                setError(
                    err.message
                );
            } finally {
                setSaving(
                    false
                );
            }
        };

    const selectedType =
        getTypeInfo(
            form.type
        );

    return (
        <div
            className="editor-overlay"
            onMouseDown={
                onClose
            }
        >
            <div className="editor-light" />

            <form
                className={`diary-editor editor-${form.type}`}
                onSubmit={
                    submit
                }
                onMouseDown={(
                    event
                ) =>
                    event.stopPropagation()
                }
            >
                <div className="editor-paper-shadow" />

                <PageDecoration side="right" />

                <button
                    className="editor-close"
                    type="button"
                    onClick={
                        onClose
                    }
                    aria-label="Đóng"
                >
                    ×
                </button>

                <span className="editor-symbol">
                    {
                        selectedType.symbol
                    }
                </span>

                <span className="editor-label">
                    {editing
                        ? "CHỈNH SỬA MỘT TRANG"
                        : "MỘT TRANG MỚI"}
                </span>

                <h2>
                    Viết những điều
                    <br />
                    <em>
                        trong lòng.
                    </em>
                </h2>

                {/* AUTHOR */}

                <div className="author-switch">
                    <button
                        type="button"
                        className={
                            form.author ===
                                "huy"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            change(
                                "author",
                                "huy"
                            )
                        }
                    >
                        <span>
                            ✦
                        </span>

                        Huy
                    </button>

                    <button
                        type="button"
                        className={
                            form.author ===
                                "ngoc"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            change(
                                "author",
                                "ngoc"
                            )
                        }
                    >
                        <span>
                            ♡
                        </span>

                        Khánh Ngọc
                    </button>
                </div>

                {/* OPTIONS */}

                <div className="editor-row">
                    <label>
                        <span>
                            Ngày
                        </span>

                        <input
                            type="date"
                            value={
                                form.diaryDate
                            }
                            onChange={(
                                event
                            ) =>
                                change(
                                    "diaryDate",
                                    event
                                        .target
                                        .value
                                )
                            }
                        />
                    </label>

                    <label>
                        <span>
                            Kiểu
                        </span>

                        <select
                            value={
                                form.type
                            }
                            onChange={(
                                event
                            ) =>
                                change(
                                    "type",
                                    event
                                        .target
                                        .value
                                )
                            }
                        >
                            <option value="diary">
                                Nhật ký
                            </option>

                            <option value="letter">
                                Lá thư
                            </option>

                            <option value="wish">
                                Lời chúc
                            </option>

                            <option value="memory">
                                Kỷ niệm
                            </option>
                        </select>
                    </label>

                    <label>
                        <span>
                            Cảm xúc
                        </span>

                        <select
                            value={
                                form.mood
                            }
                            onChange={(
                                event
                            ) =>
                                change(
                                    "mood",
                                    event
                                        .target
                                        .value
                                )
                            }
                        >
                            {Object.entries(
                                MOODS
                            ).map(
                                ([
                                    key,
                                    value,
                                ]) => (
                                    <option
                                        key={
                                            key
                                        }
                                        value={
                                            key
                                        }
                                    >
                                        {
                                            value.symbol
                                        }{" "}
                                        {
                                            value.name
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </label>
                </div>

                {/* TITLE */}

                <div className="editor-writing-area">
                    <input
                        className="editor-title"
                        placeholder={
                            form.type ===
                                "letter"
                                ? "Tên của lá thư..."
                                : form.type ===
                                    "wish"
                                    ? "Một lời chúc dành cho..."
                                    : form.type ===
                                        "memory"
                                        ? "Tên của kỷ niệm..."
                                        : "Đặt tên cho trang này..."
                        }
                        value={
                            form.title
                        }
                        maxLength={
                            150
                        }
                        onChange={(
                            event
                        ) =>
                            change(
                                "title",
                                event
                                    .target
                                    .value
                            )
                        }
                    />

                    <div className="editor-divider">
                        <span />

                        <i>
                            {
                                selectedType.symbol
                            }
                        </i>

                        <span />
                    </div>

                    <textarea
                        placeholder={
                            form.type ===
                                "letter"
                                ? "Có những điều em muốn gửi đến anh..."
                                : form.type ===
                                    "wish"
                                    ? "Em mong rằng..."
                                    : form.type ===
                                        "memory"
                                        ? "Hôm ấy chúng mình..."
                                        : "Hôm nay em muốn viết rằng..."
                        }
                        value={
                            form.content
                        }
                        onChange={(
                            event
                        ) =>
                            change(
                                "content",
                                event
                                    .target
                                    .value
                            )
                        }
                        maxLength={
                            10000
                        }
                    />

                    <span className="editor-count">
                        {
                            form.content
                                .length
                        }
                        /10000
                    </span>
                </div>

                {/* LOCK */}

                <div className="editor-bottom">
                    <label className="lock-option">
                        <input
                            type="checkbox"
                            checked={
                                form.locked
                            }
                            onChange={(
                                event
                            ) =>
                                change(
                                    "locked",
                                    event
                                        .target
                                        .checked
                                )
                            }
                        />

                        <span className="custom-check">
                            {form.locked
                                ? "♡"
                                : ""}
                        </span>

                        <span>
                            Khóa trang
                            này đến một
                            ngày đặc biệt
                        </span>
                    </label>

                    {form.locked && (
                        <div className="unlock-field">
                            <span>
                                Mở vào
                            </span>

                            <input
                                className="unlock-input"
                                type="date"
                                value={
                                    form.unlockAt
                                }
                                onChange={(
                                    event
                                ) =>
                                    change(
                                        "unlockAt",
                                        event
                                            .target
                                            .value
                                    )
                                }
                            />
                        </div>
                    )}
                </div>

                {error && (
                    <div className="editor-error">
                        <span>
                            ☾
                        </span>

                        {error}
                    </div>
                )}

                <button
                    className="save-page"
                    disabled={
                        saving
                    }
                    type="submit"
                >
                    {saving ? (
                        <>
                            <span className="save-spinner">
                                ✦
                            </span>

                            Đang lưu...
                        </>
                    ) : (
                        <>
                            {editing
                                ? "Lưu thay đổi"
                                : "Giữ lại trang này"}

                            <span>
                                ♡
                            </span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

/* =========================================================
   MAIN
========================================================= */

export default function Diary({
    onBack,
}) {
    const currentYear =
        new Date().getFullYear();

    const [
        opened,
        setOpened,
    ] = useState(false);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [error, setError] =
        useState("");

    const [years, setYears] =
        useState([
            {
                year: currentYear,
                count: 0,
            },
        ]);

    const [
        selectedYear,
        setSelectedYear,
    ] = useState(
        currentYear
    );

    const [
        entries,
        setEntries,
    ] = useState([]);

    const [page, setPage] =
        useState(0);

    const [
        editor,
        setEditor,
    ] = useState(null);

    /* =========================
       AUTO FIT TO SCREEN
       (co giãn toàn bộ .diary-library
       để luôn vừa đúng 1 màn hình,
       không cần zoom tay)
    ========================= */

    const libraryRef = useRef(null);

    const [fitScale, setFitScale] =
        useState(1);

    useEffect(() => {
        if (!opened) {
            return;
        }

        const el = libraryRef.current;

        if (!el) {
            return;
        }

        const recalc = () => {
            // đo chiều cao thật của nội dung
            // khi CHƯA bị scale (transform không
            // ảnh hưởng đến scrollHeight)
            const contentHeight =
                el.scrollHeight;

            const available =
                window.innerHeight - 16;

            const nextScale = Math.min(
                1,
                available / contentHeight
            );

            setFitScale(nextScale);
        };

        recalc();

        const observer =
            new ResizeObserver(recalc);

        observer.observe(el);

        window.addEventListener(
            "resize",
            recalc
        );

        return () => {
            observer.disconnect();

            window.removeEventListener(
                "resize",
                recalc
            );
        };
    }, [
        opened,
        entries,
        loading,
        error,
        selectedYear,
        page,
    ]);

    /* =========================
       LOAD YEARS
    ========================= */

    const loadYears =
        async () => {
            try {
                const result =
                    await getYears();

                const serverYears =
                    result.data ||
                    [];

                const map =
                    new Map();

                serverYears.forEach(
                    (
                        rawItem
                    ) => {
                        const item =
                            normalizeYearItem(
                                rawItem
                            );

                        if (
                            !Number.isFinite(
                                item.year
                            )
                        ) {
                            return;
                        }

                        map.set(
                            item.year,
                            item
                        );
                    }
                );

                if (
                    !map.has(
                        currentYear
                    )
                ) {
                    map.set(
                        currentYear,
                        {
                            year: currentYear,
                            count: 0,
                        }
                    );
                }

                setYears(
                    [
                        ...map.values(),
                    ].sort(
                        (
                            a,
                            b
                        ) =>
                            b.year -
                            a.year
                    )
                );
            } catch (err) {
                console.error(
                    "loadYears:",
                    err
                );
            }
        };

    /* =========================
       LOAD ENTRIES
    ========================= */

    const loadEntries =
        async (year) => {
            try {
                setLoading(
                    true
                );

                setError("");

                const result =
                    await getByYear(
                        year
                    );

                const data =
                    Array.isArray(
                        result.data
                    )
                        ? result.data
                        : [];

                const sorted =
                    [...data].sort(
                        (
                            a,
                            b
                        ) =>
                            new Date(
                                a.diaryDate ||
                                a.createdAt
                            ) -
                            new Date(
                                b.diaryDate ||
                                b.createdAt
                            )
                    );

                setEntries(
                    sorted
                );

                setPage(0);
            } catch (err) {
                setError(
                    err.message
                );

                setEntries(
                    []
                );
            } finally {
                setLoading(
                    false
                );
            }
        };

    /* =========================
       EFFECTS
    ========================= */

    useEffect(() => {
        loadYears();
    }, []);

    useEffect(() => {
        if (!opened) {
            return;
        }

        loadEntries(
            selectedYear
        );
    }, [
        opened,
        selectedYear,
    ]);

    /* =========================
       REFRESH
    ========================= */

    const refresh =
        async () => {
            await Promise.all([
                loadYears(),

                loadEntries(
                    selectedYear
                ),
            ]);

            setEditor(null);
        };

    /* =========================
       DELETE
    ========================= */

    const handleDelete =
        async (
            entry
        ) => {
            const confirmed =
                window.confirm(
                    `Xóa "${entry.title ||
                    "trang nhật ký này"
                    }"?`
                );

            if (
                !confirmed
            ) {
                return;
            }

            try {
                await deleteDiary(
                    entry._id
                );

                await refresh();
            } catch (err) {
                window.alert(
                    err.message
                );
            }
        };

    /* =========================
       RENDER
    ========================= */

    return (
        <div className="diary-page">
            <RoomBackground />

            {/* BACK */}

            {onBack && (
                <button
                    type="button"
                    className="diary-back"
                    onClick={
                        onBack
                    }
                >
                    <span>
                        ←
                    </span>

                    <small>
                        TRỞ VỀ
                    </small>

                    Chương trước
                </button>
            )}

            {/* INTRO */}

            {!opened ? (
                <IntroBook
                    onOpen={() =>
                        setOpened(
                            true
                        )
                    }
                />
            ) : (
                <main
                    ref={libraryRef}
                    className="diary-library"
                    style={{
                        transform: `scale(${fitScale})`,
                        transformOrigin:
                            "top center",
                    }}
                >
                    {/* HEADER */}

                    <header className="library-header">
                        <span>
                            ✦ CHƯƠNG II
                            ✦
                        </span>

                        <h1>
                            Nhật ký{" "}
                            <em>
                                của
                                chúng
                                mình
                            </em>
                        </h1>

                        <p>
                            Những ngày
                            tháng mà
                            hai đứa
                            muốn giữ
                            lại thật
                            lâu.
                        </p>
                    </header>

                    {/* TIMELINE */}

                    <YearSelector
                        years={
                            years
                        }
                        selectedYear={
                            selectedYear
                        }
                        onChange={(
                            year
                        ) => {
                            setSelectedYear(
                                year
                            );

                            setPage(
                                0
                            );
                        }}
                    />

                    {/* STATS */}

                    {!loading &&
                        !error && (
                            <YearStats
                                entries={
                                    entries
                                }
                                year={
                                    selectedYear
                                }
                            />
                        )}

                    {/* WRITE */}

                    <button
                        type="button"
                        className="write-new-page"
                        onClick={() =>
                            setEditor(
                                {}
                            )
                        }
                    >
                        <span>
                            ＋
                        </span>

                        <div>
                            <small>
                                THÊM MỘT
                                KỶ NIỆM
                            </small>
                        </div>

                        <i>
                            ♡
                        </i>
                    </button>

                    {/* LOADING */}

                    {loading ? (
                        <div className="diary-loading">
                            <div className="loading-star">
                                ✦
                            </div>

                            <p>
                                Đang mở
                                những
                                trang
                                của{" "}
                                {
                                    selectedYear
                                }
                                ...
                            </p>

                            <span>
                                Những
                                câu
                                chuyện
                                cũ đang
                                được
                                tìm lại.
                            </span>
                        </div>
                    ) : error ? (
                        <div className="diary-loading error">
                            <span>
                                ☾
                            </span>

                            <p>
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    loadEntries(
                                        selectedYear
                                    )
                                }
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        <DiaryBook
                            entries={
                                entries
                            }
                            year={
                                selectedYear
                            }
                            page={
                                page
                            }
                            setPage={
                                setPage
                            }
                            onWrite={() =>
                                setEditor(
                                    {}
                                )
                            }
                            onEdit={(
                                entry
                            ) =>
                                setEditor(
                                    entry
                                )
                            }
                            onDelete={
                                handleDelete
                            }
                        />
                    )}

                    {/* BOTTOM QUOTE */}

                    {!loading &&
                        !error && (
                            <footer className="library-ending">
                                <span>
                                    ✦
                                </span>

                                <p>
                                    Chúng
                                    mình
                                    không
                                    cần
                                    nhớ
                                    tất
                                    cả.
                                    <br />
                                    Chỉ
                                    cần
                                    nơi
                                    này
                                    nhớ
                                    giúp.
                                </p>

                                <span>
                                    ♡
                                </span>
                            </footer>
                        )}
                </main>
            )}

            {/* EDITOR */}

            {editor !==
                null && (
                    <DiaryEditor
                        initial={
                            editor?._id
                                ? editor
                                : null
                        }
                        selectedYear={
                            selectedYear
                        }
                        onClose={() =>
                            setEditor(
                                null
                            )
                        }
                        onSaved={
                            refresh
                        }
                    />
                )}
        </div>
    );
}
