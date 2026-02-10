const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
  console.error("❌ Error: PINATA_JWT not found in .env file");
  process.exit(1);
}

async function uploadFile(filePath) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  
  let data = new FormData();
  data.append('file', fs.createReadStream(filePath));
  
  const response = await axios.post(url, data, {
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      ...data.getHeaders()
    }
  });
  
  return response.data.IpfsHash;
}

async function uploadJSON(jsonData, fileName) {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  
  const response = await axios.post(url, {
    pinataContent: jsonData,
    pinataMetadata: {
      name: fileName
    }
  }, {
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data.IpfsHash;
}

async function main() {
  console.log("🚀 Starting IPFS upload...\n");
  
  try {
    console.log("📤 Uploading images to IPFS...");
    const bronzeCID = await uploadFile('./ipfs-assets/images/bronze.png');
    console.log("✅ Bronze image:", bronzeCID);
    
    const silverCID = await uploadFile('./ipfs-assets/images/silver.png');
    console.log("✅ Silver image:", silverCID);
    
    const goldCID = await uploadFile('./ipfs-assets/images/gold.png');
    console.log("✅ Gold image:", goldCID);
    
    console.log("\n📤 Uploading metadata to IPFS...");
    
    const bronzeMetadata = {
      name: "Bronze Identity Badge",
      description: "Entry-level community member badge - You've started your journey!",
      image: `ipfs://${bronzeCID}`,
      attributes: [
        { trait_type: "Tier", value: "Bronze" },
        { trait_type: "XP Required", value: "100" },
        { trait_type: "Rarity", value: "Common" }
      ]
    };
    
    const silverMetadata = {
      name: "Silver Identity Badge",
      description: "Intermediate community member badge - You're making progress!",
      image: `ipfs://${silverCID}`,
      attributes: [
        { trait_type: "Tier", value: "Silver" },
        { trait_type: "XP Required", value: "500" },
        { trait_type: "Rarity", value: "Uncommon" }
      ]
    };
    
    const goldMetadata = {
      name: "Gold Identity Badge",
      description: "Elite community member badge - You're a top contributor!",
      image: `ipfs://${goldCID}`,
      attributes: [
        { trait_type: "Tier", value: "Gold" },
        { trait_type: "XP Required", value: "1000" },
        { trait_type: "Rarity", value: "Rare" }
      ]
    };
    
    const bronzeMetaCID = await uploadJSON(bronzeMetadata, "bronze-metadata.json");
    console.log("✅ Bronze metadata:", bronzeMetaCID);
    
    const silverMetaCID = await uploadJSON(silverMetadata, "silver-metadata.json");
    console.log("✅ Silver metadata:", silverMetaCID);
    
    const goldMetaCID = await uploadJSON(goldMetadata, "gold-metadata.json");
    console.log("✅ Gold metadata:", goldMetaCID);
    
    const cids = {
      bronze: { 
        image: bronzeCID, 
        metadata: bronzeMetaCID,
        imageURL: `https://gateway.pinata.cloud/ipfs/${bronzeCID}`,
        metadataURL: `https://gateway.pinata.cloud/ipfs/${bronzeMetaCID}`
      },
      silver: { 
        image: silverCID, 
        metadata: silverMetaCID,
        imageURL: `https://gateway.pinata.cloud/ipfs/${silverCID}`,
        metadataURL: `https://gateway.pinata.cloud/ipfs/${silverMetaCID}`
      },
      gold: { 
        image: goldCID, 
        metadata: goldMetaCID,
        imageURL: `https://gateway.pinata.cloud/ipfs/${goldCID}`,
        metadataURL: `https://gateway.pinata.cloud/ipfs/${goldMetaCID}`
      }
    };
    
    fs.writeFileSync('./ipfs-cids.json', JSON.stringify(cids, null, 2));
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SUCCESS! All files uploaded to IPFS");
    console.log("📋 Metadata CIDs saved to ipfs-cids.json");
    console.log("=".repeat(60));
    console.log("\n📝 Metadata URIs for your frontend:\n");
    console.log("Bronze: ipfs://" + bronzeMetaCID);
    console.log("Silver: ipfs://" + silverMetaCID);
    console.log("Gold: ipfs://" + goldMetaCID);
    console.log("\n");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

main();