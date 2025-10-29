import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  suiNetwork: process.env.SUI_NETWORK ?? 'mainnet',
  suiMnemonic: process.env.SUI_MNEMONIC ?? '',
};


