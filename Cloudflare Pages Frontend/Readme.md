A cloudflare Pages frontend, pulls all pokemon using pokeapi if you want to use the dropdown if not you can just search the name of a pokemon and it quaries pokemontcg.io for cards.

main.js "workerUrl" needs to be updated to your cloudflare worker url.
main.js "YOUR_API_KEY" needs to be updated to your pokemontcg.io api key
oauth.js "client_id" needs to have your google client id.
oauth.js "fetch("yourworkerurl.dev/authorize" needs to be updated to your worker url

Note: I suck at this shit, so its not very good. might even be worse then the backend...