export type UserRoleName = 'Admin' | 'Warehouse Manager' | 'Inventory Staff' | string;

export const ROLE_TABS: Record<string, string[]> = {
  'Admin': ['dashboard', 'assets', 'assignments', 'inventory', 'reports', 'users', 'roles', 'employees', 'departments', 'suppliers', 'about'],
  'Warehouse Manager': ['dashboard', 'assets', 'assignments', 'inventory', 'reports', 'employees', 'suppliers', 'about'],
  'Inventory Staff': ['dashboard', 'assets', 'assignments', 'inventory', 'reports', 'about']
};

export const canAccessTab = (roleName?: string, tabId?: string): boolean => {
  if (!tabId) return true;
  if (!roleName) return false;
  
  const allowedTabs = ROLE_TABS[roleName] || ROLE_TABS['Inventory Staff'];
  return allowedTabs.includes(tabId);
};

export const getTabsForRole = (roleName?: string): string[] => {
  if (!roleName) return ROLE_TABS['Inventory Staff'];
  return ROLE_TABS[roleName] || ROLE_TABS['Inventory Staff'];
};

export const canDeleteRecords = (roleName?: string): boolean => {
  return roleName === 'Admin';
};

export const canManageUsersAndRoles = (roleName?: string): boolean => {
  return roleName === 'Admin';
};

export const canManageDepartments = (roleName?: string): boolean => {
  return roleName === 'Admin';
};
