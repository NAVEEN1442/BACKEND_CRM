const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ message: "Access Denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
  }
};

// Middleware to check if the user is a doctor
exports.isDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Only doctors can perform this action.",
  });
};

exports.isPatient = (req, res, next) => {
  if (req.user && req.user.role === 'patient') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Only patients can perform this action.",
  });
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Only admins can perform this action.",
  });
};

// Generic middleware to check for any role(s)
exports.hasRole = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires role(s): ${roles.join(', ')}.`,
    });
  };
};
