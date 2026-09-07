import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { USER_ROUTES, WISHLIST_ROUTES } from "../routes";
import apiClient from "../apiClient";
import { toast } from "react-toastify";

export const useRegisterUser = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (user) => {
            const response = await apiClient.post(USER_ROUTES.REGISTER, user);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                toast.success("User registered successfully");
                queryClient.invalidateQueries({ queryKey: ["users"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Register User", error);
        }
    });

    const registerUser = async (user) => {
        try {
            return await mutation.mutateAsync(user);
        } catch {
            return undefined;
        }
    };
    return { registerUser, loading: mutation.isPending };
};

export const useLoginUser = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (user) => {
            const response = await apiClient.post(USER_ROUTES.LOGIN, user);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                toast.success("User logged in successfully");
                // On login, invalidate everything related to user
                queryClient.invalidateQueries();
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Login User", error);
        }
    });

    const loginUser = async (user) => {
        try {
            return await mutation.mutateAsync(user);
        } catch (error) {
            return { success: false, error: error.response?.data };
        }
    };
    return { loginUser, loading: mutation.isPending };
};

export const useVerifyPhone = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post(USER_ROUTES.VERIFY_PHONE, data);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                toast.success("Phone verified and logged in successfully");
                queryClient.invalidateQueries();
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Invalid OTP";
            toast.error(ErrorMessage);
            console.log("Error in Verify Phone", error);
        }
    });

    const verifyPhone = async (data) => {
        try {
            return await mutation.mutateAsync(data);
        } catch {
            return undefined;
        }
    };
    return { verifyPhone, loading: mutation.isPending };
};

export const useResendOTP = () => {
    const mutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post(USER_ROUTES.RESEND_OTP, data);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                toast.success("OTP resent successfully");
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Failed to resend OTP";
            toast.error(ErrorMessage);
            console.log("Error in Resend OTP", error);
        }
    });

    const resendOTP = async (data) => {
        try {
            return await mutation.mutateAsync(data);
        } catch {
            return undefined;
        }
    };
    return { resendOTP, loading: mutation.isPending };
};

export const useLogoutUser = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(USER_ROUTES.LOGOUT);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                toast.success("User logged out successfully");
                // Clear all queries on logout
                queryClient.clear();
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Logout User", error);
        }
    });

    const logoutUser = async () => {
        try {
            return await mutation.mutateAsync();
        } catch {
            return undefined;
        }
    };
    return { logoutUser, loading: mutation.isPending };
};

export const useGetUser = (defaultUserId = null) => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["user", defaultUserId],
        queryFn: async () => {
            const response = await apiClient.get(`${USER_ROUTES.GET_USER}/${defaultUserId}`);
            return response.data;
        },
        enabled: defaultUserId !== null
    });

    const getUser = async ({ userId }) => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["user", userId],
                queryFn: async () => {
                    const response = await apiClient.get(`${USER_ROUTES.GET_USER}/${userId}`);
                    return response.data;
                }
            });
        } catch (error) {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Get User", error);
            return undefined;
        }
    };
    return { getUser, loading, data, error };
};

export const useAddUserFromAdmin = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (userData) => {
            const response = await apiClient.post(USER_ROUTES.ADD_USER_FROM_ADMIN || "/users/add", userData);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                toast.success("User created successfully by admin");
                queryClient.invalidateQueries({ queryKey: ["users"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Failed to create user";
            toast.error(ErrorMessage);
            console.log("Error in Admin User Creation", error);
        }
    });

    const addUserFromAdmin = async (userData) => {
        try {
            return await mutation.mutateAsync(userData);
        } catch {
            return undefined;
        }
    };

    return { addUserFromAdmin, loading: mutation.isPending };
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ userId, user }) => {
            const response = await apiClient.put(`${USER_ROUTES.UPDATE_USER}/${userId}`, user, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            if (data) {
                toast.success("User updated successfully");
                queryClient.invalidateQueries({ queryKey: ["users"] });
                queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Update User", error);
        }
    });

    const updateUser = async (variables) => {
        try {
            return await mutation.mutateAsync(variables);
        } catch {
            return undefined;
        }
    };
    return { updateUser, loading: mutation.isPending };
};

export const useGetWishlist = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["wishlist"],
        queryFn: async () => {
            const response = await apiClient.get(WISHLIST_ROUTES.GET);
            return response.data;
        }
    });

    const getWishlist = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["wishlist"],
                queryFn: async () => {
                    const response = await apiClient.get(WISHLIST_ROUTES.GET);
                    return response.data;
                }
            });
        } catch (error) {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Get Wishlist", error);
            return undefined;
        }
    };

    return { getWishlist, loading, data, error };
};

export const useAddToWishlist = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (productId) => {
            const response = await apiClient.post(WISHLIST_ROUTES.ADD, { productId });
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Add Wishlist", error);
        }
    });

    const addToWishlist = async (productId) => {
        try {
            return await mutation.mutateAsync(productId);
        } catch {
            return undefined;
        }
    };

    return { addToWishlist, loading: mutation.isPending };
};

export const useRemoveFromWishlist = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async (productId) => {
            const response = await apiClient.delete(`${WISHLIST_ROUTES.REMOVE}/${productId}`);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Remove Wishlist", error);
        }
    });

    const removeFromWishlist = async (productId) => {
        try {
            return await mutation.mutateAsync(productId);
        } catch {
            return undefined;
        }
    };

    return { removeFromWishlist, loading: mutation.isPending };
};

export const useGetAllUsers = () => {
    const queryClient = useQueryClient();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const response = await apiClient.get(USER_ROUTES.GET_ALL || "/users/all");
            return response.data;
        }
    });

    const getAllUsers = async () => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["users"],
                queryFn: async () => {
                    const response = await apiClient.get(USER_ROUTES.GET_ALL || "/users/all");
                    return response.data;
                }
            });
        } catch (error) {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Get All Users", error);
            return undefined;
        }
    };

    return { getAllUsers, loading, data, error };
};
