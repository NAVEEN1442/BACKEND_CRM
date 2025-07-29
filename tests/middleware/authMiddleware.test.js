const jwt = require('jsonwebtoken');
const { verifyToken, isDoctor, isPatient } = require('../../middleware/authMiddleware');
const { TokenHelper } = require('../helpers/testHelpers');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('verifyToken middleware', () => {
    describe('Successful authentication', () => {
      it('should authenticate valid token and call next()', () => {
        const payload = { id: 'user123', role: 'doctor' };
        const token = TokenHelper.generateToken(payload);
        req.headers.authorization = `Bearer ${token}`;

        verifyToken(req, res, next);

        expect(req.user).toEqual(expect.objectContaining(payload));
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should handle token without Bearer prefix', () => {
        const payload = { id: 'user123', role: 'patient' };
        const token = TokenHelper.generateToken(payload);
        req.headers.authorization = token;

        verifyToken(req, res, next);

        // Should fail because it expects "Bearer token" format
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access Denied' });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Authentication failures', () => {
      it('should return 403 when no authorization header is provided', () => {
        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access Denied' });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 403 when authorization header is empty', () => {
        req.headers.authorization = '';

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access Denied' });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 403 when no token is provided after Bearer', () => {
        req.headers.authorization = 'Bearer ';

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access Denied' });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 401 when token is invalid', () => {
        req.headers.authorization = 'Bearer invalid-token';

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Token' });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 401 when token is expired', () => {
        const payload = { id: 'user123', role: 'doctor' };
        const expiredToken = TokenHelper.generateExpiredToken(payload);
        req.headers.authorization = `Bearer ${expiredToken}`;

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Token' });
        expect(next).not.toHaveBeenCalled();
      });

      it('should return 401 when token is malformed', () => {
        req.headers.authorization = 'Bearer malformed.token';

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Token' });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should handle authorization header with multiple spaces', () => {
        const payload = { id: 'user123', role: 'doctor' };
        const token = TokenHelper.generateToken(payload);
        req.headers.authorization = `Bearer   ${token}`;

        verifyToken(req, res, next);

        expect(req.user).toEqual(expect.objectContaining(payload));
        expect(next).toHaveBeenCalled();
      });

      it('should handle case-sensitive authorization header', () => {
        const payload = { id: 'user123', role: 'doctor' };
        const token = TokenHelper.generateToken(payload);
        req.headers.Authorization = `Bearer ${token}`; // Capital A

        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access Denied' });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('isDoctor middleware', () => {
    describe('Successful authorization', () => {
      it('should allow access when user is a doctor', () => {
        req.user = { id: 'doctor123', role: 'doctor' };

        isDoctor(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Authorization failures', () => {
      it('should deny access when user is not a doctor', () => {
        req.user = { id: 'patient123', role: 'patient' };

        isDoctor(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only doctors can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should deny access when user role is undefined', () => {
        req.user = { id: 'user123' };

        isDoctor(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only doctors can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should deny access when user is null', () => {
        req.user = null;

        isDoctor(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only doctors can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should deny access when user is undefined', () => {
        req.user = undefined;

        isDoctor(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only doctors can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should deny access when role is case-sensitive', () => {
        req.user = { id: 'doctor123', role: 'Doctor' }; // Capital D

        isDoctor(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only doctors can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should deny access when role has extra spaces', () => {
        req.user = { id: 'doctor123', role: ' doctor ' };

        isDoctor(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only doctors can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('isPatient middleware', () => {
    describe('Successful authorization', () => {
      it('should allow access when user is a patient', () => {
        req.user = { id: 'patient123', role: 'patient' };

        isPatient(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Authorization failures', () => {
      it('should deny access when user is not a patient', () => {
        req.user = { id: 'doctor123', role: 'doctor' };

        isPatient(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only patients can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should deny access when user role is undefined', () => {
        req.user = { id: 'user123' };

        isPatient(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only patients can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should deny access when user is null', () => {
        req.user = null;

        isPatient(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only patients can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should deny access when role is case-sensitive', () => {
        req.user = { id: 'patient123', role: 'Patient' }; // Capital P

        isPatient(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Access denied. Only patients can perform this action.'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('Middleware chain integration', () => {
    it('should work correctly when chained together', () => {
      const payload = { id: 'doctor123', role: 'doctor' };
      const token = TokenHelper.generateToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      // First middleware: verifyToken
      verifyToken(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toEqual(expect.objectContaining(payload));

      // Reset next mock
      next.mockClear();

      // Second middleware: isDoctor
      isDoctor(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail at first middleware when token is invalid', () => {
      req.headers.authorization = 'Bearer invalid-token';

      // First middleware: verifyToken
      verifyToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeNull();

      // Second middleware should not be reached, but if it were:
      next.mockClear();
      res.status.mockClear();
      res.json.mockClear();

      isDoctor(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});