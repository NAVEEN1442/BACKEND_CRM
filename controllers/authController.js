const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
exports.register = async (req, res) => {
  const session = await User.startSession(); 
  session.startTransaction();

  try {
    const { email, password, confirmPassword, role, full_name, ...rest } = req.body;

    // 1. Field validation
    if (!email || !password || !confirmPassword || !role || !full_name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // 3. Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // 4. Validate role
    const allowedRoles = ['doctor', 'patient'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // 5. Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 6. Hash password
    const hash = await bcrypt.hash(password, 10);

    // 7. Create user inside transaction
    const user = await User.create([{ email, password_hash: hash, role, full_name }], { session });
    
    // 8. Create profile inside transaction
    if (role === 'doctor') {
      await Doctor.create([{ user_id: user[0]._id, ...rest }], { session });
    } else {
      await Patient.create([{ user_id: user[0]._id, ...rest }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    await session.abortTransaction(); // rollback all operations
    session.endSession();

    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};



exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    res.status(200).json({ token, user: { id: user._id, role: user.role, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
