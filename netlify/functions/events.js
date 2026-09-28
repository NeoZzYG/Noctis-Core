// Ancienne fonction (events lus depuis Discord), remplacée par l'espace admin.
// Ce fichier vide remplace l'ancien sur GitHub.
export default async () => new Response(JSON.stringify({ events: [] }), { status: 410, headers: { "Content-Type": "application/json" } });
