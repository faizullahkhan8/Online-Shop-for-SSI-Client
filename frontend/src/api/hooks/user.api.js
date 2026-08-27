import { USER_ROUTES, WISHLIST_ROUTES } from "../routes";
import apiClient from "../apiClient";
import { toast } from "react-toastify";
import { useState } from "react";

export const useRegisterUser = () => {
    const [loading, setLoading] = useState(false);

    const registerUser = async (user) => {
        setLoading(true);
        try {
            const response = await apiClient.post(USER_ROUTES.REGISTER, user);

            if (response.data) {
                toast.success("User registered successfully");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Register User", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        registerUser,
        loading,
    };
};

export const useLoginUser = () => {
    const [loading, setLoading] = useState(false);

    const loginUser = async (user) => {
        setLoading(true);
        try {
            const response = await apiClient.post(USER_ROUTES.LOGIN, user);

            if (response.data) {
                toast.success("User logged in successfully");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Login User", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        loginUser,
        loading,
    };
};

export const useVerifyPhone = () => {
    const [loading, setLoading] = useState(false);

    const verifyPhone = async (data) => {
        setLoading(true);
        try {
            const response = await apiClient.post(USER_ROUTES.VERIFY_PHONE, data);

            if (response.data) {
                toast.success("Phone verified and logged in successfully");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Invalid OTP";
            toast.error(ErrorMessage);
            console.log("Error in Verify Phone", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        verifyPhone,
        loading,
    };
};

export const useLogoutUser = () => {
    const [loading, setLoading] = useState(false);

    const logoutUser = async () => {
        setLoading(true);
        try {
            const response = await apiClient.post(USER_ROUTES.LOGOUT);

            if (response.data) {
                toast.success("User logged out successfully");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Logout User", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        logoutUser,
        loading,
    };
};

export const useGetUser = () => {
    const [loading, setLoading] = useState(false);

    const getUser = async ({ userId }) => {
        setLoading(true);
        try {
            const response = await apiClient.get(
                `${USER_ROUTES.GET_USER}/${userId}`,
            );

            if (response.data) {
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Get User", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        getUser,
        loading,
    };
};

export const useAddUserFromAdmin = () => {
    const [loading, setLoading] = useState(false);

    const addUserFromAdmin = async (userData) => {
        setLoading(true);
        try {
            const response = await apiClient.post(
                USER_ROUTES.ADD_USER_FROM_ADMIN || "/users/add",
                userData,
            );

            if (response.data) {
                toast.success("User created successfully by admin");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Failed to create user";
            toast.error(ErrorMessage);
            console.log("Error in Admin User Creation", error);
            return;
        } finally {
            setLoading(false);
        }
    };

    return {
        addUserFromAdmin,
        loading,
    };
};

export const useUpdateUser = () => {
    const [loading, setLoading] = useState(false);

    const updateUser = async ({ userId, user }) => {
        setLoading(true);
        try {
            const response = await apiClient.put(
                `${USER_ROUTES.UPDATE_USER}/${userId}`,
                user,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            if (response.data) {
                toast.success("User updated successfully");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Update User", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        updateUser,
        loading,
    };
};

export const useGetWishlist = () => {
    const [loading, setLoading] = useState(false);

    const getWishlist = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(WISHLIST_ROUTES.GET);

            if (response.data) return response.data;
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Get Wishlist", error);
            return;
        } finally {
            setLoading(false);
        }
    };

    return { getWishlist, loading };
};

export const useAddToWishlist = () => {
    const [loading, setLoading] = useState(false);

    const addToWishlist = async (productId) => {
        setLoading(true);
        try {
            const response = await apiClient.post(WISHLIST_ROUTES.ADD, {
                productId,
            });

            if (response.data) return response.data;
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Add Wishlist", error);
            return;
        } finally {
            setLoading(false);
        }
    };

    return { addToWishlist, loading };
};

export const useRemoveFromWishlist = () => {
    const [loading, setLoading] = useState(false);

    const removeFromWishlist = async (productId) => {
        setLoading(true);
        try {
            const response = await apiClient.delete(
                `${WISHLIST_ROUTES.REMOVE}/${productId}`,
            );

            if (response.data) return response.data;
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Remove Wishlist", error);
            return;
        } finally {
            setLoading(false);
        }
    };

    return { removeFromWishlist, loading };
};

export const useGetAllUsers = () => {
    const [loading, setLoading] = useState(false);

    const getAllUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(
                USER_ROUTES.GET_ALL || "/users/all",
            );
            if (response.data) return response.data;
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Get All Users", error);
            return;
        } finally {
            setLoading(false);
        }
    };

    return { getAllUsers, loading };
};
