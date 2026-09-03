export type UserRoleName = 'Admin' | 'Warehouse Manager' | 'Inventory Staff' | string;

export const ROLE_TABS: Record<string, string[]> = {
  'Admin': ['dashboard', 'assets', 'inventory', 'reports', 'users', 'roles', 'employees', 'departments', 'suppliers'],
  'Warehouse Manager': ['dashboard', 'assets', 'inventory', 'reports', 'employees', 'suppliers'],
  'Inventory Staff': ['dashboard', 'assets', 'inventory', 'reports']
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
