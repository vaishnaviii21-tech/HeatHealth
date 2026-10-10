const express = require("express");
const router = express.Router();
const User = require("../models/User");
const passport = require("passport");

router.post("/signup", async (req, res) => {
try {
const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email and password are required"
        });
    }

    const existingUser = await User.findOne({
        email: email.toLowerCase().trim()
    });

    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: "Email is already registered"
        });
    }

    const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase().trim()
    });

    const registeredUser = await User.register(
        newUser,
        password
    );

    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
            id: registeredUser._id,
            name: registeredUser.name,
            email: registeredUser.email
        }
    });

} catch (error) {
    console.error("Signup error:", error.message);

    return res.status(500).json({
        success: false,
        message: "Registration failed"
    });
}


});

router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }

            return res.status(200).json({
                success: true,
                message: "Login successful",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            });
        });
    })(req, res, next);
});

//logout
// Logout API
router.post("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }

            res.clearCookie("connect.sid");

            return res.status(200).json({
                success: true,
                message: "Logout successful"
            });
        });
    });
});


// Get current logged-in user
router.get("/me", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            success: false,
            message: "You must be logged in"
        });
    }

    return res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email
        }
    });
});


module.exports = router;

