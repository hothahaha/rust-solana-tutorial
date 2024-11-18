use {
    anchor_lang::{prelude::*, solana_program::program::invoke, system_program},
    anchor_spl::{associated_token, associated_token::AssociatedToken, token, token::Token},
    mpl_token_metadata::instructions as token_instruction,
};

declare_id!("FAi4ciKgwCXCaye7UaQmLgxzw9w3yLGcEUcg9abetnRV");

#[program]
pub mod mint_nft {
    use super::*;

    pub fn mint(
        ctx: Context<MintNft>,
        metadata_title: String,
        metadata_symbol: String,
        metadata_uri: String,
    ) -> Result<()> {
        msg!("Creating mint account...");
        msg!("Mint:{}", &ctx.accounts.mint.key());
        system_program::create_account(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                system_program::CreateAccount {
                    from: ctx.accounts.mint_authority.to_account_info(),
                    to: ctx.accounts.mint.to_account_info(),
                },
            ),
            10000000,
            82,
            &ctx.accounts.token_program.key(),
        )?;

        msg!("Initializing mint account...");
        msg!("Mint:{}", &ctx.accounts.mint.key());
        token::initialize_mint(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::InitializeMint {
                    mint: ctx.accounts.mint.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            0,
            &ctx.accounts.mint_authority.key(),
            Some(&ctx.accounts.mint_authority.key()),
        )?;

        msg!("Creating token account...");
        msg!("Token Address:{}", &ctx.accounts.token_account.key());
        associated_token::create(CpiContext::new(
            ctx.accounts.associated_token_program.to_account_info(),
            associated_token::Create {
                payer: ctx.accounts.mint_authority.to_account_info(),
                associated_token: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                // rent: ctx.accounts.rent.to_account_info(),
            },
        ))?;

        msg!("Minting token to token account...");
        msg!("Mint:{}", &ctx.accounts.mint.to_account_info().key());
        msg!("Token Address:{}", &ctx.accounts.token_account.key());
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            1,
        )?;

        msg!("Creating metadata account...");
        msg!(
            "Metadata account address:{}",
            &ctx.accounts.metadata.to_account_info().key()
        );
        invoke(
            &token_instruction::CreateMetadataAccountV3 {
                metadata: ctx.accounts.metadata.key(),
                mint: ctx.accounts.mint.key(),
                mint_authority: ctx.accounts.mint_authority.key(),
                payer: ctx.accounts.mint_authority.key(),
                rent: Some(ctx.accounts.rent.key()),
                system_program: ctx.accounts.system_program.key(),
                update_authority: (ctx.accounts.mint_authority.key(), true),
            }
            .instruction(token_instruction::CreateMetadataAccountV3InstructionArgs {
                data: mpl_token_metadata::types::DataV2 {
                    name: metadata_title,
                    symbol: metadata_symbol,
                    uri: metadata_uri,
                    seller_fee_basis_points: 0,
                    creators: None,
                    collection: None,
                    uses: None,
                },
                is_mutable: true,
                collection_details: None,
            }),
            &[
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.token_account.to_account_info(),
                ctx.accounts.mint_authority.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;

        msg!("Creating master edition metadata account...");
        msg!(
            "Master edition metadata address:{}",
            &ctx.accounts.master_edition.to_account_info().key()
        );
        invoke(
            &token_instruction::CreateMasterEditionV3 {
                edition: ctx.accounts.master_edition.key(),
                mint: ctx.accounts.mint.key(),
                update_authority: ctx.accounts.mint_authority.key(),
                mint_authority: ctx.accounts.mint_authority.key(),
                payer: ctx.accounts.mint_authority.key(),
                metadata: ctx.accounts.metadata.key(),
                token_program: ctx.accounts.token_program.key(),
                system_program: ctx.accounts.system_program.key(),
                rent: Some(ctx.accounts.rent.key()),
            }
            .instruction(token_instruction::CreateMasterEditionV3InstructionArgs {
                max_supply: None,
            }),
            &[
                ctx.accounts.master_edition.to_account_info(),
                ctx.accounts.metadata.to_account_info(),
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.token_account.to_account_info(),
                ctx.accounts.mint_authority.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ],
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintNft<'info> {
    /// CHECK: We're about to create this with Metaplex
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: We're about to create this with Metaplex
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    #[account(mut)]
    pub mint: Signer<'info>,
    /// CHECK: We're about to create this with Anchor
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub mint_authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,
}
