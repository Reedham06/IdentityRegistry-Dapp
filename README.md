[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/CfIz4Kjn)
# 🌐 Assignment: Member Portal & Identity Hub

In this phase, you will build a functional frontend for the contracts you had written for the identity registry last week. You’ll turn your smart contracts into a user-facing application where members can view their progress and authorized users can manage the community.

## Deliverables of the Assignment
- The Identity Dashboard: Build a portal where users connect their wallets to view their current XP and Tier status. The UI should change based on their level (e.g., different background colors for Bronze, Silver, and Gold).
- Action and Validation:
  - Create a "Tasks" section where users can view or submit proof for specific tasks
  - Admin Side: Implement a restricted "Validation Dashboard" where the Admin or authorized Officers can see pending requests and click a button to Award XP (triggering the updateXP function).
- IPFS Integration: Use Pinata to host your NFT images and metadata.json. Your Identity NFT must correctly pull this data to display the visual representation of the user's rank
- Asset Gallery: Once a user reaches the required tier and mints their NFT, they should be able to view it in an "Asset Gallery" on your site or via a direct link to a testnet marketplace like OpenSea.

## Guidelines
- Frontend RBAC: Strictly implement Role-Based Access Control. The "Admin/Validation" dashboard must be hidden from regular users by checking the hasRole function on your contract.
- IPFS Metadata: All NFT assets (images and JSON) must be stored via Pinata. The contract's tokenURI should point to these specific IPFS CIDs.
- Error Handling: Your frontend must catch and display your Custom Errors. If a user is Ineligible(), show a clear UI notification explaining why they can't mint yet.
- (Advanced) Observability: The UI must listen for Events. When an Admin updates XP or a user upgrades their Tier, the dashboard should refresh or show a "Success" toast notification without a full page reload.
