const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";


export const rolesApi = {
  getAll: async (): Promise<Role[]> => {
    const res = await fetch(`${API_BASE_URL}/roles`, {
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch roles");
    return res.json();
  },
};
