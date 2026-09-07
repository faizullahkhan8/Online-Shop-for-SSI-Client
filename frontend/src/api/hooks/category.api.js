import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient";
import { CATEGORY_ROUTES } from "../routes";
import { toast } from "react-toastify";

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (categoryData) => {
            const response = await apiClient.post(CATEGORY_ROUTES.CREATE, categoryData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Category created successfully");
                queryClient.invalidateQueries({ queryKey: ["categories"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Create Category", error);
        }
    });

    const createCategory = async (categoryData) => {
        try {
            return await mutation.mutateAsync(categoryData);
        } catch {
            return undefined;
        }
    };

    return { createCategory, loading: mutation.isPending };
};

export const useGetAllCategories = () => {
    const { data, isLoading: loading, error, refetch } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const response = await apiClient.get(CATEGORY_ROUTES.GET_ALL);
            return response.data;
        }
    });

    const getAllCategories = async () => {
        try {
            const result = await refetch();
            if (result.isError) throw result.error;
            return result.data;
        } catch (error) {
            const ErrorMessage = error?.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Get All Categories", error);
            return undefined;
        }
    };

    return { getAllCategories, loading, data, error };
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (id) => {
            const response = await apiClient.delete(CATEGORY_ROUTES.DELETE_CATEGORY + "/" + id);
            return response.data;
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Category deleted successfully");
                queryClient.invalidateQueries({ queryKey: ["categories"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Delete Category", error);
        }
    });

    const deleteCategory = async (id) => {
        try {
            return await mutation.mutateAsync(id);
        } catch {
            return undefined;
        }
    };

    return { deleteCategory, loading: mutation.isPending };
};


export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ id, categoryData }) => {
            const response = await apiClient.patch(
                CATEGORY_ROUTES.UPDATE_CATEGORY + "/" + id,
                categoryData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            return response.data;
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Category updated successfully");
                queryClient.invalidateQueries({ queryKey: ["categories"] });
            }
        },
        onError: (error) => {
            const ErrorMessage = error.response?.data?.message || "Something went wrong";
            toast.error(ErrorMessage);
            console.log("Error in Update Category", error);
        }
    });

    const updateCategory = async ({ id, categoryData }) => {
        try {
            return await mutation.mutateAsync({ id, categoryData });
        } catch {
            return undefined;
        }
    };

    return { updateCategory, loading: mutation.isPending };
};