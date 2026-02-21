// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Errors.sol";

contract IdentityRegistry is ERC721, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");
    
    uint256 private _nextTokenId;
    enum Tier { NONE, BRONZE, SILVER, GOLD }
    enum SubmissionStatus { PENDING, APPROVED, REJECTED }

    struct Member {
        uint256 xp;
        Tier tier;
        bool hasNFT;
    }

    struct Submission {
        uint256 id;
        address member;
        uint256 taskId;
        string proofUrl;
        SubmissionStatus status;
        uint256 timestamp;
    }

    mapping(address => Member) public members;
    mapping(uint256 => string) private _tokenURIs;
    
    Submission[] public allSubmissions;
    mapping(address => uint256[]) private memberSubmissionIds;

    uint256 public constant BRONZE_THRESHOLD = 100;
    uint256 public constant SILVER_THRESHOLD = 500;
    uint256 public constant GOLD_THRESHOLD = 1000;

    event TaskSubmitted(address indexed member, uint256 submissionId, uint256 taskId);
    event TaskValidated(uint256 submissionId, SubmissionStatus status, uint256 xpAwarded);
    
    address public constant HARDCODED_ADMIN = (process.env.NEXT_PUBLIC_ADMIN_WALLET || "").toLowerCase();

    constructor() ERC721("IdentityNFT", "IDNFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, HARDCODED_ADMIN);
        _grantRole(ADMIN_ROLE, HARDCODED_ADMIN);
    }

    function submitTask(uint256 taskId, string memory proofUrl) external {
        uint256 submissionId = allSubmissions.length;
        allSubmissions.push(Submission({
            id: submissionId,
            member: msg.sender,
            taskId: taskId,
            proofUrl: proofUrl,
            status: SubmissionStatus.PENDING,
            timestamp: block.timestamp
        }));
        memberSubmissionIds[msg.sender].push(submissionId);
        emit TaskSubmitted(msg.sender, submissionId, taskId);
    }

    function approveTask(uint256 submissionId, uint256 xpAmount) external {
        if (!hasRole(ADMIN_ROLE, msg.sender) && !hasRole(OFFICER_ROLE, msg.sender)) {
            revert Unauthorized();
        }
        
        Submission storage sub = allSubmissions[submissionId];
        require(sub.status == SubmissionStatus.PENDING, "Not pending");
        
        sub.status = SubmissionStatus.APPROVED;
        
        Member storage memberData = members[sub.member];
        memberData.xp += xpAmount;
        memberData.tier = calculateTier(memberData.xp);
        
        emit TaskValidated(submissionId, SubmissionStatus.APPROVED, xpAmount);
    }

    function calculateTier(uint256 xp) public pure returns (Tier) {
        if (xp >= GOLD_THRESHOLD) return Tier.GOLD;
        if (xp >= SILVER_THRESHOLD) return Tier.SILVER;
        if (xp >= BRONZE_THRESHOLD) return Tier.BRONZE;
        return Tier.NONE;
    }

    function getMemberSubmissions(address member) external view returns (Submission[] memory) {
        uint256[] memory ids = memberSubmissionIds[member];
        Submission[] memory results = new Submission[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            results[i] = allSubmissions[ids[i]];
        }
        return results;
    }

    function getPendingSubmissions() external view returns (Submission[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < allSubmissions.length; i++) {
            if (allSubmissions[i].status == SubmissionStatus.PENDING) count++;
        }
        Submission[] memory pending = new Submission[](count);
        uint256 index = 0;
        for (uint i = 0; i < allSubmissions.length; i++) {
            if (allSubmissions[i].status == SubmissionStatus.PENDING) {
                pending[index] = allSubmissions[i];
                index++;
            }
        }
        return pending;
    }

    function getMemberData(address member) external view returns (uint256 xp, Tier tier, bool hasNFT) {
        Member memory m = members[member];
        return (m.xp, m.tier, m.hasNFT);
    }

    function mintIdentityNFT(string memory tokenURI) external {
    Member storage m = members[msg.sender];
    
    if (m.tier == Tier.NONE) revert Ineligible();
    if (m.hasNFT) revert AlreadyMinted();

    uint256 tokenId = _nextTokenId++;
    _mint(msg.sender, tokenId);
    _tokenURIs[tokenId] = tokenURI;
    m.hasNFT = true;
}

function updateXP(address member, uint256 xpAmount) external {
    if (!hasRole(ADMIN_ROLE, msg.sender)) revert Unauthorized();
    
    Member storage m = members[member];
    m.xp += xpAmount;
    m.tier = calculateTier(m.xp);
}

function supportsInterface(bytes4 interfaceId)
    public view override(ERC721, AccessControl) returns (bool)
{
    return super.supportsInterface(interfaceId);
}
}
