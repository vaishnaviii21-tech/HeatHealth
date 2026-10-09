const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");

module.exports = function (passport) {

    passport.use(
        new LocalStrategy(
            {
                usernameField: "email"
            },
            User.authenticate()
        )
    );

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

};