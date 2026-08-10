import { useEffect, useState } from "react";
import "./BirthdayAdmin.css";

import {
    getAllBirthdayVideos,
    createBirthdayVideo,
    deleteBirthdayVideo,
    getBirthdayUploadSignature,
} from "../apis/birthdayVideoApi";

export default function BirthdayAdmin({ onBack }) {

    const [form, setForm] = useState({
        title: "",
        description: "",
        year: new Date().getFullYear(),
        unlockAt: "",
        author: "huy",
    });

    const [video, setVideo] = useState(null);
    const [preview, setPreview] = useState("");

    const [videos, setVideos] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingList, setLoadingList] = useState(true);

    // =========================
    // LOAD VIDEO
    // =========================

    useEffect(() => {
        loadVideos();
    }, []);

    const loadVideos = async () => {
        try {

            setLoadingList(true);

            const res = await getAllBirthdayVideos();

            console.log("Birthday videos:", res.data);

            /*
                Tùy controller BE trả về dạng nào.

                Nếu BE trả:
                {
                    data: [...]
                }
            */

            if (Array.isArray(res.data)) {
                setVideos(res.data);
            }
            else if (Array.isArray(res.data.data)) {
                setVideos(res.data.data);
            }
            else if (Array.isArray(res.data.videos)) {
                setVideos(res.data.videos);
            }
            else {
                setVideos([]);
            }

        } catch (error) {

            console.error(
                "Lỗi lấy danh sách video:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Không thể lấy danh sách video"
            );

        } finally {

            setLoadingList(false);

        }
    };

    // =========================
    // CHANGE FORM
    // =========================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

    };

    // =========================
    // CHỌN VIDEO
    // =========================

    const handleVideo = (e) => {

        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        // Kiểm tra video
        if (!file.type.startsWith("video/")) {

            alert("Vui lòng chọn file video.");

            e.target.value = "";

            return;
        }

        // Ví dụ giới hạn 500MB
        const maxSize =
            500 * 1024 * 1024;

        if (file.size > maxSize) {

            alert(
                "Video không được vượt quá 500MB."
            );

            e.target.value = "";

            return;
        }

        // Xóa URL preview cũ
        if (preview) {
            URL.revokeObjectURL(preview);
        }

        setVideo(file);

        setPreview(
            URL.createObjectURL(file)
        );

    };

    // =========================
    // UPLOAD
    // =========================

    const handleSubmit = async (e) => {
    e.preventDefault();

    // =========================
    // VALIDATE
    // =========================

    if (!video) {
        alert("Vui lòng chọn video.");
        return;
    }

    if (!form.title.trim()) {
        alert("Vui lòng nhập tiêu đề.");
        return;
    }

    if (!form.unlockAt) {
        alert("Vui lòng chọn ngày mở.");
        return;
    }

    try {
        setLoading(true);

        const totalStart = performance.now();

        // =========================
        // BƯỚC 1
        // LẤY SIGNATURE
        // =========================

        console.log(
            "🔐 Đang lấy Cloudinary signature..."
        );

        const signatureStart =
            performance.now();

        const signatureResponse =
            await getBirthdayUploadSignature();

        const signatureTime =
            (
                (performance.now() -
                    signatureStart) /
                1000
            ).toFixed(2);

        console.log(
            `🔐 Signature: ${signatureTime}s`
        );

        const {
            signature,
            timestamp,
            folder,
            cloudName,
            apiKey
        } = signatureResponse.data;

        if (
            !signature ||
            !timestamp ||
            !folder ||
            !cloudName ||
            !apiKey
        ) {
            throw new Error(
                "Backend không trả đủ thông tin Cloudinary."
            );
        }

        // =========================
        // BƯỚC 2
        // CHUẨN BỊ FILE
        // =========================

        console.log(
            "📦 Video:",
            video.name
        );

        console.log(
            "📦 Dung lượng:",
            formatSize(video.size)
        );

        const cloudinaryFormData =
            new FormData();

        cloudinaryFormData.append(
            "file",
            video
        );

        cloudinaryFormData.append(
            "api_key",
            apiKey
        );

        cloudinaryFormData.append(
            "timestamp",
            timestamp
        );

        cloudinaryFormData.append(
            "signature",
            signature
        );

        cloudinaryFormData.append(
            "folder",
            folder
        );

        // =========================
        // BƯỚC 3
        // UPLOAD CLOUDINARY
        // =========================

        console.log(
            "☁️ Đang upload Cloudinary..."
        );

        const uploadStart =
            performance.now();

        const cloudinaryResponse =
            await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
                {
                    method: "POST",
                    body: cloudinaryFormData
                }
            );

        const cloudinaryData =
            await cloudinaryResponse.json();

        const uploadTime =
            (
                (performance.now() -
                    uploadStart) /
                1000
            ).toFixed(2);

        console.log(
            `☁️ Upload Cloudinary: ${uploadTime}s`
        );

        // =========================
        // CLOUDINARY ERROR
        // =========================

        if (!cloudinaryResponse.ok) {

            console.error(
                "Cloudinary error:",
                cloudinaryData
            );

            throw new Error(
                cloudinaryData?.error?.message ||
                "Upload Cloudinary thất bại."
            );
        }

        if (
            !cloudinaryData.secure_url
        ) {

            throw new Error(
                "Cloudinary không trả về URL video."
            );
        }

        console.log(
            "☁️ Cloudinary URL:",
            cloudinaryData.secure_url
        );

        console.log(
            "☁️ Public ID:",
            cloudinaryData.public_id
        );

        // =========================
        // BƯỚC 4
        // GỬI METADATA VỀ BACKEND
        // =========================

        console.log(
            "🚀 Đang lưu thông tin vào BE..."
        );

        const saveStart =
            performance.now();

        const birthdayData = {

            title:
                form.title.trim(),

            description:
                form.description.trim(),

            author:
                form.author,

            year:
                Number(form.year),

            unlockAt:
                form.unlockAt,

            videoUrl:
                cloudinaryData.secure_url,

            publicId:
                cloudinaryData.public_id,

            resourceType:
                "video"
        };

        console.log(
            "📤 Data gửi BE:",
            birthdayData
        );

        const saveResponse =
            await createBirthdayVideo(
                birthdayData
            );

        const saveTime =
            (
                (performance.now() -
                    saveStart) /
                1000
            ).toFixed(2);

        console.log(
            `💾 Lưu MongoDB: ${saveTime}s`
        );

        console.log(
            "💾 Backend response:",
            saveResponse.data
        );

        // =========================
        // TỔNG THỜI GIAN
        // =========================

        const totalTime =
            (
                (performance.now() -
                    totalStart) /
                1000
            ).toFixed(2);

        console.log(
            "================================"
        );

        console.log(
            `🎉 TỔNG THỜI GIAN: ${totalTime}s`
        );

        console.log(
            `🔐 Signature: ${signatureTime}s`
        );

        console.log(
            `☁️ Cloudinary: ${uploadTime}s`
        );

        console.log(
            `💾 Backend: ${saveTime}s`
        );

        console.log(
            "================================"
        );

        // =========================
        // THÀNH CÔNG
        // =========================

        alert(
            `🎉 Upload thành công ❤️\n\n` +
            `Thời gian: ${totalTime}s`
        );

        // =========================
        // RESET FORM
        // =========================

        setForm({
            title: "",
            description: "",
            year:
                new Date().getFullYear(),
            unlockAt: "",
            author: "huy"
        });

        // =========================
        // XÓA PREVIEW
        // =========================

        if (preview) {

            URL.revokeObjectURL(
                preview
            );
        }

        setVideo(null);

        setPreview("");

        // =========================
        // RESET INPUT FILE
        // =========================

        const input =
            document.getElementById(
                "video"
            );

        if (input) {

            input.value = "";
        }

        // =========================
        // LOAD LẠI DANH SÁCH
        // =========================

        await loadVideos();

    } catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "❌ UPLOAD ERROR:"
        );

        console.error(
            error
        );

        console.error(
            "RESPONSE:",
            error.response?.data
        );

        console.error(
            "================================"
        );

        alert(
            error.response?.data?.message ||
            error.message ||
            "Upload video thất bại."
        );

    } finally {

        setLoading(false);

    }
};

    // =========================
    // DELETE
    // =========================

    const handleDelete = async (id) => {

        if (!id) {
            return;
        }

        const confirmed =
            window.confirm(
                "Bạn có chắc muốn xóa video này không?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await deleteBirthdayVideo(id);

            alert(
                "Đã xóa video."
            );

            await loadVideos();

        } catch (error) {

            console.error(
                "Lỗi xóa video:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Xóa video thất bại."
            );

        }
    };

    // =========================
    // FORMAT DATE
    // =========================

    const formatDate = (date) => {

        if (!date) {
            return "Chưa có";
        }

        const d = new Date(date);

        if (Number.isNaN(d.getTime())) {
            return date;
        }

        return d.toLocaleDateString(
            "vi-VN"
        );

    };

    // =========================
    // FORMAT FILE SIZE
    // =========================

    const formatSize = (bytes) => {

        if (!bytes) {
            return "";
        }

        if (bytes < 1024 * 1024) {

            return (
                (bytes / 1024).toFixed(1)
                + " KB"
            );

        }

        return (
            (bytes / (1024 * 1024))
                .toFixed(1)
            + " MB"
        );

    };

    // =========================
    // RENDER
    // =========================

    return (

        <div className="birthday-admin">

            <div className="admin-card">

                {/* =====================
                    BACK
                ====================== */}

                <button
                    className="back-btn"
                    onClick={onBack}
                    type="button"
                >
                    ← Quay lại
                </button>

                {/* =====================
                    TITLE
                ====================== */}

                <h1>
                    🎂 Quản Lý Video Sinh Nhật
                </h1>

                <p>
                    Upload video chúc mừng
                    sinh nhật cho từng năm.
                </p>

                {/* =====================
                    FORM
                ====================== */}

                <form
                    onSubmit={handleSubmit}
                    className="admin-form"
                >

                    {/* VIDEO */}

                    <div className="upload-box">

                        <label
                            htmlFor="video"
                            className="upload-btn"
                        >
                            🎥 Chọn Video
                        </label>

                        <input
                            id="video"
                            type="file"
                            accept="video/*"
                            onChange={handleVideo}
                            hidden
                        />

                    </div>

                    {/* FILE NAME */}

                    {video && (

                        <div className="selected-file">

                            📹 {video.name}

                            <br />

                            <small>
                                {formatSize(
                                    video.size
                                )}
                            </small>

                        </div>

                    )}

                    {/* PREVIEW */}

                    {preview && (

                        <video
                            className="preview-video"
                            controls
                            playsInline
                        >
                            <source
                                src={preview}
                                type={
                                    video?.type ||
                                    "video/mp4"
                                }
                            />

                            Trình duyệt không hỗ trợ
                            phát video.

                        </video>

                    )}

                    {/* TITLE */}

                    <label>
                        Tiêu đề
                    </label>

                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Happy Birthday 2027 ❤️"
                    />

                    {/* DESCRIPTION */}

                    <label>
                        Mô tả
                    </label>

                    <textarea
                        rows="5"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Chúc em..."
                    />

                    {/* YEAR + DATE */}

                    <div className="row">

                        <div>

                            <label>
                                Năm
                            </label>

                            <input
                                type="number"
                                name="year"
                                value={form.year}
                                onChange={handleChange}
                                min="2020"
                                max="2100"
                            />

                        </div>

                        <div>

                            <label>
                                Ngày mở
                            </label>

                            <input
                                type="date"
                                name="unlockAt"
                                value={form.unlockAt}
                                onChange={handleChange}
                            />

                        </div>

                    </div>

                    {/* AUTHOR */}

                    <label>
                        Người tạo
                    </label>

                    <select
                        name="author"
                        value={form.author}
                        onChange={handleChange}
                    >

                        <option value="huy">
                            Huy
                        </option>

                        <option value="ngoc">
                            Ngọc
                        </option>

                    </select>

                    {/* SUBMIT */}

                    <button
                        className="submit-btn"
                        disabled={loading}
                        type="submit"
                    >

                        {loading
                            ? "⏳ Đang upload..."
                            : "❤️ Upload Video"
                        }

                    </button>

                </form>

                {/* =====================
                    LIST
                ====================== */}

                <div className="video-list">

                    <h2>
                        📹 Video Đã Upload
                    </h2>

                    {loadingList && (

                        <div className="loading-list">
                            Đang tải danh sách...
                        </div>

                    )}

                    {!loadingList &&
                        videos.length === 0 && (

                            <div className="empty-list">

                                Chưa có video nào.

                            </div>

                        )}

                    {!loadingList &&
                        videos.map((item) => (

                            <div
                                className="video-item"
                                key={item._id}
                            >

                                <div className="video-info">

                                    <h3>

                                        {item.title ||
                                            "Không có tiêu đề"
                                        }

                                    </h3>

                                    <small>

                                        📅 Mở:
                                        {" "}
                                        {formatDate(
                                            item.unlockAt
                                        )}

                                    </small>

                                    <br />

                                    <small>

                                        🎂 Năm:
                                        {" "}
                                        {item.year}

                                    </small>

                                    {item.author && (

                                        <>
                                            <br />

                                            <small>
                                                ❤️ Người tạo:
                                                {" "}
                                                {item.author}
                                            </small>
                                        </>

                                    )}

                                </div>

                                <div className="actions">

                                    <button
                                        type="button"
                                        title="Xem"
                                        onClick={() => {

                                            if (
                                                item.videoUrl
                                            ) {

                                                window.open(
                                                    item.videoUrl,
                                                    "_blank"
                                                );

                                            }

                                        }}
                                    >
                                        ▶
                                    </button>

                                    <button
                                        type="button"
                                        title="Xóa"
                                        onClick={() =>
                                            handleDelete(
                                                item._id
                                            )
                                        }
                                    >
                                        🗑
                                    </button>

                                </div>

                            </div>

                        ))}

                </div>

            </div>

        </div>
    );
}