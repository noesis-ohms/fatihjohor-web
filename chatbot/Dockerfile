# Build context: the repository root (so the site's HTML can become the bot's knowledge).
FROM node:22-alpine
WORKDIR /app/chatbot
COPY chatbot/package.json chatbot/package-lock.json ./
RUN npm ci --omit=dev
COPY chatbot/*.mjs ./
COPY *.html /app/
COPY blog-kesihatan /app/blog-kesihatan
COPY booking /app/booking
COPY occupational-health /app/occupational-health
COPY panel /app/panel
RUN node build-knowledge.mjs /app knowledge.txt
ENV NODE_ENV=production PORT=8080
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
