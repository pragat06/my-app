// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Connect to MongoDB
mongoose.connect("mongodb+srv://pragatchari06:LRmzbYUjkpif0nhc@cluster0.ghbszlz.mongodb.net/Web3", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 📦 Wallet Schema

const walletSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // unique to prevent duplicate usernames
  password: { type: String, required: true }, // This will store the HASHED password
  address: String,
  privateKey: String,
  mnemonic: String,
});

;

const Wallet = mongoose.model("Wallet", walletSchema);

// 📨 POST: Save wallet

 app.post("/api/wallet", async (req, res) => {
  try {
    const { username, password, address, privateKey, mnemonic } = req.body;

    // 1. Check if the username already exists in the database
    const existingUser = await Wallet.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists." });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10); // Create a "salt" for the hash
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the salt
    const newWallet = new Wallet({
      username,
      password: hashedPassword, // Store the secure hash, NOT the original password
      address,
      privateKey,
      mnemonic,
    });

 await newWallet.save();

    res.status(201).json({ message: "Wallet created and saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
    
});


// 📤 GET: Fetch latest wallet
app.post("/api/wallet/fetch", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find the user by their username
    const user = await Wallet.findOne({ username });
    if (!user) {
      // If user not found, send a generic error. Don't reveal that the username was wrong.
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // 2. Compare the password the user provided with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // If passwords don't match, send the same generic error.
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // 3. If password is correct, send the wallet data.
    // We are finding all wallets for that user, though in this schema it will only be one.
    const userWallets = await Wallet.find({ username });
    
    // We create a new array to avoid sending back the hashed password
    const walletsToSend = userWallets.map(w => ({
        username: w.username,
        address: w.address,
        privateKey: w.privateKey,
        mnemonic: w.mnemonic
    }));


    res.json(walletsToSend);
  } catch (error) {
    res.status(500).json({ message: "Error fetching wallets", error });
  }
});

// 🟢 Start server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

// mongodb+srv://pragatchari06:LRmzbYUjkpif0nhc@cluster0.ghbszlz.mongodb.net/
// pragatchari06
// LRmzbYUjkpif0nhc