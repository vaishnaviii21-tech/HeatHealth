
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files: CSS, JavaScript and images
app.use(express.static(path.join(__dirname, "public")));

// Read form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// User Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// User Login form submission (temporary navigation)
app.post("/login", (req, res) => {
  res.redirect("/city");
});

// Admin Login page
app.get("/admin-login", (req, res) => {
  res.render("admin-login");
});

// Admin Login form submission (temporary navigation)
app.post("/admin-login", (req, res) => {
  res.redirect("/city");
});

// Select City page
app.get("/city", (req, res) => {
  res.render("city", {
    selectedCity: "Pune, Maharashtra"
  });
});

// City selection form submission
app.post("/city", (req, res) => {
  const city = req.body.city || "Pune, Maharashtra";

  res.redirect(
    "/area?city=" + encodeURIComponent(city)
  );
});

// Select Area with Live Map
app.get("/area", (req, res) => {
  const selectedCity =
    req.query.city || "Pune, Maharashtra";

  const selectedArea =
    req.query.area || "Shivajinagar";

  res.render("area", {
    selectedCity: selectedCity,
    selectedArea: selectedArea
  });
});

// Map page
app.get("/map", (req, res) => {
  res.render("map");
});

// Final Analysis page
app.get("/analysis", (req, res) => {
  res.render("analysis");
});

// Start server
app.listen(PORT, () => {
  console.log(
    `Server running at http://localhost:${PORT}`
  );
});
