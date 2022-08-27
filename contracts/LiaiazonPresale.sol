//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./SafeMath.sol";
import "./IERC20.sol";
import "./SafeERC20.sol";
import "./Ownable.sol";
import "./Pausable.sol";



contract LiaiazonPresale is Pausable{
    using SafeMath for uint;

    /**
    * @dev Modifier to make a function callable only when the ICO is completed.
    */
    modifier whenIcoCompleted {
        require(block.timestamp > icoEndTime, "ICO is not completed");
        _;
    }

    /**
    * @dev Modifier to make a function callable only when the ICO is not completed.
    */
    modifier whenIcoNOTCompleted {
        require(block.timestamp < icoEndTime, "ICO is completed");
        _;
    }

    modifier hasStarted() {
        require(block.timestamp > icoStartTime, "ICO has not started");
        _;
    }


    uint256 public icoStartTime;
    uint256 public icoEndTime;
    uint256 public tokenRate;
    address public LiaizonToken;
    uint256 public MaticRaised;
    uint256 public fundingGoal;
    uint256 public MaticLimit;
    bool private state=false;


    constructor(uint256 _icoStart, uint256 _icoEnd, uint256 _tokenRate, address _LiaizonToken, uint256 _fundingGoal, uint256 _MaticLimit) {
        require(_icoStart != 0 &&
                _icoEnd != 0 &&
                _icoStart < _icoEnd &&
                _tokenRate != 0 &&
                _LiaizonToken != address(0) &&
                _fundingGoal != 0
            );
        icoStartTime = _icoStart;
        icoEndTime = _icoEnd;
        tokenRate = _tokenRate;
        LiaizonToken = _LiaizonToken;
        fundingGoal = _fundingGoal;
        MaticLimit = _MaticLimit;
    }


    // constructor() {
    //     icoStartTime = ;
    //     icoEndTime = ;
    //     tokenRate = ;
    //     LiaizonToken = ;
    //     fundingGoal = ;
    // }


    function extractMatic() public whenIcoCompleted onlyOwner returns (bool){
        require(MaticRaised > 0);

        emit ICOCompleted();

        bool sent = payable(owner).send(MaticRaised);
        require(sent, "Failed to send Matic");

        emit MaticExtracted(MaticRaised);

        return true;
    }


    function buy() public payable whenNotPaused hasStarted whenIcoNOTCompleted returns (bool){
        require(MaticRaised < fundingGoal, "Funding Goal Reached");
        require(msg.value <= MaticLimit, "Maximum Amount of Matic Limit Reached");

        if (!state){
            state = true;
            emit ICOStarted();
        }
        
        uint256 MaticReceived = msg.value;

        uint256 tokensToBuy = MaticReceived.div(tokenRate);

        MaticRaised = MaticRaised.add(MaticReceived);
        require(IERC20(LiaizonToken).mint(msg.sender, tokensToBuy), "Unable to mint Token");

        emit TokensBought(msg.sender, tokensToBuy);

        return true;

    }

    
    /**
     * @dev Emitted when Matic raised from sale is transferred to owner
     */
    event MaticExtracted(uint amount);

    /**
     * @dev Emitted when tokens are bought via user
     */
    event TokensBought(address indexed account, uint tokensToBuy);

    /**
     * @dev Emitted when the ICO is started
     */
    event ICOStarted();
    
    /**
     * @dev Emitted when the ICO is started
     */
    event ICOCompleted();
}