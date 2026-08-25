const API_URL =
    import.meta.env.VITE_API_URL ||
    // "http://localhost:3000/api";
"https://be-kn-1.onrender.com//api";
export const createDiary = async (data) => {
    const response = await fetch(
        `${API_URL}/diaries`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Không thể tạo nhật ký"
        );
    }

    return result;
};

export const getDiaryYears = async () => {
    const response = await fetch(
        `${API_URL}/diaries/years`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Không thể tải danh sách năm"
        );
    }

    return result;
};

export const getDiariesByYear = async (year) => {
    const response = await fetch(
        `${API_URL}/diaries/year/${year}`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Không thể tải nhật ký"
        );
    }

    return result;
};

export const getDiary = async (id) => {
    const response = await fetch(
        `${API_URL}/diaries/${id}`
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Không thể tải nhật ký"
        );
    }

    return result;
};

export const updateDiary = async (id, data) => {
    const response = await fetch(
        `${API_URL}/diaries/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Không thể cập nhật nhật ký"
        );
    }

    return result;
};

export const deleteDiary = async (id) => {
    const response = await fetch(
        `${API_URL}/diaries/${id}`,
        {
            method: "DELETE",
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Không thể xóa nhật ký"
        );
    }

    return result;
};