import { ClerkExpressRequireAuth, clerkClient } from '@clerk/clerk-sdk-node';

// Middleware to verify Clerk JWT and attach decoded user data
export const requireAuth = [
  ClerkExpressRequireAuth({}),
  async (req, res, next) => {
    try {
      if (!req.auth || !req.auth.userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      }

      // We fetch the user from Clerk to get the publicMetadata containing role and facility_id
      const user = await clerkClient.users.getUser(req.auth.userId);
      
      req.user = {
        id: user.id,
        role: user.publicMetadata?.role || 'community', // default to least privileged
        facility_id: user.publicMetadata?.facility_id || null
      };

      next();
    } catch (err) {
      console.error("Auth Middleware Error:", err);
      res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
  }
];

// Generic Role Check Middleware
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    console.log(`[requireRole] User: ${req.user?.clerkUserId}, Decoded Role: ${req.user?.role}`);
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      console.log(`[requireRole] Access Denied. Expected one of: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }
    console.log(`[requireRole] Access Granted.`);
    next();
  };
};

// Staff Context Enforcement Middleware
export const requireStaffContext = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // super_admin and admin can bypass staff context checks 
  if (['super_admin', 'admin'].includes(req.user.role)) {
    return next();
  }

  if (req.user.role === 'staff') {
    if (!req.user.facility_id) {
      return res.status(403).json({ error: 'Forbidden: Staff lacks facility context' });
    }

    // Attempt to extract the target facility/institute ID from the request body or params
    const targetFacilityId = req.body.instituteId || req.params.instituteId || req.body.facility_id;
    
    // If a target facility is being modified, ensure it matches the staff's facility_id
    if (targetFacilityId && targetFacilityId !== req.user.facility_id) {
      return res.status(403).json({ error: 'Forbidden: Facility mismatch for this operation' });
    }
  }

  next();
};
