import React, { useState } from "react";
import { ethers } from "ethers";

function App() {
  const [username, setUsername] = useState("");
  const [walletData, setWalletData] = useState([]);
  const [bnbBalances, setBnbBalances] = useState({});
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("");

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

  const getBNBBalance = async (walletAddress) => {
    const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545");
    try {
      const balance = await provider.getBalance(walletAddress);
      const formatted = ethers.formatEther(balance);
      setBnbBalances((prev) => ({
        ...prev,
        [walletAddress]: formatted,
      }));
      console.log(`BNB for ${walletAddress}: ${formatted}`);
    } catch (err) {
      console.error("Error fetching BNB balance:", err);
      setBnbBalances((prev) => ({
        ...prev,
        [walletAddress]: "Error",
      }));
    }
  };

  const sendBNB = async (privateKey) => {
  if (!receiverAddress || !amount) {
    alert("Please enter receiver address and amount.");
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545");
    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = await wallet.sendTransaction({
      to: receiverAddress,
      value: ethers.parseEther(amount),
    });

    await tx.wait();

    alert(`✅ BNB sent successfully!\nTransaction Hash: ${tx.hash}`);
    // Optional: Update balance again
    getBNBBalance(wallet.address);
  } catch (error) {
    console.error("❌ Error sending BNB:", error);
    alert("❌ Transaction failed: " + error.message);
  }
};


  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>🦊 User Wallets (BNB Testnet)</h1>

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
            <div
              key={index}
              style={{
                marginBottom: "20px",
                border: "1px solid gray",
                padding: "10px",
              }}
            >
              <p>
                <strong>Address:</strong> {wallet.address}
              </p>
              <p>
                <strong>Private Key:</strong> {wallet.privateKey}
              </p>
              <p>
                <strong>Mnemonic:</strong> {wallet.mnemonic}
              </p>

              <button onClick={() => getBNBBalance(wallet.address)}>
                Show BNB Balance
              </button>

              {bnbBalances.hasOwnProperty(wallet.address) && (
                <p>
                  <strong>BNB Balance:</strong> {bnbBalances[wallet.address]} BNB
                </p>
              )}

              <hr />
              <h4>Send BNB from this wallet</h4>
              <input
                type="text"
                placeholder="Receiver Address"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                style={{ padding: "6px", width: "300px", marginBottom: "6px" }}
              />
              <br />
              <input
                type="text"
                placeholder="Amount in BNB"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ padding: "6px", width: "150px", marginBottom: "6px" }}
              />
              <br />
              <button onClick={() => sendBNB(wallet.privateKey)}>Send BNB</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
