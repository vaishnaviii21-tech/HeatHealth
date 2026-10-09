const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");



const heatRoutes = require("./routes/heatRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
// Session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET || "heathealth-dev-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60
        }
    })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Load Passport configuration
require("./config/passport")(passport);

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(express.json());


app.use("/api", heatRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/area", (req, res) => {
    res.render("area");
});

app.get("/city", (req, res) => {
    res.render("city");
});

app.get("/map", (req, res) => {
    res.render("map");
});

app.get("/analysis", (req, res) => {
    res.render("analysis");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/admin-login", (req, res) => {
    res.render("admin-login");
});

const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();