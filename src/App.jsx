import { useState } from "react";

import "./App.css";

import Home from "./components/pages/Home";
import WishTree from "./components/pages/WishTree";
import Diary from "./components/pages/Diary";
import BirthdayPage from "./components/pages/BirthdayPage";
import BirthdayAdmin from "./components/pages/BirthdayAdmin";

function App() {
    const [page, setPage] = useState("home");

    const [password, setPassword] = useState("");
    const [unlocked, setUnlocked] = useState(false);
    const [error, setError] = useState("");

    const handleUnlock = () => {
        if (password === "14082006") {
            setUnlocked(true);
        } else {
            setError("Sai mật khẩu ❤️");
        }
    };

    // =========================
    // LOCK SCREEN
    // =========================
    if (!unlocked) {
        return (
            <div className="lock-screen">

                {Array.from({ length: 35 }).map((_, i) => (
                    <span
                        key={i}
                        className="lock-heart"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${12 + Math.random() * 12}s`,
                            animationDelay: `${Math.random() * 10}s`,
                            fontSize: `${12 + Math.random() * 18}px`
                        }}
                    >
                        ❤️
                    </span>
                ))}

                <div className="lock-card">

                    <h2>🔒</h2>

                    <h1>
                        Chào em 💖
                    </h1>

                    <p>
                        Mật khẩu à ??? Có lẽ em sẽ biết mật khẩu là gì...
                        <br />
                        Vì đó là ngày mà thế giới có thêm một thiên thần. 🌙✨
                    </p>

                    <input
                        type="password"
                        placeholder="Nhập mật khẩu..."
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleUnlock();
                            }
                        }}
                    />

                    {error && (
                        <p className="lock-error">
                            {error}
                        </p>
                    )}

                    <button onClick={handleUnlock}>
                        Mở Câu Chuyện ✨
                    </button>

                </div>

            </div>
        );
    }

    // =========================
    // HOME
    // =========================
    if (page === "home") {
        return (
            <Home
                onWishTree={() =>
                    setPage("wish")
                }
                onDiary={() =>
                    setPage("diary")
                }
                onBirthdayVideo={() =>
                    setPage("birthday")
                }
                onAdmin={() =>
                    setPage("admin")
                }
            />
        );
    }

    // =========================
    // CHƯƠNG I
    // =========================
    if (page === "wish") {
        return (
            <WishTree
                onBack={() =>
                    setPage("home")
                }
            />
        );
    }

    // =========================
    // CHƯƠNG II
    // =========================
    if (page === "diary") {
        return (
            <Diary
                onBack={() =>
                    setPage("home")
                }
            />
        );
    }

    // =========================
    // CHƯƠNG III
    // =========================
    if (page === "birthday") {
        return (
            <BirthdayPage
                onBack={() =>
                    setPage("home")
                }
            />
        );
    }

    // =========================
    // ADMIN VIDEO
    // =========================
    if (page === "admin") {
        return (
            <BirthdayAdmin
                onBack={() =>
                    setPage("home")
                }
            />
        );
    }

    return null;
}

export default App;