// Roles defined for a simplistic roles-based RBAC scheme
// In a real API it would be nicer to use some kind of Access Control scheme
// but for now I am simply creating roles that can be assigned to users
// with great rights given to users with the "admin" role
// Note that users with no roles are considered regular users with only basic access rights
type Role = |
  'admin';

export default Role;