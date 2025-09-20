// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

struct Content {
    string contractAddress;
    string action;
    Payload data;
}

enum SQoSType {
    Reveal,
    Challenge,
    Threshold,
    Priority,
    ExceptionRollback,
    Anonymous,
    Identity,
    Isolation,
    CrossVerify
}

struct SQoS {
    SQoSType t;
    string v;
}

struct Session {
    // 0: request message
    // > 0: response message
    uint256 id;
    bytes callback;
}

struct ISentMessage {
    string toChain;     // destination chain name
    SQoS[] sqos;
    Content content;      // message content
    Session session;
}

struct IReceivedMessage {
    uint256 id;         // message id
    string fromChain;   // source chain name
    string sender;      // message sender
    string signer;
    SQoS[] sqos;
    address contractAddress;      // message content
    bytes4 action;
    Payload data;
    Session session;
    uint256 errorCode;  // it will be 0 if no error occurs
}

struct SentMessage {
    uint256 id;         // message id
    string fromChain;   // source chain name
    string toChain;     // destination chain name
    address sender;     // message sender
    address signer;     // message signer
    SQoS[] sqos;
    Content content;      // message content
    Session session;
}

struct ReceivedMessage {
    uint256 id;         // message id
    string fromChain;   // source chain name
    string sender;      // message sender
    string signer;
    SQoS[] sqos;
    address contractAddress;      // message content
    bytes4 action;
    Payload data;
    Session session;
    bool executed;      // if message has been executed
    uint256 errorCode;  // it will be 0 if no error occurs
}

// simplify message to save gas
struct SimplifiedMessage {
    uint256 id;         // message id
    string fromChain;   // source chain name
    string sender;      // message sender
    string signer;
    SQoS[] sqos;
    address contractAddress;      // message content
    bytes4 action;
    Session session;
}

struct cachedReceivedMessage {
    IReceivedMessage message;
    address porter;
}

enum MsgType {
    EvmString,
    EvmU8,
    EvmU16,
    EvmU32,
    EvmU64,
    EvmU128,
    EvmI8,
    EvmI16,
    EvmI32,
    EvmI64,
    EvmI128,
    EvmStringArray,
    EvmU8Array,
    EvmU16Array,
    EvmU32Array,
    EvmU64Array,
    EvmU128Array,
    EvmI8Array,
    EvmI16Array,
    EvmI32Array,
    EvmI64Array,
    EvmI128Array
}

struct PayloadItem {
    string name;
    MsgType msgType;
    bytes value;
}

struct Payload {
    PayloadItem[] items;
}