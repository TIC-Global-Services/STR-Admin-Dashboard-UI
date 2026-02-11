import { supabase } from './client';

export interface User {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: {
    role: {
      name: string;
    };
  }[];
}

export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('User')
      .select(`
        id,
        email,
        isActive,
        createdAt,
        roles:UserRole(
          role:Role(
            name
          )
        )
      `)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return (data || []) as unknown as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('User')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}
