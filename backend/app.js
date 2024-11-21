// app.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const cookieParser = require("cookie-parser");
require("./src/config/passport");
require('dotenv').config({ path: './.env' });

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(session({ secret: "discord_secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// MongoDB-Verbindung
mongoose.connect(process.env.MONGO_URI, {useUnifiedTopology: true })
  .then(() => console.log("MongoDB verbunden"))
  .catch(err => console.error("MongoDB-Verbindungsfehler:", err));

// Authentifizierungsrouten
app.use("/auth", authRoutes);

// Routen für Benutzer (z. B. anzeigen der Benutzer)
app.use("/api", userRoutes);

// Beispiel für eine einfache GET-Route
app.get("/", (req, res) => {
  res.send("Willkommen auf der API!");  // Testnachricht oder eine Willkommensnachricht
});


app.listen(5000, () => console.log("Backend läuft auf http://localhost:5000"));
