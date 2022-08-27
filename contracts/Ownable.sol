//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, a minter address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address public owner;
    address public minter;

    /**
      * @dev The Ownable constructor sets the original `owner` of the contract to the sender
      * account.
    */
    constructor() {
        owner = msg.sender;
        minter = msg.sender;
    }

    /**
      * @dev Throws if called by any account other than the owner.
      */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
      * @dev Throws if called by any account other than the minter.
      */
    modifier onlyMinter() {
        require(msg.sender == minter);
        _;
    }

    /**
    * @dev Allows the current owner to transfer control of the contract to a newOwner.
    * @param newOwner The address to transfer ownership to.
    */
    function changeOwner(address newOwner) public onlyOwner {
        if (newOwner != address(0)) {
            owner = newOwner;
        }
        emit OwnerChanged(owner);
    }

    /**
    * @dev Allows the current owner to transfer control of the minting.
    * @param newMinter The address to transfer ownership to.
    */
    function changeMinter(address newMinter) public onlyOwner {
        minter = newMinter;
        emit MinterChanged(minter);
    }

    /**
     * @dev Emitted when the owner is changed
     */
    event OwnerChanged(address indexed owner);

    /**
     * @dev Emitted when the owner is changed
     */
    event MinterChanged(address indexed minter);

}