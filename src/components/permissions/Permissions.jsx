const permissions = {
    admin: ["adminRoutes", "editUsers","editProperty", "deleteProperty","allPropertyList"],
    partner: ["partnerRoutes","partnerPropertyList","editProperty"],
    customer: ["userRoutes"]
};

// Function to check for an explicit match
export const canAccess = (role, action) => {
    return permissions[role] && permissions[role].some(permission => permission === action);
};
