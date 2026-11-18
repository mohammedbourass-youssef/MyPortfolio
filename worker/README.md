# Portfolio AI Worker

This Worker answers the portfolio chat from a fixed profile prompt. No secrets are committed to the repository.

## Runtime behavior

- Allows only `POST` and `OPTIONS` requests from the configured origin.
- Validates questions up to 300 characters.
- Uses a short in-memory rate limit of 10 questions per minute per connecting IP.
- Returns the CV shortcut directly from the prompt rules.
- Calls Workers AI with `AI_MODEL` or the default model.
- Falls back to a localized error reply if AI is unavailable.
- Optionally records anonymous metadata to D1 and sends one Telegram notice on AI failure.

D1 stores only outcome, detected language, message length, and timestamp. It does not store raw questions, raw IPs, or AI replies.

## Bindings and configuration

- `AI`: Cloudflare Workers AI binding. Required.
- `CHAT_DB`: D1 database binding. Optional; analytics are skipped when absent.
- `TELEGRAM_BOT_TOKEN`: Telegram bot token. Optional secret.
- `TELEGRAM_CHAT_ID`: Telegram destination chat ID. Optional secret.
- `ALLOWED_ORIGIN`: Request origin allowed by CORS. Optional; defaults to `https://mohammedbourass.me`.
- `AI_MODEL`: Workers AI model name. Optional; defaults to `@cf/meta/llama-3.1-8b-instruct`.

## Manual setup

1. Create a Cloudflare Worker and enable a Workers AI binding named `AI`.
2. Deploy this file:

```powershell
wrangler deploy worker/worker.js --name portfolio-ai
```

3. Create the optional D1 database:

```powershell
wrangler d1 create portfolio-ai
```

4. Apply the schema:

```powershell
wrangler d1 execute portfolio-ai --file=worker/schema.sql --remote
```

5. Add a D1 binding named `CHAT_DB` to the Worker in the Cloudflare dashboard using the database ID from step 3. No database ID is committed here.

6. Add optional Telegram secrets:

```powershell
wrangler secret put TELEGRAM_BOT_TOKEN --name portfolio-ai
wrangler secret put TELEGRAM_CHAT_ID --name portfolio-ai
```

7. Set `ALLOWED_ORIGIN` and `AI_MODEL` as Worker variables only if overriding the defaults.

8. If the deployed Worker URL changes, update the `API` constant in `src/components/ChatWidget.tsx`. The site builds without any Worker secrets or bindings.
