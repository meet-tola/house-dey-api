// In-memory storage for admin users 
const adminUsers = [
    {
      id: 1,
      username: "admin",
      email: "admin@housedey.com.ng",
      password: "password123",
      role: "ADMIN",
    },
  ];
  
  // Function to find an admin by email
  export const findAdminByEmail = (email) => {
    return adminUsers.find((user) => user.email === email);
  };
  
  // Function to find an admin by ID
  export const findAdminById = (id) => {
    return adminUsers.find((user) => user.id === id);
  };
  