import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient";
import { PRODUCT_ROUTES } from "../routes";
import { toast } from "react-toastify";

export const useCreateProuduct = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (product) => {
            const response = await apiClient.post(PRODUCT_ROUTES.CREATE, product, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                toast.success("Product created successfully");
                queryClient.invalidateQueries({ queryKey: ["products"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Create Product", error);
        }
    });

    const createProduct = async (product) => {
        try {
            return await mutation.mutateAsync(product);
        } catch {
            return undefined;
        }
    };

    return { createProduct, loading: mutation.isPending };
};

export const useGetAllProducts = (defaultParams = null) => {
    const queryClient = useQueryClient();

    // Declarative query (only runs automatically if defaultParams are provided)
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["products", defaultParams],
        queryFn: async () => {
            const response = await apiClient.get(defaultParams?.archived ? "/products/archived" : PRODUCT_ROUTES.GET_ALL, { params: defaultParams || {} });
            if (response.data?.products && Array.isArray(response.data.products)) {
                response.data.products = response.data.products.map(p => ({ ...p, id: p._id }));
            }
            return response.data;
        },
        enabled: defaultParams !== null,
    });

    // Imperative backwards-compatible fetch that STILL leverages React Query cache
    const getAllProducts = useCallback(async (params = {}) => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["products", params],
                queryFn: async () => {
                    const response = await apiClient.get(PRODUCT_ROUTES.GET_ALL, { params });
                    if (response.data?.products && Array.isArray(response.data.products)) {
                        response.data.products = response.data.products.map(p => ({ ...p, id: p._id }));
                    }
                    return response.data;
                }
            });
        } catch (error) {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Get All Products", error);
            return { success: false };
        }
    }, [queryClient]);

    return { getAllProducts, loading, data, error };
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ product, id }) => {
            const response = await apiClient.patch(PRODUCT_ROUTES.UPDATE_PRODUCT + "/" + id, product, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            if (data) {
                toast.success("Product updated successfully");
                if (data.product && variables?.id) {
                    queryClient.setQueryData(["products", variables.id], {
                        success: true,
                        product: { ...data.product, id: data.product._id },
                    });
                }
                queryClient.invalidateQueries({ queryKey: ["products"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in update Product", error);
        }
    });

    const updateProduct = async ({ product, id }) => {
        try {
            return await mutation.mutateAsync({ product, id });
        } catch {
            return undefined;
        }
    };

    return { updateProduct, loading: mutation.isPending };
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.delete(PRODUCT_ROUTES.DELETE_PRODUCT + "/" + id);
            return response.data;
        },
        onSuccess: (data) => {
            if (data) {
                toast.success("Product archived successfully");
                queryClient.invalidateQueries({ queryKey: ["products"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in delete Product", error);
        }
    });

    const deleteProduct = async (id) => {
        try {
            return await mutation.mutateAsync(id);
        } catch {
            return undefined;
        }
    };

    return { deleteProduct, loading: mutation.isPending };
};

export const useGetProductById = (defaultId = null) => {
    const queryClient = useQueryClient();

    // Declarative query
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ["products", defaultId],
        queryFn: async () => {
            const response = await apiClient.get(PRODUCT_ROUTES.GET_BY_ID + "/" + defaultId);
            if (response.data && response.data.product) {
                response.data.product = { ...response.data.product, id: response.data.product._id };
            }
            return response.data;
        },
        enabled: defaultId !== null,
        staleTime: 0,
        refetchOnMount: "always",
    });

    // Imperative fetch
    const getProductById = useCallback(async (id) => {
        try {
            return await queryClient.fetchQuery({
                queryKey: ["products", id],
                queryFn: async () => {
                    const response = await apiClient.get(PRODUCT_ROUTES.GET_BY_ID + "/" + id);
                    if (response.data && response.data.product) {
                        response.data.product = { ...response.data.product, id: response.data.product._id };
                    }
                    return response.data;
                }
            });
        } catch (error) {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in get Product by id", error);
            return undefined;
        }
    }, [queryClient]);

    return { getProductById, loading, data, error };
};

export const useProductForEdit = id => {
    const query = useQuery({
        queryKey: ["products", "admin-edit", id],
        queryFn: async ({ signal }) => (await apiClient.get(`/products/admin/${encodeURIComponent(id)}/edit`, { signal })).data,
        enabled: Boolean(id),
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: false,
        retry: (count, error) => count < 1 && (!error.response || error.response.status >= 500),
    });
    return {
        // Cached catalog data must never seed a new editing session.
        data: query.isFetchedAfterMount ? query.data : undefined,
        loading: Boolean(id) && (query.isPending || (!query.isFetchedAfterMount && query.isFetching)),
        error: query.error,
        refetch: query.refetch,
    };
};

export const useRestoreProduct = () => {
    const client = useQueryClient();
    const mutation = useMutation({ mutationFn: async id => (await apiClient.post(`/products/${id}/restore`)).data,
        onSuccess: () => { client.invalidateQueries({ queryKey: ["products"] }); toast.success("Product restored"); },
        onError: error => toast.error(error.response?.data?.message || "Could not restore product") });
    return { restoreProduct: id => mutation.mutateAsync(id), loading: mutation.isPending };
};

export const useCatalogProducts = params => {
    const query = useQuery({
        queryKey: ["products", "catalog", params],
        queryFn: async ({ signal }) => (await apiClient.get(PRODUCT_ROUTES.GET_ALL, {
            params, signal,
            paramsSerializer: values => {
                const search = new URLSearchParams();
                Object.entries(values).forEach(([key, value]) => (Array.isArray(value) ? value : [value]).forEach(item => search.append(key, String(item))));
                return search.toString();
            },
        })).data,
        placeholderData: previous => previous,
    });
    return { ...query, loading: query.isPending, refreshing: query.isFetching };
};
