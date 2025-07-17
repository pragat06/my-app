import React, { useState } from "react";
import { ethers } from "ethers";

function App() {
  const [username, setUsername] = useState("");
  const [walletData, setWalletData] = useState([]);

  const generateAndSaveWallet = async () => {
    if (!username) return alert("Enter a username first!");

    const wallet = ethers.Wallet.createRandom();

    const newWallet = {
      username,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
    };

    const res = await fetch("http://localhost:5000/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWallet),
    });

    const result = await res.json();
    alert(result.message);
  };

  const fetchWallets = async () => {
    if (!username) return alert("Enter a username first!");

    const res = await fetch(`http://localhost:5000/api/wallet/${username}`);
    const data = await res.json();
    setWalletData(data);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🦊 User Wallets</h1>

      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginBottom: "10px", padding: "6px" }}
      />
      <br />

      <button onClick={generateAndSaveWallet}>Generate Wallet</button>
      <button onClick={fetchWallets} style={{ marginLeft: "10px" }}>
        Fetch My Wallets
      </button>

      {walletData.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3>Wallets for: {username}</h3>
          {walletData.map((wallet, index) => (
            <div key={index} style={{ marginBottom: "20px", border: "1px solid gray", padding: "10px" }}>
              <p><strong>Address:</strong> {wallet.address}</p>
              <p><strong>Private Key:</strong> {wallet.privateKey}</p>
              <p><strong>Mnemonic:</strong> {wallet.mnemonic}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
/*

import React, { useState } from "react";
import { ethers } from "ethers";

function App() {
  const [walletData, setWalletData] = useState(null);

  const generateAndSaveWallet = async () => {
    const wallet = ethers.Wallet.createRandom();

    const newWallet = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
    };

    // Send wallet to backend
    const res = await fetch("http://localhost:5000/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWallet),
    });

    const result = await res.json();
    alert("Wallet generated and saved!");
    console.log(result);
  };

  const fetchWallet = async () => {
    const res = await fetch("http://localhost:5000/api/wallet");
    const data = await res.json();
    setWalletData(data);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🦊 Mini Wallet App</h1>
      <button onClick={generateAndSaveWallet}>Generate Wallet</button>
      <button onClick={fetchWallet} style={{ marginLeft: "10px" }}>
        Fetch Wallet
      </button>

      {walletData && (
        <div style={{ marginTop: "30px" }}>
          <p><strong>Address:</strong> {walletData.address}</p>
          <p><strong>Private Key:</strong> {walletData.privateKey}</p>
          <p><strong>Mnemonic:</strong> {walletData.mnemonic}</p>
        </div>
      )}
    </div>
  );
}

export default App;*/

