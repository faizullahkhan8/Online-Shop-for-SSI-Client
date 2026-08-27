import { useCallback, useState } from "react";
import apiClient from "../apiClient";
import { PRODUCT_ROUTES } from "../routes";
import { toast } from "react-toastify";

export const useCreateProuduct = () => {
    const [loading, setLoading] = useState(false);

    const createProduct = async (product) => {
        setLoading(true);
        try {
            const response = await apiClient.post(
                PRODUCT_ROUTES.CREATE,
                product,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            if (response.data) {
                toast.success("Product created successfully");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Create Product", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        createProduct,
        loading,
    };
};

export const useGetAllProducts = () => {
    const [loading, setLoading] = useState(false);

    const getAllProducts = useCallback(async (params = {}) => {
        setLoading(true);
        try {
            const response = await apiClient.get(PRODUCT_ROUTES.GET_ALL, {
                params,
            });

            if (response.data) {
                if (
                    response.data.products &&
                    Array.isArray(response.data.products)
                ) {
                    response.data.products = response.data.products.map(
                        (p) => ({ ...p, id: p._id }),
                    );
                }
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Get All Products", error);
            return { success: false };
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        getAllProducts,
        loading,
    };
};

export const useUpdateProduct = () => {
    const [loading, setLoading] = useState(false);

    const updateProduct = async ({ product, id }) => {
        setLoading(true);
        console.log(product, PRODUCT_ROUTES.UPDATE_PRODUCT + "/" + id);
        try {
            const response = await apiClient.patch(
                PRODUCT_ROUTES.UPDATE_PRODUCT + "/" + id,
                product,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            if (response.data) {
                toast.success("Product updated successfully");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in update Product", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        updateProduct,
        loading,
    };
};

export const useDeleteProduct = () => {
    const [loading, setLoading] = useState(false);

    const deleteProduct = async (id) => {
        setLoading(true);
        try {
            const response = await apiClient.delete(
                PRODUCT_ROUTES.DELETE_PRODUCT + "/" + id,
            );
            if (response.data) {
                toast.success("Product deleted successfully");
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in delete Product", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        deleteProduct,
        loading,
    };
};

export const useGetProductById = () => {
    const [loading, setLoading] = useState(false);

    const getProductById = async (id) => {
        setLoading(true);
        try {
            const response = await apiClient.get(
                PRODUCT_ROUTES.GET_BY_ID + "/" + id,
            );
            if (response.data && response.data.product) {
                response.data.product = {
                    ...response.data.product,
                    id: response.data.product._id,
                };
                return response.data;
            }
        } catch (error) {
            const ErrorMessage =
                error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in get Product by id", error);
            return;
        } finally {
            setLoading(false);
        }
    };
    return {
        getProductById,
        loading,
    };
};
