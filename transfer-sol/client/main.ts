import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import { readFileSync } from "fs";
import path from "path";

const lo = require("buffer-layout");

const SOLANA_NETWORK = "http://127.0.0.1:8899";

/**
 * Variables
 */

let connection: Connection;
let programKeypair: Keypair;
let programId: PublicKey;

let ringoKeypair: Keypair;
let georgeKeypair: Keypair;
let paulKeypair: Keypair;
let johnKeypair: Keypair;

/**
 * Functions
 */
function createKeypairFromFile(filePath: string): Keypair {
    return Keypair.fromSecretKey(Buffer.from(JSON.parse(readFileSync(filePath, "utf-8"))));
}

async function sendLamports(from: Keypair, to: PublicKey, amount: number) {
    let data = Buffer.alloc(8);
    lo.ns64().encode(amount, data);

    let ins = new TransactionInstruction({
        keys: [
            { pubkey: from.publicKey, isSigner: true, isWritable: false },
            { pubkey: to, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: programId,
        data: data,
    });

    await sendAndConfirmTransaction(connection, new Transaction().add(ins), [from]);
}

/**
 * Main
 */

async function main() {
    connection = new Connection(SOLANA_NETWORK, "confirmed");

    programKeypair = createKeypairFromFile(
        path.join(path.resolve(__dirname, "../_dist/program"), "program-keypair.json")
    );

    programId = programKeypair.publicKey;

    // All members
    ringoKeypair = createKeypairFromFile(__dirname + "/../accounts/ringo.json");
    georgeKeypair = createKeypairFromFile(__dirname + "/../accounts/george.json");
    paulKeypair = createKeypairFromFile(__dirname + "/../accounts/paul.json");
    johnKeypair = createKeypairFromFile(__dirname + "/../accounts/john.json");

    // await connection.confirmTransaction(
    //     await connection.requestAirdrop(paulKeypair.publicKey, LAMPORTS_PER_SOL * 1000)
    // );

    // await connection.confirmTransaction(
    //     await connection.requestAirdrop(georgeKeypair.publicKey, LAMPORTS_PER_SOL * 1000)
    // );

    // Paul sends some SOL to John.
    console.log("Paul semds some SOL to John...");
    console.log(`Paul's public key: ${paulKeypair.publicKey}`);
    console.log(`John's public key: ${johnKeypair.publicKey}`);
    await sendLamports(paulKeypair, johnKeypair.publicKey, 50000000);

    console.log("John semds some SOL to George...");
    console.log(`John's public key: ${johnKeypair.publicKey}`);
    console.log(`George's public key: ${georgeKeypair.publicKey}`);
    await sendLamports(johnKeypair, georgeKeypair.publicKey, 40000000);

    console.log("George semds some SOL to Ringo...");
    console.log(`George's public key: ${georgeKeypair.publicKey}`);
    console.log(`Ringo's public key: ${ringoKeypair.publicKey}`);
    await sendLamports(georgeKeypair, ringoKeypair.publicKey, 20000000);
}

main().then(
    () => process.exit(),
    (err) => {
        console.error(err);
        process.exit(-1);
    }
);
