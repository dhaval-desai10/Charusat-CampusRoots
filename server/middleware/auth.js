export const isAuthenticated = (req, res, next) => {
   if (req.isAuthenticated()) {
      return next();
   }
   res.status(401).json({ 
      success: false, 
      message: 'Unauthorized. Please login first.' 
   });
};
