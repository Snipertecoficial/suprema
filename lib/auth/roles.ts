/**
 * Roles and Permissions Helpers
 * 
 * Determines user roles and platform access levels
 */

interface Profile {
    is_super_admin?: boolean
    role?: string
    unit_id?: string | null
}

interface Unit {
    is_platform_owner?: boolean
    slug?: string
    id?: string
}

/**
 * Check if a user is a platform admin (AION3 team)
 * 
 * Platform admins have access to all features including:
 * - Workflows
 * - Gemini/AI Configuration
 * - n8n Automations
 * - Tenant management
 */
export function getIsPlatformAdmin(
    profile?: Profile | null,
    unit?: Unit | null
): boolean {
    // Super admin flag takes precedence
    if (profile?.is_super_admin) {
        return true
    }

    // Check if user's unit is marked as platform owner
    if (unit?.is_platform_owner) {
        return true
    }

    return false
}

/**
 * Check if user is a tenant owner (can manage their own business)
 */
export function getIsTenantOwner(profile?: Profile | null): boolean {
    return profile?.role === 'owner'
}

/**
 * Check if user is an employee (limited permissions)
 */
export function getIsEmployee(profile?: Profile | null): boolean {
    return profile?.role === 'employee'
}
