import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../apiClient";

export const useTeamHero = () => useQuery({
    queryKey: ["team-hero"],
    queryFn: async () => (await apiClient.get("/staff/hero")).data.data,
});

export const useSaveTeamHero = () => {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (config) => (await apiClient.put("/staff/hero", config)).data.data,
        onSuccess: (data) => client.setQueryData(["team-hero"], data),
    });
};
