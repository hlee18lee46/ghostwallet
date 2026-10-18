
import { NextRequest, NextResponse } from "next/server";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createV1, mplCore } from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  publicKey,
  createNoopSigner,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { toWeb3JsTransaction } from "@metaplex-foundation/umi-web3js-adapters";
import { PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";

const RPC_URL =
  process.env.SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const walletAddress = body.walletAddress;
    const name = body.name;
    const metadataUri = body.metadataUri;

    const missingFields = [
      "walletAddress",
      "name",
      "metadataUri",
    ].filter(
      (field) =>
        typeof body[field] !== "string" ||
        !body[field].trim()
    );

    if (missingFields.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing or invalid fields: ${missingFields.join(", ")}`,
          missingFields,
        },
        { status: 400 }
      );
    }

    if (name.length > 32) {
      return NextResponse.json(
        {
          success: false,
          error: "NFT name must be 32 characters or fewer",
        },
        { status: 400 }
      );
    }

    let wallet: PublicKey;

    try {
      wallet = new PublicKey(walletAddress);

      if (!PublicKey.isOnCurve(wallet.toBytes())) {
        throw new Error("Wallet is not an on-curve signer");
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    let uri: URL;

    try {
      uri = new URL(metadataUri);

      if (uri.protocol !== "https:") {
        throw new Error("Metadata URI must use HTTPS");
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "metadataUri must be a valid HTTPS URL",
        },
        { status: 400 }
      );
    }

    const umi = createUmi(RPC_URL).use(mplCore());

    const owner = publicKey(wallet.toBase58());
    const walletSigner = createNoopSigner(owner);

    umi.use(signerIdentity(walletSigner));

    const asset = generateSigner(umi);

    const builder = createV1(umi, {
      asset,
      name: name.trim(),
      uri: uri.toString(),
      owner,
      payer: walletSigner,
    });

    const latestBlockhash =
      await umi.rpc.getLatestBlockhash();

    const transaction = builder
      .setBlockhash(latestBlockhash)
      .build(umi);

    // The new asset keypair signs here.
    // Phantom must still sign as the fee payer.
    const partiallySigned =
      await asset.signTransaction(transaction);

    const web3Transaction =
      toWeb3JsTransaction(partiallySigned);

const serialized = Buffer.from(
  web3Transaction.serialize()
).toString("base64");

    return NextResponse.json({
      success: true,
      transaction: serialized,
      assetAddress: asset.publicKey.toString(),
      network: "devnet",
      lastValidBlockHeight:
        latestBlockhash.lastValidBlockHeight,
    });
  } catch (error) {
    console.error("NFT preparation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to prepare NFT",
      },
      { status: 500 }
    );
  }
}
