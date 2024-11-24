// pages/api/auth/discord.js
export default async function handler(req, res) {
  const redirect_uri = `${process.env.NEXT_PUBLIC_URL}/api/auth/discord/callback`;
  const client_id = process.env.DISCORD_CLIENT_ID;
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=identify+guilds+email`;
  res.redirect(discordAuthUrl);
}
