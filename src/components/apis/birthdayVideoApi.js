import axios from "axios";

const API =
    // "http://localhost:3000/api/birthday-video";

"https://be-kn-1.onrender.com/api/birthday-video";

// =========================
// LẤY DANH SÁCH
// =========================

export const getAllBirthdayVideos = () =>
    axios.get(API);


// =========================
// VIDEO HIỆN TẠI
// =========================

export const getCurrentBirthdayVideo = () =>
    axios.get(
        `${API}/current`
    );


// =========================
// VIDEO THEO ID
// =========================

export const getBirthdayVideoById = (id) =>
    axios.get(
        `${API}/${id}`
    );


// =========================
// SIGNATURE CLOUDINARY
// =========================

export const getBirthdayUploadSignature = () =>
    axios.get(
        `${API}/upload-signature`
    );


// =========================
// LƯU THÔNG TIN VIDEO
// =========================

export const createBirthdayVideo = (data) =>
    axios.post(
        API,
        data
    );


// =========================
// UPDATE
// =========================

export const updateBirthdayVideo = (
    id,
    data
) =>
    axios.put(
        `${API}/${id}`,
        data
    );


// =========================
// DELETE
// =========================

export const deleteBirthdayVideo = (id) =>
    axios.delete(
        `${API}/${id}`
    );


// =========================
// VIEW
// =========================

export const markVideoViewed = (id) =>
    axios.patch(
        `${API}/${id}/view`
    );