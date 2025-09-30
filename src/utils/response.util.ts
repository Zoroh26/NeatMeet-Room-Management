// Utility function to format user responses
export const formatUserResponse = (user: any) => {
    if (!user) return null;
    
    return {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation
    };
};

// Format multiple users
export const formatUsersResponse = (users: any[]) => {
    if (!users || !Array.isArray(users)) return [];
    
    return users.map(user => formatUserResponse(user));
};

// Clean user object by removing unwanted fields
export const cleanUserObject = (userObject: any) => {
    if (!userObject) return null;
    
    const {
        _id,
        name,
        email,
        role,
        designation,
        ...rest
    } = userObject;
    
    return {
        id: _id,
        name,
        email,
        role,
        designation
    };
};
