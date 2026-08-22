import * as z from "zod";

export const loginSchema = z.object({
    email: z.string().nonempty("Email is required").email("Invalid email"),
    password: z.string().nonempty("Password is required")
})

export const registerSchema = z.object({
    name: z.string().nonempty("Name is required"),
    email: z.string().nonempty("Email is required").email("Invalid email"),
    password: z.string().nonempty("Password is required").min(6, "Password must be at least 6 characters long"),
})
