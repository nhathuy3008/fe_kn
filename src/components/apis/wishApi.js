// src/apis/wishApi.js

const API_URL =
    import.meta.env.VITE_API_URL || //"http://localhost:3000/api";
"https://be-kn.onrender.com/api";
// Tạo điều ước
export const createWish = async (message) => {
    const response = await fetch(`${API_URL}/wishes`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Không thể tạo điều ước");
    }

    return data;
};

// Lấy danh sách sao
export const getStars = async () => {
    const response = await fetch(`${API_URL}/wishes/stars`);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Không thể tải cây điều ước");
    }

    return data;
};

// Lấy nội dung một điều ước
export const getWish = async (id) => {
    const response = await fetch(`${API_URL}/wishes/${id}`);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Không thể tải điều ước");
    }

    return data;
};

// Hái / hoàn thành điều ước
export const fulfillWish = async (id) => {
    const response = await fetch(
        `${API_URL}/wishes/${id}/fulfill`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Không thể hái điều ước");
    }

    return data;
};