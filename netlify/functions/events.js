// Récupère automatiquement les événements créés sur le serveur Discord
// (onglet "Événements" du serveur). Nécessite un bot présent sur le serveur.
const API = "https://discord.com/api/v10";

exports.handler = async () => {
  const guild = process.env.DISCORD_GUILD_ID;
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!guild || !token) return json(500, { erreur: "config", events: [] });

  const res = await fetch(`${API}/guilds/${guild}/scheduled-events?with_user_count=true`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) return json(502, { erreur: "discord", events: [] });
  const bruts = await res.json();

  const events = bruts
    .filter((e) => e.status === 1 || e.status === 2) // 1 = prévu, 2 = en cours
    .sort((a, b) => new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time))
    .map((e) => ({
      id: e.id,
      nom: e.name,
      description: e.description || "",
      debut: e.scheduled_start_time, // ISO en UTC : le décompte se cale dessus
      fin: e.scheduled_end_time || null,
      enCours: e.status === 2,
      interesses: e.user_count || 0,
      image: e.image ? `https://cdn.discordapp.com/guild-events/${e.id}/${e.image}.png?size=640` : null,
      lieu: (e.entity_metadata && e.entity_metadata.location) || null,
      lien: `https://discord.com/events/${guild}/${e.id}`,
    }));

  return json(200, { events });
};

function json(code, body) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" },
    body: JSON.stringify(body),
  };
}
