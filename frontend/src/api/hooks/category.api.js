import { useState } from "react";
import apiClient from "../apiClient";
import { CATEGORY_ROUTES } from "../routes";
import { toast } from "react-toastify";

export const useCreateCategory = () => {
    const [loading, setLoading] = useState(false)

    const createCategory = async (categoryData) => {
        try {
            setLoading(true)
            const response = await apiClient.post(CATEGORY_ROUTES.CREATE, categoryData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })

            if (response.data.success) {
                toast.success("Category created successfully")
                return response.data
            }
        } catch (error) {
            const ErrorMessage = error.response?.data?.message || "Something went wrong"
            toast.error(ErrorMessage)
            console.log("Error in Create Category", error)
            return;
        } finally {
            setLoading(false)
        }
    }

    return { createCategory, loading }
}

export const useGetAllCategories = () => {
    const [loading, setLoading] = useState(false)

    const getAllCategories = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get(CATEGORY_ROUTES.GET_ALL)

            if (response.data.success) {
                return response.data
            }
        } catch (error) {
            const ErrorMessage = error.response?.data?.message || "Something went wrong"
            toast.error(ErrorMessage)
            console.log("Error in Get All Categories", error)
            return;
        } finally {
            setLoading(false)
        }
    }

    return { getAllCategories, loading }
}

export const useDeleteCategory = () => {
    const [loading, setLoading] = useState(false)

    const deleteCategory = async (id) => {
        try {
            setLoading(true)
            const response = await apiClient.delete(CATEGORY_ROUTES.DELETE_CATEGORY + "/" + id)

            if (response.data.success) {
                toast.success("Category deleted successfully")
                return response.data
            }
        } catch (error) {
            const ErrorMessage = error.response?.data?.message || "Something went wrong"
            toast.error(ErrorMessage)
            console.log("Error in Delete Category", error)
            return;
        } finally {
            setLoading(false)
        }
    }

    return { deleteCategory, loading }
}


export const useUpdateCategory = () => {
    const [loading, setLoading] = useState(false)

    const updateCategory = async ({ id, categoryData }) => {
        try {
            setLoading(true)
            const response = await apiClient.patch(
                CATEGORY_ROUTES.UPDATE_CATEGORY + "/" + id,
                categoryData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            )

            if (response.data.success) {
                toast.success("Category updated successfully")
                return response.data
            }
        } catch (error) {
            const ErrorMessage = error.response?.data?.message || "Something went wrong"
            toast.error(ErrorMessage)
            console.log("Error in Update Category", error)
            return;
        } finally {
            setLoading(false)
        }
    }

    return { updateCategory, loading }
}