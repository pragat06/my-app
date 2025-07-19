import React, { useState } from "react";
import { ethers } from "ethers";

// ✅ ERC-20 ABI (partial)
const erc20ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
];

// ✅ Corrected Token Address (BSC Testnet)
const USDT_ADDRESS = "0x787a697324dba4ab965c58cd33c13ff5eea6295f";

function App() {
  const [username, setUsername] = useState("");
  const [walletData, setWalletData] = useState([]);
  const [bnbBalances, setBnbBalances] = useState({});
  const [usdtBalances, setUsdtBalances] = useState({});
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const provider = new ethers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545");

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

  const getBNBBalance = async (address) => {
    try {
      const balance = await provider.getBalance(address);
      setBnbBalances((prev) => ({
        ...prev,
        [address]: ethers.formatEther(balance),
      }));
    } catch {
      setBnbBalances((prev) => ({
        ...prev,
        [address]: "Error",
      }));
    }
  };

  const getTokenBalance = async (address, tokenAddress, setState) => {
    try {
      const contract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
      ]);
      const formatted = ethers.formatUnits(balance, decimals);
      setState((prev) => ({
        ...prev,
        [address]: formatted,
      }));
    } catch (err) {
      console.error(`Error fetching token balance: ${err.message}`);
      setState((prev) => ({
        ...prev,
        [address]: "Error",
      }));
    }
  };

  // ✅ UPDATED FUNCTION
  const sendBNB = async (privateKey) => {
    if (!receiverAddress || !amount) return alert("Enter address and amount.");
    
    setIsSending(true);
    try {
      const wallet = new ethers.Wallet(privateKey, provider);
      const tx = await wallet.sendTransaction({
        to: receiverAddress,
        value: ethers.parseEther(amount),
      });
      await tx.wait(); 
      setSuccessMessage(tx.hash);
      setTimeout(() => setSuccessMessage(""), 5000); 

      // ✅ NEW: Refresh the BNB balance after sending
      getBNBBalance(wallet.address);

    } catch (err) {
      alert("BNB Tx Failed: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // ✅ UPDATED FUNCTION
  const sendToken = async (privateKey, tokenAddress) => {
    if (!receiverAddress || !amount) return alert("Enter address and amount.");

    setIsSending(true);
    try {
      const wallet = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(tokenAddress, erc20ABI, wallet);
      const decimals = await contract.decimals();
      const tx = await contract.transfer(receiverAddress, ethers.parseUnits(amount, decimals));
      await tx.wait(); 
      setSuccessMessage(tx.hash);
      setTimeout(() => setSuccessMessage(""), 5000);

      // ✅ NEW: Refresh the token balance after sending
      getTokenBalance(wallet.address, tokenAddress, setUsdtBalances);

    } catch (err) {
      console.error(err);
      alert("Token Tx Failed. Check the console (F12) for details.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial", padding: "30px", backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '16px 30px',
          borderRadius: '10px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
          zIndex: 1000,
          textAlign: 'center',
          fontSize: '16px'
        }}>
          <p style={{ margin: 0, padding: 0, fontWeight: 'bold' }}>✅ Transaction Confirmed!</p>
          <p style={{ margin: '8px 0 0 0', padding: 0, fontSize: '14px', opacity: 0.9 }}>
            Hash: <a href={`https://testnet.bscscan.com/tx/${successMessage}`} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>
              {`${successMessage.substring(0, 10)}...${successMessage.substring(successMessage.length - 10)}`}
            </a>
          </p>
        </div>
      )}
      
      <h1 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>
        🌐 Web3 Wallet (BNB & USDT - BSC Testnet)
      </h1>
      
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: "10px",
            width: "250px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginRight: "10px",
          }}
        />
        <button
          onClick={generateAndSaveWallet}
          style={{ padding: "10px 15px", borderRadius: "8px", backgroundColor: "#28a745", color: "#fff", border: "none" }}
        >
          Generate Wallet
        </button>
        <button
          onClick={fetchWallets}
          style={{
            padding: "10px 15px",
            marginLeft: "10px",
            borderRadius: "8px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
          }}
        >
          Fetch My Wallets
        </button>
      </div>

      {walletData.length > 0 && (
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ textAlign: "center", color: "#444" }}>Wallets for: {username}</h3>
          {walletData.map((wallet, index) => (
            <div
              key={index}
              style={{
                margin: "20px auto",
                width: "90%",
                maxWidth: "600px",
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                padding: "20px",
              }}
            >
              <p><strong>Address:</strong> {wallet.address}</p>
              <p><strong>Private Key:</strong> {wallet.privateKey}</p>

              <div style={{ marginBottom: "10px" }}>
                <button onClick={() => getBNBBalance(wallet.address)}>Show BNB Balance</button>
                {bnbBalances[wallet.address] && (
                  <p><strong>BNB:</strong> {bnbBalances[wallet.address]} BNB</p>
                )}
              </div>

              <div style={{ marginBottom: "10px" }}>
                <button onClick={() => getTokenBalance(wallet.address, USDT_ADDRESS, setUsdtBalances)}>
                  Show USDT Balance
                </button>
                {usdtBalances[wallet.address] && (
                  <p><strong>USDT:</strong> {usdtBalances[wallet.address]}</p>
                )}
              </div>

              <hr />
              <h4>Transfer</h4>
              <input
                type="text"
                placeholder="Receiver Address"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                style={{
                  padding: "8px",
                  marginBottom: "5px",
                  width: "100%",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <br />
              <input
                type="text"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  padding: "8px",
                  marginBottom: "10px",
                  width: "60%",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                }}
              />
              <br />
              <button onClick={() => sendBNB(wallet.privateKey)} disabled={isSending} style={{ marginRight: "5px" }}>
                {isSending ? "Sending..." : "Send BNB"}
              </button>
              <button onClick={() => sendToken(wallet.privateKey, USDT_ADDRESS)} disabled={isSending} style={{ marginRight: "5px" }}>
                {isSending ? "Sending..." : "Send USDT"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;