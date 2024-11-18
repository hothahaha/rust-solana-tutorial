use anchor_lang::prelude::*;

pub mod mint;
pub mod sell;

use mint::*;
use sell::*;

declare_id!("4K6KDuXgjmryqYqaD52bxFwFshsPiNiQggTngqvQgKtu");

#[program]
pub mod sell_nft {
    use super::*;

    pub fn mint(
        ctx: Context<MintNft>,
        metadata_title: String,
        metadata_symbol: String,
        metadata_uri: String,
    ) -> Result<()> {
        mint::mint(ctx, metadata_title, metadata_symbol, metadata_uri)
    }

    pub fn sell(ctx: Context<SellNft>, sale_lamports: u64) -> Result<()> {
        sell::sell(ctx, sale_lamports)
    }
}
