// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SkillStreakVault {
    enum VaultStatus {
        Active,
        Completed,
        Claimed,
        Forfeited
    }

    struct Vault {
        address owner;
        uint96 stakeAmount;
        uint32 targetCheckIns;
        uint32 completedCheckIns;
        uint64 createdAt;
        uint64 deadline;
        uint64 lastCheckInAt;
        VaultStatus status;
    }

    uint256 public constant MIN_STAKE = 0.01 ether;
    uint256 public constant MIN_DURATION = 3 days;
    uint256 public constant MAX_DURATION = 30 days;
    uint256 public constant MIN_CHECK_IN_SPACING = 20 hours;

    address public immutable poolReceiver;
    uint256 public nextVaultId;
    uint256 public communityPoolBalance;

    mapping(uint256 => Vault) public vaults;

    event VaultCreated(
        uint256 indexed vaultId,
        address indexed owner,
        uint256 stakeAmount,
        uint256 targetCheckIns,
        uint256 deadline
    );
    event CheckedIn(uint256 indexed vaultId, address indexed owner, uint256 completedCheckIns);
    event VaultCompleted(uint256 indexed vaultId, address indexed owner);
    event Claimed(uint256 indexed vaultId, address indexed owner, uint256 payout);
    event VaultForfeited(uint256 indexed vaultId, address indexed owner, uint256 amount);
    event CommunityPoolWithdrawn(address indexed receiver, uint256 amount);

    error InvalidStake();
    error InvalidTargetCheckIns();
    error InvalidDuration();
    error NotVaultOwner();
    error VaultNotActive();
    error CheckInTooSoon();
    error DeadlinePassed();
    error StreakIncomplete();
    error NothingToWithdraw();

    constructor(address _poolReceiver) {
        require(_poolReceiver != address(0), "pool receiver required");
        poolReceiver = _poolReceiver;
    }

    function createVault(uint32 targetCheckIns, uint64 durationInSeconds) external payable returns (uint256 vaultId) {
        if (msg.value < MIN_STAKE) revert InvalidStake();
        if (targetCheckIns == 0 || targetCheckIns > 30) revert InvalidTargetCheckIns();
        if (durationInSeconds < MIN_DURATION || durationInSeconds > MAX_DURATION) revert InvalidDuration();

        vaultId = nextVaultId;
        nextVaultId += 1;

        vaults[vaultId] = Vault({
            owner: msg.sender,
            stakeAmount: uint96(msg.value),
            targetCheckIns: targetCheckIns,
            completedCheckIns: 0,
            createdAt: uint64(block.timestamp),
            deadline: uint64(block.timestamp + durationInSeconds),
            lastCheckInAt: 0,
            status: VaultStatus.Active
        });

        emit VaultCreated(vaultId, msg.sender, msg.value, targetCheckIns, block.timestamp + durationInSeconds);
    }

    function checkIn(uint256 vaultId) external {
        Vault storage vault = vaults[vaultId];

        if (vault.owner != msg.sender) revert NotVaultOwner();
        if (vault.status != VaultStatus.Active) revert VaultNotActive();
        if (block.timestamp > vault.deadline) revert DeadlinePassed();
        if (vault.lastCheckInAt != 0 && block.timestamp < vault.lastCheckInAt + MIN_CHECK_IN_SPACING) {
            revert CheckInTooSoon();
        }

        vault.lastCheckInAt = uint64(block.timestamp);
        vault.completedCheckIns += 1;

        emit CheckedIn(vaultId, msg.sender, vault.completedCheckIns);

        if (vault.completedCheckIns >= vault.targetCheckIns) {
            vault.status = VaultStatus.Completed;
            emit VaultCompleted(vaultId, msg.sender);
        }
    }

    function claim(uint256 vaultId) external {
        Vault storage vault = vaults[vaultId];

        if (vault.owner != msg.sender) revert NotVaultOwner();
        if (vault.status != VaultStatus.Completed) revert StreakIncomplete();

        uint256 payout = vault.stakeAmount;
        vault.stakeAmount = 0;
        vault.status = VaultStatus.Claimed;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "claim transfer failed");

        emit Claimed(vaultId, msg.sender, payout);
    }

    function forfeitExpiredVault(uint256 vaultId) external {
        Vault storage vault = vaults[vaultId];

        if (vault.status != VaultStatus.Active) revert VaultNotActive();
        if (block.timestamp <= vault.deadline) revert DeadlinePassed();

        uint256 forfeitedAmount = vault.stakeAmount;
        vault.stakeAmount = 0;
        vault.status = VaultStatus.Forfeited;
        communityPoolBalance += forfeitedAmount;

        emit VaultForfeited(vaultId, vault.owner, forfeitedAmount);
    }

    function withdrawCommunityPool() external {
        if (msg.sender != poolReceiver) revert NotVaultOwner();
        if (communityPoolBalance == 0) revert NothingToWithdraw();

        uint256 amount = communityPoolBalance;
        communityPoolBalance = 0;

        (bool success, ) = payable(poolReceiver).call{value: amount}("");
        require(success, "pool transfer failed");

        emit CommunityPoolWithdrawn(poolReceiver, amount);
    }

    function getVaultSummary(uint256 vaultId)
        external
        view
        returns (
            address owner,
            uint256 stakeAmount,
            uint256 targetCheckIns,
            uint256 completedCheckIns,
            uint256 createdAt,
            uint256 deadline,
            uint256 lastCheckInAt,
            VaultStatus status
        )
    {
        Vault memory vault = vaults[vaultId];

        return (
            vault.owner,
            vault.stakeAmount,
            vault.targetCheckIns,
            vault.completedCheckIns,
            vault.createdAt,
            vault.deadline,
            vault.lastCheckInAt,
            vault.status
        );
    }
}